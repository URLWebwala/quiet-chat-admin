import { DangerRight, Success } from "@/api/toastServices";
import {  apiInstance, apiInstanceFetch } from "@/utils/ApiInstance";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

interface UserState {
  giftCategory: any[];
  allGift: any[];
  alGiftCategory: any[];

  totalGiftCategory : number;
  isLoading: boolean;
  isSkeleton: boolean;
}

const initialState: UserState = {
  giftCategory: [],
  allGift: [],
  alGiftCategory: [],

  totalGiftCategory : 0,
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
  payload: any;
  title : string;
  giftId : string;
  giftCategoryId : string
}


export const allGiftApi = createAsyncThunk("api/admin/gift/retrieveGifts", async () => {
  return apiInstanceFetch.get(`api/admin/gift/retrieveGifts`);
});

export const deleteGift = createAsyncThunk(
  "api/admin/gift/discardGift",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.delete(
      `api/admin/gift/discardGift?giftId=${payload?.giftId}`
    );
  }
);

export const addGift = createAsyncThunk(
  "api/admin/gift/addGift",
  async (payload: any) => {
    return apiInstanceFetch.post(`api/admin/gift/addGift`, payload?.data);
  }
);

export const updateGift = createAsyncThunk(
  "api/admin/gift/modifyGift?giftId",
  async (payload: any) => {
    return apiInstanceFetch.patch(
      `api/admin/gift/modifyGift?giftId=${payload?.giftId}`,
      payload.data
    );
  }
);

export const allGiftCategory : any = createAsyncThunk(
  "admin/giftCategory/getGiftCategory",
  async (payload: any) => {
    return apiInstanceFetch.get(`api/admin/giftCategory/listGiftCategories`);
  }
);

export const getGiftCategory = createAsyncThunk(
  "api/admin/giftCategory/getAllGiftCategories",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(`api/admin/giftCategory/getAllGiftCategories?start=${payload?.start}&limit=${payload?.limit}`);
  }
);

export const createGiftCategory = createAsyncThunk(
  "api/admin/giftCategory/createGiftCategory",
  async (payload: any) => {
    return apiInstanceFetch.post(`api/admin/giftCategory/createGiftCategory?name=${payload}`);
  }
);

export const deleteGiftCategory = createAsyncThunk(
  "api/admin/giftCategory/deleteGiftCategory",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.delete(`api/admin/giftCategory/deleteGiftCategory?categoryId=${payload}`);
  }
);

export const updateGiftCategory = createAsyncThunk(
  "api/admin/giftCategory/updateGiftCategory",
  async (payload: any) => {
    return apiInstanceFetch.patch(
      `api/admin/giftCategory/updateGiftCategory?name=${payload?.name}&categoryId=${payload?.categoryId}`
    );
  }
);

export const activeBanner = createAsyncThunk(
  "admin/banner/isActive",
  async (payload: AllUsersPayload | undefined) => {
    return axios.put(`admin/banner/isActive?bannerId=${payload}`);
  }
);

