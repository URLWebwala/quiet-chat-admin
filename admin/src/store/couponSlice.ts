import { DangerRight, Success } from "@/api/toastServices";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface CouponState {
  coupons: any[];
  total: number;
  isLoading: boolean;
  isSkeleton: boolean;
  redemptions: any[];
  totalRedemptions: number;
  allClaims: any[];
  totalClaims: number;
}

const initialState: CouponState = {
  coupons: [],
  total: 0,
  isLoading: false,
  isSkeleton: false,
  redemptions: [],
  totalRedemptions: 0,
  allClaims: [],
  totalClaims: 0,
};

export const getCoupons: any = createAsyncThunk(
  "api/admin/coupon/fetchCoupons",
  async (payload: { start?: number; limit?: number; search?: string } | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/coupon/fetchCoupons?start=${payload?.start || 1}&limit=${payload?.limit || 10}&search=${payload?.search || ""}`
    );
  }
);

export const createCoupon: any = createAsyncThunk(
  "api/admin/coupon/createCoupon",
  async (payload: any) => {
    return apiInstanceFetch.post(`api/admin/coupon/createCoupon`, payload);
  }
);

export const updateCoupon: any = createAsyncThunk(
  "api/admin/coupon/modifyCoupon",
  async (payload: any) => {
    return apiInstanceFetch.patch(`api/admin/coupon/modifyCoupon`, payload);
  }
);

export const toggleCouponStatus: any = createAsyncThunk(
  "api/admin/coupon/toggleCouponStatus",
  async (payload: { couponId: string }) => {
    return apiInstanceFetch.patch(`api/admin/coupon/toggleCouponStatus?couponId=${payload.couponId}`);
  }
);

export const deleteCoupon: any = createAsyncThunk(
  "api/admin/coupon/removeCoupon",
  async (couponId: string) => {
    return apiInstanceFetch.delete(`api/admin/coupon/removeCoupon?couponId=${couponId}`);
  }
);

export const getCouponRedemptions: any = createAsyncThunk(
  "api/admin/coupon/retrieveCouponRedemptions",
  async (payload: { couponId: string; start?: number; limit?: number }) => {
    return apiInstanceFetch.get(
      `api/admin/coupon/retrieveCouponRedemptions?couponId=${payload.couponId}&start=${payload?.start || 1}&limit=${payload?.limit || 10}`
    );
  }
);

export const getAllCouponClaims: any = createAsyncThunk(
  "api/admin/coupon/fetchAllCouponClaims",
  async (payload: { start?: number; limit?: number; search?: string } | undefined) => {
    return apiInstanceFetch.get(
      `api/admin/coupon/fetchAllCouponClaims?start=${payload?.start || 1}&limit=${payload?.limit || 10}&search=${payload?.search || ""}`
    );
  }
);

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Get Coupons
    builder.addCase(getCoupons.pending, (state) => {
      state.isSkeleton = true;
    });
    builder.addCase(getCoupons.fulfilled, (state, action: PayloadAction<any>) => {
      state.isSkeleton = false;
      if (action.payload?.status) {
        state.coupons = action.payload.data || [];
        state.total = action.payload.total || 0;
      }
    });
    builder.addCase(getCoupons.rejected, (state) => {
      state.isSkeleton = false;
    });

    // Create Coupon
    builder.addCase(createCoupon.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(createCoupon.fulfilled, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      if (action.payload?.status) {
        state.coupons.unshift(action.payload.data);
        state.total += 1;
        Success(action.payload.message || "Coupon created successfully!");
      } else {
        DangerRight(action.payload?.message || "Failed to create coupon");
      }
    });
    builder.addCase(createCoupon.rejected, (state) => {
      state.isLoading = false;
      DangerRight("Network error creating coupon");
    });

    // Update Coupon
    builder.addCase(updateCoupon.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(updateCoupon.fulfilled, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      if (action.payload?.status) {
        const index = state.coupons.findIndex((c) => c._id === action.payload.data?._id);
        if (index !== -1) {
          state.coupons[index] = action.payload.data;
        }
        Success(action.payload.message || "Coupon updated successfully!");
      } else {
        DangerRight(action.payload?.message || "Failed to update coupon");
      }
    });
    builder.addCase(updateCoupon.rejected, (state) => {
      state.isLoading = false;
      DangerRight("Network error updating coupon");
    });

    // Toggle Status
    builder.addCase(toggleCouponStatus.fulfilled, (state, action: PayloadAction<any>) => {
      if (action.payload?.status) {
        const index = state.coupons.findIndex((c) => c._id === action.payload.data?._id);
        if (index !== -1) {
          state.coupons[index].isActive = action.payload.data.isActive;
        }
        Success(action.payload.message || "Coupon status updated!");
      } else {
        DangerRight(action.payload?.message || "Failed to update status");
      }
    });

    // Delete Coupon
    builder.addCase(deleteCoupon.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(deleteCoupon.fulfilled, (state, action: any) => {
      state.isLoading = false;
      if (action.payload?.status) {
        const deletedId = action.meta.arg;
        state.coupons = state.coupons.filter((c) => c._id !== deletedId);
        state.total = Math.max(0, state.total - 1);
        Success(action.payload.message || "Coupon deleted successfully!");
      } else {
        DangerRight(action.payload?.message || "Failed to delete coupon");
      }
    });
    builder.addCase(deleteCoupon.rejected, (state) => {
      state.isLoading = false;
      DangerRight("Network error deleting coupon");
    });

    // Redemptions for single coupon
    builder.addCase(getCouponRedemptions.fulfilled, (state, action: PayloadAction<any>) => {
      if (action.payload?.status) {
        state.redemptions = action.payload.data || [];
        state.totalRedemptions = action.payload.total || 0;
      }
    });

    // All claims history
    builder.addCase(getAllCouponClaims.pending, (state) => {
      state.isSkeleton = true;
    });
    builder.addCase(getAllCouponClaims.fulfilled, (state, action: PayloadAction<any>) => {
      state.isSkeleton = false;
      if (action.payload?.status) {
        state.allClaims = action.payload.data || [];
        state.totalClaims = action.payload.total || 0;
      }
    });
    builder.addCase(getAllCouponClaims.rejected, (state) => {
      state.isSkeleton = false;
    });
  },
});

export default couponSlice.reducer;
