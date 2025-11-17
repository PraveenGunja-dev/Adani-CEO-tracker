import { useState, useEffect } from 'react';

interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // In a real app, you would validate the token with your backend
      // For now, we'll just check if it exists
      const userData = localStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data and token (in a real app)
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.setItem('authToken', 'dummy-token'); // Store a dummy token for now
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data and token (in a real app)
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.setItem('authToken', 'dummy-token'); // Store a dummy token for now
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
  };
}