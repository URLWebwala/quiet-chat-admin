import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootStore, useAppDispatch } from "@/store/store";
import { closeDialog } from "@/store/dialogSlice";
import { ExInput } from "@/extra/Input";
import Button from "@/extra/Button";

import { hostRequestDeclined } from "@/store/hostRequestSlice";
import { createImpression, updateImpression } from "@/store/impressionSlice";
import { createCoinPlan, updateCoinPlan } from "@/store/coinPlanSlice";
import {
  createVipPlan,
  updateVipPlan,
  updateVipPlanBenefits,
} from "@/store/vipPlanSlice";
import { getDefaultCurrency } from "@/store/settingSlice";
import { baseURL } from "@/utils/config";

interface ErrorState {
  coin: string;
  bonusCoin: string;
  price: string;
  validity: string;
  validityType: string;
  audioCallDiscount: string;
  videoCallDiscount: string;
  randomMatchCallDiscount: string;
  topUpCoinBonus: string;
  image: string;
  freeMessages: string;
}

const VipPlanBenefitDialog = () => {
  const { dialogueData } = useSelector((state: RootStore) => state.dialogue);
  
  const dispatch = useAppDispatch();
  const [audioCallDiscount, setAudioCallDiscount] = useState<any>();
  const [videoCallDiscount, setVideoCallDiscount] = useState<any>();
  const [randomMatchCallDiscount, setRandomMatchCallDiscount] = useState<any>();
  const [topUpCoinBonus, setTopUpCoinBonus] = useState<any>();
  const [image, setImage] = useState<any>();
  const [imagePath, setImagePath] = useState<any>();
  const [freeMessages, setFreeMessages] = useState("");

  const [error, setError] = useState({
    audioCallDiscount: "",
    videoCallDiscount: "",
    randomMatchCallDiscount: "",
    image: "",
    topUpCoinBonus: "",
    freeMessages: "",
  });

  useEffect(() => {
    if (dialogueData) {
      setVideoCallDiscount(dialogueData?.videoCallDiscount);
      setRandomMatchCallDiscount(dialogueData?.randomMatchCallDiscount);
      setImagePath(baseURL + dialogueData?.vipFrameBadge);
      setAudioCallDiscount(dialogueData?.audioCallDiscount);
      setTopUpCoinBonus(dialogueData?.topUpCoinBonus);
      setFreeMessages(dialogueData?.freeMessages);
    }
  }, [dialogueData]);

  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (
      !audioCallDiscount ||
      audioCallDiscount <= 0 ||
      audioCallDiscount > 100 ||
      !videoCallDiscount ||
      videoCallDiscount <= 0 ||
      videoCallDiscount > 100 ||
      !randomMatchCallDiscount ||
      randomMatchCallDiscount <= 0 ||
      randomMatchCallDiscount > 100 ||
      !topUpCoinBonus ||
      !freeMessages
    ) {
      let error = {} as ErrorState;

      if (!audioCallDiscount)
        error.audioCallDiscount = "Audio Call Discount is Required";
      if (audioCallDiscount <= 0)
        error.audioCallDiscount =
          "Audio Call Discount can not less than or equal to 0";
      if (audioCallDiscount > 100)
        error.audioCallDiscount =
          "Audio Call Discount can not greater than 100";

      if (!videoCallDiscount)
        error.videoCallDiscount = "Video Call Discount is Required";
      if (videoCallDiscount <= 0)
        error.videoCallDiscount =
          "Video Call Discount can not less than or equal to 0";
      if (videoCallDiscount > 100)
        error.videoCallDiscount =
          "Video Call Discount can not greater than 100";

      if (!randomMatchCallDiscount)
        error.randomMatchCallDiscount =
          "Random Match Call Discount is Required";
      if (randomMatchCallDiscount <= 0)
        error.randomMatchCallDiscount =
          "Random Match Call Discount can not less than or equal to 0";
      if (randomMatchCallDiscount > 100)
        error.randomMatchCallDiscount =
          "Random Match Call Discount can not greater than 100";

      if (!topUpCoinBonus)
        error.topUpCoinBonus = "Top Up Coin Bonus is Required";
      if (!freeMessages) error.freeMessages = "Free Message is Required";
      return setError({ ...error });
    } else {
      const formData = new FormData();

      formData.append("audioCallDiscount", String(audioCallDiscount));
      formData.append("videoCallDiscount", String(videoCallDiscount));
      formData.append(
        "randomMatchCallDiscount",
        String(randomMatchCallDiscount)
      );
      formData.append("topUpCoinBonus", String(topUpCoinBonus));
      formData.append("freeMessages", String(freeMessages));

      if (image) {
        formData.append("vipFrameBadge", image);
      }

      dispatch(updateVipPlanBenefits(formData));
      dispatch(closeDialog());
    }
  };

  const handleInputImage = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      setImage(e?.target?.files[0]);
      setImagePath(URL.createObjectURL(e.target.files[0]));
      setError({ ...error, image: "" });
    }
  };

  return (
    <div className="dialog">
      <div className="w-100">
        <div className="row justify-content-center">
          <div className="col-xl-3 col-md-4 col-11">
            <div className="mainDiaogBox" style={{ width: "600px" }}>
              <div className="row justify-content-between align-items-center formHead">
                <div className="col-8">
                  <h4 className="text-theme m0"> Vip Plan Benefits</h4>
                </div>
                <div className="col-4">
                  <div
                    className="closeButton"
                    onClick={() => {
                      dispatch(closeDialog());
                    }}
                    style={{ fontSize: "20px" }}
                  >
                    ✖
                  </div>
                </div>
              </div>
              <form id="expertForm">
                <div className="row align-items-start formBody">
                  <div className="col-6">
                    <ExInput
                      type={`number`}
                      id={`audioCallDiscount`}
                      name={`audioCallDiscount`}
                      value={audioCallDiscount}
                      label={`Audio Call Discount (%)`}
                      placeholder={`Audio Call Discount (%)`}
                      errorMessage={
                        error.audioCallDiscount && error.audioCallDiscount
                      }
                      onChange={(e: any) => {
                        setAudioCallDiscount(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            audioCallDiscount:
                              "audioCallDiscount is Required !",
                          });
                        } else if (e.target.value > 100) {
                          return setError({
                            ...error,
                            audioCallDiscount:
                              "Audio Call Discount can not greater than 100",
                          });
                        } else if (e.target.value <= 0) {
                          return setError({
                            ...error,
                            audioCallDiscount:
                              "Audio Call Discount can not less than or equal to 0",
                          });
                        } else {
                          setError({
                            ...error,
                            audioCallDiscount: "",
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="col-6">
                    <ExInput
                      type={`number`}
                      id={`videoCallDiscount`}
                      name={`videoCallDiscount`}
                      value={videoCallDiscount}
                      label={`Video Call Discount (%)`}
                      placeholder={`Video Call Discount (%)`}
                      errorMessage={
                        error.videoCallDiscount && error.videoCallDiscount
                      }
                      onChange={(e: any) => {
                        setVideoCallDiscount(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            videoCallDiscount:
                              "videoCallDiscount is Required !",
                          });
                        } else if (e.target.value > 100) {
                          return setError({
                            ...error,
                            videoCallDiscount:
                              "Video Call Discount can not greater than 100",
                          });
                        } else if (e.target.value <= 0) {
                          return setError({
                            ...error,
                            videoCallDiscount:
                              "Video Call Discount can not less than or equal to 0",
                          });
                        } else {
                          setError({
                            ...error,
                            videoCallDiscount: "",
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="col-6">
                    <ExInput
                      type={`number`}
                      id={`randomMatchCallDiscount`}
                      name={`randomMatchCallDiscount`}
                      value={randomMatchCallDiscount}
                      label={`Random Match Call Discount (%)`}
                      placeholder={`Random Match Call Discount (%)`}
                      errorMessage={
                        error.randomMatchCallDiscount &&
                        error.randomMatchCallDiscount
                      }
                      onChange={(e: any) => {
                        setRandomMatchCallDiscount(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            randomMatchCallDiscount:
                              "Random Match Call Discount is Required !",
                          });
                        } else if (e.target.value > 100) {
                          return setError({
                            ...error,
                            randomMatchCallDiscount:
                              "Random Match Call Discount can not greater than 100",
                          });
                        } else if (e.target.value <= 0) {
                          return setError({
                            ...error,
                            randomMatchCallDiscount:
                              "Random Match Call Discount can not less than or equal to 0",
                          });
                        } else {
                          setError({
                            ...error,
                            randomMatchCallDiscount: "",
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="col-6">
                    <ExInput
                      type={`number`}
                      id={`topUpCoinBonus`}
                      name={`topUpCoinBonus`}
                      value={topUpCoinBonus}
                      label={`Top Up Coin Bonus`}
                      placeholder={`Top Up Coin Bonus`}
                      errorMessage={
                        error.topUpCoinBonus && error.topUpCoinBonus
                      }
                      onChange={(e: any) => {
                        setTopUpCoinBonus(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            topUpCoinBonus: "Top Up Coin Bonus is Required !",
                          });
                        } else {
                          setError({
                            ...error,
                            topUpCoinBonus: "",
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="col-6">
                    <ExInput
                      type={`number`}
                      id={`freeMessages`}
                      name={`freeMessages`}
                      value={freeMessages}
                      label={`FreeMessages`}
                      placeholder={`FreeMessages`}
                      errorMessage={error.freeMessages && error.freeMessages}
                      onChange={(e: any) => {
                        setFreeMessages(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            freeMessages: "Free Message is Required !",
                          });
                        } else {
                          setError({
                            ...error,
                            freeMessages: "",
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="col-md-6">
                    <ExInput
                      type={"file"}
                      label={"Image"}
                      accept={"image/png, image/jpeg"}
                      errorMessage={error.image && error.image}
                      onChange={handleInputImage}
                    />
                    <span className="text-danger" style={{ fontSize: "12px" }}>
                      Image (Accepted formats: png, jpeg)
                    </span>

                    {imagePath && (
                      <>
                        <img
                          src={imagePath ? imagePath : dialogueData?.image}
                          className="mt-3 rounded float-left mb-2"
                          alt="image"
                          style={{ width: "100px", height: "100px" }}
                        />
                      </>
                    )}
                  </div>

                  <div className="mt-4 d-flex justify-content-end gap-1">
                    <Button
                      className={`cancelButton text-light`}
                      text={`Cancel`}
                      type={`button`}
                      onClick={() => dispatch(closeDialog())}
                    />
                    <Button
                      type={`submit`}
                      className={` text-white m10-left submitButton`}
                      // style={{ backgroundColor: "#1ebc1e" }}
                      text={`Submit`}
                      onClick={(e: any) => handleSubmit(e)}
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default VipPlanBenefitDialog;
