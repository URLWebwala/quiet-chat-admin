import { DangerRight, Success } from "@/api/toastServices";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface CreditPlanState {
  creditPlan: any[];
  total: number;
  isLoading: boolean;
  isSkeleton: boolean;
}

const initialState: CreditPlanState = {
  creditPlan: [],
  total: 0,
  isLoading: false,
  isSkeleton: false,
};

interface AllCreditPlanPayload {
  start: number;
  limit: number;
}

export const getCreditPlan: any = createAsyncThunk(
  "api/admin/creditPlan/fetchCreditPlans",
  async (payload: AllCreditPlanPayload | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/creditPlan/fetchCreditPlans?start=${payload?.start || 1}&limit=${payload?.limit || 10}`
    );
  }
);

export const createCreditPlan: any = createAsyncThunk(
  "api/admin/creditPlan/createCreditPlan",
  async (payload: any) => {
    return apiInstanceFetch.post(`api/admin/creditPlan/createCreditPlan`, payload);
  }
);

export const updateCreditPlan: any = createAsyncThunk(
  "api/admin/creditPlan/modifyCreditPlan",
  async (payload: any) => {
    return apiInstanceFetch.patch(`api/admin/creditPlan/modifyCreditPlan`, payload);
  }
);

export const deleteCreditPlan: any = createAsyncThunk(
  "api/admin/creditPlan/removeCreditPlan",
  async (payload: any) => {
    return apiInstanceFetch.delete(`api/admin/creditPlan/removeCreditPlan?creditPlanId=${payload}`);
  }
);

export const activeCreditPlan: any = createAsyncThunk(
  "api/admin/creditPlan/toggleCreditPlanStatus",
  async (payload: any) => {
    return apiInstanceFetch.patch(
      `api/admin/creditPlan/toggleCreditPlanStatus?creditPlanId=${payload?.id}&field=${payload?.type}`
    );
  }
);

const creditPlanSlice = createSlice({
  name: "creditPlan",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getCreditPlan.pending, (state) => {
      state.isSkeleton = true;
    });
    builder.addCase(getCreditPlan.fulfilled, (state, action: PayloadAction<any>) => {
      state.isSkeleton = false;
      state.creditPlan = action.payload?.data || [];
      state.total = action.payload?.total || 0;
    });
    builder.addCase(getCreditPlan.rejected, (state) => {
      state.isSkeleton = false;
    });

    builder.addCase(createCreditPlan.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(createCreditPlan.fulfilled, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      if (action.payload?.status) {
        Success("Credit plan created successfully!");
        if (action.payload?.data) {
          state.creditPlan.unshift(action.payload.data);
          state.total += 1;
        }
      } else {
        DangerRight(action.payload?.message || "Failed to create credit plan");
      }
    });
    builder.addCase(createCreditPlan.rejected, (state) => {
      state.isLoading = false;
      DangerRight("Failed to create credit plan");
    });

    builder.addCase(updateCreditPlan.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(updateCreditPlan.fulfilled, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      if (action.payload?.status) {
        Success("Credit plan updated successfully!");
        const updated = action.payload?.data;
        if (updated) {
          state.creditPlan = state.creditPlan.map((p) => (p._id === updated._id ? updated : p));
        }
      } else {
        DangerRight(action.payload?.message || "Failed to update credit plan");
      }
    });
    builder.addCase(updateCreditPlan.rejected, (state) => {
      state.isLoading = false;
      DangerRight("Failed to update credit plan");
    });

    builder.addCase(deleteCreditPlan.fulfilled, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      Success("Credit plan deleted successfully!");
    });

    builder.addCase(activeCreditPlan.fulfilled, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      if (action.payload?.status) {
        Success("Credit plan status updated successfully!");
        const updated = action.payload?.data;
        if (updated) {
          state.creditPlan = state.creditPlan.map((p) => (p._id === updated._id ? updated : p));
        }
      } else {
        DangerRight(action.payload?.message || "Failed to update status");
      }
    });
  },
});

export default creditPlanSlice.reducer;
