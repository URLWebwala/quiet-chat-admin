import { DangerRight, Success } from "@/api/toastServices";
import { apiInstance, apiInstanceFetch } from "@/utils/ApiInstance";
import { setToast } from "@/utils/toastServices";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface SuggestionState {
  withDrawal: any[];
  withdrawRequest : any[];
  totalWithdrawal : number;
  acceptedWithdrawal : any[];
  totalAcceptedWithdrawal : number;
  declinedWIthdrawal : any[];
  expertWithdrawRequest : any[];
  totalDeclinedWithdrawal : 0;
  isLoading: boolean;
  isSkeleton : boolean;
  success: any;
}

const initialState: SuggestionState = {
  withDrawal: [],
  withdrawRequest : [],
  totalWithdrawal : 0,
  expertWithdrawRequest : [],
  acceptedWithdrawal : [],
  totalAcceptedWithdrawal : 0,
  declinedWIthdrawal : [],
  totalDeclinedWithdrawal : 0,
  isLoading: false,
  isSkeleton : false,
  success: false
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
  "api/agency/withdrawalRequest/fetchPayoutRequests",
  async (payload: AllUsersPayload | undefined) => {
    console.log("payload*****", payload);
    
    
    return await apiInstanceFetch.get(
      `api/agency/withdrawalRequest/fetchPayoutRequests?start=${payload?.start}&limit=${payload?.limit}&startDate=${payload?.startDate}&endDate=${payload?.endDate}&status=${payload?.status}&person=${payload?.person}`
    );
  }
);

export const createWithdrawRequest = createAsyncThunk(
  "api/agency/withdrawalRequest/initiateWithdrawal",
  async (payload: any) => {
    return apiInstanceFetch.post("api/agency/withdrawalRequest/initiateWithdrawal", payload);
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
  "api/agency/withdrawalRequest/updateWithdrawalStatus",
  async (payload: any) => {
    if(payload?.reason){
      return apiInstanceFetch.patch(
        `api/agency/withdrawalRequest/updateWithdrawalStatus?requestId=${payload?.requestId}&hostId=${payload?.hostId}&type=${payload?.type}&reason=${payload?.reason}`
    );
    }else {
      return apiInstanceFetch.patch(
        `api/agency/withdrawalRequest/updateWithdrawalStatus?requestId=${payload?.requestId}&hostId=${payload?.hostId}&type=${payload?.type}`
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
  reducers: {},
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
        if(action?.meta?.arg?.status === 1 && action?.meta?.arg?.person === 2){
            
          state.withDrawal = action.payload.data;
          state.totalWithdrawal = action?.payload?.total
        }else if (action?.meta?.arg?.status === 1 && action?.meta?.arg?.person === 1){
          
          state.withdrawRequest = action.payload.data;
          state.totalWithdrawal = action?.payload?.total
        }
        
        else if (action?.meta?.arg?.status === 2 && action?.meta?.arg?.person === 2){
          
          state.acceptedWithdrawal = action?.payload?.data
          state.totalAcceptedWithdrawal = action?.payload?.total;
        }
        else if (action?.meta?.arg?.status === 2 && action?.meta?.arg?.person === 1){
          
          state.acceptedWithdrawal = action?.payload?.data
          state.totalAcceptedWithdrawal = action?.payload?.total;
        }

        else if (action?.meta?.arg?.status === 3 && action?.meta?.arg?.person === 1){
          console.log("action?.payload?.data*****",action?.payload?.data);
          
          
          state.declinedWIthdrawal = action?.payload?.data
          state.totalDeclinedWithdrawal = action?.payload?.total;
        }
        
        else if (action?.meta?.arg?.status === 3 && action?.meta?.arg?.person === 2){
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


      builder.addCase(createWithdrawRequest.pending, (state, action) => {
          state.isLoading = true;
        });
    
        builder.addCase(createWithdrawRequest.fulfilled, (state, action: any) => {
          state.isLoading = false;
          if (action.payload.status) {
            state.withdrawRequest.unshift(action?.payload?.withdrawalRequest);
            state.success = !state.success;
            Success("Withdraw Request Add Successfully");
          } else {
            DangerRight(action?.payload?.data?.message || action?.payload?.message);
          }
        });
        builder.addCase(createWithdrawRequest.rejected, (state) => {
          state.isLoading = false;
        });

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

export default withdrawalSlice.reducer;
