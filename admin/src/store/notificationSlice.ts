import { DangerRight, Success } from "@/api/toastServices";
import { apiInstance, apiInstanceFetch } from "@/utils/ApiInstance";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import axios from "axios";

interface notificationState {
  notification: [];
  total: any;
  isLoading: boolean;
  isSkeleton: boolean;
}

const initialState: notificationState = {
  notification: [],
  total: null,
  isLoading: false,
  isSkeleton: false,
};

interface AllUsersPayload {
  userId?: any;
  data?: any;
  formData?: any;
  doctorId?: any;
  status?: number;
  expertId?: any;
}

export const userNotification: any = createAsyncThunk(
  "api/admin/notification/sendNotificationToSingleUserByAdmin",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.post(
      `api/admin/notification/sendNotificationToSingleUserByAdmin`,
      payload?.formData
    );
  }
);

export const userNotificationWithoutImage: any = createAsyncThunk(
  "api/admin/notification/sendNotificationToSingleUserByAdmin1",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.post(
      `api/admin/notification/sendNotificationToSingleUserByAdmin`,
      payload
    );
  }
);

export const doctorNotification = createAsyncThunk(
  "admin/notification/toExpert",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstance.post(
      `admin/notification/toExpert?doctorId=${payload?.doctorId}`,
      payload?.data
    );
  }
);

export const allUserHostNotification: any = createAsyncThunk(
  "api/admin/notification/sendNotifications",
  async (payload: any) => {
    return apiInstanceFetch.post(
      "api/admin/notification/sendNotifications",
      payload
    );
  }
);

export const hostNotification: any = createAsyncThunk(
  "api/admin/notification/sendNotificationToSingleHostByAdmin",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.post(
      `api/admin/notification/sendNotificationToSingleHostByAdmin`,
      payload
    );
  }
);

export const agencyNotification: any = createAsyncThunk(
  "api/admin/notification/notificationToAgencyByAdmin",
  async (payload: AllUsersPayload | undefined) => {
    return axios.post(
      `api/admin/notification/notificationToAgencyByAdmin`,
      payload
    );
  }
);

const notificationSlice = createSlice({
  name: "payoutSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(userNotification.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(
      userNotification.fulfilled,
      (state, action: PayloadAction<any>) => {
        
        state.isLoading = false;
        if (action?.payload?.status === true) {
          Success("Notification Send SuccessFully");
        } else {
          DangerRight(action?.payload?.data.message);
        }
      }
    );

    builder.addCase(userNotification.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(userNotificationWithoutImage.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(
      userNotificationWithoutImage.fulfilled,
      (state, action: PayloadAction<any>) => {
        
        state.isLoading = false;
        if (action?.payload?.status === true) {
          Success("Notification Send SuccessFully");
        } else {
          DangerRight(action?.payload?.data.message);
        }
      }
    );

    builder.addCase(userNotificationWithoutImage.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(hostNotification.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(hostNotification.fulfilled, (state, action) => {
      if (action?.payload?.status) {
        Success("Notification Send SuccessFully");
      }else {
        DangerRight(action?.payload?.message)
      }
      state.isLoading = false;
    }
  
  );

    builder.addCase(hostNotification.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(agencyNotification.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(agencyNotification.fulfilled, (state, action) => {
      
      if (action?.payload?.data?.status === true) {
        Success("Notification Send SuccessFully");
      }else {
        DangerRight(action.payload.data.message);
      }
      state.isLoading = false;
    });

    builder.addCase(agencyNotification.rejected, (state, action) => {
      state.isLoading = false;
    });

    builder.addCase(allUserHostNotification.pending, (state, action) => {
      state.isLoading = true;
    });

    builder.addCase(
      allUserHostNotification.fulfilled,
      (state, action: PayloadAction<any>) => {
        if (action?.payload?.status) {
          Success("Notification Send SuccessFully");
        }
        state.isLoading = false;
      }
    );

    builder.addCase(allUserHostNotification.rejected, (state, action) => {
      state.isLoading = false;
    });
  },
});

export default notificationSlice.reducer;
