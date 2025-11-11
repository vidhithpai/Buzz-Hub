import { User } from '../models/User.js';
import { signJwt } from '../middleware/auth.js';

export async function signup(req, res) {
	try {
		const { name, email, password } = req.body;
		if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
		const existing = await User.findOne({ email });
		if (existing) return res.status(409).json({ message: 'Email already in use' });
		const passwordHash = await User.hashPassword(password);
		const user = await User.create({ name, email, passwordHash });
		const token = signJwt(user);
		return res.status(201).json({
			token,
			user: { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
		});
	} catch (e) {
		return res.status(500).json({ message: 'Signup failed' });
	}
}

export async function login(req, res) {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
		const user = await User.findOne({ email });
		if (!user) return res.status(401).json({ message: 'Invalid credentials' });
		const ok = await user.comparePassword(password);
		if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
		const token = signJwt(user);
		return res.json({
			token,
			user: { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
		});
	} catch (e) {
		return res.status(500).json({ message: 'Login failed' });
	}
}

export async function me(req, res) {
	return res.json({ user: req.user });
}




