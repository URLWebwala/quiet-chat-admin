"use client";

import { apiInstance, apiInstanceFetch } from "@/utils/ApiInstance";
import { jwtDecode } from "jwt-decode";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setToast } from "@/utils/toastServices";
import { SetDevKey, setToken } from "@/utils/setAuthAxios";
import { key } from "@/utils/config";
import axios from "axios";
import { DangerRight } from "@/api/toastServices";
import CryptoJS from "crypto-js";


interface UserState {
  isAuth: boolean;
  admin: any;
  countryData: any[];
  isLoading: boolean;
}
const flag: any =
  typeof window !== "undefined" && sessionStorage.getItem("admin_");
const initialState: UserState = {
  isAuth: false,
  admin: {},
  isLoading: false,
  countryData: [],
  
};

interface AllUsersPayload {
  adminId: string;
  start?: number;
  limit?: number;
  startDate?: string;
  data: any;
  endDate?: string;
  payload?: any;
  type?: string;
}

const token = typeof window !== "undefined" && sessionStorage.getItem("token");
const uid = typeof window !== "undefined" && sessionStorage.getItem(("uid"));


export const signUpAdmin = createAsyncThunk(
  "admin/admin/signUp",
  async (payload: any) => {
    return apiInstanceFetch.post("admin/signUp", payload);
  }
);



export const login = createAsyncThunk(
  "api/admin/admin/validateAdminLogin",
  async (payload: any) => {

    return apiInstanceFetch.post("api/admin/admin/validateAdminLogin", payload,

      {
        headers: {
          Authorization: `Bearer ${token}`, // Token
          "x-agency-uid": uid, // Custom UID header
        },
      }
    );
  }
);

export const sendEmailandForgotPassword = createAsyncThunk(
  "api/admin/admin/sendPasswordResetRequest",
  async (email: any) => {

    return axios.post(`api/admin/admin/sendPasswordResetRequest?email=${email}`,
    );
  }
);

export const agencyProfileGet = createAsyncThunk(
  "api/agency/getAgencyProfile",
  async (payload: AllUsersPayload | undefined) => {
    return apiInstanceFetch.get(`api/agency/getAgencyProfile`,

      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "", // Add token if available
          "x-agency-uid": uid, // Custom UID header
        },
      }
    );
  }
);

export const agencyProfileUpdate: any = createAsyncThunk(
  "api/agency/modifyAgency",
  async (payload: any) => {
    console.log("payload", payload);
    
    return apiInstanceFetch.patch(`api/agency/modifyAgency?agencyId=${payload?.agencyId}`, payload?.data);
  }
);

export const updateAdminPassword: any = createAsyncThunk(
  "api/admin/admin/modifyPassword",
  async (payload: AllUsersPayload | undefined) => {
    return axios.patch(`api/admin/admin/modifyPassword`, payload,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "", // Add token if available
          "x-admin-uid": uid, // Custom UID header
        },
      }
    );
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    logoutApi(state: any) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("admin");
      sessionStorage.removeItem("key");
      state.admin = {};
      state.isAuth = false;

    },


  },
  extraReducers: (builder: any) => {
    builder.addCase(
      signUpAdmin.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      signUpAdmin.fulfilled,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload && action.payload?.status !== false) {
          setToast("success", "Admin Sign Up Successfully");
          window.location.href = "/";
        } else {
          setToast("error", action.payload?.message);
        }
      }
    );
    builder.addCase(
      signUpAdmin.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );

    builder.addCase(login.pending, (state: any, action: PayloadAction<any>) => {
      state.isLoading = true;
    });
    builder.addCase(
      login.fulfilled,
      (state: any, action: any) => {
          
        state.isLoading = false;
        if (action.payload && action?.payload?.status !== false) {
          const token: any = sessionStorage.getItem("token");
          setToast("success", "Login Successfully");
          // const token = action.payload.data.data;
          const decodedToken: any = jwtDecode(token);

          state.isAuth = true;
          sessionStorage.setItem("isAuth", state.isAuth);
          state.admin = decodedToken;
          setToken(action.payload.data);
          SetDevKey(key);
          sessionStorage.setItem("admin_", JSON.stringify(decodedToken));
          const encrypted = CryptoJS.AES.encrypt(action?.meta?.arg?.password, key).toString();
          sessionStorage.setItem("data", encrypted)
          setTimeout(() => {

            window.location.href = "/dashboard";
          }, 1000)
        } else {

          DangerRight(action.payload?.data?.message || action?.payload?.message);
        }
      }
    );
    builder.addCase(
      login.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );

    builder.addCase(
      sendEmailandForgotPassword.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );

    builder.addCase(
      sendEmailandForgotPassword.fulfilled,
      (state: any, action: PayloadAction<any>) => {

        state.isLoading = false;
        if (action.payload?.data?.status === true) {
          setToast("success", action?.payload?.data?.message);
        } else if (action?.payload?.data?.status === false) {

          DangerRight(action?.payload?.data?.message || action?.payload?.message)
        }
      }
    );
    builder.addCase(
      sendEmailandForgotPassword.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );

    builder.addCase(
      agencyProfileGet.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );
    builder.addCase(
      agencyProfileGet.fulfilled,
      (state: any, action: PayloadAction<any>) => {

        state.isLoading = false;
        state.admin = action?.payload?.data
      }
    );
    builder.addCase(
      agencyProfileGet.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );

    builder
    .addCase(agencyProfileUpdate.pending, (state : any) => {
      state.isSkeleton = true;
    })
    .addCase(agencyProfileUpdate.fulfilled, (state : any, action: PayloadAction<any>) => {
      state.isSkeleton = false;
      if (action.payload?.status === true) {
        state.admin = action.payload.data;
        setToast("success", "Agency Profile Update Successful");
      } else {
        
        setToast("error", action.payload.data?.message || action.payload.message);
      }
    })
    .addCase(agencyProfileUpdate.rejected, (state : any, action: PayloadAction<any>) => {
      
      state.isSkeleton = false;
      console.error('Error:', action.payload);
      setToast("error", "Something went wrong. Try again!");
    });
  


 

    builder.addCase(
      updateAdminPassword.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );
    builder.addCase(
      updateAdminPassword.fulfilled,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.data?.status === true) {
          state.admin = action.payload.data?.data;
          setToast("success", "Admin Password Update Successful");

          window.location.href = "/";
        } else {
          setToast("error", action.payload.data.message);
        }
      }
    );
    builder.addCase(
      updateAdminPassword.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );
  },
});

export default adminSlice.reducer;
export const { logoutApi } = adminSlice.actions;
