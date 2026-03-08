import { DangerRight } from "@/api/toastServices";
import { apiInstance, apiInstanceFetch } from "@/utils/ApiInstance";
import { setToast } from "@/utils/toastServices";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface UserState {
  user: any[];
  userCoinHistory: any[];
  userCallHistory: any[];
  userGiftHistory: any[];
  userVipPlanHistory: any[];
  userCoinPlanPurchaseHistory: any[];
  totalFollowingList: any[];
  userWalletData: any[];
  total: number;
  totalCoinPlanPurchase: number;
  totalCallHistory: number;
  totalUserGiftHistory: number;
  totalVipPlanHistory: number;
  countryData: any[];
  booking: any[];
  userProfile: any;
  userFollowingList: any[];
  hostBlockList: any[];
  isLoading: boolean;
  isSkeleton: boolean;
}

const initialState: UserState = {
  user: [],
  total: 0,
  totalCallHistory: 0,
  totalUserGiftHistory: 0,
  totalCoinPlanPurchase: 0,
  totalVipPlanHistory: 0,
  userProfile: {},
  countryData: [],
  userWalletData: [],
  userGiftHistory: [],
  userCallHistory: [],
  userCoinHistory: [],
  totalFollowingList: [],
  userCoinPlanPurchaseHistory: [],
  userFollowingList: [],
  userVipPlanHistory: [],
  hostBlockList: [],
  booking: [],
  isLoading: false,
  isSkeleton: false,
};

interface AllUsersPayload {
  start?: number;
  limit?: number;
  search: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  userId: string;
  meta: any;
  id?: string;
  data: any;
  status: any;
}

export const getRealOrFakeUser: any = createAsyncThunk(
  "api/admin/user/retrieveUserList",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/user/retrieveUserList?start=${payload?.start}&limit=${payload?.limit}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&search=${payload?.search}`
    );
  }
);

export const getUserProfile = createAsyncThunk(
  "api/admin/user/fetchUserProfile",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/user/fetchUserProfile?userId=${payload}`
    );
  }
);

export const getUserFollowingList: any = createAsyncThunk(
  "api/admin/followerFollowing/fetchFollowing",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/followerFollowing/fetchFollowing?userId=${payload}`
    );
  }
);

export const getHostBlockList: any = createAsyncThunk(
  "api/admin/block/listBlockedHostsForUser?userId",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/block/listBlockedHostsForUser?userId=${payload}`
    );
  }
);

export const getCoinPlanHistory = createAsyncThunk(
  "api/admin/history/getCoinTransactionHistory",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/history/getCoinTransactionHistory?userId=${payload?.id}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&endDate=${payload?.limit}`
    );
  }
);

export const getCallHistory: any = createAsyncThunk(
  "api/admin/history/fetchCallTransactionHistory",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/history/fetchCallTransactionHistory?userId=${payload?.id}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`
    );
  }
);

export const getGiftHistory: any = createAsyncThunk(
  "api/admin/history/retrieveGiftTransactionHistory",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/history/retrieveGiftTransactionHistory?userId=${payload?.id}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`
    );
  }
);



export const getVipPlanPurchaseHistory: any = createAsyncThunk(
  "api/admin/history/getVIPPlanTransactionHistory",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/history/getVIPPlanTransactionHistory?userId=${payload?.id}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`
    );
  }
);

export const getCoinPlanPurchaseHistory: any = createAsyncThunk(
  "api/admin/history/fetchCoinPlanTransactionHistory",
  async (payload: AllUsersPayload | undefined) => {

    return apiInstanceFetch.get(
      `api/admin/history/fetchCoinPlanTransactionHistory?userId=${payload?.id}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`
    );
  }
);



export const blockuser: any = createAsyncThunk(
  "api/admin/user/modifyUserBlockStatus",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.patch(
      `api/admin/user/modifyUserBlockStatus?userId=${payload}`
    );
  }
);

