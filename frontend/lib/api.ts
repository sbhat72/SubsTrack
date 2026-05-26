const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
  };
}

export interface Subscription {
  id: number;
  name: string;
  amount: number;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'WEEKLY';
  nextBillingDate: string;
  category: string;
  active: boolean;
}

export interface CancellationDeadline {
  subscriptionId: number;
  subscriptionName: string;
  lastCancelDate: string;
  nextBillingDate: string;
  daysRemaining: number;
}

export interface ForecastLineItem {
  name: string;
  amount: number;
}

export interface ForecastEntry {
  month: number;
  year: number;
  totalAmount: number;
  lineItems: ForecastLineItem[];
}

export interface ForecastResponse {
  generatedAt: string;
  totals: { annual: number; monthly: number };
  entries: ForecastEntry[];
}

export interface Notification {
  id: number;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

// ── API Functions ──────────────────────────────────────────────────────────

export async function login(data: LoginRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSubscriptions(): Promise<Subscription[]> {
  return request<Subscription[]>('/api/subscriptions');
}

export async function getCancellationDeadlines(): Promise<CancellationDeadline[]> {
  return request<CancellationDeadline[]>('/api/subscriptions/cancellation-date');
}

export async function getForecast(): Promise<ForecastResponse> {
  return request<ForecastResponse>('/api/forecast');
}

export async function getNotifications(): Promise<Notification[]> {
  return request<Notification[]>('/api/notifications');
}

export async function getUnreadCount(): Promise<number> {
  return request<number>('/api/notifications/unread-count');
}
