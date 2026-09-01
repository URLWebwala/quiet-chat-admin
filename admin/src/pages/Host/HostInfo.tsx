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
import { getHostProfile, updateHost } from "@/store/hostSlice";
import { getSetting } from "@/store/settingSlice";
import ToggleSwitch from "@/extra/TogggleSwitch";
import Button from "@/extra/Button";
import ReactSelect from "react-select";
import countriesData from "@/api/countries.json";
import { formatCoins } from "@/utils/Common";
import { FaEdit, FaSave, FaTimes, FaCoins } from "react-icons/fa";

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
  const { setting } = useSelector((state: any) => state?.setting);
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
    if (!router.isReady) return;
    dispatch(getHostProfile(id || hostInfoData?._id) as any);
    dispatch(getSetting() as any);
  }, [dispatch, id, hostInfoData?._id, router.isReady]);

  const [useGlobalCallRates, setUseGlobalCallRates] = useState(true);
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [editPrivateRate, setEditPrivateRate] = useState(0);
  const [editRandomFemale, setEditRandomFemale] = useState(0);
  const [editRandomMale, setEditRandomMale] = useState(0);
  const [editRandomRate, setEditRandomRate] = useState(0);
  const [editAudioRate, setEditAudioRate] = useState(0);
  const [editChatRate, setEditChatRate] = useState(0);
  const [savingRates, setSavingRates] = useState(false);

  useEffect(() => {
    if (!hostProfile?._id) return;
    setUseGlobalCallRates(!hostProfile.useCustomCallRates);
    setIsEditingRates(!!hostProfile.useCustomCallRates);
    setEditPrivateRate(Number(hostProfile.privateCallRate) || 0);
    setEditRandomFemale(Number(hostProfile.randomCallFemaleRate) || 0);
    setEditRandomMale(Number(hostProfile.randomCallMaleRate) || 0);
    setEditRandomRate(Number(hostProfile.randomCallRate) || 0);
    setEditAudioRate(Number(hostProfile.audioCallRate) || 0);
    setEditChatRate(Number(hostProfile.chatRate) || 0);
  }, [hostProfile]);

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

  const handleSaveCallRates = async () => {
    if (!hostProfile?._id) return;
    setSavingRates(true);
    try {
      const fd = new FormData();
      fd.append("hostId", hostProfile._id);
      if (useGlobalCallRates) {
        fd.append("useGlobalCallRates", "true");
      } else {
        fd.append("useGlobalCallRates", "false");
        fd.append("privateCallRate", String(editPrivateRate));
        fd.append("randomCallFemaleRate", String(editRandomFemale));
        fd.append("randomCallMaleRate", String(editRandomMale));
        fd.append("randomCallRate", String(editRandomRate));
        fd.append("audioCallRate", String(editAudioRate));
        fd.append("chatRate", String(editChatRate));
      }
      await dispatch(updateHost(fd) as any);
      dispatch(getHostProfile(id || hostInfoData?._id));
    } finally {
      setSavingRates(false);
    }
  };

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
                        <SkeletonTheme baseColor="#e2e5e7" highlightColor="#fff">
                          <p className="d-flex justify-content-center my-3">
                            <Skeleton
                              height={40}
                              width={250}
                              style={{ borderRadius: "10px" }}
                            />
                          </p>
                        </SkeletonTheme>
                      </>
                    ) : (
                      <ExInput
                        id={`phone`}
                        name={`phone`}
                        value={hostProfile?.phone || "-"}
                        label={`Mobile`}
                        placeholder={`Mobile`}
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
                        id={`profileComplete`}
                        name={`profileComplete`}
                        value={
                          hostProfile?.profileComplete === true
                            ? "Yes"
                            : hostProfile?.profileComplete === false
                              ? "No"
                              : "-"
                        }
                        label={`Profile complete`}
                        placeholder={`Profile complete`}
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
                        id={`missingProfileFields`}
                        name={`missingProfileFields`}
                        value={
                          Array.isArray(hostProfile?.missingProfileFields) &&
                          hostProfile.missingProfileFields.length > 0
                            ? hostProfile.missingProfileFields.join(", ")
                            : "-"
                        }
                        label={`Missing profile fields`}
                        placeholder={`Missing profile fields`}
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
                          Array.isArray(hostProfile?.language)
                            ? hostProfile.language.join(", ")
                            : (hostProfile?.language || "-")
                        }
                        label={`Language`}
                        placeholder={`Language`}
                        readOnly
                      />
                    )}
                  </div>
                  <div className="col-md-3"></div>
                  <div className="col-md-3"></div>

                  {!loader && (
                    <div className="col-12 mb-3 mt-2">
                      <div
                        className="d-flex flex-wrap align-items-center justify-content-between p-3 rounded"
                        style={{
                          background: isEditingRates && !useGlobalCallRates ? "#f5f0ff" : "#f8f9fa",
                          border: isEditingRates && !useGlobalCallRates ? "1.5px solid #9f5aff" : "1px solid #e9ecef",
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        <div className="d-flex flex-wrap align-items-center gap-3">
                          <div className="d-flex align-items-center gap-2">
                            <FaCoins style={{ color: "#9f5aff", fontSize: "18px" }} />
                            <span className="fw-bold text-dark" style={{ fontSize: "15px" }}>
                              Call & Chat Rates
                            </span>
                          </div>

                          <div className="d-flex align-items-center gap-2 ms-md-3 border-start ps-md-3">
                            <span className="small text-muted">Use global rates (from Settings)</span>
                            <ToggleSwitch
                              value={useGlobalCallRates}
                              onClick={() => {
                                setUseGlobalCallRates((v) => {
                                  const next = !v;
                                  if (!next) {
                                    setIsEditingRates(true);
                                    if (hostProfile) {
                                      setEditPrivateRate(Number(hostProfile.privateCallRate) || 0);
                                      setEditRandomFemale(Number(hostProfile.randomCallFemaleRate) || 0);
                                      setEditRandomMale(Number(hostProfile.randomCallMaleRate) || 0);
                                      setEditRandomRate(Number(hostProfile.randomCallRate) || 0);
                                      setEditAudioRate(Number(hostProfile.audioCallRate) || 0);
                                      setEditChatRate(Number(hostProfile.chatRate) || 0);
                                    }
                                  }
                                  return next;
                                });
                              }}
                            />
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
                          {!isEditingRates || useGlobalCallRates ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingRates(true);
                                setUseGlobalCallRates(false);
                                if (hostProfile) {
                                  setEditPrivateRate(Number(hostProfile.privateCallRate) || Number(setting?.videoPrivateCallRate) || 0);
                                  setEditRandomFemale(Number(hostProfile.randomCallFemaleRate) || Number(setting?.femaleRandomCallRate) || 0);
                                  setEditRandomMale(Number(hostProfile.randomCallMaleRate) || Number(setting?.maleRandomCallRate) || 0);
                                  setEditRandomRate(Number(hostProfile.randomCallRate) || Number(setting?.generalRandomCallRate) || 0);
                                  setEditAudioRate(Number(hostProfile.audioCallRate) || Number(setting?.audioPrivateCallRate) || 0);
                                  setEditChatRate(Number(hostProfile.chatRate) || Number(setting?.chatInteractionRate) || 0);
                                }
                              }}
                              className="btn d-flex align-items-center gap-2 px-3 py-1 text-white shadow-sm"
                              style={{ backgroundColor: "#9f5aff", borderRadius: "8px", fontWeight: 600, fontSize: "14px" }}
                            >
                              <FaEdit />
                              <span>Edit Custom Rates</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={async () => {
                                  await handleSaveCallRates();
                                  setIsEditingRates(false);
                                }}
                                disabled={savingRates || !hostProfile?._id}
                                className="btn d-flex align-items-center gap-2 px-3 py-1 text-white shadow-sm"
                                style={{ backgroundColor: "#28a745", borderRadius: "8px", fontWeight: 600, fontSize: "14px" }}
                              >
                                <FaSave />
                                <span>{savingRates ? "Saving…" : "Save Rates"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingRates(false);
                                  setUseGlobalCallRates(!hostProfile?.useCustomCallRates);
                                  if (hostProfile) {
                                    setEditPrivateRate(Number(hostProfile.privateCallRate) || 0);
                                    setEditRandomFemale(Number(hostProfile.randomCallFemaleRate) || 0);
                                    setEditRandomMale(Number(hostProfile.randomCallMaleRate) || 0);
                                    setEditRandomRate(Number(hostProfile.randomCallRate) || 0);
                                    setEditAudioRate(Number(hostProfile.audioCallRate) || 0);
                                    setEditChatRate(Number(hostProfile.chatRate) || 0);
                                  }
                                }}
                                className="btn btn-outline-secondary d-flex align-items-center gap-1 px-3 py-1"
                                style={{ borderRadius: "8px", fontSize: "14px" }}
                              >
                                <FaTimes />
                                <span>Cancel</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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
                        type="number"
                        id={`privateCallRate`}
                        name={`privateCallRate`}
                        value={
                          useGlobalCallRates
                            ? String(setting?.videoPrivateCallRate ?? hostProfile?.privateCallRate ?? 0)
                            : String(editPrivateRate)
                        }
                        label={`Private Call Rate`}
                        placeholder={`Private Call Rate`}
                        readOnly={useGlobalCallRates || !isEditingRates}
                        onChange={
                          !useGlobalCallRates && isEditingRates
                            ? (e: any) => setEditPrivateRate(Number(e.target.value) || 0)
                            : undefined
                        }
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
                        type="number"
                        id={`radnomCallFemaleRate`}
                        name={`radnomCallFemaleRate`}
                        value={
                          useGlobalCallRates
                            ? String(setting?.femaleRandomCallRate ?? hostProfile?.randomCallFemaleRate ?? 0)
                            : String(editRandomFemale)
                        }
                        label={`Random Call Female Rate`}
                        placeholder={`Private Call Female Rate`}
                        readOnly={useGlobalCallRates || !isEditingRates}
                        onChange={
                          !useGlobalCallRates && isEditingRates
                            ? (e: any) => setEditRandomFemale(Number(e.target.value) || 0)
                            : undefined
                        }
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
                        type="number"
                        id={`radnomCallmaleRate`}
                        name={`radnomCallmaleRate`}
                        value={
                          useGlobalCallRates
                            ? String(setting?.maleRandomCallRate ?? hostProfile?.randomCallMaleRate ?? 0)
                            : String(editRandomMale)
                        }
                        label={`Random Call Male Rate`}
                        placeholder={`Random Call Male Rate`}
                        readOnly={useGlobalCallRates || !isEditingRates}
                        onChange={
                          !useGlobalCallRates && isEditingRates
                            ? (e: any) => setEditRandomMale(Number(e.target.value) || 0)
                            : undefined
                        }
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
                        type="number"
                        id={`randomCallRate`}
                        name={`randomCallRate`}
                        value={
                          useGlobalCallRates
                            ? String(setting?.generalRandomCallRate ?? hostProfile?.randomCallRate ?? 0)
                            : String(editRandomRate)
                        }
                        label={`Random Call  Rate`}
                        placeholder={`Random Call  Rate`}
                        readOnly={useGlobalCallRates || !isEditingRates}
                        onChange={
                          !useGlobalCallRates && isEditingRates
                            ? (e: any) => setEditRandomRate(Number(e.target.value) || 0)
                            : undefined
                        }
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
                        type="number"
                        id={`audioCallRate`}
                        name={`audioCallRate`}
                        value={
                          useGlobalCallRates
                            ? String(setting?.audioPrivateCallRate ?? hostProfile?.audioCallRate ?? 0)
                            : String(editAudioRate)
                        }
                        label={`Audio Call  Rate`}
                        placeholder={`Audio Call  Rate`}
                        readOnly={useGlobalCallRates || !isEditingRates}
                        onChange={
                          !useGlobalCallRates && isEditingRates
                            ? (e: any) => setEditAudioRate(Number(e.target.value) || 0)
                            : undefined
                        }
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
                        type="number"
                        id={`chatRate`}
                        name={`chatRate`}
                        value={
                          useGlobalCallRates
                            ? String(setting?.chatInteractionRate ?? hostProfile?.chatRate ?? 0)
                            : String(editChatRate)
                        }
                        label={`Chat  Rate`}
                        placeholder={`Chat  Rate`}
                        readOnly={useGlobalCallRates || !isEditingRates}
                        onChange={
                          !useGlobalCallRates && isEditingRates
                            ? (e: any) => setEditChatRate(Number(e.target.value) || 0)
                            : undefined
                        }
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
