import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../state/AuthContext.jsx'
import { createApi } from '../lib/api.js'
import Sidebar from '../ui/Sidebar.jsx'
import ChatWindow from '../ui/ChatWindow.jsx'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

const resolveRoomId = (room) => {
	if (!room) return ''
	if (typeof room === 'string') return room
	if (typeof room === 'object') return room._id || room.id || ''
	return ''
}

export default function ChatPage() {
	const { token, user, logout } = useAuth()
	const api = useMemo(() => createApi(token), [token])
	const [rooms, setRooms] = useState([])
	const [activeRoomId, setActiveRoomId] = useState('')
	const [messages, setMessages] = useState([])
	const [typing, setTyping] = useState({})
	const [searchStatus, setSearchStatus] = useState('idle')
	const [searchMessage, setSearchMessage] = useState('')
	const [searchError, setSearchError] = useState('')
	const socketRef = useRef(null)
	const activeRoomRef = useRef('')
	const roomsRef = useRef([])
	const fetchingRoomsRef = useRef(false)
	const searchLoading = searchStatus === 'loading'

	useEffect(() => {
		activeRoomRef.current = activeRoomId
	}, [activeRoomId])

	useEffect(() => {
		roomsRef.current = rooms
	}, [rooms])

	const ensureRoomsLoaded = async (roomId) => {
		if (!roomId) return
		if (roomsRef.current.some(room => room._id === roomId)) return
		if (fetchingRoomsRef.current) return
		fetchingRoomsRef.current = true
		try {
			const { rooms } = await api.listChats()
			setRooms(rooms)
		} finally {
			fetchingRoomsRef.current = false
		}
	}

	useEffect(() => {
		const socket = io(SOCKET_URL, { 
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionAttempts: 5
		})
		socketRef.current = socket
		
		socket.on('connect', () => {
			console.log('Socket connected:', socket.id)
			socket.emit('auth', { userId: user.id })
			// Join rooms after authentication
			if (roomsRef.current.length > 0) {
				const roomIds = roomsRef.current.map(room => room._id)
				socket.emit('join:rooms', { roomIds })
			}
		})
		
		socket.on('disconnect', () => {
			console.log('Socket disconnected')
		})
		
		socket.on('connect_error', (error) => {
			console.error('Socket connection error:', error)
		})
		socket.on('message:new', ({ message }) => {
			const roomId = resolveRoomId(message.room)
			if (!roomId) return
			
			// Update rooms list with latest message
			setRooms(prev => {
				const roomExists = prev.some(room => room._id === roomId)
				if (roomExists) {
					return prev.map(room => room._id === roomId ? { ...room, latestMessage: message } : room)
				} else {
					// Room not in list, fetch it
					ensureRoomsLoaded(roomId).catch(() => {})
					return prev
				}
			})
			
			// If this message is for the active room, add it to messages
			if (roomId === activeRoomRef.current) {
				setMessages(prev => {
					const exists = prev.some(m => m._id === message._id)
					if (exists) {
						// Update existing message
						return prev.map(m => (m._id === message._id ? message : m))
					} else {
						// Add new message
						return [...prev, message]
					}
				})
			}
		})
		socket.on('typing:update', ({ roomId, userId, typing }) => {
			setTyping(prev => ({
				...prev,
				[roomId]: { ...(prev[roomId] || {}), [userId]: typing }
			}))
		})
		socket.on('presence:update', ({ userId, isOnline }) => {
			setRooms(prev => prev.map(room => ({
				...room,
				participants: room.participants.map(person => person._id === userId ? { ...person, isOnline } : person)
			})))
		})
		return () => {
			socket.disconnect()
		}
	}, [user.id, api])

	useEffect(() => {
		let cancelled = false
		;(async () => {
			try {
				const { rooms } = await api.listChats()
				if (cancelled) return
				setRooms(rooms)
				if (rooms.length && !activeRoomRef.current) {
					setActiveRoomId(rooms[0]._id)
				}
			} catch (e) {
				logout()
			}
		})()
		return () => { cancelled = true }
	}, [api, logout])

	useEffect(() => {
		const socket = socketRef.current
		if (socket && socket.connected && rooms.length) {
			const roomIds = rooms.map(room => room._id)
			socket.emit('join:rooms', { roomIds })
			console.log('Joined rooms:', roomIds)
		}
	}, [rooms])

	useEffect(() => {
		if (!activeRoomId) return
		let cancelled = false
		api.getMessages(activeRoomId).then(({ messages }) => {
			if (!cancelled) setMessages(messages)
		})
		return () => { cancelled = true }
	}, [activeRoomId, api])

	const sendMessage = async (text) => {
		if (!activeRoomId || !text.trim()) return
		const { message } = await api.sendMessage({ roomId: activeRoomId, content: text })
		// Message will be broadcast by server via Socket.io, so we don't need to emit here
		// But we can optimistically add it for immediate UI update
		setMessages(prev => {
			const exists = prev.some(m => m._id === message._id)
			return exists ? prev : [...prev, message]
		})
		setRooms(prev => prev.map(room => room._id === activeRoomId ? { ...room, latestMessage: message } : room))
	}

	const setTypingState = (isTyping) => {
		if (!activeRoomId) return
		const evt = isTyping ? 'typing:start' : 'typing:stop'
		socketRef.current?.emit(evt, { roomId: activeRoomId, userId: user.id })
	}

	const startDirectChat = async (contactId) => {
		const existing = roomsRef.current.find(room => !room.isGroup && room.participants.some(p => p._id === contactId))
		if (existing) {
			setActiveRoomId(existing._id)
			return { status: 'existing', room: existing }
		}
		const { room } = await api.createPrivate(contactId)
		setRooms(prev => [...prev, room])
		setActiveRoomId(room._id)
		// Join the new room via Socket.io
		if (socketRef.current?.connected) {
			socketRef.current.emit('join:rooms', { roomIds: [room._id] })
		}
		return { status: 'created', room }
	}

	const startGroupChatWithUser = async (initialUser) => {
		const groupName = window.prompt('Enter group name')
		if (!groupName || !groupName.trim()) {
			return { status: 'cancelled' }
		}
		const cleanedName = groupName.trim()
		const participantIds = new Set()
		const initialId = initialUser.id || initialUser._id
		if (initialId && initialId !== user.id) {
			participantIds.add(initialId)
		}
		const additionalInput = window.prompt('Enter additional usernames separated by commas (optional)')
		if (additionalInput) {
			const extras = additionalInput
				.split(',')
				.map(name => name.trim())
				.filter(Boolean)
			const seenUsernames = new Set()
			for (const extra of extras) {
				const normalized = extra.toLowerCase()
				if (normalized === user.username.toLowerCase()) continue
				if (normalized === (initialUser.username || '').toLowerCase()) continue
				if (seenUsernames.has(normalized)) continue
				seenUsernames.add(normalized)
				try {
					const { user: extraUser } = await api.searchUser(extra)
					const extraId = extraUser.id || extraUser._id
					if (extraId && extraId !== user.id) {
						participantIds.add(extraId)
					}
				} catch (err) {
					const message = err?.response?.status === 404 ? `User not found: ${extra}` : err?.response?.data?.message || 'Failed to resolve participant'
					return { status: 'error', error: message }
				}
			}
		}
		const uniqueIds = Array.from(participantIds)
		if (uniqueIds.length === 0) {
			return { status: 'error', error: 'At least one other participant required' }
		}
		try {
			const { room } = await api.createGroup(cleanedName, uniqueIds)
			setRooms(prev => [...prev, room])
			setActiveRoomId(room._id)
			if (socketRef.current?.connected) {
				socketRef.current.emit('join:rooms', { roomIds: [room._id] })
			}
			return { status: 'success', message: `Group chat "${room.name || cleanedName}" created` }
		} catch (err) {
			const message = err?.response?.data?.message || 'Failed to create group chat'
			return { status: 'error', error: message }
		}
	}

	const handleUsernameAction = async (rawUsername, mode) => {
		const trimmed = rawUsername.trim()
		if (!trimmed) return
		setSearchStatus('loading')
		setSearchMessage('')
		setSearchError('')
		try {
			const { user: foundUser } = await api.searchUser(trimmed)
			const targetId = foundUser.id || foundUser._id
			if (!targetId) {
				setSearchStatus('error')
				setSearchError('User not found.')
				return
			}
			if (targetId === user.id) {
				setSearchStatus('error')
				setSearchError('Cannot start a chat with yourself')
				return
			}
			if (mode === 'direct') {
				const result = await startDirectChat(targetId)
				const message = result?.status === 'existing'
					? `You already have a chat with @${foundUser.username}`
					: `Direct chat ready with @${foundUser.username}`
				setSearchStatus('success')
				setSearchMessage(message)
			} else {
				const outcome = await startGroupChatWithUser(foundUser)
				if (outcome.status === 'success') {
					setSearchStatus('success')
					setSearchMessage(outcome.message || `Group chat created with @${foundUser.username}`)
				} else if (outcome.status === 'cancelled') {
					setSearchStatus('idle')
				} else {
					setSearchStatus('error')
					setSearchError(outcome.error || 'Failed to create group chat')
				}
			}
		} catch (err) {
			if (err?.response?.status === 404) {
				setSearchError('User not found.')
			} else if (err?.response?.data?.message) {
				setSearchError(err.response.data.message)
			} else {
				setSearchError('Search failed')
			}
			setSearchStatus('error')
		}
	}

	const activeRoom = rooms.find(r => r._id === activeRoomId)
	const activeTyping = Object.entries(typing[activeRoomId] || {}).some(([id, isTyping]) => isTyping && id !== user.id)

	return (
		<div style={{ display: 'flex', height: '100vh', background: '#0f172a' }}>
			<Sidebar
				rooms={rooms}
				activeRoomId={activeRoomId}
				onSelect={setActiveRoomId}
				onUsernameAction={handleUsernameAction}
				searchStatus={searchStatus}
				searchMessage={searchMessage}
				searchError={searchError}
				searchLoading={searchLoading}
				user={user}
				onLogout={logout}
			/>
			<div style={{ marginLeft: 320, flex: 1, minHeight: '100vh', display: 'flex' }}>
				<div style={{ flex: 1 }}>
					<ChatWindow
						room={activeRoom}
						messages={messages}
						onSend={sendMessage}
						onTyping={setTypingState}
						typing={activeTyping}
						meId={user.id}
					/>
				</div>
			</div>
		</div>
	)
}




