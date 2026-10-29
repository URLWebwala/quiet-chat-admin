import { apiInstanceFetch } from "@/utils/ApiInstance";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SystemMetrics {
  host: {
    hostname: string;
    platform: string;
    nodeVersion: string;
    port: string | number;
    label: string;
  };
  cpu: {
    loadPercent: number;
    cores: number;
    model: string;
    load1m: string;
    load5m: string;
  };
  memory: {
    totalGB: string;
    freeGB: string;
    usedGB: string;
    usedPercent: number;
    nodeRssMB: number;
    nodeHeapMB: number;
  };
  storage: {
    totalGB: string;
    freeGB: string;
    usedGB: string;
    usedPercent: number;
    partition: string;
  };
  database: {
    type: string;
    status: string;
    version: string;
    name: string;
    state: number;
  };
  realtime: {
    service: string;
    status: string;
    cluster: string;
    connectedUsers: number;
  };
  uptime: {
    seconds: number;
    formatted: string;
  };
  apiStats: {
    totalRequests: number;
    totalErrors: number;
    server500Errors: number;
    client4xxErrors: number;
    errorsToday: number;
    reliabilityScore: string;
  };
  recentErrors: any[];
}

export interface ApiErrorLogItem {
  _id: string;
  method: string;
  endpoint: string;
  status: number;
  message: string;
  stackTrace?: string;
  responseTime: number;
  ip: string;
  userAgent: string;
  userId?: string;
  tenant?: string;
  requestBody?: any;
  requestQuery?: any;
  createdAt: string;
}

export interface EndpointStatItem {
  route: string;
  method: string;
  path: string;
  hits: number;
  errors: number;
  avgDurationMs: string;
  lastStatus: number;
  lastSeen: string;
  errorRate: string;
}

export interface SecurityOverview {
  totalThreats: number;
  criticalThreats: number;
  blockedIpsCount: number;
  threatsToday: number;
}

interface SystemMonitorState {
  metrics: SystemMetrics | null;
  logs: ApiErrorLogItem[];
  logSummary: {
    totalErrorLogs: number;
    errors500: number;
    errors4xx: number;
    errorsToday: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  endpoints: EndpointStatItem[];
  // Security state
  securityOverview: SecurityOverview;
  topSuspiciousIps: any[];
  recentIncidents: any[];
  threatLogs: any[];
  threatPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  blockedIps: any[];
  auditLogs: any[];
  auditPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loadingMetrics: boolean;
  loadingLogs: boolean;
  loadingEndpoints: boolean;
  loadingSecurity: boolean;
  clearingLogs: boolean;
  lastUpdated: string | null;
}

const initialState: SystemMonitorState = {
  metrics: null,
  logs: [],
  logSummary: {
    totalErrorLogs: 0,
    errors500: 0,
    errors4xx: 0,
    errorsToday: 0,
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },
  endpoints: [],
  securityOverview: {
    totalThreats: 0,
    criticalThreats: 0,
    blockedIpsCount: 0,
    threatsToday: 0,
  },
  topSuspiciousIps: [],
  recentIncidents: [],
  threatLogs: [],
  threatPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },
  blockedIps: [],
  auditLogs: [],
  auditPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },
  loadingMetrics: false,
  loadingLogs: false,
  loadingEndpoints: false,
  loadingSecurity: false,
  clearingLogs: false,
  lastUpdated: null,
};

// 1. Fetch Metrics
export const fetchSystemMetrics = createAsyncThunk(
  "systemMonitor/fetchMetrics",
  async () => {
    return apiInstanceFetch.get("api/admin/systemMonitor/metrics");
  }
);

// 2. Fetch Logs
export const fetchApiErrorLogs = createAsyncThunk(
  "systemMonitor/fetchLogs",
  async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    method?: string;
    status?: string;
    date?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.search) query.append("search", params.search);
    if (params?.method && params.method !== "ALL") query.append("method", params.method);
    if (params?.status && params.status !== "ALL") query.append("status", params.status);
    if (params?.date && params.date !== "ALL") query.append("date", params.date);

    return apiInstanceFetch.get(`api/admin/systemMonitor/logs?${query.toString()}`);
  }
);

// 3. Clear Logs
export const clearApiErrorLogs = createAsyncThunk(
  "systemMonitor/clearLogs",
  async () => {
    return apiInstanceFetch.delete("api/admin/systemMonitor/logs");
  }
);

// 4. Fetch Endpoints Stats
export const fetchEndpointsStats = createAsyncThunk(
  "systemMonitor/fetchEndpoints",
  async () => {
    return apiInstanceFetch.get("api/admin/systemMonitor/endpoints");
  }
);

// 5. Simulate Test Error
export const triggerTestError = createAsyncThunk(
  "systemMonitor/triggerTestError",
  async (params?: { status?: number; message?: string }) => {
    const status = params?.status || 500;
    const msg = encodeURIComponent(params?.message || "Diagnostic Test Error");
    try {
      await apiInstanceFetch.get(
        `api/admin/systemMonitor/test-error?status=${status}&message=${msg}`
      );
    } catch (e) {
      // Expected to return error status
    }
  }
);

// 6. Fetch Security Overview
export const fetchSecurityOverview = createAsyncThunk(
  "systemMonitor/fetchSecurityOverview",
  async () => {
    return apiInstanceFetch.get("api/admin/security/overview");
  }
);

// 7. Fetch Security Threats
export const fetchSecurityThreats = createAsyncThunk(
  "systemMonitor/fetchSecurityThreats",
  async (params?: { page?: number; limit?: number; search?: string; type?: string; severity?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.search) query.append("search", params.search);
    if (params?.type && params.type !== "ALL") query.append("type", params.type);
    if (params?.severity && params.severity !== "ALL") query.append("severity", params.severity);

    return apiInstanceFetch.get(`api/admin/security/threats?${query.toString()}`);
  }
);

