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
import female from "@/assets/images/female.png";
import { getHostProfile, updateHost } from "@/store/hostSlice";
import { getSetting } from "@/store/settingSlice";
import ToggleSwitch from "@/extra/TogggleSwitch";
import ReactSelect from "react-select";
import countriesData from "@/api/countries.json";
import { formatCoins } from "@/utils/Common";
import { FaEdit, FaSave, FaTimes, FaCoins, FaUserEdit, FaPlay, FaImage, FaHeart, FaCommentDots, FaArrowLeft } from "react-icons/fa";

interface RootStore {
  setting: any;
  user: {
    userProfile: any;
    userWalletHistory: any;
    user: any;
  };
}

const parseArraySafely = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
    } catch {}
    return val.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return [];
};

const HostInfo = (props: any) => {
  const { type1 } = props;
  const { userProfile, user } = useSelector((state: RootStore) => state.user);
  const { hostProfile } = useSelector((state: any) => state.host);
  const { setting } = useSelector((state: any) => state?.setting);
  const hostInfoData =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("hostData") || "null")
      : null;
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
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
    setIsClient(true);
  }, []);

  useEffect(() => {
    const processCountries = () => {
      try {
        const transformedCountries = countriesData
          .filter(
            (country) =>
              country.name?.common && country.cca2 && country.flags?.png
          )
          .map((country) => ({
            value: country.cca2,
            label: country.name.common,
            name: country.name.common,
            code: country.cca2,
            flagUrl: country.flags.png || country.flags.svg,
            flag: country.flags.png || country.flags.svg,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setCountryOptions(transformedCountries);

        if (hostProfile?.country) {
          const existingCountry = transformedCountries.find(
            (c: any) =>
              c.name.toLowerCase() === hostProfile.country.toLowerCase()
          );
          setSelectedCountry(existingCountry || null);
        } else {
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

  if (!isClient) return null;

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
    video.pause();
    video.currentTime = 0;
    setSelectedImage(null);
    setSelectedVideo(url);
    setShowModal(true);
  };

  const isFakeHost = type1 === "fakeHost" || hostProfile?.isFake === true;
  const isFemale = hostProfile?.gender?.toLowerCase() === "female";
  const defaultAvatar = isFemale ? female.src : male.src;

  const getFullImg = (path: string) => {
    if (!path) return defaultAvatar;
    if (path.startsWith("http")) return path;
    return baseURL + path.replace(/\\/g, "/");
  };

  return (
    <>
      <style jsx global>{`
        .info-sq-card {
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
          background-color: #ffffff;
        }
        .info-sq-pill {
          border-radius: 4px !important;
          font-weight: 500;
        }
        .info-field-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px 14px;
        }
        .info-field-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .info-field-value {
          font-size: 14px;
          color: #0f172a;
          font-weight: 500;
        }
        .info-sq-btn {
          border-radius: 6px !important;
          font-weight: 600;
        }
      `}</style>

      <div className="p-3">
        {/* Top Header Bar with Title & Back Button */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="text-capitalize dashboardclass fs-18 fw-bold" style={{ color: "#1e293b" }}>
            {hostProfile?.name ? `${hostProfile.name}'s Profile` : "Host Profile"}
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary info-sq-btn px-3.5 py-1.5 fs-13 d-flex align-items-center gap-2 shadow-sm bg-white"
            onClick={() => router.push(isFakeHost ? "/AiHost" : "/Host/HostTable")}
          >
            <FaArrowLeft />
            <span>Back</span>
          </button>
        </div>

        {/* AI HOST VIEW */}
        {isFakeHost ? (
          <div className="d-flex flex-column gap-4">
            {/* Top Header & Overview Card */}
            <div className="card shadow-sm info-sq-card p-4">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="overflow-hidden border border-2 shadow-sm position-relative cursor-pointer"
                    style={{ width: "90px", height: "90px", borderRadius: "8px", flexShrink: 0 }}
                    onClick={() => {
                      setSelectedImage(getFullImg(hostProfile?.image));
                      setSelectedVideo(null);
                      setShowModal(true);
                    }}
                  >
                    <img
                      src={getFullImg(hostProfile?.image)}
                      alt={hostProfile?.name}
                      className="w-100 h-100 object-fit-cover"
                      onError={(e: any) => {
                        e.target.src = defaultAvatar;
                      }}
                    />
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span
                        className="badge info-sq-pill px-2.5 py-1 fs-11"
                        style={{
                          backgroundColor: isFemale ? "#fce7f3" : "#ede9fe",
                          color: isFemale ? "#db2777" : "#7c3aed",
                        }}
                      >
                        {isFemale ? "AI Girl Host" : "AI Boy Host"}
                      </span>
                      <span className="badge bg-light text-secondary border info-sq-pill px-2.5 py-1 fs-11">
                        ID: {hostProfile?.uniqueId || "-"}
                      </span>
                    </div>
                    <h3 className="fw-bold text-dark mb-1 fs-22">
                      {hostProfile?.name} {hostProfile?.surname || ""}
                    </h3>
                    <div className="d-flex flex-wrap align-items-center gap-3 text-muted fs-13">
                      <span><strong>Age:</strong> {hostProfile?.age || 20}</span>
                      <span>•</span>
                      <span><strong>From:</strong> {hostProfile?.whereFrom || hostProfile?.country || "India"}</span>
                      <span>•</span>
                      <span><strong>Chat Rate:</strong> {hostProfile?.chatRate || 0} Coins/Msg</span>
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary info-sq-btn px-3.5 py-2 fs-13 d-flex align-items-center gap-2"
                    onClick={() => router.push(isFakeHost ? "/AiHost" : "/Host/HostTable")}
                  >
                    <FaArrowLeft />
                    <span>Back to Hosts</span>
                  </button>
                  <button
                    type="button"
                    className="btn text-white info-sq-btn px-4 py-2 fs-13 shadow-sm d-flex align-items-center gap-2"
                    style={{ backgroundColor: "#8F6DFF" }}
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        localStorage.setItem("editAiHostData", JSON.stringify(hostProfile));
                      }
                      router.push(`/AddAiHost?id=${hostProfile?._id}`);
                    }}
                  >
                    <FaUserEdit />
                    <span>Edit AI Host</span>
                  </button>
                </div>
              </div>
            </div>

            {/* IDENTITY & APPEARANCE */}
            <div className="row g-4">
              <div className="col-12 col-lg-6">
                <div className="card shadow-sm info-sq-card p-4 h-100">
                  <h5 className="fw-bold text-dark border-bottom pb-3 mb-3 fs-16 d-flex align-items-center gap-2">
                    <i className="ri-user-smile-line" style={{ color: "#8F6DFF" }}></i> Identity & Background
                  </h5>
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="info-field-box">
                        <div className="info-field-label">Full Name</div>
                        <div className="info-field-value">{hostProfile?.name} {hostProfile?.surname || ""}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-field-box">
                        <div className="info-field-label">Gender / Age</div>
                        <div className="info-field-value text-capitalize">{hostProfile?.gender || "Female"}, {hostProfile?.age || 20} yrs</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-field-box">
                        <div className="info-field-label">Birthdate</div>
                        <div className="info-field-value">{hostProfile?.birthdateFreeText || hostProfile?.dob || "-"}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-field-box">
                        <div className="info-field-label">Where From</div>
                        <div className="info-field-value">{hostProfile?.whereFrom || hostProfile?.country || "-"}</div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="info-field-box">
                        <div className="info-field-label">Work / Study</div>
                        <div className="info-field-value">{hostProfile?.workOrStudy || "-"}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-field-box">
                        <div className="info-field-label">Mother's Name</div>
                        <div className="info-field-value">{hostProfile?.motherName || "-"}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-field-box">
                        <div className="info-field-label">Father's Name</div>
                        <div className="info-field-value">{hostProfile?.fatherName || "-"}</div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="info-field-box">
                        <div className="info-field-label">Siblings</div>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {parseArraySafely(hostProfile?.siblings).length > 0 ? (
                            parseArraySafely(hostProfile.siblings).map((s, idx) => (
                              <span key={idx} className="badge bg-secondary info-sq-pill px-2 py-1 fs-12">{s}</span>
                            ))
                          ) : (
                            <span className="text-muted fs-13">None mentioned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* APPEARANCE & ROUTINE */}
              <div className="col-12 col-lg-6">
                <div className="card shadow-sm info-sq-card p-4 h-100">
                  <h5 className="fw-bold text-dark border-bottom pb-3 mb-3 fs-16 d-flex align-items-center gap-2">
                    <i className="ri-sun-line text-warning"></i> Appearance & Daily Routine
                  </h5>
                  <div className="d-flex flex-column gap-3">
                    <div className="info-field-box">
                      <div className="info-field-label">Appearance & Looks</div>
                      <div className="info-field-value fs-13" style={{ whiteSpace: "pre-wrap" }}>
                        {hostProfile?.looksLike || "No appearance description provided."}
                      </div>
                    </div>
                    <div className="info-field-box">
                      <div className="info-field-label">A Normal Day</div>
                      <div className="info-field-value fs-13" style={{ whiteSpace: "pre-wrap" }}>
                        {hostProfile?.normalDay || "No routine description provided."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TEXTING STYLE & VOICE */}
            <div className="card shadow-sm info-sq-card p-4">
              <h5 className="fw-bold text-dark border-bottom pb-3 mb-3 fs-16 d-flex align-items-center gap-2">
                <i className="ri-chat-smile-2-line text-success"></i> Texting Style & Communication
              </h5>
              <div className="row g-3">
                <div className="col-12 col-md-3">
                  <div className="info-field-box">
                    <div className="info-field-label">Type & Language</div>
                    <div className="info-field-value">
                      {hostProfile?.profileType === "global" ? "Global (English)" : "Local (Hinglish Roman)"}
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  <div className="info-field-box">
                    <div className="info-field-label">Timezone</div>
                    <div className="info-field-value">{hostProfile?.timezone || "Asia/Kolkata"}</div>
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  <div className="info-field-box">
                    <div className="info-field-label">Texting Style</div>
                    <div className="info-field-value">{hostProfile?.textingStyle || "-"}</div>
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  <div className="info-field-box">
                    <div className="info-field-label">Flirting Style</div>
                    <div className="info-field-value">{hostProfile?.howFlirts || "-"}</div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="info-field-box">
                    <div className="info-field-label">Quirks & Habits</div>
                    <div className="info-field-value">{hostProfile?.quirksAndHabits || "-"}</div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="info-field-box">
                    <div className="info-field-label">Opening Icebreaker Line</div>
                    <div className="info-field-value text-primary font-italic">
                      "{hostProfile?.openingLine || hostProfile?.bio || "-"}"
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STORY, EMOTIONS & TRAITS */}
            <div className="card shadow-sm info-sq-card p-4">
              <h5 className="fw-bold text-dark border-bottom pb-3 mb-3 fs-16 d-flex align-items-center gap-2">
                <i className="ri-book-open-line text-primary"></i> Life Story & Inner World
              </h5>
              <div className="d-flex flex-column gap-3">
                <div className="info-field-box">
                  <div className="info-field-label">Life Story / Bio</div>
                  <div className="info-field-value fs-13" style={{ whiteSpace: "pre-wrap" }}>
                    {hostProfile?.lifeStory || hostProfile?.bio || "No backstory provided."}
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="info-field-box">
                      <div className="info-field-label">Personality Traits</div>
                      <div className="d-flex flex-wrap gap-1.5 mt-1">
                        {parseArraySafely(hostProfile?.personality || hostProfile?.impression).map((trait, idx) => (
                          <span key={idx} className="badge info-sq-pill px-2.5 py-1 fs-12" style={{ backgroundColor: "#8F6DFF" }}>
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="info-field-box">
                      <div className="info-field-label">Values</div>
                      <div className="info-field-value">{hostProfile?.values || "-"}</div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="info-field-box">
                      <div className="info-field-label">Happy Memories</div>
                      <div className="d-flex flex-wrap gap-1.5 mt-1">
                        {parseArraySafely(hostProfile?.happyMemories).map((m, idx) => (
                          <span key={idx} className="badge bg-success info-sq-pill px-2.5 py-1 fs-12">{m}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="info-field-box">
                      <div className="info-field-label">Painful Memories</div>
                      <div className="d-flex flex-wrap gap-1.5 mt-1">
                        {parseArraySafely(hostProfile?.painfulMemories).map((m, idx) => (
                          <span key={idx} className="badge bg-danger info-sq-pill px-2.5 py-1 fs-12">{m}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="info-field-box">
                      <div className="info-field-label">Fears & Insecurities</div>
                      <div className="info-field-value">{hostProfile?.fearsInsecurities || "-"}</div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="info-field-box">
                      <div className="info-field-label">Dreams & Goals</div>
                      <div className="info-field-value">{hostProfile?.dreamsGoals || "-"}</div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="info-field-box">
                      <div className="info-field-label">Likes</div>
                      <div className="d-flex flex-wrap gap-1.5 mt-1">
                        {parseArraySafely(hostProfile?.likes).map((l, idx) => (
                          <span key={idx} className="badge bg-info text-dark info-sq-pill px-2 py-1 fs-12">{l}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="info-field-box">
                      <div className="info-field-label">Dislikes</div>
                      <div className="d-flex flex-wrap gap-1.5 mt-1">
                        {parseArraySafely(hostProfile?.dislikes).map((d, idx) => (
                          <span key={idx} className="badge bg-warning text-dark info-sq-pill px-2 py-1 fs-12">{d}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="info-field-box">
                      <div className="info-field-label">Hobbies</div>
                      <div className="d-flex flex-wrap gap-1.5 mt-1">
                        {parseArraySafely(hostProfile?.hobbies).map((h, idx) => (
                          <span key={idx} className="badge bg-secondary info-sq-pill px-2 py-1 fs-12">{h}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="info-field-box">
                      <div className="info-field-label">Secrets</div>
                      <div className="d-flex flex-wrap gap-1.5 mt-1">
                        {parseArraySafely(hostProfile?.secrets).map((sec, idx) => (
                          <span key={idx} className="badge bg-dark info-sq-pill px-2 py-1 fs-12">{sec}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MEDIA (MOMENTS & VIDEOS) */}
            <div className="card shadow-sm info-sq-card p-4">
              <h5 className="fw-bold text-dark border-bottom pb-3 mb-3 fs-16 d-flex align-items-center gap-2">
                <i className="ri-gallery-line" style={{ color: "#8F6DFF" }}></i> Media & Gallery (Moments / Videos)
              </h5>

              <div className="mb-4">
                <h6 className="fw-semibold text-dark mb-2 fs-14">Photo Gallery (Moments)</h6>
                {Array.isArray(hostProfile?.photoGallery) && hostProfile.photoGallery.length > 0 ? (
                  <div className="d-flex flex-wrap gap-3">
                    {hostProfile.photoGallery.map((item: any, idx: number) => {
                      const fullUrl = getFullImg(typeof item === "string" ? item : item?.url);
                      return (
                        <div
                          key={idx}
                          className="overflow-hidden border shadow-sm position-relative cursor-pointer"
                          style={{ width: "120px", height: "150px", borderRadius: "6px" }}
                          onClick={() => {
                            setSelectedImage(fullUrl);
                            setSelectedVideo(null);
                            setShowModal(true);
                          }}
                        >
                          <img src={fullUrl} alt={`Moments ${idx}`} className="w-100 h-100 object-fit-cover" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-muted fs-13">No gallery photos uploaded.</div>
                )}
              </div>

              <div>
                <h6 className="fw-semibold text-dark mb-2 fs-14">Videos (Shorts / Reels)</h6>
                {Array.isArray(hostProfile?.video) && hostProfile.video.length > 0 ? (
                  <div className="d-flex flex-wrap gap-3">
                    {hostProfile.video.map((item: any, idx: number) => {
                      const fullUrl = typeof item === "string" ? (item.startsWith("http") ? item : baseURL + item) : "";
                      return (
                        <div
                          key={idx}
                          className="overflow-hidden bg-black border shadow-sm position-relative cursor-pointer d-flex align-items-center justify-content-center"
                          style={{ width: "140px", height: "200px", borderRadius: "6px" }}
                          onClick={() => {
                            setSelectedImage(null);
                            setSelectedVideo(fullUrl);
                            setShowModal(true);
                          }}
                        >
                          <video src={fullUrl} className="w-100 h-100 object-fit-cover" playsInline muted />
                          <div className="position-absolute bg-dark bg-opacity-50 p-2 rounded-circle text-white d-flex align-items-center justify-content-center">
                            <FaPlay />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-muted fs-13">No videos uploaded.</div>
                )}
              </div>
            </div>

            {/* CALL & CHAT RATES */}
            <div className="card shadow-sm info-sq-card p-4">
              <div
                className="d-flex flex-wrap align-items-center justify-content-between p-3 rounded"
                style={{
                  background: isEditingRates && !useGlobalCallRates ? "#f5f0ff" : "#f8f9fa",
                  border: isEditingRates && !useGlobalCallRates ? "1.5px solid #9f5aff" : "1px solid #e9ecef",
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
                      style={{ backgroundColor: "#9f5aff", borderRadius: "6px", fontWeight: 600, fontSize: "14px" }}
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
                        style={{ backgroundColor: "#28a745", borderRadius: "6px", fontWeight: 600, fontSize: "14px" }}
                      >
                        <FaSave />
                        <span>{savingRates ? "Saving…" : "Save Rates"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingRates(false);
                          setUseGlobalCallRates(!hostProfile?.useCustomCallRates);
                        }}
                        className="btn btn-outline-secondary d-flex align-items-center gap-1 px-3 py-1"
                        style={{ borderRadius: "6px", fontSize: "14px" }}
                      >
                        <FaTimes />
                        <span>Cancel</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="row g-3 mt-3">
                <div className="col-12 col-md-4">
                  <ExInput
                    type="number"
                    id="chatRate"
                    name="chatRate"
                    value={
                      useGlobalCallRates
                        ? String(setting?.chatInteractionRate ?? hostProfile?.chatRate ?? 0)
                        : String(editChatRate)
                    }
                    label="Chat Rate (Coins/Msg)"
                    readOnly={useGlobalCallRates || !isEditingRates}
                    onChange={!useGlobalCallRates && isEditingRates ? (e: any) => setEditChatRate(Number(e.target.value) || 0) : undefined}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <ExInput
                    type="number"
                    id="privateCallRate"
                    name="privateCallRate"
                    value={
                      useGlobalCallRates
                        ? String(setting?.videoPrivateCallRate ?? hostProfile?.privateCallRate ?? 0)
                        : String(editPrivateRate)
                    }
                    label="Private Video Call Rate"
                    readOnly={useGlobalCallRates || !isEditingRates}
                    onChange={!useGlobalCallRates && isEditingRates ? (e: any) => setEditPrivateRate(Number(e.target.value) || 0) : undefined}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <ExInput
                    type="number"
                    id="audioCallRate"
                    name="audioCallRate"
                    value={
                      useGlobalCallRates
                        ? String(setting?.audioPrivateCallRate ?? hostProfile?.audioCallRate ?? 0)
                        : String(editAudioRate)
                    }
                    label="Audio Call Rate"
                    readOnly={useGlobalCallRates || !isEditingRates}
                    onChange={!useGlobalCallRates && isEditingRates ? (e: any) => setEditAudioRate(Number(e.target.value) || 0) : undefined}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* REAL / AGENCY HOST VIEW */
          <div className="card">
            <div className="card-body">
              <div className="row" style={{ padding: "20px" }}>
                <div className="col-lg-2 col-md-6 col-12">
                  {loader === true ? (
                    <SkeletonTheme baseColor="#e2e5e7" highlightColor="#fff">
                      <p className="d-flex justify-content-center ">
                        <Skeleton height={260} width={240} style={{ borderRadius: "20px" }} />
                      </p>
                    </SkeletonTheme>
                  ) : (
                    <img
                      src={hostProfile?.image ? baseURL + updatedImagePath : male.src}
                      className="img-fluid"
                      height={260}
                      width={240}
                      onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = male.src;
                      }}
                      style={{ width: "260px", height: "260px", objectFit: "cover", borderRadius: "20px" }}
                      alt=""
                    />
                  )}
                </div>

                <div className="col-lg-10 col-md-6 col-12">
                  <h5 className="agency_detail">Agency Details :</h5>
                  <div className="row">
                    <div className="col-md-3">
                      <ExInput
                        id="agencyCode"
                        name="agencyCode"
                        value={hostProfile?.agencyId?.agencyCode || "-"}
                        label="Agency Code"
                        readOnly
                      />
                    </div>
                    <div className="col-md-3">
                      <ExInput
                        id="agencyName"
                        name="agencyName"
                        value={hostProfile?.agencyId?.name || "-"}
                        label="Agency Name"
                        readOnly
                      />
                    </div>
                  </div>

                  <h5 className="agency_detail mt-3">Host Details :</h5>
                  <div className="row">
                    <div className="col-md-3">
                      <ExInput id="name" name="name" value={hostProfile?.name || "-"} label="Name" readOnly />
                    </div>
                    <div className="col-md-3">
                      <ExInput id="uniqueId" name="uniqueId" value={hostProfile?.uniqueId || "-"} label="Unique Id" readOnly />
                    </div>
                    <div className="col-md-3">
                      <ExInput id="gender" name="gender" value={hostProfile?.gender || "-"} label="Gender" readOnly />
                    </div>
                    <div className="col-md-3">
                      <ExInput id="email" name="email" value={hostProfile?.email || "-"} label="Email" readOnly />
                    </div>
                    <div className="col-md-3">
                      <ExInput id="phone" name="phone" value={hostProfile?.phone || "-"} label="Mobile" readOnly />
                    </div>
                    <div className="col-md-3">
                      <ExInput id="dob" name="dob" value={hostProfile?.dob || "-"} label="Dob" readOnly />
                    </div>
                    <div className="col-md-3">
                      <ExInput
                        id="profileComplete"
                        name="profileComplete"
                        value={hostProfile?.profileComplete === true ? "Yes" : hostProfile?.profileComplete === false ? "No" : "-"}
                        label="Profile complete"
                        readOnly
                      />
                    </div>
                    <div className="col-md-3">
                      <ExInput id="coin" name="coin" value={formatCoins(hostProfile?.coin)} label="Coin" readOnly />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9999 }}
          onClick={() => setShowModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-transparent border-0">
              <div className="modal-body text-center p-0 position-relative">
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt="Selected"
                    style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", borderRadius: "8px" }}
                  />
                )}
                {selectedVideo && (
                  <video
                    src={selectedVideo}
                    controls
                    autoPlay
                    style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", borderRadius: "8px" }}
                  />
                )}
                <button
                  type="button"
                  className="btn btn-light position-absolute top-0 end-0 m-2 rounded-circle"
                  onClick={() => setShowModal(false)}
                >
                  <i className="ri-close-line fs-18"></i>
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
