import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && window.location.port === '5173' 
    ? 'http://localhost:8000' 
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000'));

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const defaultMockData = {
  customers: [],
  drivers: [],
  bookings: [],
  wages: [],
  fuel: [],
  expenses: [],
  payments: [],
  maintenance: [],
  dashboardStats: {
    total_customers: 0,
    todays_bookings: 0,
    todays_earnings: 0,
    pending_payments: 0,
    fuel_expense: 0,
    maintenance_expense: 0,
    total_income: 0,
    profit: 0,
    recent_bookings: [],
    work_types: [],
    income_overview: [],
  },
  reportsStats: {
    total_income: 0,
    total_expenses: 0,
    net_profit: 0,
    profit_percent: 0,
    expense_breakdown: [],
    total_bookings: 0,
    completed_bookings: 0,
    canceled_bookings: 0,
    monthly_income: [
      { month: 'Jan', income: 0 },
      { month: 'Feb', income: 0 },
      { month: 'Mar', income: 0 },
      { month: 'Apr', income: 0 },
      { month: 'May', income: 0 },
      { month: 'Jun', income: 0 },
      { month: 'Jul', income: 0 },
      { month: 'Aug', income: 0 },
      { month: 'Sep', income: 0 },
      { month: 'Oct', income: 0 },
      { month: 'Nov', income: 0 },
      { month: 'Dec', income: 0 },
    ],
  },
};

const savedMock = localStorage.getItem('twms-mock-data');
export const MOCK_DATA = savedMock ? JSON.parse(savedMock) : defaultMockData;

const saveMockDataToStorage = () => {
  localStorage.setItem('twms-mock-data', JSON.stringify(MOCK_DATA));
};


let isDemoMode = false;
let loggedInUserRole = localStorage.getItem('twms-role') || 'Owner';
let loggedInUserCustomerProfile = localStorage.getItem('twms-customer-profile') ? parseInt(localStorage.getItem('twms-customer-profile')) : null;

export const saveUserSession = (role, customerProfile) => {
  loggedInUserRole = role;
  loggedInUserCustomerProfile = customerProfile;
  localStorage.setItem('twms-role', role || 'Owner');
  if (customerProfile) {
    localStorage.setItem('twms-customer-profile', customerProfile.toString());
  } else {
    localStorage.removeItem('twms-customer-profile');
  }
};

export const setDemoMode = (value) => {
  isDemoMode = value;
};

export const getDemoMode = () => {
  return isDemoMode;
};

// Wrapper function to execute API calls with transparent Mock fallback
const apiCall = async (method, url, data = null) => {
  if (isDemoMode) {
    return handleMock(method, url, data);
  }

  // Set auth token on client dynamically
  const token = localStorage.getItem('twms-token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    const response = await client({ method, url, data, headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Clear token and reload to force login page redirection
      localStorage.removeItem('twms-token');
      window.location.reload();
      throw error;
    }
    console.warn(`API error on ${url}, switching to DEMO/MOCK mode:`, error);
    isDemoMode = true; // Auto-fallback
    if (window.onDemoModeTriggered) {
      window.onDemoModeTriggered(true);
    }
    return handleMock(method, url, data);
  }
};

