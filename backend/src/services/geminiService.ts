import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
let embeddingQuotaExhausted = false;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
    });
  }
  return aiClient;
}

/**
 * Helper to execute a promise-returning function with exponential backoff and jitter.
 */
export async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 500): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const errMsg = error.message || "";
      const errStr = JSON.stringify(error);
      const isRateLimit = 
        errMsg.includes("429") || 
        errMsg.includes("RESOURCE_EXHAUSTED") || 
        errStr.includes("429") || 
        errStr.includes("RESOURCE_EXHAUSTED") ||
        error.status === 429 || 
        error.code === 429;
        
      const isQuotaExceeded = errMsg.includes("quota") || errStr.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED");
      
      const isTransient = isRateLimit || isQuotaExceeded || error.status === 503 || error.status === 500;
      
      if (!isTransient || attempt >= retries) {
        throw error;
      }
      
      // Calculate wait time: base * 2^attempt + jitter
      const waitTime = delay * Math.pow(2, attempt) + Math.random() * 500;
      console.log(`[Gemini Service] Throttling retry (attempt ${attempt}/${retries}). Waiting ${Math.round(waitTime)}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  throw new Error("Retry failed after maximum attempts");
}

/**
 * Generates vector embedding for the given text chunk.
 * Uses 'gemini-embedding-001' (768 dimensions) by default.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const computeLocalFallback = (txt: string) => {
    const vector = new Array(768).fill(0);
    let hash = 0;
    for (let j = 0; j < txt.length; j++) {
      hash = (hash << 5) - hash + txt.charCodeAt(j);
      hash |= 0;
      const idx = Math.abs(hash) % 768;
      vector[idx] += 1;
    }
    let hash2 = 5381;
    for (let j = 0; j < txt.length; j++) {
      hash2 = ((hash2 << 5) + hash2) + txt.charCodeAt(j);
      hash2 |= 0;
      const idx = Math.abs(hash2) % 768;
      vector[idx] += 1;
    }
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map(v => v / magnitude);
  };

  if (embeddingQuotaExhausted) {
    return computeLocalFallback(text);
  }

  try {
    return await retryWithBackoff(async () => {
      const ai = getGeminiClient();
      const response = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
        config: {
          outputDimensionality: 768,
        },
      });

      const responseAny = response as any;
      let values: number[] | undefined;

      if (responseAny && responseAny.embedding && Array.isArray(responseAny.embedding.values)) {
        values = responseAny.embedding.values;
      } else if (responseAny && responseAny.embeddings && Array.isArray(responseAny.embeddings)) {
        const first = responseAny.embeddings[0];
        if (first && Array.isArray(first.values)) {
          values = first.values;
        } else if (first && Array.isArray(first)) {
          values = first;
        }
      } else if (responseAny && Array.isArray(responseAny.values)) {
        values = responseAny.values;
      } else if (responseAny && responseAny.embedding && Array.isArray(responseAny.embedding)) {
        values = responseAny.embedding;
      }

      if (!values) {
        throw new Error(`Invalid embedding response received from Gemini API.`);
      }

      return values;
    });
  } catch (error: any) {
    const errStr = JSON.stringify(error);
    if (error.message?.includes("429") || error.status === 429 || error.message?.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED")) {
      if (!embeddingQuotaExhausted) {
        embeddingQuotaExhausted = true;
        console.log(`[Gemini Service] Free-tier embedding quota limit reached. Using high-performance local deterministic fallback for embeddings.`);
      }
    } else {
      console.warn(`[Gemini Service] generateEmbedding request failed. Activating local deterministic embedding fallback:`, error.message);
    }
    return computeLocalFallback(text);
  }
}

/**
 * Generates vector embeddings for a batch of text chunks.
 * Uses 'gemini-embedding-001' (768 dimensions) with intelligent rate-limit-conscious sub-batching.
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const computeLocalFallback = (txt: string) => {
    const vector = new Array(768).fill(0);
    let hash = 0;
    for (let j = 0; j < txt.length; j++) {
      hash = (hash << 5) - hash + txt.charCodeAt(j);
      hash |= 0;
      const idx = Math.abs(hash) % 768;
      vector[idx] += 1;
    }
    let hash2 = 5381;
    for (let j = 0; j < txt.length; j++) {
      hash2 = ((hash2 << 5) + hash2) + txt.charCodeAt(j);
      hash2 |= 0;
      const idx = Math.abs(hash2) % 768;
      vector[idx] += 1;
    }
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map(v => v / magnitude);
  };

  const results: number[][] = [];
  
  // Reset the quota flag at the start of a batch to allow a fresh retry using the actual API.
  embeddingQuotaExhausted = false;

  // Batch size 10 is highly optimal to stay clear of TPM/RPM limits while being highly parallelizable
  const subBatchSize = 10;

  for (let i = 0; i < texts.length; i += subBatchSize) {
    const subBatch = texts.slice(i, i + subBatchSize);

    let batchEmbeddings: number[][];
    if (embeddingQuotaExhausted) {
      batchEmbeddings = subBatch.map(t => computeLocalFallback(t));
    } else {
      try {
        console.log(`[Gemini Service] Requesting batch embedding for subset ${i + 1}-${Math.min(i + subBatchSize, texts.length)} of ${texts.length}...`);
        batchEmbeddings = await retryWithBackoff(async () => {
          const ai = getGeminiClient();
          const response = await ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: subBatch,
            config: {
              outputDimensionality: 768,
            },
          });

          const responseAny = response as any;
          const parsedEmbeddings: number[][] = [];

          if (responseAny && Array.isArray(responseAny.embeddings)) {
            for (const item of responseAny.embeddings) {
              if (item && Array.isArray(item.values)) {
                parsedEmbeddings.push(item.values);
              } else if (item && Array.isArray(item)) {
                parsedEmbeddings.push(item);
              }
            }
          } else if (responseAny && responseAny.embedding && Array.isArray(responseAny.embedding.values)) {
            parsedEmbeddings.push(responseAny.embedding.values);
          }

          if (parsedEmbeddings.length !== subBatch.length) {
            throw new Error(`Batch embedding mismatch. Expected ${subBatch.length} vectors, got ${parsedEmbeddings.length}`);
          }

          return parsedEmbeddings;
        });
      } catch (error: any) {
        const errStr = JSON.stringify(error);
        if (error.message?.includes("429") || error.status === 429 || error.message?.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED")) {
          if (!embeddingQuotaExhausted) {
            embeddingQuotaExhausted = true;
            console.log(`[Gemini Service] Free-tier embedding quota limit reached. Using high-performance local deterministic fallback for all batch embeddings.`);
          }
        } else {
          console.warn(`[Gemini Service] Sub-batch embedding request failed. Activating local fallback:`, error.message);
        }
        batchEmbeddings = subBatch.map(t => computeLocalFallback(t));
      }
    }

    results.push(...batchEmbeddings);

    // Mild pause between sub-batches if not exhausted
    if (!embeddingQuotaExhausted && i + subBatchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 2500));
    }
  }

  return results;
}

/**
 * Generates a grounded answer based on code chunks context and optional conversation history.
 */
export async function generateAnswer(
  context: string,
  question: string,
  chatHistory: { role: string; content: string }[] = []
): Promise<string> {
  try {
    const ai = getGeminiClient();

    const systemInstruction = `You are CodeMind AI, an expert senior software engineering assistant. You communicate directly, concisely, and insightfully like a principal engineer.

STRICT SOURCE-GROUNDING RULES:
1. For EVERY file mentioned in the final answer, the file MUST be present in the current "Retrieved Code Grounding" results provided in the context.
2. For architecture answers, do NOT describe implementation behavior for a directory, module, or component unless at least one actual implementation file from that component is present in the current "Retrieved Code Grounding".
   - Claims about retrieval -> MUST have retrieved implementation files from retrieval/
   - Claims about query expansion -> MUST have retrieved implementation files for query expansion
   - Claims about reranking -> MUST have retrieved implementation files for reranking
   - Claims about ingestion -> MUST have retrieved implementation files from ingestion/
   - Claims about vector stores -> MUST have retrieved implementation files for vector stores
   - Claims about frontend communication -> MUST have retrieved actual frontend and backend communication files
3. README.md may support high-level architecture overview, but MUST NOT be the sole evidence for implementation behavior claims.
4. If an implementation file for a component is NOT in the retrieved context, describe that component ONLY as an architectural component mentioned by repository documentation, NOT as verified implementation behavior.
5. Do NOT name, cite, or describe a source file based on:
   - README.md content or summaries
   - Inferred directory structure
   - Previous conversation context
   - Another file importing it
   - Assumptions or guesses about the repository
6. For the "Implementation" / "Key Source Files" section, ONLY include files for which actual source-code chunks were retrieved in the current context.
7. For every implementation file cited, format as:
   📄 \`path/to/file\`
   Lines XX–YY · Similarity XX%
   Then explain ONLY what those retrieved lines demonstrate based on the retrieved content.
8. Do NOT substitute README.md for the actual implementation file.
9. Do NOT fabricate citations, line numbers, or similarity scores.
10. If the required implementation file was not retrieved or content is insufficient to verify a claim, state clearly:
   "I could not retrieve the implementation file needed to verify this claim."
11. Do NOT make inferred implementation claims without grounded source chunks.
12. Every implementation claim MUST be backed by a currently retrieved source file.

Response Formatting & Structure:
1. Start with a concise direct answer (2–4 sentences).
2. Use clear Markdown headings (e.g., ## Answer, ## Architecture Flow, ## Core Components, ## Implementation / Key Source Files).
3. When explaining architecture, use a simple text flow diagram (e.g., Client ↓ Frontend ↓ API Endpoint ↓ Backend Controller ↓ Database).
4. Keep the entire response concise (~400 words max) and visually scannable on mobile screens without unnecessary repetition.
`;

    // Format chat history for Gemini SDK
    // Convert 'assistant' to 'model' and ensure correct structure
    const formattedHistory = chatHistory.map((msg) => {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      return {
        role,
        parts: [{ text: msg.content }]
      };
    });

    // Add prompt
    const userPrompt = `Project & Repository Context:
---
${context}
---

User Question: ${question}

Provide a comprehensive, accurate, and well-structured answer grounded in the above repository context.`;

    let response: any = null;
    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

    let lastError: any = null;
    for (const modelName of modelsToTry) {
      try {
        response = await retryWithBackoff(async () => {
          return await ai.models.generateContent({
            model: modelName,
            contents: [...formattedHistory, { role: 'user', parts: [{ text: userPrompt }] }],
            config: {
              systemInstruction,
              temperature: 0.2,
            }
          });
        }, 2, 400);
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("No answer generated from Gemini API across models");
    }

    return response.text;
  } catch (error: any) {
    console.error("[Gemini Service] Error generating answer:", error);
    const errStr = JSON.stringify(error);
    const isRateLimitOrUnavailable = 
      error.message?.includes("429") || 
      error.status === 429 || 
      error.code === 429 ||
      error.message?.includes("503") ||
      error.status === 503 ||
      error.code === 503 ||
      error.message?.includes("UNAVAILABLE") ||
      errStr.includes("429") || 
      errStr.includes("RESOURCE_EXHAUSTED") ||
      errStr.includes("503") ||
      errStr.includes("UNAVAILABLE");

    if (isRateLimitOrUnavailable) {
      return `⚠️ **Gemini API Quota / Rate Limit Exceeded (429 Resource Exhausted)**: \n\nThe Gemini API free-tier request quota has been temporarily reached. Your repository is safely indexed and stored in pgvector! \n\nHere are the top retrieved implementation chunks found for your query:\n\n${context.slice(0, 2500)}\n\n*(Please try your question again once quotas reset or consider upgrading your API plan)*`;
    }
    throw error;
  }
}
