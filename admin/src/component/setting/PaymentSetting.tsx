import Button from "@/extra/Button";
import InfoTooltip from "@/extra/InfoTooltip";
import {
  razorpayContent,
  flutterWaveContent,
  stripeContent,
  inAppPurchaseContent,
  paystackContent,
  cashfreeContent,
  paypalContent,
} from "@/extra/infoContent";
import { ExInput } from "@/extra/Input";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { getSetting, handleSetting, updateSetting } from "@/store/settingSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { isSkeleton } from "@/utils/allSelector";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

interface ErrorState {
  razorPaySecretKeyText: string;
  razorPayIdText: string;
  stripeSecretKeyText: string;
  stripePublishableKeyText: string;
  flutterWaveKeyText: string;
  paystackSecretKeyText: string;
  paystackPublishableKeyText: string;
  cashfreeSecretKeyText: string;
  cashfreeIdText: string;

  paypalSecretKeyText: string;
  paypalIdText: string;

}

const PaymetSetting = () => {
  const { setting }: any = useSelector((state: RootStore) => state?.setting);
  const roleSkeleton = useSelector(isSkeleton);

  const [razorPaySecretKeyText, setrazorPaySecretKeyText] = useState<any>("");
  const [razorPayIdText, setRazorPayIdText] = useState<any>("");
  const [razorpayXFromAccountNumber, setRazorpayXFromAccountNumber] = useState("");
  const [razorpayXPayoutWebhookSecret, setRazorpayXPayoutWebhookSecret] = useState("");
  const [paypalIdText, setPaypalIdText] = useState<any>("");
  const [cashfreeIdText, setCashfreeIdText] = useState<any>("");
  const [cashfreeTestClientIdText, setCashfreeTestClientIdText] = useState<any>("");
  const [cashfreeTestClientSecretText, setCashfreeTestClientSecretText] = useState<any>("");
  const [cashfreeProdClientIdText, setCashfreeProdClientIdText] = useState<any>("");
  const [cashfreeProdClientSecretText, setCashfreeProdClientSecretText] = useState<any>("");
  const [cashfreeEnv, setCashfreeEnv] = useState<"sandbox" | "production">("production");
  const [cashfreeEnvClientIdText, setCashfreeEnvClientIdText] = useState<any>("");
  const [cashfreeEnvClientSecretText, setCashfreeEnvClientSecretText] = useState<any>("");
  const [stripeSecretKeyText, setStripeSecretKeyText] = useState<any>("");
  const [stripePublishableKeyText, setstripePublishableKeyText] = useState<any>("");
  const [flutterWaveKeyText, setFlutterWaveKeyText] = useState<any>("");
  const [paystackSecretKeyText, setPaystackSecretKeyText] = useState<any>("");
  const [paystackPublishableKeyText, setPaystackPublishableKeyText] = useState<any>("");
  const [cashfreeSecretKeyText, setCashfreeSecretKeyText] = useState<any>("");
  const [cashfreeClientSecretKeyText, setCashfreeClientSecretKeyText] = useState<any>("");
  const [paypalSecretKeyText, setPaypalSecretKeyText] = useState<any>("");

  const [data, setData] = useState<any>();
  const [settingId, setSettingId] = useState<any>();

  const [isRazorPay, setIsRazorPay] = useState<boolean>(false);
  const [isFlutterWave, setIsFlutterWave] = useState<boolean>(false);
  const [isflutterWaveEnabled, setIsFlutterWaveEnabled] = useState<boolean>(false);
  const [googlePlayEnabled, setGooglePlayEnabled] = useState<boolean>(false);
  const [isStripePay, setIsStripe] = useState<boolean>(false);
  const [isPaystackAndroid, setIsPaystackAndroid] = useState<boolean>(false);
  const [isPaystackIos, setIsPaystackIos] = useState<boolean>(false);
  const [isCashfreeAndroid, setIsCashfreeAndroid] = useState<boolean>(false);
  const [isCashfreeIos, setIsCashfreeIos] = useState<boolean>(false);
  const [isPaypalAndroid, setIsPaypalAndroid] = useState<boolean>(false);
  const [isPaypalIos, setIsPaypalIos] = useState<boolean>(false);
  const [isRazorpayIos, setIsRazorpayIos] = useState<boolean>(false);
  const [isStripeIos, setIsStripeIos] = useState<boolean>(false);
  const [isGooglePayIos, setIsGooglePayIos] = useState<boolean>(false);

  const [error, setError] = useState<any>({});

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getSetting());
  }, [dispatch]);

  useEffect(() => {
    setData(setting);
  }, [setting]);

  useEffect(() => {
    if (setting && setting._id) {
      setSettingId(setting._id);
      setrazorPaySecretKeyText(setting?.razorpaySecretKey);
      setRazorPayIdText(setting?.razorpayId);
      setRazorpayXFromAccountNumber(setting?.razorpayXFromAccountNumber ?? "");
      setRazorpayXPayoutWebhookSecret(setting?.razorpayXPayoutWebhookSecret ?? "");
      setStripeSecretKeyText(setting?.stripeSecretKey);
      setstripePublishableKeyText(setting?.stripePublishableKey);
      setFlutterWaveKeyText(setting?.flutterwaveId);
      setIsRazorPay(setting?.razorpayEnabled);
      setIsFlutterWave(setting?.flutterwaveEnabled);
      setIsStripe(setting?.stripeEnabled);
      setGooglePlayEnabled(setting?.googlePlayEnabled);
      setPaystackSecretKeyText(setting?.paystackSecretKey);
      setPaystackPublishableKeyText(setting?.paystackPublicKey);
      setIsPaystackAndroid(setting?.paystackAndroidEnabled);
      setIsPaystackIos(setting?.paystackIosEnabled);
      setCashfreeSecretKeyText(setting?.cashfreeSecretKey);
      setCashfreeIdText(setting?.cashfreeClientId);
      const testId = setting?.cashfreeTestClientId || "";
      const testSecret = setting?.cashfreeTestClientSecret || "";
      const prodId = setting?.cashfreeProdClientId || "";
      const prodSecret = setting?.cashfreeProdClientSecret || "";
      setCashfreeTestClientIdText(testId);
      setCashfreeTestClientSecretText(testSecret);
      setCashfreeProdClientIdText(prodId);
      setCashfreeProdClientSecretText(prodSecret);
      const preferredEnv: "sandbox" | "production" = setting?.cashfreeSelectedEnv === "production" ? "production" : "sandbox";
      setCashfreeEnv(preferredEnv);
      setCashfreeEnvClientIdText(preferredEnv === "production" ? prodId : testId);
      setCashfreeEnvClientSecretText(preferredEnv === "production" ? prodSecret : testSecret);
      setIsCashfreeAndroid(setting?.cashfreeAndroidEnabled);
      setIsCashfreeIos(setting?.cashfreeIosEnabled);
      setPaypalSecretKeyText(setting?.paypalSecretKey);
      setPaypalIdText(setting?.paypalClientId);
      setIsPaypalAndroid(setting?.paypalAndroidEnabled);
      setIsPaypalIos(setting?.paypalIosEnabled);
      setCashfreeClientSecretKeyText(setting?.cashfreeClientSecret);
      setIsFlutterWaveEnabled(setting?.flutterwaveIosEnabled);
      setIsRazorpayIos(setting?.razorpayIosEnabled);
      setIsStripeIos(setting?.stripeIosEnabled);
      setIsGooglePayIos(setting?.googlePayIosEnabled);

    }
  }, [setting]);

  const handleSubmit = (e: any) => {
    e.preventDefault();

    const trimmedEnvId = String(cashfreeEnvClientIdText || "").trim();
    const trimmedEnvSecret = String(cashfreeEnvClientSecretText || "").trim();
    const nextTestId = cashfreeEnv === "sandbox" ? trimmedEnvId : String(cashfreeTestClientIdText || "").trim();
    const nextTestSecret = cashfreeEnv === "sandbox" ? trimmedEnvSecret : String(cashfreeTestClientSecretText || "").trim();
    const nextProdId = cashfreeEnv === "production" ? trimmedEnvId : String(cashfreeProdClientIdText || "").trim();
    const nextProdSecret =
      cashfreeEnv === "production" ? trimmedEnvSecret : String(cashfreeProdClientSecretText || "").trim();

    const validateCashfreePair = (
      id: string,
      secret: string,
      label: string
    ): string => {
      if (!id && !secret) return "";
      if (!id || !secret) return `${label}: both Client Id and Client Secret are required.`;
      const idLower = id.toLowerCase();
      const secLower = secret.toLowerCase();
      if (idLower.startsWith("cfsk_")) return `${label}: Client Id looks like a Secret key. Please swap fields.`;
      if (!secLower.startsWith("cfsk_")) return `${label}: Client Secret must start with cfsk_.`;
      if (label.includes("Sandbox") && secLower.includes("_prod_")) {
        return `${label}: production secret detected. Use cfsk...test...`;
      }
      if (label.includes("Production") && secLower.includes("_test_")) {
        return `${label}: test secret detected. Use cfsk...prod...`;
      }
      return "";
    };

    const localErr =
      cashfreeEnv === "sandbox"
        ? validateCashfreePair(nextTestId, nextTestSecret, "Sandbox / Testing")
        : validateCashfreePair(nextProdId, nextProdSecret, "Production / Live");
    if (localErr) {
      return setError((prev: any) => ({ ...prev, cashfreeEnvValidation: localErr }));
    }
    setError((prev: any) => ({ ...prev, cashfreeEnvValidation: "" }));

    const payload = {
      settingDataSubmit: {
        razorpaySecretKey: razorPaySecretKeyText,
        razorpayId: razorPayIdText,
        razorpayXFromAccountNumber,
        razorpayXPayoutWebhookSecret,
        stripeSecretKey: stripeSecretKeyText,
        stripePublishableKey: stripePublishableKeyText,
        flutterwaveId: flutterWaveKeyText,
        paystackSecretKey: paystackSecretKeyText,
        paystackPublicKey: paystackPublishableKeyText,
        paypalSecretKey: paypalSecretKeyText,
        paypalClientId: paypalIdText,
        // Keep legacy pair synced with currently selected environment.
        cashfreeClientId: trimmedEnvId || cashfreeIdText,
        cashfreeClientSecret: trimmedEnvSecret || cashfreeClientSecretKeyText,
        cashfreeTestClientId: nextTestId,
        cashfreeTestClientSecret: nextTestSecret,
        cashfreeProdClientId: nextProdId,
        cashfreeProdClientSecret: nextProdSecret,
        cashfreeSelectedEnv: cashfreeEnv,
      },
      settingId: data?._id,
    };
    dispatch(updateSetting(payload));
  };

  const handleSettingSwitch: any = (type: any) => {
    const payload = { settingId: settingId, type };
    dispatch(handleSetting(payload));
  };

  const handleCashfreeEnvChange = (nextEnv: "sandbox" | "production") => {
    // Preserve unsaved edits for currently selected env before switching.
    if (cashfreeEnv === "production") {
      setCashfreeProdClientIdText(cashfreeEnvClientIdText || "");
      setCashfreeProdClientSecretText(cashfreeEnvClientSecretText || "");
    } else {
      setCashfreeTestClientIdText(cashfreeEnvClientIdText || "");
      setCashfreeTestClientSecretText(cashfreeEnvClientSecretText || "");
    }
    setCashfreeEnv(nextEnv);
    if (nextEnv === "production") {
      setCashfreeEnvClientIdText(cashfreeProdClientIdText || "");
      setCashfreeEnvClientSecretText(cashfreeProdClientSecretText || "");
    } else {
      setCashfreeEnvClientIdText(cashfreeTestClientIdText || "");
      setCashfreeEnvClientSecretText(cashfreeTestClientSecretText || "");
    }
  };

  return (
    <div className="mainSetting">
      <form onSubmit={handleSubmit} id="expertForm">
        {/* ─── Top Header Action Bar ────────────────────────────────────────── */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 p-3 bg-white rounded-4 shadow-sm gap-3">
          <div>
            <h5 className="mb-1 fw-bold text-dark d-flex align-items-center gap-2">
              <i className="ri-bank-card-line text-primary fs-20" style={{ color: "#9f5aff" }}></i>
              Payment Gateways & Payout Configuration
            </h5>
            <p className="text-muted mb-0 small">
              Configure credentials for wallet coin recharges, native in-app billing, and automated creator payouts.
            </p>
          </div>
          <button
            type="submit"
            className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 fw-bold rounded-3 shadow"
            style={{
              background: "linear-gradient(135deg, #9f5aff 0%, #7c3aed 100%)",
              border: "none",
              fontSize: "14px",
              letterSpacing: "0.2px",
            }}
          >
            <i className="ri-save-3-line fs-18"></i>
            Save Payment Settings
          </button>
        </div>

        {/* ─── Payment Cards Grid ──────────────────────────────────────────── */}
        <div className="row g-4">
          {/* 1. Razorpay & RazorpayX */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, backgroundColor: "#E0F2FE", color: "#0284C7" }}
                  >
                    <i className="ri-secure-payment-line fs-20"></i>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold text-dark">Razorpay & RazorpayX</h6>
                    <span className="text-muted small">Indian UPI, Cards, NetBanking & Creator Payouts</span>
                  </div>
                </div>
                <InfoTooltip title="Razorpay Setup" content={razorpayContent} />
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <ExInput
                    type="text"
                    id="razorPayId"
                    name="razorPayId"
                    label="Razorpay Key ID"
                    placeholder="rzp_live_..."
                    errorMessage={error.razorPayIdText}
                    value={razorPayIdText}
                    onChange={(e: any) => setRazorPayIdText(e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <ExInput
                    type="password"
                    id="razorSecretKey"
                    name="razorSecretKey"
                    label="Razorpay Key Secret"
                    placeholder="Razorpay Secret Key"
                    errorMessage={error.razorPaySecretKeyText}
                    value={razorPaySecretKeyText}
                    onChange={(e: any) => setrazorPaySecretKeyText(e.target.value)}
                  />
                </div>

                <div className="col-6">
                  <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                    <span className="small fw-semibold text-dark">Android Active</span>
                    <ToggleSwitch
                      onClick={() => handleSettingSwitch("razorpayEnabled")}
                      value={isRazorPay}
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                    <span className="small fw-semibold text-dark">iOS Active</span>
                    <ToggleSwitch
                      onClick={() => handleSettingSwitch("razorpayIosEnabled")}
                      value={isRazorpayIos}
                    />
                  </div>
                </div>

                {/* RazorpayX Payouts */}
                <div className="col-12 mt-2 pt-2 border-top">
                  <span className="fw-bold small text-dark d-block mb-1">
                    <i className="ri-bank-line me-1 text-primary"></i>
                    RazorpayX Automated Host Payouts
                  </span>
                  <p className="text-muted mb-2" style={{ fontSize: "11.5px" }}>
                    Source account for host withdrawals. Webhook: <code className="text-primary">/api/client/razorpay/x-payout-webhook</code>
                  </p>
                  <div className="mb-2">
                    <ExInput
                      type="text"
                      id="razorpayXFromAccountNumber"
                      name="razorpayXFromAccountNumber"
                      label="RazorpayX Account Number / Email"
                      placeholder="e.g. 232323XXXXXX0000"
                      value={razorpayXFromAccountNumber}
                      onChange={(e: any) => setRazorpayXFromAccountNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <ExInput
                      type="password"
                      id="razorpayXPayoutWebhookSecret"
                      name="razorpayXPayoutWebhookSecret"
                      label="RazorpayX Webhook Secret (Optional)"
                      placeholder="Leave empty to use Razorpay key secret"
                      value={razorpayXPayoutWebhookSecret}
                      onChange={(e: any) => setRazorpayXPayoutWebhookSecret(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Stripe Payment Gateway */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, backgroundColor: "#EEF2FF", color: "#4F46E5" }}
                  >
                    <i className="ri-global-line fs-20"></i>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold text-dark">Stripe Payments</h6>
                    <span className="text-muted small">Global Credit / Debit Cards & International Currencies</span>
                  </div>
                </div>
                <InfoTooltip title="Stripe Setup" content={stripeContent} />
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <ExInput
                    type="text"
                    id="stripePublishableKey"
                    name="stripePublishableKey"
                    label="Stripe Publishable Key"
                    placeholder="pk_live_..."
                    errorMessage={error.stripePublishableKeyText}
                    value={stripePublishableKeyText}
                    onChange={(e: any) => setstripePublishableKeyText(e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <ExInput
                    type="password"
                    id="stripeSecretKey"
                    name="stripeSecretKey"
                    label="Stripe Secret Key"
                    placeholder="sk_live_..."
                    errorMessage={error.stripeSecretKeyText}
                    value={stripeSecretKeyText}
                    onChange={(e: any) => setStripeSecretKeyText(e.target.value)}
                  />
                </div>

                <div className="col-6">
                  <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                    <span className="small fw-semibold text-dark">Android Active</span>
                    <ToggleSwitch
                      onClick={() => handleSettingSwitch("stripeEnabled")}
                      value={isStripePay}
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                    <span className="small fw-semibold text-dark">iOS Active</span>
                    <ToggleSwitch
                      onClick={() => handleSettingSwitch("stripeIosEnabled")}
                      value={isStripeIos}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. In-App Purchases (Google Play & Apple App Store) */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, backgroundColor: "#F0FDF4", color: "#16A34A" }}
                  >
                    <i className="ri-google-play-line fs-20"></i>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold text-dark">In-App Purchases (Native)</h6>
                    <span className="text-muted small">Store billing directly inside mobile apps</span>
                  </div>
                </div>
                <InfoTooltip title="In-App Purchase" content={inAppPurchaseContent} />
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light border">
                    <div className="d-flex align-items-center gap-3">
                      <i className="ri-google-play-fill fs-24 text-success"></i>
                      <div>
                        <span className="fw-bold text-dark small d-block">Google Play Billing</span>
                        <span className="text-muted" style={{ fontSize: "11.5px" }}>Enable native Google Play coin purchases on Android</span>
                      </div>
                    </div>
                    <ToggleSwitch
                      onClick={() => handleSettingSwitch("googlePlayEnabled")}
                      value={googlePlayEnabled}
                    />
                  </div>
                </div>

                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light border">
                    <div className="d-flex align-items-center gap-3">
                      <i className="ri-apple-fill fs-24 text-dark"></i>
                      <div>
                        <span className="fw-bold text-dark small d-block">Apple Store In-App Purchase</span>
                        <span className="text-muted" style={{ fontSize: "11.5px" }}>Enable native StoreKit IAP coin purchases on iOS</span>
                      </div>
                    </div>
                    <ToggleSwitch
                      onClick={() => handleSettingSwitch("googlePayIosEnabled")}
                      value={isGooglePayIos}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Cashfree Payments */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, backgroundColor: "#FFF7ED", color: "#EA580C" }}
                  >
                    <i className="ri-exchange-dollar-line fs-20"></i>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold text-dark">Cashfree Payment Gateway</h6>
                    <span className="text-muted small">Indian Gateway with sandbox & production support</span>
                  </div>
                </div>
                <InfoTooltip title="Cashfree Setup" content={cashfreeContent} />
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted mb-1">Environment</label>
                  <select
                    className="form-select rounded-3"
                    value={cashfreeEnv}
                    onChange={(e) => handleCashfreeEnvChange(e.target.value as "sandbox" | "production")}
                  >
                    <option value="sandbox">Sandbox / Test Mode</option>
                    <option value="production">Production / Live Mode</option>
                  </select>
                </div>

                <div className="col-12">
                  <ExInput
                    type="text"
                    id="cashfreeClientIdByEnv"
                    name="cashfreeClientIdByEnv"
                    label={`Cashfree Client App ID (${cashfreeEnv === "production" ? "Production" : "Sandbox"})`}
                    placeholder={cashfreeEnv === "production" ? "CF Production App ID" : "CF Sandbox App ID"}
                    value={cashfreeEnvClientIdText}
                    onChange={(e: any) => setCashfreeEnvClientIdText(e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <ExInput
                    type="password"
                    id="cashfreeClientSecretByEnv"
                    name="cashfreeClientSecretByEnv"
                    label={`Cashfree Client Secret (${cashfreeEnv === "production" ? "Production" : "Sandbox"})`}
                    placeholder={cashfreeEnv === "production" ? "cfsk_ma_prod_..." : "cfsk_ma_test_..."}
                    value={cashfreeEnvClientSecretText}
                    onChange={(e: any) => setCashfreeEnvClientSecretText(e.target.value)}
                  />
                  {!!error.cashfreeEnvValidation && (
                    <small className="text-danger d-block mt-1">
                      {error.cashfreeEnvValidation}
                    </small>
                  )}
                </div>

                <div className="col-6">
                  <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                    <span className="small fw-semibold text-dark">Android Active</span>
                    <ToggleSwitch
                      onClick={() => handleSettingSwitch("cashfreeAndroidEnabled")}
                      value={isCashfreeAndroid}
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                    <span className="small fw-semibold text-dark">iOS Active</span>
                    <ToggleSwitch
                      onClick={() => handleSettingSwitch("cashfreeIosEnabled")}
                      value={isCashfreeIos}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Paystack (Africa & International) */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, backgroundColor: "#CCFBF1", color: "#0D9488" }}
                  >
                    <i className="ri-stack-line fs-20"></i>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold text-dark">Paystack Gateway</h6>
                    <span className="text-muted small">Cards, Mobile Money & African Payment Channels</span>
                  </div>
                </div>
                <InfoTooltip title="Paystack Setup" content={paystackContent} />
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <ExInput
                    type="text"
                    id="paystackPublishableKey"
                    name="paystackPublishableKey"
                    label="Paystack Public Key"
                    placeholder="pk_live_..."
                    errorMessage={error.paystackPublishableKeyText}
                    value={paystackPublishableKeyText}
                    onChange={(e: any) => setPaystackPublishableKeyText(e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <ExInput
                    type="password"
                    id="paystackSecretKey"
                    name="paystackSecretKey"
                    label="Paystack Secret Key"
                    placeholder="sk_live_..."
                    errorMessage={error.paystackSecretKeyText}
                    value={paystackSecretKeyText}
                    onChange={(e: any) => setPaystackSecretKeyText(e.target.value)}
                  />
                </div>

                <div className="col-6">
                  <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                    <span className="small fw-semibold text-dark">Android Active</span>
                    <ToggleSwitch
                      onClick={() => handleSettingSwitch("paystackAndroidEnabled")}
                      value={isPaystackAndroid}
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                    <span className="small fw-semibold text-dark">iOS Active</span>
                    <ToggleSwitch
                      onClick={() => handleSettingSwitch("paystackIosEnabled")}
                      value={isPaystackIos}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 6. PayPal */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, backgroundColor: "#FEF3C7", color: "#D97706" }}
                  >
                    <i className="ri-paypal-line fs-20"></i>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold text-dark">PayPal Checkout</h6>
                    <span className="text-muted small">Global PayPal account & card processing</span>
                  </div>
                </div>
                <InfoTooltip title="PayPal Setup" content={paypalContent} />
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <ExInput
                    type="text"
                    id="paypalId"
                    name="paypalId"
                    label="PayPal Client ID"
                    placeholder="Enter PayPal Client ID"
                    errorMessage={error.paypalIdText}
                    value={paypalIdText}
                    onChange={(e: any) => setPaypalIdText(e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <ExInput
                    type="password"
                    id="paypalSecretKey"
                    name="paypalSecretKey"
                    label="PayPal Secret Key"
                    placeholder="Enter PayPal Secret Key"
                    errorMessage={error.paypalSecretKeyText}
                    value={paypalSecretKeyText}
                    onChange={(e: any) => setPaypalSecretKeyText(e.target.value)}
                  />
                </div>

                <div className="col-6">
                  <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                    <span className="small fw-semibold text-dark">Android Active</span>
                    <ToggleSwitch
                      onClick={() => handleSettingSwitch("paypalAndroidEnabled")}
                      value={isPaypalAndroid}
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                    <span className="small fw-semibold text-dark">iOS Active</span>
                    <ToggleSwitch
                      onClick={() => handleSettingSwitch("paypalIosEnabled")}
                      value={isPaypalIos}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Flutterwave */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, backgroundColor: "#FDF2F8", color: "#DB2777" }}
                  >
                    <i className="ri-flashlight-line fs-20"></i>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold text-dark">Flutterwave Gateway</h6>
                    <span className="text-muted small">Pan-African online payment infrastructure</span>
                  </div>
                </div>
                <InfoTooltip title="Flutterwave Setup" content={flutterWaveContent} />
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <ExInput
                    type="text"
                    id="flutterWaveId"
                    name="flutterWaveId"
                    label="Flutterwave Public / Merchant ID"
                    placeholder="FLWPUBK_TEST-..."
                    errorMessage={error.flutterWaveKeyText}
                    value={flutterWaveKeyText}
                    onChange={(e: any) => setFlutterWaveKeyText(e.target.value)}
                  />
                </div>

                <div className="col-6">
                  <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                    <span className="small fw-semibold text-dark">Android Active</span>
                    <ToggleSwitch
                      onClick={() => handleSettingSwitch("flutterwaveEnabled")}
                      value={isFlutterWave}
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                    <span className="small fw-semibold text-dark">iOS Active</span>
                    <ToggleSwitch
                      onClick={() => handleSettingSwitch("flutterwaveIosEnabled")}
                      value={isflutterWaveEnabled}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PaymetSetting;
