import Button from "@/extra/Button";
import { ExInput } from "@/extra/Input";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { getSetting, handleSetting, updateSetting } from "@/store/settingSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const AdsWatchConfig = () => {
  const dispatch = useAppDispatch();
  const { setting }: any = useSelector((state: RootStore) => state.setting);

  const [adsWatchEnabled, setAdsWatchEnabled] = useState(false);
  const [userCoinPerAd, setUserCoinPerAd] = useState("10");
  const [hostCoinPerAd, setHostCoinPerAd] = useState("10");
  const [userDailyLimit, setUserDailyLimit] = useState("10");
  const [hostDailyLimit, setHostDailyLimit] = useState("5");
  const [minCoinsToClaim, setMinCoinsToClaim] = useState("100");
  const [claimFrequencyHours, setClaimFrequencyHours] = useState("24");
  const [fullWatchBonus, setFullWatchBonus] = useState("0");
  const [maxAdsPerDevicePerDay, setMaxAdsPerDevicePerDay] = useState("35");
  const [hostBonusMultiplier, setHostBonusMultiplier] = useState("1");
  const [vipBonusPoints, setVipBonusPoints] = useState("0");
  const [rewardedAdsEnabled, setRewardedAdsEnabled] = useState(true);
  const [interstitialAdsEnabled, setInterstitialAdsEnabled] = useState(true);
  const [fraudProtectionEnabled, setFraudProtectionEnabled] = useState(true);

  useEffect(() => {
    dispatch(getSetting());
  }, [dispatch]);

  useEffect(() => {
    if (!setting?._id) return;
    setAdsWatchEnabled(!!setting.adsWatchEnabled);
    setUserCoinPerAd(String(setting.adsWatchUserCoinPerAd ?? 10));
    setHostCoinPerAd(String(setting.adsWatchHostCoinPerAd ?? 10));
    setUserDailyLimit(String(setting.adsWatchUserDailyLimit ?? 10));
    setHostDailyLimit(String(setting.adsWatchHostDailyLimit ?? 5));
    setMinCoinsToClaim(String(setting.adsWatchMinCoinsToClaim ?? 100));
    setClaimFrequencyHours(String(setting.adsWatchClaimFrequencyHours ?? 24));
    setFullWatchBonus(String(setting.adsWatchFullWatchBonus ?? 0));
    setMaxAdsPerDevicePerDay(String(setting.adsWatchMaxAdsPerDevicePerDay ?? 35));
    setHostBonusMultiplier(String(setting.adsWatchHostBonusMultiplier ?? 1));
    setVipBonusPoints(String(setting.adsWatchVipBonusPoints ?? 0));
    setRewardedAdsEnabled(setting.adsWatchRewardedAdsEnabled !== false);
    setInterstitialAdsEnabled(setting.adsWatchInterstitialAdsEnabled !== false);
    setFraudProtectionEnabled(setting.adsWatchFraudProtectionEnabled !== false);
  }, [setting]);

  const toggleField = (type: string) => {
    dispatch(
      handleSetting({
        settingId: setting?._id,
        type,
      })
    );
  };

  const handleSubmit = () => {
    dispatch(
      updateSetting({
        settingId: setting?._id,
        settingDataSubmit: {
          adsWatchEnabled,
          adsWatchUserCoinPerAd: Number(userCoinPerAd),
          adsWatchHostCoinPerAd: Number(hostCoinPerAd),
          adsWatchUserDailyLimit: Number(userDailyLimit),
          adsWatchHostDailyLimit: Number(hostDailyLimit),
          adsWatchMinCoinsToClaim: Number(minCoinsToClaim),
          adsWatchClaimFrequencyHours: Number(claimFrequencyHours),
          adsWatchFullWatchBonus: Number(fullWatchBonus),
          adsWatchMaxAdsPerDevicePerDay: Number(maxAdsPerDevicePerDay),
          adsWatchHostBonusMultiplier: Number(hostBonusMultiplier),
          adsWatchVipBonusPoints: Number(vipBonusPoints),
          adsWatchRewardedAdsEnabled: rewardedAdsEnabled,
          adsWatchInterstitialAdsEnabled: interstitialAdsEnabled,
          adsWatchFraudProtectionEnabled: fraudProtectionEnabled,
        },
      })
    );
  };

  return (
    <div className="ads-watch-config">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h5 className="mb-1">Ad Configuration</h5>
          <p className="text-muted mb-0">
            User/Host ads se pending coins collect karenge. Minimum limit ke baad claim par wallet me add honge.
          </p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span>Enable Ads Watch</span>
          <ToggleSwitch
            checked={adsWatchEnabled}
            onChange={() => toggleField("adsWatchEnabled")}
          />
          <Button className="submitButton text-white" text="Save Configuration" onClick={handleSubmit} />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h6 className="mb-3">Points Earning Logic</h6>
            <div className="row g-3">
              <div className="col-md-6">
                <ExInput
                  label="Coins per Ad (User)"
                  value={userCoinPerAd}
                  onChange={(e: any) => setUserCoinPerAd(e.target.value)}
                  type="number"
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Coins per Ad (Host)"
                  value={hostCoinPerAd}
                  onChange={(e: any) => setHostCoinPerAd(e.target.value)}
                  type="number"
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Daily Ad Limit (User)"
                  value={userDailyLimit}
                  onChange={(e: any) => setUserDailyLimit(e.target.value)}
                  type="number"
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Daily Ad Limit (Host)"
                  value={hostDailyLimit}
                  onChange={(e: any) => setHostDailyLimit(e.target.value)}
                  type="number"
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Full Watch Bonus"
                  value={fullWatchBonus}
                  onChange={(e: any) => setFullWatchBonus(e.target.value)}
                  type="number"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h6 className="mb-3">Claim Settings</h6>
            <div className="row g-3">
              <div className="col-md-6">
                <ExInput
                  label="Minimum Coins to Claim"
                  value={minCoinsToClaim}
                  onChange={(e: any) => setMinCoinsToClaim(e.target.value)}
                  type="number"
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Claim Frequency (Hours)"
                  value={claimFrequencyHours}
                  onChange={(e: any) => setClaimFrequencyHours(e.target.value)}
                  type="number"
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Max Ads per Device / Day"
                  value={maxAdsPerDevicePerDay}
                  onChange={(e: any) => setMaxAdsPerDevicePerDay(e.target.value)}
                  type="number"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h6 className="mb-3">Ad Types & Fraud Protection</h6>
            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between align-items-center">
                <span>Rewarded Ads</span>
                <ToggleSwitch
                  checked={rewardedAdsEnabled}
                  onChange={() => toggleField("adsWatchRewardedAdsEnabled")}
                />
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Interstitial Ads</span>
                <ToggleSwitch
                  checked={interstitialAdsEnabled}
                  onChange={() => toggleField("adsWatchInterstitialAdsEnabled")}
                />
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Enable Fraud Protection</span>
                <ToggleSwitch
                  checked={fraudProtectionEnabled}
                  onChange={() => toggleField("adsWatchFraudProtectionEnabled")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h6 className="mb-3">Advanced Rules</h6>
            <div className="row g-3">
              <div className="col-md-6">
                <ExInput
                  label="Host Bonus Multiplier"
                  value={hostBonusMultiplier}
                  onChange={(e: any) => setHostBonusMultiplier(e.target.value)}
                  type="number"
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Premium User (VIP) Bonus Points"
                  value={vipBonusPoints}
                  onChange={(e: any) => setVipBonusPoints(e.target.value)}
                  type="number"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdsWatchConfig;
