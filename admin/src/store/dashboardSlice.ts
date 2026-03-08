import { apiInstanceFetch } from "@/utils/ApiInstance";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { BlobOptions } from "buffer";

interface SuggestionState {
  dashboardData: [];
  topProviders: [];
  topPerformingHost: [];
  topSpenders: [];
  newUsers: [],
  upcomingBookings: [];
  chartData: [];
  chartDataHost: [];
  topAgencies: [];
  isLoading: boolean;
  isSkeleton : boolean;
  loading : {
    dashboardData : boolean,
    chartDataHost : boolean
  }
}

const initialState: SuggestionState = {
  dashboardData: [],
  topProviders: [],
  topPerformingHost: [],
  upcomingBookings: [],
  topAgencies: [],
  topSpenders: [],
  newUsers: [],
  chartDataHost: [],
  chartData: [],
  isLoading: false,
  loading : {
    dashboardData : false,
    chartDataHost : false
  },
  isSkeleton : false,
};
interface AllUsersPayload {
  startDate?: string;
  endDate?: string;
  payload?: {
    startDate?: string;
    endDate?: string;
  };
  type: number;
}

export const getDashboardData = createAsyncThunk(
  "api/admin/dashboard/fetchDashboardMetrics",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/dashboard/fetchDashboardMetrics?startDate=${payload?.startDate}&endDate=${payload?.endDate}`
    );
  }
);


export const getTopPerformingHost: any = createAsyncThunk(
  "api/admin/dashboard/getTopPerformingHosts",
  async (payload: AllUsersPayload | undefined) => {

    return apiInstanceFetch.get(
      `api/admin/dashboard/getTopPerformingHosts?startDate=${payload?.startDate}&endDate=${payload?.endDate}`
    );
  }
);




export const getUpcomingBookings = createAsyncThunk(
  "api/admin/dashboard/upcomingBookings",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(`api/admin/dashboard/upcomingBookings`);
  }
);

export const getTopAgencies: any = createAsyncThunk(
  "api/admin/dashboard/getTopPerformingAgencies",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(`api/admin/dashboard/getTopPerformingAgencies?startDate=${payload?.startDate}&endDate=${payload?.endDate}`);
  }
);

export const getTopSpenders: any = createAsyncThunk(
  "api/admin/dashboard/fetchTopSpenders",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(`api/admin/dashboard/fetchTopSpenders?startDate=${payload?.startDate}&endDate=${payload?.endDate}`);
  }
);

export const getNewUsers: any = createAsyncThunk(
  "api/admin/dashboard/getNewUsers",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(`api/admin/dashboard/getNewUsers?startDate=${payload?.startDate}&endDate=${payload?.endDate}`);
  }
);


export const getChartData = createAsyncThunk(
  "api/admin/dashboard/retrieveChartStats",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/dashboard/retrieveChartStats?type=user&startDate=${payload?.startDate}&endDate=${payload?.endDate}`
    );
  }
);

export const getChartDataOfHost = createAsyncThunk(
  "api/admin/dashboard/retrieveChartStats1",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/dashboard/retrieveChartStats?type=host&startDate=${payload?.startDate}&endDate=${payload?.endDate}`
    );
  }
);

const suggestionSlice = createSlice({
  name: "suggestion",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(
      getDashboardData.pending,
      (state, action: PayloadAction<any>) => {
        state.loading.dashboardData = true;
      }
    );

    builder.addCase(
      getDashboardData.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.dashboardData = action.payload.data;
        state.loading.dashboardData= false;
      }
    );

    builder.addCase(getDashboardData.rejected, (state) => {
     state.loading.dashboardData= false;
    });

    builder.addCase(
      getTopAgencies.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
        state.isSkeleton = true;
      }
    );

    builder.addCase(
      getTopAgencies.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        state.isLoading = false;
        state.topAgencies = action.payload.data;
      }
    );

    builder.addCase(getTopAgencies.rejected, (state) => {
      state.isLoading = false;
        state.isSkeleton = false;

    });

    builder.addCase(
      getTopSpenders.pending,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );

    builder.addCase(
      getTopSpenders.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        state.topSpenders = action.payload.data;
      }
    );

    builder.addCase(getTopSpenders.rejected, (state) => {
        state.isSkeleton = false;
    });


    builder.addCase(
      getNewUsers.pending,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );

    builder.addCase(
      getNewUsers.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        state.newUsers = action.payload.data;
      }
    );



    builder.addCase(
      getTopPerformingHost.pending,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );

    builder.addCase(
      getTopPerformingHost.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        state.topPerformingHost = action.payload.data;
      }
    );

    builder.addCase(
      getUpcomingBookings.fulfilled,
      (state, action: PayloadAction<any>) => {

        state.loading.chartDataHost = false;
        state.isSkeleton = false;

        state.upcomingBookings = action.payload.data;
      }
    );

    builder.addCase(
      getChartData.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.loading.chartDataHost = false;
        state.chartData = action?.payload?.chartUser;
      }
    );

    builder.addCase(
      getChartDataOfHost.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.loading.chartDataHost = false;
        state.chartDataHost = action?.payload?.chartHost;
      }
    );
  },
});

export default suggestionSlice.reducer;
