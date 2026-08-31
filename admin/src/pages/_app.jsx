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





import Head from "next/head";
import { projectName } from "@/utils/config";

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
      <Head>
        <title>{projectName || "Quiet Chat"}</title>
        <link rel="icon" type="image/png" href="/fav.png?v=2" />
        <link rel="shortcut icon" type="image/png" href="/fav.png?v=2" />
        <link rel="apple-touch-icon" href="/fav.png?v=2" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Head>
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
