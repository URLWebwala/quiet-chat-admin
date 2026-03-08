import Button from "@/extra/Button";
import { ExInput, Textarea } from "@/extra/Input";
import ToggleSwitch from "@/extra/TogggleSwitch";
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

      const updatedFields = getUpdatedFields();

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
    <>
      <div className="mainSetting">
        <form onSubmit={handleSubmit} id="expertForm">
          <div className="d-flex justify-content-end">
            <div className="">
              <Button
                type={`submit`}
                className={`text-light m10-left fw-bold`}
                text={`Submit`}
                style={{ backgroundColor: "#9f5aff" }}
              // style={{ backgroundColor: "#1ebc1e" }}
              />
            </div>
          </div>
          <div className="settingBox row">
            <div className="col-12 col-md-6 mt-3 ">
              <div className="settingBoxOuter">
                <div className="settingBoxHeader">
                  <h4 className="settingboxheader">Fake Data Setting</h4>
                  <hr style={{ width: "95%", margin: "5px 9px" }} />
                </div>
                <div
                  className="d-flex justify-content-between align-items-start"
                  style={{
                    paddingRight: "20px",
                  }}
                >
                  {roleSkeleton === true ? (
                    <>
                      <div
                        className="skeleton mb-4"
                        style={{
                          height: "24px",
                          width: "60%",
                          marginLeft: "15px",
                        }}
                      ></div>

                      <div
                        className="skeleton mb-4"
                        style={{
                          height: "24px",
                          width: "7%",
                          borderRadius: "20px",
                        }}
                      ></div>
                    </>
                  ) : (
                    <>
                      <p className="isfake">
                        Show fake data in app{" "}
                        <span className="" style={{ fontSize: "12px" }}>
                          (Enable/Disable)
                        </span>
                      </p>

                      <div>
                        <ToggleSwitch
                          onClick={() => {
                            handleSettingSwitch(setting?._id, "isDemoData");
                          }}
                          value={isUnderMaintenance}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 mt-3">
              <div className="settingBoxOuter">
                <div className="settingBoxHeader">
                  <h4 className="settingboxheader">App Active Setting</h4>
                  <hr style={{ width: "95%", margin: "5px 9px" }} />
                </div>
                <div
                  className="d-flex justify-content-between align-items-start"
                  style={{
                    paddingRight: "20px",
                  }}
                >
                  {roleSkeleton === true ? (
                    <>
                      <div
                        className="skeleton mb-4"
                        style={{
                          height: "24px",
                          width: "60%",
                          marginLeft: "15px",
                        }}
                      ></div>

                      <div
                        className="skeleton mb-4"
                        style={{
                          height: "24px",
                          width: "7%",
                          borderRadius: "20px",
                        }}
                      ></div>
                    </>
                  ) : (
                    <>
                      <p className="isfake">
                        Show app as active{" "}
                        <span className="" style={{ fontSize: "12px" }}>
                          (Enable/Disable)
                        </span>
                      </p>

                      <div>
                        <ToggleSwitch
                          onClick={() => {
                            handleSettingSwitch(setting?._id, "isAppEnabled");
                          }}
                          value={isAppActive}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 mt-3">
              <div className="settingBoxOuter">
                <div className="settingBoxHeader">
                  <h4 className="settingboxheader">
                    Screen Load Behavior Setting
                  </h4>
                  <hr style={{ width: "95%", margin: "5px 9px" }} />
                </div>
                <div
                  className="d-flex justify-content-between align-items-start"
                  style={{
                    paddingRight: "20px",
                  }}
                >
                  {roleSkeleton === true ? (
                    <>
                      <div
                        className="skeleton mb-4"
                        style={{
                          height: "24px",
                          width: "60%",
                          marginLeft: "15px",
                        }}
                      ></div>

                      <div
                        className="skeleton mb-4"
                        style={{
                          height: "24px",
                          width: "7%",
                          borderRadius: "20px",
                        }}
                      ></div>
                    </>
                  ) : (
                    <>
                      <p className="isfake">
                        Automatically reload data on screen in app{" "}
                        <span className="" style={{ fontSize: "12px" }}>
                          (Enable/Disable)
                        </span>
                      </p>

                      <div>
                        <ToggleSwitch
                          onClick={() => {
                            handleSettingSwitch(
                              setting?._id,
                              "isAutoRefreshEnabled"
                            );
                          }}
                          value={isAutoRefreshEnabled}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 mt-3">
              <div className="settingBoxOuter">
                <div className="settingBoxHeader">
                  <h4 className="settingboxheader" style={{ display: "flex" }}>
                    <span>Login Bonus Setting</span>{" "}
                    <span className="" style={{ paddingLeft: "10px" }}>
                      <div style={{ width: "30px" }}>
                        <img src={coin.src} height={25} width={25} />
                      </div>
                    </span>
                  </h4>

                  <hr style={{ width: "95%", margin: "5px 9px" }} />
                </div>
                {roleSkeleton ? (
                  <div className="mb-4">
                    {/* Label skeleton */}
                    <div
                      className="skeleton mb-2"
                      style={{
                        height: "16px",
                        width: "30%",
                        marginLeft: "15px",
                      }}
                    ></div>

                    {/* Input skeleton */}
                    <div
                      className="skeleton"
                      style={{
                        height: "40px",
                        width: "97%",
                        borderRadius: "8px",
                        marginLeft: "10px",
                      }}
                    ></div>
                  </div>
                ) : (
                  <div style={{ padding: "5px 20px 10px" }}>
                    <div className="col-12 ">
                      <ExInput
                        type={`text`}
                        id={`loginBonus`}
                        name={`loginBonus`}
                        // label={`Login Bonus`}
                        placeholder={`Login Bonus`}
                        errorMessage={error.loginBonus && error.loginBonus}
                        value={loginBonus}
                        onChange={(e: any) => {
                          setLoginBonus(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              loginBonus: `Commision Is Required`,
                            });
                          } else if (e.target.value <= 0) {
                            return setError({
                              ...error,
                              loginBonus: `login bonus can not less than 0`,
                            });
                          } else {
                            return setError({
                              ...error,
                              loginBonus: "",
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-12 col-md-6 mt-3 ">
              <div className="settingBoxOuter">
                <div className="settingBoxHeader">
                  <h4 className="settingboxheader">Call Charge Setting</h4>
                  <hr style={{ width: "95%", margin: "5px 9px" }} />
                </div>

                {roleSkeleton ? (
                  <>
                    <div
                      className="skeleton mb-4"
                      style={{
                        height: "24px",
                        width: "40%",
                        marginLeft: "15px",
                      }}
                    ></div>

                    {/* Section title: Random Call Charge */}
                    <div
                      className="skeleton mb-3"
                      style={{ height: "1px", width: "100%" }}
                    ></div>

                    {/* Male, Female, Both Inputs */}
                    <div className="row mb-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="col-4">
                          <div
                            className="skeleton mb-2"
                            style={{
                              height: "16px",
                              width: "20%",
                              marginLeft: i === 0 ? "10px" : "",
                            }}
                          ></div>
                          <div
                            className="skeleton"
                            style={{
                              height: "40px",
                              width: "95%",
                              borderRadius: "8px",
                              marginLeft: i === 0 ? "10px" : "",
                            }}
                          ></div>
                        </div>
                      ))}
                    </div>

                    {/* Section title: Private Call Charge */}
                    <div
                      className="skeleton mb-3"
                      style={{ height: "1px", width: "100%" }}
                    ></div>

                    {/* Audio, Video Inputs */}
                    <div className="row">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="col-6">
                          <div
                            className="skeleton mb-2"
                            style={{
                              height: "16px",
                              width: "20%",
                              marginLeft: i === 0 ? "10px" : "",
                            }}
                          ></div>
                          <div
                            className="skeleton"
                            style={{
                              height: "40px",
                              width: "95%",
                              borderRadius: "8px",
                              marginLeft: i === 0 ? "10px" : "",
                            }}
                          ></div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="isfake" style={{ display: "flex" }}>
                      <span>Random Call Charge</span>{" "}
                      <span className="" style={{ paddingLeft: "10px" }}>
                        <div style={{ width: "30px" }}>
                          <img src={coin.src} height={25} width={25} />
                        </div>
                      </span>
                    </p>

                    <div style={{ padding: "0px 20px 10px" }}>
                      <div className="row">
                        <div className="col-4 ">
                          <ExInput
                            type={`number`}
                            id={`maleRandomCallRate`}
                            name={`maleRandomCallRate`}
                            label={`Male`}
                            placeholder={`Male`}
                            errorMessage={
                              error.maleRandomCallRate &&
                              error.maleRandomCallRate
                            }
                            value={maleRandomCallRate}
                            onChange={(e: any) => {
                              setMaleRandomCallRate(e.target.value);
                              if (!e.target.value) {
                                return setError({
                                  ...error,
                                  maleRandomCallRate: `Male Random Call Rate is Required !`,
                                });
                              } else if (e.target.value <= 0) {
                                return setError({
                                  ...error,
                                  maleRandomCallRate: `Male Random Call Rate can not less than 0`,
                                });
                              } else {
                                return setError({
                                  ...error,
                                  maleRandomCallRate: "",
                                });
                              }
                            }}
                          />
                        </div>

                        <div className="col-4 ">
                          <ExInput
                            type={`number`}
                            id={`femalRandomCallRate`}
                            name={`femalRandomCallRate`}
                            label={`Female`}
                            placeholder={`Female`}
                            errorMessage={
                              error.femalRandomCallRate &&
                              error.femalRandomCallRate
                            }
                            value={femalRandomCallRate}
                            onChange={(e: any) => {
                              setFemaleRandomCallRate(e.target.value);
                              if (!e.target.value) {
                                return setError({
                                  ...error,
                                  femalRandomCallRate: `Female Random Call Rate is Required !`,
                                });
                              } else if (e.target.value <= 0) {
                                return setError({
                                  ...error,
                                  femalRandomCallRate: `Female Random Call Rate can not less than 0`,
                                });
                              } else {
                                return setError({
                                  ...error,
                                  femalRandomCallRate: "",
                                });
                              }
                            }}
                          />
                        </div>

                        <div className="col-4 ">
                          <ExInput
                            type={`number`}
                            id={`both`}
                            name={`both`}
                            label={`Both`}
                            placeholder={`Both`}
                            errorMessage={
                              error.generalRadomCallRate &&
                              error.generalRadomCallRate
                            }
                            value={generalRadomCallRate}
                            onChange={(e: any) => {
                              setGeneralRadomCallRate(e.target.value);
                              if (!e.target.value) {
                                return setError({
                                  ...error,
                                  generalRadomCallRate: `General Radom Call Rate is Required !`,
                                });
                              } else if (e.target.value <= 0) {
                                return setError({
                                  ...error,
                                  generalRadomCallRate: `General Random Call Rate can not less than 0`,
                                });
                              } else {
                                return setError({
                                  ...error,
                                  generalRadomCallRate: "",
                                });
                              }
                            }}
                          />
                        </div>
                      </div>

                      <p
                        className="isfake"
                        style={{ display: "flex", padding: "0px" }}
                      >
                        <span>Private Call Charge</span>{" "}
                        <span className="" style={{ paddingLeft: "10px" }}>
                          <div style={{ width: "30px" }}>
                            <img src={coin.src} height={25} width={25} />
                          </div>
                        </span>
                      </p>

                      <div className="row">
                        <div className="col-6">
                          <ExInput
                            type={`text`}
                            id={`audio`}
                            name={`audio`}
                            label={`Audio`}
                            placeholder={`Audio`}
                            errorMessage={
                              error.audioPrivateCallRate &&
                              error.audioPrivateCallRate
                            }
                            value={audioPrivateCallRate}
                            onChange={(e: any) => {
                              setAudioPrivateCallRate(e.target.value);
                              if (!e.target.value) {
                                return setError({
                                  ...error,
                                  audioPrivateCallRate: `Audio Private Call Rate Is Required !`,
                                });
                              } else if (e.target.value <= 0) {
                                return setError({
                                  ...error,
                                  audioPrivateCallRate: `Audio Private Call Rate can not less than 0`,
                                });
                              } else {
                                return setError({
                                  ...error,
                                  audioPrivateCallRate: "",
                                });
                              }
                            }}
                          />
                        </div>

                        <div className="col-6">
                          <ExInput
                            type={`text`}
                            id={`video`}
                            name={`video`}
                            label={`Video`}
                            placeholder={`Video`}
                            errorMessage={
                              error.videoPrivateCallRate &&
                              error.videoPrivateCallRate
                            }
                            value={videoPrivateCallRate}
                            onChange={(e: any) => {
                              setVideoPrivateCallRate(e.target.value);
                              if (!e.target.value) {
                                return setError({
                                  ...error,
                                  videoPrivateCallRate: `Video Private Call Rate Is Required !`,
                                });
                              } else if (e.target.value <= 0) {
                                return setError({
                                  ...error,
                                  videoPrivateCallRate: `Video Private Call Rate can not less than 0`,
                                });
                              } else {
                                return setError({
                                  ...error,
                                  videoPrivateCallRate: "",
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="col-12 col-md-6 mt-3 ">
              <div className="settingBoxOuter">
                <div className="settingBoxHeader">
                  <h4 className="settingboxheader">Chat Setting</h4>
                  <hr style={{ width: "95%", margin: "5px 9px" }} />
                </div>
                {roleSkeleton ? (
                  <>
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div key={index} className="mb-4">
                        {/* Label skeleton */}
                        <div
                          className="skeleton mb-3"
                          style={{
                            height: "24px",
                            width: "40%",
                            marginLeft: "15px",
                          }}
                        ></div>

                        {/* Input skeleton */}
                        <div
                          className="skeleton"
                          style={{
                            height: "40px",
                            width: "97%",
                            borderRadius: "8px",
                            marginLeft: "10px",
                          }}
                        ></div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ padding: "0px 20px 10px" }}>
                    <div className="col-12 ">
                      <ExInput
                        type={`number`}
                        id={`maxfreechatmsg`}
                        name={`maxfreechatmsg`}
                        label={`Maximum Free Chat Message (User)`}
                        placeholder={`Maximum Free Chat Message (User)`}
                        errorMessage={
                          error.maxFreeChatMessages && error.maxFreeChatMessages
                        }
                        value={maxFreeChatMessages}
                        onChange={(e: any) => {
                          setMaxFreeChatMessages(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              maxFreeChatMessages: `Maximum Free Chat Message is required !`,
                            });
                          } else if (e.target.value <= 0) {
                            return setError({
                              ...error,
                              maxFreeChatMessages: `Max free chat message can not less than 0`,
                            });
                          } else {
                            return setError({
                              ...error,
                              maxFreeChatMessages: "",
                            });
                          }
                        }}
                      />
                    </div>

                    <div className="col-12 ">
                      <ExInput
                        type={`number`}
                        id={`chatInteractionRate`}
                        name={`chatInteractionRate`}
                        // label={`Chat Interaction Rate ${coin image}`}
                        label={
                          <span>
                            Chat Interaction Rate{" "}
                            <img
                              src={coin.src} // or import coin from '@/assets/coin.png' and use coin.src
                              alt="coin"
                              style={{
                                width: 20,
                                height: 20,
                                verticalAlign: "middle",
                              }}
                            />
                          </span>
                        }
                        placeholder={`Chat Interaction Rate`}
                        errorMessage={
                          error.chatInteractionRate && error.chatInteractionRate
                        }
                        value={chatInteractionRate}
                        onChange={(e: any) => {
                          setChatInteractionRate(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              chatInteractionRate: `Chat Interaction Rate Is Required !`,
                            });
                          } else if (e.target.value <= 0) {
                            return setError({
                              ...error,
                              chatInteractionRate: `chat interaction rate can not less than 0`,
                            });
                          } else {
                            return setError({
                              ...error,
                              chatInteractionRate: "",
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-12 col-md-6 mt-3 ">
              <div className="settingBoxOuter">
                <div className="settingBoxHeader">
                  <h4 className="settingboxheader">Coin Setting</h4>
                  <hr style={{ width: "95%", margin: "5px 9px" }} />
                </div>
                {roleSkeleton ? (
                  <>
                    <div
                      className="row align-items-center mb-4"
                      style={{ marginLeft: "5px" }}
                    >
                      <div className="col-5">
                        <div
                          className="skeleton mb-2"
                          style={{ height: "18px", width: "80%" }}
                        ></div>
                        <div
                          className="skeleton"
                          style={{
                            height: "40px",
                            borderRadius: "8px",
                            width: "100%",
                          }}
                        ></div>
                      </div>

                      {/* Equal symbol spacing */}
                      <div className="col-1 d-flex justify-content-center">
                        <div style={{ fontSize: "24px", opacity: 0.4 }}>=</div>
                      </div>

                      <div className="col-5">
                        <div
                          className="skeleton mb-2"
                          style={{ height: "18px", width: "80%" }}
                        ></div>
                        <div
                          className="skeleton"
                          style={{
                            height: "40px",
                            borderRadius: "8px",
                            width: "100%",
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Admin Commission Charge */}
                    <div className="mt-2 mb-2">
                      <div
                        className="skeleton mb-2"
                        style={{
                          height: "18px",
                          width: "60%",
                          marginLeft: "10px",
                        }}
                      ></div>
                      <div
                        className="skeleton"
                        style={{
                          height: "40px",
                          width: "97%",
                          borderRadius: "8px",
                          marginLeft: "10px",
                        }}
                      ></div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "0px 20px 10px" }}>
                    <div className="row">
                      <div className="col-6 d-flex align-items-center">
                        <ExInput
                          type={`text`}
                          id={`amount`}
                          name={`amount`}
                          label={`Amount (${defaultCurrency?.symbol})`}
                          placeholder={`Amount`}
                          errorMessage={error.agoraAppId && error.agoraAppId}
                          readOnly={true}
                          value={`1 `}
                        />
                        <span
                          className="d-block mt-4"
                          style={{
                            marginLeft: "20px",
                          }}
                        >
                          =
                        </span>
                      </div>

                      <div
                        className="col-6"
                        style={{
                          paddingLeft: "0px",
                        }}
                      >
                        <ExInput
                          type={`number`}
                          id={`coin`}
                          name={`coin`}
                          label={`Coin (how many coins for withdrawal)`}
                          placeholder={`Coin (how many coins for withdrawal)`}
                          errorMessage={
                            error.minCoinsToConvert && error.minCoinsToConvert
                          }
                          value={minCoinsToConvert}
                          onChange={(e: any) => {
                            setMinCoinsToConvert(e.target.value);
                            if (!e.target.value) {
                              return setError({
                                ...error,
                                minCoinsToConvert: `Minimum Coin For Withdrawal Is Required`,
                              });
                            } else if (e.target.value <= 0) {
                              return setError({
                                ...error,
                                minCoinsToConvert: `Minimum coin for withdrawal can not less than 0`,
                              });
                            } else {
                              return setError({
                                ...error,
                                minCoinsToConvert: "",
                              });
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <ExInput
                        type={`number`}
                        id={`admincommissioncharge`}
                        name={`admincommissioncharge`}
                        label={`Admin Commission Charge (%)`}
                        placeholder={`Admin Commission Charge (%)`}
                        errorMessage={
                          error.adminCommissionRate && error.adminCommissionRate
                        }
                        value={adminCommissionRate}
                        onChange={(e: any) => {
                          setAdminCommissionRate(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              adminCommissionRate: `Admin Commission Charge is Required !`,
                            });
                          } else if (e.target.value > 100) {
                            return setError({
                              ...error,
                              adminCommissionRate: `Admin Commission Charge can not greater than 100`,
                            });
                          } else if (e.target.value <= 0) {
                            return setError({
                              ...error,
                              adminCommissionRate: `Admin Commission Charge can not less than 0`,
                            });
                          } else {
                            return setError({
                              ...error,
                              adminCommissionRate: "",
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-12 col-md-6 mt-3">
              <div className="settingBoxOuter">
                <div>
                  <h4 className="settingboxheader">
                    Firebase Notification Setting
                  </h4>
                  <hr style={{ width: "95%", margin: "5px 9px" }} />
                </div>
                {roleSkeleton ? (
                  <>
                    <div
                      className="skeleton mb-2"
                      style={{
                        height: "16px",
                        width: "30%",
                        marginLeft: "15px",
                      }}
                    ></div>

                    {/* Simulated Textarea */}
                    <div
                      className="skeleton mb-2"
                      style={{
                        height: "180px",
                        width: "98%",
                        borderRadius: "8px",
                        marginLeft: "auto",
                        marginRight: "auto",
                      }}
                    ></div>
                  </>
                ) : (
                  <div style={{ padding: "0px 20px 10px" }}>
                    <div className="col-12 ">
                      <Textarea
                        row={9}
                        type={`text`}
                        id={`firebaseKey`}
                        name={`firebaseKey`}
                        label={`Private key JSON`}
                        placeholder={`Enter firebaseKey`}
                        errorMessage={
                          error.firebaseKeyText && error.firebaseKeyText
                        }
                        // value={firebaseKeyText}
                        value={firebaseKeyText}
                        onChange={(e: any) => {
                          setFirebaseKeyText(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              firebaseKeyText: `Private Key Is Required`,
                            });
                          } else {
                            return setError({
                              ...error,
                              firebaseKeyText: "",
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-12 col-md-6 mt-3">
              <div className="settingBoxOuter">
                <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
                  <h4 className="settingboxheader">Agora Setting</h4>
                  <InfoTooltip title={"Agora"} content={agoracontent} />
                </div>
                <hr style={{ width: "95%", margin: "5px 9px" }} />
                {roleSkeleton ? (
                  <>
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div key={index} className="mb-4">
                        {/* Label skeleton */}
                        <div
                          className="skeleton mb-2"
                          style={{
                            height: "16px",
                            width: "30%",
                            marginLeft: "15px",
                          }}
                        ></div>

                        {/* Input skeleton */}
                        <div
                          className="skeleton"
                          style={{
                            height: "40px",
                            width: "97%",
                            borderRadius: "8px",
                            marginLeft: "10px",
                          }}
                        ></div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ padding: "0px 20px 10px" }}>
                    <div className="col-12 ">
                      <ExInput
                        type={`text`}
                        id={`agoraAppId`}
                        name={`agoraAppId`}
                        label={`Agoraapp id`}
                        placeholder={`Agora AppId`}
                        errorMessage={error.agoraAppId && error.agoraAppId}
                        value={agoraAppId}
                        onChange={(e: any) => {
                          setAgoraAppId(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              agoraAppId: `AgoraappId Is Required`,
                            });
                          } else {
                            return setError({
                              ...error,
                              agoraAppId: "",
                            });
                          }
                        }}
                      />
                    </div>

                    <div className="col-12 ">
                      <ExInput
                        type={`text`}
                        id={`agoraAppCertificate`}
                        name={`agoraAppCertificate`}
                        label={`Agoraapp certificate`}
                        placeholder={`Agoraapp certificate`}
                        errorMessage={
                          error.agoraAppCertificate && error.agoraAppCertificate
                        }
                        value={agoraAppCertificate}
                        onChange={(e: any) => {
                          setAgoraAppCertificate(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              agoraAppCertificate: `AgoraApp SignIn Is Required`,
                            });
                          } else {
                            return setError({
                              ...error,
                              agoraAppCertificate: "",
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-12 col-md-6 mt-3">
              <div className="settingBoxOuter">
                <div className="settingBoxHeader">
                  <h4 className="settingboxheader">
                    Auto Call & Message Setting
                  </h4>
                  <hr style={{ width: "95%", margin: "5px 9px" }} />
                </div>
                {roleSkeleton ? (
                  <>
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div key={index} className="mb-4">
                        {/* Label skeleton */}
                        <div
                          className="skeleton mb-2"
                          style={{
                            height: "16px",
                            width: "30%",
                            marginLeft: "15px",
                          }}
                        ></div>

                        {/* Input skeleton */}
                        <div
                          className="skeleton"
                          style={{
                            height: "40px",
                            width: "97%",
                            borderRadius: "8px",
                            marginLeft: "10px",
                          }}
                        ></div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ padding: "0px 20px 10px" }}>
                    <div className="col-12 ">
                      <ExInput
                        type={`text`}
                        id={`messageInitiatedAt`}
                        name={`messageInitiatedAt`}
                        label={`Message Initiat Time (In Minutes)`}
                        placeholder={`Message Initiat`}
                        errorMessage={
                          error.messageInitiatedAt && error.messageInitiatedAt
                        }
                        value={messageInitiatedAt}
                        onChange={(e: any) => {
                          setMessageInitiatedAt(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              messageInitiatedAt: `Message Initiat Time Is Required !`,
                            });
                          } else {
                            return setError({
                              ...error,
                              messageInitiatedAt: "",
                            });
                          }
                        }}
                      />
                    </div>

                    <div className="col-12 ">
                      <ExInput
                        type={`text`}
                        id={`callInitiatedAt`}
                        name={`callInitiatedAt`}
                        label={`Call Initiat Time (In Minutes)`}
                        placeholder={`Call Initiat`}
                        errorMessage={
                          error.callInitiatedAt && error.callInitiatedAt
                        }
                        value={callInitiatedAt}
                        onChange={(e: any) => {
                          setCallInitiatedAt(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              callInitiatedAt: `Call Initiat Time Is Required !`,
                            });
                          } else {
                            return setError({
                              ...error,
                              callInitiatedAt: "",
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AdminSetting;
