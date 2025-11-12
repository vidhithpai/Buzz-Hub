import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listUsers, searchUserByUsername } from '../controllers/user.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/search', searchUserByUsername);
router.get('/', listUsers);

export default router;


