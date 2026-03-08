import { DangerRight, Success } from "@/api/toastServices";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { baseURL } from "@/utils/config";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

interface UserState {
    coinPlan: any[];
    coinPlanHistory: any[];
    totalCoinPlanHistory: number;
    total: number;
    totalIncoming: number;
    totalOutGoing: number;
    isLoading: boolean;
    isSkeleton: boolean;
    adminEarning: number;
    planPurchaseHistory: any[];
    totalPlanPurchaseHistory: number;
       userPlanPurchaseHistory: any[];
    totalUserPlanPurchaseHistory: number;
}

const initialState: UserState = {
    coinPlan: [],
    coinPlanHistory: [],
    total: 0,
    totalCoinPlanHistory: 0,
    totalIncoming: 0,
    totalOutGoing: 0,
    isLoading: false,
    isSkeleton: false,
    adminEarning: 0,
    planPurchaseHistory: [],
    totalPlanPurchaseHistory: 0,
     userPlanPurchaseHistory: [],
    totalUserPlanPurchaseHistory: 0,
};

interface AllCoinPlanPayload {
    name: string;
    start: number;
    limit: number;
    startDate: string;
    endDate: string;
    userId: string;

}


export const getCoinPlan: any = createAsyncThunk(
    "api/admin/coinPlan/fetchCoinPlans",
    async (payload: AllCoinPlanPayload | undefined) => {
        return apiInstanceFetch.get(`api/admin/coinPlan/fetchCoinPlans?start=${payload?.start}&limit=${payload?.limit}`);
    }
);

export const getCoinPlanHistory: any = createAsyncThunk(
    "api/admin/coinPlan/retrieveUserPurchaseRecords",
    async (payload: AllCoinPlanPayload | undefined) => {
        return apiInstanceFetch.get(`api/admin/coinPlan/retrieveUserPurchaseRecords?start=${payload?.start}&limit=${payload?.limit}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&userId=${payload?.userId}`);
    }
);

export const getCoinPlanUserHistory: any = createAsyncThunk(
    "api/admin/history/getCoinTransactionHistory",
    async (payload: any) => {

        return apiInstanceFetch.get(`api/admin/history/getCoinTransactionHistory?userId=${payload?.id}&start=${payload?.start}&limit=${payload?.limit}&startDate=${payload?.startDate}&endDate=${payload?.endDate}`);
    }
);

export const createCoinPlan = createAsyncThunk(
    "api/admin/coinPlan/createCoinPlan",
    async (payload) => {

        return apiInstanceFetch.post(`api/admin/coinPlan/createCoinPlan`, payload);
    }
);

export const deleteCoinPlan: any = createAsyncThunk(
    "api/admin/coinPlan/removeCoinPlan",
    async (payload: AllCoinPlanPayload | undefined) => {
        return apiInstanceFetch.delete(`api/admin/coinPlan/removeCoinPlan?coinPlanId=${payload}`);
    }
);

export const updateCoinPlan = createAsyncThunk(
    "api/admin/coinPlan/modifyCoinPlan",
    async (payload: any) => {
        return apiInstanceFetch.patch(
            `api/admin/coinPlan/modifyCoinPlan`, payload
        );
    }
);

export const activeCoinPlan: any = createAsyncThunk(
    "api/admin/coinPlan/toggleCoinPlanStatus",
    async (payload: any) => {
        return apiInstanceFetch.patch(`api/admin/coinPlan/toggleCoinPlanStatus?coinPlanId=${payload?.id}&field=${payload?.type}`);
    }
);

export const getPlanPurchaseHistory: any = createAsyncThunk(
    "getPlanPurchaseHistory",
    async (payload: { start: number; limit: number; startDate: string; endDate: string; type: number; search: string } | undefined) => {
        return apiInstanceFetch.get(`api/admin/coinPlan/retrieveUserPurchaseRecords?start=${payload?.start}&limit=${payload?.limit}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&type=${payload?.type}&search=${payload?.search}`);
    }
);

export const retrieveCoinPlanPurchase: any = createAsyncThunk(
    "retrieveCoinPlanPurchase",
    async (payload: { start: number; limit: number; startDate: string; endDate: string; type: number; userId: string; search: string } | undefined) => {
        return apiInstanceFetch.get(`api/admin/coinPlan/retrieveCoinPlanPurchase?start=${payload?.start}&limit=${payload?.limit}&type=${payload?.type}&userId=${payload?.userId}&search=${payload?.search}`);
    }
);



