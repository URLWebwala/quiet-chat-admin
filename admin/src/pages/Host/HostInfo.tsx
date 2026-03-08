import React, { useEffect, useState } from "react";
import RootLayout from "../../component/layout/Layout";
import Title from "@/extra/Title";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { ExInput, Textarea } from "@/extra/Input";
import { useDispatch, useSelector } from "react-redux";
import { isLoading } from "@/utils/allSelector";
import { useRouter } from "next/router";
import { baseURL } from "@/utils/config";
import male from "@/assets/images/male.png";
import Image from "next/image";
import { getHostProfile } from "@/store/hostSlice";
import ReactSelect from "react-select";
import countriesData from "@/api/countries.json";
import { formatCoins } from "@/utils/Common";

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
  const { userProfile, user } = useSelector((state: RootStore) => state.user);
  const { hostProfile } = useSelector((state: any) => state.host);
  const hostInfoData =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("hostData") || "null")
      : null;
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [countryOptions, setCountryOptions] = useState<any[]>([]); // All countries
  const [selectedCountry, setSelectedCountry] = useState<any>(null); // Selected country
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const loader = useSelector(isLoading);
  const router = useRouter();
  const id: any = router?.query?.id;
  const [isClient, setIsClient] = useState(false);
  const dispatch = useDispatch();
  let hostData = null;

  if (typeof window !== "undefined") {
    const data = localStorage.getItem("hostData");
    hostData = data ? JSON.parse(data) : null;
  }

  const updatedImagePath = hostData?.image?.replace(/\\/g, "/");

  useEffect(() => {
    dispatch(getHostProfile(id || hostInfoData?._id));
  }, []);

  useEffect(() => {
    const iframeData = document.getElementById("iframeId");

    if (iframeData) {
      // iframeData.src = `https://maps.google.com/maps?q=${doctorProfile?.locationCoordinates?.latitude},${doctorProfile?.locationCoordinates?.longitude}&hl=es;&output=embed`;
    }
    setIsClient(true);
  }, []);

  useEffect(() => {
    const processCountries = () => {
      try {
        // Transform countries to React Select format
        const transformedCountries = countriesData
          .filter(
            (country) =>
              country.name?.common && country.cca2 && country.flags?.png
          )
          .map((country) => ({
            value: country.cca2, // Required by React Select
            label: country.name.common, // Required by React Select
            name: country.name.common,
            code: country.cca2,
            flagUrl: country.flags.png || country.flags.svg,
            flag: country.flags.png || country.flags.svg, // For compatibility
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setCountryOptions(transformedCountries);

        // Set default or existing country
        if (hostProfile?.country) {
          const existingCountry = transformedCountries.find(
            (c: any) =>
              c.name.toLowerCase() === hostProfile.country.toLowerCase()
          );
          setSelectedCountry(existingCountry || null);
        } else {
          // Set India as default
          const defaultCountry = transformedCountries.find(
            (c: any) => c.name === "India"
          );
          setSelectedCountry(defaultCountry || transformedCountries[0] || null);
        }
      } catch (error) {
        console.error("Failed to process countries:", error);
      }
    };

    processCountries();
  }, [hostProfile]);

  if (!isClient) return null; // ⛔️ Prevent mismatched content on server

  const CustomOption = ({ innerRef, innerProps, data }: any) => (
    <div
      ref={innerRef}
      {...innerProps}
      className="optionShow-option p-2 d-flex align-items-center"
    >
      <img
        height={24}
        width={32}
        alt={data.name}
        src={data.flagUrl}
        className="me-2"
        style={{ objectFit: "cover" }}
      />
      <span>{data.label}</span>
    </div>
  );

const handleVideoClick = (
    e: React.MouseEvent<HTMLVideoElement>,
    url: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const video = e.currentTarget;

    // Stop background video from playing
    video.pause();
    video.currentTime = 0;

    setSelectedImage(null);
    setSelectedVideo(url);
    setShowModal(true);
  };

  return (
    <>
      <div className="p-3">
        {hostProfile?.name && (
          <Title name={`${hostProfile.name}'s   Profile`} />
        )}
        {/* <div className="card card-no-border"> */}
        <div className="card">
          <div className="card-body">
            <div className="row" style={{ padding: "20px" }}>
              <div
                className={`${type1 === "fakeHost" ? "col-lg-2" : "col-lg-2 col-md-6 col-12"
                  }`}
              >
                {loader === true ? (
                  <>
                    <SkeletonTheme baseColor="#e2e5e7" highlightColor="#fff">
                      <p className="d-flex justify-content-center ">
                        <Skeleton
                          height={260}
                          width={240}
                          style={{
                            height: "260px",
                            width: "260px",
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
                    src={
                      hostProfile?.image ? baseURL + updatedImagePath : male.src
                    }
                    className="img-fluid"
                    height={260}
                    width={240}
                     onError={(e: any) => {
                      e.target.onerror = null;
                      e.target.src = male.src;
                    }}
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
              {type1 !== "fakeHost" && (
                <div className={`col-lg-10 col-md-6 col-12`}>
                  <h5 className="agency_detail">Agency Details :</h5>

                  <div className="row">
                    <div className="col-md-3">
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
                          id={`agencyCode`}
                          name={`agencyCode`}
                          value={hostProfile?.agencyId?.agencyCode || "-"}
                          label={`Agency Code`}
                          placeholder={`Agency Code`}
                          readOnly
                        />
                      )}
                    </div>

                    <div className="col-md-3">
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
                          id={`agency Name`}
                          name={`agency Name`}
                          value={hostProfile?.agencyId?.name || "-"}
                          label={`Agency Name`}
                          placeholder={`Agency Name`}
                          readOnly
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {type1 !== "fakeHost" && (
                <h5 className="agency_detail mt-3">Host Details :</h5>
              )}

              <div
                className={`${type1 === "fakeHost"
                  ? "col-lg-10"
                  : "col-lg-12 col-md-6 col-12"
                  }`}
              >
                <div className="row">
                  <div
                    className={`${type1 === "fakeHost" ? "col-md-4" : "col-md-3"
                      }`}
                  >
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
                        value={hostProfile?.name || "-"}
                        label={`Name`}
                        placeholder={`Name`}
                        readOnly
                      />
                    )}
                  </div>

                  <div
                    className={`${type1 === "fakeHost" ? "col-md-4" : "col-md-3"
                      }`}
                  >
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
                          hostProfile?.uniqueId ? hostProfile?.uniqueId : "-"
                        }
                        label={`unique Id`}
                        placeholder={`UniqueId`}
                        readOnly
                      />
                    )}
                  </div>

                  <div
                    className={`${type1 === "fakeHost" ? "col-md-4" : "col-md-3"
                      }`}
                  >
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
                        value={hostProfile?.gender || "-"}
                        label={`Gender`}
                        placeholder={`Gender`}
                        readOnly
                      />
                    )}
                  </div>

                  <div
                    className={`${type1 === "fakeHost" ? "col-md-4" : "col-md-3"
                      }`}
                  >
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
                        value={hostProfile?.email || "-"}
                        label={`Email`}
                        placeholder={`Email`}
                        readOnly
                      />
                    )}
                  </div>

                  <div
                    className={`${type1 === "fakeHost" ? "col-md-4" : "col-md-3"
                      }`}
                  >
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
                        value={hostProfile?.dob || "-"}
                        label={`Dob`}
                        placeholder={`Dob`}
                        readOnly
                      />
                    )}
                  </div>

                  {type1 !== "fakeHost" && (
                    <div className="col-md-3">
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
                          value={formatCoins(hostProfile?.coin)}
                          label={`Coin`}
                          placeholder={`Coin`}
                          readOnly
                        />
                      )}
                    </div>
                  )}

                  <div
                    className={`${type1 === "fakeHost" ? "col-md-4" : "col-md-3"
                      }`}
                  >
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
                      // <ExInput
                      //     id={`country`}
                      //     name={`country`}
                      //     value={
                      //         hostProfile?.country?.toUpperCase() || "-"
                      //     }
                      //     label={`Country`}
                      //     placeholder={`Country`}
                      //     readOnly
                      // />

                      <div>
                        <label
                          style={{
                            color: "#7e7e7e",
                            fontSize: "14px",
                            fontWeight: 500,
                          }}
                        >
                          Country
                        </label>

                        <ReactSelect
                          options={countryOptions} // FIXED: Use options array
                          value={selectedCountry} // FIXED: Use selected country
                          isClearable={true}
                          isDisabled={true}
                          placeholder="Select a country..."
                          className="mt-2"
                          classNamePrefix="react-select"
                          formatOptionLabel={(option) => (
                            <div className="d-flex align-items-center">
                              <img
                                height={20}
                                width={28}
                                alt={option.name}
                                src={option.flagUrl}
                                className="me-2"
                                style={{ objectFit: "cover" }}
                                onError={(e: any) => {
                                  e.target.style.display = "none";
                                }}
                              />
                              <span style={{ color: "black" }}>
                                {option.label}
                              </span>
                            </div>
                          )}
                          components={{
                            Option: CustomOption,
                          }}
                          styles={{
                            option: (provided, state) => ({
                              ...provided,
                              cursor: "pointer",
                              "&:hover": {
                                backgroundColor: "#f8f9fa",
                              },
                            }),
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div
                    className={`${type1 === "fakeHost" ? "col-md-4" : "col-md-6"
                      }`}
                  >
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
                          hostProfile?.language.length
                            ? hostProfile?.language.toString()
                            : "-"
                        }
                        label={`Language`}
                        placeholder={`Language`}
                        readOnly
                      />
                    )}
                  </div>
                  <div className="col-md-3"></div>
                  <div className="col-md-3"></div>

                  <div className="col-md-3">
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
                        value={hostProfile?.privateCallRate || "0"}
                        label={`Private Call Rate`}
                        placeholder={`Private Call Rate`}
                        readOnly
                      />
                    )}
                  </div>

                  <div className="col-md-3">
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
                        value={hostProfile?.randomCallFemaleRate || "0"}
                        label={`Random Call Female Rate`}
                        placeholder={`Private Call Female Rate`}
                        readOnly
                      />
                    )}
                  </div>

                  <div className="col-md-3">
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
                        value={hostProfile?.randomCallMaleRate || "0"}
                        label={`Random Call Male Rate`}
                        placeholder={`Random Call Male Rate`}
                        readOnly
                      />
                    )}
                  </div>

                  <div className="col-md-3">
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
                        value={hostProfile?.randomCallRate || "0"}
                        label={`Random Call  Rate`}
                        placeholder={`Random Call  Rate`}
                        readOnly
                      />
                    )}
                  </div>
                  {type1 !== "fakeHost" && (
                    <>
                      <div className="col-md-3">
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
                            value={hostProfile?.audioCallRate || "0"}
                            label={`Audio Call  Rate`}
                            placeholder={`Audio Call  Rate`}
                            readOnly
                          />
                        )}
                      </div>

                      <div className="col-md-3">
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
                            value={hostProfile?.chatRate || "0"}
                            label={`Chat  Rate`}
                            placeholder={`Chat  Rate`}
                            readOnly
                          />
                        )}
                      </div>

                      <div className="col-md-3">
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
                            value={hostProfile?.totalGifts || "0"}
                            label={`Total Receive Gifts`}
                            placeholder={`Total Gifts`}
                            readOnly
                          />
                        )}
                      </div>
                    </>
                  )}


                </div>

                <div className="row">
                  <div className="col-6">
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
                            hostProfile?.bio !== "" ? hostProfile?.bio : "-"
                          }
                          readOnly
                        />
                      </>
                    )}
                  </div>

                  <div className="col-6">
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
                            hostProfile?.impression?.length ?
                              hostProfile?.impression.toString()
                              : "-"
                          }
                          readOnly
                        />
                      </>
                    )}
                  </div>
                  {type1 === "fakeHost" && (
                    <div className="inputData col-12 mt-4">
                      <label className="d-block">Video</label>
                      <div className={"host-video-preview-container mt-2"}>
                        {
                          hostProfile?.video?.length && hostProfile?.video.map((item: string, i: number) => {
                            return (
                              <>
                                <video
                                  controls
                                  style={{ width: "200px", height: "200px" }}
                                  src={baseURL + item}
                                />
                              </>
                            )
                          })
                        }
                      </div>
                    </div>
                  )}
                  {type1 === "fakeHost" && (
                    <div className="inputData col-12 mt-4">
                      <label className="d-block">Live Video</label>
                      <div className={"host-video-preview-container mt-2"}>
                        {
                          hostProfile?.liveVideo?.length && hostProfile?.liveVideo.map((item: string, i: number) => {
                            return (
                              <>
                                <video
                                  controls
                                  style={{ width: "200px", height: "200px" }}
                                  src={baseURL + item}
                                />
                              </>
                            )
                          })
                        }
                      </div>
                    </div>
                  )}

                  {type1 !== "fakeHost" && (
                    <div
                      className={`${type1 === "fakeHost" ? "col-md-4" : "col-md-3"
                        }`}
                    >
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
                          value={hostProfile?.identityProofType || "-"}
                          label={`Identity Proof Type`}
                          placeholder={`Identity Proof Type`}
                          readOnly
                        />
                      )}
                    </div>
                  )}

                  {type1 !== "fakeHost" && (
                    <div className="inputData">
                      <label className="">Identity Proof</label>
                    </div>
                  )}

                  <br />
                  <div className="d-flex gap-4">
                    {type1 !== "fakeHost" &&
                      hostProfile?.identityProof
                        ?.filter((url: string) => url.trim() !== "")
                        .map((url: string, index: number) => (
                          <div className="mt-2" key={index}>
                            <img
                              src={baseURL + url}
                              style={{
                                height: "200px",
                                width: "200px",
                                overflow: "hidden",
                                borderRadius: "10px",
                                cursor: "pointer"
                              }}
                              alt="identity"
                              className="cursor-pointer"
                              height={200}
                              width={200}
                              onClick={() => {
                                setSelectedImage(baseURL + url);
                                setSelectedVideo(null);
                                setShowModal(true);
                              }}
                            />
                          </div>
                        ))}
                  </div>

                  <div className="row">
                    {hostProfile?.profileVideo?.length > 0 && <div className="col-12">
                      <div className="inputData mt-4">
                        <label className="d-block">Profile Video</label>
                        <div className={"host-video-preview-container mt-2"}>
                          {
                            hostProfile?.profileVideo?.length && hostProfile?.profileVideo.map((item: any, i: number) => {
                              const finalUrl =
                                typeof item === "string" ? item : item?.url;
                              return (
                                <>
                                  <video
                                    controls
                                        style={{
                                          width: "200px",
                                          height: "200px",
                                          cursor: "pointer"
                                        }}
                                    src={baseURL + finalUrl}
                                    onClick={(e) =>
                                          handleVideoClick(e, baseURL + item)
                                        }
                                  />
                                </>
                              )
                            })
                          }
                        </div>
                      </div>
                    </div>}
                    <div className="col-12">
                      <div className="inputData mt-3">
                        <label>
                          {hostProfile?.photoGallery?.length > 0 &&
                            "Host Upload Image"}
                        </label>
                        <div className="host-video-preview-container mt-2">
                          {hostProfile?.photoGallery?.length > 0 &&
                            hostProfile.photoGallery.map(
                              (item: any, index: number) => {
                                const finalUrl =
                                  typeof item === "string" ? item : item?.url;
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
                                      cursor: "pointer"
                                    }}
                                    alt=""
                                    onClick={() => {
                                      setSelectedImage(
                                        finalUrl ? baseURL + finalUrl : `/images/male.png`
                                      );
                                      setSelectedVideo(null);
                                      setShowModal(true);
                                    }}
                                  />
                                );
                              }
                            )}
                        </div>
                      </div>
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
                    alt="Selected"
                    style={{ width: "100%", height: "100%", objectFit: 'contain' }}
                  />
                )}
                {selectedVideo && (
                  <video
                    src={selectedVideo}
                    controls
                    style={{ width: "100%", height: "100%", objectFit: 'contain' }}
                  />
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
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
