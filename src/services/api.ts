const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Helper to make fetch requests with standard credentials and headers
async function request(path: string, options: RequestInit = {}) {
  const url = `${API_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const config: RequestInit = {
    credentials: "include", // Essential for HttpOnly Cookie JWT sessions
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth Services
  register: (email: string, password: string) =>
    request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request("/api/v1/auth/logout", {
      method: "POST",
    }),

  me: () => request("/api/v1/auth/me"),

  // Telegram Linking Services
  generateLinkCode: () =>
    request("/api/v1/telegram/link-code", {
      method: "POST",
    }),

  // Transaction Services
  getTransactions: () => request("/api/v1/transactions"),

  createTransaction: (description: string, amount: number, categoryName: string) =>
    request("/api/v1/transactions", {
      method: "POST",
      body: JSON.stringify({ description, amount, category_name: categoryName }),
    }),

  updateTransaction: (id: string, description: string, amount: number, categoryName: string) =>
    request(`/api/v1/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify({ description, amount, category_name: categoryName }),
    }),

  deleteTransaction: (id: string) =>
    request(`/api/v1/transactions/${id}`, {
      method: "DELETE",
    }),

  // Category Services
  getCategories: () => request("/api/v1/categories"),

  createCategory: (name: string, budgetLimit: number) =>
    request("/api/v1/categories", {
      method: "POST",
      body: JSON.stringify({ name, budget_limit: budgetLimit }),
    }),

  deleteCategory: (id: string) =>
    request(`/api/v1/categories/${id}`, {
      method: "DELETE",
    }),

  // Dashboard Services
  getDashboardSummary: () => request("/api/v1/dashboard/summary"),
};
