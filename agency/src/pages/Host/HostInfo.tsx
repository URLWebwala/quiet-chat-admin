import React, { useEffect, useState } from "react";
import RootLayout from "../../component/layout/Layout";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { ExInput, Textarea } from "@/extra/Input";
import { useSelector } from "react-redux";
import { isLoading } from "@/utils/allSelector";
import { useRouter } from "next/router";
import { baseURL } from "@/utils/config";
import male from "@/assets/images/male.png"
import Image from "next/image";
import { formatCoins, getImageUrl } from "@/utils/Common";

interface RootStore {
    setting: any;
    user: {
        userProfile: any;
        userWalletHistory: any;
        user: any;
    };
}

const HostInfo = (props: any) => {
    const { type1 } = props;
    const userData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("userData") || "null") : null;
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const loader = useSelector(isLoading);
    const router = useRouter();
    const id: any = router?.query?.id;
    const [isClient, setIsClient] = useState(false);
    const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    let hostData = null;

    if (typeof window !== "undefined") {
        const data = localStorage.getItem("hostData");
        hostData = data ? JSON.parse(data) : null;
    }



    const updatedImagePath = hostData?.image?.replace(/\\/g, "/");

    useEffect(() => {
        const iframeData = document.getElementById("iframeId");

        if (iframeData) {
            // iframeData.src = `https://maps.google.com/maps?q=${doctorProfile?.locationCoordinates?.latitude},${doctorProfile?.locationCoordinates?.longitude}&hl=es;&output=embed`;
        }
        setIsClient(true);

    }, []);

    if (!isClient) return null; // ⛔️ Prevent mismatched content on server


   


    return (
        <>
            <div className="p-3">
                {hostData?.name && (
                     <div
                     className="title text-capitalized text"
                     style={{ color: "#404040", fontSize: "20px" }}
                   >
                     {`${hostData.name}'s   Profile`}
                   </div>
                )}
                <div className="card">
                    <div className="card-body">
                        <div className="row"
                            style={{ padding: "20px" }}
                        >
                            <div className={`${type1 === "fakeHost" ? 'col-lg-2' : 'col-lg-2 col-md-6 col-12'}`}>

                                {loader === true ? (
                                    <>
                                        <SkeletonTheme baseColor="#e2e5e7" highlightColor="#fff">
                                            <p className="d-flex justify-content-center ">
                                                <Skeleton
                                                    height={380}
                                                    width={380}
                                                    style={{
                                                        height: "380px",
                                                        width: "380px",
                                                        objectFit: "cover",
                                                        boxSizing: "border-box",
                                                        borderRadius: "30px",
                                                    }}
                                                />
                                            </p>
                                        </SkeletonTheme>
                                    </>
                                ) : (
                                    <img
                                        src={hostData?.image ? baseURL + updatedImagePath : male.src}
                                        className="img-fluid"
                                        width={240}
                                        height={260}
                                        style={{
                                            width: "260px",
                                            height: "260px",

                                            objectFit: "cover",
                                            boxSizing: "border-box",
                                            borderRadius: "20px",
                                        }}
                                        alt=""
                                    />
                                )}
                            </div>
                           
                            <div className={`col-lg-10 col-xl-10 col-md-6 col-lg-8 col-12`}>
                                <div className="row">   
                                    <div className={`col-lg-6 col-xl-4 col-md-12`}>
                                        {loader === true ? (
                                            <>
                                                <SkeletonTheme
                                                    baseColor="#e2e5e7"
                                                    highlightColor="#fff"
                                                >
                                                    <p className="d-flex justify-content-center my-3">
                                                        <Skeleton
                                                            height={40}
                                                            width={250}
                                                            style={{
                                                                borderRadius: "10px",
                                                            }}
                                                        />
                                                    </p>
                                                </SkeletonTheme>
                                            </>
                                        ) : (
                                            <ExInput
                                                id={`name`}
                                                name={`name`}
                                                value={hostData?.name || "-"}
                                                label={`Name`}
                                                placeholder={`Name`}
                                                readOnly
                                            />
                                        )}
                                    </div>

                                    <div className={`col-lg-6 col-xl-4 col-md-12`}>
                                        {loader === true ? (
                                            <>
                                                <SkeletonTheme
                                                    baseColor="#e2e5e7"
                                                    highlightColor="#fff"
                                                >
                                                    <p className="d-flex justify-content-center my-3">
                                                        <Skeleton
                                                            height={40}
                                                            width={250}
                                                            style={{
                                                                borderRadius: "10px",
                                                            }}
                                                        />
                                                    </p>
                                                </SkeletonTheme>
                                            </>
                                        ) : (
                                            <ExInput
                                                id={`uniqueId`}
                                                name={`uniqueId`}
                                                value={
                                                    hostData?.uniqueId ? hostData?.uniqueId : ""
                                                }
                                                label={`unique Id`}
                                                placeholder={`UniqueId`}
                                                readOnly
                                            />
                                        )}
                                    </div>

                                    <div className={`col-lg-6 col-xl-4 col-md-12`}>
                                        {loader === true ? (
                                            <>
                                                <SkeletonTheme
                                                    baseColor="#e2e5e7"
                                                    highlightColor="#fff"
                                                >
                                                    <p className="d-flex justify-content-center my-3">
                                                        <Skeleton
                                                            height={40}
                                                            width={250}
                                                            style={{
                                                                borderRadius: "10px",
                                                            }}
                                                        />
                                                    </p>
                                                </SkeletonTheme>
                                            </>
                                        ) : (
                                            <ExInput
                                                id={`gender`}
                                                name={`gender`}
                                                value={hostData?.gender || "-"}
                                                label={`Gender`}
                                                placeholder={`Gender`}
                                                readOnly
                                            />
                                        )}
                                    </div>

                                    <div className={`col-lg-6 col-xl-4 col-md-12`}>
                                        {loader === true ? (
                                            <>
                                                <SkeletonTheme
                                                    baseColor="#e2e5e7"
                                                    highlightColor="#fff"
                                                >
                                                    <p className="d-flex justify-content-center my-3">
                                                        <Skeleton
                                                            height={40}
                                                            width={250}
                                                            style={{
                                                                borderRadius: "10px",
                                                            }}
                                                        />
                                                    </p>
                                                </SkeletonTheme>
                                            </>
                                        ) : (
                                            <ExInput
                                                id={`email`}
                                                name={`email`}
                                                value={hostData?.email || "-"}
                                                label={`Email`}
                                                placeholder={`Email`}
                                                readOnly
                                            />
                                        )}
                                    </div>

                                    <div className={`col-lg-6 col-xl-4 col-md-12`}>
                                        {loader === true ? (
                                            <>
                                                <SkeletonTheme
                                                    baseColor="#e2e5e7"
                                                    highlightColor="#fff"
                                                >
                                                    <p className="d-flex justify-content-center my-3">
                                                        <Skeleton
                                                            height={40}
                                                            width={250}
                                                            style={{
                                                                borderRadius: "10px",
                                                            }}
                                                        />
                                                    </p>
                                                </SkeletonTheme>
                                            </>
                                        ) : (
                                            <ExInput
                                                id={`dob`}
                                                name={`dob`}
                                                value={hostData?.dob || "-"}
                                                label={`Dob`}
                                                placeholder={`Dob`}
                                                readOnly
                                            />
                                        )}
                                    </div>

                                    {
                                        type1 !== "fakeHost" &&
                                        <div className={`col-lg-6 col-xl-4 col-md-12`}>
                                            {loader === true ? (
                                                <>
                                                    <SkeletonTheme
                                                        baseColor="#e2e5e7"
                                                        highlightColor="#fff"
                                                    >
                                                        <p className="d-flex justify-content-center my-3">
                                                            <Skeleton
                                                                height={40}
                                                                width={250}
                                                                style={{
                                                                    borderRadius: "10px",
                                                                }}
                                                            />
                                                        </p>
                                                    </SkeletonTheme>
                                                </>
                                            ) : (
                                                <ExInput
                                                    id={`identityProofType`}
                                                    name={`identityProofType`}
                                                    value={
                                                        hostData?.identityProofType || "-"
                                                    }
                                                    label={`Identity Proof Type`}
                                                    placeholder={`Identity Proof Type`}
                                                    readOnly
                                                />
                                            )}
                                        </div>
                                    }



                                    <div className={`col-lg-6 col-xl-4 col-md-12`}>
                                        {loader === true ? (
                                            <>
                                                <SkeletonTheme
                                                    baseColor="#e2e5e7"
                                                    highlightColor="#fff"
                                                >
                                                    <p className="d-flex justify-content-center my-3">
                                                        <Skeleton
                                                            height={40}
                                                            width={250}
                                                            style={{
                                                                borderRadius: "10px",
                                                            }}
                                                        />
                                                    </p>
                                                </SkeletonTheme>
                                            </>
                                        ) : (
                                            <ExInput
                                                id={`language`}
                                                name={`language`}
                                                value={
                                                    hostData?.language || "-"
                                                }
                                                label={`Language`}
                                                placeholder={`Language`}
                                                readOnly
                                            />
                                        )}
                                    </div>

                                    {
                                        type1 !== "fakeHost" &&
                                        <div className="col-lg-6 col-xl-4 col-md-12">
                                            {loader === true ? (
                                                <>
                                                    <SkeletonTheme
                                                        baseColor="#e2e5e7"
                                                        highlightColor="#fff"
                                                    >
                                                        <p className="d-flex justify-content-center my-3">
                                                            <Skeleton
                                                                height={40}
                                                                width={250}
                                                                style={{
                                                                    borderRadius: "10px",
                                                                }}
                                                            />
                                                        </p>
                                                    </SkeletonTheme>
                                                </>
                                            ) : (
                                                <ExInput
                                                    id={`coin`}
                                                    name={`coin`}
                                                    value={
                                                        formatCoins(hostData?.coin)
                                                    }
                                                    label={`Coin`}
                                                    placeholder={`Coin`}
                                                    readOnly
                                                />
                                            )}
                                        </div>
                                    }

                                    <div className={`col-lg-6 col-xl-4 col-md-12`}>
                                        {loader === true ? (
                                            <>
                                                <SkeletonTheme
                                                    baseColor="#e2e5e7"
                                                    highlightColor="#fff"
                                                >
                                                    <p className="d-flex justify-content-center my-3">
                                                        <Skeleton
                                                            height={40}
                                                            width={250}
                                                            style={{
                                                                borderRadius: "10px",
                                                            }}
                                                        />
                                                    </p>
                                                </SkeletonTheme>
                                            </>
                                        ) : (
                                            <ExInput
                                                id={`country`}
                                                name={`country`}
                                                value={
                                                    hostData?.country?.toUpperCase() || "-"
                                                }
                                                label={`Country`}
                                                placeholder={`Country`}
                                                readOnly
                                            />
                                        )}
                                    </div>
                                    {
                                        type1 !== "fakeHost" &&

                                        <>
                                            <div className="col-lg-6 col-xl-4 col-md-12">
                                                {loader === true ? (
                                                    <>
                                                        <SkeletonTheme
                                                            baseColor="#e2e5e7"
                                                            highlightColor="#fff"
                                                        >
                                                            <p className="d-flex justify-content-center my-3">
                                                                <Skeleton
                                                                    height={40}
                                                                    width={250}
                                                                    style={{
                                                                        borderRadius: "10px",
                                                                    }}
                                                                />
                                                            </p>
                                                        </SkeletonTheme>
                                                    </>
                                                ) : (
                                                    <ExInput
                                                        id={`isOnline`}
                                                        name={`Is Online`}
                                                        value={
                                                            hostData?.isOnline ? "Yes" : "No"
                                                        }
                                                        label={`Is Online`}
                                                        placeholder={`Is Online`}
                                                        readOnly
                                                    />
                                                )}
                                            </div>

                                            <div className="col-lg-6 col-xl-4 col-md-12">
                                                {loader === true ? (
                                                    <>
                                                        <SkeletonTheme
                                                            baseColor="#e2e5e7"
                                                            highlightColor="#fff"
                                                        >
                                                            <p className="d-flex justify-content-center my-3">
                                                                <Skeleton
                                                                    height={40}
                                                                    width={250}
                                                                    style={{
                                                                        borderRadius: "10px",
                                                                    }}
                                                                />
                                                            </p>
                                                        </SkeletonTheme>
                                                    </>
                                                ) : (
                                                    <ExInput
                                                        id={`is Busy`}
                                                        name={`is Busy`}
                                                        value={
                                                            hostData?.isBusy ? "Yes" : "No"
                                                        }
                                                        label={`Is Busy`}
                                                        placeholder={`Is Busy`}
                                                        readOnly
                                                    />
                                                )}
                                            </div>

                                            <div className="col-lg-6 col-xl-4 col-md-12">
                                                {loader === true ? (
                                                    <>
                                                        <SkeletonTheme
                                                            baseColor="#e2e5e7"
                                                            highlightColor="#fff"
                                                        >
                                                            <p className="d-flex justify-content-center my-3">
                                                                <Skeleton
                                                                    height={40}
                                                                    width={250}
                                                                    style={{
                                                                        borderRadius: "10px",
                                                                    }}
                                                                />
                                                            </p>
                                                        </SkeletonTheme>
                                                    </>
                                                ) : (
                                                    <ExInput
                                                        id={`is Live`}
                                                        name={`is Live`}
                                                        value={
                                                            hostData?.isLive ? "Yes" : "No"
                                                        }
                                                        label={`Is Live`}
                                                        placeholder={`Is Live`}
                                                        readOnly
                                                    />
                                                )}
                                            </div>


                                            <div className="col-lg-6 col-xl-4 col-md-12">
                                                {loader === true ? (
                                                    <>
                                                        <SkeletonTheme
                                                            baseColor="#e2e5e7"
                                                            highlightColor="#fff"
                                                        >
                                                            <p className="d-flex justify-content-center my-3">
                                                                <Skeleton
                                                                    height={40}
                                                                    width={250}
                                                                    style={{
                                                                        borderRadius: "10px",
                                                                    }}
                                                                />
                                                            </p>
                                                        </SkeletonTheme>
                                                    </>
                                                ) : (
                                                    <ExInput
                                                        id={`is Block`}
                                                        name={`is Block`}
                                                        value={
                                                            hostData?.isBlock ? "Yes" : "No"
                                                        }
                                                        label={`Is Block`}
                                                        placeholder={`Is Block`}
                                                        readOnly
                                                    />
                                                )}
                                            </div>

                                            <div className="col-lg-6 col-xl-4 col-md-12">
                                                {loader === true ? (
                                                    <>
                                                        <SkeletonTheme
                                                            baseColor="#e2e5e7"
                                                            highlightColor="#fff"
                                                        >
                                                            <p className="d-flex justify-content-center my-3">
                                                                <Skeleton
                                                                    height={40}
                                                                    width={250}
                                                                    style={{
                                                                        borderRadius: "10px",
                                                                    }}
                                                                />
                                                            </p>
                                                        </SkeletonTheme>
                                                    </>
                                                ) : (
                                                    <ExInput
                                                        id={`privateCallRate`}
                                                        name={`privateCallRate`}
                                                        value={
                                                            hostData?.privateCallRate
                                                        }
                                                        label={`Private Call Rate`}
                                                        placeholder={`Private Call Rate`}
                                                        readOnly
                                                    />
                                                )}
                                            </div>

                                            <div className="col-lg-6 col-xl-4 col-md-12">
                                                {loader === true ? (
                                                    <>
                                                        <SkeletonTheme
                                                            baseColor="#e2e5e7"
                                                            highlightColor="#fff"
                                                        >
                                                            <p className="d-flex justify-content-center my-3">
                                                                <Skeleton
                                                                    height={40}
                                                                    width={250}
                                                                    style={{
                                                                        borderRadius: "10px",
                                                                    }}
                                                                />
                                                            </p>
                                                        </SkeletonTheme>
                                                    </>
                                                ) : (
                                                    <ExInput
                                                        id={`radnomCallFemaleRate`}
                                                        name={`radnomCallFemaleRate`}
                                                        value={
                                                            hostData?.randomCallFemaleRate
                                                        }
                                                        label={`Random Call Female Rate`}
                                                        placeholder={`Private Call Female Rate`}
                                                        readOnly
                                                    />
                                                )}
                                            </div>

                                            <div className="col-lg-6 col-xl-4 col-md-12">
                                                {loader === true ? (
                                                    <>
                                                        <SkeletonTheme
                                                            baseColor="#e2e5e7"
                                                            highlightColor="#fff"
                                                        >
                                                            <p className="d-flex justify-content-center my-3">
                                                                <Skeleton
                                                                    height={40}
                                                                    width={250}
                                                                    style={{
                                                                        borderRadius: "10px",
                                                                    }}
                                                                />
                                                            </p>
                                                        </SkeletonTheme>
                                                    </>
                                                ) : (
                                                    <ExInput
                                                        id={`radnomCallmaleRate`}
                                                        name={`radnomCallmaleRate`}
                                                        value={
                                                            hostData?.randomCallMaleRate
                                                        }
                                                        label={`Random Call Male Rate`}
                                                        placeholder={`Random Call Male Rate`}
                                                        readOnly
                                                    />
                                                )}
                                            </div>

                                            <div className="col-lg-6 col-xl-4 col-md-12">
                                                {loader === true ? (
                                                    <>
                                                        <SkeletonTheme
                                                            baseColor="#e2e5e7"
                                                            highlightColor="#fff"
                                                        >
                                                            <p className="d-flex justify-content-center my-3">
                                                                <Skeleton
                                                                    height={40}
                                                                    width={250}
                                                                    style={{
                                                                        borderRadius: "10px",
                                                                    }}
                                                                />
                                                            </p>
                                                        </SkeletonTheme>
                                                    </>
                                                ) : (
                                                    <ExInput
                                                        id={`randomCallRate`}
                                                        name={`randomCallRate`}
                                                        value={
                                                            hostData?.randomCallRate
                                                        }
                                                        label={`Random Call  Rate`}
                                                        placeholder={`Random Call  Rate`}
                                                        readOnly
                                                    />
                                                )}
                                            </div>

                                            <div className="col-lg-6 col-xl-4 col-md-12">
                                                {loader === true ? (
                                                    <>
                                                        <SkeletonTheme
                                                            baseColor="#e2e5e7"
                                                            highlightColor="#fff"
                                                        >
                                                            <p className="d-flex justify-content-center my-3">
                                                                <Skeleton
                                                                    height={40}
                                                                    width={250}
                                                                    style={{
                                                                        borderRadius: "10px",
                                                                    }}
                                                                />
                                                            </p>
                                                        </SkeletonTheme>
                                                    </>
                                                ) : (
                                                    <ExInput
                                                        id={`audioCallRate`}
                                                        name={`audioCallRate`}
                                                        value={
                                                            hostData?.audioCallRate
                                                        }
                                                        label={`Audio Call  Rate`}
                                                        placeholder={`Audio Call  Rate`}
                                                        readOnly
                                                    />
                                                )}
                                            </div>

                                            <div className="col-lg-6 col-xl-4 col-md-12">
                                                {loader === true ? (
                                                    <>
                                                        <SkeletonTheme
                                                            baseColor="#e2e5e7"
                                                            highlightColor="#fff"
                                                        >
                                                            <p className="d-flex justify-content-center my-3">
                                                                <Skeleton
                                                                    height={40}
                                                                    width={250}
                                                                    style={{
                                                                        borderRadius: "10px",
                                                                    }}
                                                                />
                                                            </p>
                                                        </SkeletonTheme>
                                                    </>
                                                ) : (
                                                    <ExInput
                                                        id={`chatRate`}
                                                        name={`chatRate`}
                                                        value={
                                                            hostData?.chatRate
                                                        }
                                                        label={`Chat  Rate`}
                                                        placeholder={`Chat  Rate`}
                                                        readOnly
                                                    />
                                                )}
                                            </div>

                                            <div className="col-lg-6 col-xl-4 col-md-12">
                                                {loader === true ? (
                                                    <>
                                                        <SkeletonTheme
                                                            baseColor="#e2e5e7"
                                                            highlightColor="#fff"
                                                        >
                                                            <p className="d-flex justify-content-center my-3">
                                                                <Skeleton
                                                                    height={40}
                                                                    width={250}
                                                                    style={{
                                                                        borderRadius: "10px",
                                                                    }}
                                                                />
                                                            </p>
                                                        </SkeletonTheme>
                                                    </>
                                                ) : (
                                                    <ExInput
                                                        id={`totalGifts`}
                                                        name={`totalGifts`}
                                                        value={
                                                            hostData?.totalGifts
                                                        }
                                                        label={`Total Gifts`}
                                                        placeholder={`Total Gifts`}
                                                        readOnly
                                                    />
                                                )}
                                            </div>
                                        </>
                                    }


                                </div>


                                <div className="row">

                                    {/* <div className="col-sm-12 col-lg-6">
                                        {loader === true ? (
                                            <>
                                                <SkeletonTheme
                                                    baseColor="#e2e5e7"
                                                    highlightColor="#fff"
                                                >
                                                    <p className="d-flex justify-content-center my-3">
                                                        <Skeleton
                                                            height={150}
                                                            width={850}
                                                            style={{
                                                                borderRadius: "10px",
                                                            }}
                                                        />
                                                    </p>
                                                </SkeletonTheme>
                                            </>
                                        ) : (
                                            <>
                                                <div className="inputData number  flex-row justify-content-start text-start">
                                                    <label>Bio</label>
                                                </div>
                                                <Textarea
                                                    row={5}
                                                    value={
                                                        hostData?.bio !== "" ? hostData?.bio : "-"
                                                    }
                                                    readOnly
                                                />
                                            </>
                                        )}
                                    </div> */}

                                    <div className="col-sm-12 col-lg-12">
                                        {loader === true ? (
                                            <>
                                                <SkeletonTheme
                                                    baseColor="#e2e5e7"
                                                    highlightColor="#fff"
                                                >
                                                    <p className="d-flex justify-content-center my-3">
                                                        <Skeleton
                                                            height={150}
                                                            width={850}
                                                            style={{
                                                                borderRadius: "10px",
                                                            }}
                                                        />
                                                    </p>
                                                </SkeletonTheme>
                                            </>
                                        ) : (
                                            <>
                                                <div className="inputData number  flex-row justify-content-start text-start">
                                                    <label>Impression</label>
                                                </div>
                                                <Textarea
                                                    row={5}
                                                    value={
                                                        hostData?.impression?.[0] !== "" ? hostData?.impression?.[0] : "-"
                                                    }
                                                    readOnly
                                                />
                                            </>
                                        )}
                                    </div>
                                    {
                                        type1 === "fakeHost" &&
                                        <div className="inputData col-6 mt-4">
                                            <label className="d-block">Video</label>
                                            <br></br>
                                            <video
                                                controls
                                                style={{ width: "200px", height: "200px" }}
                                                src={baseURL + hostData?.video}
                                            />
                                        </div>
                                    }


                                    <div className="container inputData ">
                                        {type1 !== "fakeHost" && (
                      <>
                        <div className="inputData mt-4">
                          <label>Identity Proof</label>
                        </div>

                        <div className="d-flex gap-3 flex-wrap">
                          {hostData?.identityProof
                            ?.filter((url: string) => url)
                            .map((url: string, index: number) => (
                              <img
                                key={index}
                                src={getImageUrl(url)}
                                style={{
                                  height: "200px",
                                  width: "200px",
                                  borderRadius: "10px",
                                  objectFit: "cover",
                                  cursor: "pointer",
                                }}
                                alt="identity-proof"
                                onClick={() => {
                                  setSelectedImage(baseURL + url);
                                  setSelectedVideo(null);
                                  setShowModal(true);
                                }}
                              />
                            ))}
                        </div>
                      </>
                    )}

                    {type1 !== "fakeHost" &&
                      hostData?.profileVideo?.length > 0 && (
                        <div className="inputData mt-4">
                          <label className="d-block">Profile Video</label>

                          <div className="d-flex gap-3 flex-wrap mt-2">
                            {hostData.profileVideo.map(
                              (item: any, index: number) => {
                                const finalUrl =
                                  typeof item === "string" ? item : item?.url;

                                return (
                                  <video
                                    key={index}
                                    src={baseURL + item}
                                    controls
                                    style={{
                                      width: "200px",
                                      height: "200px",
                                      borderRadius: "10px",
                                      cursor: "pointer",
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedVideo(baseURL + item);
                                      setSelectedImage(null);
                                      setShowModal(true);
                                    }}
                                  />
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                                        <label>{hostData?.photoGallery?.length > 0 && "Host Upload Image"}</label>
                                        <div className="d-flex flex-wrap gap-3">
                                            {hostData?.photoGallery?.length > 0 &&
                                                hostData.photoGallery.map((item: any, index: number) => {
                                                    const finalUrl = typeof item === "string" ? item : item?.url;
                                                    return (
                                                        <img
                                                            key={index}
                                                            src={finalUrl ? baseURL + finalUrl : male.src}
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
                                                            onClick={() => {
                                  setSelectedImage(baseURL + finalUrl);
                                  setSelectedVideo(null);
                                  setShowModal(true);
                                }}
                                                        />
                                                    );
                                                })}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
             {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={() => setShowModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-body text-center">
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt="Preview"
                    style={{ width: "100%", height: "100%", objectFit : 'contain' }}
                  />
                )}

                {selectedVideo && (
                  <video
                    src={selectedVideo}
                    controls
                    style={{ width: "100%", height: "100%", objectFit : 'contain' }}
                  />
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
    );
};
HostInfo.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};

export default HostInfo;
