import { DangerRight, Success } from "@/api/toastServices";
import { apiInstance, apiInstanceFetch } from "@/utils/ApiInstance";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

interface SettingState {
  setting: any[];
  documentType: any[];
  total: number;
  isLoading: boolean;
  isSkeleton: boolean;
  withdrawSetting: any;
  currency: any[];
  defaultCurrency: any;
}

const initialState: SettingState = {
  setting: [],
  withdrawSetting: [],
  documentType: [],
  isLoading: false,
  total: 0,
  isSkeleton: false,
  currency: [],
  defaultCurrency: {},
};

interface SettingPayload {
  meta?: any;
  id?: any;
  data: any;
  settingId: any;
  payload: any;
  type: any;
  status: any;
}

export const getSetting: any = createAsyncThunk(
  "api/admin/setting/fetchSettings",
  async (payload: SettingPayload | undefined) => {
    return apiInstanceFetch.get("api/admin/setting/fetchSettings");
  }
);

export const getDocumentType: any = createAsyncThunk(
  "api/admin/identityProof/getIdentityProofs",
  async (payload: SettingPayload | undefined) => {
    return apiInstanceFetch.get(`api/admin/identityProof/getIdentityProofs`);
  }
);

export const updateSetting: any = createAsyncThunk(
  "api/admin/setting/updateSetting",
  async (payload: any | undefined) => {
    return apiInstanceFetch.patch(`api/admin/setting/updateSetting?settingId=${payload?.settingId}`, payload?.settingDataSubmit);
  }
);


export const handleSetting: any = createAsyncThunk(
  "api/admin/setting/updateSettingToggle",
  async (payload: SettingPayload | undefined) => {
    return apiInstanceFetch.patch(
      `api/admin/setting/updateSettingToggle?settingId=${payload?.settingId}&type=${payload?.type}`
    );
  }
);

export const getWithdrawMethod = createAsyncThunk(
  "api/admin/paymentMethod/retrievePaymentMethods",
  async (payload: SettingPayload | undefined) => {
    return apiInstanceFetch.get(`api/admin/paymentMethod/retrievePaymentMethods`);
  }
);

export const createWithdrawMethod = createAsyncThunk(
  "api/admin/paymentMethod/addPaymentMethod",
  async (payload: any) => {
    return apiInstanceFetch.post("api/admin/paymentMethod/addPaymentMethod", payload);
  }
);

export const createIdentityProof = createAsyncThunk(
  "api/admin/identityProof/createIdentityProof",
  async (payload) => {

    return apiInstanceFetch.post(`api/admin/identityProof/createIdentityProof?title=${payload}`);
  }
);


export const updateWithdrawMethod = createAsyncThunk(
  "api/admin/paymentMethod/modifyPaymentMethod",
  async (payload: any) => {
    return apiInstanceFetch.patch(
      `api/admin/paymentMethod/modifyPaymentMethod`,
      payload?.formData
    );
  }
);
export const activeWithdrawMethod = createAsyncThunk(
  "api/admin/paymentMethod/updatePaymentMethodStatus?",
  async (payload: any) => {
    return apiInstanceFetch.patch(
      `api/admin/paymentMethod/updatePaymentMethodStatus?paymentMethodId=${payload}`
    );
  }
);
export const deleteWithdrawMethod = createAsyncThunk(
  "api/admin/paymentMethod/discardPaymentMethod",
  async (payload: any) => {
    return apiInstanceFetch.delete(
      `api/admin/paymentMethod/discardPaymentMethod?paymentMethodId=${payload}`
    );
  }
);

export const getAllCurrency = createAsyncThunk(
  "api/admin/currency/fetchCurrencyData",
  async (payload: SettingPayload | undefined) => {
    return apiInstanceFetch.get(`api/admin/currency/fetchCurrencyData`);
  }
);

export const createCurrency = createAsyncThunk(
  "api/admin/currency/createCurrency",
  async (payload: any) => {
    return apiInstanceFetch.post("api/admin/currency/createCurrency", payload);
  }
);

export const updateCurrency = createAsyncThunk(
  "api/admin/currency/updateCurrency",
  async (payload: any) => {
    return apiInstanceFetch.patch(
      `api/admin/currency/updateCurrency`,
      payload?.data
    );
  }
);

export const setDefaultCurrency = createAsyncThunk(
  "api/admin/currency/setdefaultCurrency",
  async (payload: any) => {
    return apiInstanceFetch.patch(`api/admin/currency/setdefaultCurrency?currencyId=${payload}`);
  }
);

export const deleteCurrency = createAsyncThunk(
  "api/admin/currency/destroyCurrency",
  async (payload: any) => {
    return apiInstanceFetch.delete(`api/admin/currency/destroyCurrency?currencyId=${payload}`);
  }
);

