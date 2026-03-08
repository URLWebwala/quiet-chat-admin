import { apiInstanceFetch } from "@/utils/ApiInstance";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface SuggestionState {
  dashboardData: [];
  topProviders: [];
  topPerformingHost: [];
  topSpenders: [];
  newHost: [],
  agencyEarningData : [],
  hostEarningData : [],
  upcomingBookings: [];
  chartData: [];
  chartDataHost: [];
  topAgencies: [];
  isLoading: boolean;
  isSkeleton : boolean;
}

const initialState: SuggestionState = {
  dashboardData: [],
  topProviders: [],
  topPerformingHost: [],
  upcomingBookings: [],
  topAgencies: [],
  topSpenders: [],
  newHost: [],
  agencyEarningData : [],
  hostEarningData : [],
  chartDataHost: [],
  chartData: [],
  isLoading: false,
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
  "api/agency/dashboard/retrieveDashboardStats",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `api/agency/dashboard/retrieveDashboardStats?startDate=${payload?.startDate}&endDate=${payload?.endDate}`
    );
  }
);



export const getTopPerformingHost: any = createAsyncThunk(
  "api/agency/dashboard/listTopEarningHosts",
  async (payload: AllUsersPayload | undefined) => {

    return apiInstanceFetch.get(
      `api/agency/dashboard/listTopEarningHosts?startDate=${payload?.startDate}&endDate=${payload?.endDate}`
    );
  }
);



export const getNewHost: any = createAsyncThunk(
  "api/agency/dashboard/retrieveRecentHosts",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(`api/agency/dashboard/retrieveRecentHosts?startDate=${payload?.startDate}&endDate=${payload?.endDate}`);
  }
);



export const getagencyEarnings = createAsyncThunk(
  "api/agency/dashboard/getEarningsReport?",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(`api/agency/dashboard/getEarningsReport?startDate=${payload?.startDate}&endDate=${payload?.endDate}&type=${payload?.type}`);
  }
);

export const getHostEarnings = createAsyncThunk(
  "api/agency/dashboard/getEarningsReport1?",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(`api/agency/dashboard/getEarningsReport?startDate=${payload?.startDate}&endDate=${payload?.endDate}&type=${payload?.type}`);
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
        state.isLoading = true;
      }
    );

    builder.addCase(
      getDashboardData.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.dashboardData = action.payload.data;
      }
    );


    builder.addCase(
      getNewHost.pending,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );

    builder.addCase(
      getNewHost.fulfilled,
      (state, action: PayloadAction<any>) => {
        
        state.isSkeleton = false;
        state.newHost = action.payload.data;
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
      getagencyEarnings.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.agencyEarningData = action.payload.agencyEarnings;
      }
    );

    builder.addCase(
      getHostEarnings.fulfilled,
      (state, action: PayloadAction<any>) => {
          
        state.isLoading = false;
        state.hostEarningData = action.payload.hostEarnings;
      }
    );


  },
});

export default suggestionSlice.reducer;
