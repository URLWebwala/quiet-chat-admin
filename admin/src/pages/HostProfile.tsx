import React, { useEffect, useState } from "react";
import RootLayout from "../component/layout/Layout";
import Title from "@/extra/Title";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { ExInput, Textarea } from "@/extra/Input";
import { useSelector } from "react-redux";
import { isLoading } from "@/utils/allSelector";
import { useAppDispatch } from "@/store/store";
import { useRouter } from "next/router";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import Analytics from "@/extra/Analytic";
import { baseURL } from "@/utils/config";
import male from "@/assets/images/male.png"
import Image from "next/image";

interface RootStore {
  setting: any;
  user: {
    userProfile: any;
    userWalletHistory: any;
    user: any;
  };
}

const HostProfile = () => {
  // const { userProfile, user } = useSelector((state: RootStore) => state.user);
  const hostData = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("hostData") || "null") : null;
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const loader = useSelector(isLoading);
  const router = useRouter();
  const id: any = router?.query?.id;

  const [type, setType] = useState<string>("wallet_history");
  const [data, setData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("ALL");
  const [endDate, setEndDate] = useState("ALL");
  const { setting } = useSelector((state: RootStore) => state.setting);
  // const { userWalletHistory } = useSelector((state: RootStore) => state.user);
  const [status, setStatus] = useState<any>("ALL");
  const [isClient, setIsClient] = useState(false);
  const updatedImagePath = hostData?.image?.replace(/\\/g, "/");
  const dispatch = useAppDispatch();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    const payload: any = {
      startDate,
      endDate,
      status,
      id,
    };
    // dispatch(getUserProfile(id));
    // dispatch(getUserWalletHistory(payload));
  }, [dispatch, id, startDate, endDate, status]);

  const bookingType = [
    { name: "ALL", value: "ALL" },
    { name: "Credit", value: 1 },
    { name: "Debit", value: 2 },
  ];

  useEffect(() => {
    const iframeData = document.getElementById("iframeId");

    if (iframeData) {
      // iframeData.src = `https://maps.google.com/maps?q=${doctorProfile?.locationCoordinates?.latitude},${doctorProfile?.locationCoordinates?.longitude}&hl=es;&output=embed`;
    }
    setIsClient(true);
  }, []);
  if (!isClient) return null; // ⛔️ Prevent mismatched content on server

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(0);
  };

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

