import Button from "@/extra/Button";
import { ExInput } from "@/extra/Input";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { getSetting, updateSetting } from "@/store/settingSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const populateConfigFields = (source: any, setters: any) => {
  if (!source) return;
  setters.setAdsWatchEnabled(!!source.adsWatchEnabled);
  setters.setUserPointsPerAd(String(source.adsWatchUserCoinPerAd ?? 10));
  setters.setHostPointsPerAd(String(source.adsWatchHostCoinPerAd ?? 10));
  setters.setUserDailyLimit(String(source.adsWatchUserDailyLimit ?? 10));
  setters.setHostDailyLimit(String(source.adsWatchHostDailyLimit ?? 5));
  setters.setMinPointsToClaim(String(source.adsWatchMinCoinsToClaim ?? 100));
  setters.setPointsPerCoin(String(source.adsWatchPointsPerCoin ?? 1));
  setters.setClaimFrequencyHours(String(source.adsWatchClaimFrequencyHours ?? 24));
  setters.setFullWatchBonus(String(source.adsWatchFullWatchBonus ?? 0));
  setters.setMaxAdsPerDevicePerDay(String(source.adsWatchMaxAdsPerDevicePerDay ?? 35));
  setters.setHostBonusMultiplier(String(source.adsWatchHostBonusMultiplier ?? 1));
  setters.setVipBonusPoints(String(source.adsWatchVipBonusPoints ?? 0));
  setters.setRewardedAdsEnabled(source.adsWatchRewardedAdsEnabled !== false);
  setters.setInterstitialAdsEnabled(source.adsWatchInterstitialAdsEnabled !== false);
  setters.setFraudProtectionEnabled(source.adsWatchFraudProtectionEnabled !== false);
};

const AdsWatchConfig = () => {
  const dispatch = useAppDispatch();
  const { setting }: any = useSelector((state: RootStore) => state.setting);

  const [adsWatchEnabled, setAdsWatchEnabled] = useState(false);
  const [userPointsPerAd, setUserPointsPerAd] = useState("10");
  const [hostPointsPerAd, setHostPointsPerAd] = useState("10");
  const [userDailyLimit, setUserDailyLimit] = useState("10");
  const [hostDailyLimit, setHostDailyLimit] = useState("5");
  const [minPointsToClaim, setMinPointsToClaim] = useState("100");
  const [pointsPerCoin, setPointsPerCoin] = useState("1");
  const [claimFrequencyHours, setClaimFrequencyHours] = useState("24");
  const [fullWatchBonus, setFullWatchBonus] = useState("0");
  const [maxAdsPerDevicePerDay, setMaxAdsPerDevicePerDay] = useState("35");
  const [hostBonusMultiplier, setHostBonusMultiplier] = useState("1");
  const [vipBonusPoints, setVipBonusPoints] = useState("0");
  const [rewardedAdsEnabled, setRewardedAdsEnabled] = useState(true);
  const [interstitialAdsEnabled, setInterstitialAdsEnabled] = useState(true);
  const [fraudProtectionEnabled, setFraudProtectionEnabled] = useState(true);

  const fieldSetters = {
    setAdsWatchEnabled,
    setUserPointsPerAd,
    setHostPointsPerAd,
    setUserDailyLimit,
    setHostDailyLimit,
    setMinPointsToClaim,
    setPointsPerCoin,
    setClaimFrequencyHours,
    setFullWatchBonus,
    setMaxAdsPerDevicePerDay,
    setHostBonusMultiplier,
    setVipBonusPoints,
    setRewardedAdsEnabled,
    setInterstitialAdsEnabled,
    setFraudProtectionEnabled,
  };

  useEffect(() => {
    let active = true;

    (async () => {
      const result = await dispatch(getSetting());
      if (!active) return;
      if (getSetting.fulfilled.match(result) && result.payload?.data) {
        populateConfigFields(result.payload.data, fieldSetters);
      }
    })();

    return () => {
      active = false;
    };
  }, [dispatch]);

  const handleSubmit = async () => {
    if (!setting?._id) return;

    const result = await dispatch(
      updateSetting({
        settingId: setting._id,
        settingDataSubmit: {
          adsWatchEnabled,
          adsWatchUserCoinPerAd: Number(userPointsPerAd),
          adsWatchHostCoinPerAd: Number(hostPointsPerAd),
          adsWatchUserDailyLimit: Number(userDailyLimit),
          adsWatchHostDailyLimit: Number(hostDailyLimit),
          adsWatchMinCoinsToClaim: Number(minPointsToClaim),
          adsWatchPointsPerCoin: Number(pointsPerCoin) || 1,
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

    if (updateSetting.fulfilled.match(result) && result.payload?.status) {
      populateConfigFields(result.payload.data, fieldSetters);
    }
  };

  const conversionRate = Number(pointsPerCoin) > 0 ? Number(pointsPerCoin) : 1;
  const minPoints = Number(minPointsToClaim) || 0;
  const coinsOnClaim = Math.floor(minPoints / conversionRate);

  return (
    <div className="ads-watch-config">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h5 className="mb-1">Ad Configuration</h5>
          <p className="text-muted mb-0">
            Users and hosts earn pending points from ads. On claim, points convert to wallet coins.
          </p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span>Enable Ads Watch</span>
          <ToggleSwitch
            checked={adsWatchEnabled}
            onChange={() => setAdsWatchEnabled(!adsWatchEnabled)}
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
                  label="Points per Ad (User)"
                  value={userPointsPerAd}
                  onChange={(e: any) => setUserPointsPerAd(e.target.value)}
                  type="number"
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Points per Ad (Host)"
                  value={hostPointsPerAd}
                  onChange={(e: any) => setHostPointsPerAd(e.target.value)}
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
                  label="Full Watch Bonus (Points)"
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
            <h6 className="mb-3">Claim Settings — Points to Coins</h6>
            <div className="row g-3">
              <div className="col-md-6">
                <ExInput
                  label="Minimum Points to Claim"
                  value={minPointsToClaim}
                  onChange={(e: any) => setMinPointsToClaim(e.target.value)}
                  type="number"
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Points per 1 Coin"
                  value={pointsPerCoin}
                  onChange={(e: any) => setPointsPerCoin(e.target.value)}
                  type="number"
                />
                <small className="text-muted">
                  Conversion rate: {conversionRate} point{conversionRate === 1 ? "" : "s"} = 1 wallet coin
                </small>
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
              <div className="col-12">
                <div className="card border-0 bg-light p-3">
                  <strong>Claim Preview</strong>
                  <p className="mb-0 text-muted small mt-1">
                    When user has {minPoints || 0} points and claims →{" "}
                    <strong>{coinsOnClaim} wallet coins</strong> added
                    {minPoints % conversionRate > 0
                      ? ` (${minPoints % conversionRate} points remain pending)`
                      : ""}
                    .
                  </p>
                </div>
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
                  onChange={() => setRewardedAdsEnabled(!rewardedAdsEnabled)}
                />
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Interstitial Ads</span>
                <ToggleSwitch
                  checked={interstitialAdsEnabled}
                  onChange={() => setInterstitialAdsEnabled(!interstitialAdsEnabled)}
                />
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Enable Fraud Protection</span>
                <ToggleSwitch
                  checked={fraudProtectionEnabled}
                  onChange={() => setFraudProtectionEnabled(!fraudProtectionEnabled)}
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