// Router for mock requests
const handleMock = (method, url, data) => {
  const parts = url.split('/').filter(p => p);
  const resource = parts[1]; // /api/customers/ -> parts = ['api', 'customers']
  
  if (url.includes('dashboard/stats')) {
    if (loggedInUserRole === 'Customer') {
      const custBookings = MOCK_DATA.bookings.filter(b => b.customer === loggedInUserCustomerProfile);
      return {
        role: 'Customer',
        total_bookings: custBookings.length,
        todays_bookings: custBookings.filter(b => b.date === '2026-06-20').length,
        pending_payments: MOCK_DATA.payments.filter(p => p.customer === loggedInUserCustomerProfile).reduce((sum, item) => sum + parseFloat(item.pending || 0), 0),
        total_paid: MOCK_DATA.payments.filter(p => p.customer === loggedInUserCustomerProfile).reduce((sum, item) => sum + parseFloat(item.paid || 0), 0),
        recent_bookings: custBookings.slice(0, 5),
      };
    }
    return MOCK_DATA.dashboardStats;
  }
  if (url.includes('reports/stats')) {
    if (loggedInUserRole === 'Customer') {
      throw { response: { status: 403, data: { detail: 'Permission denied.' } } };
    }
    return MOCK_DATA.reportsStats;
  }

  if (!resource || !MOCK_DATA[resource]) {
    return { detail: 'Not Found' };
  }

  // Filter lists based on role
  let list = MOCK_DATA[resource];
  if (loggedInUserRole === 'Customer') {
    if (resource === 'bookings') {
      list = list.filter(b => b.customer === loggedInUserCustomerProfile);
    } else if (resource === 'payments') {
      list = list.filter(p => p.customer === loggedInUserCustomerProfile);
    } else if (['drivers', 'wages', 'fuel', 'expenses', 'maintenance', 'customers'].includes(resource)) {
      // Deny access in mock mode for other pages
      throw { response: { status: 403, data: { detail: 'Permission denied.' } } };
    }
  }

  if (method === 'get') {
    if (parts[2]) {
      const id = parseInt(parts[2]);
      const item = list.find(item => item.id === id);
      return item || { detail: 'Not Found' };
    }
    return list;
  }

  if (method === 'post') {
    // 1. Conflict check for bookings
    if (resource === 'bookings') {
      const drvId = parseInt(data.driver);
      const bookingDate = data.date;
      if (drvId && data.status !== 'Canceled') {
        const conflict = MOCK_DATA.bookings.find(b => 
          b.driver === drvId && 
          b.date === bookingDate && 
          b.status !== 'Canceled'
        );
        if (conflict) {
          throw {
            response: {
              status: 400,
              data: { driver: [`Driver is already booked for another job on ${bookingDate}.`] }
            }
          };
        }
      }
    }

    const newItem = {
      id: list.length > 0 ? Math.max(...MOCK_DATA[resource].map(i => i.id)) + 1 : 1,
      ...data
    };

    // Add helper metadata fields
    if (resource === 'bookings') {
      const custId = loggedInUserRole === 'Customer' ? loggedInUserCustomerProfile : parseInt(data.customer);
      newItem.customer = custId;
      const cust = MOCK_DATA.customers.find(c => c.id === custId);
      newItem.customer_name = cust ? cust.name : 'Unknown';
      const drv = MOCK_DATA.drivers.find(d => d.id === parseInt(data.driver));
      newItem.driver_name = drv ? drv.name : 'None';
      newItem.total_amount = parseFloat(newItem.acres_hours || 0) * parseFloat(newItem.rate || 0);
    }
    if (resource === 'wages') {
      const drv = MOCK_DATA.drivers.find(d => d.id === parseInt(data.driver));
      newItem.driver_name = drv ? drv.name : 'Unknown';
      newItem.total_wage = (parseInt(newItem.days_worked || 1) * parseFloat(newItem.daily_wage || 0)) + parseFloat(newItem.allowance || 0);
      newItem.remaining = newItem.total_wage - parseFloat(newItem.advance_given || 0);
    }
    if (resource === 'fuel') {
      const drv = MOCK_DATA.drivers.find(d => d.id === parseInt(data.driver));
      newItem.driver_name = drv ? drv.name : 'Unknown';
      newItem.total_amount = parseFloat(newItem.litres || 0) * parseFloat(newItem.price_per_litre || 0);
    }
    if (resource === 'payments') {
      const cust = MOCK_DATA.customers.find(c => c.id === parseInt(data.customer));
      newItem.customer_name = cust ? cust.name : 'Unknown';
      newItem.pending = parseFloat(newItem.total_amount || 0) - parseFloat(newItem.paid || 0);
    }

    MOCK_DATA[resource].unshift(newItem);
    updateDashboardStatsDynamically(resource, newItem);
    saveMockDataToStorage();
    return newItem;
  }

  if (method === 'delete') {
    const id = parseInt(parts[2]);
    const index = MOCK_DATA[resource].findIndex(item => item.id === id);
    if (index !== -1) {
      MOCK_DATA[resource].splice(index, 1);
      saveMockDataToStorage();
      return { success: true };
    }
    return { detail: 'Not Found' };
  }

  if (method === 'patch' || method === 'put') {
    const id = parseInt(parts[2]);
    const item = MOCK_DATA[resource].find(item => item.id === id);
    if (!item) {
      return { detail: 'Not Found' };
    }

    // Booking Conflict check on update
    if (resource === 'bookings' && data.driver) {
      const drvId = parseInt(data.driver);
      const bookingDate = data.date || item.date;
      if (drvId && data.status !== 'Canceled') {
        const conflict = MOCK_DATA.bookings.find(b => 
          b.id !== id &&
          b.driver === drvId && 
          b.date === bookingDate && 
          b.status !== 'Canceled'
        );
        if (conflict) {
          throw {
            response: {
              status: 400,
              data: { driver: [`Driver is already booked for another job on ${bookingDate}.`] }
            }
          };
        }
      }
    }

    Object.assign(item, data);

    if (resource === 'bookings') {
      if (data.customer) {
        const cust = MOCK_DATA.customers.find(c => c.id === parseInt(data.customer));
        item.customer_name = cust ? cust.name : 'Unknown';
      }
      if (data.driver !== undefined) {
        if (data.driver) {
          const drv = MOCK_DATA.drivers.find(d => d.id === parseInt(data.driver));
          item.driver_name = drv ? drv.name : 'None';
        } else {
          item.driver_name = 'None';
        }
      }
      item.total_amount = parseFloat(item.acres_hours || 0) * parseFloat(item.rate || 0);
    }
    saveMockDataToStorage();
    return item;
  }

  return { detail: 'Method not allowed' };
};

