// NEXT_PUBLIC_API_URL:
//   - Diisi (mis. https://fintrack.home-sumbul.my.id) → langsung hit URL tersebut (dev/Vercel)
//   - Kosong string ""  → pakai relative path "" = Next.js rewrites proxy ke fintrack-api (Docker)
//   - Tidak diset       → sama seperti kosong (Docker)
const _rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const API_URL = (_rawApiUrl !== undefined && _rawApiUrl !== "") ? _rawApiUrl : "";

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_URL}${path}`;
  const config: RequestInit = {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };
  const response = await fetch(url, config);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  register: (email: string, password: string) =>
    request("/api/v1/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),

  login: (email: string, password: string) =>
    request("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  logout: () => request("/api/v1/auth/logout", { method: "POST" }),

  me: () => request("/api/v1/auth/me"),

  updateProfile: (monthlyIncome: number, wealthGoal: number) =>
    request("/api/v1/auth/profile", {
      method: "PUT",
      body: JSON.stringify({ monthly_income: monthlyIncome, wealth_goal: wealthGoal }),
    }),

  // ── Telegram ──────────────────────────────────────────────────────────────
  generateLinkCode: () =>
    request("/api/v1/telegram/link-code", { method: "POST" }),

  // ── Transactions ──────────────────────────────────────────────────────────
  getTransactions: () => request("/api/v1/transactions"),

  createTransaction: (description: string, amount: number, categoryName: string, date?: string) =>
    request("/api/v1/transactions", {
      method: "POST",
      body: JSON.stringify({ description, amount, category_name: categoryName, date }),
    }),

  updateTransaction: (id: string, description: string, amount: number, categoryName: string) =>
    request(`/api/v1/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify({ description, amount, category_name: categoryName }),
    }),

  deleteTransaction: (id: string) =>
    request(`/api/v1/transactions/${id}`, { method: "DELETE" }),

  // ── Categories ────────────────────────────────────────────────────────────
  getCategories: () => request("/api/v1/categories"),

  createCategory: (name: string, budgetLimit: number) =>
    request("/api/v1/categories", {
      method: "POST",
      body: JSON.stringify({ name, budget_limit: budgetLimit }),
    }),

  deleteCategory: (id: string) =>
    request(`/api/v1/categories/${id}`, { method: "DELETE" }),

  // ── Dashboard ─────────────────────────────────────────────────────────────
  getDashboardSummary: () => request("/api/v1/dashboard/summary"),

  // ── Fixed Expenses ────────────────────────────────────────────────────────
  getFixedExpenses: () => request("/api/v1/fixed-expenses"),

  createFixedExpense: (name: string, amount: number) =>
    request("/api/v1/fixed-expenses", {
      method: "POST",
      body: JSON.stringify({ name, amount }),
    }),

  updateFixedExpense: (id: string, data: { name?: string; amount?: number; is_active?: boolean }) =>
    request(`/api/v1/fixed-expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteFixedExpense: (id: string) =>
    request(`/api/v1/fixed-expenses/${id}`, { method: "DELETE" }),

  // ── Home Server ───────────────────────────────────────────────────────────
  getServerStatus: () => request("/api/v1/home/status"),
  getServerResources: () => request("/api/v1/home/resources"),
};
