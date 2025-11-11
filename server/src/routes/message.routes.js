import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { sendMessage, markDelivered, markRead } from '../controllers/message.controller.js';

const router = Router();

router.use(authMiddleware);
router.post('/', sendMessage);
router.post('/delivered', markDelivered);
router.post('/read', markRead);

export default router;




