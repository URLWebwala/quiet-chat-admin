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

  setters.setAdgemEnabled(source.adgemEnabled !== false);
  setters.setAdgemPointsPerOffer(String(source.adgemPointsPerOffer ?? 50));
  setters.setAdgemDailyLimit(String(source.adgemDailyLimit ?? 10));

  setters.setTheoremreachEnabled(source.theoremreachEnabled !== false);
  setters.setTheoremreachPointsPerSurvey(String(source.theoremreachPointsPerSurvey ?? 50));
  setters.setTheoremreachDailyLimit(String(source.theoremreachDailyLimit ?? 10));
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
  const [adgemEnabled, setAdgemEnabled] = useState(true);
  const [adgemPointsPerOffer, setAdgemPointsPerOffer] = useState("50");
  const [adgemDailyLimit, setAdgemDailyLimit] = useState("10");
  const [theoremreachEnabled, setTheoremreachEnabled] = useState(true);
  const [theoremreachPointsPerSurvey, setTheoremreachPointsPerSurvey] = useState("50");
  const [theoremreachDailyLimit, setTheoremreachDailyLimit] = useState("10");

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
    setAdgemEnabled,
    setAdgemPointsPerOffer,
    setAdgemDailyLimit,
    setTheoremreachEnabled,
    setTheoremreachPointsPerSurvey,
    setTheoremreachDailyLimit,
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
          adgemEnabled,
          adgemPointsPerOffer: Number(adgemPointsPerOffer),
          adgemDailyLimit: Number(adgemDailyLimit),
          theoremreachEnabled,
          theoremreachPointsPerSurvey: Number(theoremreachPointsPerSurvey),
          theoremreachDailyLimit: Number(theoremreachDailyLimit),
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
      {/* ─── Top Header Action Bar ────────────────────────────────────────── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 p-3 bg-white rounded-4 shadow-sm gap-3">
        <div>
          <h5 className="mb-1 fw-bold text-dark d-flex align-items-center gap-2">
            <i className="ri-settings-5-line text-primary fs-20" style={{ color: "#9f5aff" }}></i>
            Ad & Survey Reward Rules Configuration
          </h5>
          <p className="text-muted mb-0 small">
            Configure point earnings, claim thresholds, conversion ratios to wallet coins/cash, and partner networks.
          </p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2 px-3 py-1 bg-light rounded-pill border">
            <span className="fw-semibold small text-dark">Master Ads Switch</span>
            <ToggleSwitch
              checked={adsWatchEnabled}
              onChange={() => setAdsWatchEnabled(!adsWatchEnabled)}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 fw-bold rounded-3 shadow"
            style={{
              background: "linear-gradient(135deg, #9f5aff 0%, #7c3aed 100%)",
              border: "none",
              fontSize: "14px",
              letterSpacing: "0.2px",
            }}
            onClick={handleSubmit}
          >
            <i className="ri-save-3-line fs-18"></i>
            Save Configuration
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* ─── Top Row: Core Ad & Economic Rules ─────────────────────────── */}
        {/* Left Column */}
        <div className="col-12 col-lg-6 d-flex flex-column gap-4">
          {/* Card 1: Points Earning Logic */}
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
            <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36, backgroundColor: "#FAF5FF", color: "#9333EA" }}
              >
                <i className="ri-video-line fs-20"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-dark">Ad Points Earning Logic</h6>
                <span className="text-muted small">Standard video ad rewards and daily viewing limits</span>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-6">
                <ExInput
                  label="Points per Ad (User)"
                  placeholder="e.g. 10"
                  value={userPointsPerAd}
                  onChange={(e: any) => setUserPointsPerAd(e.target.value)}
                  type="number"
                />
              </div>
              <div className="col-6">
                <ExInput
                  label="Points per Ad (Host)"
                  placeholder="e.g. 10"
                  value={hostPointsPerAd}
                  onChange={(e: any) => setHostPointsPerAd(e.target.value)}
                  type="number"
                />
              </div>
              <div className="col-6">
                <ExInput
                  label="Daily Ad Limit (User)"
                  placeholder="e.g. 10"
                  value={userDailyLimit}
                  onChange={(e: any) => setUserDailyLimit(e.target.value)}
                  type="number"
                />
              </div>
              <div className="col-6">
                <ExInput
                  label="Daily Ad Limit (Host)"
                  placeholder="e.g. 5"
                  value={hostDailyLimit}
                  onChange={(e: any) => setHostDailyLimit(e.target.value)}
                  type="number"
                />
              </div>
              <div className="col-12">
                <ExInput
                  label="Full Watch Bonus Points (Optional)"
                  placeholder="e.g. 0"
                  value={fullWatchBonus}
                  onChange={(e: any) => setFullWatchBonus(e.target.value)}
                  type="number"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Ad Formats & Security */}
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36, backgroundColor: "#EFF6FF", color: "#2563EB" }}
              >
                <i className="ri-shield-check-line fs-20"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-dark">Ad Formats & Fraud Protection</h6>
                <span className="text-muted small">Control active ad placements and security</span>
              </div>
            </div>

            <div className="row g-2">
              <div className="col-6">
                <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                  <span className="small fw-semibold text-dark">Rewarded Video</span>
                  <ToggleSwitch
                    checked={rewardedAdsEnabled}
                    onChange={() => setRewardedAdsEnabled(!rewardedAdsEnabled)}
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                  <span className="small fw-semibold text-dark">Interstitial Ads</span>
                  <ToggleSwitch
                    checked={interstitialAdsEnabled}
                    onChange={() => setInterstitialAdsEnabled(!interstitialAdsEnabled)}
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                  <span className="small fw-semibold text-dark">Banner Ads</span>
                  <ToggleSwitch
                    checked={bannerAdsEnabled}
                    onChange={() => setBannerAdsEnabled(!bannerAdsEnabled)}
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                  <span className="small fw-semibold text-dark">Device Fraud Guard</span>
                  <ToggleSwitch
                    checked={fraudProtectionEnabled}
                    onChange={() => setFraudProtectionEnabled(!fraudProtectionEnabled)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-12 col-lg-6 d-flex flex-column gap-4">
          {/* Card 3: Claim Settings & Conversion */}
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36, backgroundColor: "#F0FDF4", color: "#16A34A" }}
              >
                <i className="ri-money-dollar-circle-line fs-20"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-dark">Claim Thresholds & Points Economy</h6>
                <span className="text-muted small">Convert points into spendable coins or cash rupees</span>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-6">
                <ExInput
                  label="Minimum Points to Claim"
                  placeholder="e.g. 50"
                  value={minPointsToClaim}
                  onChange={(e: any) => setMinPointsToClaim(e.target.value)}
                  type="number"
                />
              </div>
              <div className="col-6">
                <ExInput
                  label="Claim Cooldown (Hours)"
                  placeholder="e.g. 24"
                  value={claimFrequencyHours}
                  onChange={(e: any) => setClaimFrequencyHours(e.target.value)}
                  type="number"
                />
              </div>
              <div className="col-6">
                <ExInput
                  label="Points per 1 Coin"
                  placeholder="e.g. 1"
                  value={pointsPerCoin}
                  onChange={(e: any) => setPointsPerCoin(e.target.value)}
                  type="number"
                />
                <small className="text-muted d-block mt-1" style={{ fontSize: "11px" }}>
                  1 Point = {conversionRate} Wallet Coin
                </small>
              </div>
              <div className="col-6">
                <ExInput
                  label="Points per ₹1 Rupee Cash"
                  placeholder="e.g. 10"
                  value={pointsPerRupee}
                  onChange={(e: any) => setPointsPerRupee(e.target.value)}
                  type="number"
                />
                <small className="text-muted d-block mt-1" style={{ fontSize: "11px" }}>
                  {pointsPerRupee} Points = ₹1 INR Cash
                </small>
              </div>
              <div className="col-12">
                <ExInput
                  label="Max Ads per Device / 24h"
                  placeholder="e.g. 100"
                  value={maxAdsPerDevicePerDay}
                  onChange={(e: any) => setMaxAdsPerDevicePerDay(e.target.value)}
                  type="number"
                />
              </div>

              {/* Real-Time Preview Box */}
              <div className="col-12">
                <div
                  className="p-3 rounded-3"
                  style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}
                >
                  <span className="fw-bold small text-dark d-flex align-items-center gap-1 mb-2">
                    <i className="ri-calculator-line text-primary"></i>
                    Live Claim Conversion Preview
                  </span>
                  <div className="d-flex flex-column gap-1 small text-muted" style={{ fontSize: "12px" }}>
                    <div>
                      🪙 With <strong>{minPoints || 0} points</strong> → Convert to Coins:{" "}
                      <strong className="text-purple" style={{ color: "#7c3aed" }}>{coinsOnClaim} Wallet Coins</strong>
                      {minPoints % conversionRate > 0 && ` (${minPoints % conversionRate} leftover points)`}
                    </div>
                    <div>
                      💵 With <strong>{minPoints || 0} points</strong> → Convert to Cash:{" "}
                      <strong className="text-success">₹{Math.floor(minPoints / (Number(pointsPerRupee) || 10))} Rupee Balance</strong>
                      {minPoints % (Number(pointsPerRupee) || 10) > 0 && ` (${minPoints % (Number(pointsPerRupee) || 10)} leftover points)`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: VIP & Host Multiplier */}
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36, backgroundColor: "#FEF3C7", color: "#D97706" }}
              >
                <i className="ri-vip-crown-line fs-20"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-dark">VIP & Host Multiplier Rules</h6>
                <span className="text-muted small">Incentives for creator hosts and subscribed members</span>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-6">
                <ExInput
                  label="Host Bonus Multiplier"
                  placeholder="e.g. 1"
                  value={hostBonusMultiplier}
                  onChange={(e: any) => setHostBonusMultiplier(e.target.value)}
                  type="number"
                />
              </div>
              <div className="col-6">
                <ExInput
                  label="VIP Member Bonus Points"
                  placeholder="e.g. 0"
                  value={vipBonusPoints}
                  onChange={(e: any) => setVipBonusPoints(e.target.value)}
                  type="number"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Bottom Full-Width Section: Partner Offerwall & Surveys ───── */}
        <div className="col-12">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 36, height: 36, backgroundColor: "#CCFBF1", color: "#0F766E" }}
                >
                  <i className="ri-survey-line fs-20"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark">Partner Surveys & Offerwall Networks</h6>
                  <span className="text-muted small">Configure rates and daily quotas for 3rd party providers</span>
                </div>
              </div>
              <span className="badge bg-light text-dark border px-3 py-2 rounded-pill small fw-semibold">
                5 Providers Connected
              </span>
            </div>

            <div className="row g-3">
              {/* Unity Ads */}
              <div className="col-12 col-md-6 col-xl-4">
                <div className="p-3 rounded-3 bg-light border h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <i className="ri-gamepad-line fs-18 text-dark"></i>
                        <span className="fw-bold small text-dark">Unity Video Ads</span>
                      </div>
                      <ToggleSwitch
                        checked={unityAdsEnabled}
                        onChange={() => setUnityAdsEnabled(!unityAdsEnabled)}
                      />
                    </div>
                    <div className="row g-2">
                      <div className="col-6">
                        <ExInput
                          label="Points / Video"
                          value={unityPointsPerAd}
                          onChange={(e: any) => setUnityPointsPerAd(e.target.value)}
                          type="number"
                          disabled={!unityAdsEnabled}
                        />
                      </div>
                      <div className="col-6">
                        <ExInput
                          label="Daily Video Limit"
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

              {/* AdGem */}
              <div className="col-12 col-md-6 col-xl-4">
                <div className="p-3 rounded-3 bg-light border h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <i className="ri-apps-2-line fs-18 text-danger"></i>
                        <span className="fw-bold small text-dark">AdGem Offerwall</span>
                      </div>
                      <ToggleSwitch
                        checked={adgemEnabled}
                        onChange={() => setAdgemEnabled(!adgemEnabled)}
                      />
                    </div>
                    <div className="row g-2">
                      <div className="col-6">
                        <ExInput
                          label="Points / Offer"
                          value={adgemPointsPerOffer}
                          onChange={(e: any) => setAdgemPointsPerOffer(e.target.value)}
                          type="number"
                          disabled={!adgemEnabled}
                        />
                      </div>
                      <div className="col-6">
                        <ExInput
                          label="Daily Offer Limit"
                          value={adgemDailyLimit}
                          onChange={(e: any) => setAdgemDailyLimit(e.target.value)}
                          type="number"
                          disabled={!adgemEnabled}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TheoremReach */}
              <div className="col-12 col-md-6 col-xl-4">
                <div className="p-3 rounded-3 bg-light border h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <i className="ri-line-chart-line fs-18 text-primary"></i>
                        <span className="fw-bold small text-dark">TheoremReach Router</span>
                      </div>
                      <ToggleSwitch
                        checked={theoremreachEnabled}
                        onChange={() => setTheoremreachEnabled(!theoremreachEnabled)}
                      />
                    </div>
                    <div className="row g-2">
                      <div className="col-6">
                        <ExInput
                          label="Points / Survey"
                          value={theoremreachPointsPerSurvey}
                          onChange={(e: any) => setTheoremreachPointsPerSurvey(e.target.value)}
                          type="number"
                          disabled={!theoremreachEnabled}
                        />
                      </div>
                      <div className="col-6">
                        <ExInput
                          label="Daily Survey Limit"
                          value={theoremreachDailyLimit}
                          onChange={(e: any) => setTheoremreachDailyLimit(e.target.value)}
                          type="number"
                          disabled={!theoremreachEnabled}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CPX Research */}
              <div className="col-12 col-md-6 col-xl-6">
                <div className="p-3 rounded-3 bg-light border h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <i className="ri-survey-fill fs-18 text-info"></i>
                        <span className="fw-bold small text-dark">CPX Research Surveys</span>
                      </div>
                      <ToggleSwitch
                        checked={cpxEnabled}
                        onChange={() => setCpxEnabled(!cpxEnabled)}
                      />
                    </div>
                    <div className="row g-2">
                      <div className="col-6">
                        <ExInput
                          label="Points / Survey"
                          value={cpxPointsPerSurvey}
                          onChange={(e: any) => setCpxPointsPerSurvey(e.target.value)}
                          type="number"
                          disabled={!cpxEnabled}
                        />
                      </div>
                      <div className="col-6">
                        <ExInput
                          label="Daily Survey Limit"
                          value={cpxDailyLimit}
                          onChange={(e: any) => setCpxDailyLimit(e.target.value)}
                          type="number"
                          disabled={!cpxEnabled}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BitLabs */}
              <div className="col-12 col-md-6 col-xl-6">
                <div className="p-3 rounded-3 bg-light border h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <i className="ri-bubble-chart-line fs-18 text-purple" style={{ color: "#7c3aed" }}></i>
                        <span className="fw-bold small text-dark">BitLabs Survey Wall</span>
                      </div>
                      <ToggleSwitch
                        checked={bitlabsEnabled}
                        onChange={() => setBitlabsEnabled(!bitlabsEnabled)}
                      />
                    </div>
                    <div className="row g-2">
                      <div className="col-6">
                        <ExInput
                          label="Points / Survey"
                          value={bitlabsPointsPerSurvey}
                          onChange={(e: any) => setBitlabsPointsPerSurvey(e.target.value)}
                          type="number"
                          disabled={!bitlabsEnabled}
                        />
                      </div>
                      <div className="col-6">
                        <ExInput
                          label="Daily Survey Limit"
                          value={bitlabsDailyLimit}
                          onChange={(e: any) => setBitlabsDailyLimit(e.target.value)}
                          type="number"
                          disabled={!bitlabsEnabled}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdsWatchConfig;