const handleVideoClick = (
    e: React.MouseEvent<HTMLVideoElement>,
    url: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const video = e.currentTarget;

    // stop background video immediately
    video.pause();
    video.currentTime = 0;

    setSelectedImage(null);
    setSelectedVideo(url);
  };

  return (
    <>
      <div className="p-3">
        <Title
          name={`${hostData?.name ? hostData?.name : " "}'s   Profile`}
        />
        {/* <div className="card card-no-border"> */}
        <div className="card">
          <div className="card-body">
            <div className="row"
              style={{ padding: "20px" }}
            >
              <div className="col-lg-2  col-md-6 col-12">
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
                  <div className="col-md-4">
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
                        value={hostData?.name}
                        label={`Name`}
                        placeholder={`Name`}
                        readOnly
                      />
                    )}
                  </div>

                  <div className="col-md-4">
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

                  <div className="col-md-4">
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
                        value={hostData?.gender}
                        label={`Gender`}
                        placeholder={`Gender`}
                        readOnly
                      />
                    )}
                  </div>
                  <div className="col-md-4">
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
                        id={`age`}
                        name={`age`}
                        value={
                          hostData?.age > 0 && hostData?.age !== ""
                            ? hostData?.age
                            : "-"
                        }
                        label={`Age`}
                        placeholder={`Age`}
                        readOnly
                      />
                    )}
                  </div>

                  <div className="col-md-4">
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
                        id={`emailId`}
                        name={`emailId`}
                        value={hostData?.email || "-"}
                        label={`Email`}
                        placeholder={`Email`}
                        readOnly
                      />
                    )}
                  </div>

                  <div className="col-md-4">
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
                        id={`Country`}
                        name={`Country`}
                        value={
                          hostData?.country
                        }
                        label={`Country`}
                        placeholder={`Country`}
                        readOnly
                      />
                    )}
                  </div>

                  <div className="col-md-4">
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
                        id={`Dob`}
                        name={`Dob`}
                        value={
                          hostData?.dob
                        }
                        label={`Dob`}
                        placeholder={`Dob`}
                        readOnly
                      />
                    )}
                  </div>

                  <div className="col-md-4">
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
                        id={`Language`}
                        name={`Language`}
                        value={

                          hostData?.language?.join(",") || "-"
                        }
                        label={`Language`}
                        placeholder={`Language`}
                        readOnly
                      />
                    )}
                  </div>

                  

                </div>
                <div className="row">
                  <div className="col-12">
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
                          value={Array.isArray(hostData?.impression) ? hostData.impression.join(", ") : ""}
                          readOnly
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="row">
                  <div className="col-12">
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
                  </div>

                  {hostData?.identityProof?.some((url: string) => url.trim() !== "") && (
                    <div className="col-12 inputData">

                      <div className="col-md-4">
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
                        id={`documentType`}
                        name={`documentType`}
                        value={
                          hostData?.identityProofType || "-"
                        }
                        label={`Identity Proof Type`}
                        placeholder={`Identity Proof Type`}
                        readOnly
                      />
                    )}
                  </div>
                    
                  <label>Identity Proof</label>
                      <br />
                      <div className="d-flex gap-4">
                        {hostData.identityProof
                          .filter((url: string) => url.trim() !== "")
                          .map((url: string, index: number) => (
                            <div className="mt-2" key={index}>
                              <img
                                src={baseURL + url}
                                style={{
                                  height: "200px",
                                  width: "200px",
                                  overflow: "hidden",
                                  borderRadius: "10px",
                                }}
                                alt="salon"
                                className="cursor-pointer"
                                height={200}
                                width={200}
                                onClick={() => setSelectedImage(baseURL + url)}
                              />
                            </div>


                          ))}
                      </div>
                    </div>
                  )}

                  <div className="container inputData">
                    <label>{hostData?.photoGallery?.length > 0 && "Host Album"}</label>

                    {hostData?.photoGallery?.length > 0 && (
                      <div className="d-flex flex-wrap gap-3">
                        {hostData.photoGallery.map((url: string, index: number) => (
                          <div key={index}>
                            <img
                              src={hostData?.image ? baseURL + url : male.src}
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
                               onClick={() =>
                                  setSelectedImage(
                                    hostData?.image ? baseURL + url : `/images/male.png`
                                  )
                                }
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="container inputData">
                    <label>
                      {hostData?.profileVideo?.length > 0 && "Host Videos"}
                    </label>

                    {hostData?.profileVideo?.length > 0 && (
                      <div className="d-flex flex-wrap gap-3">
                        {hostData.profileVideo.map(
                          (url: string, index: number) => (
                            <div key={index}>
                              <video
                                src={baseURL + url}
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
                                  cursor: "pointer"
                                }}
                                controls
                                onClick={(e) =>
                                  handleVideoClick(e, baseURL + url)
                                }
                              />
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedImage && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={() => setSelectedImage(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-body text-center">
                <img
                  src={selectedImage}
                  alt="Full Screen"
                  className="img-fluid"
                  style={{ height: "100%", width: "100%", objectFit:'contain' }}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedImage(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {selectedVideo && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={() => setSelectedVideo(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-body text-center">
                <video
                  src={selectedVideo}
                  controls
                  className="img-fluid"
                  style={{ height: "100%", width: "100%", objectFit: 'contain' }}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedVideo(null)}
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
HostProfile.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default HostProfile;
