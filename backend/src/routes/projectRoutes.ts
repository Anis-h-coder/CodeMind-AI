import { Router } from 'express';
import { projectController } from '../controllers/projectController';
import { evaluationController } from '../controllers/evaluationController.ts';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Secure all project endpoints using the Auth middleware
router.use(authMiddleware);

// Routes definition
router.get('/', projectController.list);
router.get('/metrics', projectController.metrics);
router.get('/:id', projectController.get);
router.post('/', projectController.create);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.delete);

// GitHub and Codebase Explorer routes
router.post('/:projectId/github', projectController.connectGithub);
router.post('/:projectId/github/index', projectController.indexGithub);
router.get('/:projectId/repository', projectController.getRepository);
router.get('/:projectId/files', projectController.listFiles);
router.get('/:projectId/files/:fileId', projectController.getFile);
router.delete('/:projectId/files/:fileId', projectController.deleteFile);
router.delete('/:projectId/github', projectController.disconnectGithub);

// RAG and Assistant routes
router.post('/:projectId/chat', projectController.chat);
router.get('/:projectId/conversations', projectController.listConversations);

// SQL Copilot routes
router.post('/:projectId/sql/query', projectController.executeSqlQuery);
router.post('/:projectId/sql/explain', projectController.explainSqlQuery);
router.get('/:projectId/sql/history', projectController.getSqlHistory);
router.get('/:projectId/sql/schema', projectController.getSqlSchema);

// LLM Evaluation Suite routes
router.post('/:projectId/evaluations/run', evaluationController.run);
router.get('/:projectId/evaluations', evaluationController.listRuns);
router.get('/:projectId/evaluations/:runId', evaluationController.getRun);
router.get('/:projectId/evaluations/:runId/results', evaluationController.getResults);

export default router;
