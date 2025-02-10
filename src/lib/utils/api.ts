interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  details?: any;
  status?: number;
  success?: boolean;
  message?: string;
  shouldRedirect?: boolean;
}

export async function loginUser(email: string, password: string): Promise<ApiResponse> {
  try {
    console.log('Sending login request for:', email);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    // Get response text first for debugging
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    // Parse JSON response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', e);
      return {
        error: 'Invalid server response',
        status: 500
      };
    }

    // Handle error responses
    if (!response.ok) {
      console.error('Login failed:', data?.error || response.statusText);
      return {
        error: data?.error || 'Login failed',
        status: response.status
      };
    }

    // Store user info in localStorage
    if (data.user) {
      localStorage.setItem('user', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name
      }));
    }

    // Store token in localStorage if provided
    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    return { 
      data,
      status: response.status 
    };

  } catch (error) {
    console.error('Login error:', error);
    return { 
      error: error instanceof Error ? error.message : 'Network error',
      status: 500
    };
  }
}

export async function registerUser(userData: {
  email: string;
  password: string;
  name?: string;
  company?: string;
}): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include', // Important for cookies
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    return { 
      data,
      status: response.status 
    };
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : 'Registration failed',
      status: 500
    };
  }
}

export async function logoutUser() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}

export function getAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('token');
}

export function getCurrentUser() {
  if (typeof window === 'undefined') {
    return null;
  }
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Authenticated API request helper
export async function fetchWithAuth<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    let token;
    
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    } else {
      // Server-side'da çalışırken cookie'den token'ı al
      const cookies = require('next/headers').cookies;
      const cookieStore = cookies();
      token = cookieStore.get('auth_token')?.value;
    }
    
    if (!token) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('No authentication token found');
    }

    // Remove leading /api if present to prevent double /api prefix
    const cleanEndpoint = endpoint.startsWith('/api/') ? endpoint.substring(4) : endpoint;
    const url = `/api/${cleanEndpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Cookie'leri de gönder
    });

    if (!response.ok) {
      // Try to parse error response
      let errorMessage = 'API request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        
        // 401 durumunda login sayfasına yönlendir
        if (response.status === 401 && typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } catch (e) {
        // If parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response format: Expected JSON');
    }

    const responseText = await response.text();
    let data;

    try {
      data = responseText ? JSON.parse(responseText) : null;
      console.log('Parsed response data:', data);
      return data as T;
    } catch (e) {
      console.error('Failed to parse response:', e);
      console.error('Raw response:', responseText);
      throw new Error('Invalid JSON response from server');
    }
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
} 