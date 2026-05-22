import { DangerRight, Success } from "@/api/toastServices";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface AdsWatchState {
  stats: any;
  activity: any[];
  logs: any[];
  rewards: any[];
  totalActivity: number;
  totalLogs: number;
  isLoading: boolean;
}

const initialState: AdsWatchState = {
  stats: {},
  activity: [],
  logs: [],
  rewards: [],
  totalActivity: 0,
  totalLogs: 0,
  isLoading: false,
};

export const getAdsWatchStats: any = createAsyncThunk(
  "admin/adsWatch/fetchStats",
  async () => apiInstanceFetch.get("api/admin/adsWatch/fetchStats")
);

export const getAdsWatchActivity: any = createAsyncThunk(
  "admin/adsWatch/fetchActivity",
  async (payload: { personType: string; start?: number; limit?: number }) =>
    apiInstanceFetch.get(
      `api/admin/adsWatch/fetchActivity?personType=${payload.personType}&start=${payload.start || 1}&limit=${payload.limit || 20}`
    )
);

export const getAdsWatchLogs: any = createAsyncThunk(
  "admin/adsWatch/fetchRecentLogs",
  async (payload: { personType: string; start?: number; limit?: number }) =>
    apiInstanceFetch.get(
      `api/admin/adsWatch/fetchRecentLogs?personType=${payload.personType}&start=${payload.start || 1}&limit=${payload.limit || 20}`
    )
);

export const getAdsWatchRewards: any = createAsyncThunk(
  "admin/adsWatch/reward/fetchRewards",
  async (target: string = "all") =>
    apiInstanceFetch.get(`api/admin/adsWatch/reward/fetchRewards?target=${target}`)
);

export const createAdsWatchReward: any = createAsyncThunk(
  "admin/adsWatch/reward/createReward",
  async (payload: any) => apiInstanceFetch.post("api/admin/adsWatch/reward/createReward", payload)
);

export const updateAdsWatchReward: any = createAsyncThunk(
  "admin/adsWatch/reward/updateReward",
  async (payload: any) => apiInstanceFetch.patch("api/admin/adsWatch/reward/updateReward", payload)
);

export const toggleAdsWatchRewardStatus: any = createAsyncThunk(
  "admin/adsWatch/reward/toggleRewardStatus",
  async (rewardId: string) =>
    apiInstanceFetch.patch(`api/admin/adsWatch/reward/toggleRewardStatus?rewardId=${rewardId}`)
);

export const deleteAdsWatchReward: any = createAsyncThunk(
  "admin/adsWatch/reward/removeReward",
  async (rewardId: string) =>
    apiInstanceFetch.delete(`api/admin/adsWatch/reward/removeReward?rewardId=${rewardId}`)
);

const adsWatchSlice = createSlice({
  name: "adsWatch",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAdsWatchStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAdsWatchStats.fulfilled, (state, action: any) => {
        state.isLoading = false;
        if (action.payload?.status) {
          state.stats = action.payload.data;
        } else {
          DangerRight(action.payload?.message || "Failed to load stats");
        }
      })
      .addCase(getAdsWatchStats.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(getAdsWatchActivity.fulfilled, (state, action: any) => {
        if (action.payload?.status) {
          state.activity = action.payload.data || [];
          state.totalActivity = action.payload.total || 0;
        }
      })
      .addCase(getAdsWatchLogs.fulfilled, (state, action: any) => {
        if (action.payload?.status) {
          state.logs = action.payload.data || [];
          state.totalLogs = action.payload.total || 0;
        }
      })
      .addCase(getAdsWatchRewards.fulfilled, (state, action: any) => {
        if (action.payload?.status) {
          state.rewards = action.payload.data || [];
        } else {
          DangerRight(action.payload?.message || "Failed to load rewards");
        }
      })
      .addCase(getAdsWatchRewards.rejected, (_state, action: any) => {
        DangerRight(action.error?.message || "Failed to load rewards");
      })
      .addCase(createAdsWatchReward.fulfilled, (state, action: any) => {
        if (action.payload?.status) {
          Success("Reward created successfully");
        } else {
          DangerRight(action.payload?.message || "Failed to create reward");
        }
      })
      .addCase(createAdsWatchReward.rejected, (_state, action: any) => {
        DangerRight(action.error?.message || "Failed to create reward");
      })
      .addCase(updateAdsWatchReward.fulfilled, (state, action: any) => {
        if (action.payload?.status) {
          const index = state.rewards.findIndex((item) => item._id === action.payload.data?._id);
          if (index !== -1) state.rewards[index] = action.payload.data;
          Success("Reward updated successfully");
        } else {
          DangerRight(action.payload?.message || "Failed to update reward");
        }
      })
      .addCase(toggleAdsWatchRewardStatus.fulfilled, (state, action: any) => {
        if (action.payload?.status) {
          const index = state.rewards.findIndex((item) => item._id === action.payload.data?._id);
          if (index !== -1) state.rewards[index] = action.payload.data;
          Success("Reward status updated");
        } else {
          DangerRight(action.payload?.message || "Failed to update status");
        }
      })
      .addCase(deleteAdsWatchReward.fulfilled, (state, action: any) => {
        if (action.payload?.status) {
          state.rewards = state.rewards.filter((item) => item._id !== action.meta.arg);
          Success("Reward deleted successfully");
        } else {
          DangerRight(action.payload?.message || "Failed to delete reward");
        }
      });
  },
});

export default adsWatchSlice.reducer;
