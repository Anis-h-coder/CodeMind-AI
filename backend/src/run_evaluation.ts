import dotenv from 'dotenv';
dotenv.config();

import { executeEvaluationRun } from './services/evaluationService.ts';

async function main() {
  const projectId = '13e36bb0-cbde-409a-b56d-253779fe9689'; // openai-knowledge-retrieval project ID
  
  console.log(`Starting RAG Evaluation Run for project ${projectId}...`);
  const report = await executeEvaluationRun(projectId);
  
  console.log(`\n=============================================================`);
  console.log(`EVALUATION RUN REPORT: ${report.runId}`);
  console.log(`=============================================================`);
  console.log(`Total Questions: ${report.totalQuestions}`);
  console.log(`Completed Questions: ${report.completedQuestions}`);
  console.log(`Failed Questions: ${report.failedQuestions}`);
  console.log(`Average Overall Score: ${report.averageScore}%`);
  console.log(`Average Faithfulness: ${(report.averageFaithfulness * 100).toFixed(1)}%`);
  console.log(`Average Answer Relevance: ${(report.averageAnswerRelevance * 100).toFixed(1)}%`);
  console.log(`Average Context Relevance: ${(report.averageContextRelevance * 100).toFixed(1)}%`);
  console.log(`Average Citation Precision: ${(report.averageCitationPrecision * 100).toFixed(1)}%`);
  console.log(`Average Retrieval Recall: ${(report.averageRetrievalRecall * 100).toFixed(1)}%`);
  console.log(`Average Latency: ${report.averageTotalLatencyMs.toFixed(0)} ms`);

  console.log(`\nDetailed Results:`);
  report.results.forEach((r, i) => {
    console.log(`\nQuestion #${i+1}: "${r.question}"`);
    console.log(`Recall: ${(r.metrics.retrievalRecall * 100).toFixed(1)}%`);
    console.log(`Citation Precision: ${(r.metrics.citationPrecision * 100).toFixed(1)}%`);
    console.log(`Answer Relevance: ${(r.metrics.answerRelevance * 100).toFixed(1)}%`);
    console.log(`Faithfulness: ${(r.metrics.faithfulness * 100).toFixed(1)}%`);
    console.log(`Context Relevance: ${(r.metrics.contextRelevance * 100).toFixed(1)}%`);
    console.log(`Citations count: ${r.citations.length}`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
