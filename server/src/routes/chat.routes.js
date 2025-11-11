import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listMyChats, createPrivateChat, createGroupChat, getRoomMessages } from '../controllers/chat.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listMyChats);
router.post('/private', createPrivateChat);
router.post('/group', createGroupChat);
router.get('/:roomId/messages', getRoomMessages);

export default router;




