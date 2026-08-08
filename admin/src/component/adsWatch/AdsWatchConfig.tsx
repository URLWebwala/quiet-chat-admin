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
  setters.setPointsPerRupee(String(source.pointsPerRupee ?? 10));
  setters.setClaimFrequencyHours(String(source.adsWatchClaimFrequencyHours ?? 24));
  setters.setFullWatchBonus(String(source.adsWatchFullWatchBonus ?? 0));
  setters.setMaxAdsPerDevicePerDay(String(source.adsWatchMaxAdsPerDevicePerDay ?? 35));
  setters.setHostBonusMultiplier(String(source.adsWatchHostBonusMultiplier ?? 1));
  setters.setVipBonusPoints(String(source.adsWatchVipBonusPoints ?? 0));
  setters.setRewardedAdsEnabled(source.adsWatchRewardedAdsEnabled !== false);
  setters.setInterstitialAdsEnabled(source.adsWatchInterstitialAdsEnabled !== false);
  setters.setBannerAdsEnabled(source.adsWatchBannerAdsEnabled !== false);
  setters.setFraudProtectionEnabled(source.adsWatchFraudProtectionEnabled !== false);

  setters.setBitlabsEnabled(!!source.bitlabsEnabled);
  setters.setBitlabsPointsPerSurvey(String(source.bitlabsPointsPerSurvey ?? 50));
  setters.setBitlabsDailyLimit(String(source.bitlabsDailyLimit ?? 10));
  setters.setCpxEnabled(!!source.cpxEnabled);
  setters.setCpxPointsPerSurvey(String(source.cpxPointsPerSurvey ?? 50));
  setters.setCpxDailyLimit(String(source.cpxDailyLimit ?? 10));
  setters.setUnityAdsEnabled(source.unityAdsEnabled !== false);
  setters.setUnityPointsPerAd(String(source.unityPointsPerAd ?? 25));
  setters.setUnityDailyLimit(String(source.unityDailyLimit ?? 10));
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
  const [pointsPerRupee, setPointsPerRupee] = useState("10");
  const [claimFrequencyHours, setClaimFrequencyHours] = useState("24");
  const [fullWatchBonus, setFullWatchBonus] = useState("0");
  const [maxAdsPerDevicePerDay, setMaxAdsPerDevicePerDay] = useState("35");
  const [hostBonusMultiplier, setHostBonusMultiplier] = useState("1");
  const [vipBonusPoints, setVipBonusPoints] = useState("0");
  const [rewardedAdsEnabled, setRewardedAdsEnabled] = useState(true);
  const [interstitialAdsEnabled, setInterstitialAdsEnabled] = useState(true);
  const [bannerAdsEnabled, setBannerAdsEnabled] = useState(true);
  const [fraudProtectionEnabled, setFraudProtectionEnabled] = useState(true);

  const [bitlabsEnabled, setBitlabsEnabled] = useState(false);
  const [bitlabsPointsPerSurvey, setBitlabsPointsPerSurvey] = useState("50");
  const [bitlabsDailyLimit, setBitlabsDailyLimit] = useState("10");
  const [cpxEnabled, setCpxEnabled] = useState(false);
  const [cpxPointsPerSurvey, setCpxPointsPerSurvey] = useState("50");
  const [cpxDailyLimit, setCpxDailyLimit] = useState("10");
  const [unityAdsEnabled, setUnityAdsEnabled] = useState(true);
  const [unityPointsPerAd, setUnityPointsPerAd] = useState("25");
  const [unityDailyLimit, setUnityDailyLimit] = useState("10");

  const fieldSetters = {
    setAdsWatchEnabled,
    setUserPointsPerAd,
    setHostPointsPerAd,
    setUserDailyLimit,
    setHostDailyLimit,
    setMinPointsToClaim,
    setPointsPerCoin,
    setPointsPerRupee,
    setClaimFrequencyHours,
    setFullWatchBonus,
    setMaxAdsPerDevicePerDay,
    setHostBonusMultiplier,
    setVipBonusPoints,
    setRewardedAdsEnabled,
    setInterstitialAdsEnabled,
    setBannerAdsEnabled,
    setFraudProtectionEnabled,
    setBitlabsEnabled,
    setBitlabsPointsPerSurvey,
    setBitlabsDailyLimit,
    setCpxEnabled,
    setCpxPointsPerSurvey,
    setCpxDailyLimit,
    setUnityAdsEnabled,
    setUnityPointsPerAd,
    setUnityDailyLimit,
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
          pointsPerRupee: Number(pointsPerRupee) || 10,
          adsWatchClaimFrequencyHours: Number(claimFrequencyHours),
          adsWatchFullWatchBonus: Number(fullWatchBonus),
          adsWatchMaxAdsPerDevicePerDay: Number(maxAdsPerDevicePerDay),
          adsWatchHostBonusMultiplier: Number(hostBonusMultiplier),
          adsWatchVipBonusPoints: Number(vipBonusPoints),
          adsWatchRewardedAdsEnabled: rewardedAdsEnabled,
          adsWatchInterstitialAdsEnabled: interstitialAdsEnabled,
          adsWatchBannerAdsEnabled: bannerAdsEnabled,
          adsWatchFraudProtectionEnabled: fraudProtectionEnabled,
          bitlabsEnabled,
          bitlabsPointsPerSurvey: Number(bitlabsPointsPerSurvey),
          bitlabsDailyLimit: Number(bitlabsDailyLimit),
          cpxEnabled,
          cpxPointsPerSurvey: Number(cpxPointsPerSurvey),
          cpxDailyLimit: Number(cpxDailyLimit),
          unityAdsEnabled,
          unityPointsPerAd: Number(unityPointsPerAd),
          unityDailyLimit: Number(unityDailyLimit),
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
        {/* Left Column */}
        <div className="col-lg-6 d-flex flex-column gap-4">
          {/* Card 1: Points Earning Logic */}
          <div className="card border-0 shadow-sm p-4">
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
              <div className="col-md-12">
                <ExInput
                  label="Full Watch Bonus (Points)"
                  value={fullWatchBonus}
                  onChange={(e: any) => setFullWatchBonus(e.target.value)}
                  type="number"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Ad Types & Fraud Protection */}
          <div className="card border-0 shadow-sm p-4">
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
                <span>Banner Ads</span>
                <ToggleSwitch
                  checked={bannerAdsEnabled}
                  onChange={() => setBannerAdsEnabled(!bannerAdsEnabled)}
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

          {/* Card 3: Advanced Rules */}
          <div className="card border-0 shadow-sm p-4">
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

        {/* Right Column */}
        <div className="col-lg-6 d-flex flex-column gap-4">
          {/* Card 1: Claim Settings */}
          <div className="card border-0 shadow-sm p-4">
            <h6 className="mb-3">Claim Settings — Points Conversion</h6>
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
                  label="Claim Frequency (Hours)"
                  value={claimFrequencyHours}
                  onChange={(e: any) => setClaimFrequencyHours(e.target.value)}
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
                  label="Points per 1 Rupee"
                  value={pointsPerRupee}
                  onChange={(e: any) => setPointsPerRupee(e.target.value)}
                  type="number"
                />
                <small className="text-muted">
                  Conversion rate: {pointsPerRupee} point{Number(pointsPerRupee) === 1 ? "" : "s"} = ₹1 Cash
                </small>
              </div>
              <div className="col-md-12">
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
                  <p className="mb-1 text-muted small mt-1">
                    When user has {minPoints || 0} points and converts to Coins →{" "}
                    <strong>{coinsOnClaim} wallet coins</strong> added
                    {minPoints % conversionRate > 0
                      ? ` (${minPoints % conversionRate} points remain)`
                      : ""}
                    .
                  </p>
                  <p className="mb-0 text-muted small">
                    When user has {minPoints || 0} points and converts to Rupees →{" "}
                    <strong>₹{Math.floor(minPoints / (Number(pointsPerRupee) || 10))} Cash</strong> added
                    {minPoints % (Number(pointsPerRupee) || 10) > 0
                      ? ` (${minPoints % (Number(pointsPerRupee) || 10)} points remain)`
                      : ""}
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Partner Survey & Ad Provider Settings */}
          <div className="card border-0 shadow-sm p-4">
            <h6 className="mb-3">Partner Survey Settings</h6>
            <div className="row g-3">
              <div className="col-12 d-flex justify-content-between align-items-center">
                <span>Enable BitLabs Surveys</span>
                <ToggleSwitch
                  checked={bitlabsEnabled}
                  onChange={() => setBitlabsEnabled(!bitlabsEnabled)}
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Points per BitLabs Survey"
                  value={bitlabsPointsPerSurvey}
                  onChange={(e: any) => setBitlabsPointsPerSurvey(e.target.value)}
                  type="number"
                  disabled={!bitlabsEnabled}
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Daily BitLabs Survey Limit"
                  value={bitlabsDailyLimit}
                  onChange={(e: any) => setBitlabsDailyLimit(e.target.value)}
                  type="number"
                  disabled={!bitlabsEnabled}
                />
              </div>

              <div className="col-12 my-1">
                <hr />
              </div>

              <div className="col-12 d-flex justify-content-between align-items-center">
                <span>Enable CPX Research Surveys</span>
                <ToggleSwitch
                  checked={cpxEnabled}
                  onChange={() => setCpxEnabled(!cpxEnabled)}
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Points per CPX Survey"
                  value={cpxPointsPerSurvey}
                  onChange={(e: any) => setCpxPointsPerSurvey(e.target.value)}
                  type="number"
                  disabled={!cpxEnabled}
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Daily CPX Survey Limit"
                  value={cpxDailyLimit}
                  onChange={(e: any) => setCpxDailyLimit(e.target.value)}
                  type="number"
                  disabled={!cpxEnabled}
                />
              </div>

              <div className="col-12 my-1">
                <hr />
              </div>

              <div className="col-12 d-flex justify-content-between align-items-center">
                <span>Enable Unity Video Ads</span>
                <ToggleSwitch
                  checked={unityAdsEnabled}
                  onChange={() => setUnityAdsEnabled(!unityAdsEnabled)}
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Points per Unity Ad Watch"
                  value={unityPointsPerAd}
                  onChange={(e: any) => setUnityPointsPerAd(e.target.value)}
                  type="number"
                  disabled={!unityAdsEnabled}
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Daily Unity Ad Limit"
                  value={unityDailyLimit}
                  onChange={(e: any) => setUnityDailyLimit(e.target.value)}
                  type="number"
                  disabled={!unityAdsEnabled}
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
