import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import { AuthProvider, useAuth } from './state/AuthContext.jsx'

function PrivateRoute({ children }) {
	const { token } = useAuth()
	return token ? children : <Navigate to="/login" replace />
}

export default function App() {
	return (
		<AuthProvider>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/signup" element={<SignupPage />} />
				<Route path="/" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
			</Routes>
		</AuthProvider>
	)
}




