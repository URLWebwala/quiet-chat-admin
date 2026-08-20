import Button from "@/extra/Button";
import { ExInput } from "@/extra/Input";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { getSetting, updateSetting } from "@/store/settingSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const populateApiFields = (source: any, setters: any) => {
  if (!source) return;

  setters.setAndroidAppId(source.adsWatchAndroidAppId || "");
  setters.setAndroidBannerId(source.adsWatchAndroidBannerAdUnitId || "");
  setters.setAndroidInterstitialId(source.adsWatchAndroidInterstitialAdUnitId || "");
  setters.setAndroidRewardedId(source.adsWatchAndroidRewardedAdUnitId || "");
  if (source.adsWatchAndroidAdsEnabled !== undefined) {
    setters.setAndroidAdsEnabled(!!source.adsWatchAndroidAdsEnabled);
  }

  setters.setIosAppId(source.adsWatchIosAppId || "");
  setters.setIosBannerId(source.adsWatchIosBannerAdUnitId || "");
  setters.setIosInterstitialId(source.adsWatchIosInterstitialAdUnitId || "");
  setters.setIosRewardedId(source.adsWatchIosRewardedAdUnitId || "");
  if (source.adsWatchIosAdsEnabled !== undefined) {
    setters.setIosAdsEnabled(!!source.adsWatchIosAdsEnabled);
  }

  setters.setWebAdsenseClientId(source.adsWatchWebAdsenseClientId || "");
  setters.setWebAdSlotId(source.adsWatchWebAdSlotId || "");
  if (source.adsWatchWebAdsEnabled !== undefined) {
    setters.setWebAdsEnabled(!!source.adsWatchWebAdsEnabled);
  }

  setters.setUnityGameIdAndroid(source.unityGameIdAndroid || "");
  setters.setUnityPlacementIdAndroid(source.unityPlacementIdAndroid || "Rewarded_Android");
  setters.setUnityGameIdIos(source.unityGameIdIos || "");
  setters.setUnityPlacementIdIos(source.unityPlacementIdIos || "Rewarded_iOS");
  setters.setUnityOrganizationId(source.unityOrganizationId || "");
  setters.setUnityApiKey(source.unityApiKey || "");

  setters.setBitlabsAppId(source.bitlabsAppId || "482cac93-7553-463c-89e1-dfc88101e03b");
  setters.setBitlabsSecretKey(source.bitlabsSecretKey || "");
  setters.setBitlabsServerKey(source.bitlabsServerKey || "");

  setters.setCpxAppId(source.cpxAppId || "34491");
  setters.setCpxSecretKey(source.cpxSecretKey || "");
  setters.setCpxServerKey(source.cpxServerKey || "");

  setters.setAdgemAppId(source.adgemAppId || "");
  setters.setAdgemApiToken(source.adgemApiToken || "");
  setters.setAdgemSecretKey(source.adgemSecretKey || "");

  setters.setTheoremreachApiKey(source.theoremreachApiKey || "");
  setters.setTheoremreachSecretKey(source.theoremreachSecretKey || "");
};

