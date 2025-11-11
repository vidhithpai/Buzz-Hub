export default function Sidebar({ rooms, activeRoomId, onSelect, user, onLogout }) {
	return (
		<div style={{ borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', height: '100%' }}>
			<div style={{ padding: 16, borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<div>
					<div style={{ fontWeight: 600 }}>{user.name}</div>
					<div style={{ fontSize: 12, color: '#94a3b8' }}>{user.email}</div>
				</div>
				<button onClick={onLogout} style={{ background: '#ef4444', border: 0, color: 'white', padding: '6px 10px', borderRadius: 6 }}>Logout</button>
			</div>
			<div style={{ overflow: 'auto' }}>
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
			</div>
		</div>
	)
}




