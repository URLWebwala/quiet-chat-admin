import Button from "@/extra/Button";
import { ExInput, Textarea } from "@/extra/Input";
import ToggleSwitch from "@/extra/TogggleSwitch";
import EditIcon from "@/assets/images/edit.svg";
import {
  getDefaultCurrency,
  getSetting,
  handleSetting,
  updateSetting,
} from "@/store/settingSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { isSkeleton } from "@/utils/allSelector";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import coin from "@/assets/images/coin.png";
import InfoTooltip from "@/extra/InfoTooltip";
import { agoracontent } from "@/extra/infoContent";

type Settings = {
  [key: string]: any;
};

interface ErrorState {
  privacyPolicyLinkText: string;
  tncText: any;
  taxText: any;
  loginBonus: any;
  firebaseKeyText: string;
  minWithdrawText: string;
  zegoAppId: string;
  agoraAppId: string;
  agoraAppCertificate: string;
  minCoinsToConvert: string;
  adminCommissionRate: string;
  maxFreeChatMessages: string;
  chatInteractionRate: string;
  maleRandomCallRate: string;
  femalRandomCallRate: string;
  generalRadomCallRate: string;
  audioPrivateCallRate: string;
  videoPrivateCallRate: string;
  messageInitiatedAt: string;
  callInitiatedAt: string;
}