const giftSlice = createSlice({
  name: "giftCategory",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(allGiftApi.pending, (state, action: PayloadAction<any>) => {
      state.isSkeleton = true;
    });

    builder.addCase(allGiftApi.fulfilled, (state, action) => {
      
      state.allGift = action.payload.data;
      state.isSkeleton = false;
    });

    builder.addCase(
      allGiftApi.rejected,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
      }
    );

    builder.addCase(
      allGiftCategory.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      allGiftCategory.fulfilled,
      (state, action: PayloadAction<any, string, { arg: any }>) => {
        state.alGiftCategory = action.payload.data;
        state.isLoading = false;
      }
    );

    builder.addCase(
      allGiftCategory.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(deleteGift.pending, (state, action: PayloadAction<any>) => {
      state.isLoading = true;
    });

    builder.addCase(
      deleteGift.fulfilled,
      (state, action: PayloadAction<any, string, { arg: any }>) => {
        state.allGift = state.allGift.map((category: any) => ({
          ...category,
          gifts: category.gifts.filter(
            (gift: any) => gift._id !== action.meta.arg.giftId
          ),
        }));
    
        Success("Gift Delete Successfully");
        state.isLoading = false;
      }
    );
    

    builder.addCase(
      deleteGift.rejected,
      (state, action: PayloadAction<any>) => {
        state.isLoading = false;
      }
    );

    builder.addCase(addGift.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      addGift.fulfilled,
      (state, action: PayloadAction<any, string, { arg: any }>) => {
          
        state.isLoading = false;
    
        if (action?.payload?.status === true) {
          const  giftCategoryId  = action?.payload?.data?.giftCategoryId; // Get category ID from request
          // ✅ Find the category where the gift should be added
          const categoryIndex = state.allGift.findIndex(
            (category) => category._id === giftCategoryId
          );
    
          if (categoryIndex !== -1) {
            state.allGift[categoryIndex].gifts.unshift(action?.payload?.data);
          } else {
            state.allGift.unshift({
              _id: giftCategoryId,
              gifts: [action?.payload?.data],
            });
          }
    
          Success("New Gift Added Successfully");
        } else {
          DangerRight(action?.payload?.data?.message || action?.payload?.message);
        }
      }
    );
    

    builder.addCase(addGift.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(updateGift.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(
      updateGift.fulfilled,
      (state, action: PayloadAction<any, string, { arg: any }>) => {
        
        state.isLoading = false;
        if (action.payload.status === true) {
          
          const { giftCategoryId, giftId } = action.meta.arg;
    
          const categoryIndex = state.allGift.findIndex(
            (category) => category._id === action?.payload?.data?.giftCategoryId
          );
    
          if (categoryIndex !== -1) {
            const category = state.allGift[categoryIndex];
    
            const giftIndex = category.gifts.findIndex(
              (gift : any) => gift._id === giftId
            );
    
            if (giftIndex !== -1) {
                
              state.allGift[categoryIndex].gifts[giftIndex] = {
                ...state.allGift[categoryIndex].gifts[giftIndex],
                ...action.payload?.data,
              };
            }
          }
    
          Success(`Gift Updated Successfully`);
        } else {
          DangerRight(action.payload.data.message);
        }
      }
    );
    builder.addCase(updateGift.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(getGiftCategory.pending, (state, action: PayloadAction<any>) => {
      state.isSkeleton = true;
    });
    builder.addCase(
      getGiftCategory.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        state.giftCategory = action.payload.data;
        state.totalGiftCategory = action.payload.total
      }
    );
    builder.addCase(getGiftCategory.rejected, (state, action: PayloadAction<any>) => {
      state.isSkeleton = false;
    });

    builder.addCase(
      createGiftCategory.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      createGiftCategory.fulfilled,
      (state, action: PayloadAction<any>) => {
        
        state.isLoading = false;
        if (action.payload.status) {
          
          
          state.giftCategory.unshift(action?.payload?.data);

          Success("Gift Category Created Successfully");
        }else {
          DangerRight(action.payload.data.message || action.payload.message)
  
        }
      }
    );
    builder.addCase(createGiftCategory.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(
      deleteGiftCategory.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(deleteGiftCategory.fulfilled, (state, action: any) => {
      if (action?.payload?.status) {
        
        state.giftCategory = state.giftCategory.filter(
          (giftCategory) => giftCategory?._id !== action?.meta?.arg
        );
        Success("Gift Category Delete Successfully");
      }else {
        DangerRight(action.payload.data.message || action.payload.message)

      }
      state.isLoading = false;
    });

    builder.addCase(deleteGiftCategory.rejected, (state, action) => {
      state.isLoading = false;
    });

    
    builder.addCase(
      updateGiftCategory.pending,
      (state, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      updateGiftCategory.fulfilled,
      (state, action: PayloadAction<any>) => {
          if (action.payload.status) {
            const serviceInx = state.giftCategory.findIndex(
              (service) => service?._id === action?.payload?.data?._id
            );
            
            if (serviceInx !== -1) {
                
              state.giftCategory[serviceInx] = {
                ...state.giftCategory[serviceInx],
                ...action.payload.data,
              };
            } 
            Success("Gift Category Update Successfully");
          }else {
            DangerRight(action.payload.data.message)
          }
        state.isLoading = false;
      }
    );

    builder.addCase(updateGiftCategory.rejected, (state, action) => {
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
          const bannerIndex = state.giftCategory.findIndex(
            (giftCategory) => giftCategory?._id === updatedBanner?._id
          );
          if (bannerIndex !== -1) {
            state.giftCategory[bannerIndex].isActive = updatedBanner.isActive;
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

export default giftSlice.reducer;
