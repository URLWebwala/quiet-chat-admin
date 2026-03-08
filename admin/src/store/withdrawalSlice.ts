import { DangerRight } from "@/api/toastServices";
import { apiInstance, apiInstanceFetch } from "@/utils/ApiInstance";
import { setToast } from "@/utils/toastServices";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface SuggestionState {
  withDrawal: any[];
  totalWithdrawal : number;
  acceptedWithdrawal : any[];
  totalAcceptedWithdrawal : number;
  declinedWIthdrawal : any[];
  expertWithdrawRequest : any[];
  totalDeclinedWithdrawal : 0;
  isLoading: boolean;
  isSkeleton : boolean;
}

const initialState: SuggestionState = {
  withDrawal: [],
  totalWithdrawal : 0,
  expertWithdrawRequest : [],
  acceptedWithdrawal : [],
  totalAcceptedWithdrawal : 0,
  declinedWIthdrawal : [],
  totalDeclinedWithdrawal : 0,
  isLoading: false,
  isSkeleton: false,

};
interface AllUsersPayload {
  start?: number;
  limit?: number;
  id?: string;
  data?: any;
  payload?: any;
  type?: number;
  reason?: string;
  status?: any;
  startDate?: any;
  endDate?: any;
  page: number;
  rowsPerPage: number;
  requestId : string;
  agencyId : string;
  person : string;
}

export const getWithdrawalRequest: any = createAsyncThunk(
  "api/admin/withdrawalRequest/retrievePayoutRequests",
  async (payload: AllUsersPayload | undefined) => {
    
    return await apiInstanceFetch.get(
      `api/admin/withdrawalRequest/retrievePayoutRequests?start=${payload?.start}&limit=${payload?.limit}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&status=${payload?.status}&person=${payload?.person}`
    );
  }
);

export const getWithdrawalProviderRequest: any = createAsyncThunk(
  "api/admin/providerWithdrawRequest/withdrawRequestOfProByAdmin/provider",
  async (payload: AllUsersPayload | undefined) => {
    return await apiInstanceFetch.get(
      `api/admin/providerWithdrawRequest/withdrawRequestOfProByAdmin?start=${payload?.start}&limit=${payload?.limit}&status=${payload?.status}&startDate=${payload?.startDate}&endDate=${payload?.endDate}`
    );
  }
);

export const acceptOrDeclineWithdrawRequestForAgency = createAsyncThunk(
  "api/admin/withdrawalRequest/updateAgencyWithdrawalStatus",
  async (payload: any) => {
    if(payload?.reason){
      return apiInstanceFetch.patch(
        `api/admin/withdrawalRequest/updateAgencyWithdrawalStatus?requestId=${payload?.requestId}&agencyId=${payload?.agencyId}&type=${payload?.type}&reason=${payload?.reason}`
    );
    }else {
      return apiInstanceFetch.patch(
        `api/admin/withdrawalRequest/updateAgencyWithdrawalStatus?requestId=${payload?.requestId}&agencyId=${payload?.agencyId}&type=${payload?.type}`
    );
    }
      
  }
);


export const withdrawRequestPendingPayUpdate: any = createAsyncThunk(
  "api/admin/providerWithdrawpendingRequest/withdrawRequestApproved",
  async (payload: AllUsersPayload | undefined) => {
    return await apiInstance.patch(
      `api/admin/agencyWithdrawRequest/approvePayoutRequest?requestId=${payload?.requestId}&agencyId=${payload?.agencyId}`
    );
  }
);

export const withdrawRequestPayUpdate: any = createAsyncThunk(
  "api/admin/providerWithdrawRequest/withdrawRequestApproved",
  async (payload: AllUsersPayload | undefined) => {
    return await apiInstance.patch(
      `api/admin/providerWithdrawRequest/withdrawRequestApproved?requestId=${payload}`
    );
  }
);

export const withdrawRequestDeclineUpdate: any = createAsyncThunk(
  "api/admin/adminWithdrawRequest/rejectPayoutRequest",
  async (payload: AllUsersPayload | undefined) => {
    return await apiInstance.patch(
      `api/admin/adminWithdrawRequest/rejectPayoutRequest?requestId=${payload?.id}&reason=${payload?.reason}`
    );
  }
);

