import { User } from '../models/User.js';
import { signJwt } from '../middleware/auth.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

function formatUserResponse(user) {
	return {
		id: user._id,
		name: user.name,
		username: user.username,
		email: user.email,
		avatarUrl: user.avatarUrl
	};
}

export async function signup(req, res) {
	try {
		const { name, username, email, password } = req.body;
		if (!name || !username || !email || !password) {
			return res.status(400).json({ message: 'Missing fields' });
		}

		const trimmedName = String(name).trim();
		const normalizedUsername = String(username).trim().toLowerCase();
		const normalizedEmail = String(email).trim().toLowerCase();

	if (!trimmedName) {
		return res.status(400).json({ message: 'Name is required' });
	}

		if (!EMAIL_REGEX.test(normalizedEmail)) {
			return res.status(400).json({ message: 'Invalid email address' });
		}

	if (!USERNAME_REGEX.test(normalizedUsername)) {
		return res.status(400).json({ message: 'Invalid username format' });
	}

		const [emailExists, usernameExists] = await Promise.all([
			User.exists({ email: normalizedEmail }),
			User.exists({ username: normalizedUsername })
		]);

		if (emailExists) {
			return res.status(409).json({ message: 'Email already in use' });
		}

		if (usernameExists) {
			return res.status(409).json({ message: 'Username already in use' });
		}

		const passwordHash = await User.hashPassword(password);
		const user = await User.create({
			name: trimmedName,
			username: normalizedUsername,
			email: normalizedEmail,
			passwordHash
		});
		const token = signJwt(user);
		return res.status(201).json({
			token,
			user: formatUserResponse(user)
		});
	} catch (e) {
		if (e?.code === 11000) {
			if (e?.keyPattern?.email) {
				return res.status(409).json({ message: 'Email already in use' });
			}
			if (e?.keyPattern?.username) {
				return res.status(409).json({ message: 'Username already in use' });
			}
		}
		if (e?.name === 'ValidationError') {
			return res.status(400).json({ message: 'Invalid signup data' });
		}
		return res.status(500).json({ message: 'Signup failed' });
	}
}

export async function login(req, res) {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
		const normalizedEmail = String(email).trim().toLowerCase();
		const user = await User.findOne({ email: normalizedEmail });
		if (!user) return res.status(401).json({ message: 'Invalid credentials' });
		const ok = await user.comparePassword(password);
		if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
		const token = signJwt(user);
		return res.json({
			token,
			user: formatUserResponse(user)
		});
	} catch (e) {
		return res.status(500).json({ message: 'Login failed' });
	}
}

export async function me(req, res) {
	return res.json({ user: req.user });
}




