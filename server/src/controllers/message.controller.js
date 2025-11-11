import { ChatRoom } from '../models/ChatRoom.js';
import { Message } from '../models/Message.js';
import { getIO } from '../lib/socket.js';

export async function sendMessage(req, res) {
	const userId = req.user.id;
	const { roomId, content } = req.body;
	if (!roomId || !content) return res.status(400).json({ message: 'roomId and content required' });
	const room = await ChatRoom.findById(roomId);
	if (!room || !room.participants.map(String).includes(userId)) {
		return res.status(404).json({ message: 'Room not found' });
	}
	const message = await Message.create({ room: roomId, sender: userId, content, deliveredTo: [userId], readBy: [userId], sentAt: new Date() });
	await ChatRoom.findByIdAndUpdate(roomId, { latestMessage: message._id, updatedAt: new Date() });
	const populated = await Message.findById(message._id).populate('sender', 'name email avatarUrl');
	
	// Broadcast message to all room participants via Socket.io
	const io = getIO();
	if (io) {
		io.to(String(roomId)).emit('message:new', { message: populated });
	}
	
	return res.status(201).json({ message: populated });
}

export async function markDelivered(req, res) {
	const userId = req.user.id;
	const { messageId } = req.body;
	const msg = await Message.findByIdAndUpdate(
		messageId,
		{ $addToSet: { deliveredTo: userId } },
		{ new: true }
	);
	return res.json({ message: msg });
}

export async function markRead(req, res) {
	const userId = req.user.id;
	const { messageId } = req.body;
	const msg = await Message.findByIdAndUpdate(
		messageId,
		{ $addToSet: { readBy: userId } },
		{ new: true }
	);
	return res.json({ message: msg });
}




