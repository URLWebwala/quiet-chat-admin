import { DangerRight, Success } from "@/api/toastServices";
import { apiInstance, apiInstanceFetch } from "@/utils/ApiInstance";
import { baseURL, key } from "@/utils/config";
import { SetDevKey, setToken } from "@/utils/setAuthAxios";
import { setToast } from "@/utils/toastServices";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";

interface UserState {
  agency: any[];
  totalagencyWiseHost: number;
  agencyWiseHost: any[];
  totalAgencyEarning : number;
  total: number;
  isLoading: boolean;
  isSkeleton: boolean;
  agencyEarningHistory : any[];
  totalAgencyEarningHistory : number;
}

const initialState: UserState = {
  agency: [],
  agencyWiseHost: [],
  totalagencyWiseHost: 0,
  totalAgencyEarning : 0,
  agencyEarningHistory : [],
  totalAgencyEarningHistory : 0,
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

const token = typeof window !== "undefined" && sessionStorage.getItem("token");
const uid = typeof window !== "undefined" && sessionStorage.getItem(("uid"));

export const getAllAgency: any = createAsyncThunk(
  "api/admin/agency/getAgencies",
  async (payload: AllImpressionPayload | undefined) => {
    return apiInstanceFetch.get(`api/admin/agency/getAgencies?start=${payload?.start}&limit=${payload?.limit}&search=${payload?.search}&startDate=${payload?.startDate}&endDate=${payload?.endDate}`);
  }
);

export const getAgencyWiseHost: any = createAsyncThunk(
  "api/agency/host/retrieveAgencyHosts",
  async (payload: AllImpressionPayload | undefined) => {
    return apiInstanceFetch.get(`api/agency/host/retrieveAgencyHosts?start=${payload?.start}&limit=${payload?.limit}&search=${payload?.search}`);
  }
);

export const createAgency = createAsyncThunk(
  "api/admin/agency/createAgency",
  async (payload) => {

    return apiInstanceFetch.post(`api/admin/agency/createAgency`, payload);
  }
);

export const deleteAgency: any = createAsyncThunk(
  "api/admin/agency/deleteAgency",
  async (payload: AllImpressionPayload | undefined) => {
    return apiInstanceFetch.delete(`api/admin/impression/deleteAgency?impressionId=${payload}`);
  }
);

export const updateAgency = createAsyncThunk(
  "api/admin/modifyAgency",
  async (payload: any) => {
    return apiInstanceFetch.patch(
      `api/admin/modifyAgency?agencyId=${payload?.agencyId}`,
      payload?.formData
    );
  }
);

export const blockonlinebusyHost: any = createAsyncThunk(
  "api/agency/host/modifyHostBlockStatus?hostId",
  async (payload: any) => {
      return apiInstanceFetch.patch(`api/agency/host/modifyHostBlockStatus?hostId=${payload?.hostId}`);
  }
);


export const blockUnblockAgency: any = createAsyncThunk(
  "api/agency/host/modifyHostBlockStatus?agencyId",
  async (payload: any) => {
    return apiInstanceFetch.patch(`api/agency/host/modifyHostBlockStatus?hostId=${payload}`);
  }
);

export const agencyLogin = createAsyncThunk(
  "api/admin/loginAgency",
  async (payload: any) => {
    return apiInstanceFetch.post(`api/agency/loginAgency?email=${encodeURIComponent(payload?.email)}&password=${encodeURIComponent(payload?.password)}`);
  }
);

export const getAgencyEarningHistory : any = createAsyncThunk(
  "api/admin/history",
  async (payload: any) => {
    return apiInstanceFetch.get(`api/agency/history/retrieveAgencyEarnings?startDate=${payload?.startDate}&endDate=${payload?.endDate}&start=${payload?.start}&limit=${payload?.limit}`);
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

      builder.addCase(getAgencyEarningHistory.pending, (state, action: PayloadAction<any>) => {
      state.isSkeleton = true;
    });
    builder.addCase(
      getAgencyEarningHistory.fulfilled,
      (state, action: PayloadAction<any>) => {
        
        state.isSkeleton = false;
        state.agencyEarningHistory = action.payload.data;
        state.totalAgencyEarningHistory = action.payload.total;
        state.totalAgencyEarning = action.payload.totalAgencyEarnings
      }
    );
    builder.addCase(getAgencyEarningHistory.rejected, (state, action: PayloadAction<any>) => {
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

          const token: any = sessionStorage.getItem("token");

          setTimeout(() => {
            window.location.href = "/dashboard";

            setToast("success", "Login Successfully");
          }, 1000)
          // const token = action.payload.data.data;
          const decodedToken: any = jwtDecode(token);
          state.isAuth = true;
          sessionStorage.setItem("isAuth", state.isAuth);
          state.admin = decodedToken;
          setToken(action.payload.data);
          SetDevKey(key);
          sessionStorage.setItem("agency_", JSON.stringify(decodedToken));
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
                blockonlinebusyHost.pending,
                (state, action: PayloadAction<any>) => {
                    state.isLoading = true;
                }
            );
    
            builder.addCase(
                blockonlinebusyHost.fulfilled,
                (state, action: any) => {
                  if (action?.payload?.status) {
                    
                    const updateData = action?.payload?.data;
              
                    const dataIndex = state?.agencyWiseHost?.findIndex(
                      (host) => host?._id === updateData?._id
                    );
              
                    if (dataIndex !== -1) {
                        
                      state.agencyWiseHost[dataIndex].isBlock = updateData?.isBlock;
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
                }
              );
              
    
            builder.addCase(blockonlinebusyHost.rejected, (state, action) => {
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

          const updateData = action.payload.data;
          const Index = state.agency.findIndex(
            (agency) => agency?._id === updateData?._id
          );
          if (Index !== -1) {
            state.agency[Index].isBlock = updateData.isBlock;
          }
          updateData?.isBlock ?
            Success("Host Block Successfully") :
            Success("Host UnBlock Successfully")
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
