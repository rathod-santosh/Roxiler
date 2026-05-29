const API_BASE = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    // Return structured validation error list or custom error message
    const errorMessage = data.message || 'An error occurred. Please try again.';
    const error = new Error(errorMessage);
    error.errors = data.errors || null;
    throw error;
  }
  return data;
};

export const api = {
  // Auth endpoints
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  signup: async (name, email, address, password, role = 'user') => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, address, password, role })
    });
    return handleResponse(res);
  },

  updatePassword: async (oldPassword, newPassword) => {
    const res = await fetch(`${API_BASE}/auth/update-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ oldPassword, newPassword })
    });
    return handleResponse(res);
  },

  // Admin endpoints
  admin: {
    getStats: async () => {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },

    addUser: async (userData) => {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData)
      });
      return handleResponse(res);
    },

    getStores: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/admin/stores?${query}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },

    getUsers: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/admin/users?${query}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },

    getUserDetails: async (id) => {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // Store endpoints
  store: {
    getDashboard: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/store/dashboard?${query}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // User endpoints
  user: {
    getStores: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/ratings/stores?${query}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },

    rateStore: async (storeId, rating) => {
      const res = await fetch(`${API_BASE}/ratings/rate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ storeId, rating })
      });
      return handleResponse(res);
    }
  }
};
