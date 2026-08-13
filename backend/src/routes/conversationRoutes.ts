import { Router } from 'express';
import { projectController } from '../controllers/projectController.ts';
import { authMiddleware } from '../middleware/authMiddleware.ts';

const router = Router();

// Secure all conversation endpoints with authentication
router.use(authMiddleware);

router.get('/:conversationId/messages', projectController.listMessages);
router.delete('/:conversationId', projectController.deleteConversation);

export default router;
