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

function loginTypeLabel(t: number | string | undefined) {
  if (t === undefined || t === null || t === "") return "-";
  switch (Number(t)) {
    case 1:
      return "Apple";
    case 2:
      return "Google";
    case 3:
      return "Quick / Guest";
    case 4:
      return "Phone (OTP)";
    default:
      return String(t);
  }
}

function formatDob(d: string | undefined) {
  if (!d || d === "-") return "-";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

function formatGender(g: string | undefined) {
  if (!g) return "-";
  return g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();
}

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
  const id: any = router?.query?.id || router?.query?.UserId;

  useEffect(() => {
    if (!router.isReady || !userData?._id) return;

    if (id) {
      dispatch(getUserProfile(id));
    } else {
      // If no ID in query, fallback to current user
      dispatch(getUserProfile(userData._id));
    }
  }, [dispatch, id, userData?._id, router.isReady]);

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
                    {
                      id: "phone",
                      label: "Mobile",
                      value: userProfile?.phone || "-",
                    },
                    {
                      id: "dob",
                      label: "Date of birth",
                      value: formatDob(userProfile?.dob),
                    },
                    {
                      id: "gender",
                      label: "Gender",
                      value: formatGender(userProfile?.gender),
                    },
                    {
                      id: "age",
                      label: "Age",
                      value:
                        userProfile?.age > 0 && userProfile?.age !== ""
                          ? String(userProfile?.age)
                          : "-",
                    },
                    {
                      id: "loginType",
                      label: "Login type",
                      value: loginTypeLabel(userProfile?.loginType),
                    },
                    {
                      id: "profileComplete",
                      label: "Profile complete",
                      value:
                        userProfile?.profileComplete === true
                          ? "Yes"
                          : userProfile?.profileComplete === false
                            ? "No"
                            : "-",
                    },
                    {
                      id: "missingProfileFields",
                      label: "Missing profile fields",
                      value:
                        Array.isArray(userProfile?.missingProfileFields) &&
                        userProfile.missingProfileFields.length > 0
                          ? userProfile.missingProfileFields.join(", ")
                          : "-",
                    },
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
