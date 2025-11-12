import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		username: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
			unique: true,
			index: true,
			minlength: 3,
			maxlength: 30,
			match: [USERNAME_REGEX, 'Invalid username format']
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			index: true,
			match: [EMAIL_REGEX, 'Invalid email address']
		},
		passwordHash: { type: String, required: true },
		avatarUrl: { type: String },
		lastSeenAt: { type: Date, default: Date.now },
		isOnline: { type: Boolean, default: false }
	},
	{ timestamps: true }
);

userSchema.methods.comparePassword = async function (password) {
	return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
	const salt = await bcrypt.genSalt(10);
	return bcrypt.hash(password, salt);
};

export const User = mongoose.model('User', userSchema);




