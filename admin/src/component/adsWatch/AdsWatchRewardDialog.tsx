import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootStore, useAppDispatch } from "@/store/store";
import { closeDialog } from "@/store/dialogSlice";
import { ExInput, Textarea } from "@/extra/Input";
import ToggleSwitch from "@/extra/TogggleSwitch";
import Button from "@/extra/Button";
import {
  createAdsWatchReward,
  getAdsWatchRewards,
  updateAdsWatchReward,
} from "@/store/adsWatchSlice";
import Image from "next/image";
import coin from "@/assets/images/coin.png";

interface ErrorState {
  name: string;
  amount: string;
}

const AdsWatchRewardDialog = () => {
  const { dialogueData } = useSelector((state: RootStore) => state.dialogue);
  const dispatch = useAppDispatch();

  const [name, setName] = useState("");
  const [target, setTarget] = useState<"user" | "host">("user");
  const [rewardType, setRewardType] = useState<"coin" | "rupee">("coin");
  const [amount, setAmount] = useState("");
  const [rupeeValue, setRupeeValue] = useState("");
  const [requiredPoints, setRequiredPoints] = useState("");
  const [description, setDescription] = useState("");
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [error, setError] = useState<any>({
    name: "",
    amount: "",
    rupeeValue: "",
    requiredPoints: "",
  });

  useEffect(() => {
    if (dialogueData) {
      setName(dialogueData?.name || "");
      setTarget(dialogueData?.target === "host" ? "host" : "user");
      setRewardType(dialogueData?.rewardType || "coin");
      setAmount(String(dialogueData?.coinValue ?? ""));
      setRupeeValue(String(dialogueData?.rupeeValue ?? ""));
      setRequiredPoints(String(dialogueData?.requiredPoints ?? ""));
      setDescription(dialogueData?.description || "");
      setIsComingSoon(!!dialogueData?.isComingSoon);
    } else {
      setName("");
      setTarget("user");
      setRewardType("coin");
      setAmount("");
      setRupeeValue("");
      setRequiredPoints("");
      setDescription("");
      setIsComingSoon(false);
    }
  }, [dialogueData]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setError((prev: any) => ({ ...prev, amount: "" }));
    const num = Number(value);
    if (num > 0 && !name.trim()) {
      setName(`${num} Coins Pack`);
    }
  };

  const handleRupeeValueChange = (value: string) => {
    setRupeeValue(value);
    setError((prev: any) => ({ ...prev, rupeeValue: "" }));
    const num = Number(value);
    if (num > 0 && !name.trim()) {
      setName(`₹${num} Rupee Pack`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextError: any = { name: "", amount: "", rupeeValue: "", requiredPoints: "" };
    if (!name.trim()) nextError.name = "Reward name is required";
    
    if (rewardType === "coin") {
      if (!amount || Number(amount) <= 0) {
        nextError.amount = "Amount must be greater than 0";
      }
    } else {
      if (!rupeeValue || Number(rupeeValue) <= 0) {
        nextError.rupeeValue = "Rupee value must be greater than 0";
      }
      if (!requiredPoints || Number(requiredPoints) <= 0) {
        nextError.requiredPoints = "Required points must be greater than 0";
      }
    }

    if (nextError.name || nextError.amount || nextError.rupeeValue || nextError.requiredPoints) {
      setError(nextError);
      return;
    }

    const coinVal = rewardType === "coin" ? Number(amount) : 0;
    const rupeeVal = rewardType === "rupee" ? Number(rupeeValue) : 0;
    const reqPoints = rewardType === "coin" ? Number(amount) : Number(requiredPoints);

    const payload = {
      name: name.trim(),
      target,
      rewardType,
      coinValue: coinVal,
      rupeeValue: rupeeVal,
      requiredPoints: reqPoints,
      description: description.trim(),
      isComingSoon: !!isComingSoon,
    };

    const action = dialogueData?._id
      ? await dispatch(updateAdsWatchReward({ ...payload, rewardId: dialogueData._id }))
      : await dispatch(createAdsWatchReward(payload));

    const thunk = dialogueData?._id ? updateAdsWatchReward : createAdsWatchReward;
    if (thunk.fulfilled.match(action) && action.payload?.status) {
      await dispatch(getAdsWatchRewards("all"));
      dispatch(closeDialog());
    }
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
                        setError((prev: any) => ({ ...prev, name: "" }));
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
                      Users or hosts collect points from ads and claim this reward to add coins to their wallet.
                    </small>
                  </div>

                  <div className="inputData">
                    <label className="mb-2">Reward Type</label>
                    <div className="d-flex gap-2 mb-2">
                      <button
                        type="button"
                        className={`btn ${rewardType === "coin" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setRewardType("coin")}
                      >
                        Coins
                      </button>
                      <button
                        type="button"
                        className={`btn ${rewardType === "rupee" ? "btn-success" : "btn-outline-secondary"}`}
                        onClick={() => setRewardType("rupee")}
                      >
                        Rupees
                      </button>
                    </div>
                  </div>

                  {rewardType === "coin" ? (
                    <div className="inputData">
                      <ExInput
                        label="Points = Coins (same amount)"
                        type="number"
                        placeholder="e.g. 100"
                        value={amount}
                        onChange={(e: any) => handleAmountChange(e.target.value)}
                        errorMessage={error.amount}
                      />
                      <small className="text-muted">
                        Example: enter 100 → user needs 100 points to claim, and receives 100 coins in wallet.
                      </small>
                    </div>
                  ) : (
                    <>
                      <div className="inputData">
                        <ExInput
                          label="Required Points"
                          type="number"
                          placeholder="e.g. 100"
                          value={requiredPoints}
                          onChange={(e: any) => setRequiredPoints(e.target.value)}
                          errorMessage={error.requiredPoints}
                        />
                      </div>
                      <div className="inputData">
                        <ExInput
                          label="Rupee Value (₹)"
                          type="number"
                          placeholder="e.g. 10"
                          value={rupeeValue}
                          onChange={(e: any) => handleRupeeValueChange(e.target.value)}
                          errorMessage={error.rupeeValue}
                        />
                      </div>
                    </>
                  )}

                  <div className="inputData">
                    <div className="card border-0 bg-light p-3 d-flex flex-row align-items-center gap-3">
                      <Image src={coin} alt="" width={36} height={36} />
                      <div>
                        <strong>{rewardType === "coin" ? "Wallet Coins" : "Rupees Payout"}</strong>
                        <p className="mb-0 text-muted small">
                          {rewardType === "coin"
                            ? (amount && Number(amount) > 0
                              ? `${amount} points required → ${amount} coins added to wallet`
                              : "Wallet coins only — no call minutes.")
                            : (requiredPoints && rupeeValue
                              ? `${requiredPoints} points required → ₹${rupeeValue} added to rupee balance`
                              : "Convert points to Rupees cash balance.")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="inputData">
                    <div className="card border-0 bg-light p-3 d-flex flex-row align-items-center justify-content-between gap-3">
                      <div>
                        <strong>Mark as Coming Soon</strong>
                        <p className="mb-0 text-muted small">
                          Displays a &quot;Coming Soon&quot; tag in the app and disables claiming for this pack.
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={isComingSoon}
                        onChange={() => setIsComingSoon((prev) => !prev)}
                      />
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
