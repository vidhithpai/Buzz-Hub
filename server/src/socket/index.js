import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import { formatMessageDoc } from '../lib/formatMessage.js';

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

		socket.on('message:send', async ({ message }) => {
			// This handler is kept for backward compatibility
			// But messages are now primarily broadcast from the REST API endpoint
			if (!message) return;
			const roomId = String(message.room?._id || message.room || '');
			if (!roomId) return;

			let payload = message;
			if (message._id) {
				const doc = await Message.findById(message._id).populate('senderId', 'name username email avatarUrl');
				if (doc) {
					payload = formatMessageDoc(doc);
				}
			}
			io.to(roomId).emit('message:new', { message: payload });
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




