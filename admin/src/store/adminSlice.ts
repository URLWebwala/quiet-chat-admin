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
  "admin/admin/registerAdmin",
  async (payload: any) => {
    try {  
      return apiInstanceFetch.post("api/admin/admin/registerAdmin", payload);
    } catch (error) {
      throw error
    }
  }
);



export const login = createAsyncThunk(
  "api/admin/admin/validateAdminLogin",
  async (payload: any) => {
    
    
    return apiInstanceFetch.post("api/admin/admin/validateAdminLogin", payload,

      {
        headers: {
          Authorization: `Bearer ${token}`, // Token
          "x-admin-uid": uid, // Custom UID header
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

export const adminProfileGet = createAsyncThunk(
  "api/admin/admin/retrieveAdminProfile",
  async (payload: AllUsersPayload | undefined) => {
    return axios.get(`api/admin/admin/retrieveAdminProfile`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "", // Add token if available
        "x-admin-uid": uid, // Custom UID header
      },
    });
  }
);

export const adminProfileUpdate: any = createAsyncThunk(
  "api/admin/admin/modifyAdminProfile",
  async (payload: AllUsersPayload | undefined) => {
    return axios.patch(`api/admin/admin/modifyAdminProfile`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "", // Add token if available
        "x-admin-uid": uid, // Custom UID header
      },
    });
  }
);

export const updateAdminPassword: any = createAsyncThunk(
  "api/admin/admin/modifyPassword",
  async (payload: AllUsersPayload | undefined) => {
    return axios.patch(`api/admin/admin/modifyPassword`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "", // Add token if available
        "x-admin-uid": uid, // Custom UID header
      },
    });
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
    setLoading : (state , action)=>{
      console.log("action" , action);
      state.isLoading = action.payload
    }
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
        if (action.payload.status) {
          setToast("success", "Admin Sign Up Successfully");
          console.log(action.payload.message, "action.payload");
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
          // window.location.href = "/";
        } else {
          setToast("error", action.payload.message);
          console.log(action.payload.message, "action.payload");
        }
      }
    );
    builder.addCase(
      signUpAdmin.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload.message);
      }
    );

    builder.addCase(login.pending, (state: any, action: PayloadAction<any>) => {
      state.isLoading = true;
    });
    builder.addCase(
      login.fulfilled,
      (state: any, action: any) => {
        
        if (action.payload && action?.payload?.status !== false) {
          const token: any = sessionStorage.getItem("token");
          setToast("success", "Login Successfully");
          // const token = action.payload.data.data;
          const decodedToken: any = jwtDecode(token);
          console.log("decodedToken", decodedToken);
          
          
          state.isAuth = true;
          sessionStorage.setItem("demo" , decodedToken?.email);
          sessionStorage.setItem("isAuth", state.isAuth);
          state.admin = decodedToken;
          setToken(action.payload.data);
          SetDevKey(key);
          sessionStorage.setItem("admin_", JSON.stringify(decodedToken));
          const encrypted = CryptoJS.AES.encrypt(action?.meta?.arg?.password, key).toString();
          sessionStorage.setItem("data", encrypted)
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 500)
          state.isLoading = false;
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
      adminProfileGet.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isSkeleton = true;
      }
    );
    builder.addCase(
      adminProfileGet.fulfilled,
      (state: any, action: PayloadAction<any>) => {

        state.isSkeleton = false;
        state.admin = {
          ...state.admin,
          _id: action.payload?.data?.data?._id,
          flag: action.payload?.data?.data?.flag,
          name: action.payload?.data?.data?.name,
          email: action.payload?.data?.data?.email,
          image: action.payload?.data?.data?.image,
          password: action.payload?.data?.data?.password,
        };
      }
    );
    builder.addCase(
      adminProfileGet.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isSkeleton = false;
        setToast("error", action.payload?.message);
      }
    );

    builder.addCase(
      adminProfileUpdate.pending,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = true;
      }
    );
    
    builder.addCase(
      adminProfileUpdate.fulfilled,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.data?.status === true) {
          const prevEmail = state.admin?.email;
          const updatedEmail = action.payload.data.data.email;

          state.admin = action.payload.data.data;
          setToast("success", "Admin Profile Update Successful");
          if (prevEmail && updatedEmail && prevEmail !== updatedEmail) {
            setTimeout(() => {
              window.location.href = "/";
            }, 1000); // Add delay for user to see toast message
          }
        } else {
          setToast("error", action.payload.data.message);
        }
      }
    );


    builder.addCase(
      adminProfileUpdate.rejected,
      (state: any, action: PayloadAction<any>) => {
        state.isLoading = false;
        setToast("error", action.payload?.message);
      }
    );

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

export const { logoutApi , setLoading } = adminSlice.actions;
export default adminSlice.reducer;