const AdminSetting = () => {
  const roleSkeleton = useSelector(isSkeleton);
  const { setting }: any = useSelector((state: RootStore) => state?.setting);



  const { defaultCurrency } = useSelector((state: RootStore) => state.setting);


  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     // safety check, optional in useEffect

  //     const isDemo = sessionStorage.getItem("demo");
  //     setDemo(isDemo === "demo@admin.com");
  //     setIsDemoChecked(true);
  //   }
  // }, []);

  const [privacyPolicyLinkText, setPrivacyPolicyLinkText] = useState<any>();
  const [tncText, setTncText] = useState<any>();
  const [loginBonus, setLoginBonus] = useState<any>(1000);
  const [firebaseKeyText, setFirebaseKeyText] = useState<any>(`{
      "type": "service_account",
      "project_id": "demo-project",
      ...
      "client_email": "firebase-adminsdk-demo@demo-project.iam.gserviceaccount.com",
      ...
    }`);
  const [minWithdrawText, setmMinWithdrawText] = useState<any>();
  const [agoraAppId, setAgoraAppId] = useState<any>("c2b63c57c5f54c199ad088be248");
  const [agoraAppCertificate, setAgoraAppCertificate] = useState<any>("214fdgb63c57c5f54c199ad088be248");
  const [minCoinsToConvert, setMinCoinsToConvert] = useState<any>(500);
  const [isUnderMaintenance, setIsUnderMaintenance] = useState<boolean>(false);
  const [chatInteractionRate, setChatInteractionRate] = useState("10");
  const [maxFreeChatMessages, setMaxFreeChatMessages] = useState("1");
  const [adminCommissionRate, setAdminCommissionRate] = useState("40");

  const [maleRandomCallRate, setMaleRandomCallRate] = useState("40");
  const [femalRandomCallRate, setFemaleRandomCallRate] = useState("30");
  const [generalRadomCallRate, setGeneralRadomCallRate] = useState("50");
  const [audioPrivateCallRate, setAudioPrivateCallRate] = useState("50");
  const [videoPrivateCallRate, setVideoPrivateCallRate] = useState("60");

  const [messageInitiatedAt, setMessageInitiatedAt] = useState("10");
  const [callInitiatedAt, setCallInitiatedAt] = useState("10");

  const [isAppActive, setIsAppActive] = useState(false);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(false);
  const [isAutoCallEnabled, setIsAutoCallEnabled] = useState(true);
  const [isAutoMessageEnabled, setIsAutoMessageEnabled] = useState(true);
  const [isHostEnabled, setIsHostEnabled] = useState(true);

  const [androidMinVersionCode, setAndroidMinVersionCode] = useState<string>("");
  const [androidLatestVersionCode, setAndroidLatestVersionCode] = useState<string>("");
  const [androidUpdateUrl, setAndroidUpdateUrl] = useState<string>("");
  const [isForceUpdateEditable, setIsForceUpdateEditable] = useState<boolean>(false);

  const [data, setData] = useState<any>();

  const [error, setError] = useState<any>({
    privacyPolicyLinkText: "",
    tncText: "",
    taxText: "",
    loginBonus: "",
    firebaseKey: "",
    minWithdrawText: "",
    geminiKey: "",
    agoraAppId: "",
    agoraAppCertificate: "",
    minCoinsToConvert: "",
    adminCommissionRate: "",
    maxFreeChatMessages: "",
    chatInteractionRate: "",
    maleRandomCallRate: "",
    femalRandomCallRate: "",
    generalRadomCallRate: "",
    audioPrivateCallRate: "",
    videoPrivateCallRate: "",
    isAutoRefreshEnabled: "",

    messageInitiatedAt: "",
    callInitiatedAt: "",
  });

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getSetting());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getDefaultCurrency());
  }, [dispatch]);

  useEffect(() => {
    setData(setting);
  }, [setting]);

  useEffect(() => {
    // if (demo) return;
    setPrivacyPolicyLinkText(setting?.privacyPolicyLink);
    setTncText(setting?.termsOfUsePolicyLink);
    setLoginBonus(setting?.loginBonus);
    setFirebaseKeyText(JSON.stringify(setting?.privateKey));
    setmMinWithdrawText(setting?.minWithdrawalRequestedAmount);
    setAgoraAppId(setting?.agoraAppId);
    setAgoraAppCertificate(setting?.agoraAppCertificate);
    setIsUnderMaintenance(setting?.isDemoData);
    setMinCoinsToConvert(setting?.minCoinsToConvert);
    setAdminCommissionRate(setting?.adminCommissionRate);
    setMaxFreeChatMessages(setting?.maxFreeChatMessages);
    setChatInteractionRate(setting?.chatInteractionRate);
    setMaleRandomCallRate(setting?.maleRandomCallRate);
    setFemaleRandomCallRate(setting?.femaleRandomCallRate);
    setGeneralRadomCallRate(setting?.generalRandomCallRate);
    setAudioPrivateCallRate(setting?.audioPrivateCallRate);
    setVideoPrivateCallRate(setting?.videoPrivateCallRate);

    setMessageInitiatedAt(setting?.messageInitiatedAt);
    setCallInitiatedAt(setting?.callInitiatedAt);

    setIsAppActive(setting?.isAppEnabled);
    setIsAutoRefreshEnabled(setting?.isAutoRefreshEnabled);
    setIsAutoCallEnabled(setting?.isAutoCallEnabled ?? false);
    setIsAutoMessageEnabled(setting?.isAutoMessageEnabled ?? false);
    setIsHostEnabled(setting?.isHostEnabled ?? true);

    if (setting?.androidMinVersionCode !== undefined && setting?.androidMinVersionCode !== null) {
      setAndroidMinVersionCode(String(setting.androidMinVersionCode));
    }
    if (setting?.androidLatestVersionCode !== undefined && setting?.androidLatestVersionCode !== null) {
      setAndroidLatestVersionCode(String(setting.androidLatestVersionCode));
    }
    if (setting?.androidUpdateUrl !== undefined && setting?.androidUpdateUrl !== null) {
      setAndroidUpdateUrl(setting.androidUpdateUrl);
    }
  }, [setting]);

  const handleSettingSwitch: any = (id: any, type: any) => {
    const payload = {
      settingId: id,
      type: type,
    };
    dispatch(handleSetting(payload));
  };

  const getUpdatedFields = () => {
    const updated: Partial<Settings> = {};

    const fields = {
      privacyPolicyLink: privacyPolicyLinkText,
      loginBonus: parseInt(loginBonus),
      privateKey: firebaseKeyText,
      agoraAppId,
      agoraAppCertificate,
      minCoinsToConvert,
      adminCommissionRate,
      maxFreeChatMessages,
      chatInteractionRate,
      audioPrivateCallRate,
      videoPrivateCallRate,
      maleRandomCallRate,
      femaleRandomCallRate: femalRandomCallRate,
      generalRandomCallRate: generalRadomCallRate,
      messageInitiatedAt,
      callInitiatedAt,
      androidMinVersionCode,
      androidLatestVersionCode,
      androidUpdateUrl,
    };

    Object.keys(fields).forEach((key) => {
      if (fields[key as keyof typeof fields] !== setting[key as keyof typeof fields]) {
        updated[key as keyof typeof fields] = fields[key as keyof typeof fields];
      }
    });

    return updated;
  };


  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (
      !privacyPolicyLinkText ||
      !tncText ||
      !loginBonus ||
      !firebaseKeyText ||
      !minCoinsToConvert ||
      !agoraAppId ||
      !agoraAppCertificate ||
      !adminCommissionRate ||
      !maxFreeChatMessages ||
      !chatInteractionRate ||
      !maleRandomCallRate ||
      !femalRandomCallRate ||
      !generalRadomCallRate ||
      !audioPrivateCallRate ||
      !videoPrivateCallRate ||
      !messageInitiatedAt ||
      !callInitiatedAt
    ) {
      {
        let error = {} as ErrorState;
        if (!privacyPolicyLinkText)
          error.privacyPolicyLinkText = "privacyPolicyLink Is Required !";
        if (!tncText) error.tncText = "Terms and Condition Is Required !";
        if (!loginBonus) error.loginBonus = "LoginBonus Is Required !";
        if (!firebaseKeyText)
          error.firebaseKeyText = "FirbaseKey Is Required !";
        if (!agoraAppId) error.agoraAppId = "AgoraappId Is Required !";
        if (!agoraAppCertificate)
          error.agoraAppCertificate = "AgoraApp SignIn Is Required !";
        if (!minCoinsToConvert)
          error.minCoinsToConvert =
            "Minimum Coins For Withdrawal is Required !";

        if (!adminCommissionRate)
          error.adminCommissionRate = "Admin Commission Rate is Required !";

        if (!maxFreeChatMessages)
          error.maxFreeChatMessages = "Maximum Free Chat Message is Required !";

        if (!chatInteractionRate)
          error.chatInteractionRate = "Chat Interaction Rate is Required !";

        if (!maleRandomCallRate)
          error.maleRandomCallRate = "Male Radom Call Rate is Required !";

        if (!femalRandomCallRate)
          error.femalRandomCallRate = "Female Radnom Call Rate is Required !";

        if (!generalRadomCallRate)
          error.generalRadomCallRate = "Genral Radnom Call Rate is Required !";

        if (!audioPrivateCallRate)
          error.audioPrivateCallRate = "Audio Private Call Rate is Required !";

        if (!videoPrivateCallRate)
          error.videoPrivateCallRate = "Video Private Call Rate is Required !";

        if (!messageInitiatedAt)
          error.messageInitiatedAt = "Message Initiat Time Is Required !";
        if (!callInitiatedAt)
          error.callInitiatedAt = "Call Initiat Time Is Required !";

        return setError({ ...error });
      }
    } else {

      const updatedFields: any = getUpdatedFields();

      // Force-update fields should always be sent from admin,
      // even if old value == new value, so they stay in sync with DB.
      updatedFields.androidMinVersionCode = androidMinVersionCode;
      updatedFields.androidLatestVersionCode = androidLatestVersionCode;
      updatedFields.androidUpdateUrl = androidUpdateUrl;

      if (Object.keys(updatedFields).length === 0) {
        return alert("No changes found!");
      }

      const payload = {
        settingId: data?._id,
        settingDataSubmit: updatedFields,
      };

      dispatch(updateSetting(payload));

    }
  };

  return (
    <div className="mainSetting">
      <form onSubmit={handleSubmit} id="expertForm">
        {/* ─── Top Header Action Bar ────────────────────────────────────────── */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 p-3 bg-white rounded-4 shadow-sm gap-3">
          <div>
            <h5 className="mb-1 fw-bold text-dark d-flex align-items-center gap-2">
              <i className="ri-sound-module-line text-primary fs-20" style={{ color: "#9f5aff" }}></i>
              App & General Configuration
            </h5>
            <p className="text-muted mb-0 small">
              Manage system switches, call rates, versioning, and third-party API credentials.
            </p>
          </div>
          <button
            type="submit"
            className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 fw-bold rounded-3 shadow"
            style={{
              background: "linear-gradient(135deg, #9f5aff 0%, #7c3aed 100%)",
              border: "none",
              fontSize: "14px",
              letterSpacing: "0.2px",
            }}
          >
            <i className="ri-save-3-line fs-18"></i>
            Save Changes
          </button>
        </div>

        {/* ─── Settings Grid ────────────────────────────────────────────────── */}
        <div className="row g-4">
          {/* 1. Core Feature Toggles Card */}
          <div className="col-12">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
              <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 36, height: 36, backgroundColor: "#F3E8FF", color: "#9333EA" }}
                >
                  <i className="ri-toggle-line fs-20"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark">System Feature Switches</h6>
                  <span className="text-muted small">Enable or disable major features and operational modes</span>
                </div>
              </div>

              <div className="row g-3">
                {/* AI / Demo Data Toggle */}
                <div className="col-12 col-md-6 col-lg-3">
                  <div
                    className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between"
                    style={{ backgroundColor: "#FAF5FF", border: "1px solid #E9D5FF" }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <i className="ri-robot-2-line fs-18 text-purple" style={{ color: "#9333EA" }}></i>
                        <span className="fw-bold text-dark small">AI & Demo Data</span>
                      </div>
                      <ToggleSwitch
                        onClick={() => handleSettingSwitch(setting?._id, "isDemoData")}
                        value={isUnderMaintenance}
                      />
                    </div>
                    <span className="text-muted small" style={{ fontSize: "11.5px" }}>
                      Show AI & demo host profiles to users in the app
                    </span>
                  </div>
                </div>

                {/* App Active Status */}
                <div className="col-12 col-md-6 col-lg-3">
                  <div
                    className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between"
                    style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <i className="ri-checkbox-circle-line fs-18 text-success"></i>
                        <span className="fw-bold text-dark small">App Active</span>
                      </div>
                      <ToggleSwitch
                        onClick={() => handleSettingSwitch(setting?._id, "isAppEnabled")}
                        value={isAppActive}
                      />
                    </div>
                    <span className="text-muted small" style={{ fontSize: "11.5px" }}>
                      Allow users to access app (turn off for maintenance)
                    </span>
                  </div>
                </div>

                {/* Screen Auto Reload */}
                <div className="col-12 col-md-6 col-lg-3">
                  <div
                    className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between"
                    style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <i className="ri-refresh-line fs-18 text-primary"></i>
                        <span className="fw-bold text-dark small">Auto Reload</span>
                      </div>
                      <ToggleSwitch
                        onClick={() => handleSettingSwitch(setting?._id, "isAutoRefreshEnabled")}
                        value={isAutoRefreshEnabled}
                      />
                    </div>
                    <span className="text-muted small" style={{ fontSize: "11.5px" }}>
                      Automatically reload screens and live data in app
                    </span>
                  </div>
                </div>

                {/* Real Host & Agency System */}
                <div className="col-12 col-md-6 col-lg-3">
                  <div
                    className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between"
                    style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <i className="ri-user-star-line fs-18" style={{ color: "#EA580C" }}></i>
                        <span className="fw-bold text-dark small">Real Host/Agency</span>
                      </div>
                      <ToggleSwitch
                        onClick={() => handleSettingSwitch(setting?._id, "isHostEnabled")}
                        value={isHostEnabled}
                      />
                    </div>
                    <span className="text-muted small" style={{ fontSize: "11.5px" }}>
                      Show real Host & Agency management in Sidebar
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Versioning & Force Update Card */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, backgroundColor: "#E0F2FE", color: "#0284C7" }}
                  >
                    <i className="ri-android-line fs-20"></i>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold text-dark">Force Update & App Version</h6>
                    <span className="text-muted small">Manage mandatory updates on Play Store</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn btn-sm ${isForceUpdateEditable ? "btn-success" : "btn-outline-primary"} d-flex align-items-center gap-1 rounded-pill px-3 py-1`}
                  onClick={() => setIsForceUpdateEditable((prev) => !prev)}
                >
                  <i className={isForceUpdateEditable ? "ri-check-line" : "ri-edit-line"}></i>
                  <span>{isForceUpdateEditable ? "Lock / Save Mode" : "Unlock & Edit"}</span>
                </button>
              </div>

              <div className="row g-3">
                <div className="col-6">
                  <ExInput
                    type="number"
                    id="androidMinVersionCode"
                    name="androidMinVersionCode"
                    label="Android Min Version Code"
                    placeholder="e.g. 24"
                    value={androidMinVersionCode}
                    onChange={(e: any) => setAndroidMinVersionCode(e.target.value)}
                    disabled={!isForceUpdateEditable}
                  />
                </div>
                <div className="col-6">
                  <ExInput
                    type="number"
                    id="androidLatestVersionCode"
                    name="androidLatestVersionCode"
                    label="Android Latest Version Code"
                    placeholder="e.g. 24"
                    value={androidLatestVersionCode}
                    onChange={(e: any) => setAndroidLatestVersionCode(e.target.value)}
                    disabled={!isForceUpdateEditable}
                  />
                </div>
                <div className="col-12">
                  <ExInput
                    type="text"
                    id="androidUpdateUrl"
                    name="androidUpdateUrl"
                    label="Android Update Play Store URL"
                    placeholder="https://play.google.com/store/apps/details?id=..."
                    value={androidUpdateUrl}
                    onChange={(e: any) => setAndroidUpdateUrl(e.target.value)}
                    disabled={!isForceUpdateEditable}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Login Bonus Card */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
              <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 36, height: 36, backgroundColor: "#FEF3C7", color: "#D97706" }}
                >
                  <i className="ri-gift-line fs-20"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark">Login Bonus Reward</h6>
                  <span className="text-muted small">Coins credited upon user registration & daily welcome</span>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <img src={coin.src} height={20} width={20} alt="coin" />
                    <span className="fw-semibold small text-muted">New User Welcome Coins</span>
                  </div>
                  <ExInput
                    type="number"
                    id="loginBonus"
                    name="loginBonus"
                    placeholder="e.g. 50"
                    errorMessage={error.loginBonus}
                    value={loginBonus}
                    onChange={(e: any) => {
                      setLoginBonus(e.target.value);
                      if (!e.target.value) {
                        setError({ ...error, loginBonus: "Login Bonus is required" });
                      } else if (e.target.value < 0) {
                        setError({ ...error, loginBonus: "Login bonus cannot be negative" });
                      } else {
                        setError({ ...error, loginBonus: "" });
                      }
                    }}
                  />
                  <small className="text-muted d-block mt-2">
                    These coins are deposited directly to new users' wallet upon signup.
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Call Charge Settings Card */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
              <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 36, height: 36, backgroundColor: "#FEE2E2", color: "#DC2626" }}
                >
                  <i className="ri-phone-fill fs-20"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark">Call Charges & Tariffs</h6>
                  <span className="text-muted small">Per-minute coin rates for random & private calls</span>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex align-items-center gap-1 mb-2">
                  <img src={coin.src} height={16} width={16} alt="coin" />
                  <span className="fw-bold small text-dark">Random Match Rates (Coins / min)</span>
                </div>
                <div className="row g-2">
                  <div className="col-4">
                    <ExInput
                      type="number"
                      id="maleRandomCallRate"
                      name="maleRandomCallRate"
                      label="Male"
                      placeholder="e.g. 25"
                      errorMessage={error.maleRandomCallRate}
                      value={maleRandomCallRate}
                      onChange={(e: any) => setMaleRandomCallRate(e.target.value)}
                    />
                  </div>
                  <div className="col-4">
                    <ExInput
                      type="number"
                      id="femalRandomCallRate"
                      name="femalRandomCallRate"
                      label="Female"
                      placeholder="e.g. 25"
                      errorMessage={error.femalRandomCallRate}
                      value={femalRandomCallRate}
                      onChange={(e: any) => setFemaleRandomCallRate(e.target.value)}
                    />
                  </div>
                  <div className="col-4">
                    <ExInput
                      type="number"
                      id="both"
                      name="both"
                      label="Both"
                      placeholder="e.g. 25"
                      errorMessage={error.generalRadomCallRate}
                      value={generalRadomCallRate}
                      onChange={(e: any) => setGeneralRadomCallRate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="d-flex align-items-center gap-1 mb-2">
                  <img src={coin.src} height={16} width={16} alt="coin" />
                  <span className="fw-bold small text-dark">Private Direct Call Rates (Coins / min)</span>
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <ExInput
                      type="number"
                      id="audio"
                      name="audio"
                      label="Audio Call"
                      placeholder="e.g. 25"
                      errorMessage={error.audioPrivateCallRate}
                      value={audioPrivateCallRate}
                      onChange={(e: any) => setAudioPrivateCallRate(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <ExInput
                      type="number"
                      id="video"
                      name="video"
                      label="Video Call"
                      placeholder="e.g. 25"
                      errorMessage={error.videoPrivateCallRate}
                      value={videoPrivateCallRate}
                      onChange={(e: any) => setVideoPrivateCallRate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Chat & Coin Economy Card */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
              <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 36, height: 36, backgroundColor: "#E0E7FF", color: "#4338CA" }}
                >
                  <i className="ri-chat-3-line fs-20"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark">Chat & Economy Settings</h6>
                  <span className="text-muted small">Messaging limits, withdrawal conversion, and commission</span>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-6">
                  <ExInput
                    type="number"
                    id="maxfreechatmsg"
                    name="maxfreechatmsg"
                    label="Max Free Messages"
                    placeholder="e.g. 1"
                    errorMessage={error.maxFreeChatMessages}
                    value={maxFreeChatMessages}
                    onChange={(e: any) => setMaxFreeChatMessages(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <ExInput
                    type="number"
                    id="chatInteractionRate"
                    name="chatInteractionRate"
                    label="Chat Coin Rate / msg"
                    placeholder="e.g. 1"
                    errorMessage={error.chatInteractionRate}
                    value={chatInteractionRate}
                    onChange={(e: any) => setChatInteractionRate(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <ExInput
                    type="number"
                    id="coin"
                    name="coin"
                    label={`Coins for 1 ${defaultCurrency?.symbol || "₹"}`}
                    placeholder="e.g. 500"
                    errorMessage={error.minCoinsToConvert}
                    value={minCoinsToConvert}
                    onChange={(e: any) => setMinCoinsToConvert(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <ExInput
                    type="number"
                    id="admincommissioncharge"
                    name="admincommissioncharge"
                    label="Admin Commission (%)"
                    placeholder="e.g. 40"
                    errorMessage={error.adminCommissionRate}
                    value={adminCommissionRate}
                    onChange={(e: any) => setAdminCommissionRate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 6. Automated Engagement Timing Card */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
              <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 36, height: 36, backgroundColor: "#CCFBF1", color: "#0F766E" }}
                >
                  <i className="ri-timer-flash-line fs-20"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark">Automated Engagement Timing</h6>
                  <span className="text-muted small">Configure bot auto-call and auto-message delays</span>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-6">
                  <ExInput
                    type="number"
                    id="messageInitiatedAt"
                    name="messageInitiatedAt"
                    label="Auto Message Delay (Mins)"
                    placeholder="e.g. 10"
                    errorMessage={error.messageInitiatedAt}
                    value={messageInitiatedAt}
                    onChange={(e: any) => setMessageInitiatedAt(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <ExInput
                    type="number"
                    id="callInitiatedAt"
                    name="callInitiatedAt"
                    label="Auto Call Delay (Mins)"
                    placeholder="e.g. 10"
                    errorMessage={error.callInitiatedAt}
                    value={callInitiatedAt}
                    onChange={(e: any) => setCallInitiatedAt(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light border">
                    <div>
                      <span className="fw-semibold small text-dark d-block">Enable Auto Call</span>
                      <span className="text-muted" style={{ fontSize: "11px" }}>Trigger automated calls to idle users</span>
                    </div>
                    <ToggleSwitch
                      onClick={() => handleSettingSwitch(setting?._id, "isAutoCallEnabled")}
                      value={isAutoCallEnabled}
                    />
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light border">
                    <div>
                      <span className="fw-semibold small text-dark d-block">Enable Auto Message</span>
                      <span className="text-muted" style={{ fontSize: "11px" }}>Send welcome/follow-up messages</span>
                    </div>
                    <ToggleSwitch
                      onClick={() => handleSettingSwitch(setting?._id, "isAutoMessageEnabled")}
                      value={isAutoMessageEnabled}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Agora Calling SDK Credentials Card */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, backgroundColor: "#E0F2FE", color: "#0369A1" }}
                  >
                    <i className="ri-broadcast-line fs-20"></i>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold text-dark">Agora Real-Time Calling SDK</h6>
                    <span className="text-muted small">Voice & video calling channel credentials</span>
                  </div>
                </div>
                <InfoTooltip title="Agora Setup" content={agoracontent} />
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <ExInput
                    type="text"
                    id="agoraAppId"
                    name="agoraAppId"
                    label="Agora App ID"
                    placeholder="Enter Agora App ID"
                    errorMessage={error.agoraAppId}
                    value={agoraAppId}
                    onChange={(e: any) => setAgoraAppId(e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <ExInput
                    type="text"
                    id="agoraAppCertificate"
                    name="agoraAppCertificate"
                    label="Agora App Certificate"
                    placeholder="Enter Agora App Certificate"
                    errorMessage={error.agoraAppCertificate}
                    value={agoraAppCertificate}
                    onChange={(e: any) => setAgoraAppCertificate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 8. Firebase Service Account JSON Card */}
          <div className="col-12">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
              <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 36, height: 36, backgroundColor: "#FFFBEB", color: "#B45309" }}
                >
                  <i className="ri-fire-line fs-20"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark">Firebase Admin Service Account Key</h6>
                  <span className="text-muted small">Used for FCM push notifications & auth verification</span>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <Textarea
                    row={7}
                    type="text"
                    id="firebaseKey"
                    name="firebaseKey"
                    label="Service Account Private Key JSON"
                    placeholder="Paste your Firebase serviceAccountKey.json contents here..."
                    errorMessage={error.firebaseKeyText}
                    value={firebaseKeyText}
                    onChange={(e: any) => setFirebaseKeyText(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminSetting;