const updateDashboardStatsDynamically = (resource, item) => {
  const stats = MOCK_DATA.dashboardStats;
  if (resource === 'customers') {
    stats.total_customers += 1;
  } else if (resource === 'bookings') {
    stats.todays_bookings += 1;
    stats.todays_earnings += parseFloat(item.total_amount || 0);
    stats.profit += parseFloat(item.total_amount || 0);
    stats.recent_bookings.unshift({
      id: item.id,
      customer_name: item.customer_name,
      work_type: item.work_type,
      acres_hours: item.acres_hours,
      status: item.status,
      date: 'Today'
    });
    if (stats.recent_bookings.length > 5) stats.recent_bookings.pop();
  } else if (resource === 'fuel') {
    stats.fuel_expense += parseFloat(item.total_amount || 0);
    stats.profit -= parseFloat(item.total_amount || 0);
  } else if (resource === 'expenses') {
    if (item.category === 'Repair' || item.category === 'Service') {
      stats.maintenance_expense += parseFloat(item.amount || 0);
    }
    stats.profit -= parseFloat(item.amount || 0);
  } else if (resource === 'payments') {
    stats.total_income += parseFloat(item.paid || 0);
    stats.pending_payments += parseFloat(item.pending || 0);
  }
};

export const api = {
  // Authentication
  login: async (username, password) => {
    if (isDemoMode || username === 'owner' || username === 'customer') {
      // Mock login profiles
      if (username === 'customer') {
        saveUserSession('Customer', 1); // Ramesh Patil
        return { token: 'mock-customer-token', user: { username: 'customer', role: 'Customer', customer_profile: 1 } };
      }
      saveUserSession('Owner', null);
      return { token: 'mock-owner-token', user: { username: 'owner', role: 'Owner', customer_profile: null } };
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/login/`, { username, password });
      saveUserSession(response.data.user.role, response.data.user.customer_profile);
      return {
        token: response.data.access,
        refresh: response.data.refresh,
        user: response.data.user
      };
    } catch (e) {
      console.warn("Backend auth failed, fallback to mock credentials");
      if (username === 'customer') {
        saveUserSession('Customer', 1);
        return { token: 'mock-customer-token', user: { username, role: 'Customer', customer_profile: 1 } };
      }
      saveUserSession('Owner', null);
      return { token: 'mock-owner-token', user: { username, role: 'Owner', customer_profile: null } };
    }
  },

  register: async (registerData) => {
    if (isDemoMode) {
      const nextCustId = MOCK_DATA.customers.length + 1;
      const mockUser = {
        username: registerData.username,
        email: registerData.email,
        role: registerData.role || 'Owner',
        customer_profile: registerData.role === 'Customer' ? nextCustId : null
      };
      if (registerData.role === 'Customer') {
        MOCK_DATA.customers.push({
          id: nextCustId,
          name: registerData.name || 'Test Customer',
          phone: registerData.phone || '9988776655',
          village: registerData.village || 'Test Village'
        });
      }
      saveUserSession(mockUser.role, mockUser.customer_profile);
      return {
        token: mockUser.role === 'Customer' ? 'mock-customer-token' : 'mock-owner-token',
        user: mockUser
      };
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/register/`, registerData);
      saveUserSession(response.data.user.role, response.data.user.customer_profile);
      return {
        token: response.data.token || response.data.access,
        refresh: response.data.refresh,
        user: response.data.user
      };
    } catch (e) {
      console.warn("Backend registration failed, fallback to mock signup");
      const nextCustId = MOCK_DATA.customers.length + 1;
      const mockUser = {
        username: registerData.username,
        email: registerData.email,
        role: registerData.role || 'Owner',
        customer_profile: registerData.role === 'Customer' ? nextCustId : null
      };
      if (registerData.role === 'Customer') {
        MOCK_DATA.customers.push({
          id: nextCustId,
          name: registerData.name || 'Test Customer',
          phone: registerData.phone || '9988776655',
          village: registerData.village || 'Test Village'
        });
      }
      saveUserSession(mockUser.role, mockUser.customer_profile);
      return {
        token: mockUser.role === 'Customer' ? 'mock-customer-token' : 'mock-owner-token',
        user: mockUser
      };
    }
  },

  getCurrentRole: () => loggedInUserRole,
  getCurrentCustomerProfile: () => {
    if (loggedInUserRole === 'Customer' && !loggedInUserCustomerProfile) {
      return 1;
    }
    return loggedInUserCustomerProfile;
  },

  // Resources
  customers: {
    list: () => apiCall('get', '/api/customers/'),
    create: (data) => apiCall('post', '/api/customers/', data),
    delete: (id) => apiCall('delete', `/api/customers/${id}/`),
  },
  drivers: {
    list: () => apiCall('get', '/api/drivers/'),
    create: (data) => apiCall('post', '/api/drivers/', data),
    delete: (id) => apiCall('delete', `/api/drivers/${id}/`),
  },
  bookings: {
    list: () => apiCall('get', '/api/bookings/'),
    create: (data) => apiCall('post', '/api/bookings/', data),
    patch: (id, data) => apiCall('patch', `/api/bookings/${id}/`, data),
    delete: (id) => apiCall('delete', `/api/bookings/${id}/`),
  },
  wages: {
    list: () => apiCall('get', '/api/wages/'),
    create: (data) => apiCall('post', '/api/wages/', data),
    delete: (id) => apiCall('delete', `/api/wages/${id}/`),
  },
  fuel: {
    list: () => apiCall('get', '/api/fuel/'),
    create: (data) => apiCall('post', '/api/fuel/', data),
    delete: (id) => apiCall('delete', `/api/fuel/${id}/`),
  },
  expenses: {
    list: () => apiCall('get', '/api/expenses/'),
    create: (data) => apiCall('post', '/api/expenses/', data),
    delete: (id) => apiCall('delete', `/api/expenses/${id}/`),
  },
  payments: {
    list: () => apiCall('get', '/api/payments/'),
    create: (data) => apiCall('post', '/api/payments/', data),
    delete: (id) => apiCall('delete', `/api/payments/${id}/`),
  },
  maintenance: {
    list: () => apiCall('get', '/api/maintenance/'),
    create: (data) => apiCall('post', '/api/maintenance/', data),
    delete: (id) => apiCall('delete', `/api/maintenance/${id}/`),
  },

  // Stats
  getDashboardStats: () => apiCall('get', '/api/dashboard/stats/'),
  getReportsStats: () => apiCall('get', '/api/reports/stats/'),
};
