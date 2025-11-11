import { User } from '../models/User.js';

export async function listUsers(req, res) {
	const users = await User.find({ _id: { $ne: req.user.id } }).select('name email avatarUrl isOnline lastSeenAt');
	return res.json({ users });
}


