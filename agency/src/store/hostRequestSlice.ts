import { DangerRight, Success } from "@/api/toastServices";
import {  apiInstance, apiInstanceFetch } from "@/utils/ApiInstance";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

interface UserState {
  hostRequest: any[];
  countryData : any[];
  agencyList : any[];
  totalHostRequest : any;
  isLoading: boolean;
  isSkeleton: boolean;
}

const initialState: UserState = {
  hostRequest: [],
  countryData : [],
  agencyList : [],
  totalHostRequest : 0,
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
  meta?: any;
  id?: any;
  data: any;
  bannerId: any;
  requestId : any;
  payload: any;
  status : any;
  userId : any;
  reason : any
}


export const getHostRequest : any = createAsyncThunk(
  "api/agency/host/fetchHostRequestsByAgency",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(`api/agency/host/fetchHostRequestsByAgency?status=${payload?.status}&start=${payload?.start}&limit=${payload?.limit}&search=${payload?.search}`);
  }
);

export const getAgencyList : any = createAsyncThunk(
  "api/admin/agency/getActiveAgenciesList",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(`api/admin/agency/getActiveAgenciesList`);
  }
);



export const hostRequestUpdate: any = createAsyncThunk(
    "api/agency/host/manageHostRequest?status=2",
    async (payload: AllUsersPayload | undefined) => {
      return await apiInstanceFetch.patch(
        `api/agency/host/manageHostRequest?status=2&requestId=${payload?.requestId}&userId=${payload?.userId}`
      );
    }
  );

  export const hostRequestDeclined: any = createAsyncThunk(
    "api/agency/host/manageHostRequest?status=3",
    async (payload: AllUsersPayload | undefined) => {
      
      return await apiInstanceFetch.patch(
        `api/agency/host/manageHostRequest?status=3&requestId=${payload?.requestId}&userId=${payload?.userId}&reason=${payload?.reason}`
      );
    }
  );

export const createBanner = createAsyncThunk(
  "admin/hostRequest/create",
  async (payload: AllUsersPayload | undefined) => {
    
    return axios.post("admin/hostRequest/create", payload);
  }
);

export const deleteBanner = createAsyncThunk(
  "admin/hostRequest/delete",
  async (payload: AllUsersPayload | undefined) => {
    return axios.delete(`admin/hostRequest/delete?bannerId=${payload}`);
  }
);

export const updatedBanner = createAsyncThunk(
  "admin/service/update",
  async (payload: any) => {
    return axios.patch(
      `admin/hostRequest/update?bannerId=${payload?.id}`,
      payload?.formData
    );
  }
);

export const activeBanner = createAsyncThunk(
  "admin/hostRequest/isActive",
  async (payload: AllUsersPayload | undefined) => {
    return axios.put(`admin/hostRequest/isActive?bannerId=${payload}`);
  }
);

export const assignToExpertAccepted: any = createAsyncThunk(
  "api/admin/host/assignHostToAgency?agencyId",
  async (payload: any) => {

    return apiInstanceFetch.patch(
      `api/admin/host/assignHostToAgency?agencyId=${payload?.agencyId}&requestId=${payload?.requestId}`
    );
  }
);



const hostRequestSlice = createSlice({
  name: "hostRequest",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getHostRequest.pending, (state, action: PayloadAction<any>) => {
      state.isSkeleton = true;
    });
    builder.addCase(
      getHostRequest.fulfilled,
      (state, action: PayloadAction<any>) => {
          
        state.isSkeleton = false;
        state.hostRequest = action.payload.hosts;
        state.totalHostRequest = action.payload.totalHosts
      }
    );
    builder.addCase(getHostRequest.rejected, (state, action: PayloadAction<any>) => {
      state.isSkeleton = false;
    });

    builder.addCase(getAgencyList.pending, (state, action: PayloadAction<any>) => {
      state.isSkeleton = true;
    });
    builder.addCase(
      getAgencyList.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        state.agencyList = action.payload.data;
      }
    );
    builder.addCase(getAgencyList.rejected, (state, action: PayloadAction<any>) => {
      state.isSkeleton = false;
    });

    builder.addCase(assignToExpertAccepted.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(assignToExpertAccepted.fulfilled, (state, action: any) => {
      state.isLoading = false;
      if (action.payload.status) {
        state.hostRequest = state.hostRequest.map((request) =>
          request?._id === action?.payload?.request?._id ? action?.payload?.request : request
        );

        Success("Agency Assigned To Host Successfully");
      } else {
        DangerRight(action?.payload?.data?.message);
      }
    });


    builder.addCase(assignToExpertAccepted.rejected, (state, action) => {
      state.isLoading = false;
    });


    builder.addCase(
      createBanner.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      createBanner.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.status) {
          
          state.hostRequest.unshift(action?.payload?.data?.hostRequest);

          Success("Banner Add Successfully");
        }
      }
    );
    builder.addCase(createBanner.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(
      hostRequestUpdate.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(hostRequestUpdate.fulfilled, (state, action: any) => {
      if (action?.payload?.status) {
          
        state.hostRequest = state.hostRequest.filter(
          (hostRequest) => hostRequest?._id !== action?.meta?.arg?.requestId
        );
        Success("Host Request Accepted Successfully");
      }else {
        DangerRight(action.payload.message)
      }
      state.isLoading = false;
    });

    builder.addCase(hostRequestUpdate.rejected, (state, action) => {
      state.isLoading = false;
    });


    builder.addCase(
        hostRequestDeclined.pending,
        (state, action: PayloadAction<any>) => {
          state.isLoading = true;
        }
      );
  
      builder.addCase(hostRequestDeclined.fulfilled, (state, action: any) => {
        if (action?.payload?.status) {
          state.hostRequest = state.hostRequest.filter(
            (hostRequest) => hostRequest?._id !== action?.meta?.arg?.requestId
          );
          Success("Host Request Declined Successfully");
        }
        else {
            DangerRight(action.payload.message)
          }
        state.isLoading = false;
      });
  
      builder.addCase(hostRequestDeclined.rejected, (state, action) => {
        state.isLoading = false;
      });

    
    builder.addCase(
      updatedBanner.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      updatedBanner.fulfilled,
      (state, action: PayloadAction<any>) => {
          if (action.payload.status) {

            
            const serviceInx = state.hostRequest.findIndex(
              (service) => service?._id === action?.payload?.data?.data?._id
            );
            
            if (serviceInx !== -1) {

              state.hostRequest[serviceInx] = {
                ...state.hostRequest[serviceInx],
                ...action.payload.data.data,
              };
            }
          }
          Success("Banner Update Successfully");
        state.isLoading = false;
      }
    );

    builder.addCase(updatedBanner.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(
      activeBanner.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      activeBanner.fulfilled,
      (state, action: PayloadAction<any>) => {
        
        if (action?.payload?.data?.status) {
          
          const updatedBanner = action.payload.data.data;
          const bannerIndex = state.hostRequest.findIndex(
            (hostRequest) => hostRequest?._id === updatedBanner?._id
          );
          if (bannerIndex !== -1) {
            state.hostRequest[bannerIndex].isActive = updatedBanner.isActive;
          }
          Success("Banner Status Update Successfully");
        }
        state.isLoading = false;
      }
    );

    builder.addCase(activeBanner.rejected, (state, action) => {
      state.isLoading = false;
    });
  },
});

export default hostRequestSlice.reducer;
