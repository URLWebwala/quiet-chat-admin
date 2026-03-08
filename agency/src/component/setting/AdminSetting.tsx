import Button from "@/extra/Button";
import { ExInput, Textarea } from "@/extra/Input";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { getDefaultCurrency, getSetting, handleSetting, updateSetting } from "@/store/settingSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

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
}

const AdminSetting = () => {
  const { setting }: any = useSelector((state: RootStore) => state?.setting);


  

  const [chatInteractionRate, setChatInteractionRate] = useState();
  const [maxFreeChatMessages, setMaxFreeChatMessages] = useState();
  const [maleRandomCallRate, setMaleRandomCallRate] = useState("");
  const [femalRandomCallRate, setFemaleRandomCallRate] = useState("");
  const [generalRadomCallRate, setGeneralRadomCallRate] = useState("");
  const [audioPrivateCallRate, setAudioPrivateCallRate] = useState("");
  const [videoPrivateCallRate, setVideoPrivateCallRate] = useState("");


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
    videoPrivateCallRate: ""
  });

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getSetting());
  }, [dispatch]);



  useEffect(() => {
    setData(setting);
  }, [setting]);

  useEffect(() => {
    setMaxFreeChatMessages(setting?.maxFreeChatMessages);
    setChatInteractionRate(setting?.chatInteractionRate);
    setMaleRandomCallRate(setting?.maleRandomCallRate);
    setFemaleRandomCallRate(setting?.maleRandomCallRate);
    setGeneralRadomCallRate(setting?.generalRandomCallRate);
    setAudioPrivateCallRate(setting?.audioPrivateCallRate);
    setVideoPrivateCallRate(setting?.videoPrivateCallRate);
  }, [setting]);

  const handleSettingSwitch: any = (id: any, type: any) => {
    const payload = {
      settingId: id,
      type: type,
    };
    dispatch(handleSetting(payload));
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    
    if (

      !maxFreeChatMessages ||
      !chatInteractionRate ||
      !maleRandomCallRate ||
      !femalRandomCallRate ||
      !generalRadomCallRate ||
      !audioPrivateCallRate ||
      !videoPrivateCallRate
    ) {
      {
        let error = {} as ErrorState;
        if (!maxFreeChatMessages) error.maxFreeChatMessages = "Maximum Free Chat Message is Required !"

        if (!chatInteractionRate) error.chatInteractionRate = "Chat Interaction Rate is Required !"

        if (!maleRandomCallRate) error.maleRandomCallRate = "Male Radom Call Rate is Required !"

        if (!femalRandomCallRate) error.femalRandomCallRate = "Female Radnom Call Rate is Required !"

        if (!generalRadomCallRate) error.generalRadomCallRate = "Genral Radnom Call Rate is Required !"

        if (!audioPrivateCallRate) error.audioPrivateCallRate = "Audio Private Call Rate is Required !"

        if (!videoPrivateCallRate) error.videoPrivateCallRate = "Video Private Call Rate is Required !"

        return setError({ ...error });
      }
    } else {
      let settingDataSubmit = {

        maxFreeChatMessages : parseInt(maxFreeChatMessages),
        chatInteractionRate,
        audioPrivateCallRate,
        videoPrivateCallRate,
        maleRandomCallRate,
        femalRandomCallRate,
        generalRandomCallRate: generalRadomCallRate
      };

      const payload = {
        settingId: data?._id,
        settingDataSubmit
      }

      dispatch(updateSetting(payload));
    }
  };

  return (
    <div className="mainSetting">
      <form onSubmit={handleSubmit} id="expertForm">
        <div className=" d-flex justify-content-end">
          <div className="  formFooter">
            <Button
              type={`submit`}
              className={`text-light m10-left fw-bold`}
              text={`Submit`}
              style={{ backgroundColor: "#1ebc1e" }}
            />
          </div>
        </div>
        <div className="settingBox row">

    
          <div className="col-12 col-md-6 mt-3 ">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader">
                <h4 className="settingboxheader">Call Charge Setting</h4>
              </div>


              <p className="charge">Random Call Charge</p>

              <div style={{ padding: "0px 20px 10px" }}>

                <div className="row">
                  <div className="col-4 ">
                    <ExInput
                      type={`number`}
                      id={`maleRandomCallRate`}
                      name={`maleRandomCallRate`}
                      label={`Male`}
                      placeholder={`Male`}
                      errorMessage={error.maleRandomCallRate && error.maleRandomCallRate}
                      value={maleRandomCallRate}
                      onChange={(e: any) => {
                        setMaleRandomCallRate(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            maleRandomCallRate: `Male Random Call Rate is Required !`,
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
                      errorMessage={error.femalRandomCallRate && error.femalRandomCallRate}
                      value={femalRandomCallRate}
                      onChange={(e: any) => {
                        setFemaleRandomCallRate(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            femalRandomCallRate: `Female Random Call Rate is Required !`,
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
                      errorMessage={error.generalRadomCallRate && error.generalRadomCallRate}
                      value={generalRadomCallRate}
                      onChange={(e: any) => {
                        setGeneralRadomCallRate(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            generalRadomCallRate: `General Radom Call Rate is Required !`,
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

                <p className="charge" style={{ paddingLeft: "0px" }}>Private Call Charge</p>

                <div className="row">
                  <div className="col-6">
                    <ExInput
                      type={`text`}
                      id={`audio`}
                      name={`audio`}
                      label={`Audio`}
                      placeholder={`Audio`}
                      errorMessage={error.audioPrivateCallRate && error.audioPrivateCallRate}
                      value={audioPrivateCallRate}
                      onChange={(e: any) => {
                        setAudioPrivateCallRate(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            audioPrivateCallRate: `Audio Private Call Rate Is Required !`,
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
                      errorMessage={error.videoPrivateCallRate && error.videoPrivateCallRate}
                      value={videoPrivateCallRate}
                      onChange={(e: any) => {
                        setVideoPrivateCallRate(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            videoPrivateCallRate: `Video Private Call Rate Is Required !`,
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
            </div>
          </div>

          <div className="col-12 col-md-6 mt-3 ">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader">
                <h4 className="settingboxheader">Chat Setting</h4>
              </div>
              <div style={{ padding: "0px 20px 10px" }}>
                <div className="col-12 ">
                  <ExInput
                    type={`number`}
                    id={`maxfreechatmsg`}
                    name={`maxfreechatmsg`}
                    label={`Maximum Free Chat Message (User)`}
                    placeholder={`Maximum Free Chat Message (User)`}
                    errorMessage={error.maxFreeChatMessages && error.maxFreeChatMessages}
                    value={maxFreeChatMessages}
                    onChange={(e: any) => {
                      setMaxFreeChatMessages(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          maxFreeChatMessages: `Maximum Free Chat Message is required !`,
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
                    label={`Chat Interaction Rate`}
                    placeholder={`Chat Interaction Rate`}
                    errorMessage={error.chatInteractionRate && error.chatInteractionRate}
                    value={chatInteractionRate}
                    onChange={(e: any) => {
                      setChatInteractionRate(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          chatInteractionRate: `Chat Interaction Rate Is Required !`,
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
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default AdminSetting;
