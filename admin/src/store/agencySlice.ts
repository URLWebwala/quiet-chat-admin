import { DangerRight, Success } from "@/api/toastServices";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { baseURL, key } from "@/utils/config";
import { SetDevKey, setToken } from "@/utils/setAuthAxios";
import { setToast } from "@/utils/toastServices";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import CryptoJS from "crypto-js";

interface UserState {
  agency: any[];
  totalagencyWiseHost: number;
  agencyWiseHost: any[];
  total: number;
  isLoading: boolean;
  isSkeleton: boolean;
}

const initialState: UserState = {
  agency: [],
  agencyWiseHost: [],
  totalagencyWiseHost: 0,
  total: 0,
  isLoading: false,
  isSkeleton: false,
};

interface AllImpressionPayload {
  name: string;
  start: number;
  limit: number;
  search: string;
  startDate: string;
  endDate: string;
}


export const getAllAgency: any = createAsyncThunk(
  "api/admin/agency/getAgencies",
  async (payload: AllImpressionPayload | undefined) => {
    return apiInstanceFetch.get(`api/admin/agency/getAgencies?start=${payload?.start}&limit=${payload?.limit}&search=${payload?.search}&startDate=${payload?.startDate}&endDate=${payload?.endDate}`);
  }
);

export const getAgencyWiseHost: any = createAsyncThunk(
  "api/admin/host/listAgencyHosts",
  async (payload: any) => {
    return apiInstanceFetch.get(`api/admin/host/listAgencyHosts?start=${payload?.start}&limit=${payload?.limit}&search=${payload?.search}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&agencyId=${payload?.agencyId}`);
  }
);

export const createAgency = createAsyncThunk(
  "api/admin/agency/createAgency",
  async (payload) => {

    return apiInstanceFetch.post(`api/admin/agency/createAgency`, payload);
  }
);

export const deleteAgency: any = createAsyncThunk(
  "api/admin/impression/deleteAgency",
  async (payload: AllImpressionPayload | undefined) => {
    return apiInstanceFetch.delete(`api/admin/impression/deleteAgency?impressionId=${payload}`);
  }
);

export const updateAgency = createAsyncThunk(
  "api/admin/agency/updateAgency",
  async (payload: any) => {
    return apiInstanceFetch.patch(
      `api/admin/agency/updateAgency?agencyId=${payload?.agencyId}`,
      payload?.formData
    );
  }
);


export const blockUnblockAgency: any = createAsyncThunk(
  "api/admin/agency/toggleAgencyBlockStatus?agencyId",
  async (payload: any) => {
    return apiInstanceFetch.patch(`api/admin/agency/toggleAgencyBlockStatus?agencyId=${payload}`);
  }
);

export const agencyLogin = createAsyncThunk(
  "api/admin/loginAgency",
  async (payload: any) => {
    
    return apiInstanceFetch.post(`api/agency/loginAgency?email=${payload?.email}&password=${payload?.password}`,
    );
  }
);



const agencySlice = createSlice({
  name: "agency",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAllAgency.pending, (state, action: PayloadAction<any>) => {
      state.isSkeleton = true;
    });
    builder.addCase(
      getAllAgency.fulfilled,
      (state, action: PayloadAction<any>) => {

        state.isSkeleton = false;
        state.agency = action.payload.data;
        state.total = action.payload.total
      }
    );
    builder.addCase(getAllAgency.rejected, (state, action: PayloadAction<any>) => {
      state.isSkeleton = false;
    });


    builder.addCase(agencyLogin.pending, (state: any, action: PayloadAction<any>) => {
      state.isLoading = true;
    });
    builder.addCase(
      agencyLogin.fulfilled,
      (state: any, action: any) => {
        state.isLoading = false;
        if (action.payload && action?.payload?.status !== false) {
          
          const token: any = sessionStorage.getItem("tokenAgency");

          setTimeout(() => {
            setToast("success", "Login Successfully");
          }, 1000)
          // const token = action.payload.data.data;
          const decodedToken: any = jwtDecode(token);
          sessionStorage.setItem("isAgency" , "true");
          state.isAuth = true;
          sessionStorage.setItem("isAuth", state.isAuth);
          state.admin = decodedToken;
          setToken(action.payload.data);
          SetDevKey(key);
          sessionStorage.setItem("agency_", JSON.stringify(decodedToken));
          const encrypted = CryptoJS.AES.encrypt(action?.meta?.arg?.password, key).toString();
          sessionStorage.setItem("data", encrypted)
          setTimeout(() => {

            window.location.href = "/DashboardAgency";
          }, 1000)
        } else {
          DangerRight(action.payload?.data?.message || action?.payload?.message);
        }
      }
    );
    builder.addCase(
      agencyLogin.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );

    builder.addCase(getAgencyWiseHost.pending, (state, action: PayloadAction<any>) => {
      state.isSkeleton = true;
    });
    builder.addCase(
      getAgencyWiseHost.fulfilled,
      (state, action: PayloadAction<any>) => {
        
        state.isSkeleton = false;
        state.agencyWiseHost = action.payload.hosts;
        state.totalagencyWiseHost = action.payload.total
      }
    );
    builder.addCase(getAgencyWiseHost.rejected, (state, action: PayloadAction<any>) => {
      state.isSkeleton = false;
    });

    builder.addCase(
      createAgency.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      createAgency.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.status) {
          state.agency.unshift(action?.payload?.data);

          Success("Agency Add Successfully");
        } else {
          DangerRight(action?.payload?.message)
        }
      }
    );
    builder.addCase(createAgency.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(
      deleteAgency.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(deleteAgency.fulfilled, (state, action: any) => {
      if (action?.payload?.status) {

        state.agency = state.agency.filter(
          (agency) => agency?._id !== action?.meta?.arg
        );
        Success("Impression Delete Successfully");
      } else {
        DangerRight(action?.payload?.message)
      }
      state.isLoading = false;
    });

    builder.addCase(deleteAgency.rejected, (state, action) => {
      state.isLoading = false;
    });


    builder.addCase(
      updateAgency.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      updateAgency.fulfilled,
      (state, action: PayloadAction<any>) => {
        if (action.payload.status) {
          const agencyIndex = state.agency.findIndex(
            (agency) => agency?._id === action?.payload?.data?._id
          );

          if (agencyIndex !== -1) {


            state.agency[agencyIndex] = {
              ...state.agency[agencyIndex],
              ...action.payload.data,
            };
            Success("Agency Update Successfully");
          } else {
            DangerRight(action?.payload?.message)
          }
        }
        state.isLoading = false;
      }
    );

    builder.addCase(updateAgency.rejected, (state, action) => {
      state.isLoading = false;
    });


    builder.addCase(
      blockUnblockAgency.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      blockUnblockAgency.fulfilled,
      (state, action: PayloadAction<any>) => {

        if (action?.payload?.status) {

          const updateVipPlan = action.payload.data;
          const bannerIndex = state.agency.findIndex(
            (agency) => agency?._id === updateVipPlan?._id
          );
          if (bannerIndex !== -1) {
            state.agency[bannerIndex].isBlock = updateVipPlan.isBlock;
          }
          updateVipPlan?.isBlock ?
            Success("Agency Block Successfully") :
            Success("Agency UnBlock Successfully")
        } else {
          DangerRight(action?.payload?.message)
        }
        state.isLoading = false;
      }
    );

    builder.addCase(blockUnblockAgency.rejected, (state, action) => {
      state.isLoading = false;
    });


  },
});

export default agencySlice.reducer;
