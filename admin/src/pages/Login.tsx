"use client";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Input, { ExInput } from "../extra/Input";
import Logo from "../assets/images/logo.png";
import Image from "next/image";
import Button from "../extra/Button";
import { useAppDispatch } from "@/store/store";
import { useRouter } from "next/router";
import { login, setLoading } from "@/store/adminSlice";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../component/lib/firebaseConfig";
import { DangerRight, Success } from "@/api/toastServices";
import loginImage from "@/assets/images/login2.png";
import { projectName } from "@/utils/config";

interface RootState {
  admin: {
    isAuth: boolean;
    admin: Object;
    isLoading: boolean;
  };
}

export default function Login() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuth, admin, isLoading } = useSelector(
    (state: RootState) => state.admin
  );
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [error, setError] = useState({
    email: "",
    password: "",
  });

 


  const handleSubmit = async () => {
    dispatch(setLoading(true));
    setLoginLoading(true);
    if (!email || !password) {
      let errorObj: any = {};
      if (!email) errorObj.email = "Email Is Required!";
      if (!password) errorObj.password = "Password is required!";
      return setError(errorObj);
    }

    const token = await loginUser(email, password);

    let payload: any = {
      email,
      password,
    };

    if (token) {
      dispatch(login(payload));
    }
    dispatch(setLoading(false));
    setLoginLoading(false);
  };

  const loginUser = async (email: string, password: string) => {
    try {
      // Sign in user
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential?.user?.uid; // ✅ Fix: Declare uid

      if (!userCredential.user) {
        console.error("No user found after login");
        return null;
      }

      // Get Firebase Auth Token
      const token = await userCredential?.user?.getIdToken(true); // ✅ Force refresh
      // Store token in localStorage or sessionStorage
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("uid", uid);

      return token;
    } catch (error: any) {
      DangerRight("Invalid credentials. Please check your email and password.");
      return null;
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {

      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmit();
      }
    
  };

  return (
    <>
      <div className="login-container">
        <div className="image-section">
          <img
            src={loginImage.src}
            alt="Login Visual"
            className="login-visual"
          />
        </div>

        <div className="form-section d-flex flex-column align-items-center justify-content-center w-50 login-custom-form">
          <div className="">
            <div className="logologin">
              <img src={Logo.src} width={80} height={80} />
            </div>

            <h2 className="title">Login to your account</h2>
            <p className="subtitle">
              Let's connect, chat, and spark real connections. Enter your
              credentials to continue your journey on {projectName}.
            </p>

            <form className="login-form">
              <div className="form-group">
                <label>Enter your Email</label>
                <input
                  type="text"
                  value={email}
                  placeholder="Enter your email"
                  onKeyDown={handleKeyPress}
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
                <span className="text-danger" style={{ fontSize: "12px" }}>
                  {error.email}
                </span>
              </div>

              <div className="form-group" style={{ position: "relative" }}>
                <label className="mt-2">Enter your Password</label>
                <input
                  type="text"
                  value={password}
                  placeholder="Enter your password"
                  onChange={(e: any) => {
                    setPassword(e.target.value);
                    if (!e.target.value) {
                      return setError({
                        ...error,
                        password: `password is Required`,
                      });
                    } else {
                      return setError({
                        ...error,
                        password: "",
                      });
                    }
                  }}
                  onKeyDown={handleKeyPress} // 🔑 Attach here
                />
                <span className="text-danger" style={{ fontSize: "12px" }}>
                  {error.password}
                </span>
                <span
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="showpassword"
                  style={{
                    position: "absolute",
                    top: "75%",
                    right: "10px",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: "#aaa",
                  }}
                >
                  {showPassword ? (
                    <i className="fa-solid fa-eye"></i>
                  ) : (
                    <i className="fa-solid fa-eye-slash"></i>
                  )}{" "}
                  {/* You can use real icons */}
                </span>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleSubmit}
                  className="login-btn"
                >
                  {loginLoading ? "Loading..." : "Log In"}
                </button>
               
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
