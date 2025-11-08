import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest, apiUrl } from '@/config/api';

interface Domain {
  id: number;
  name: string;
  description?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  domain_id?: number;
  domain?: Domain;
  level?: string;
  subscription_type: string;
  subscription_status: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          // Set token and user immediately to prevent flickering
          setToken(storedToken);
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Verify token in the background
          await verifyToken(storedToken);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          // If we can't parse user, clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(apiUrl('api/auth/me'), {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Update user with fresh data from server
        setUser(data.user);
        // Update localStorage with fresh user data
        localStorage.setItem('user', JSON.stringify(data.user));
        // Ensure token is set
        setToken(tokenToVerify);
        localStorage.setItem('token', tokenToVerify);
      } else if (response.status === 401 || response.status === 403) {
        // Only clear on authentication errors (token expired/invalid)
        console.log('Token expired or invalid, clearing session');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } else {
        // For other errors (500, network, etc.), keep the session
        // The user data is already loaded from localStorage
        console.warn('Token verification failed with status:', response.status, '- keeping session');
        // Don't clear - keep the user logged in with cached data
      }
    } catch (error: any) {
      // Network error or timeout - don't clear session, user might be offline
      // Keep the stored user data that was already loaded from localStorage
      if (error.name === 'AbortError') {
        console.warn('Token verification timed out (keeping session - user may be offline)');
      } else {
        console.warn('Token verification network error (keeping session - user may be offline):', error.message);
      }
      // Don't clear the session on network errors - user stays logged in with cached data
      // The user and token are already set from localStorage, so we just continue
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest('api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        // Ensure loading is false after successful login
        setLoading(false);
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await apiRequest('api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Auto login after registration
      await login(email, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