export const withdrawRequestPendingDeclineUpdate: any = createAsyncThunk(
  "api/admin/providerWithdrawRequest/withdrawRequestpendingDecline",
  async (payload: AllUsersPayload | undefined) => {
    return await apiInstance.patch(
      `api/admin/agencyWithdrawRequest/rejectPayoutRequest?requestId=${payload?.id}&reason=${payload?.reason}&agencyId=${payload?.agencyId}`
    );
  }
);

const withdrawalSlice = createSlice({
  name: "withdrawal",
  initialState,
  reducers: {
     setWithdrawal(state, action) {
      state.withDrawal = [];
      state.acceptedWithdrawal = [];
      state.declinedWIthdrawal = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      getWithdrawalRequest.pending,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );

    builder.addCase(
      getWithdrawalRequest.fulfilled,
      (state, action: any) => {
        state.isSkeleton = false;
        if(action?.meta?.arg?.status === 1){
          state.withDrawal = action.payload.data;
          state.totalWithdrawal = action?.payload?.total
        }else if (action?.meta?.arg?.status === 2){
          state.acceptedWithdrawal = action?.payload?.data
          state.totalAcceptedWithdrawal = action?.payload?.total;
        }else if (action?.meta?.arg?.status === 3){
          state.declinedWIthdrawal = action?.payload?.data
          state.totalDeclinedWithdrawal = action?.payload?.total
        }
      }
    );

    builder.addCase(
      getWithdrawalProviderRequest.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      getWithdrawalProviderRequest.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.expertWithdrawRequest = action.payload.request;
      }
    );

     builder.addCase(
          acceptOrDeclineWithdrawRequestForAgency.fulfilled,
          (state, action: any) => {
            
            state.isLoading = false;
            if (action?.payload?.status === true) {
              
              state.withDrawal = state?.withDrawal?.filter(
                (item) => item?._id !== action?.meta?.arg?.requestId
              );
              action?.meta?.arg?.type === "approve" ?
                setToast("success", "Withdraw Request Accepted Succesfully") :
                setToast("success", "Withdraw Request Declined Succesfully")
                ;
            } else {
              setToast("error", action?.payload?.message || action?.payload?.data?.message)
            }
    
          }
        );

    builder.addCase(
      withdrawRequestPayUpdate.fulfilled,
      (state, action: any) => {
        
        state.isLoading = false;
        if(action?.payload?.status === true){
          const findIndex = state?.withDrawal?.findIndex(
            (item) => item?._id === action?.meta?.arg
          );
          if (findIndex !== -1) {
            state.withDrawal[findIndex] = {
              ...state.withDrawal[findIndex],
              status: action?.payload?.data?.status,
            };
          }
          setToast("success", "Withdraw Request Accepted Succesfully");
        }else {
          setToast("error" , action.payload.data.message)
        }
      
      }
    );

    builder.addCase(
      withdrawRequestPendingPayUpdate.fulfilled,
      (state, action: any) => {
        
        state.isLoading = false;
        if(action?.payload?.status === true) {
          
          state.withDrawal = state?.withDrawal?.filter(
            (item) => item?._id !== action?.meta?.arg?.requestId
          );
          setToast("success", "Withdraw Request Accepted Succesfully");
        }else {
          
          setToast("error" , "Something went wrong!")
        }
        
      }
    );

    builder.addCase(
      withdrawRequestDeclineUpdate.fulfilled,
      (state, action: any) => {
        state.isLoading = false;
        const findIndex = state?.withDrawal?.findIndex(
          (item) => item?._id === action?.meta?.arg?.id
        );
        if (findIndex !== -1) {
          state.withDrawal[findIndex] = {
            ...state.withDrawal[findIndex],
            status: action?.payload?.data?.status,
          };
        }
        setToast("success", "Withdraw Request Declined Succesfully");
      }
    );

    builder.addCase(
      withdrawRequestPendingDeclineUpdate.fulfilled,
      (state, action: any) => {
        
        state.isLoading = false;
        state.withDrawal = state?.withDrawal?.filter(
          (item) => item?._id !== action?.meta?.arg?.id
        );
        setToast("success", "Withdraw Request Declined Succesfully");
      }
    );
  },
});
export const { setWithdrawal } = withdrawalSlice.actions;
export default withdrawalSlice.reducer;