const coinPlanSlice = createSlice({
    name: "coinplan",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getCoinPlan.pending, (state, action: PayloadAction<any>) => {
            state.isSkeleton = true;
        });
        builder.addCase(
            getCoinPlan.fulfilled,
            (state, action: PayloadAction<any>) => {
                state.isSkeleton = false;
                state.coinPlan = action.payload.data;
                state.total = action.payload.total
            }
        );
        builder.addCase(getCoinPlan.rejected, (state, action: PayloadAction<any>) => {
            state.isSkeleton = false;
        });


        builder.addCase(getCoinPlanHistory.pending, (state, action: PayloadAction<any>) => {
            state.isSkeleton = true;
        });
        builder.addCase(
            getCoinPlanHistory.fulfilled,
            (state, action: PayloadAction<any>) => {
                state.isSkeleton = false;
                state.coinPlanHistory = action.payload.data;
                state.totalCoinPlanHistory = action.payload.total
            }
        );
        builder.addCase(getCoinPlanHistory.rejected, (state, action: PayloadAction<any>) => {
            state.isSkeleton = false;
        });

        builder.addCase(getCoinPlanUserHistory.pending, (state, action: PayloadAction<any>) => {
            state.isSkeleton = true;
        });
        builder.addCase(
            getCoinPlanUserHistory.fulfilled,
            (state, action: PayloadAction<any>) => {

                state.isSkeleton = false;
                state.coinPlanHistory = action.payload.data;
                state.totalCoinPlanHistory = action.payload.total;
                state.totalIncoming = action?.payload?.totalIncome;
                state.totalOutGoing = action?.payload?.totalOutgoing;
            }
        );
        builder.addCase(getCoinPlanUserHistory.rejected, (state, action: PayloadAction<any>) => {
            state.isSkeleton = false;
        });

        builder.addCase(
            createCoinPlan.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(
            createCoinPlan.fulfilled,
            (state, action: PayloadAction<any>) => {
                state.isLoading = false;
                if (action.payload.status) {
                    state.coinPlan.unshift(action?.payload?.data);

                    Success("Coin Plan Add Successfully");
                } else {
                    DangerRight(action?.payload?.message)
                }
            }
        );
        builder.addCase(createCoinPlan.rejected, (state) => {
            state.isLoading = false;
        });

        builder.addCase(
            deleteCoinPlan.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(deleteCoinPlan.fulfilled, (state, action: any) => {
            if (action?.payload?.status) {

                state.coinPlan = state.coinPlan.filter(
                    (coinPlan) => coinPlan?._id !== action?.meta?.arg
                );
                Success("Coin Plan Delete Successfully");
            } else {
                DangerRight(action?.payload?.message)

            }
            state.isLoading = false;
        });

        builder.addCase(deleteCoinPlan.rejected, (state, action) => {
            state.isLoading = false;
        });


        builder.addCase(
            updateCoinPlan.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(
            updateCoinPlan.fulfilled,
            (state, action: PayloadAction<any>) => {
                if (action.payload.status) {
                    const coinPlanIndex = state.coinPlan.findIndex(
                        (coinPlan) => coinPlan?._id === action?.payload?.data?._id
                    );

                    if (coinPlanIndex !== -1) {

                        state.coinPlan[coinPlanIndex] = {
                            ...state.coinPlan[coinPlanIndex],
                            ...action.payload.data,
                        };
                        Success("Coin Plan Update Successfully");

                    }
                }
                else {
                    DangerRight(action?.payload?.message)

                }
                state.isLoading = false;
            }
        );

        builder.addCase(updateCoinPlan.rejected, (state, action) => {
            state.isLoading = false;
        });

        builder.addCase(
            activeCoinPlan.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(
            activeCoinPlan.fulfilled,
            (state, action: any) => {

                if (action?.payload?.status) {

                    const updatedCoinPlan = action.payload.data;
                    const bannerIndex = state.coinPlan.findIndex(
                        (coinPlan) => coinPlan?._id === updatedCoinPlan?._id
                    );
                    if (bannerIndex !== -1 && action?.meta?.arg?.type === "isActive") {
                        state.coinPlan[bannerIndex].isActive = updatedCoinPlan.isActive;

                        updatedCoinPlan?.isActive === true ?
                            Success("Coin Plan Active Successfully") :
                            Success("Coin Plan InActive Succesfully")

                    } else if (bannerIndex !== -1 && action?.meta?.arg?.type === "isFeatured") {
                        state.coinPlan[bannerIndex].isFeatured = updatedCoinPlan.isFeatured;

                        Success("Coin Plan Status Updated Successfully")

                    }
                } else {
                    DangerRight(action?.payload?.message)
                }
                state.isLoading = false;
            }
        );

        builder.addCase(activeCoinPlan.rejected, (state, action) => {
            state.isLoading = false;
        });

        builder.addCase(getPlanPurchaseHistory.pending, (state, action: PayloadAction<any>) => {
            state.isSkeleton = true;
        });
        builder.addCase(
            getPlanPurchaseHistory.fulfilled,
            (state, action: PayloadAction<any>) => {
                state.isSkeleton = false;
                state.planPurchaseHistory = action.payload.data;
                state.totalPlanPurchaseHistory = action.payload.total;
                state.adminEarning = action.payload.adminEarnings;
            }
        );
        builder.addCase(getPlanPurchaseHistory.rejected, (state, action: PayloadAction<any>) => {
            state.isSkeleton = false;
        });

        builder.addCase(retrieveCoinPlanPurchase.pending, (state, action: PayloadAction<any>) => {
            state.isSkeleton = true;
        });
        builder.addCase(
            retrieveCoinPlanPurchase.fulfilled,
            (state, action: PayloadAction<any>) => {
                state.isSkeleton = false;
                state.userPlanPurchaseHistory = action.payload.data;
                state.totalUserPlanPurchaseHistory = action.payload.totalRecords;
            }
        );
        builder.addCase(retrieveCoinPlanPurchase.rejected, (state, action: PayloadAction<any>) => {
            state.isSkeleton = false;
        });
    },
});

export default coinPlanSlice.reducer;
