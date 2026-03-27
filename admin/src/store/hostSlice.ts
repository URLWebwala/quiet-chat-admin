import { DangerRight, Success } from "@/api/toastServices";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getUserProfile } from "./userSlice";
import { toast } from "react-toastify";

interface UserState {
  host: any[];
  fakeHost: any[];
  hostProfile: any[];
  totalFakeHost: any[];
  impressionList: any[];
  hostFollowerList: any[];
  hostCoinHistory: any[];
  hostCallHistory: any[];
  hostGiftHistory: any[];
  hostChatHistory: any[];
  hostLiveBroadCastHistory: any[];
  userBlockList: any[];
  totalFollowerList: number;
  totalUserBlockList: number;
  totalHostCoinPlanHistory: number;
  totalHostChatHistory: number;
  totalChatCount: number;
  totalHostChatEarning: number;
  totalUserChatSpent: number;
  totalHostEarning: number;
  totalLiveHistory: number;
  totalDuration: number;
  totalcallhosthistory: number;
  total: number;
  isLoading: boolean;
  isSkeleton: boolean;
  message: string;
}

const initialState: UserState = {
  host: [],
  fakeHost: [],
  hostProfile: [],
  totalFakeHost: [],
  impressionList: [],
  hostFollowerList: [],
  hostCoinHistory: [],
  hostCallHistory: [],
  hostGiftHistory: [],
  hostChatHistory: [],
  hostLiveBroadCastHistory: [],
  userBlockList: [],
  totalFollowerList: 0,
  totalUserBlockList: 0,
  total: 0,
  totalHostCoinPlanHistory: 0,
  totalHostChatHistory: 0,
  totalChatCount: 0,
  totalHostChatEarning: 0,
  totalUserChatSpent: 0,
  totalHostEarning: 0,
  totalLiveHistory: 0,
  totalDuration: 0,
  totalcallhosthistory: 0,
  isLoading: false,
  isSkeleton: false,
  message: "",
};

interface AllImpressionPayload {
  name: string;
  start: number;
  limit: number;
  search: string;
  startDate: string;
  endDate: string;
  type: string;
}

export const getImpression: any = createAsyncThunk(
  "api/admin/impression/fetchAdImpressionMetrics",
  async (payload: any) => {
    return apiInstanceFetch.get(
      `api/admin/impression/fetchAdImpressionMetrics`
    );
  }
);

export const getRealOrFakeHost: any = createAsyncThunk(
  "api/admin/host/fetchHostList1",
  async (payload: AllImpressionPayload | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/host/fetchHostList?start=${payload?.start}&limit=${payload?.limit}&search=${payload?.search}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&type=${payload?.type}`
    );
  }
);

export const getMessage: any = createAsyncThunk(
  "api/admin/message/fetchMessage",
  async (payload: any) => {
    return apiInstanceFetch.get(
      `api/admin/message/fetchMessage?genderType=${payload.gender}`
    );
  }
);

export const updateMessage: any = createAsyncThunk(
  "api/admin/message/updateMessage",
  async (payload: any) => {
    return apiInstanceFetch.patch(
      `api/admin/message/updateMessage?genderType=${payload.gender}`,
      {
        message : payload.message
      }
    );
  }
);

export const getHostProfile: any = createAsyncThunk(
  "api/admin/host/fetchHostProfile",
  async (payload: AllImpressionPayload | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/host/fetchHostProfile?hostId=${payload}`
    );
  }
);

export const createHost = createAsyncThunk(
  "api/admin/host/createHost",
  async (payload) => {
    return apiInstanceFetch.post(`api/admin/host/createHost`, payload);
  }
);

export const getHostFollowerList: any = createAsyncThunk(
  "api/admin/followerFollowing/fetchFollowers",
  async (payload: any) => {
    return apiInstanceFetch.get(
      `api/admin/followerFollowing/fetchFollowers?hostId=${payload}`
    );
  }
);

export const deleteHost: any = createAsyncThunk(
  "api/admin/host/deleteHost",
  async (payload: AllImpressionPayload | undefined) => {
    return apiInstanceFetch.delete(
      `api/admin/host/deleteHost?hostId=${payload}`
    );
  }
);

export const updateHost = createAsyncThunk(
  "api/admin/host/updateHost",
  async (payload: any) => {
    return apiInstanceFetch.patch(`api/admin/host/updateHost`, payload);
  }
);

export const blockonlinebusyHost: any = createAsyncThunk(
  "api/admin/host/toggleHostStatusByType?hostId",
  async (payload: any) => {
    return apiInstanceFetch.patch(
      `api/admin/host/toggleHostStatusByType?hostId=${payload?.hostId}&type=${payload?.type}`
    );
  }
);

export const blockRealHost: any = createAsyncThunk(
  "api/admin/host/toggleHostStatusByType?hostId1",
  async (payload: any) => {
    return apiInstanceFetch.patch(
      `api/admin/host/toggleHostStatusByType?hostId=${payload?.hostId}&type=${payload?.type}`
    );
  }
);

