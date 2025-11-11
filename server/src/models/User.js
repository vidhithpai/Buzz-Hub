import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, index: true },
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




