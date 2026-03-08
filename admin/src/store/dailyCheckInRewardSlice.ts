import { DangerRight, Success } from "@/api/toastServices";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { baseURL } from "@/utils/config";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

interface UserState {
    dailyReward: any[];
    total: number;
    isLoading: boolean;
    isSkeleton: boolean;
}

const initialState: UserState = {
    dailyReward: [],
    total: 0,
    isLoading: false,
    isSkeleton: false,
};

interface AllImpressionPayload {
    name: string;
    start: number;
    limit: number
}


export const getDailyCheckInReward: any = createAsyncThunk(
    "api/admin/dailyRewardCoin/fetchDailyReward",
    async (payload: AllImpressionPayload | undefined) => {
        return apiInstanceFetch.get(`api/admin/dailyRewardCoin/fetchDailyReward`);
    }
);



export const createDailyReward = createAsyncThunk(
    "api/admin/dailyRewardCoin/createDailyReward",
    async (payload) => {

        return apiInstanceFetch.post(`api/admin/dailyRewardCoin/createDailyReward`, payload);
    }
);

export const deleteDailyReward: any = createAsyncThunk(
    "api/admin/dailyRewardCoin/removeDailyReward",
    async (payload: AllImpressionPayload | undefined) => {
        return apiInstanceFetch.delete(`api/admin/dailyRewardCoin/removeDailyReward?dailyRewardCoinId=${payload}`);
    }
);

export const updateDailyReward = createAsyncThunk(
    "api/admin/dailyRewardCoin/modifyDailyReward",
    async (payload: any) => {
        return apiInstanceFetch.patch(
            `api/admin/dailyRewardCoin/modifyDailyReward` , payload
        );
    }
);



const dailyCheckInRewardSlice = createSlice({
    name: "dailyCheckInReward",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getDailyCheckInReward.pending, (state, action: PayloadAction<any>) => {
            state.isSkeleton = true;
        });
        builder.addCase(
            getDailyCheckInReward.fulfilled,
            (state, action: PayloadAction<any>) => {
                state.isSkeleton = false;
                state.dailyReward = action.payload.data;
                state.total = action.payload.total
            }
        );
        builder.addCase(getDailyCheckInReward.rejected, (state, action: PayloadAction<any>) => {
            state.isSkeleton = false;
        });

       

        builder.addCase(
            createDailyReward.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(
            createDailyReward.fulfilled,
            (state, action: PayloadAction<any>) => {
                state.isLoading = false;
                if (action.payload.status) {
                    state.dailyReward.unshift(action?.payload?.data);

                    Success("Daily Reward Add Successfully");
                } else {
                    DangerRight(action?.payload?.message)
                }
            }
        );
        builder.addCase(createDailyReward.rejected, (state) => {
            state.isLoading = false;
        });

        builder.addCase(
            deleteDailyReward.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(deleteDailyReward.fulfilled, (state, action: any) => {
            if (action?.payload?.status) {

                state.dailyReward = state.dailyReward.filter(
                    (dailyReward) => dailyReward?._id !== action?.meta?.arg
                );
                Success("Daily Check In Reward Delete Successfully");
            } else {
                DangerRight(action?.payload?.message)
            }
            state.isLoading = false;
        });

        builder.addCase(deleteDailyReward.rejected, (state, action) => {
            state.isLoading = false;
        });


        builder.addCase(
            updateDailyReward.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(
            updateDailyReward.fulfilled,
            (state, action: PayloadAction<any>) => {
                if (action.payload.status) {
                    
                    const impressionIndex = state.dailyReward.findIndex(
                        (dailyReward) => dailyReward?._id === action?.payload?.data?._id
                    );

                    if (impressionIndex !== -1) {
                        state.dailyReward[impressionIndex] = {
                            ...state.dailyReward[impressionIndex],
                            ...action.payload.data,
                        };
                        Success("Daily Check In Reward Update Successfully");
                    }else {
                        
                        DangerRight(action?.payload?.message)
                    }
                }
                state.isLoading = false;
            }
        );

        builder.addCase(updateDailyReward.rejected, (state, action) => {
            state.isLoading = false;
        });
    },
});

export default dailyCheckInRewardSlice.reducer;