export const blockUnblockHost: any = createAsyncThunk(
  "api/admin/host/toggleHostStatusByType?hostId",
  async (payload: any) => {
    return apiInstanceFetch.patch(
      `api/admin/host/toggleHostStatusByType?hostId=${payload?.hostId}&type=${payload?.type}`
    );
  }
);

export const getUserBlockList: any = createAsyncThunk(
  "api/admin/block/listBlockedUsersForHost?hostId",
  async (payload: any) => {
    return apiInstanceFetch.get(
      `api/admin/block/listBlockedUsersForHost?hostId=${payload}`
    );
  }
);

export const getCoinPlanHistory: any = createAsyncThunk(
  "api/admin/history/fetchCoinTransactionHistory",
  async (payload: any) => {
    return apiInstanceFetch.get(
      `api/admin/history/fetchCoinTransactionHistory?hostId=${payload?.id}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`
    );
  }
);

export const getHostCallHistory: any = createAsyncThunk(
  "api/admin/history/listCallTransactions",
  async (payload: any) => {
    return apiInstanceFetch.get(
      `api/admin/history/listCallTransactions?hostId=${payload?.id}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`
    );
  }
);

export const getHostGiftHistory: any = createAsyncThunk(
  "api/admin/history/fetchGiftTransactionHistory",
  async (payload: any) => {
    return apiInstanceFetch.get(
      `api/admin/history/fetchGiftTransactionHistory?hostId=${payload?.id}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`
    );
  }
);

export const getHostChatHistory: any = createAsyncThunk(
  "api/admin/history/fetchChatTransactionHistory",
  async (payload: any) => {
    return apiInstanceFetch.get(
      `api/admin/history/fetchChatTransactionHistory?hostId=${payload?.id}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`
    );
  }
);

export const getLiveBroadCastHistory: any = createAsyncThunk(
  "api/admin/liveBroadcastHistory/fetchLiveHistory",
  async (payload: any) => {
    return apiInstanceFetch.get(
      `api/admin/liveBroadcastHistory/fetchLiveHistory?hostId=${payload?.hostId}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`
    );
  }
);