// 8. Block IP Address
export const blockIpAddress = createAsyncThunk(
  "systemMonitor/blockIpAddress",
  async (payload: { ip: string; reason?: string }) => {
    return apiInstanceFetch.post("api/admin/security/block-ip", payload);
  }
);

// 9. Unblock IP Address
export const unblockIpAddress = createAsyncThunk(
  "systemMonitor/unblockIpAddress",
  async (payload: { ip: string }) => {
    return apiInstanceFetch.post("api/admin/security/unblock-ip", payload);
  }
);

// 10. Fetch Blocked IPs
export const fetchBlockedIps = createAsyncThunk(
  "systemMonitor/fetchBlockedIps",
  async () => {
    return apiInstanceFetch.get("api/admin/security/blocked-ips");
  }
);

// 11. Fetch Admin Audit Logs
export const fetchAdminAuditLogs = createAsyncThunk(
  "systemMonitor/fetchAdminAuditLogs",
  async (params?: { page?: number; limit?: number; search?: string; action?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.search) query.append("search", params.search);
    if (params?.action && params.action !== "ALL") query.append("action", params.action);

    return apiInstanceFetch.get(`api/admin/security/audit-logs?${query.toString()}`);
  }
);

// 12. Simulate Security Threat
export const simulateSecurityThreat = createAsyncThunk(
  "systemMonitor/simulateSecurityThreat",
  async (payload?: { type?: string; severity?: string; ip?: string }) => {
    return apiInstanceFetch.post("api/admin/security/simulate-threat", payload || {});
  }
);

const systemMonitorSlice = createSlice({
  name: "systemMonitor",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Metrics
    builder.addCase(fetchSystemMetrics.pending, (state) => {
      state.loadingMetrics = true;
    });
    builder.addCase(fetchSystemMetrics.fulfilled, (state, action: PayloadAction<any>) => {
      state.loadingMetrics = false;
      if (action.payload?.status && action.payload?.metrics) {
        state.metrics = action.payload.metrics;
        state.lastUpdated = new Date().toISOString();
      }
    });
    builder.addCase(fetchSystemMetrics.rejected, (state) => {
      state.loadingMetrics = false;
    });

    // Logs
    builder.addCase(fetchApiErrorLogs.pending, (state) => {
      state.loadingLogs = true;
    });
    builder.addCase(fetchApiErrorLogs.fulfilled, (state, action: PayloadAction<any>) => {
      state.loadingLogs = false;
      if (action.payload?.status) {
        state.logs = action.payload.logs || [];
        if (action.payload.summary) {
          state.logSummary = action.payload.summary;
        }
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      }
    });
    builder.addCase(fetchApiErrorLogs.rejected, (state) => {
      state.loadingLogs = false;
    });

    // Clear Logs
    builder.addCase(clearApiErrorLogs.pending, (state) => {
      state.clearingLogs = true;
    });
    builder.addCase(clearApiErrorLogs.fulfilled, (state) => {
      state.clearingLogs = false;
      state.logs = [];
      state.logSummary = {
        totalErrorLogs: 0,
        errors500: 0,
        errors4xx: 0,
        errorsToday: 0,
      };
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
      };
    });
    builder.addCase(clearApiErrorLogs.rejected, (state) => {
      state.clearingLogs = false;
    });

    // Endpoints
    builder.addCase(fetchEndpointsStats.pending, (state) => {
      state.loadingEndpoints = true;
    });
    builder.addCase(fetchEndpointsStats.fulfilled, (state, action: PayloadAction<any>) => {
      state.loadingEndpoints = false;
      if (action.payload?.status && action.payload?.endpoints) {
        state.endpoints = action.payload.endpoints;
      }
    });
    builder.addCase(fetchEndpointsStats.rejected, (state) => {
      state.loadingEndpoints = false;
    });

    // Security Overview
    builder.addCase(fetchSecurityOverview.pending, (state) => {
      state.loadingSecurity = true;
    });
    builder.addCase(fetchSecurityOverview.fulfilled, (state, action: PayloadAction<any>) => {
      state.loadingSecurity = false;
      if (action.payload?.status) {
        if (action.payload.overview) state.securityOverview = action.payload.overview;
        if (action.payload.topSuspiciousIps) state.topSuspiciousIps = action.payload.topSuspiciousIps;
        if (action.payload.recentIncidents) state.recentIncidents = action.payload.recentIncidents;
      }
    });
    builder.addCase(fetchSecurityOverview.rejected, (state) => {
      state.loadingSecurity = false;
    });

    // Security Threats
    builder.addCase(fetchSecurityThreats.fulfilled, (state, action: PayloadAction<any>) => {
      if (action.payload?.status && action.payload.threats) {
        state.threatLogs = action.payload.threats;
        if (action.payload.pagination) state.threatPagination = action.payload.pagination;
      }
    });

    // Blocked IPs
    builder.addCase(fetchBlockedIps.fulfilled, (state, action: PayloadAction<any>) => {
      if (action.payload?.status && action.payload.blockedIps) {
        state.blockedIps = action.payload.blockedIps;
      }
    });

    // Admin Audit Logs
    builder.addCase(fetchAdminAuditLogs.fulfilled, (state, action: PayloadAction<any>) => {
      if (action.payload?.status && action.payload.auditLogs) {
        state.auditLogs = action.payload.auditLogs;
        if (action.payload.pagination) state.auditPagination = action.payload.pagination;
      }
    });
  },
});

export default systemMonitorSlice.reducer;
