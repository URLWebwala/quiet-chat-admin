"use client";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Input, { ExInput } from "../extra/Input";
import Logo from "../assets/images/logo.png";
import Image from "next/image";
import Button from "../extra/Button";
import { useAppDispatch } from "@/store/store";
import { useRouter } from "next/router";
import { login, sendEmailandForgotPassword } from "@/store/adminSlice";
import { signInWithEmailAndPassword } from "firebase/auth";
import  {auth}  from "../component/lib/firebaseConfig";

interface RootState {
  admin: {
    isAuth: boolean;
    admin: Object;
  };
}

export default function ForgotPassword() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuth, admin } = useSelector((state: RootState) => state.admin);

  const [email, setEmail] = useState("");

  const [error, setError] = useState({
    email: "",
  });





  const handleSubmit = async () => {
    if (!email) {
      let errorObj: any = {};
      if (!email) errorObj.email = "Email Is Required!";
      return setError(errorObj);
    }

    dispatch(sendEmailandForgotPassword(email));
  };


  const loginUser = async (email: string, password: string) => {
    try {

      // Sign in user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user) {
        console.error("No user found after login");
        return null;
      }

      // Get Firebase Auth Token
      const token = await userCredential.user.getIdToken(true); // ✅ Force refresh

      // Store token in localStorage or sessionStorage
      sessionStorage.setItem("token", token);

      return token;
    } catch (error: any) {
      console.error("Login Error:", error.code, error.message);
      return null;
    }
  };


  return (
    <>
      <div className="mainLoginPage">
        <div className="loginDiv" style={{ width: "100%" }}>
          <div className="loginPage m-auto">
            <div className="loginTitle mb-3  d-flex " style={{ width: "60px" }}>
              <img src={Logo.src} width={60} height={60} alt="logo" />
            </div>
            <div className="fw-bold text-theme  me-auto my-auto welComeTitle">
              Welcome Back
            </div>
            <h1>Forgot Password !</h1>
            <h6 className="fw-bold text-theme  me-auto my-auto fs-15 py-2 title">
              Please Enter Your Email
            </h6>
            <div>
              <div className="col-12 ">
                <ExInput
                  type={`text`}
                  id={`email`}
                  name={`email`}
                  label={`Email`}
                  value={email}
                  placeholder={`Email`}
                  errorMessage={error.email && error.email}
                  onChange={(e: any) => {
                    setEmail(e.target.value);
                    if (!e.target.value) {
                      return setError({
                        ...error,
                        email: `email Id is Required`,
                      });
                    } else {
                      return setError({
                        ...error,
                        email: "",
                      });
                    }
                  }}
                />
              </div>
          
              
              <div className="loginButton d-flex gx-2 justify-content-center" >
               
                <Button
                  type={`submit`}
                  className={`bg-theme text-light cursor m10-top col-6 mx-2`}
                  text={`Send Email`}
                  onClick={handleSubmit}
                  style={{ borderRadius: "30px" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