export const getUserAppointment = createAsyncThunk(
  "admin/user/appointment",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/appointment/fetchCustomerBookings?status=${payload?.status}&start=${payload?.start}&limit=${payload?.limit}&customerId=${payload?.id}&startDate=${payload?.startDate}&endDate=${payload?.endDate}`
    );
  }
);

export const updateUserCoin = createAsyncThunk(
  "api/admin/user/updateUserCoin",
  async (
    payload: { userId: string; amount: number; type: "add" | "deduct" },
    { rejectWithValue }
  ) => {
    try {
      const { userId, amount, type } = payload;

      const historyType = type === "add" ? 14 : 15;

      const body = {
        userId,
        coin: amount,
        action: type,
        historyType,
      };

      console.log('body: ', body);

      const res = await apiInstanceFetch.patch(`api/admin/user/updateUserCoin`, body);
      console.log('res: ', res);

      if (res.status) {
        setToast("success", `Coins ${type === "add" ? "added" : "deducted"} successfully`);
      } else {
        DangerRight(res?.message || "Failed to update coins");
      }

      return res;
    } catch (err: any) {
      DangerRight(err?.response?.data?.message || "Something went wrong while updating coins");
      return rejectWithValue(err?.response?.data);
    }
  }
);


const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getRealOrFakeUser.pending, (state, action: PayloadAction<any>) => {
      state.isSkeleton = true;
    });

    builder.addCase(
      getRealOrFakeUser.fulfilled,
      (state, action: PayloadAction<any>) => {

        state.isSkeleton = false;
        state.user = action.payload.data;
        state.total = action.payload.total;
      }
    );
    builder.addCase(getRealOrFakeUser.rejected, (state) => {
      state.isSkeleton = false;
    });

    builder.addCase(
      getCoinPlanHistory.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      getCoinPlanHistory.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.userCoinHistory = action.payload.data;
        state.userWalletData = action.payload.data;
      }
    );

    builder.addCase(getCoinPlanHistory.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(
      getCallHistory.pending,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );

    builder.addCase(
      getCallHistory.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        state.userCallHistory = action.payload.data;
        state.totalCallHistory = action.payload.total

      }
    );

    builder.addCase(getCallHistory.rejected, (state, action) => {
      state.isSkeleton = false;
    });



    builder.addCase(
      getGiftHistory.pending,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );

    builder.addCase(
      getGiftHistory.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        state.userGiftHistory = action.payload.data;
        state.totalUserGiftHistory = action.payload.total;
      }
    );

    builder.addCase(getGiftHistory.rejected, (state, action) => {
      state.isSkeleton = false;
    });


    builder.addCase(
      getVipPlanPurchaseHistory.pending,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );

    builder.addCase(
      getVipPlanPurchaseHistory.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        state.userVipPlanHistory = action.payload.data;
        state.totalVipPlanHistory = action?.payload?.total;
      }
    );

    builder.addCase(getVipPlanPurchaseHistory.rejected, (state, action) => {
      state.isSkeleton = false;
    });

    builder.addCase(
      getCoinPlanPurchaseHistory.pending,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );

    builder.addCase(
      getCoinPlanPurchaseHistory.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        state.userCoinPlanPurchaseHistory = action.payload.data;
        state.totalCoinPlanPurchase = action?.payload?.total;
      }
    );

    builder.addCase(getCoinPlanPurchaseHistory.rejected, (state, action) => {
      state.isSkeleton = false;
    });




    builder.addCase(getUserProfile.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(getUserProfile.fulfilled, (state, action) => {
      state.isLoading = false;
      state.userProfile = action?.payload?.user;
    });

    builder.addCase(getUserAppointment.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(getUserAppointment.fulfilled, (state, action) => {
      state.isLoading = false;
      state.booking = action?.payload?.data;
      state.total = action?.payload?.total;
    });

    builder.addCase(getUserAppointment.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(getUserProfile.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(getUserFollowingList.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(getUserFollowingList.fulfilled, (state, action) => {

      state.isLoading = false;
      state.userFollowingList = action?.payload?.followingList;
      state.totalFollowingList = action?.payload?.total;
    });

    builder.addCase(getHostBlockList.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(getHostBlockList.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(getHostBlockList.fulfilled, (state, action) => {

      state.isLoading = false;
      state.hostBlockList = action?.payload?.blockedHosts;
    });

    builder.addCase(getUserFollowingList.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(blockuser.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(blockuser.fulfilled, (state: any, action: any) => {
      if (action?.payload?.status) {

        const blockuserIndx = action?.payload?.data;
        const userIndx = state.user.findIndex(
          (user: any) => user?._id === blockuserIndx?._id
        );
        if (userIndx !== -1) {

          state.user[userIndx] = {
            ...state.user[userIndx],
            ...action.payload.data,
          };

          setToast("success", action?.payload?.message)
        } else {
          DangerRight(action?.payload?.message)
        }

      }
      state.isLoading = false;
    });

    builder.addCase(blockuser.rejected, (state, action) => {
      state.isLoading = false;
    })
    builder.addCase(updateUserCoin.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(updateUserCoin.fulfilled, (state, action: PayloadAction<any>) => {
      state.isLoading = false;

      // Optional: update local user data if needed
      const updatedUser = action?.payload?.data;
      if (updatedUser?._id) {
        const userIndex = state.user.findIndex((u) => u._id === updatedUser._id);
        if (userIndex !== -1) {
          state.user[userIndex] = { ...state.user[userIndex], ...updatedUser };
        }
      }
    });

    builder.addCase(updateUserCoin.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export default userSlice.reducer;
