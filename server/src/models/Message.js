import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
	{
		room: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
		senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		senderName: { type: String, required: true, trim: true },
		content: { type: String, required: true },
		sentAt: { type: Date, default: Date.now }
	},
	{ timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);




