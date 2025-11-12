import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export async function authMiddleware(req, res, next) {
	try {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
		if (!token) return res.status(401).json({ message: 'Missing token' });
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(decoded.sub);
		if (!user) return res.status(401).json({ message: 'Invalid token' });
		req.user = {
			id: user._id.toString(),
			email: user.email,
			name: user.name,
			username: user.username,
			avatarUrl: user.avatarUrl
		};
		next();
	} catch (err) {
		return res.status(401).json({ message: 'Unauthorized' });
	}
}

export function signJwt(user) {
	const payload = { sub: user._id.toString(), email: user.email };
	return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}




