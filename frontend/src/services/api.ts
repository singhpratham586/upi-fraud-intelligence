import type {
  DashboardData,
  OverviewMetrics,
  Transaction,
  DetectionRunResponse,
  BusinessImpactSimResponse,
  SQLQueryItem,
  SQLQueryResult,
  Investigation,
  AuthResponse,
  StoredCredentialRecord,
  EvaluateSheetResponse
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error [${response.status}]: ${errorText || response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Analytics
  getOverview: (category?: string, risk?: string) => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('merchant_category', category);
    if (risk && risk !== 'all') params.append('risk_level', risk);
    return fetchJson<OverviewMetrics>(`/analytics/overview?${params.toString()}`);
  },

  getDashboard: (category?: string, risk?: string) => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('merchant_category', category);
    if (risk && risk !== 'all') params.append('risk_level', risk);
    return fetchJson<DashboardData>(`/analytics/dashboard?${params.toString()}`);
  },

  // Transactions
  getTransactions: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    merchantCategory?: string;
    riskLevel?: string;
    reviewStatus?: string;
    minAmount?: number;
    maxAmount?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const q = new URLSearchParams();
    if (params.page) q.append('page', params.page.toString());
    if (params.pageSize) q.append('page_size', params.pageSize.toString());
    if (params.search) q.append('search', params.search);
    if (params.merchantCategory && params.merchantCategory !== 'all') q.append('merchant_category', params.merchantCategory);
    if (params.riskLevel && params.riskLevel !== 'all') q.append('risk_level', params.riskLevel);
    if (params.reviewStatus && params.reviewStatus !== 'all') q.append('review_status', params.reviewStatus);
    if (params.minAmount !== undefined) q.append('min_amount', params.minAmount.toString());
    if (params.maxAmount !== undefined) q.append('max_amount', params.maxAmount.toString());
    if (params.sortBy) q.append('sort_by', params.sortBy);
    if (params.sortOrder) q.append('sort_order', params.sortOrder);

    return fetchJson<{
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
      transactions: Transaction[];
    }>(`/transactions?${q.toString()}`);
  },

  getTransaction: (id: string) => fetchJson<Transaction>(`/transactions/${id}`),

  updateInvestigation: (
    id: string,
    payload: {
      review_status: string;
      analyst_notes?: string;
      analyst_id?: string;
      escalation_reason?: string;
    }
  ) =>
    fetchJson<Investigation>(`/transactions/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Detection Lab
  getDetectionSummary: () => fetchJson<any>('/detection/summary'),

  runDetection: (payload: {
    iqr?: { feature: string; multiplier: number };
    iforest?: { contamination: number; features: string[]; n_estimators?: number };
    timeseries?: { velocity_count_threshold: number; amount_deviation_sigma: number; short_window_seconds: number };
  }) =>
    fetchJson<DetectionRunResponse>('/detection/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Business Impact
  simulateBusinessImpact: (payload: {
    cost_per_investigation: number;
    loss_recovery_rate_pct: number;
    unmitigated_loss_multiplier: number;
    risk_score_threshold: number;
    selected_model: string;
  }) =>
    fetchJson<BusinessImpactSimResponse>('/business-impact/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // SQL Insights
  getSQLQueries: () => fetchJson<SQLQueryItem[]>('/sql-insights'),

  executeSQLQuery: (queryId: number) => fetchJson<SQLQueryResult>(`/sql-insights/${queryId}/execute`),

  // Authentication & Dataset Credentials
  loginWithGmail: (email: string, password: string, fullName?: string) =>
    fetchJson<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    }),

  loginWithOAuth: (provider: 'google' | 'github', email: string, fullName: string, avatarUrl?: string) =>
    fetchJson<AuthResponse>('/auth/oauth', {
      method: 'POST',
      body: JSON.stringify({ provider, email, full_name: fullName, avatar_url: avatarUrl }),
    }),

  getSavedUsers: () => fetchJson<StoredCredentialRecord[]>('/auth/users'),

  logout: () =>
    fetchJson<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
    }),

  // Sheet & Excel Drop Evaluation
  evaluateSheet: (payload: {
    filename: string;
    file_base64?: string;
    csv_text?: string;
    persist_to_db?: boolean;
  }) =>
    fetchJson<EvaluateSheetResponse>('/datasets/evaluate-sheet', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSampleSheetUrl: () => `${BASE_URL}/datasets/sample-sheet`,
};
