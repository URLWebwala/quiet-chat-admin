import { DangerRight, Success } from "@/api/toastServices";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface UserState {
    host: any[];
    impressionList : any[];
    agencyWiseHost : any[];
    liveHost : any[];
    totalCallHistory : any[];
    hostCoinHistory: any[];
    hostCallHistory: any[];
    hostGiftHistory: any[];
    hostChatHistory: any[];
    hostLiveBroadCastHistory: any[];
    totalLiveHistory : any[];
    userBlockList: any[];
    totalFollowerList: number,
    totalHostCoinPlanHistory: number;
    totalHostChatHistory: number;
    totalChatCount: number;
    totalHostChatEarning: number;
    totalUserChatSpent: number;
    totalHostEarning: number;
    total: number;
    isLoading: boolean;
    isSkeleton: boolean;
    totalDuration: number;
}

const initialState: UserState = {
    host: [],
    impressionList : [],
    agencyWiseHost : [],
    hostCoinHistory: [],
    totalCallHistory : [],
    liveHost : [],
    hostCallHistory: [],
    hostGiftHistory: [],
    hostChatHistory: [],
    hostLiveBroadCastHistory: [],
    userBlockList: [],
    totalLiveHistory : [],
    totalFollowerList: 0,
    total: 0,
    totalHostCoinPlanHistory: 0,
    totalHostChatHistory: 0,
    totalChatCount: 0,
    totalHostChatEarning: 0,
    totalUserChatSpent: 0,
    totalHostEarning: 0,
    isLoading: false,
    isSkeleton: false,
    totalDuration: 0
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


export const getRealOrFakeHost: any = createAsyncThunk(
    "api/admin/host/fetchHostList",
    async (payload: AllImpressionPayload | undefined) => {
        return apiInstanceFetch.get(`api/admin/host/fetchHostList?start=${payload?.start}&limit=${payload?.limit}&search=${payload?.search}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&type=${payload?.type}`);
    }
);

export const getImpression: any = createAsyncThunk(
    "api/admin/impression/fetchAdImpressionMetrics",
    async (payload: AllImpressionPayload | undefined) => {
        return apiInstanceFetch.get(`api/admin/impression/fetchAdImpressionMetrics`);
    }
);

export const getLiveHost: any = createAsyncThunk(
    "api/agency/liveBroadcaster/getLiveHosts",
    async (payload: AllImpressionPayload | undefined) => {
        return apiInstanceFetch.get(`api/agency/liveBroadcaster/getLiveHosts?start=${payload?.start}&limit=${payload?.limit}`);
    }
);

export const getAgencyWiseHost: any = createAsyncThunk(
    "api/agency/host/retrieveAgencyHosts",
    async (payload: AllImpressionPayload | undefined) => {
        return apiInstanceFetch.get(`api/agency/host/retrieveAgencyHosts?start=${payload?.start}&limit=${payload?.limit}`);
    }
);

export const createHost = createAsyncThunk(
    "api/admin/host/createHost",
    async (payload) => {

        return apiInstanceFetch.post(`api/admin/host/createHost`, payload);
    }
);

export const deleteHost: any = createAsyncThunk(
    "api/admin/host/deleteHost",
    async (payload: AllImpressionPayload | undefined) => {
        return apiInstanceFetch.delete(`api/admin/host/deleteHost?hostId=${payload}`);
    }
);

export const updateHost = createAsyncThunk(
    "api/admin/host/updateHost",
    async (payload: any) => {
        return apiInstanceFetch.patch(
            `api/admin/host/updateHost`, payload
        );
    }
);

export const blockUnblockHost: any = createAsyncThunk(
    "api/admin/host/toggleHostStatusByType?hostId",
    async (payload: any) => {
        return apiInstanceFetch.patch(`api/admin/host/toggleHostStatusByType?hostId=${payload?.hostId}&type=${payload?.type}`);
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
    "api/agency/history/getCoinTransactions",
    async (payload: any) => {
        return apiInstanceFetch.get(
            `api/agency/history/getCoinTransactions?hostId=${payload?.hostId}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`
        );
    }
);

export const getHostCallHistory: any = createAsyncThunk(
    "api/agency/history/getCallTransactions",
    async (payload: any) => {
        return apiInstanceFetch.get(
            `api/agency/history/getCallTransactions?hostId=${payload?.hostId}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`
        );
    }
);



export const getHostGiftHistory: any = createAsyncThunk(
    "api/agency/history/getGiftTransactions",
    async (payload: any) => {
        return apiInstanceFetch.get(
            `api/agency/history/getGiftTransactions?hostId=${payload?.id}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`
        );
    }
);

export const getHostChatHistory: any = createAsyncThunk(
    "api/agency/history/getChatTransactions",
    async (payload: any) => {
        return apiInstanceFetch.get(
            `api/agency/history/getChatTransactions?hostId=${payload?.id}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`
        );
    }
);

export const getLiveBroadCastHistory: any = createAsyncThunk(
    "api/agency/liveBroadcastHistory/getLiveSessionHistory",
    async (payload: any) => {
        return apiInstanceFetch.get(
            `api/agency/liveBroadcastHistory/getLiveSessionHistory?hostId=${payload?.id}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`
        );
    }
);




const hostSlice = createSlice({
    name: "agency",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getRealOrFakeHost.pending, (state, action: PayloadAction<any>) => {
            state.isSkeleton = true;
        });
        builder.addCase(
            getRealOrFakeHost.fulfilled,
            (state, action: PayloadAction<any>) => {

                state.isSkeleton = false;
                state.host = action.payload.hostList;
                state.total = action.payload.totalHosts
            }
        );

        builder.addCase(getAgencyWiseHost.rejected, (state, action: PayloadAction<any>) => {
            state.isSkeleton = false;
        });

        builder.addCase(getAgencyWiseHost.pending, (state, action: PayloadAction<any>) => {
            state.isSkeleton = true;
        });
        builder.addCase(
            getAgencyWiseHost.fulfilled,
            (state, action: PayloadAction<any>) => {
                
                state.isSkeleton = false;
                state.agencyWiseHost = action.payload.data;
            }
        );

        builder.addCase(getImpression.rejected, (state, action: PayloadAction<any>) => {
            state.isSkeleton = false;
        });

        builder.addCase(getImpression.pending, (state, action: PayloadAction<any>) => {
            state.isSkeleton = true;
        });
        builder.addCase(
            getImpression.fulfilled,
            (state, action: PayloadAction<any>) => {
                
                state.isSkeleton = false;
                state.impressionList = action.payload.data;
            }
        );

        builder.addCase(getLiveHost.rejected, (state, action: PayloadAction<any>) => {
            state.isSkeleton = false;
        });

        builder.addCase(getLiveHost.pending, (state, action: PayloadAction<any>) => {
            state.isSkeleton = true;
        });
        builder.addCase(
            getLiveHost.fulfilled,
            (state, action: PayloadAction<any>) => {
                    
                state.isSkeleton = false;
                state.liveHost = action.payload.hosts;
            }
        );

        builder.addCase(getRealOrFakeHost.rejected, (state, action: PayloadAction<any>) => {
            state.isSkeleton = false;
        });

        builder.addCase(
            createHost.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(
            createHost.fulfilled,
            (state, action: PayloadAction<any>) => {
                state.isLoading = false;
                if (action.payload.status) {
                    state.host.unshift(action?.payload?.host);

                    Success("Fake Host Add Successfully");
                } else {
                    DangerRight(action?.payload?.message)
                }
            }
        );
        builder.addCase(createHost.rejected, (state) => {
            state.isLoading = false;
        });

        builder.addCase(
            deleteHost.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(deleteHost.fulfilled, (state, action: any) => {
            if (action?.payload?.status) {

                state.host = state.host.filter(
                    (host) => host?._id !== action?.meta?.arg
                );
                Success("Host Delete Successfully");
            } else {
                DangerRight(action?.payload?.message)
            }
            state.isLoading = false;
        });

        builder.addCase(deleteHost.rejected, (state, action) => {
            state.isLoading = false;
        });


        builder.addCase(
            updateHost.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(
            updateHost.fulfilled,
            (state, action: PayloadAction<any>) => {
                
                if (action.payload.status) {
                    
                    const hostIndex = state.host.findIndex(
                        (host) => host?._id === action?.payload?.host?._id
                    );

                    if (hostIndex !== -1) {

                        state.host[hostIndex] = {
                            ...state.host[hostIndex],
                            ...action.payload.host,
                        };
                        Success("Fake Host Update Successfully");
                    }
                }
                else {
                    
                    DangerRight(action?.payload?.message)
                }
                state.isLoading = false;
            }
        );

        builder.addCase(updateHost.rejected, (state, action) => {
            state.isLoading = false;
        });


      


        builder.addCase(getUserBlockList.rejected, (state, action) => {
            state.isLoading = false;
        });

        builder.addCase(getUserBlockList.pending, (state, action) => {
            state.isLoading = true;
        });

        builder.addCase(getUserBlockList.fulfilled, (state, action) => {

            state.isLoading = false;
            state.userBlockList = action?.payload?.blockedHosts;
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
                state.hostCoinHistory = action.payload.data;
                state.totalHostCoinPlanHistory = action.payload.total
                state.totalHostEarning = action.payload.totalEarning ?? 0
            }
        );

        builder.addCase(getCoinPlanHistory.rejected, (state, action) => {
            state.isLoading = false;
        });

        builder.addCase(
            getHostCallHistory.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(
            getHostCallHistory.fulfilled,
            (state, action: PayloadAction<any>) => {
                
                state.isLoading = false;
                state.hostCallHistory = action.payload.data;
                state.totalCallHistory = action?.payload.total;
                state.totalDuration = action?.payload?.totalDuration
            }
        );

        builder.addCase(getHostCallHistory.rejected, (state, action) => {
            state.isLoading = false;
        });

        builder.addCase(
            getHostGiftHistory.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(
            getHostGiftHistory.fulfilled,
            (state, action: PayloadAction<any>) => {
                state.isLoading = false;
                state.hostGiftHistory = action.payload.data;
                state.total = action.payload.total
            }
        );

        builder.addCase(getHostGiftHistory.rejected, (state, action) => {
            state.isLoading = false;
        });

        builder.addCase(
            getHostChatHistory.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(
            getHostChatHistory.fulfilled,
            (state, action: PayloadAction<any>) => {
                state.isLoading = false;
                state.hostChatHistory = action.payload.data;
                state.totalHostChatHistory = action.payload.total;
                state.totalChatCount = action.payload.totalChatCount ?? 0;
                state.totalHostChatEarning = action.payload.totalHostChatEarning ?? 0;
                state.totalUserChatSpent = action.payload.totalUserChatSpent ?? 0;
            }
        );

        builder.addCase(getHostChatHistory.rejected, (state, action) => {
            state.isLoading = false;
        });

        builder.addCase(
            getLiveBroadCastHistory.pending,
            (state, action: PayloadAction<any>) => {
                state.isLoading = true;
            }
        );

        builder.addCase(
            getLiveBroadCastHistory.fulfilled,
            (state, action: PayloadAction<any>) => {
                state.isLoading = false;
                state.hostLiveBroadCastHistory = action.payload.data;
                state.totalLiveHistory = action.payload.total;
                state.totalDuration = action.payload.totalDuration;
            }
        );

        builder.addCase(getLiveBroadCastHistory.rejected, (state, action) => {
            state.isLoading = false;
        });



    },
});

export default hostSlice.reducer;