export const deleteDocumentType: any = createAsyncThunk(
  "api/admin/identityProof/deleteImpression",
  async (payload: any) => {
    return apiInstanceFetch.delete(`api/admin/identityProof/deleteIdentityProof?identityProofId=${payload}`);
  }
);

export const getDefaultCurrency : any = createAsyncThunk(
  "api/admin/currency/getDefaultCurrency",
  async () => {
    return apiInstanceFetch.get("api/admin/currency/getDefaultCurrency");
  }
);

export const updateDocumentType = createAsyncThunk(
  "api/admin/identityProof/updateIdentityProof",
  async (payload: any) => {
    return apiInstanceFetch.patch(
      `api/admin/identityProof/updateIdentityProof?title=${payload?.title}&identityProofId=${payload?.identityProofId}`
    );
  }
);


const settingSlice = createSlice({
  name: "settingSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getSetting.pending, (state, action) => {
      state.isSkeleton = true;
    });

    builder.addCase(getSetting.fulfilled, (state, action) => {
      state.isSkeleton = false;
      state.setting = action?.payload?.data;
    });

    builder.addCase(getSetting.rejected, (state, action) => {
      state.isSkeleton = false;
    });

    builder.addCase(getDocumentType.pending, (state, action: any) => {
      state.isSkeleton = true;
    });
    builder.addCase(
      getDocumentType.fulfilled,
      (state, action: any) => {
        state.isSkeleton = false;
        state.documentType = action.payload.data;
        state.total = action.payload.total
      }
    );
    builder.addCase(getDocumentType.rejected, (state, action: any) => {
      state.isSkeleton = false;
    });

    builder.addCase(updateSetting.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(updateSetting.fulfilled, (state, action) => {
      if (action.payload.status) {
        state.setting = { ...state.setting, ...action.payload.data };
        Success("Setting Updated Successfully");
      }
      state.isLoading = false;
    });

    builder.addCase(getWithdrawMethod.pending, (state, action: any) => {
      state.isSkeleton = true;
    });

    builder.addCase(getWithdrawMethod.fulfilled, (state, action: any) => {
      
      state.isSkeleton = false;
      state.withdrawSetting = action.payload.data;
    });

    builder.addCase(getWithdrawMethod.rejected, (state, action: any) => {
      state.isSkeleton = false;
    });
    builder.addCase(handleSetting.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(handleSetting.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload.status === true) {
        state.setting = action.payload.data;
        Success("Updated Successfully");
      } else {
        DangerRight(action.payload.message);
      }
    });

    builder.addCase(handleSetting.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(createWithdrawMethod.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(createWithdrawMethod.fulfilled, (state, action: any) => {
      state.isLoading = false;
      if (action.payload.status) {
        
        state.withdrawSetting.unshift(action?.payload?.data);
        Success("Withdraw Method Add Successfully");
      } else {
        DangerRight(action?.payload?.data?.message || action?.payload?.message);
      }
    });
    builder.addCase(createWithdrawMethod.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(
      createIdentityProof.pending,
      (state, action: any) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      createIdentityProof.fulfilled,
      (state, action: any) => {
        state.isLoading = false;
        if (action.payload.status) {
          state.documentType.unshift(action?.payload?.data);
          Success("Identity Proof Add Successfully");
        } else {
          DangerRight(action?.payload?.message)

        }
      }
    );
    builder.addCase(createIdentityProof.rejected, (state) => {
      state.isLoading = false;
    });


    builder.addCase(updateWithdrawMethod.pending, (state, action: any) => {
      state.isLoading = true;
    });

    builder.addCase(updateWithdrawMethod.fulfilled, (state, action: any) => {
      if (action.payload.status) {
        if (action.payload.status) {
          
          const Index = state.withdrawSetting.findIndex(
            (withdrawSetting : any) =>
              withdrawSetting?._id === action?.payload?.data?._id
          );

          if (Index !== -1) {
            state.withdrawSetting[Index] = {
              ...state.withdrawSetting[Index],
              ...action.payload.data,
            };
          }
        }
        Success("WithDraw Method Update Successfully");
      } else {
      DangerRight(action?.payload?.message ||action.payload.data.message);
      }
      state.isLoading = false;
    });

    builder.addCase(updateWithdrawMethod.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(
      updateDocumentType.pending,
      (state, action: any) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      updateDocumentType.fulfilled,
      (state, action: any) => {
        if (action.payload.status) {
          const documentTypeIndex = state.documentType.findIndex(
            (documentType) => documentType?._id === action?.payload?.data?._id
          );

          if (documentTypeIndex !== -1) {

            state.documentType[documentTypeIndex] = {
              ...state.documentType[documentTypeIndex],
              ...action.payload.data,
            };
            Success("Identity Proof Update Successfully");
          } else {
            DangerRight(action?.payload?.message)

          }
        }
        state.isLoading = false;
      }
    );

    builder.addCase(updateDocumentType.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(activeWithdrawMethod.pending, (state, action: any) => {
      state.isLoading = true;
    });

    builder.addCase(activeWithdrawMethod.fulfilled, (state, action: any) => {
      if (action?.payload?.status) {
        const updatedWithdraw = action.payload.data;
        const Index = state.withdrawSetting.findIndex(
          (withdrawSetting : any) => withdrawSetting?._id === updatedWithdraw?._id
        );
        if (Index !== -1) {
          state.withdrawSetting[Index].isActive = updatedWithdraw.isActive;
        }
        Success("Withdraw Status Update Successfully");
      } else {
        Success(action?.payload?.message || action?.payload?.data?.message);
      }
      state.isLoading = false;
    });

    builder.addCase(activeWithdrawMethod.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(deleteWithdrawMethod.pending, (state, action: any) => {
      state.isLoading = true;
    });

    builder.addCase(deleteWithdrawMethod.fulfilled, (state, action: any) => {
      if (action?.payload?.status) {
        state.withdrawSetting = state.withdrawSetting.filter(
          (withdrawSetting: any) => withdrawSetting._id !== action?.meta?.arg
        );

        Success("Withdraw Delete Successfully");
      } else {
        Success(action.payload.data?.message);
      }
      state.isLoading = false;
    });

    builder.addCase(deleteWithdrawMethod.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(getAllCurrency.pending, (state, action: any) => {
      state.isSkeleton = true;
    });

      builder.addCase(getAllCurrency.fulfilled, (state, action: any) => {
      state.isSkeleton = false;
      state.currency = action.payload.data;
    });
    builder.addCase(getAllCurrency.rejected, (state, action: any) => {
      state.isSkeleton = false;
    });

    builder.addCase(
      deleteDocumentType.pending,
      (state, action: any) => {
        state.isLoading = true;
      }
    );

    builder.addCase(deleteDocumentType.fulfilled, (state, action: any) => {
      if (action?.payload?.status) {

        state.documentType = state.documentType.filter(
          (documentType) => documentType?._id !== action?.meta?.arg
        );
        Success("Identity Proof Delete Successfully");
      } else {
        DangerRight(action?.payload?.message)
      }
      state.isLoading = false;
    });

    builder.addCase(deleteDocumentType.rejected, (state, action) => {
      state.isLoading = false;
    });

  

    builder.addCase(createCurrency.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(createCurrency.fulfilled, (state, action: any) => {
      state.isLoading = false;
      if (action.payload.status) {
        state.currency.unshift(action?.payload?.data);

        Success("Currency add successfully");
      } else {
        DangerRight(action?.payload?.data?.message);
      }
    });
    builder.addCase(createCurrency.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(updateCurrency.pending, (state, action: any) => {
      state.isLoading = true;
    });

    builder.addCase(updateCurrency.fulfilled, (state, action: any) => {
      state.isLoading = false;
      if (action.payload.status) {
        const Index = state.currency.findIndex(
          (currency) => currency?._id === action?.payload?.data?._id
        );

        if (Index !== -1) {
          state.currency[Index] = {
            ...state.currency[Index],
            ...action.payload.data,
          };
        }

        Success("Currency Update Successfully");
      } else {
        DangerRight(action.payload.data.message);
      }
    });
    builder.addCase(updateCurrency.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(setDefaultCurrency.pending, (state, action: any) => {
      state.isLoading = true;
    });

    builder.addCase(setDefaultCurrency.fulfilled, (state, action: any) => {
      
      state.isLoading = false;
      if (action.payload.status) {
        Success("Default Currency Update Successfully");
        state.currency = action.payload.data;
      } else {
        
        DangerRight(action?.payload?.message || action.payload.data.message);
      }
    });
    builder.addCase(setDefaultCurrency.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(deleteCurrency.pending, (state, action: any) => {
      state.isLoading = true;
    });

    builder.addCase(deleteCurrency.fulfilled, (state, action: any) => {
      state.isLoading = false;
      if (action?.payload?.status) {
        state.currency = state.currency.filter(
          (currency: any) => currency?._id !== action?.meta?.arg
        );

        Success("Currency Delete Successfully");
      } else {
        DangerRight(action?.payload?.message|| action?.payload?.data?.message);
      }
    });

    builder.addCase(deleteCurrency.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(getDefaultCurrency.pending, (state, action: any) => {
      state.isLoading = true;
    });
    builder.addCase(getDefaultCurrency.fulfilled, (state, action: any) => {
      
      state.isLoading = false;
      state.defaultCurrency = action.payload.data;
    });
    builder.addCase(getDefaultCurrency.rejected, (state, action: any) => {
      state.isLoading = false;
    });
  },
});

export default settingSlice.reducer;
