import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import { createApi } from '../lib/api.js'

export default function SignupPage() {
	const nav = useNavigate()
	const { setToken, setUser } = useAuth()
	const api = createApi('')
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const onSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)
		setError('')
		try {
			const { token, user } = await api.signup({ name, email, password })
			setToken(token)
			setUser(user)
			nav('/')
		} catch (e) {
			setError('Signup failed')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
			<form onSubmit={onSubmit} style={{ width: 360, display: 'grid', gap: 12, background: '#111827', padding: 24, borderRadius: 8 }}>
				<h2 style={{ margin: 0 }}>Create your ChatNexus account</h2>
				<input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={{ padding: 12, borderRadius: 6, border: '1px solid #374151', background: '#0b1220', color: '#e2e8f0' }} />
				<input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: 12, borderRadius: 6, border: '1px solid #374151', background: '#0b1220', color: '#e2e8f0' }} />
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


