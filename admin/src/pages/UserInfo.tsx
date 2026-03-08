import React, { useEffect } from "react";
import RootLayout from "../component/layout/Layout";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { ExInput, Textarea } from "@/extra/Input";
import { useSelector } from "react-redux";
import { isLoading } from "@/utils/allSelector";
import { useAppDispatch } from "@/store/store";
import { baseURL } from "@/utils/config";
import male from "@/assets/images/male.png";
import Image from "next/image";
import { getUserProfile } from "@/store/userSlice";
import { useRouter } from "next/router";

interface RootStore {
  setting: any;
  user: {
    userProfile: any;
    userWalletHistory: any;
    user: any;
  };
}

const UserInfo = () => {
  const { userProfile, user } = useSelector((state: RootStore) => state.user);
  const userData =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("userData") || "null")
      : null;
  const loader = useSelector(isLoading);
  const { setting } = useSelector((state: RootStore) => state.setting);
  const dispatch = useAppDispatch();

  const router = useRouter();
  const id: any = router?.query?.id;

  useEffect(() => {
    if (!userData?._id) return;
    if (userData?._id === router?.query?.id) {
      dispatch(getUserProfile(userData._id));
    } else {
      dispatch(getUserProfile(id || userData?._id));
    }
  }, [dispatch, userData?._id]);

  return (
    <>
      <SkeletonTheme baseColor="#e2e5e7" highlightColor="#fff">
        {/* <div className="card card-no-border"> */}
        <div className="card">
          <div className="card-body">
            <div className="row" style={{ padding: "20px" }}>
              <div className="col-lg-2 col-md-6 col-12">
                {loader ? (
                  <Skeleton
                    height={260}
                    width={240}
                    style={{
                      objectFit: "cover",
                      boxSizing: "border-box",
                      borderRadius: "20px",
                    }}
                  />
                ) : (
                  <img
                    src={
                      userProfile?.image
                        ? userProfile.image
                            .replace(/\\/g, "/")
                            .includes("storage")
                          ? baseURL + userProfile.image.replace(/\\/g, "/")
                          : userProfile.image.replace(/\\/g, "/")
                        : male.src
                    }
                    className="img-fluid"
                    width={240}
                    height={260}
                    style={{
                      height: "260px",
                      width: "260px",
                      objectFit: "cover",
                      boxSizing: "border-box",
                      borderRadius: "20px",
                    }}
                    alt=""
                  />
                )}
              </div>

              <div className="col-lg-10 col-md-6 col-12">
                <div className="row">
                  {[
                    {
                      id: "name",
                      label: "Name",
                      value: userProfile?.name || "-",
                    },
                    {
                      id: "uniqueId",
                      label: "Unique Id",
                      value: userProfile?.uniqueId || "-",
                    },
                    // {
                    //   id: "gender",
                    //   label: "Gender",
                    //   value: userProfile?.gender || "-",
                    // },
                    // {
                    //   id: "age",
                    //   label: "Age",
                    //   value:
                    //     userProfile?.age > 0 && userProfile?.age !== ""
                    //       ? userProfile?.age
                    //       : "-",
                    // },
                    {
                      id: "emailId",
                      label: "Email Id",
                      value: userProfile?.email || "-",
                    },
                    {
                      id: "Country",
                      label: "Country",
                      value: userProfile?.country || "-",
                    },
                    {
                      id: "isOnline",
                      label: "Is Online",
                      value: userProfile?.isOnline ? "Yes" : "No",
                    },
                    {
                      id: "Coin",
                      label: "Coin",
                      value: userProfile?.coin || 0,
                    },
                    {
                      id: "Recharge Coin",
                      label: "Recharge Coin",
                      value: userProfile?.rechargedCoins || 0,
                    },
                    {
                      id: "spendCoins",
                      label: "Spend Coins",
                      value: userProfile?.spentCoins || 0,
                    },
                    {
                      id: "Self Intro",
                      label: "Self Intro",
                      value: userProfile?.selfIntro || "-",
                    },
                  ].map((field, index) => (
                    <div className="col-md-4" key={index}>
                      {loader ? (
                        <div className="my-3">
                          <Skeleton
                            height={40}
                            width="100%"
                            style={{ borderRadius: 10 }}
                          />
                        </div>
                      ) : (
                        <ExInput
                          id={field.id}
                          name={field.id}
                          value={field.value}
                          label={field.label}
                          placeholder={field.label}
                          readOnly
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="row">
                  <div className="col-12">
                    {loader ? (
                      <div className="my-3">
                        <Skeleton
                          height={150}
                          width="100%"
                          style={{ borderRadius: 10 }}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="inputData number flex-row justify-content-start text-start">
                          <label>Bio</label>
                        </div>
                        <Textarea
                          row={5}
                          value={
                            userProfile?.bio !== "" ? userProfile?.bio : ""
                          }
                          readOnly
                        />
                      </>
                    )}
                  </div>

                  {userProfile?.identityProof?.some(
                    (url: string) => url.trim() !== ""
                  ) && (
                    <div className="col-12 inputData">
                      <label>Identity Proof</label>
                      <br />
                      {userProfile.identityProof
                        .filter((url: string) => url.trim() !== "")
                        .map((url: string, index: number) => (
                          <div className="mt-2" key={index}>
                            <img
                              src={baseURL + url}
                              style={{
                                height: "70px",
                                width: "70px",
                                overflow: "hidden",
                                borderRadius: "10px",
                              }}
                              alt="Identity Proof"
                              className="cursor-pointer"
                              height={70}
                              width={70}
                            />
                          </div>
                        ))}
                    </div>
                  )}

                  {userProfile?.photoGallery?.length > 0 && (
                    <div className="container inputData">
                      <label>Host Upload Image</label>
                      <div className="d-flex flex-wrap gap-3">
                        {userProfile.photoGallery.map(
                          (url: string, index: number) => (
                            <img
                              key={index}
                              src={
                                userProfile?.image ? baseURL + url : male.src
                              }
                              className="img-fluid"
                              width={240}
                              height={260}
                              style={{
                                height: "151px",
                                width: "140px",
                                objectFit: "cover",
                                boxSizing: "border-box",
                                borderRadius: "20px",
                                flexShrink: 0,
                              }}
                              alt=""
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SkeletonTheme>
    </>
  );
};
UserInfo.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default UserInfo;
