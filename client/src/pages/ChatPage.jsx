import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../state/AuthContext.jsx'
import { createApi } from '../lib/api.js'
import Sidebar from '../ui/Sidebar.jsx'
import ChatWindow from '../ui/ChatWindow.jsx'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export default function ChatPage() {
	const { token, user, logout } = useAuth()
	const api = useMemo(() => createApi(token), [token])
	const [rooms, setRooms] = useState([])
	const [activeRoomId, setActiveRoomId] = useState('')
	const [messages, setMessages] = useState([])
	const [typing, setTyping] = useState({}) // roomId -> { userId: boolean }
	const socketRef = useRef(null)

	useEffect(() => {
		let mounted = true
		api.listChats().then(({ rooms }) => {
			if (!mounted) return
			setRooms(rooms)
			if (rooms.length && !activeRoomId) setActiveRoomId(rooms[0]._id)
			const socket = io(SOCKET_URL, { transports: ['websocket'] })
			socketRef.current = socket
			socket.on('connect', () => {
				socket.emit('auth', { userId: user.id })
				socket.emit('join:rooms', { roomIds: rooms.map(r => r._id) })
			})
			socket.on('message:new', ({ message }) => {
				setMessages(prev => message.room === activeRoomId ? [...prev, message] : prev)
			})
			socket.on('message:update', ({ message }) => {
				setMessages(prev => prev.map(m => m._id === message._id ? message : m))
			})
			socket.on('typing:update', ({ roomId, userId, typing }) => {
				setTyping(prev => ({
					...prev,
					[roomId]: { ...(prev[roomId] || {}), [userId]: typing }
				}))
			})
			socket.on('presence:update', ({ userId, isOnline }) => {
				setRooms(prev => prev.map(r => ({
					...r,
					participants: r.participants.map(p => p._id === userId ? { ...p, isOnline } : p)
				})))
			})
		}).catch(() => {
			logout()
		})
		return () => {
			mounted = false
			socketRef.current?.disconnect()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		if (!activeRoomId) return
		api.getMessages(activeRoomId).then(({ messages }) => setMessages(messages))
	}, [activeRoomId])

	const sendMessage = async (text) => {
		if (!text.trim()) return
		const { message } = await api.sendMessage({ roomId: activeRoomId, content: text })
		socketRef.current?.emit('message:send', { roomId: activeRoomId, senderId: user.id, content: text })
		setMessages(prev => [...prev, message])
	}

	const setTypingState = (isTyping) => {
		const evt = isTyping ? 'typing:start' : 'typing:stop'
		socketRef.current?.emit(evt, { roomId: activeRoomId, userId: user.id })
	}

	const activeRoom = rooms.find(r => r._id === activeRoomId)
	const activeTyping = Object.entries(typing[activeRoomId] || {}).filter(([k, v]) => v && k !== user.id).length > 0

	return (
		<div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '100%' }}>
			<Sidebar rooms={rooms} activeRoomId={activeRoomId} onSelect={setActiveRoomId} user={user} onLogout={logout} />
			<ChatWindow room={activeRoom} messages={messages} onSend={sendMessage} onTyping={setTypingState} typing={activeTyping} meId={user.id} />
		</div>
	)
}




