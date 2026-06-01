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
  userId: number;
  email: string;
  fullName: string;
}

export interface Subscription {
  id: number;
  userId: number;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'BIWEEKLY';
  nextBillingDate: string;
  cancellationDate?: string;
  isActive: boolean;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionRequest {
  name: string;
  amount: number;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'BIWEEKLY';
  nextBillingDate: string;
  currency?: string;
  cancellationDate?: string;
  isActive?: boolean;
  category?: string;
  description?: string;
}

export interface CancellationDeadline {
  subscriptionId: number;
  subscriptionName: string;
  nextBillingDate: string;
  cancellationDeadline: string;
  daysUntilDeadline: number;
  isDeadlinePassed: boolean;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'BIWEEKLY';
  amount: number;
}

export interface ForecastLineItem {
  subscriptionId: number;
  subscriptionName: string;
  amount: number;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'BIWEEKLY';
  billingDate: string;
}

export interface ForecastEntry {
  month: string;
  monthNumber: number;
  year: number;
  totalAmount: number;
  subscriptions: ForecastLineItem[];
}

export interface ForecastResponse {
  generatedAt: string;
  totalTwelveMonths: number;
  averageMonthly: number;
  entries: ForecastEntry[];
}

export interface Notification {
  id: number;
  subscriptionId?: number;
  subscriptionName?: string;
  type: 'PRICE_INCREASE' | 'CANCELLATION_REMINDER' | 'RENEWAL_UPCOMING';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface PlaidPublicTokenRequest{
  publicToken: string;
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

export async function createSubscription(data: SubscriptionRequest): Promise<Subscription> {
  return request<Subscription>('/api/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSubscription(id: number, data: SubscriptionRequest): Promise<Subscription> {
  return request<Subscription>(`/api/subscriptions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteSubscription(id: number): Promise<void> {
  return request<void>(`/api/subscriptions/${id}`, { method: 'DELETE' });
}

export async function getCancellationDeadlines(): Promise<CancellationDeadline[]> {
  return request<CancellationDeadline[]>('/api/subscriptions/cancellation-deadlines');
}

export async function getForecast(): Promise<ForecastResponse> {
  return request<ForecastResponse>('/api/forecast');
}

export async function getNotifications(): Promise<Notification[]> {
  return request<Notification[]>('/api/notifications');
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return request<{ count: number }>('/api/notifications/unread-count');
}

export async function markNotificationRead(id: number): Promise<Notification> {
  return request<Notification>(`/api/notifications/${id}/read`, { method: 'PUT' });
}

export async function getLinkToken(): Promise<{ linkToken: string }> {
  return request<{ linkToken: string }>('/api/plaid/link-token', { method: 'POST' });
}

export async function exchangePublicToken(publicToken: string): Promise<{ accessToken: string }> {
  return request<{ accessToken: string }>('/api/plaid/exchange-token', {
    method: 'POST',
    body: JSON.stringify({ publicToken }),
  });
}
