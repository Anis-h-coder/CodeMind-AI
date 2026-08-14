import { getGeminiClient } from './geminiService';
import { Type } from '@google/genai';

export interface JudgeInput {
  question: string;
  retrievedContext: string;
  generatedAnswer: string;
  citations: any[];
}

export interface JudgeResult {
  faithfulness: number; // 0.0 to 1.0, or -1 for unavailable
  answerRelevance: number; // 0.0 to 1.0, or -1 for unavailable
  contextRelevance: number; // 0.0 to 1.0, or -1 for unavailable
  reasoning: string;
  error?: string;
}

/**
 * Uses Gemini as a judge to evaluate a generated response against retrieved context.
 */
export async function evaluateWithJudge(input: JudgeInput): Promise<JudgeResult> {
  const { question, retrievedContext, generatedAnswer, citations } = input;

  const evaluationPrompt = `You are an objective LLM evaluation judge. Your job is to strictly evaluate a RAG pipeline's response based only on the provided evidence.

Inputs to evaluate:
1. Question: "${question}"
2. Retrieved Context: 
"""
${retrievedContext}
"""
3. Generated Answer: 
"""
${generatedAnswer}
"""
4. Citations/Sources: ${JSON.stringify(citations)}

STRICT EVALUATION CRITERIA:
- Faithfulness (Score 0.0 to 1.0): Measure if the generated answer is strictly supported by the retrieved context. If the answer contains claims NOT present in the retrieved context (or if the context is empty/irrelevant), penalize faithfulness. A score of 1.0 means every claim in the answer is directly supported by the context. Do not allow any extrapolation or outside knowledge.
- Answer Relevance (Score 0.0 to 1.0): Measure how well the generated answer directly addresses the question. A score of 1.0 means the answer completely, directly, and specifically answers all parts of the question.
- Context Relevance (Score 0.0 to 1.0): Measure how relevant the retrieved context chunks are to the user's question. If the retrieved context is full of irrelevant code or files that do not help answer the question, penalize this score.

You must NEVER invent evidence or assume outside information. Output your evaluation in the required JSON schema format. Give a short, objective explanation for your scores in the reasoning field.`;

  const modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
  let response: any = null;
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const ai = getGeminiClient();
      response = await ai.models.generateContent({
        model: modelName,
        contents: evaluationPrompt,
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              faithfulness: {
                type: Type.NUMBER,
                description: 'Faithfulness score from 0.0 (completely unsupported) to 1.0 (fully supported by context)',
              },
              answerRelevance: {
                type: Type.NUMBER,
                description: 'Answer relevance score from 0.0 (completely irrelevant) to 1.0 (fully relevant and complete)',
              },
              contextRelevance: {
                type: Type.NUMBER,
                description: 'Context relevance score from 0.0 (entirely irrelevant) to 1.0 (highly relevant and precise context chunks)',
              },
              reasoning: {
                type: Type.STRING,
                description: 'A brief, objective paragraph explaining the reasoning behind the scores given.',
              },
            },
            required: ['faithfulness', 'answerRelevance', 'contextRelevance', 'reasoning'],
          },
        },
      });

      if (response && response.text) {
        break;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  try {
    if (!response || !response.text) {
      throw lastError || new Error('Gemini Judge returned an empty response across models.');
    }

    const parsed = JSON.parse(response.text.trim());
    return {
      faithfulness: Math.max(0, Math.min(1, parsed.faithfulness ?? 0)),
      answerRelevance: Math.max(0, Math.min(1, parsed.answerRelevance ?? 0)),
      contextRelevance: Math.max(0, Math.min(1, parsed.contextRelevance ?? 0)),
      reasoning: parsed.reasoning || 'No reasoning provided.',
    };
  } catch (err: any) {
    console.error('[Gemini Judge] Evaluation judge request failed:', err);
    return {
      faithfulness: -1,
      answerRelevance: -1,
      contextRelevance: -1,
      reasoning: `Evaluation Judge Unavailable: ${err.message || String(err)}`,
      error: err.message || String(err),
    };
  }
}
