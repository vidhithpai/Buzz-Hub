import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { sendMessage } from '../controllers/message.controller.js';

const router = Router();

router.use(authMiddleware);
router.post('/', sendMessage);

export default router;




