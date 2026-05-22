import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootStore, useAppDispatch } from "@/store/store";
import { closeDialog } from "@/store/dialogSlice";
import { ExInput, Textarea } from "@/extra/Input";
import Button from "@/extra/Button";
import { createAdsWatchReward, updateAdsWatchReward } from "@/store/adsWatchSlice";
import Image from "next/image";
import coin from "@/assets/images/coin.png";

interface ErrorState {
  name: string;
  coinValue: string;
  requiredPoints: string;
}

const AdsWatchRewardDialog = () => {
  const { dialogueData } = useSelector((state: RootStore) => state.dialogue);
  const dispatch = useAppDispatch();

  const [name, setName] = useState("");
  const [target, setTarget] = useState<"user" | "host">("user");
  const [coinValue, setCoinValue] = useState("");
  const [requiredPoints, setRequiredPoints] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<ErrorState>({
    name: "",
    coinValue: "",
    requiredPoints: "",
  });

  useEffect(() => {
    if (dialogueData) {
      setName(dialogueData?.name || "");
      setTarget(dialogueData?.target === "host" ? "host" : "user");
      setCoinValue(String(dialogueData?.coinValue ?? ""));
      setRequiredPoints(String(dialogueData?.requiredPoints ?? ""));
      setDescription(dialogueData?.description || "");
    } else {
      setName("");
      setTarget("user");
      setCoinValue("");
      setRequiredPoints("");
      setDescription("");
    }
  }, [dialogueData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextError: ErrorState = { name: "", coinValue: "", requiredPoints: "" };
    if (!name.trim()) nextError.name = "Reward name is required";
    if (!coinValue || Number(coinValue) <= 0) nextError.coinValue = "Coin value must be greater than 0";
    if (!requiredPoints || Number(requiredPoints) <= 0) {
      nextError.requiredPoints = "Required points must be greater than 0";
    }

    if (nextError.name || nextError.coinValue || nextError.requiredPoints) {
      setError(nextError);
      return;
    }

    const payload = {
      name: name.trim(),
      target,
      coinValue: Number(coinValue),
      requiredPoints: Number(requiredPoints),
      description: description.trim(),
    };

    if (dialogueData?._id) {
      dispatch(updateAdsWatchReward({ ...payload, rewardId: dialogueData._id }));
    } else {
      dispatch(createAdsWatchReward(payload));
    }
    dispatch(closeDialog());
  };

  return (
    <div className="dialog">
      <div className="w-100">
        <div className="row justify-content-center">
          <div className="col-xl-4 col-lg-5 col-md-6 col-11">
            <div className="mainDiaogBox">
              <div className="row justify-content-between align-items-center formHead">
                <div className="col-10">
                  <h4 className="text-theme m0">
                    {dialogueData ? "Edit Reward" : "+ Add New Reward"}
                  </h4>
                </div>
                <div className="col-2">
                  <div className="closeButton" onClick={() => dispatch(closeDialog())} style={{ fontSize: "20px" }}>
                    ✖
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row align-items-start formBody">
                  <div className="inputData">
                    <ExInput
                      label="Reward Name"
                      placeholder="e.g. 100 Coins Pack"
                      value={name}
                      onChange={(e: any) => {
                        setName(e.target.value);
                        setError((prev) => ({ ...prev, name: "" }));
                      }}
                      errorMessage={error.name}
                    />
                  </div>

                  <div className="inputData">
                    <label className="mb-2">For Whom?</label>
                    <div className="d-flex gap-2 mb-2">
                      <button
                        type="button"
                        className={`btn ${target === "user" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setTarget("user")}
                      >
                        Users
                      </button>
                      <button
                        type="button"
                        className={`btn ${target === "host" ? "btn-warning" : "btn-outline-secondary"}`}
                        onClick={() => setTarget("host")}
                      >
                        Hosts
                      </button>
                    </div>
                    <small className="text-muted">
                      User ya Host ads se points collect karke is reward ko redeem karega.
                    </small>
                  </div>

                  <div className="col-md-6">
                    <div className="inputData">
                      <ExInput
                        label="Coins You Get (Wallet)"
                        type="number"
                        value={coinValue}
                        onChange={(e: any) => {
                          setCoinValue(e.target.value);
                          setError((prev) => ({ ...prev, coinValue: "" }));
                        }}
                        errorMessage={error.coinValue}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="inputData">
                      <ExInput
                        label="Required Points"
                        type="number"
                        value={requiredPoints}
                        onChange={(e: any) => {
                          setRequiredPoints(e.target.value);
                          setError((prev) => ({ ...prev, requiredPoints: "" }));
                        }}
                        errorMessage={error.requiredPoints}
                      />
                    </div>
                  </div>

                  <div className="inputData">
                    <div className="card border-0 bg-light p-3 d-flex flex-row align-items-center gap-3">
                      <Image src={coin} alt="" width={36} height={36} />
                      <div>
                        <strong>Wallet Coins</strong>
                        <p className="mb-0 text-muted small">
                          Redeem par user/host ke wallet me coins add honge.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="inputData">
                    <Textarea
                      label="Description (Optional)"
                      placeholder="Reward details..."
                      value={description}
                      onChange={(e: any) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="mt-4 d-flex justify-content-end gap-2 w-100">
                    <Button
                      className="cancelButton text-light"
                      text="Cancel"
                      type="button"
                      onClick={() => dispatch(closeDialog())}
                    />
                    <Button
                      className="submitButton text-white"
                      text={dialogueData ? "Update Reward" : "Create Reward"}
                      type="submit"
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

export default AdsWatchRewardDialog;
