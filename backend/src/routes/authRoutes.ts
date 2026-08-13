import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authMiddleware, authController.getMe);

export default router;
