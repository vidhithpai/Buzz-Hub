import { useEffect, useState } from 'react';

export default function Sidebar({
	rooms,
	activeRoomId,
	onSelect,
	onUsernameAction,
	searchStatus,
	searchMessage,
	searchError,
	searchLoading,
	user,
	onLogout
}) {
	const [usernameInput, setUsernameInput] = useState('');
	const usernameLabel = user.username ? `@${user.username}` : '';

	useEffect(() => {
		if (searchStatus === 'success') {
			setUsernameInput('');
		}
	}, [searchStatus]);

	const otherParticipantInfo = (room) => {
		const other = room.participants.find((p) => p._id !== user.id);
		if (!other) return { title: 'Direct', subtitle: '' };
		const title = other.name || `@${other.username}` || 'Direct';
		const subtitle = other.name ? `@${other.username}` : '';
		return { title, subtitle };
	};

	const handleAction = (type) => {
		const trimmed = usernameInput.trim();
		if (!trimmed) return;
		onUsernameAction(trimmed, type);
	};

	return (
		<div style={{ borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', height: '100%' }}>
			<div style={{ padding: 16, borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<div>
					<div style={{ fontWeight: 600 }}>{user.name}</div>
					{usernameLabel ? <div style={{ fontSize: 12, color: '#94a3b8' }}>{usernameLabel}</div> : null}
					<div style={{ fontSize: 12, color: '#94a3b8' }}>{user.email}</div>
				</div>
				<button onClick={onLogout} style={{ background: '#ef4444', border: 0, color: 'white', padding: '6px 10px', borderRadius: 6 }}>Logout</button>
			</div>
			<div style={{ overflow: 'auto', flex: 1 }}>
				<div style={{ padding: '12px 12px 4px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, color: '#64748b' }}>Chats</div>
				{rooms.map((room) => {
					const isActive = room._id === activeRoomId;
					const onlineCount = room.participants.filter((p) => p.isOnline).length;
					const { title, subtitle } = room.isGroup ? { title: room.name || 'Group', subtitle: '' } : otherParticipantInfo(room);
					return (
						<div
							key={room._id}
							onClick={() => onSelect(room._id)}
							style={{ padding: 12, cursor: 'pointer', background: isActive ? '#0b1220' : 'transparent', borderBottom: '1px solid #111827' }}
						>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<div>
									<div style={{ fontWeight: 600 }}>{title}</div>
									{subtitle ? <div style={{ fontSize: 12, color: '#94a3b8' }}>{subtitle}</div> : null}
								</div>
								<div style={{ fontSize: 12, color: '#22c55e' }}>{onlineCount} online</div>
							</div>
							<div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{room.latestMessage?.content || 'No messages yet'}</div>
						</div>
					);
				})}
				<div style={{ padding: '12px 12px 4px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, color: '#64748b' }}>Start a chat</div>
				<div style={{ padding: 12, borderBottom: '1px solid #111827', display: 'grid', gap: 8 }}>
					<input
						placeholder="Enter username"
						value={usernameInput}
						onChange={(e) => setUsernameInput(e.target.value)}
						style={{ padding: 12, borderRadius: 6, border: '1px solid #374151', background: '#0b1220', color: '#e2e8f0' }}
						disabled={searchLoading}
					/>
					<div style={{ display: 'flex', gap: 8 }}>
						<button
							type="button"
							onClick={() => handleAction('direct')}
							disabled={searchLoading}
							style={{ flex: 1, padding: '10px 12px', borderRadius: 6, background: '#2563eb', border: 0, color: 'white' }}
						>
							{searchLoading ? 'Searching...' : 'Start Direct Chat'}
						</button>
						<button
							type="button"
							onClick={() => handleAction('group')}
							disabled={searchLoading}
							style={{ flex: 1, padding: '10px 12px', borderRadius: 6, background: '#7c3aed', border: 0, color: 'white' }}
						>
							{searchLoading ? 'Searching...' : 'Start Group Chat'}
						</button>
					</div>
					{searchError ? <div style={{ color: '#f87171', fontSize: 13 }}>{searchError}</div> : null}
					{!searchError && searchMessage ? <div style={{ color: '#34d399', fontSize: 13 }}>{searchMessage}</div> : null}
				</div>
			</div>
		</div>
	);
}




