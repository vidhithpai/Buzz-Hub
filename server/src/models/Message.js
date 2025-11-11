import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
	{
		room: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
		sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		content: { type: String, required: true },
		deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		sentAt: { type: Date, default: Date.now }
	},
	{ timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);




