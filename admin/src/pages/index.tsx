"use client";
import { useEffect, useState } from "react";
import Login from "./Login";
import Registration from "./Registration";
import axios from "axios";
import Loader from "@/component/Loader";

const Home = (res: any) => {
  const [login, setLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("api/admin/login")
      .then((res) => {
        setLogin(res.data.login);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);
  return loading ? <Loader /> : login ? <Login /> : <Registration />;

};

export default Home;
