"use client";
import { useEffect, useState } from "react";
import Login from "./agencyLogin";
import Registration from "./Registration";
import axios from "axios";
import { GetServerSideProps } from "next";
import { baseURL, key } from "@/utils/config";
import { apiInstance, apiInstanceFetch } from "@/utils/ApiInstance";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/agencyLogin',
      permanent: false, // Set to true if this is a permanent redirect
    },
  };
};

// export const getServerSideProps = (async () => {
//   const email = "demo@admin.com";
//   const password = "123456";
//   const res = await apiInstanceFetch.post(
//     `api/admin/admin/login`,
//     { email, password }
//     // method: "POST",
//     // headers: {
//     //   key,
//     //   "Content-Type": "application/json",
//     // },
//   );
//   // const response: any = await res.json();
//   return { props: { res } };
// }) satisfies GetServerSideProps<{ res: any }>;

const Home = (res: any) => {
  // const [login, setLogin] = useState(false);

  // useEffect(() => {
  //   axios
  //     .get("admin/login/login")
  //     .then((res) => {
  //       setLogin(res.data.login);
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //     });
  // }, []);
  // return login ? <Login /> : <Registration />;
  return <Login/>;
};

export default Home;
