import { useEffect, useRef, useState } from 'react'

function Bubble({ mine, content, timestamp, delivered, read }) {
	return (
		<div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
			<div style={{ maxWidth: 520, background: mine ? '#1d4ed8' : '#111827', color: 'white', padding: '8px 12px', borderRadius: 12, margin: '4px 8px' }}>
				<div>{content}</div>
				<div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, marginTop: 4, opacity: 0.85 }}>
					<span>{new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
					<span>{read ? '✓✓' : delivered ? '✓' : ''}</span>
				</div>
			</div>
		</div>
	)
}

export default function ChatWindow({ room, messages, onSend, onTyping, typing, meId }) {
	const [text, setText] = useState('')
	const listRef = useRef(null)
	const typingRef = useRef(false)
	const typingTimeoutRef = useRef()
	const otherParticipants = room ? room.participants.filter(p => p._id !== meId) : []
	const onlineCount = room ? room.participants.filter(p => p.isOnline).length : 0
	const statusText = typing
		? 'Typing...'
		: room
			? room.isGroup
				? `${onlineCount} online`
				: otherParticipants[0]
					? otherParticipants[0].isOnline
						? 'Online'
						: otherParticipants[0].lastSeenAt
							? `Last seen ${new Date(otherParticipants[0].lastSeenAt).toLocaleString()}`
							: 'Offline'
					: ''
			: ''

	const hasUser = (array, userId) => (array || []).some(entry => {
		if (!entry) return false
		if (typeof entry === 'string') return entry === userId
		if (typeof entry === 'object') {
			if (entry._id) return entry._id === userId
			if (entry.toString) return entry.toString() === userId
		}
		return false
	})

	useEffect(() => {
		if (listRef.current) {
			listRef.current.scrollTop = listRef.current.scrollHeight
		}
	}, [messages])

	if (!room) {
		return <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>Select a chat</div>
	}

	const handleInput = (v) => {
		setText(v)
		if (!typingRef.current) {
			typingRef.current = true
			onTyping(true)
		}
		clearTimeout(typingTimeoutRef.current)
		typingTimeoutRef.current = setTimeout(() => {
			typingRef.current = false
			onTyping(false)
		}, 1000)
	}

	const submit = (e) => {
		e.preventDefault()
		if (!text.trim()) return
		onSend(text)
		setText('')
		onTyping(false)
		typingRef.current = false
	}

	return (
		<div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', height: '100%' }}>
			<div style={{ padding: 16, borderBottom: '1px solid #1f2937' }}>
				<div style={{ fontWeight: 700 }}>{room.isGroup ? (room.name || 'Group') : (room.participants.find(p => p._id !== meId)?.name || 'Direct')}</div>
				<div style={{ fontSize: 12, color: '#94a3b8' }}>{statusText}</div>
			</div>
			<div ref={listRef} style={{ overflow: 'auto', padding: 8 }}>
				{messages.map(m => (
					<Bubble
						key={m._id}
						mine={m.sender === meId || m.sender?._id === meId}
						content={m.content}
						timestamp={m.sentAt || m.createdAt}
						delivered={hasUser(m.deliveredTo, meId)}
						read={hasUser(m.readBy, meId)}
					/>
				))}
			</div>
			<form onSubmit={submit} style={{ display: 'flex', gap: 8, padding: 8, borderTop: '1px solid #1f2937' }}>
				<input value={text} onChange={e => handleInput(e.target.value)} placeholder="Type a message" style={{ flex: 1, padding: 12, borderRadius: 6, border: '1px solid #374151', background: '#0b1220', color: '#e2e8f0' }} />
				<button style={{ padding: '0 16px', borderRadius: 6, background: '#2563eb', border: 0, color: 'white' }}>Send</button>
			</form>
		</div>
	)
}




