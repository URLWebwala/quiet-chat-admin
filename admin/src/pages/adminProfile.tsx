import Button from "@/extra/Button";
import { useSelector } from "react-redux";
import { RootStore, useAppDispatch } from "@/store/store";
import { ChangeEvent, useEffect, useState } from "react";
import {
  adminProfileGet,
  adminProfileUpdate,
  updateAdminPassword,
} from "@/store/adminSlice";
import Title from "@/extra/Title";
import RootLayout from "@/component/layout/Layout";
import Male from "../assets/images/female.png";
import { baseURL, key } from "@/utils/config";
import Image from "next/image";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from "firebase/auth";
import CryptoJS from "crypto-js";
import { ExInput } from "@/extra/Input";
import { isSkeleton } from "@/utils/allSelector";
import male from "@/assets/images/user.png";
import { auth } from '@/component/lib/firebaseConfig';

interface ErrorState {
  name: string;
  email: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  image: string;
  imagePath: string;
}

const AdminProfile = () => {
  const dispatch = useAppDispatch();
  const roleSkeleton = useSelector(isSkeleton);
  const [email, setEmail] = useState<string | undefined>();
  const [name, setName] = useState<string | undefined>();
  const [error, setError] = useState<ErrorState>({
    name: "",
    email: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    image: "",
    imagePath: "",
  });
  const [image, setImage] = useState<File | undefined>();
  const [imagePath, setImagePath] = useState<any>();

  const [toggle, setToggle] = useState(false);
  const [type, setType] = useState<any>("edit_profile");
  const [newPassword, setNewPassword] = useState<string | undefined>("");
  const [confirmPassword, setConfirmPassword] = useState<string | undefined>(
    ""
  );
  const [oldPassword, setOldPassword] = useState<string | undefined>("");
  const [data, setData] = useState<any>();

  const { admin } = useSelector((state: RootStore) => state.admin);
  

  const updatedImagePath = admin?.image?.replace(/\\/g, "/");

  useEffect(() => {
    dispatch(adminProfileGet());
  }, [dispatch]);

  useEffect(() => {
    if (admin) {
      setOldPassword(admin?.password);
    }
  }, [])

  useEffect(() => {
    setName(admin?.name);
    setEmail(admin?.email);
    if (updatedImagePath) {
      setImagePath(baseURL + updatedImagePath);
    }
  }, [admin]);

  const handleUploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
      setImagePath(URL.createObjectURL(event.target.files[0]));
      setError((prevErrors) => ({ ...prevErrors, image: "" }));
    }
  };

  const handleChangePassword = async () => {
    if (
      !newPassword ||
      !confirmPassword ||
      newPassword !== confirmPassword ||
      !oldPassword
    ) {
      const error = {} as ErrorState;
      if (!newPassword) error.newPassword = "New password is required !";
      if (!confirmPassword)
        error.confirmPassword = "Confirm password Is required !";
      if (newPassword !== confirmPassword)
        error.confirmPassword =
          "New password and confirm password doesn't match";
      if (!oldPassword) error.oldPassword = "Old password is required !";
      return setError({ ...error });
    } else {
      const user: any = auth?.currentUser;

      const stored: any = sessionStorage.getItem("data");
      const decryptedPassword = CryptoJS.AES.decrypt(stored, key).toString(
        CryptoJS.enc.Utf8
      );

      const credential = EmailAuthProvider.credential(
        user.email,
        decryptedPassword
      );
      await reauthenticateWithCredential(user, credential);

      const res = await updatePassword(user, newPassword);
      sessionStorage.setItem("data", newPassword);

      let data = {
        oldPass: oldPassword,
        confirmPass: confirmPassword,
        newPass: newPassword,
      };
      dispatch(updateAdminPassword(data));
    }
  };

  const handlePrevious = (url: any) => {
    window.open(url, "_blank");
  };

  const handleEditName = async () => {
    if (!imagePath || !name || !email) {
      const error = {} as ErrorState;
      if (!email) error.email = "Email is required";
      if (!name) error.name = "Name is required";
      if (!image) error.image = "Image is required";
      setError(error);
    } else {
      const formData = new FormData();
      formData.append("image", image as File);
      formData.append("name", name);
      formData.append("email", email);

      const user = auth?.currentUser;

      if (!user || !user.email) throw new Error("User not logged in");

      const stored: any = sessionStorage.getItem("data");
      const decryptedPassword = CryptoJS.AES.decrypt(stored, key).toString(
        CryptoJS.enc.Utf8
      );

      const credential = EmailAuthProvider.credential(
        user.email,
        decryptedPassword
      );
      await reauthenticateWithCredential(user, credential);

      if (user.email !== email) {
        await updateEmail(user, email);
      } else {
        console.log("Email is the same, no update needed");
      }

      dispatch(adminProfileUpdate(formData));
    }
  };

  return (
    <>
      <div className="mainAdminProfile">
        <Title name="Admin profile" />
        <div className="d-lg-flex d-md-block">
          <div className="col-12 col-sm-12  col-lg-3 col-md-5 mt-4">
            <div
              className="card"
              style={{
                minHeight: "500px",
                maxWidth: "350px",
                borderRadius: "20px",
                padding: "24px 24px 0px 24px",
              }}
            >
              {roleSkeleton ? (
                // <>
                //   <div
                //     className="skeleton mx-auto mb-4"
                //     style={{
                //       height: "354px",
                //       width: "300px",
                //       borderRadius: "16px",
                //     }}
                //   ></div>

                //   {/* Name */}
                //   <div
                //     className="skeleton mx-auto mb-3"
                //     style={{
                //       height: "20px",
                //       width: "60%",
                //       borderRadius: "4px",
                //     }}
                //   ></div>

                //   {/* Email */}
                //   <div
                //     className="skeleton mx-auto mb-4"
                //     style={{
                //       height: "14px",
                //       width: "50%",
                //       borderRadius: "4px",
                //     }}
                //   ></div>

                //   {/* Update Button */}
                //   <div
                //     className="skeleton mx-auto"
                //     style={{
                //       height: "40px",
                //       width: "300px",
                //       borderRadius: "8px",
                //       marginTop : "35px"
                //     }}
                //   ></div>
                // </>

                <>
                  {/* Circular Image Skeleton */}
                  <div
                    className="skeleton mx-auto mb-4"
                    style={{
                      height: "200px",
                      width: "200px",
                      borderRadius: "50%",
                    }}
                  ></div>

                  {/* Name Skeleton */}
                  <div
                    className="skeleton mx-auto mb-2"
                    style={{
                      height: "20px",
                      width: "50%",
                      borderRadius: "4px",
                    }}
                  ></div>

                  {/* Email Skeleton */}
                  <div
                    className="skeleton mx-auto mb-4"
                    style={{
                      height: "14px",
                      width: "40%",
                      borderRadius: "4px",
                    }}
                  ></div>

                  {/* Button Skeleton */}
                  <div
                    className="skeleton mx-auto"
                    style={{
                      height: "44px",
                      width: "280px",
                      borderRadius: "12px",
                      marginTop: "100px",
                    }}
                  ></div>
                </>
              ) : (
                <div className="card-body">
                  <div className="position-relative">
                    <input
                      id="file-input"
                      type="file"
                      accept="image/*"
                      className="d-none"
                      onChange={(e) => handleUploadImage(e)}
                    />
                    <img
                      src={imagePath ? imagePath : male.src}
                      alt="admin"
                      className="p-1 border adminprofileimg"
                      style={{
                        height: "300px",
                        width: "300px",
                        display: "block",
                        borderRadius: "38px",
                      }}
                      onClick={() => handlePrevious(imagePath)}
                    />

                    <div
                      className="position-absolute"
                      style={{ top: "4%", right: "10%" }}
                    >
                      <div
                        className="bg-theme"
                        style={{
                          // background: "rgb(31, 28, 48)",
                          borderRadius: 50,
                          height: 29,
                        }}
                      >
                        <label htmlFor="file-input">
                          <i
                            className="fa fa-camera d-flex justify-content-center  rounded-circle  p-2 cursorPointer m-0"
                            style={{
                              fontSize: 14,
                              color: "rgb(255, 255, 255)",
                              cursor: "pointer",
                              marginRight: "3px",
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: "28px", textAlign: "center" }}>
                    <h6 style={{ fontSize: "22px", fontWeight: "500" }}>
                      {admin?.name}
                    </h6>
                    <p style={{ color: "#343434", fontSize: "15px" }}>
                      {admin?.email}
                    </p>
                  </div>
                  <div className="text-center my-4">
                    <h2 className="text-capitalize">{data?.name}</h2>
                    <div className="mt-4">
                      <Button
                        style={{ width: "300px", borderRadiuse: "12px" }}
                        onClick={handleEditName}
                        className={`text-end btn bg-theme text-white ml-2 updateimagetext`}
                        text={`Update Images`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="col-12 col-sm-12 col-md-12 col-lg-9 col-xxl-9 mt-4 pl-0">
            <div className="row">
              <div className="col-12">
                <div
                  className="card marginleft"
                  style={{
                    height: 500,
                    paddingTop: "10px",
                    paddingLeft: "20px",
                    borderRadius: "20px",
                  }}
                >
                  {type === "change_password" ? (
                    <div className="card-body">
                      <div className="my-2 profile_width">
                        <button
                          type="button"
                          className={`${
                            type === "edit_profile"
                              ? "activeBtn"
                              : "disabledBtn"
                          }`}
                          onClick={() => setType("edit_profile")}
                        >
                          Edit Profile
                        </button>
                        <button
                          type="button"
                          className={`${
                            type === "change_password"
                              ? "activeBtn"
                              : "disabledBtn"
                          } ms-1`}
                          onClick={() => setType("change_password")}
                        >
                          Change Password
                        </button>
                      </div>
                      {roleSkeleton ? (
                        // <div className="col-sm-12 col-md-12 col-lg-7 col-xl-7 col-xxl-7">
                        //   <div
                        //     className="mt-3"
                        //     style={{
                        //       borderRadius: "16px",
                        //       maxWidth: "600px",
                        //     }}
                        //   >
                        //     {/* Input Fields */}
                        //     {[
                        //       "Old Password",
                        //       "New Password",
                        //       "Confirm Password",
                        //     ].map((_, i) => (
                        //       <div key={i} className="mb-4">
                        //         <div
                        //           className="skeleton mb-3"
                        //           style={{
                        //             height: "16px",
                        //             width: "200px",
                        //             borderRadius: "4px",
                        //           }}
                        //         ></div>
                        //         <div
                        //           className="skeleton"
                        //           style={{
                        //             height: "42px",
                        //             width: "100%",
                        //             borderRadius: "12px",
                        //           }}
                        //         ></div>
                        //       </div>
                        //     ))}

                        //     {/* Submit Button */}
                        //     <div className="d-flex justify-content-start">
                        //       <div
                        //         className="skeleton"
                        //         style={{
                        //           height: "42px",
                        //           width: "100px",
                        //           borderRadius: "6px",
                        //           marginTop: "120px",
                        //         }}
                        //       ></div>
                        //     </div>
                        //   </div>
                        // </div>
                        <div className="col-sm-12 col-md-12 col-lg-7 col-xl-7 col-xxl-7">
                          <div
                            className="mt-3"
                            style={{
                              borderRadius: "16px",
                              maxWidth: "600px",
                            }}
                          >
                            {/* Tab Switch Skeleton */}
                            <div className="d-flex mb-5 gap-2">
                              <div
                                className="skeleton"
                                style={{
                                  height: "38px",
                                  width: "140px",
                                  borderRadius: "12px",
                                }}
                              ></div>
                              <div
                                className="skeleton"
                                style={{
                                  height: "38px",
                                  width: "160px",
                                  borderRadius: "12px",
                                }}
                              ></div>
                            </div>

                            {/* Input Fields */}
                            {[
                              "Old Password",
                              "New Password",
                              "Confirm Password",
                            ].map((_, i) => (
                              <div key={i} className="mb-4">
                                {/* Label */}
                                <div
                                  className="skeleton mb-2"
                                  style={{
                                    height: "16px",
                                    width: "180px",
                                    borderRadius: "4px",
                                  }}
                                ></div>

                                {/* Input + Eye Icon Row */}
                                <div
                                  className="d-flex align-items-center"
                                  style={{ gap: "10px" }}
                                >
                                  <div
                                    className="skeleton"
                                    style={{
                                      height: "42px",
                                      width: "100%",
                                      borderRadius: "12px",
                                    }}
                                  ></div>
                                  <div
                                    className="skeleton"
                                    style={{
                                      height: "32px",
                                      width: "32px",
                                      borderRadius: "50%",
                                    }}
                                  ></div>
                                </div>
                              </div>
                            ))}

                            {/* Submit Button */}
                            <div className="d-flex justify-content-start">
                              <div
                                className="skeleton"
                                style={{
                                  height: "44px",
                                  width: "150px",
                                  borderRadius: "8px",
                                  marginTop: "30px",
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="col-sm-12 col-md-12 col-lg-7 col-xl-7 col-xxl-7">
                          <div className="form-group mt-4 ">
                            <div className="mb-2 my-4">
                              <label
                                className="mb-2  ml-3 font-weight-bold"
                                style={{ fontSize: 16, color: "#727272" }}
                              >
                                Old Password
                              </label>
                              <ExInput
                                type="password"
                                className="form-control p-2 mb-4"
                                placeholder="Old Password"
                                value={oldPassword}
                                onChange={(e: any) => {
                                  setOldPassword(e.target.value);
                                  if (!e.target.value) {
                                    return setError({
                                      ...error,
                                      oldPassword: "Old password is required !",
                                    });
                                  } else {
                                    return setError({
                                      ...error,
                                      oldPassword: "",
                                    });
                                  }
                                }}
                              />
                              {error.oldPassword && (
                                <p className="text-danger errorMessage text-capitalize">
                                  {error.oldPassword}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="form-group">
                            <div className="mb-2 my-4">
                              <label
                                className="mb-2 text-gray ml-3 font-weight-bold"
                                style={{ fontSize: 16 }}
                              >
                                New Password
                              </label>
                              <ExInput
                                type="password"
                                className="form-control p-2"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e: any) => {
                                  setNewPassword(e.target.value);
                                  if (!e.target.value) {
                                    return setError({
                                      ...error,
                                      newPassword: "New password is required !",
                                    });
                                  } else {
                                    return setError({
                                      ...error,
                                      newPassword: "",
                                    });
                                  }
                                }}
                              />
                              {error.newPassword && (
                                <p className="text-danger errorMessage text-capitalize">
                                  {error.newPassword}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="form-group ">
                            <div className="mb-2 ">
                              <label
                                className="mb-2 text-gray ml-3 font-weight-bold"
                                style={{ fontSize: 16, marginTop: "15px" }}
                              >
                                Confirm Password
                              </label>
                              <ExInput
                                type="password"
                                className="form-control p-2"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e: any) => {
                                  setConfirmPassword(e.target.value);
                                  if (!e.target.value) {
                                    return setError({
                                      ...error,
                                      confirmPassword:
                                        "Confirm password is required !",
                                    });
                                  } else {
                                    return setError({
                                      ...error,
                                      confirmPassword: "",
                                    });
                                  }
                                }}
                              />
                              {error.confirmPassword && (
                                <p className="text-danger errorMessage text-capitalize">
                                  {error.confirmPassword}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="d-flex justify-content-start">
                            <Button
                              onClick={handleChangePassword}
                              text={`Submit`}
                              className={` text-white`}
                              style={{
                                backgroundColor: "#9F5AFF ",
                                marginTop: "52px",
                                width: "148px",
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="card-body">
                      <div className="my-2 profile_width">
                        <button
                          type="button"
                          className={`${
                            type === "edit_profile"
                              ? "activeBtn"
                              : "disabledBtn"
                          }`}
                          onClick={() => setType("edit_profile")}
                        >
                          Edit Profile
                        </button>
                        <button
                          type="button"
                          className={`${
                            type === "change_password"
                              ? "activeBtn"
                              : "disabledBtn"
                          } ms-1`}
                          onClick={() => setType("change_password")}
                        >
                          Change Password
                        </button>
                      </div>

                      {roleSkeleton ? (
                        // <div className="col-sm-12 col-md-12 col-lg-7 col-xl-7 col-xxl-7">
                        //   <div
                        //     className="mt-5"
                        //     style={{
                        //       borderRadius: "16px",
                        //       maxWidth: "600px",
                        //     }}
                        //   >
                        //     {/* Input Fields */}
                        //     {["Name", "Email"].map((_, i) => (
                        //       <div key={i} className="mb-4">
                        //         <div
                        //           className="skeleton mb-3"
                        //           style={{
                        //             height: "16px",
                        //             width: "200px",
                        //             borderRadius: "4px",
                        //           }}
                        //         ></div>
                        //         <div
                        //           className="skeleton"
                        //           style={{
                        //             height: "42px",
                        //             width: "100%",
                        //             borderRadius: "12px",
                        //           }}
                        //         ></div>
                        //       </div>
                        //     ))}

                        //     {/* Submit Button */}
                        //     <div className="d-flex justify-content-start">
                        //       <div
                        //         className="skeleton"
                        //         style={{
                        //           height: "42px",
                        //           width: "100px",
                        //           borderRadius: "6px",
                        //           marginTop: "185px",
                        //         }}
                        //       ></div>
                        //     </div>
                        //   </div>
                        // </div>
                        <div className="col-sm-12 col-md-12 col-lg-7 col-xl-7 col-xxl-7">
                          <div
                            className="mt-5"
                            style={{
                              borderRadius: "16px",
                              maxWidth: "600px",
                            }}
                          >
                           

                            {/* Name & Email Input Skeletons */}
                            {["Name", "Email"].map((_, i) => (
                              <div key={i} className="mb-4">
                                {/* Label Skeleton */}
                                <div
                                  className="skeleton mb-2"
                                  style={{
                                    height: "16px",
                                    width: "160px",
                                    borderRadius: "4px",
                                  }}
                                ></div>

                                {/* Rounded Input Field Skeleton */}
                                <div
                                  className="skeleton"
                                  style={{
                                    height: "42px",
                                    width: "100%",
                                    borderRadius: "20px",
                                  }}
                                ></div>
                              </div>
                            ))}

                            {/* Submit Button Skeleton */}
                            <div className="d-flex justify-content-start">
                              <div
                                className="skeleton"
                                style={{
                                  height: "44px",
                                  width: "148px",
                                  borderRadius: "8px",
                                  marginTop: "130px", // Adjust as per final alignment
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="col-sm-12 col-md-12 col-lg-7 col-xl-7 col-xxl-7 my-5">
                          <div className="form-group  mr-4 mt-3">
                            <div className="mb-3">
                              <label
                                className="mb-2 text-gray ml-3"
                                style={{ fontSize: 15 }}
                              >
                                Name
                              </label>
                              <input
                                type="text"
                                placeholder="name"
                                className="form-control p-2"
                                value={name}
                                onChange={(e) => {
                                  setName(e.target.value);
                                  if (!e.target.value) {
                                    return setError({
                                      ...error,
                                      name: "Name is required !",
                                    });
                                  } else {
                                    return setError({
                                      ...error,
                                      name: "",
                                    });
                                  }
                                }}
                              />
                              {error.name && (
                                <p className="errorMessage text-capitalize text-danger">
                                  {error.name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="form-group  mr-4">
                            <div className="mb-2">
                              <label
                                className="mb-2 text-gray ml-3"
                                style={{ fontSize: 15 }}
                              >
                                Email
                              </label>
                              <input
                                type="email"
                                placeholder="email"
                                className="form-control p-2"
                                value={email}
                                onChange={(e) => {
                                  setEmail(e.target.value);
                                  if (!e.target.value) {
                                    return setError({
                                      ...error,
                                      email: "Email is required !",
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
                            {error.email && (
                              <p className="errorMessage text-capitalize text-danger">
                                {error.email}
                              </p>
                            )}
                          </div>

                          <div className="d-flex justify-content-start">
                            <Button
                              onClick={handleEditName}
                              text={`Submit`}
                              className={` text-white`}
                              style={{
                                backgroundColor: "#9F5AFF ",
                                width: "148px",
                                marginTop: "156px",
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
AdminProfile.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AdminProfile;
