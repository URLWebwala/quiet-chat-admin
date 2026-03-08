import { DangerRight, Success } from "@/api/toastServices";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { baseURL } from "@/utils/config";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

interface UserState {
    vipPlan: any[];
    vipPlanBenefits : any[];
    coinPlanHistory: any[];
    totalCoinPlanHistory: number;
    total: number;
    isLoading: boolean;
    isSkeleton: boolean;
}

const initialState: UserState = {
    vipPlan: [],
    vipPlanBenefits : [],
    coinPlanHistory: [],
    total: 0,
    totalCoinPlanHistory: 0,
    isLoading: false,
    isSkeleton: false,
};

interface AllCoinPlanPayload {
    name: string;
    start: number;
    limit: number;
    startDate: string;
    endDate: string;
    userId: string;

}


export const getVipPlan: any = createAsyncThunk(
    "api/admin/vipPlan/getVipPlans",
    async (payload: AllCoinPlanPayload | undefined) => {
        return apiInstanceFetch.get(`api/admin/vipPlan/getVipPlans?start=${payload?.start}&limit=${payload?.limit}`);
    }
);

export const getVipPlanBeneFits: any = createAsyncThunk(
    "api/admin/vipPlanPrivilege/retrieveVipPrivilege",
    async (payload: any) => {
        return apiInstanceFetch.get(`api/admin/vipPlanPrivilege/retrieveVipPrivilege`);
    }
);

export const getCoinPlanHistory: any = createAsyncThunk(
    "api/admin/vipPlan/retrieveUserPurchaseRecords",
    async (payload: AllCoinPlanPayload | undefined) => {
        return apiInstanceFetch.get(`api/admin/coinPlan/retrieveUserPurchaseRecords?start=${payload?.start}&limit=${payload?.limit}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&userId=${payload?.userId}`);
    }
);

export const createVipPlan = createAsyncThunk(
    "api/admin/vipPlan/createVipPlan",
    async (payload) => {

        return apiInstanceFetch.post(`api/admin/vipPlan/createVipPlan`, payload);
    }
);

export const deleteVipPlan: any = createAsyncThunk(
    "api/admin/vipPlan/deleteVipPlan?vipPlanId1",
    async (payload: AllCoinPlanPayload | undefined) => {
        return apiInstanceFetch.delete(`api/admin/vipPlan/deleteVipPlan?vipPlanId=${payload}`);
    }
);

export const updateVipPlan = createAsyncThunk(
    "api/admin/vipPlan/updateVipPlan",
    async (payload: any) => {
        return apiInstanceFetch.patch(
            `api/admin/vipPlan/updateVipPlan`, payload
        );
    }
);

export const updateVipPlanBenefits = createAsyncThunk(
    "api/admin/vipPlanPrivilege/modifyVipPrivilege",
    async (payload: any) => {
        return apiInstanceFetch.patch(
            `api/admin/vipPlanPrivilege/modifyVipPrivilege`, payload
        );
    }
);

export const activeVipPlan: any = createAsyncThunk(
    "api/admin/vipPlan/toggleVipPlanStatus?vipPlanId",
    async (payload: any) => {
        return apiInstanceFetch.patch(`api/admin/vipPlan/toggleVipPlanStatus?vipPlanId=${payload}`);
    }
);



const vipPlanSlice = createSlice({
    name: "vipPlan",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getVipPlan.pending, (state, action: PayloadAction<any>) => {
            state.isSkeleton = true;
        });
        builder.addCase(
            getVipPlan.fulfilled,
            (state, action: PayloadAction<any>) => {
                state.isSkeleton = false;
                state.vipPlan = action.payload.data;
                state.total = action.payload.total
            }
        );
        builder.addCase(getVipPlan.rejected, (state, action: PayloadAction<any>) => {
            state.isSkeleton = false;
        });

         builder.addCase(getVipPlanBeneFits.pending, (state, action: PayloadAction<any>) => {
                    state.isSkeleton = true;
                });
                builder.addCase(
                    getVipPlanBeneFits.fulfilled,
                    (state, action: PayloadAction<any>) => {
                        
                        state.isSkeleton = false;
                        state.vipPlanBenefits = action.payload.data;
                        state.total = action.payload.total
                    }
                );
                builder.addCase(getVipPlanBeneFits.rejected, (state, action: PayloadAction<any>) => {
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

        builder.addCase(
            createVipPlan.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(
            createVipPlan.fulfilled,
            (state, action: PayloadAction<any>) => {
                state.isLoading = false;
                if (action.payload.status) {
                    state.vipPlan.unshift(action?.payload?.data);

                    Success("Vip Plan Add Successfully");
                } else {
                    DangerRight(action?.payload?.message)
                }
            }
        );
        builder.addCase(createVipPlan.rejected, (state) => {
            state.isLoading = false;
        });

        builder.addCase(
            deleteVipPlan.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(deleteVipPlan.fulfilled, (state, action: any) => {
            if (action?.payload?.status) {

                state.vipPlan = state.vipPlan.filter(
                    (vipPlan) => vipPlan?._id !== action?.meta?.arg
                );
                Success("Vip Plan Delete Successfully");
            } else {
                DangerRight(action?.payload?.message)

            }
            state.isLoading = false;
        });

        builder.addCase(deleteVipPlan.rejected, (state, action) => {
            state.isLoading = false;
        });


        builder.addCase(
            updateVipPlan.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(
            updateVipPlan.fulfilled,
            (state, action: PayloadAction<any>) => {
                if (action.payload.status) {
                    const vipPlanIndex = state.vipPlan.findIndex(
                        (vipPlan) => vipPlan?._id === action?.payload?.data?._id
                    );

                    if (vipPlanIndex !== -1) {

                        state.vipPlan[vipPlanIndex] = {
                            ...state.vipPlan[vipPlanIndex],
                            ...action.payload.data,
                        };
                        Success("Vip Plan Update Successfully");
                    }
                }
                else {
                    DangerRight(action?.payload?.message)

                }
                state.isLoading = false;
            }
        );

        builder.addCase(updateVipPlan.rejected, (state, action) => {
            state.isLoading = false;
        });

        builder.addCase(
            updateVipPlanBenefits.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(
            updateVipPlanBenefits.fulfilled,
            (state, action: PayloadAction<any>) => {
                if (action.payload.status) {
                        state.vipPlanBenefits = action?.payload?.data

                 

                      
                        Success("Vip Plan Benefits Update Successfully");
                 
                }
                else {
                    DangerRight(action?.payload?.message)

                }
                state.isLoading = false;
            }
        );

        builder.addCase(updateVipPlanBenefits.rejected, (state, action) => {
            state.isLoading = false;
        });



        builder.addCase(
            activeVipPlan.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(
            activeVipPlan.fulfilled,
            (state, action: PayloadAction<any>) => {

                if (action?.payload?.status) {

                    const updateVipPlan = action.payload.data;
                    const bannerIndex = state.vipPlan.findIndex(
                        (vipPlan) => vipPlan?._id === updateVipPlan?._id
                    );
                    if (bannerIndex !== -1) {
                        state.vipPlan[bannerIndex].isActive = updateVipPlan.isActive;
                    }
                    Success("Vip Plan Status Update Successfully");
                } else {
                    DangerRight(action?.payload?.message)
                }
                state.isLoading = false;
            }
        );

        builder.addCase(activeVipPlan.rejected, (state, action) => {
            state.isLoading = false;
        });
    },
});

export default vipPlanSlice.reducer;
