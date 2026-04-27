export const authService = {
	// Google OAuth
	loginWithGoogle: () => {
		window.location.href = '/api/auth/google'
		},
	
		// Email + password login
		login: async (email, password) => {
		const response = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
			userEmail: email,
			userPassword: password
			})
		})
	
		if (!response.ok) {
			throw new Error('Invalid email or password')
		}
	
		const data = await response.json()
		localStorage.setItem('token', data.token)
		return data
		},
	
		// Get current logged in user
		getMe: async () => {
		const token = localStorage.getItem('token')
		
		const response = await fetch('/api/auth/me', {
			headers: { 
			Authorization: `Bearer ${token}` 
			}
		})
	
		if (!response.ok) {
			throw new Error('Not authenticated')
		}
	
		return response.json()
		},
	
		// Logout
		logout: () => {
		localStorage.removeItem('token')
		window.location.href = '/login'
		},
	
		// Check if logged in
		isAuthenticated: () => {
		return !!localStorage.getItem('token')
		}
	}
