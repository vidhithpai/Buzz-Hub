import { ChatRoom } from '../models/ChatRoom.js';
import { Message } from '../models/Message.js';

export async function listMyChats(req, res) {
	const userId = req.user.id;
	const rooms = await ChatRoom.find({ participants: userId })
		.sort({ updatedAt: -1 })
		.populate('latestMessage')
		.populate('participants', 'name email avatarUrl isOnline lastSeenAt');
	return res.json({ rooms });
}

export async function createPrivateChat(req, res) {
	const userId = req.user.id;
	const { participantId } = req.body;
	if (!participantId) return res.status(400).json({ message: 'participantId required' });
	let room = await ChatRoom.findOne({
		isGroup: false,
		participants: { $all: [userId, participantId], $size: 2 }
	});
	if (!room) {
		room = await ChatRoom.create({ isGroup: false, participants: [userId, participantId] });
	}
	room = await room.populate('participants', 'name email avatarUrl isOnline lastSeenAt');
	return res.status(201).json({ room });
}

export async function createGroupChat(req, res) {
	const userId = req.user.id;
	const { name, participantIds } = req.body;
	if (!name || !Array.isArray(participantIds) || participantIds.length < 2) {
		return res.status(400).json({ message: 'name and >=2 participantIds required' });
	}
	const room = await ChatRoom.create({
		name,
		isGroup: true,
		participants: Array.from(new Set([userId, ...participantIds]))
	});
	const populated = await room.populate('participants', 'name email avatarUrl isOnline lastSeenAt');
	return res.status(201).json({ room: populated });
}

export async function getRoomMessages(req, res) {
	const userId = req.user.id;
	const { roomId } = req.params;
	const room = await ChatRoom.findById(roomId);
	if (!room || !room.participants.map(String).includes(userId)) {
		return res.status(404).json({ message: 'Room not found' });
	}
	const messages = await Message.find({ room: roomId })
		.sort({ createdAt: 1 })
		.populate('sender', 'name email avatarUrl');
	return res.json({ messages });
}