const AdsWatchApiSettings = () => {
  const dispatch = useAppDispatch();
  const { setting }: any = useSelector((state: RootStore) => state.setting);

  const [isEditing, setIsEditing] = useState(false);

  const [androidAppId, setAndroidAppId] = useState("");
  const [androidBannerId, setAndroidBannerId] = useState("");
  const [androidInterstitialId, setAndroidInterstitialId] = useState("");
  const [androidRewardedId, setAndroidRewardedId] = useState("");
  const [androidAdsEnabled, setAndroidAdsEnabled] = useState(false);
  const [iosAppId, setIosAppId] = useState("");
  const [iosBannerId, setIosBannerId] = useState("");
  const [iosInterstitialId, setIosInterstitialId] = useState("");
  const [iosRewardedId, setIosRewardedId] = useState("");
  const [iosAdsEnabled, setIosAdsEnabled] = useState(false);
  const [webAdsenseClientId, setWebAdsenseClientId] = useState("");
  const [webAdSlotId, setWebAdSlotId] = useState("");
  const [webAdsEnabled, setWebAdsEnabled] = useState(false);

  const [unityGameIdAndroid, setUnityGameIdAndroid] = useState("");
  const [unityPlacementIdAndroid, setUnityPlacementIdAndroid] = useState("Rewarded_Android");
  const [unityGameIdIos, setUnityGameIdIos] = useState("");
  const [unityPlacementIdIos, setUnityPlacementIdIos] = useState("Rewarded_iOS");
  const [unityOrganizationId, setUnityOrganizationId] = useState("");
  const [unityApiKey, setUnityApiKey] = useState("");

  const [bitlabsAppId, setBitlabsAppId] = useState("482cac93-7553-463c-89e1-dfc88101e03b");
  const [bitlabsSecretKey, setBitlabsSecretKey] = useState("");
  const [bitlabsServerKey, setBitlabsServerKey] = useState("");

  const [cpxAppId, setCpxAppId] = useState("34491");
  const [cpxSecretKey, setCpxSecretKey] = useState("");
  const [cpxServerKey, setCpxServerKey] = useState("");

  const [adgemAppId, setAdgemAppId] = useState("");
  const [adgemApiToken, setAdgemApiToken] = useState("");
  const [adgemSecretKey, setAdgemSecretKey] = useState("");

  const [theoremreachApiKey, setTheoremreachApiKey] = useState("");
  const [theoremreachSecretKey, setTheoremreachSecretKey] = useState("");

  const fieldSetters = {
    setAndroidAppId,
    setAndroidBannerId,
    setAndroidInterstitialId,
    setAndroidRewardedId,
    setAndroidAdsEnabled,
    setIosAppId,
    setIosBannerId,
    setIosInterstitialId,
    setIosRewardedId,
    setIosAdsEnabled,
    setWebAdsenseClientId,
    setWebAdSlotId,
    setWebAdsEnabled,
    setUnityGameIdAndroid,
    setUnityPlacementIdAndroid,
    setUnityGameIdIos,
    setUnityPlacementIdIos,
    setUnityOrganizationId,
    setUnityApiKey,
    setBitlabsAppId,
    setBitlabsSecretKey,
    setBitlabsServerKey,
    setCpxAppId,
    setCpxSecretKey,
    setCpxServerKey,
    setAdgemAppId,
    setAdgemApiToken,
    setAdgemSecretKey,
    setTheoremreachApiKey,
    setTheoremreachSecretKey,
  };

  useEffect(() => {
    let active = true;

    (async () => {
      const result = await dispatch(getSetting());
      if (!active) return;
      if (getSetting.fulfilled.match(result) && result.payload?.data) {
        populateApiFields(result.payload.data, fieldSetters);
      }
    })();

    return () => {
      active = false;
    };
  }, [dispatch]);

  const handleCancel = () => {
    if (setting) {
      populateApiFields(setting, fieldSetters);
    }
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    if (!setting?._id) return;

    const result = await dispatch(
      updateSetting({
        settingId: setting._id,
        settingDataSubmit: {
          adsWatchAndroidAppId: androidAppId,
          adsWatchAndroidBannerAdUnitId: androidBannerId,
          adsWatchAndroidInterstitialAdUnitId: androidInterstitialId,
          adsWatchAndroidRewardedAdUnitId: androidRewardedId,
          adsWatchAndroidAdsEnabled: androidAdsEnabled,
          adsWatchIosAppId: iosAppId,
          adsWatchIosBannerAdUnitId: iosBannerId,
          adsWatchIosInterstitialAdUnitId: iosInterstitialId,
          adsWatchIosRewardedAdUnitId: iosRewardedId,
          adsWatchIosAdsEnabled: iosAdsEnabled,
          adsWatchWebAdsenseClientId: webAdsenseClientId,
          adsWatchWebAdSlotId: webAdSlotId,
          adsWatchWebAdsEnabled: webAdsEnabled,
          unityGameIdAndroid,
          unityPlacementIdAndroid,
          unityGameIdIos,
          unityPlacementIdIos,
          unityOrganizationId,
          unityApiKey,
          bitlabsAppId,
          bitlabsSecretKey,
          bitlabsServerKey,
          cpxAppId,
          cpxSecretKey,
          cpxServerKey,
          adgemAppId,
          adgemApiToken,
          adgemSecretKey,
          theoremreachApiKey,
          theoremreachSecretKey,
        },
      })
    );

    if (updateSetting.fulfilled.match(result) && result.payload?.status) {
      populateApiFields(result.payload.data, fieldSetters);
      setIsEditing(false);
    }
  };

  return (
    <div className="ads-watch-api-settings">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h5 className="mb-1">Platform Ad Units (AdMob / AdSense)</h5>
          <p className="text-muted mb-0">
            Set AdMob / AdSense IDs here for mobile and web ads. The app will fetch these IDs from the API.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {!isEditing ? (
            <button
              type="button"
              className="btn btn-outline-primary px-4 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2 shadow-sm"
              onClick={() => setIsEditing(true)}
              style={{ borderColor: "#8F6DFF", color: "#8F6DFF" }}
            >
              <i className="ri-edit-line fs-16"></i>
              Edit
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-outline-secondary px-3 py-2 rounded-3 fw-semibold d-flex align-items-center gap-1 shadow-sm"
              onClick={handleCancel}
            >
              <i className="ri-close-line fs-16"></i>
              Cancel
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary px-4 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2 shadow-sm text-white"
            onClick={handleSubmit}
            disabled={!isEditing}
            style={{
              backgroundColor: "#8F6DFF",
              borderColor: "#8F6DFF",
              opacity: !isEditing ? 0.55 : 1,
              cursor: !isEditing ? "not-allowed" : "pointer",
            }}
          >
            <i className="ri-save-line fs-16"></i>
            Save API Settings
          </button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h6 className="mb-3">Android Settings</h6>
            <div className="d-flex flex-column gap-3">
              <ExInput
                label="App ID"
                placeholder="ca-app-pub-xxxxxxxx~xxxxxxxx"
                value={androidAppId}
                disabled={!isEditing}
                readOnly={!isEditing}
                onChange={(e: any) => setAndroidAppId(e.target.value)}
              />
              <ExInput
                label="Banner Ad Unit ID"
                placeholder="ca-app-pub-xxx/xxx"
                value={androidBannerId}
                disabled={!isEditing}
                readOnly={!isEditing}
                onChange={(e: any) => setAndroidBannerId(e.target.value)}
              />
              <ExInput
                label="Interstitial Ad Unit ID"
                placeholder="ca-app-pub-xxx/xxx"
                value={androidInterstitialId}
                disabled={!isEditing}
                readOnly={!isEditing}
                onChange={(e: any) => setAndroidInterstitialId(e.target.value)}
              />
              <ExInput
                label="Rewarded Ad Unit ID"
                placeholder="ca-app-pub-xxx/xxx"
                value={androidRewardedId}
                disabled={!isEditing}
                readOnly={!isEditing}
                onChange={(e: any) => setAndroidRewardedId(e.target.value)}
              />
              <div className="d-flex justify-content-between align-items-center pt-2">
                <span>Enable Android Ads</span>
                <ToggleSwitch
                  checked={androidAdsEnabled}
                  disabled={!isEditing}
                  onChange={() => isEditing && setAndroidAdsEnabled(!androidAdsEnabled)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h6 className="mb-3">iOS Settings</h6>
            <div className="d-flex flex-column gap-3">
              <ExInput
                label="App ID"
                placeholder="ca-app-pub-xxxxxxxx~xxxxxxxx"
                value={iosAppId}
                disabled={!isEditing}
                readOnly={!isEditing}
                onChange={(e: any) => setIosAppId(e.target.value)}
              />
              <ExInput
                label="Banner Ad Unit ID"
                placeholder="ca-app-pub-xxx/xxx"
                value={iosBannerId}
                disabled={!isEditing}
                readOnly={!isEditing}
                onChange={(e: any) => setIosBannerId(e.target.value)}
              />
              <ExInput
                label="Interstitial Ad Unit ID"
                placeholder="ca-app-pub-xxx/xxx"
                value={iosInterstitialId}
                disabled={!isEditing}
                readOnly={!isEditing}
                onChange={(e: any) => setIosInterstitialId(e.target.value)}
              />
              <ExInput
                label="Rewarded Ad Unit ID"
                placeholder="ca-app-pub-xxx/xxx"
                value={iosRewardedId}
                disabled={!isEditing}
                readOnly={!isEditing}
                onChange={(e: any) => setIosRewardedId(e.target.value)}
              />
              <div className="d-flex justify-content-between align-items-center pt-2">
                <span>Enable iOS Ads</span>
                <ToggleSwitch
                  checked={iosAdsEnabled}
                  disabled={!isEditing}
                  onChange={() => isEditing && setIosAdsEnabled(!iosAdsEnabled)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h6 className="mb-3">Web Settings</h6>
            <div className="d-flex flex-column gap-3">
              <ExInput
                label="AdSense Client (pub-id)"
                placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                value={webAdsenseClientId}
                disabled={!isEditing}
                readOnly={!isEditing}
                onChange={(e: any) => setWebAdsenseClientId(e.target.value)}
              />
              <ExInput
                label="Ad Slot ID"
                placeholder="1234567890"
                value={webAdSlotId}
                disabled={!isEditing}
                readOnly={!isEditing}
                onChange={(e: any) => setWebAdSlotId(e.target.value)}
              />
              <div className="d-flex justify-content-between align-items-center pt-2">
                <span>Enable Web Ads</span>
                <ToggleSwitch
                  checked={webAdsEnabled}
                  disabled={!isEditing}
                  onChange={() => isEditing && setWebAdsEnabled(!webAdsEnabled)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-12">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h6 className="mb-3">Unity Ads Settings (Game ID & Placement ID)</h6>
            <div className="row g-3">
              <div className="col-md-6">
                <ExInput
                  label="Android Game ID"
                  placeholder="5749102"
                  value={unityGameIdAndroid}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setUnityGameIdAndroid(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Android Placement ID"
                  placeholder="Rewarded_Android"
                  value={unityPlacementIdAndroid}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setUnityPlacementIdAndroid(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="iOS Game ID"
                  placeholder="5749102"
                  value={unityGameIdIos}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setUnityGameIdIos(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="iOS Placement ID"
                  placeholder="Rewarded_iOS"
                  value={unityPlacementIdIos}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setUnityPlacementIdIos(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Unity Organization ID (For Analytics API)"
                  placeholder="123456789"
                  value={unityOrganizationId}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setUnityOrganizationId(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="Unity Monetization Reporting API Key"
                  placeholder="secret-token-xxx"
                  value={unityApiKey}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setUnityApiKey(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-12">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h6 className="mb-3">BitLabs Surveys Settings (Survey API & Secret Keys)</h6>
            <div className="row g-3">
              <div className="col-md-4">
                <ExInput
                  label="App / API Token (App ID)"
                  placeholder="482cac93-7553-463c-89e1-dfc88101e03b"
                  value={bitlabsAppId}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setBitlabsAppId(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <ExInput
                  label="Secret Key (HMAC / Hash)"
                  placeholder="Enter Secret Key"
                  value={bitlabsSecretKey}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setBitlabsSecretKey(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <ExInput
                  label="Server-to-Server Key"
                  placeholder="Enter Server-to-Server Key"
                  value={bitlabsServerKey}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setBitlabsServerKey(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-12">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h6 className="mb-3">CPX Research Settings (Survey API & Hash Keys)</h6>
            <div className="row g-3">
              <div className="col-md-4">
                <ExInput
                  label="App / API Token (App ID)"
                  placeholder="34491"
                  value={cpxAppId}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setCpxAppId(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <ExInput
                  label="Secret Key (HMAC / Hash)"
                  placeholder="Enter Secret Key"
                  value={cpxSecretKey}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setCpxSecretKey(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <ExInput
                  label="Server-to-Server Key"
                  placeholder="Enter Server-to-Server Key"
                  value={cpxServerKey}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setCpxServerKey(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* AdGem Settings Card */}
        <div className="col-lg-12">
          <div className="card border-0 shadow-sm p-4 h-100" style={{ borderLeft: "4px solid #EC4899" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="mb-1 text-dark fw-bold">
                  <i className="ri-vip-diamond-line text-danger me-2"></i>
                  AdGem Offerwall & Reporting API Settings
                </h6>
                <p className="text-muted small mb-0">
                  Configure your AdGem App ID, Reporting API Token (https://dashboard.adgem.com), and S2S Postback Secret.
                </p>
              </div>
              <span className="badge bg-danger-subtle text-danger px-3 py-1 rounded-pill fw-semibold">
                S2S Postback & Reporting API Ready
              </span>
            </div>

            <div className="row g-3">
              <div className="col-md-4">
                <ExInput
                  label="AdGem App ID"
                  placeholder="Enter AdGem App ID (e.g. 12345)"
                  value={adgemAppId}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setAdgemAppId(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <ExInput
                  label="Reporting API Bearer Token"
                  placeholder="Enter AdGem API Token"
                  value={adgemApiToken}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setAdgemApiToken(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <ExInput
                  label="Postback Secret Key (Verifier / Hash)"
                  placeholder="Enter Postback Secret"
                  value={adgemSecretKey}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setAdgemSecretKey(e.target.value)}
                />
              </div>

              {/* S2S Postback URL Info Box */}
              <div className="col-12 mt-3">
                <div className="p-3 rounded-3 bg-light border">
                  <span className="fw-bold small text-secondary d-block mb-1">
                    <i className="ri-link me-1"></i> AdGem S2S Postback URL (Paste in AdGem Dashboard):
                  </span>
                  <code className="text-primary fw-semibold user-select-all" style={{ fontSize: "12px" }}>
                    {typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}
                    /api/client/adgem/webhook?player_id={"{player_id}"}&amount={"{amount}"}&payout={"{payout}"}&transaction_id={"{transaction_id}"}&campaign_id={"{campaign_id}"}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TheoremReach Settings Card */}
        <div className="col-lg-12">
          <div className="card border-0 shadow-sm p-4 h-100" style={{ borderLeft: "4px solid #6366F1" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="mb-1 text-dark fw-bold">
                  <i className="ri-bubble-chart-line text-primary me-2"></i>
                  TheoremReach Survey Router & Publisher Settings
                </h6>
                <p className="text-muted small mb-0">
                  Configure your TheoremReach API Key and Secret Key from https://docs.theoremreach.com/
                </p>
              </div>
              <span className="badge bg-primary-subtle text-primary px-3 py-1 rounded-pill fw-semibold">
                S2S Postback & Router Ready
              </span>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <ExInput
                  label="TheoremReach API Key"
                  placeholder="Enter TheoremReach API Key"
                  value={theoremreachApiKey}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setTheoremreachApiKey(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <ExInput
                  label="TheoremReach Secret Key (HMAC / Verifier)"
                  placeholder="Enter TheoremReach Secret Key"
                  value={theoremreachSecretKey}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  onChange={(e: any) => setTheoremreachSecretKey(e.target.value)}
                />
              </div>

              {/* S2S Postback URL Info Box */}
              <div className="col-12 mt-3">
                <div className="p-3 rounded-3 bg-light border">
                  <span className="fw-bold small text-secondary d-block mb-1">
                    <i className="ri-link me-1"></i> TheoremReach S2S Postback URL (Paste in TheoremReach Dashboard):
                  </span>
                  <code className="text-primary fw-semibold user-select-all" style={{ fontSize: "12px" }}>
                    {typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}
                    /api/client/theoremreach/webhook?user_id={"{user_id}"}&reward={"{reward}"}&tx_id={"{tx_id}"}&status={"{status}"}&hash={"{hash}"}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdsWatchApiSettings;
