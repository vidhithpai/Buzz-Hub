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
	drawerWidth = 320,
	isProfilePanelOpen = false,
	onCloseProfilePanel,
	isNewChatPanelOpen = false,
	onCloseNewChatPanel,
	onNewGroupChat,
	onNewDirectChat
}) {
	const [usernameInput, setUsernameInput] = useState('');
	const [newChatSearchInput, setNewChatSearchInput] = useState('');
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
	const isSidebarVisible = isOpen || isProfilePanelOpen || isNewChatPanelOpen;
	const containerStyles = {
		position: 'fixed',
		top: 0,
		left: isMobile ? 0 : railWidth,
		width: sidebarWidth,
		minWidth: sidebarWidth,
		maxWidth: sidebarWidth,
		height: '100vh',
		borderRight: '1px solid #1f2937',
		display: 'flex',
		flexDirection: 'column',
		background: '#020617',
		overflow: 'hidden',
		zIndex: 25,
		boxSizing: 'border-box',
		overflowX: 'hidden',
		transform: isSidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
		transition: 'transform 0.3s ease-in-out',
		boxShadow: isSidebarVisible ? '4px 0 12px rgba(15, 23, 42, 0.4)' : 'none'
	};

	const handleSelect = (roomId) => {
		onSelect(roomId);
		if (isMobile && typeof onClose === 'function') {
			onClose();
		}
	};

	const aboutMessage = typeof user.about === 'string' && user.about.trim() ? user.about.trim() : 'Hey there! I am using this app.';
	const profileSections = [
		{ label: 'Name', value: user.name || 'Not provided' },
		{ label: 'Username', value: user.username ? `@${user.username}` : 'Not provided' },
		{ label: 'Email', value: user.email || 'Not provided' },
		{ label: 'About', value: aboutMessage }
	];

	const profileIcon = (
		<svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
	);

	const backArrowIcon = (
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M19 12H5M5 12l6-6M5 12l6 6"
				stroke="#e2e8f0"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);

	return (
		<>
			{isMobile && (isOpen || isProfilePanelOpen || isNewChatPanelOpen) ? (
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
				{/* New Chat Panel */}
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: '#020617',
						transform: isNewChatPanelOpen ? 'translateX(0)' : 'translateX(-100%)',
						transition: 'transform 0.3s ease-in-out',
						zIndex: 30,
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden',
						width: '100%'
					}}
				>
					{/* New Chat Panel Header */}
					<div
						style={{
							padding: '16px 20px',
							borderBottom: '1px solid #1f2937',
							display: 'flex',
							alignItems: 'center',
							gap: 16,
							background: '#0f172a',
							position: 'sticky',
							top: 0,
							zIndex: 1
						}}
					>
						<button
							type="button"
							onClick={onCloseNewChatPanel}
							style={{
								width: 40,
								height: 40,
								borderRadius: 12,
								border: '1px solid #1f2937',
								background: '#111827',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								cursor: 'pointer',
								padding: 0
							}}
							aria-label="Back to chats"
						>
							{backArrowIcon}
						</button>
						<div style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>New chat</div>
					</div>

					{/* New Chat Panel Content */}
					<div
						style={{
							flex: 1,
							overflowY: 'auto',
							display: 'flex',
							flexDirection: 'column',
							width: '100%',
							boxSizing: 'border-box'
						}}
					>
						{/* Search Bar */}
						<div style={{ padding: '12px 16px', borderBottom: '1px solid #1f2937' }}>
							<input
								type="text"
								placeholder="Search name or number"
								value={newChatSearchInput}
								onChange={(e) => setNewChatSearchInput(e.target.value)}
								style={{
									width: '100%',
									padding: '10px 16px',
									borderRadius: 8,
									border: '1px solid #1f2937',
									background: '#0b1220',
									color: '#e2e8f0',
									fontSize: 14,
									boxSizing: 'border-box'
								}}
							/>
						</div>

						{/* New Group Option */}
						<div
							onClick={onNewGroupChat}
							style={{
								padding: '16px 20px',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: 16,
								borderBottom: '1px solid #1f2937',
								transition: 'background 0.2s'
							}}
							onMouseEnter={(e) => e.currentTarget.style.background = '#0b1220'}
							onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
						>
							<div
								style={{
									width: 48,
									height: 48,
									borderRadius: '50%',
									background: '#1e293b',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0
								}}
							>
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path
										d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
										stroke="#cbd5f5"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
									<circle cx="9" cy="7" r="4" stroke="#cbd5f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									<path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#cbd5f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</div>
							<div style={{ flex: 1 }}>
								<div style={{ fontSize: 16, fontWeight: 500, color: '#e2e8f0' }}>New group</div>
							</div>
						</div>

						{/* New Direct Chat Option */}
						<div
							onClick={() => {
								if (newChatSearchInput.trim()) {
									onNewDirectChat(newChatSearchInput.trim());
								}
							}}
							style={{
								padding: '16px 20px',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: 16,
								borderBottom: '1px solid #1f2937',
								transition: 'background 0.2s',
								opacity: newChatSearchInput.trim() ? 1 : 0.5
							}}
							onMouseEnter={(e) => {
								if (newChatSearchInput.trim()) {
									e.currentTarget.style.background = '#0b1220';
								}
							}}
							onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
						>
							<div
								style={{
									width: 48,
									height: 48,
									borderRadius: '50%',
									background: '#1e293b',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0
								}}
							>
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path
										d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
										stroke="#cbd5f5"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
									<circle cx="12" cy="7" r="4" stroke="#cbd5f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</div>
							<div style={{ flex: 1 }}>
								<div style={{ fontSize: 16, fontWeight: 500, color: '#e2e8f0' }}>New direct chat</div>
								{newChatSearchInput.trim() ? (
									<div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Start chat with: {newChatSearchInput.trim()}</div>
								) : null}
							</div>
						</div>
					</div>
				</div>

				{/* Profile Panel */}
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: '#020617',
						transform: isProfilePanelOpen ? 'translateX(0)' : 'translateX(-100%)',
						transition: 'transform 0.3s ease-in-out',
						zIndex: 30,
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden',
						width: '100%',
						boxSizing: 'border-box'
					}}
				>
					{/* Profile Panel Header */}
					<div
						style={{
							padding: '16px 20px',
							borderBottom: '1px solid #1f2937',
							display: 'flex',
							alignItems: 'center',
							gap: 16,
							background: '#0f172a',
							position: 'sticky',
							top: 0,
							zIndex: 1
						}}
					>
						<button
							type="button"
							onClick={() => onCloseProfilePanel?.()}
							style={{
								width: 40,
								height: 40,
								borderRadius: 12,
								border: '1px solid #1f2937',
								background: '#111827',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								cursor: 'pointer',
								padding: 0
							}}
							aria-label="Close profile"
						>
							{backArrowIcon}
						</button>
						<div style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>Profile</div>
					</div>

					{/* Profile Panel Content */}
					<div
						style={{
							flex: 1,
							overflowY: 'auto',
							padding: '32px 24px',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							width: '100%',
							boxSizing: 'border-box'
						}}
					>
						{/* Large Profile Icon */}
						<div
							style={{
								width: 200,
								height: 200,
								borderRadius: '50%',
								border: '4px solid #1f2937',
								background: '#1e293b',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								marginBottom: 32,
								boxShadow: '0 8px 24px rgba(15, 23, 42, 0.6)'
							}}
						>
							{profileIcon}
						</div>

						{/* User Details */}
						<div
							style={{
								width: '100%',
								display: 'flex',
								flexDirection: 'column',
								gap: 20,
								padding: '0 4px',
								boxSizing: 'border-box'
							}}
						>
							{profileSections.map((section, index) => {
								const isLast = index === profileSections.length - 1;
								return (
									<div
										key={section.label}
										style={{
											paddingBottom: isLast ? 0 : 20,
											borderBottom: isLast ? 'none' : '1px solid rgba(71, 85, 105, 0.25)'
										}}
									>
										<div
											style={{
												fontSize: 12,
												color: '#94a3b8',
												textTransform: 'uppercase',
												letterSpacing: 0.6,
												fontWeight: 500
											}}
										>
											{section.label}
										</div>
										<div
											style={{
												marginTop: 6,
												fontSize: 18,
												color: '#f8fafc',
												fontWeight: 500,
												lineHeight: 1.4,
												width: '100%',
												boxSizing: 'border-box'
											}}
										>
											{section.value}
										</div>
									</div>
								);
							})}
						</div>

						{/* Logout Button */}
						<div style={{ width: '100%', marginTop: 40, padding: '0 4px', boxSizing: 'border-box' }}>
							<button
								type="button"
								onClick={onLogout}
								style={{
									width: '100%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: 10,
									padding: '12px 16px',
									borderRadius: 10,
									border: '1px solid rgba(239, 68, 68, 0.4)',
									background: 'rgba(239, 68, 68, 0.08)',
									color: '#f87171',
									fontWeight: 600,
									cursor: 'pointer',
									transition: 'background 0.2s, border 0.2s'
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)';
									e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.6)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
									e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.4)';
								}}
							>
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path
										d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
										stroke="currentColor"
										strokeWidth="1.6"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
									<path
										d="M10 17l5-5-5-5"
										stroke="currentColor"
										strokeWidth="1.6"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
									<path
										d="M15 12H3"
										stroke="currentColor"
										strokeWidth="1.6"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
								<span>Logout</span>
							</button>
						</div>
					</div>
				</div>

				{/* Main Sidebar Content */}
				<div
					style={{
						opacity: (isProfilePanelOpen || isNewChatPanelOpen) ? 0 : 1,
						transition: 'opacity 0.2s ease-in-out',
						display: 'flex',
						flexDirection: 'column',
						height: '100%',
						width: '100%',
						pointerEvents: (isProfilePanelOpen || isNewChatPanelOpen) ? 'none' : 'auto'
					}}
				>
					{/* Header with Logout button (only on mobile) */}
					{isMobile ? (
						<div
							style={{
								padding: 16,
								borderBottom: '1px solid #1f2937',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'flex-end',
								gap: 8,
								position: 'sticky',
								top: 0,
								background: '#0f172a',
								zIndex: 1,
								boxShadow: '0 2px 4px rgba(15, 23, 42, 0.4)',
								width: '100%',
								boxSizing: 'border-box'
							}}
						>
							<button
								type="button"
								onClick={onClose}
								style={{ background: '#1f2937', border: 0, color: '#e2e8f0', padding: '6px 10px', borderRadius: 6 }}
								aria-label="Close sidebar"
							>
								Close
							</button>
							<button
								type="button"
								onClick={onLogout}
								style={{ background: '#ef4444', border: 0, color: 'white', padding: '6px 10px', borderRadius: 6 }}
							>
								Logout
							</button>
						</div>
					) : null}
					<div style={{ overflowY: 'auto', flex: 1, paddingBottom: 24, width: '100%', boxSizing: 'border-box' }}>
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
					</div>
				</div>
			</div>
		</>
	);
}