const hostSlice = createSlice({
  name: "host",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(
      getImpression.pending,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );
    builder.addCase(
      getImpression.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        state.impressionList = action.payload.data;
      }
    );

    builder.addCase(getImpression.rejected, (state) => {
      state.isSkeleton = false;
    });


    builder.addCase(
      getMessage.pending,
      (state, action: PayloadAction<any>) => {
        // state.isLoading = true;
      }
    );
    builder.addCase(
      getMessage.fulfilled,
      (state, action: PayloadAction<any>) => {
        // state.isSkeleton = false;
        state.message = action.payload.data;
      }
    );

    builder.addCase(getMessage.rejected, (state) => {
    //   state.isLoading = false;
    });

    builder.addCase(
      updateMessage.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );
    builder.addCase(
      updateMessage.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.message = action.payload.data;
        toast.success("Messsage Update Successful");
      }
    );

    builder.addCase(updateMessage.rejected, (state) => {
      state.isLoading = false;
       toast.error("Something wrong to update message!");
    });


    builder.addCase(
      getRealOrFakeHost.pending,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );
    builder.addCase(getRealOrFakeHost.fulfilled, (state, action: any) => {
      state.isSkeleton = false;
      if (action.meta.arg.type === 1) {
        state.host = action.payload.hostList;
        state.total = action.payload.totalHosts;
      } else if (action.meta.arg.type === 2) {
        state.fakeHost = action.payload.hostList;
        state.totalFakeHost = action.payload.totalHosts;
      }
    });

    builder.addCase(createHost.pending, (state, action: PayloadAction<any>) => {
      state.isLoading = true;
    });

    builder.addCase(
      createHost.fulfilled,
      (state, action: PayloadAction<any>) => {
        if (action.payload.status) {
          state.fakeHost.unshift(action?.payload?.host);
          Success("Fake Host Add Successfully");
        } else {
          DangerRight(action?.payload?.message);
        }
        state.isLoading = false;
      }
    );
    builder.addCase(createHost.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(
      getRealOrFakeHost.rejected,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
      }
    );

    builder.addCase(deleteHost.pending, (state, action: PayloadAction<any>) => {
      state.isLoading = true;
    });

    builder.addCase(deleteHost.fulfilled, (state, action: any) => {
      if (action?.payload?.status) {
        state.fakeHost = state.fakeHost.filter(
          (host) => host?._id !== action?.meta?.arg
        );
        Success("Host Delete Successfully");
      } else {
        DangerRight(action?.payload?.message);
      }
      state.isLoading = false;
    });

    builder.addCase(deleteHost.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(updateHost.pending, (state, action: PayloadAction<any>) => {
      state.isLoading = true;
    });

    builder.addCase(
      updateHost.fulfilled,
      (state, action: PayloadAction<any>) => {
        if (action.payload.status) {
          const hostIndex = state.fakeHost.findIndex(
            (fakeHost) => fakeHost?._id === action?.payload?.host?._id
          );

          if (hostIndex !== -1) {
            state.fakeHost[hostIndex] = {
              ...state.fakeHost[hostIndex],
              ...action.payload.host,
            };
            Success("Fake Host Update Successfully");
          }
        } else {
          DangerRight(action?.payload?.message);
        }
        state.isLoading = false;
      }
    );

    builder.addCase(updateHost.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(
      blockonlinebusyHost.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(blockonlinebusyHost.fulfilled, (state, action: any) => {
      if (action?.payload?.status) {
        const updateData = action.payload.data;

        const dataIndex = state.fakeHost.findIndex(
          (host) => host?._id === updateData?._id
        );

        if (dataIndex !== -1) {
          state.fakeHost[dataIndex].isBlock = updateData?.isBlock;
          state.fakeHost[dataIndex].isLive = updateData?.isLive;
          state.fakeHost[dataIndex].isBusy = updateData?.isBusy;
        }

        const type = action?.meta?.arg?.type;

        if (type === "isBlock") {
          updateData?.isBlock
            ? Success("Host Blocked Successfully")
            : Success("Host Unblocked Successfully");
        } else if (type === "isLive") {
          updateData?.isLive
            ? Success("Host Live Successfully")
            : Success("Host Offline Successfully");
        } else if (type === "isBusy") {
          updateData?.isBusy
            ? Success("Host Busy Successfully")
            : Success("Host Unbusy Successfully");
        }
      } else {
        DangerRight(action?.payload?.message || "Something went wrong");
      }

      state.isLoading = false;
    });

    builder.addCase(blockonlinebusyHost.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(
      blockRealHost.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(blockRealHost.fulfilled, (state, action: any) => {
      if (action?.payload?.status) {
        const updateData = action.payload.data;

        const dataIndex = state.host.findIndex(
          (host) => host?._id === updateData?._id
        );

        if (dataIndex !== -1) {
          state.host[dataIndex].isBlock = updateData?.isBlock;
        }

        const type = action?.meta?.arg?.type;

        if (type === "isBlock") {
          updateData?.isBlock
            ? Success("Host Blocked Successfully")
            : Success("Host Unblocked Successfully");
        }
      } else {
        DangerRight(action?.payload?.message || "Something went wrong");
      }

      state.isLoading = false;
    });

    builder.addCase(blockRealHost.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(getUserBlockList.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(getUserBlockList.fulfilled, (state, action) => {
      state.isLoading = false;
      state.userBlockList = action?.payload?.blockedHosts;
      state.totalUserBlockList = action.payload.total;
    });

    builder.addCase(getUserBlockList.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(getHostProfile.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(getHostProfile.fulfilled, (state, action) => {
      state.isLoading = false;
      state.hostProfile = action?.payload?.host;
    });

    builder.addCase(getHostProfile.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(getHostFollowerList.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(getHostFollowerList.fulfilled, (state, action) => {
      state.isLoading = false;
      state.hostFollowerList = action?.payload?.followerList;
      state.totalFollowerList = action?.payload?.total;
    });

    builder.addCase(getHostFollowerList.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(
      getCoinPlanHistory.pending,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );

    builder.addCase(
      getCoinPlanHistory.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        state.hostCoinHistory = action.payload.data;
        state.totalHostCoinPlanHistory = action.payload.total;
        state.totalHostEarning = action.payload.totalEarning ?? 0;
      }
    );

    builder.addCase(getCoinPlanHistory.rejected, (state, action) => {
      state.isSkeleton = false;
    });

    builder.addCase(
      getHostCallHistory.pending,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );

    builder.addCase(
      getHostCallHistory.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        state.hostCallHistory = action.payload.data;
        state.totalDuration = action.payload.totalDuration;
        state.totalcallhosthistory = action.payload.total;

      }
    );

    builder.addCase(getHostCallHistory.rejected, (state, action) => {
      state.isSkeleton = false;
    });

    builder.addCase(
      getHostGiftHistory.pending,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );

    builder.addCase(
      getHostGiftHistory.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        state.hostGiftHistory = action.payload.data;
        state.total = action.payload.total;
      }
    );

    builder.addCase(getHostGiftHistory.rejected, (state, action) => {
      state.isSkeleton = false;
    });

    builder.addCase(
      getHostChatHistory.pending,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );

    builder.addCase(
      getHostChatHistory.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        state.hostChatHistory = action.payload.data;
        state.totalHostChatHistory = action.payload.total;
        state.totalChatCount = action.payload.totalChatCount ?? 0;
        state.totalHostChatEarning = action.payload.totalHostChatEarning ?? 0;
        state.totalUserChatSpent = action.payload.totalUserChatSpent ?? 0;
      }
    );

    builder.addCase(getHostChatHistory.rejected, (state, action) => {
      state.isSkeleton = false;
    });

    builder.addCase(
      getLiveBroadCastHistory.pending,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );

    builder.addCase(
      getLiveBroadCastHistory.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        state.hostLiveBroadCastHistory = action.payload.data;
        state.totalLiveHistory = action.payload.total;
        state.totalDuration = action.payload.totalDuration;
      }
    );

    builder.addCase(getLiveBroadCastHistory.rejected, (state, action) => {
      state.isSkeleton = false;
    });
  },
});

export default hostSlice.reducer;
