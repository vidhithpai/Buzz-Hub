import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema(
	{
		name: { type: String, trim: true }, // for group chats
		isGroup: { type: Boolean, default: false },
		participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
		latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
	},
	{ timestamps: true }
);

export const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);




