import { useEffect, useRef, useState } from 'react'

function Bubble({ mine, content, timestamp, senderLabel, showSender }) {
	return (
		<div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', padding: '2px 0' }}>
			<div style={{
				maxWidth: 'min(520px, 85vw)',
				background: mine ? '#1d4ed8' : '#111827',
				color: 'white',
				padding: '10px 14px',
				borderRadius: 12,
				margin: '4px 8px',
				wordWrap: 'break-word',
				overflowWrap: 'break-word',
				boxSizing: 'border-box'
			}}>
				{showSender ? (
					<div style={{ fontWeight: 600, color: mine ? '#bfdbfe' : '#38bdf8', marginBottom: 4 }}>
						{senderLabel || 'Unknown'}
					</div>
				) : null}
				<div>{content}</div>
				<div style={{ display: 'flex', alignItems: 'center', fontSize: 'clamp(10px, 2.5vw, 11px)', marginTop: 4, opacity: 0.85 }}>
					<span>{new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
				</div>
			</div>
		</div>
	)
}

export default function ChatWindow({ room, messages, onSend, onTyping, typing, meId, leftInset = 16 }) {
	const [text, setText] = useState('')
	const listRef = useRef(null)
	const typingRef = useRef(false)
	const typingTimeoutRef = useRef()
	const otherParticipants = room ? room.participants.filter(p => p._id !== meId) : []
	const onlineCount = room ? room.participants.filter(p => p.isOnline).length : 0
	const primaryOther = otherParticipants[0] || null
	const roomTitle = room
		? room.isGroup
			? (room.name || 'Group')
			: (primaryOther?.name || (primaryOther?.username ? `@${primaryOther.username}` : 'Direct'))
		: 'Direct'
	const roomSubtitle = !room?.isGroup && primaryOther?.name ? `@${primaryOther.username}` : ''
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

	const resolveId = (value) => {
		if (!value) return ''
		if (typeof value === 'string') return value
		if (value._id) return value._id
		if (typeof value.toString === 'function') return value.toString()
		return ''
	}

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
		<div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
			<div
				style={{
					paddingTop: 16,
					paddingRight: 16,
					paddingBottom: 16,
					paddingLeft: leftInset,
					borderBottom: '1px solid #1f2937',
					flexShrink: 0,
					width: '100%',
					boxSizing: 'border-box'
				}}
			>
				<div>
					<div style={{ fontWeight: 700, fontSize: 'clamp(16px, 4vw, 18px)' }}>{roomTitle}</div>
					{roomSubtitle ? <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: '#94a3b8' }}>{roomSubtitle}</div> : null}
				</div>
				<div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: '#94a3b8', marginTop: 4 }}>{statusText}</div>
			</div>
			<div
				ref={listRef}
				style={{
					flex: 1,
					overflowY: 'auto',
					overflowX: 'hidden',
					paddingTop: 8,
					paddingRight: 8,
					paddingBottom: 88,
					paddingLeft: Math.max(leftInset - 8, 0),
					scrollbarGutter: 'stable',
					WebkitOverflowScrolling: 'touch',
					width: '100%',
					boxSizing: 'border-box'
				}}
			>
				{messages.map(m => {
					const senderId = resolveId(m.senderId || m.sender)
					const mine = senderId === meId
					const senderLabel = m.senderName || m.sender?.name || m.senderUsername || m.sender?.username || ''
					const showSender = room.isGroup
					return (
						<Bubble
							key={m._id}
							mine={mine}
							content={m.content}
							timestamp={m.sentAt || m.createdAt}
							senderLabel={senderLabel}
							showSender={showSender}
						/>
					)
				})}
			</div>
			<form
				onSubmit={submit}
				style={{
					display: 'flex',
					gap: 8,
					paddingTop: 12,
					paddingRight: 12,
					paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
					paddingLeft: leftInset,
					borderTop: '1px solid #1f2937',
					background: '#0f172a',
					position: 'sticky',
					bottom: 0,
					flexShrink: 0,
					width: '100%',
					boxSizing: 'border-box'
				}}
			>
				<input
					value={text}
					onChange={e => handleInput(e.target.value)}
					placeholder="Type a message"
					style={{
						flex: 1,
						minHeight: 44,
						padding: '12px 16px',
						borderRadius: 8,
						border: '1px solid #374151',
						background: '#0b1220',
						color: '#e2e8f0',
						fontSize: 15,
						boxSizing: 'border-box',
						touchAction: 'manipulation'
					}}
				/>
				<button
					style={{
						minWidth: 44,
						minHeight: 44,
						padding: '0 20px',
						borderRadius: 8,
						background: '#2563eb',
						border: 0,
						color: 'white',
						fontSize: 15,
						fontWeight: 500,
						touchAction: 'manipulation'
					}}
				>
					Send
				</button>
			</form>
		</div>
	)
}




