"use client";
import { Providers } from "@/Provider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../assets/scss/custom/custom.css";
import "../assets/scss/default/default.css";
import "../assets/scss/style/style.css";
import "../assets/scss/dateRange.css";
import axios from "axios";
import { baseURL, key } from "@/utils/config";
import AuthCheck from "./AuthCheck";
import Loader from "@/utils/Loader";
import { store } from "@/store/store";
import { SkeletonTheme } from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';

export default function App({ Component, pageProps }) {
  const getToken =
    typeof window !== "undefined" && sessionStorage.getItem("token");
  const getLayout = Component.getLayout || ((page) => page);
  axios.defaults.baseURL = baseURL;
  axios.defaults.headers.common["key"] = key;
  axios.defaults.headers.common["Authorization"] = getToken
    ? `${getToken}`
    : "";

  return getLayout(
    <Providers>
      {/* <AuthCheck> */}
      <ToastContainer />
      <SkeletonTheme baseColor="#e2e5e7" highlightColor="#fff">
        <Component {...pageProps} />
      </SkeletonTheme>
      {/* <Loader /> */}
      {/* </AuthCheck> */}
    </Providers>
  );
}
