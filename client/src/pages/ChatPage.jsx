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
	const [contacts, setContacts] = useState([])
	const [activeRoomId, setActiveRoomId] = useState('')
	const [messages, setMessages] = useState([])
	const [typing, setTyping] = useState({})
	const socketRef = useRef(null)
	const activeRoomRef = useRef('')
	const roomsRef = useRef([])
	const contactsRef = useRef([])
	const fetchingRoomsRef = useRef(false)
	const fetchingContactsRef = useRef(false)

	useEffect(() => {
		activeRoomRef.current = activeRoomId
	}, [activeRoomId])

	useEffect(() => {
		roomsRef.current = rooms
	}, [rooms])

	useEffect(() => {
		contactsRef.current = contacts
	}, [contacts])

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

	const ensureContactsLoaded = async () => {
		if (fetchingContactsRef.current) return
		fetchingContactsRef.current = true
		try {
			const { users } = await api.listUsers()
			setContacts(users)
		} finally {
			fetchingContactsRef.current = false
		}
	}

	useEffect(() => {
		const socket = io(SOCKET_URL, { transports: ['websocket'] })
		socketRef.current = socket
		socket.on('connect', () => {
			socket.emit('auth', { userId: user.id })
		})
		socket.on('message:new', ({ message }) => {
			const roomId = resolveRoomId(message.room)
			setRooms(prev => prev.map(room => room._id === roomId ? { ...room, latestMessage: message } : room))
			ensureRoomsLoaded(roomId).catch(() => {})
			if (roomId === activeRoomRef.current) {
				setMessages(prev => {
					const exists = prev.some(m => m._id === message._id)
					return exists ? prev.map(m => (m._id === message._id ? message : m)) : [...prev, message]
				})
			}
		})
		socket.on('message:update', ({ message }) => {
			const roomId = resolveRoomId(message.room)
			if (roomId === activeRoomRef.current) {
				setMessages(prev => prev.map(m => m._id === message._id ? message : m))
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
			setContacts(prev => prev.map(person => person._id === userId ? { ...person, isOnline } : person))
			if (!contactsRef.current.some(person => person._id === userId)) {
				ensureContactsLoaded().catch(() => {})
			}
		})
		return () => {
			socket.disconnect()
		}
	}, [user.id, api])

	useEffect(() => {
		let cancelled = false
		;(async () => {
			try {
				const [{ rooms }, { users }] = await Promise.all([api.listChats(), api.listUsers()])
				if (cancelled) return
				setRooms(rooms)
				setContacts(users)
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
		if (socket && rooms.length) {
			const roomIds = rooms.map(room => room._id)
			socket.emit('join:rooms', { roomIds })
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
		setMessages(prev => [...prev, message])
		setRooms(prev => prev.map(room => room._id === activeRoomId ? { ...room, latestMessage: message } : room))
		socketRef.current?.emit('message:send', { message })
	}

	const setTypingState = (isTyping) => {
		if (!activeRoomId) return
		const evt = isTyping ? 'typing:start' : 'typing:stop'
		socketRef.current?.emit(evt, { roomId: activeRoomId, userId: user.id })
	}

	const startDirectChat = async (contactId) => {
		const existing = rooms.find(room => !room.isGroup && room.participants.some(p => p._id === contactId))
		if (existing) {
			setActiveRoomId(existing._id)
			return
		}
		const { room } = await api.createPrivate(contactId)
		setRooms(prev => [...prev, room])
		setActiveRoomId(room._id)
		socketRef.current?.emit('join:rooms', { roomIds: [room._id] })
	}

	const activeRoom = rooms.find(r => r._id === activeRoomId)
	const activeTyping = Object.entries(typing[activeRoomId] || {}).some(([id, isTyping]) => isTyping && id !== user.id)

	return (
		<div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '100%' }}>
			<Sidebar
				rooms={rooms}
				contacts={contacts}
				activeRoomId={activeRoomId}
				onSelect={setActiveRoomId}
				onStartChat={startDirectChat}
				user={user}
				onLogout={logout}
			/>
			<ChatWindow
				room={activeRoom}
				messages={messages}
				onSend={sendMessage}
				onTyping={setTypingState}
				typing={activeTyping}
				meId={user.id}
			/>
		</div>
	)
}




