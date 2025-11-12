import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

export function createApi(token) {
	const instance = axios.create({
		baseURL: API_BASE,
		headers: token ? { Authorization: `Bearer ${token}` } : {}
	})
	return {
		signup: (data) => instance.post('/auth/signup', data).then(r => r.data),
		login: (data) => instance.post('/auth/login', data).then(r => r.data),
		me: () => instance.get('/auth/me').then(r => r.data),
		listChats: () => instance.get('/chats').then(r => r.data),
		createPrivate: (participantId) => instance.post('/chats/private', { participantId }).then(r => r.data),
		createGroup: (name, participantIds) => instance.post('/chats/group', { name, participantIds }).then(r => r.data),
		getMessages: (roomId) => instance.get(`/chats/${roomId}/messages`).then(r => r.data),
		sendMessage: (payload) => instance.post('/messages', payload).then(r => r.data),
		listUsers: () => instance.get('/users').then(r => r.data),
		searchUser: (username) => instance.get('/users/search', { params: { username } }).then(r => r.data)
	}
}




