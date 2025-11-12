export function formatMessageDoc(message) {
	if (!message) return null;

	const doc = typeof message.toObject === 'function' ? message.toObject({ virtuals: true }) : { ...message };
	const sender = doc.senderId;

	let senderDetails = null;
	let senderId = null;

	if (sender && typeof sender === 'object' && sender !== null && sender._id) {
		senderId = sender._id.toString();
		senderDetails = {
			id: sender._id.toString(),
			_id: sender._id,
			name: sender.name,
			username: sender.username,
			email: sender.email,
			avatarUrl: sender.avatarUrl
		};
	} else if (sender) {
		senderId = sender.toString();
	}

	const normalizeIdArray = (arr) => {
		if (!Array.isArray(arr)) return [];
		return arr.map((item) => {
			if (!item) return item;
			if (typeof item === 'object' && item !== null && item._id) {
				return item._id.toString();
			}
			if (typeof item === 'object' && item !== null && typeof item.toString === 'function') {
				return item.toString();
			}
			return item;
		});
	};

	return {
		_id: doc._id,
		id: doc._id,
		room: doc.room && typeof doc.room === 'object' && doc.room._id ? doc.room._id.toString() : doc.room?.toString?.() ?? doc.room,
		senderId,
		senderName: doc.senderName || senderDetails?.name || null,
		senderUsername: doc.senderUsername || senderDetails?.username || null,
		content: doc.content,
		deliveredTo: normalizeIdArray(doc.deliveredTo),
		readBy: normalizeIdArray(doc.readBy),
		sentAt: doc.sentAt,
		createdAt: doc.createdAt,
		updatedAt: doc.updatedAt,
		sender: senderDetails || undefined
	};
}

