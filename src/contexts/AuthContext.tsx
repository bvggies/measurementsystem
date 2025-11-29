import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '../utils/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'tailor' | 'customer';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      // localStorage might not be available (e.g., in iframe, private browsing)
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token: newToken, user: newUser } = response.data;

      setToken(newToken);
      setUser(newUser);
      try {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        // Continue even if localStorage fails
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      // Better error handling
      let errorMessage = 'Login failed';
      
      if (error?.response) {
        // Server responded with error
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data?.error) {
          errorMessage = String(data.error);
        } else if (data?.message) {
          errorMessage = String(data.message);
        } else {
          errorMessage = `Server error: ${error.response.status}`;
        }
      } else if (error?.request) {
        // Request made but no response (404, network error, etc.)
        if (error.code === 'ERR_NETWORK' || error.message?.includes('404')) {
          errorMessage = 'API endpoint not found. Please check your deployment.';
        } else {
          errorMessage = 'Unable to connect to server. Please check your connection.';
        }
      } else if (error?.message) {
        errorMessage = String(error.message);
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = 'An unexpected error occurred during login.';
      }
      
      console.error('Login error details:', {
        error,
        message: errorMessage,
        response: error?.response,
        request: error?.request,
      });
      
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

