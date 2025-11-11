export default function Sidebar({ rooms, contacts, activeRoomId, onSelect, onStartChat, user, onLogout }) {
	return (
		<div style={{ borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', height: '100%' }}>
			<div style={{ padding: 16, borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<div>
					<div style={{ fontWeight: 600 }}>{user.name}</div>
					<div style={{ fontSize: 12, color: '#94a3b8' }}>{user.email}</div>
				</div>
				<button onClick={onLogout} style={{ background: '#ef4444', border: 0, color: 'white', padding: '6px 10px', borderRadius: 6 }}>Logout</button>
			</div>
			<div style={{ overflow: 'auto', flex: 1 }}>
				<div style={{ padding: '12px 12px 4px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, color: '#64748b' }}>Chats</div>
				{rooms.map(r => {
					const isActive = r._id === activeRoomId
					const title = r.isGroup ? (r.name || 'Group') : (r.participants.find(p => p._id !== user.id)?.name || 'Direct')
					const onlineCount = r.participants.filter(p => p.isOnline).length
					return (
						<div key={r._id} onClick={() => onSelect(r._id)} style={{ padding: 12, cursor: 'pointer', background: isActive ? '#0b1220' : 'transparent', borderBottom: '1px solid #111827' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								<div style={{ fontWeight: 600 }}>{title}</div>
								<div style={{ fontSize: 12, color: '#22c55e' }}>{onlineCount} online</div>
							</div>
							<div style={{ fontSize: 12, color: '#94a3b8' }}>{r.latestMessage?.content || 'No messages yet'}</div>
						</div>
					)
				})}
				<div style={{ padding: '12px 12px 4px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, color: '#64748b' }}>Contacts</div>
				{contacts.length === 0 ? (
					<div style={{ padding: 12, color: '#94a3b8', fontSize: 13 }}>Invite another user to start chatting.</div>
				) : contacts.map(contact => (
					<div key={contact._id} style={{ padding: 12, borderBottom: '1px solid #111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<div>
							<div style={{ fontWeight: 600 }}>{contact.name}</div>
							<div style={{ fontSize: 12, color: '#94a3b8' }}>{contact.email}</div>
						</div>
						<button onClick={() => onStartChat(contact._id)} style={{ background: '#2563eb', border: 0, color: 'white', padding: '6px 10px', borderRadius: 6 }}>Chat</button>
					</div>
				))}
			</div>
		</div>
	)
}




