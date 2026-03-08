"use client";
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import adminSlice from "./adminSlice";
import dashboardSlice from "./dashboardSlice";
import settingSlice from "./settingSlice";
import notificationSlice from "./notificationSlice";
import dialogSlice from "./dialogSlice";
import hostRequestSlice from "./hostRequestSlice"
import agencySlice from "./agencySlice";
import hostSlice from "./hostSlice"
import withdrawalSlice from "./withdrawalSlice"


// Add persist config for admin slice
const adminPersistConfig = {
  key: 'admin',
  storage,
  whitelist: ['isAuth'], // only persist isAuth
};

const persistedAdminReducer = persistReducer(adminPersistConfig, adminSlice);

export function makeStore() {
  return configureStore({
    reducer: {
      admin: persistedAdminReducer,
      hostRequest: hostRequestSlice,
      dashboard: dashboardSlice,
      setting: settingSlice,
      notification: notificationSlice,
      dialogue: dialogSlice,
      agency: agencySlice,
     withdrawal: withdrawalSlice,
     host:hostSlice

    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      }),
  });
}
export const store = makeStore();
export const persistor = persistStore(store);

export type RootStore = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<any> = useSelector;
