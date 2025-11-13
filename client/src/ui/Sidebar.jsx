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
	onLogout,
	isOpen = true,
	isMobile = false,
	onClose,
	onToggleSidebar,
	railWidth = 0,
	drawerWidth = 320
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

	const sidebarWidth = isMobile ? 'min(320px, 80vw)' : drawerWidth;
	const containerStyles = {
		position: 'fixed',
		top: 0,
		left: isMobile ? 0 : railWidth,
		width: sidebarWidth,
		height: '100vh',
		borderRight: '1px solid #1f2937',
		display: 'flex',
		flexDirection: 'column',
		background: '#020617',
		overflow: 'hidden',
		zIndex: 25,
		transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
		transition: 'transform 0.3s ease-in-out',
		boxShadow: isOpen ? '4px 0 12px rgba(15, 23, 42, 0.4)' : 'none'
	};

	const hamburgerButtonStyles = {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		width: 42,
		height: 42,
		borderRadius: 12,
		border: '1px solid #1f2937',
		background: '#111827',
		cursor: 'pointer',
		gap: 6,
		flexShrink: 0
	};

	const hamburgerLineStyles = {
		width: 18,
		height: 2,
		background: '#e2e8f0',
		borderRadius: 999
	};

	const handleSelect = (roomId) => {
		onSelect(roomId);
		if (isMobile && typeof onClose === 'function') {
			onClose();
		}
	};

	const handleToggleClick = () => {
		if (typeof onToggleSidebar === 'function') {
			onToggleSidebar();
		}
	};

	return (
		<>
			{isMobile && isOpen ? (
				<div
					onClick={onClose}
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(15, 23, 42, 0.6)',
						zIndex: 15
					}}
				/>
			) : null}
			<div style={containerStyles}>
				<div
					style={{
						padding: 16,
						borderBottom: '1px solid #1f2937',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 16,
						position: 'sticky',
						top: 0,
						background: '#0f172a',
						zIndex: 1,
						boxShadow: '0 2px 4px rgba(15, 23, 42, 0.4)'
					}}
				>
					<button
						type="button"
						onClick={handleToggleClick}
						style={hamburgerButtonStyles}
						aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
					>
						<span style={hamburgerLineStyles} />
						<span style={hamburgerLineStyles} />
						<span style={hamburgerLineStyles} />
					</button>
					<div style={{ flex: 1, minWidth: 0 }}>
						<div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
						{usernameLabel ? <div style={{ fontSize: 12, color: '#94a3b8' }}>{usernameLabel}</div> : null}
						<div style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
					</div>
					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						{isMobile ? (
							<button
								type="button"
								onClick={onClose}
								style={{ background: '#1f2937', border: 0, color: '#e2e8f0', padding: '6px 10px', borderRadius: 6 }}
								aria-label="Close sidebar"
							>
								Close
							</button>
						) : null}
						<button
							type="button"
							onClick={onLogout}
							style={{ background: '#ef4444', border: 0, color: 'white', padding: '6px 10px', borderRadius: 6 }}
						>
							Logout
						</button>
					</div>
				</div>
				<div style={{ overflowY: 'auto', flex: 1, paddingBottom: 24 }}>
					<div style={{ padding: '12px 12px 4px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, color: '#64748b' }}>Chats</div>
					{rooms.map((room) => {
						const isActive = room._id === activeRoomId;
						const onlineCount = room.participants.filter((p) => p.isOnline).length;
						const { title, subtitle } = room.isGroup ? { title: room.name || 'Group', subtitle: '' } : otherParticipantInfo(room);
						return (
							<div
								key={room._id}
								onClick={() => handleSelect(room._id)}
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
		</>
	);
}




