import { DangerRight, Success } from "@/api/toastServices";
import {  apiInstanceFetch } from "@/utils/ApiInstance";
import { baseURL } from "@/utils/config";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

interface UserState {
  impression: any[];
  total : number;
  isLoading: boolean;
  isSkeleton: boolean;
}

const initialState: UserState = {
  impression: [],
  total : 0,
  isLoading: false,
  isSkeleton: false,
};

interface AllImpressionPayload {
  name : string;
  start : number;
  limit : number
}


export const getImpression : any = createAsyncThunk(
  "api/admin/impression/getImpressions",
  async (payload: AllImpressionPayload | undefined) => {
    return apiInstanceFetch.get(`api/admin/impression/getImpressions?start=${payload?.start}&limit=${payload?.limit}`);
  }
);

export const createImpression = createAsyncThunk(
  "api/admin/impression/createImpression",
  async (payload) => {
    
    return apiInstanceFetch.post(`api/admin/impression/createImpression?name=${payload}`);
  }
);

export const deleteImpression : any = createAsyncThunk(
  "api/admin/impression/deleteImpression",
  async (payload: AllImpressionPayload | undefined) => {
    return apiInstanceFetch.delete(`api/admin/impression/deleteImpression?impressionId=${payload}`);
  }
);

export const updateImpression = createAsyncThunk(
  "api/admin/impression/updateImpression",
  async (payload: any) => {
    return apiInstanceFetch.patch(
      `api/admin/impression/updateImpression?name=${payload?.name}&impressionId=${payload?.impressionId}`
    );
  }
);



const impressionSlice = createSlice({
  name: "impression",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getImpression.pending, (state, action: PayloadAction<any>) => {
      state.isSkeleton = true;
    });
    builder.addCase(
      getImpression.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        
        state.impression = action.payload.data;
        state.total = action.payload.total
      }
    );
    builder.addCase(getImpression.rejected, (state, action: PayloadAction<any>) => {
      state.isSkeleton = false;
    });

    builder.addCase(
      createImpression.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      createImpression.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.status) {
          state.impression.unshift(action?.payload?.data);

          Success("Impression Add Successfully");
        } else {
          DangerRight(action?.payload?.message)
        }
      }
    );
    builder.addCase(createImpression.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(
      deleteImpression.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(deleteImpression.fulfilled, (state, action: any) => {
      if (action?.payload?.status) {
        
        state.impression = state.impression.filter(
          (impression) => impression?._id !== action?.meta?.arg
        );
        Success("Impression Delete Successfully");
      }else {
        DangerRight(action?.payload?.message)
      }
      state.isLoading = false;
    });

    builder.addCase(deleteImpression.rejected, (state, action) => {
      state.isLoading = false;
    });

    
    builder.addCase(
      updateImpression.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      updateImpression.fulfilled,
      (state, action: PayloadAction<any>) => {
          if (action.payload.status) {
            const impressionIndex = state.impression.findIndex(
              (impression) => impression?._id === action?.payload?.data?._id
            );
            
            if (impressionIndex !== -1) {

              state.impression[impressionIndex] = {
                ...state.impression[impressionIndex],
                ...action.payload.data,
              };
              Success("Impression Update Successfully");
            }else {
              DangerRight(action?.payload?.message)
            }
          }
        state.isLoading = false;
      }
    );

    builder.addCase(updateImpression.rejected, (state, action) => {
      state.isLoading = false;
    });
  },
});

export default impressionSlice.reducer;
