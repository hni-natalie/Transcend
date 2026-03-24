const authService = {
  // google OAuth
  loginWithGoogle: () => {
    window.location.href = '/api/auth/google';
  },

  // email & password
  login: async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    // error if login fails (wrong password, etc)
    if (!response.ok) {
      throw new Error('Invalid email or password');
    }

    return response.json();
  },
};

export default authService;