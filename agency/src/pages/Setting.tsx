import RootLayout from "@/component/layout/Layout";
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
import rootShouldForwardProp from "@mui/material/styles/rootShouldForwardProp";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import coin from "@/assets/images/coin.png";

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
  chatInteractionRate: any;
  maleRandomCallRate: any;
  femaleRandomCallRate: any;
  generalRadomCallRate: any;
  audioPrivateCallRate: any;
  videoPrivateCallRate: any;
}

const Setting = () => {
  const { setting }: any = useSelector((state: RootStore) => state?.setting);
  console.log("setting", setting);

  

  const roleSkeleton = useSelector(isSkeleton);

  const [chatInteractionRate, setChatInteractionRate] = useState<any>();
  const [maleRandomCallRate, setMaleRandomCallRate] = useState<any>("");
  const [femaleRandomCallRate, setFemaleRandomCallRate] = useState<any>("");
  const [generalRadomCallRate, setGeneralRadomCallRate] = useState<any>("");
  const [audioPrivateCallRate, setAudioPrivateCallRate] = useState<any>("");
  const [videoPrivateCallRate, setVideoPrivateCallRate] = useState<any>("");

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
    chatInteractionRate: "",
    maleRandomCallRate: "",
    femaleRandomCallRate: "",
    generalRadomCallRate: "",
    audioPrivateCallRate: "",
    videoPrivateCallRate: "",
  });

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getSetting());
  }, [dispatch]);

  useEffect(() => {
    // dispatch(getDefaultCurrency())
  }, []);

  useEffect(() => {
    setData(setting);
  }, [setting]);

  useEffect(() => {
    
      setChatInteractionRate(setting?.chatInteractionRate);
      setMaleRandomCallRate(setting?.maleRandomCallRate);
      setFemaleRandomCallRate(setting?.femaleRandomCallRate);
      setGeneralRadomCallRate(setting?.generalRandomCallRate);
      setAudioPrivateCallRate(setting?.audioPrivateCallRate);
      setVideoPrivateCallRate(setting?.videoPrivateCallRate);
    
  }, [setting]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    
    if (
      !chatInteractionRate ||
      chatInteractionRate <= 0 ||
      !maleRandomCallRate ||
      maleRandomCallRate <= 0 ||
      !femaleRandomCallRate ||
      femaleRandomCallRate <= 0 ||
      !generalRadomCallRate ||
      generalRadomCallRate <= 0 ||
      !audioPrivateCallRate ||
      audioPrivateCallRate <= 0 ||
      !videoPrivateCallRate ||
      videoPrivateCallRate <= 0
    ) {
      {
        let error = {} as ErrorState;

        if (!chatInteractionRate) {
          error.chatInteractionRate = "Chat Interaction Rate is Required!";
        } else if (chatInteractionRate <= 0) {
          error.chatInteractionRate =
            "Chat Interaction Rate must be greater than 0!";
        }

        if (!maleRandomCallRate) {
          error.maleRandomCallRate = "Male Random Call Rate is Required!";
        } else if (maleRandomCallRate <= 0) {
          error.maleRandomCallRate =
            "Male Random Call Rate must be greater than 0!";
        }

        if (!femaleRandomCallRate) {
          error.femaleRandomCallRate = "Female Random Call Rate is Required!";
        } else if (femaleRandomCallRate <= 0) {
          error.femaleRandomCallRate =
            "Female Random Call Rate must be greater than 0!";
        }

        if (!generalRadomCallRate) {
          error.generalRadomCallRate = "General Random Call Rate is Required!";
        } else if (generalRadomCallRate <= 0) {
          error.generalRadomCallRate =
            "General Random Call Rate must be greater than 0!";
        }

        if (!audioPrivateCallRate) {
          error.audioPrivateCallRate = "Audio Private Call Rate is Required!";
        } else if (audioPrivateCallRate <= 0) {
          error.audioPrivateCallRate =
            "Audio Private Call Rate must be greater than 0!";
        }

        if (!videoPrivateCallRate) {
          error.videoPrivateCallRate = "Video Private Call Rate is Required!";
        } else if (videoPrivateCallRate <= 0) {
          error.videoPrivateCallRate =
            "Video Private Call Rate must be greater than 0!";
        }

        return setError({ ...error });
      }
    } else {
      let settingDataSubmit = {
        chatInteractionRate: parseInt(chatInteractionRate),
        audioPrivateCallRate: parseInt(audioPrivateCallRate),
        videoPrivateCallRate: parseInt(videoPrivateCallRate),
        maleRandomCallRate: parseInt(maleRandomCallRate),
        femaleRandomCallRate: parseInt(femaleRandomCallRate),
        generalRandomCallRate: parseInt(generalRadomCallRate),
      };

      const payload = {
        settingId: data?._id,
        settingDataSubmit,
      };

      dispatch(updateSetting(payload));
    }
  };

  return (
    <div className="mainSetting">
      <form onSubmit={handleSubmit} id="expertForm">
        <div className="d-flex justify-content-between align-items-center">
          <div
            className="col-12 col-lg-6 col-md-6 col-sm-12 textcommonclass fs-20  fw-600 "
            style={{ color: "#404040" }}
          ></div>
          {/* <div className="formFooter">
            <Button
              type={`submit`}
              className={`text-light m10-left fw-bold`}
              text={`Submit`}
              style={{ backgroundColor: "#9f5aff" }}
            />
          </div> */}
        </div>
        <div className="settingBox row">
          <div className="col-12 col-md-12 col-lg-6 mt-3 ">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader">
                <h4 className="settingboxheader">Call Charge Setting</h4>
              </div>
              {roleSkeleton ? (
                <>
                  <div
                    className="skeleton mb-4"
                    style={{ height: "24px", width: "40%", marginLeft: "15px" }}
                  ></div>

                  {/* Section title: Random Call Charge */}
                  {/* <div className="skeleton mb-3" style={{ height: "1px", width: "100%" }}></div> */}

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
                  {/* <div className="skeleton mb-3" style={{ height: "1px", width: "100%" }}></div> */}

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
                  {/* <p className="charge">Random Call Charge</p> */}
                  <p className="charge" style={{ display: "flex" }}>
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
                          disabled  
                          errorMessage={
                            error.maleRandomCallRate && error.maleRandomCallRate
                          }
                          value={maleRandomCallRate}
                          // onChange={(e: any) => {
                          //   setMaleRandomCallRate(e.target.value);
                          //   if (!e.target.value) {
                          //     return setError({
                          //       ...error,
                          //       maleRandomCallRate: `Male Random Call Rate is Required !`,
                          //     });
                          //   } else if (e.target.value < 0) {
                          //     return setError({
                          //       ...error,
                          //       maleRandomCallRate:
                          //         "Male random call rate can not less than 0",
                          //     });
                          //   } else {
                          //     return setError({
                          //       ...error,
                          //       maleRandomCallRate: "",
                          //     });
                          //   }
                          // }}
                        />
                      </div>

                      <div className="col-4 ">
                        <ExInput
                          type={`number`}
                          id={`femaleRandomCallRate`}
                          name={`femaleRandomCallRate`}
                          label={`Female`}
                          placeholder={`Female`}
                          disabled  
                          errorMessage={
                            error.femaleRandomCallRate &&
                            error.femaleRandomCallRate
                          }
                          value={femaleRandomCallRate}
                          // onChange={(e: any) => {
                          //   setFemaleRandomCallRate(e.target.value);
                          //   if (!e.target.value) {
                          //     return setError({
                          //       ...error,
                          //       femaleRandomCallRate: `Female Random Call Rate is Required !`,
                          //     });
                          //   } else if (e.target.value < 0) {
                          //     return setError({
                          //       ...error,
                          //       femaleRandomCallRate:
                          //         "Female random call rate can not less than 0",
                          //     });
                          //   } else {
                          //     return setError({
                          //       ...error,
                          //       femaleRandomCallRate: "",
                          //     });
                          //   }
                          // }}
                        />
                      </div>

                      <div className="col-4 ">
                        <ExInput
                          type={`number`}
                          id={`both`}
                          name={`both`}
                          label={`Both`}
                          disabled  
                          placeholder={`Both`}
                          errorMessage={
                            error.generalRadomCallRate &&
                            error.generalRadomCallRate
                          }
                          value={generalRadomCallRate}
                          // onChange={(e: any) => {
                          //   setGeneralRadomCallRate(e.target.value);
                          //   if (!e.target.value) {
                          //     return setError({
                          //       ...error,
                          //       generalRadomCallRate: `General Radom Call Rate is Required !`,
                          //     });
                          //   } else if (e.target.value < 0) {
                          //     return setError({
                          //       ...error,
                          //       generalRadomCallRate:
                          //         "General random call rate can not less than 0",
                          //     });
                          //   } else {
                          //     return setError({
                          //       ...error,
                          //       generalRadomCallRate: "",
                          //     });
                          //   }
                          // }}
                        />
                      </div>
                    </div>

                    {/* <p className="charge" style={{ paddingLeft: "0px" }}></p> */}
                    <p
                      className="charge"
                      style={{ display: "flex", paddingLeft: "0px" }}
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
                          disabled  
                          placeholder={`Audio`}
                          errorMessage={
                            error.audioPrivateCallRate &&
                            error.audioPrivateCallRate
                          }
                          value={audioPrivateCallRate}
                          // onChange={(e: any) => {
                          //   setAudioPrivateCallRate(e.target.value);
                          //   if (!e.target.value) {
                          //     return setError({
                          //       ...error,
                          //       audioPrivateCallRate: `Audio Private Call Rate Is Required !`,
                          //     });
                          //   } else if (e.target.value < 0) {
                          //     return setError({
                          //       ...error,
                          //       audioPrivateCallRate:
                          //         "Audio private call rate can not less than 0",
                          //     });
                          //   } else {
                          //     return setError({
                          //       ...error,
                          //       audioPrivateCallRate: "",
                          //     });
                          //   }
                          // }}
                        />
                      </div>

                      <div className="col-6">
                        <ExInput
                          type={`text`}
                          id={`video`}
                          name={`video`}
                          label={`Video`}
                          disabled  
                          placeholder={`Video`}
                          errorMessage={
                            error.videoPrivateCallRate &&
                            error.videoPrivateCallRate
                          }
                          value={videoPrivateCallRate}
                          // onChange={(e: any) => {
                          //   setVideoPrivateCallRate(e.target.value);
                          //   if (!e.target.value) {
                          //     return setError({
                          //       ...error,
                          //       videoPrivateCallRate: `Video Private Call Rate Is Required !`,
                          //     });
                          //   } else if (e.target.value < 0) {
                          //     return setError({
                          //       ...error,
                          //       videoPrivateCallRate:
                          //         "Video private call rate can not less than 0",
                          //     });
                          //   } else {
                          //     return setError({
                          //       ...error,
                          //       videoPrivateCallRate: "",
                          //     });
                          //   }
                          // }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="col-12 col-md-12 mt-3 col-lg-6">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader">
                <h4 className="settingboxheader">Chat Setting</h4>
              </div>
              {roleSkeleton ? (
                <>
                  <div
                    className="skeleton mb-4"
                    style={{ height: "24px", width: "40%", marginLeft: "15px" }}
                  ></div>

                  <div
                    className="skeleton mb-3"
                    style={{
                      height: "40px",
                      width: "97%",
                      borderRadius: "8px",
                      marginLeft: "10px",
                    }}
                  ></div>
                </>
              ) : (
                <div style={{ padding: "0px 20px 10px" }}>
                  <div className="col-12 ">
                    <ExInput
                      type={`number`}
                      id={`chatInteractionRate`}
                      name={`chatInteractionRate`}
                      // label={`Chat Interaction Rate`}
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
                      disabled  
                      placeholder={`Chat Interaction Rate`}
                      errorMessage={
                        error.chatInteractionRate && error.chatInteractionRate
                      }
                      value={chatInteractionRate}
                      // onChange={(e: any) => {
                      //   setChatInteractionRate(e.target.value);
                      //   if (!e.target.value) {
                      //     return setError({
                      //       ...error,
                      //       chatInteractionRate: `Chat Interaction Rate Is Required !`,
                      //     });
                      //   } else if (e.target.value < 0) {
                      //     return setError({
                      //       ...error,
                      //       chatInteractionRate:
                      //         "Chat interaction rate can not less than 0",
                      //     });
                      //   } else {
                      //     return setError({
                      //       ...error,
                      //       chatInteractionRate: "",
                      //     });
                      //   }
                      // }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

Setting.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default Setting;
