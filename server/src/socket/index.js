import { User } from '../models/User.js';
import { Message } from '../models/Message.js';

const userIdToSocketIds = new Map(); // userId -> Set(socketId)
const socketIdToUserId = new Map(); // socketId -> userId

function addConnection(userId, socketId) {
	if (!userIdToSocketIds.has(userId)) userIdToSocketIds.set(userId, new Set());
	userIdToSocketIds.get(userId).add(socketId);
	socketIdToUserId.set(socketId, userId);
}

function removeConnection(socketId) {
	const userId = socketIdToUserId.get(socketId);
	if (!userId) return;
	socketIdToUserId.delete(socketId);
	const set = userIdToSocketIds.get(userId);
	if (set) {
		set.delete(socketId);
		if (set.size === 0) {
			userIdToSocketIds.delete(userId);
		}
	}
	return userId;
}

export function registerSocketHandlers(io) {
	io.on('connection', (socket) => {
		socket.on('auth', async ({ userId }) => {
			if (!userId) return;
			addConnection(userId, socket.id);
			await User.findByIdAndUpdate(userId, { isOnline: true, lastSeenAt: new Date() });
			io.emit('presence:update', { userId, isOnline: true });
		});

		socket.on('join:rooms', ({ roomIds }) => {
			if (Array.isArray(roomIds)) {
				roomIds.forEach((roomId) => socket.join(String(roomId)));
			}
		});

		socket.on('message:send', async ({ roomId, senderId, content }) => {
			if (!roomId || !senderId || !content) return;
			const message = await Message.create({
				room: roomId,
				sender: senderId,
				content,
				deliveredTo: [senderId],
				readBy: [senderId],
				sentAt: new Date()
			});
			io.to(String(roomId)).emit('message:new', { message });
		});

		socket.on('message:delivered', async ({ messageId, userId }) => {
			const msg = await Message.findByIdAndUpdate(
				messageId,
				{ $addToSet: { deliveredTo: userId } },
				{ new: true }
			);
			if (msg) {
				io.to(String(msg.room)).emit('message:update', { message: msg });
			}
		});

		socket.on('message:read', async ({ messageId, userId }) => {
			const msg = await Message.findByIdAndUpdate(
				messageId,
				{ $addToSet: { readBy: userId } },
				{ new: true }
			);
			if (msg) {
				io.to(String(msg.room)).emit('message:update', { message: msg });
			}
		});

		socket.on('typing:start', ({ roomId, userId }) => {
			socket.to(String(roomId)).emit('typing:update', { roomId, userId, typing: true });
		});

		socket.on('typing:stop', ({ roomId, userId }) => {
			socket.to(String(roomId)).emit('typing:update', { roomId, userId, typing: false });
		});

		socket.on('disconnect', async () => {
			const userId = removeConnection(socket.id);
			if (userId && !userIdToSocketIds.has(userId)) {
				await User.findByIdAndUpdate(userId, { isOnline: false, lastSeenAt: new Date() });
				io.emit('presence:update', { userId, isOnline: false });
			}
		});
	});
}




