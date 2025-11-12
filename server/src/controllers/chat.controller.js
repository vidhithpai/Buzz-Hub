import { ChatRoom } from '../models/ChatRoom.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { formatMessageDoc } from '../lib/formatMessage.js';

export async function listMyChats(req, res) {
	const userId = req.user.id;
	const rooms = await ChatRoom.find({ participants: userId })
		.sort({ updatedAt: -1 })
		.populate({
			path: 'latestMessage',
			populate: { path: 'senderId', select: 'name username email avatarUrl' }
		})
		.populate('participants', 'name username email avatarUrl isOnline lastSeenAt');
	const formattedRooms = rooms.map((room) => {
		const plain = typeof room.toObject === 'function' ? room.toObject({ virtuals: true }) : room;
		return {
			...plain,
			latestMessage: plain.latestMessage ? formatMessageDoc(plain.latestMessage) : null
		};
	});
	return res.json({ rooms: formattedRooms });
}

export async function createPrivateChat(req, res) {
	const userId = req.user.id;
	const { participantId } = req.body;
	if (!participantId) return res.status(400).json({ message: 'participantId required' });
	if (participantId === userId) {
		return res.status(400).json({ message: 'Cannot start a chat with yourself' });
	}
	const participant = await User.findById(participantId);
	if (!participant) {
		return res.status(404).json({ message: 'User not found.' });
	}
	let room = await ChatRoom.findOne({
		isGroup: false,
		participants: { $all: [userId, participantId], $size: 2 }
	});
	if (!room) {
		room = await ChatRoom.create({ isGroup: false, participants: [userId, participantId] });
	}
	room = await room.populate('participants', 'name username email avatarUrl isOnline lastSeenAt');
	return res.status(201).json({ room });
}

export async function createGroupChat(req, res) {
	const userId = req.user.id;
	const { name, participantIds } = req.body;
	if (!name || !Array.isArray(participantIds)) {
		return res.status(400).json({ message: 'name and participantIds required' });
	}
	const trimmedName = String(name).trim();
	const normalizedParticipantIds = Array.from(
		new Set(
			participantIds
				.map((id) => String(id))
				.filter((id) => id && id !== userId)
		)
	);
	if (!trimmedName) {
		return res.status(400).json({ message: 'Group name required' });
	}
	if (normalizedParticipantIds.length === 0) {
		return res.status(400).json({ message: 'At least one other participant required' });
	}
	const foundParticipants = await User.find({ _id: { $in: normalizedParticipantIds } }).select('_id');
	if (foundParticipants.length !== normalizedParticipantIds.length) {
		return res.status(404).json({ message: 'One or more users not found.' });
	}
	const room = await ChatRoom.create({
		name: trimmedName,
		isGroup: true,
		participants: Array.from(new Set([userId, ...normalizedParticipantIds]))
	});
	const populated = await room.populate('participants', 'name username email avatarUrl isOnline lastSeenAt');
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
		.populate('senderId', 'name username email avatarUrl');
	const formattedMessages = messages.map(formatMessageDoc);
	return res.json({ messages: formattedMessages });
}




