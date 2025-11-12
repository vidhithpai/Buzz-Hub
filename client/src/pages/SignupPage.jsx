import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import { createApi } from '../lib/api.js'

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/i
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignupPage() {
	const nav = useNavigate()
	const { setToken, setUser } = useAuth()
	const api = createApi('')
	const [name, setName] = useState('')
	const [username, setUsername] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const onSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)
		setError('')
		try {
			const trimmedName = name.trim()
			const trimmedUsername = username.trim()
			const trimmedEmail = email.trim()
			if (!trimmedName) {
				setError('Name is required.')
				return
			}
			if (!USERNAME_REGEX.test(trimmedUsername)) {
				setError('Username must be 3-30 characters and can include letters, numbers, or underscores.')
				return
			}
			if (!EMAIL_REGEX.test(trimmedEmail)) {
				setError('Enter a valid email address.')
				return
			}
			const { token, user } = await api.signup({ name: trimmedName, username: trimmedUsername, email: trimmedEmail, password })
			setToken(token)
			setUser(user)
			nav('/')
		} catch (e) {
			const message = e?.response?.data?.message || 'Signup failed'
			setError(message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
			<form onSubmit={onSubmit} style={{ width: 360, display: 'grid', gap: 12, background: '#111827', padding: 24, borderRadius: 8 }}>
				<h2 style={{ margin: 0 }}>Create your ChatNexus account</h2>
				<input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={{ padding: 12, borderRadius: 6, border: '1px solid #374151', background: '#0b1220', color: '#e2e8f0' }} />
				<input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={{ padding: 12, borderRadius: 6, border: '1px solid #374151', background: '#0b1220', color: '#e2e8f0' }} />
				<input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: 12, borderRadius: 6, border: '1px solid #374151', background: '#0b1220', color: '#e2e8f0' }} />
				<input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: 12, borderRadius: 6, border: '1px solid #374151', background: '#0b1220', color: '#e2e8f0' }} />
				{error ? <div style={{ color: '#f87171' }}>{error}</div> : null}
				<button disabled={loading} style={{ padding: 12, borderRadius: 6, background: '#16a34a', border: 0, color: 'white' }}>
					{loading ? 'Creating...' : 'Create account'}
				</button>
				<div style={{ fontSize: 14 }}>Have an account? <Link to="/login" style={{ color: '#93c5fd' }}>Sign in</Link></div>
			</form>
		</div>
	)
}


