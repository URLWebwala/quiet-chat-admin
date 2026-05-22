import Button from "@/extra/Button";
import { ExInput } from "@/extra/Input";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { getSetting, updateSetting } from "@/store/settingSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import React, { useEffect, useRef, useState } from "react";
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
};

const AdsWatchApiSettings = () => {
  const dispatch = useAppDispatch();
  const { setting }: any = useSelector((state: RootStore) => state.setting);
  const hydratedForId = useRef<string | null>(null);

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
  };

  useEffect(() => {
    dispatch(getSetting());
  }, [dispatch]);

  useEffect(() => {
    if (!setting?._id || hydratedForId.current === setting._id) return;
    populateApiFields(setting, fieldSetters);
    hydratedForId.current = setting._id;
  }, [setting?._id, setting]);

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
        },
      })
    );

    if (updateSetting.fulfilled.match(result) && result.payload?.status) {
      populateApiFields(result.payload.data, fieldSetters);
    }
  };

  return (
    <div className="ads-watch-api-settings">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h5 className="mb-1">Platform Ad Units (AdMob / AdSense)</h5>
          <p className="text-muted mb-0">
            Mobile app aur web me ads dikhane ke liye AdMob / AdSense IDs yahan set karein.
            App in IDs ko API se fetch karegi.
          </p>
        </div>
        <Button className="submitButton text-white" text="Save API Settings" onClick={handleSubmit} />
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
                onChange={(e: any) => setAndroidAppId(e.target.value)}
              />
              <ExInput
                label="Banner Ad Unit ID"
                placeholder="ca-app-pub-xxx/xxx"
                value={androidBannerId}
                onChange={(e: any) => setAndroidBannerId(e.target.value)}
              />
              <ExInput
                label="Interstitial Ad Unit ID"
                placeholder="ca-app-pub-xxx/xxx"
                value={androidInterstitialId}
                onChange={(e: any) => setAndroidInterstitialId(e.target.value)}
              />
              <ExInput
                label="Rewarded Ad Unit ID"
                placeholder="ca-app-pub-xxx/xxx"
                value={androidRewardedId}
                onChange={(e: any) => setAndroidRewardedId(e.target.value)}
              />
              <div className="d-flex justify-content-between align-items-center pt-2">
                <span>Enable Android Ads</span>
                <ToggleSwitch
                  checked={androidAdsEnabled}
                  onChange={() => setAndroidAdsEnabled(!androidAdsEnabled)}
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
                onChange={(e: any) => setIosAppId(e.target.value)}
              />
              <ExInput
                label="Banner Ad Unit ID"
                placeholder="ca-app-pub-xxx/xxx"
                value={iosBannerId}
                onChange={(e: any) => setIosBannerId(e.target.value)}
              />
              <ExInput
                label="Interstitial Ad Unit ID"
                placeholder="ca-app-pub-xxx/xxx"
                value={iosInterstitialId}
                onChange={(e: any) => setIosInterstitialId(e.target.value)}
              />
              <ExInput
                label="Rewarded Ad Unit ID"
                placeholder="ca-app-pub-xxx/xxx"
                value={iosRewardedId}
                onChange={(e: any) => setIosRewardedId(e.target.value)}
              />
              <div className="d-flex justify-content-between align-items-center pt-2">
                <span>Enable iOS Ads</span>
                <ToggleSwitch
                  checked={iosAdsEnabled}
                  onChange={() => setIosAdsEnabled(!iosAdsEnabled)}
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
                onChange={(e: any) => setWebAdsenseClientId(e.target.value)}
              />
              <ExInput
                label="Ad Slot ID"
                placeholder="1234567890"
                value={webAdSlotId}
                onChange={(e: any) => setWebAdSlotId(e.target.value)}
              />
              <div className="d-flex justify-content-between align-items-center pt-2">
                <span>Enable Web Ads</span>
                <ToggleSwitch
                  checked={webAdsEnabled}
                  onChange={() => setWebAdsEnabled(!webAdsEnabled)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdsWatchApiSettings;
