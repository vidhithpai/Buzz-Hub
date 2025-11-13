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
	const [isSidebarOpen, setSidebarOpen] = useState(true)
	const [isMobile, setIsMobile] = useState(false)
	const [isProfilePanelOpen, setProfilePanelOpen] = useState(false)
	const [isNewChatPanelOpen, setNewChatPanelOpen] = useState(false)
	const [activeView, setActiveView] = useState('chats') // 'chats', 'chat', 'profile', 'newchat'
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

	useEffect(() => {
		const handleResize = () => {
			const mobile = window.matchMedia('(max-width: 900px)').matches
			setIsMobile(mobile)
		}
		handleResize()
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	useEffect(() => {
		if (isMobile) {
			setSidebarOpen(false)
			setProfilePanelOpen(false)
			setNewChatPanelOpen(false)
			setActiveView(activeRoomId ? 'chat' : 'chats')
		} else {
			setSidebarOpen(true)
		}
	}, [isMobile])

	useEffect(() => {
		if (isMobile && activeRoomId) {
			setActiveView('chat')
			setSidebarOpen(false)
			setProfilePanelOpen(false)
			setNewChatPanelOpen(false)
		} else if (isMobile && !activeRoomId) {
			setActiveView('chats')
		}
	}, [activeRoomId, isMobile])

	const handleSelect = (roomId) => {
		setActiveRoomId(roomId)
		if (isMobile) {
			setSidebarOpen(false)
			setProfilePanelOpen(false)
			setNewChatPanelOpen(false)
			setActiveView('chat')
		}
	}

	const closeSidebar = () => {
		setSidebarOpen(false)
		setProfilePanelOpen(false)
		setNewChatPanelOpen(false)
		if (isMobile) {
			setActiveView(activeRoomId ? 'chat' : 'chats')
		}
	}

	const toggleSidebar = () => {
		if (isMobile) {
			setSidebarOpen(true)
			setProfilePanelOpen(false)
			setNewChatPanelOpen(false)
			setActiveView('chats')
		} else {
			setSidebarOpen(prev => {
				const next = !prev
				if (next) {
					setProfilePanelOpen(false)
					setNewChatPanelOpen(false)
				}
				return next
			})
		}
	}

	const toggleProfilePanel = () => {
		if (isMobile) {
			setProfilePanelOpen(true)
			setSidebarOpen(false)
			setNewChatPanelOpen(false)
			setActiveView('profile')
		} else {
			setProfilePanelOpen(prev => {
				if (prev) {
					setSidebarOpen(true)
					return false
				}
				setSidebarOpen(false)
				setNewChatPanelOpen(false)
				return true
			})
		}
	}

	const closeProfilePanel = () => {
		setProfilePanelOpen(false)
		if (isMobile) {
			setActiveView(activeRoomId ? 'chat' : 'chats')
			setSidebarOpen(!activeRoomId)
		} else {
			setSidebarOpen(true)
		}
	}

	const toggleNewChatPanel = () => {
		if (isMobile) {
			setNewChatPanelOpen(true)
			setSidebarOpen(false)
			setProfilePanelOpen(false)
			setActiveView('newchat')
		} else {
			setNewChatPanelOpen(prev => {
				if (prev) {
					setSidebarOpen(true)
					return false
				}
				setSidebarOpen(false)
				setProfilePanelOpen(false)
				return true
			})
		}
	}

	const closeNewChatPanel = () => {
		setNewChatPanelOpen(false)
		if (isMobile) {
			setActiveView(activeRoomId ? 'chat' : 'chats')
			setSidebarOpen(!activeRoomId)
		} else {
			setSidebarOpen(true)
		}
	}

	const handleNewGroupChat = async () => {
		// Trigger the group chat flow using the existing function
		const result = await startGroupChatWithUser({})
		if (result?.status === 'success' || result?.status === 'cancelled') {
			setNewChatPanelOpen(false)
			if (isMobile) {
				setActiveView(activeRoomId ? 'chat' : 'chats')
				setSidebarOpen(!activeRoomId)
			} else {
				setSidebarOpen(true)
			}
		}
	}

	const handleNewDirectChat = async (username) => {
		if (!username || !username.trim()) return
		try {
			await handleUsernameAction(username, 'direct')
			setNewChatPanelOpen(false)
			if (isMobile) {
				setActiveView(activeRoomId ? 'chat' : 'chats')
				setSidebarOpen(!activeRoomId)
			} else {
				setSidebarOpen(true)
			}
		} catch (err) {
			console.error('Failed to start direct chat:', err)
		}
	}

	const railWidth = 72
	const drawerWidth = 350

	const shellStyle = {
		width: railWidth,
		background: '#020617',
		borderRight: '1px solid #1f2937',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '16px 0',
		position: 'relative',
		zIndex: 30
	}

	const shellTopStyle = {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		gap: 12
	}

	const shellButtonStyle = {
		minWidth: 44,
		minHeight: 44,
		width: 44,
		height: 44,
		borderRadius: 16,
		border: '1px solid #1f2937',
		background: '#111827',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		cursor: 'pointer',
		boxShadow: '0 6px 18px rgba(15, 23, 42, 0.45)',
		touchAction: 'manipulation',
		transition: 'transform 0.1s, background 0.2s'
	}

	const hamburgerLineStyle = {
		width: 20,
		height: 2,
		background: '#e2e8f0',
		borderRadius: 999
	}

	const newChatIcon = (
		<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
				stroke="#cbd5f5"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M12 8v8M8 12h8"
				stroke="#cbd5f5"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)

	const settingsIcon = (
		<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.757.426 1.757 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.757-2.924 1.757-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.757-.426-1.757-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.607 2.286.07 2.572-1.065z"
				stroke="#94a3b8"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				stroke="#e2e8f0"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)

	const profileIcon = (
		<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M12 12c2.485 0 4.5-2.015 4.5-4.5S14.485 3 12 3 7.5 5.015 7.5 7.5 9.515 12 12 12z"
				stroke="#cbd5f5"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M5.25 20.25c0-3.728 3.022-6.75 6.75-6.75s6.75 3.022 6.75 6.75"
				stroke="#cbd5f5"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)

	// Mobile view switching logic
	const shouldShowSidebar = isMobile ? (activeView === 'chats' || activeView === 'profile' || activeView === 'newchat') : isSidebarOpen
	const shouldShowChatWindow = isMobile ? (activeView === 'chat') : true
	
	const chatAreaStyle = {
		marginLeft: isMobile ? 0 : railWidth,
		flex: 1,
		minHeight: '100vh',
		maxHeight: '100vh',
		height: '100vh',
		display: shouldShowChatWindow ? 'flex' : 'none',
		transition: 'margin-left 0.3s ease-in-out',
		overflow: 'hidden',
		width: isMobile ? `calc(100vw - ${railWidth}px)` : 'auto',
		boxSizing: 'border-box',
		position: isMobile ? 'absolute' : 'relative',
		top: isMobile ? 0 : 'auto',
		left: isMobile ? railWidth : 'auto',
		zIndex: isMobile ? 20 : 'auto'
	}

	return (
		<div style={{ display: 'flex', height: '100vh', background: '#0f172a', position: 'relative' }}>
			<div style={shellStyle}>
				<div style={shellTopStyle}>
					<button
						type="button"
						onClick={toggleSidebar}
						style={{ ...shellButtonStyle, flexDirection: 'column', gap: 6 }}
						aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
					>
						<span style={hamburgerLineStyle} />
						<span style={hamburgerLineStyle} />
						<span style={hamburgerLineStyle} />
					</button>
					<button
						type="button"
						onClick={toggleNewChatPanel}
						style={shellButtonStyle}
						aria-label="New chat"
					>
						{newChatIcon}
					</button>
					<button
						type="button"
						style={shellButtonStyle}
						aria-label="Open settings"
					>
						{settingsIcon}
					</button>
				</div>
				<button
					type="button"
					onClick={toggleProfilePanel}
					style={{
						minWidth: 48,
						minHeight: 48,
						width: 48,
						height: 48,
						borderRadius: 16,
						border: '1px solid #1f2937',
						background: '#1e293b',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						cursor: 'pointer',
						padding: 0,
						touchAction: 'manipulation',
						transition: 'transform 0.1s, background 0.2s'
					}}
					aria-label="Open profile"
				>
					{profileIcon}
				</button>
			</div>
			<Sidebar
				rooms={rooms}
				activeRoomId={activeRoomId}
				onSelect={handleSelect}
				onUsernameAction={handleUsernameAction}
				searchStatus={searchStatus}
				searchMessage={searchMessage}
				searchError={searchError}
				searchLoading={searchLoading}
				user={user}
				onLogout={logout}
				isOpen={shouldShowSidebar}
				isMobile={isMobile}
				onClose={closeSidebar}
				onToggleSidebar={toggleSidebar}
				railWidth={railWidth}
				drawerWidth={drawerWidth}
				isProfilePanelOpen={isProfilePanelOpen}
				onCloseProfilePanel={closeProfilePanel}
				isNewChatPanelOpen={isNewChatPanelOpen}
				onCloseNewChatPanel={closeNewChatPanel}
				onNewGroupChat={handleNewGroupChat}
				onNewDirectChat={handleNewDirectChat}
			/>
			<div style={chatAreaStyle}>
				<div style={{ flex: 1 }}>
					<ChatWindow
						room={activeRoom}
						messages={messages}
						onSend={sendMessage}
						onTyping={setTypingState}
						typing={activeTyping}
						meId={user.id}
						leftInset={isMobile ? 16 : (isSidebarOpen ? Math.max(drawerWidth - 16, 0) : 0)}
					/>
				</div>
			</div>
		</div>
	)
}




