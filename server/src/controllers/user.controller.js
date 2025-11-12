import { User } from '../models/User.js';

export async function listUsers(req, res) {
	const users = await User.find({ _id: { $ne: req.user.id } }).select(
		'name username email avatarUrl isOnline lastSeenAt'
	);
	const payload = users.map((user) => ({
		id: user._id,
		name: user.name,
		username: user.username,
		email: user.email,
		avatarUrl: user.avatarUrl,
		isOnline: user.isOnline,
		lastSeenAt: user.lastSeenAt
	}));
	return res.json({ users: payload });
}

export async function searchUserByUsername(req, res) {
	const { username } = req.query;
	if (!username || !String(username).trim()) {
		return res.status(400).json({ message: 'username query required' });
	}
	const normalized = String(username).trim().toLowerCase();
	const user = await User.findOne({ username: normalized }).select(
		'name username email avatarUrl isOnline lastSeenAt'
	);
	if (!user) {
		return res.status(404).json({ message: 'User not found.' });
	}
	return res.json({
		user: {
			id: user._id,
			name: user.name,
			username: user.username,
			email: user.email,
			avatarUrl: user.avatarUrl,
			isOnline: user.isOnline,
			lastSeenAt: user.lastSeenAt
		}
	});
}


