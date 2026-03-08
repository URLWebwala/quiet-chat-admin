import Button from "@/extra/Button";
import InfoTooltip from "@/extra/InfoTooltip";
import { razorpayContent, flutterWaveContent, stripeContent, googlePlayContent, paystackContent, cashfreeContent, paypalContent } from "@/extra/infoContent";
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
  const [paypalIdText, setPaypalIdText] = useState<any>("");
  const [cashfreeIdText, setCashfreeIdText] = useState<any>("");
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

    const payload = {
      settingDataSubmit: {
        razorpaySecretKey: razorPaySecretKeyText,
        razorpayId: razorPayIdText,
        stripeSecretKey: stripeSecretKeyText,
        stripePublishableKey: stripePublishableKeyText,
        flutterwaveId: flutterWaveKeyText,
        paystackSecretKey: paystackSecretKeyText,
        paystackPublicKey: paystackPublishableKeyText,
        paypalSecretKey: paypalSecretKeyText,
        paypalClientId: paypalIdText,
        cashfreeClientId: cashfreeIdText,
        cashfreeClientSecret: cashfreeClientSecretKeyText,
      },
      settingId: data?._id,
    };
    dispatch(updateSetting(payload));
  };

  const handleSettingSwitch: any = (type: any) => {
    const payload = { settingId: settingId, type };
    dispatch(handleSetting(payload));
  };

  return (
    <div className="mainSetting">
      <form onSubmit={handleSubmit} id="expertForm">
        <div className=" d-flex justify-content-end">
          <div className="  formFooter">
            <Button
              type={`submit`}
              className={`text-light m10-left fw-bold`}
              text={`Submit`}
              style={{ backgroundColor: "#9f5aff" }}
            // style={{ backgroundColor: "#1ebc1e" }}
            />
          </div>
        </div>
        <div className="settingBox row">
          <div className="col-12 col-md-6 mt-3">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2 ">
                <h4 className="settingboxheader">Razor Pay Setting</h4>
                <InfoTooltip title={"Razor Pay"} content={razorpayContent} />
              </div>
              <hr style={{ width: "95%", margin: "5px 9px" }}></hr>
              {roleSkeleton ? (
                <>
                  {[
                    { type: "input" },
                    { type: "input" },
                    { type: "toggle" },
                  ].map((item, index) => (
                    <div key={index} className="mb-4">
                      <div
                        className="skeleton mb-2"
                        style={{
                          height: "16px",
                          width: "30%",
                          marginLeft: "15px",
                        }}
                      ></div>

                      <div
                        className="skeleton"
                        style={{
                          height: item.type === "toggle" ? "24px" : "40px",
                          width: item.type === "toggle" ? "50px" : "97%",
                          borderRadius: item.type === "toggle" ? "12px" : "8px",
                          marginLeft: "10px",
                        }}
                      ></div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ padding: "0px 20px 10px" }}>
                    <div className="col-12">
                      <ExInput
                        type={`text`}
                        id={`razorSecretKey`}
                        name={`razorSecretKey`}
                        label={`Razorpay secret key`}
                        placeholder={`Razorpay Secret Key`}
                        errorMessage={
                          error.razorPaySecretKeyText &&
                          error.razorPaySecretKeyText
                        }
                        value={razorPaySecretKeyText}
                        onChange={(e: any) => {
                          setrazorPaySecretKeyText(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              razorPaySecretKeyText: `RazorPay Secret Key Is Required`,
                            });
                          } else {
                            return setError({
                              ...error,
                              razorPaySecretKeyText: "",
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="col-12">
                      <ExInput
                        type={`text`}
                        id={`razorPayId`}
                        name={`razorPayId`}
                        label={` Razorpay id`}
                        placeholder={` RazorPay Id`}
                        errorMessage={
                          error.razorPayIdText && error.razorPayIdText
                        }
                        value={razorPayIdText}
                        onChange={(e: any) => {
                          setRazorPayIdText(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              razorPayIdText: `RazorPay is Required`,
                            });
                          } else {
                            return setError({
                              ...error,
                              razorPayIdText: "",
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="col-12 flex row items-center">
                      <div
                        className="inputData"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "16px",
                        }}
                      >
                        <div>
                          <label className="">
                            Razorpay active{" "}
                            <span className="" style={{ fontSize: "12px" }}>
                              (Enable/Disable)
                            </span>
                          </label>
                        </div>

                        <ToggleSwitch
                          style={{ fontSize: "12px" }}
                          onClick={() => handleSettingSwitch("razorpayEnabled")}
                          value={isRazorPay}
                        />
                      </div>
                      <div
                        className="inputData "
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "16px",
                        }}
                      >
                        <div>
                          <label className="">
                            Razorpay Ios active{" "}
                            <span className="" style={{ fontSize: "12px" }}>
                              (Enable/Disable)
                            </span>
                          </label>
                        </div>
                        <ToggleSwitch
                          onClick={() => handleSettingSwitch("razorpayIosEnabled")}
                          value={isRazorpayIos}
                        />
                      </div>
                    </div>

                  </div>
                </>
              )}
            </div>
          </div>

          <div className="col-12 col-md-6 mt-3">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2 ">
                <h4 className="settingboxheader ">Stripe Pay Setting</h4>
                <InfoTooltip title={"Stripe Pay"} content={stripeContent} />
              </div>
              <hr style={{ width: "95%", margin: "5px 9px" }}></hr>
              {roleSkeleton ? (
                <>
                  {[
                    { type: "input" },
                    { type: "input" },
                    { type: "toggle" },
                  ].map((item, index) => (
                    <div key={index} className="mb-4">
                      <div
                        className="skeleton mb-2"
                        style={{
                          height: "16px",
                          width: "30%",
                          marginLeft: "15px",
                        }}
                      ></div>

                      <div
                        className="skeleton"
                        style={{
                          height: item.type === "toggle" ? "24px" : "40px",
                          width: item.type === "toggle" ? "50px" : "97%",
                          borderRadius: item.type === "toggle" ? "12px" : "8px",
                          marginLeft: "10px",
                        }}
                      ></div>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ padding: "0px 20px 10px" }}>
                  <div className="col-12 ">
                    <ExInput
                      type={`text`}
                      id={`stripeSecretKey`}
                      name={`stripeSecretKey`}
                      label={`Stripe secret key`}
                      placeholder={`Stripe Secret Key`}
                      errorMessage={
                        error.stripeSecretKeyText && error.stripeSecretKeyText
                      }
                      value={stripeSecretKeyText}
                      onChange={(e: any) => {
                        setStripeSecretKeyText(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            stripeSecretKeyText: `StripePay SecretKey is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            stripeSecretKeyText: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-12">
                    <ExInput
                      type={`text`}
                      id={`stripePublishableKey`}
                      name={`stripePublishableKey`}
                      label={` Stripe publishable key`}
                      placeholder={` Stripe Publishable Key`}
                      errorMessage={
                        error.stripePublishableKeyText &&
                        error.stripePublishableKeyText
                      }
                      value={stripePublishableKeyText}
                      onChange={(e: any) => {
                        setstripePublishableKeyText(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            stripePublishableKeyText: `Stripe Pay Publishable Key is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            stripePublishableKeyText: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-12 flex row items-center">
                    <div
                      className="inputData"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "16px",
                      }}
                    >
                      <div>
                        <label className="">
                          Stripepay active{" "}
                          <span className="" style={{ fontSize: "12px" }}>
                            (Enable/Disable)
                          </span>
                        </label>
                      </div>
                      <ToggleSwitch
                        onClick={() => handleSettingSwitch("stripeEnabled")}
                        value={isStripePay}
                      />
                    </div>
                    <div
                      className="inputData "
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "16px",
                      }}
                    >
                      <div>
                        <label className="">
                          Stripe Ios active{" "}
                          <span className="" style={{ fontSize: "12px" }}>
                            (Enable/Disable)
                          </span>
                        </label>
                      </div>
                      <ToggleSwitch
                        onClick={() => handleSettingSwitch("stripeIosEnabled")}
                        value={isStripeIos}
                      />
                    </div>
                  </div>


                </div>
              )}
            </div>
          </div>

          <div className="col-12 col-md-6 mt-3">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2 ">
                <h4 className="settingboxheader "> Paystack Setting</h4>
                <InfoTooltip title={"Paystack Pay"} content={paystackContent} />
              </div>
              <hr style={{ width: "95%", margin: "5px 9px" }}></hr>
              {roleSkeleton ? (
                <>
                  {[
                    { type: "input" },
                    { type: "input" },
                    { type: "toggle" },
                  ].map((item, index) => (
                    <div key={index} className="mb-4">
                      <div
                        className="skeleton mb-2"
                        style={{
                          height: "16px",
                          width: "30%",
                          marginLeft: "15px",
                        }}
                      ></div>

                      <div
                        className="skeleton"
                        style={{
                          height: item.type === "toggle" ? "24px" : "40px",
                          width: item.type === "toggle" ? "50px" : "97%",
                          borderRadius: item.type === "toggle" ? "12px" : "8px",
                          marginLeft: "10px",
                        }}
                      ></div>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ padding: "0px 20px 10px" }}>
                  <div className="col-12 ">
                    <ExInput
                      type={`text`}
                      id={`paystackSecretKey`}
                      name={`paystackSecretKey`}
                      label={`Paystack secret key`}
                      placeholder={`Stripe Secret Key`}
                      errorMessage={
                        error.paystackSecretKeyText && error.paystackSecretKeyText
                      }
                      value={paystackSecretKeyText}
                      onChange={(e: any) => {
                        setPaystackSecretKeyText(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            paystackSecretKeyText: `StripePay SecretKey is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            paystackSecretKeyText: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-12">
                    <ExInput
                      type={`text`}
                      id={`paystackPublishableKey`}
                      name={`paystackPublishableKey`}
                      label={` Paystack publishable key`}
                      placeholder={` Paystack Publishable Key`}
                      errorMessage={
                        error.paystackPublishableKeyText &&
                        error.paystackPublishableKeyText
                      }
                      value={paystackPublishableKeyText}
                      onChange={(e: any) => {
                        setPaystackPublishableKeyText(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            paystackPublishableKeyText: `Paystack Publishable Key is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            paystackPublishableKeyText: "",
                          });
                        }
                      }}
                    />
                  </div>

                  {/* toggle button  */}

                  <div className="col-12 flex row items-center">
                    <div
                      className="inputData"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "16px",
                      }}
                    >
                      <div>
                        <label className="">
                          Paystack Android active{" "}
                          <span className="" style={{ fontSize: "12px" }}>
                            (Enable/Disable)
                          </span>
                        </label>
                      </div>
                      <ToggleSwitch
                        onClick={() => handleSettingSwitch("paystackAndroidEnabled")}
                        value={isPaystackAndroid}
                      />
                    </div>
                    <div
                      className="inputData "
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "16px",
                      }}
                    >
                      <div>
                        <label className="">
                          Paystack Ios active{" "}
                          <span className="" style={{ fontSize: "12px" }}>
                            (Enable/Disable)
                          </span>
                        </label>
                      </div>
                      <ToggleSwitch
                        onClick={() => handleSettingSwitch("paystackIosEnabled")}
                        value={isPaystackIos}
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>

          <div className="col-12 col-md-6 mt-3">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2 ">
                <h4 className="settingboxheader "> Cashfree Setting</h4>
                <InfoTooltip title={"Cashfree Pay"} content={cashfreeContent} />
              </div>
              <hr style={{ width: "95%", margin: "5px 9px" }}></hr>
              {roleSkeleton ? (
                <>
                  {[
                    { type: "input" },
                    { type: "input" },
                    { type: "toggle" },
                  ].map((item, index) => (
                    <div key={index} className="mb-4">
                      <div
                        className="skeleton mb-2"
                        style={{
                          height: "16px",
                          width: "30%",
                          marginLeft: "15px",
                        }}
                      ></div>

                      <div
                        className="skeleton"
                        style={{
                          height: item.type === "toggle" ? "24px" : "40px",
                          width: item.type === "toggle" ? "50px" : "97%",
                          borderRadius: item.type === "toggle" ? "12px" : "8px",
                          marginLeft: "10px",
                        }}
                      ></div>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ padding: "0px 20px 10px" }}>
                  <div className="col-12 ">
                    <ExInput
                      type={`text`}
                      id={`cashfreeclientSecret`}
                      name={`cashfreeclientSecret`}
                      label={`Cashfree Client secret key`}
                      placeholder={`Cashfree Client secret key`}
                      errorMessage={
                        error.cashfreeClientSecretKeyText && error.cashfreeClientSecretKeyText
                      }
                      value={cashfreeClientSecretKeyText}
                      onChange={(e: any) => {
                        setCashfreeClientSecretKeyText(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            cashfreeClientSecretKeyText: `Cashfree SecretKey is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            cashfreeClientSecretKeyText: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-12">
                    <ExInput
                      type={`text`}
                      id={`CashfreeId`}
                      name={`CashfreeId`}
                      label={`Cashfree Client Id`}
                      placeholder={` Cashfree ClientIdId`}
                      errorMessage={
                        error.cashfreeIdText && error.cashfreeIdText
                      }
                      value={cashfreeIdText}
                      onChange={(e: any) => {
                        setCashfreeIdText(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            cashfreeIdText: `Paypal is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            cashfreeIdText: "",
                          });
                        }
                      }}
                    />
                  </div>


                  {/* toggle button  */}

                  <div className="col-12 flex row items-center">
                    <div
                      className="inputData "
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "16px",
                      }}
                    >
                      <div>
                        <label className="">
                          Cashfree Android active{" "}
                          <span className="" style={{ fontSize: "12px" }}>
                            (Enable/Disable)
                          </span>
                        </label>
                      </div>
                      <ToggleSwitch
                        onClick={() => handleSettingSwitch("cashfreeAndroidEnabled")}
                        value={isCashfreeAndroid}
                      />
                    </div>
                    <div
                      className="inputData "
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "16px",
                      }}
                    >
                      <div>
                        <label className="">
                          Cashfree Ios active{" "}
                          <span className="" style={{ fontSize: "12px" }}>
                            (Enable/Disable)
                          </span>
                        </label>
                      </div>
                      <ToggleSwitch
                        onClick={() => handleSettingSwitch("cashfreeIosEnabled")}
                        value={isCashfreeIos}
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>

          <div className="col-12 col-md-6 mt-3">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2 ">
                <h4 className="settingboxheader "> Paypal Setting</h4>
                <InfoTooltip title={"Paypal Pay"} content={paypalContent} />
              </div>
              <hr style={{ width: "95%", margin: "5px 9px" }}></hr>
              {roleSkeleton ? (
                <>
                  {[
                    { type: "input" },
                    { type: "input" },
                    { type: "toggle" },
                  ].map((item, index) => (
                    <div key={index} className="mb-4">
                      <div
                        className="skeleton mb-2"
                        style={{
                          height: "16px",
                          width: "30%",
                          marginLeft: "15px",
                        }}
                      ></div>

                      <div
                        className="skeleton"
                        style={{
                          height: item.type === "toggle" ? "24px" : "40px",
                          width: item.type === "toggle" ? "50px" : "97%",
                          borderRadius: item.type === "toggle" ? "12px" : "8px",
                          marginLeft: "10px",
                        }}
                      ></div>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ padding: "0px 20px 10px" }}>
                  <div className="col-12 ">
                    <ExInput
                      type={`text`}
                      id={`paypalSecretKey`}
                      name={`paypalSecretKey`}
                      label={`Paypal secret key`}
                      placeholder={`Paypal Secret Key`}
                      errorMessage={
                        error.paypalSecretKeyText && error.paypalSecretKeyText
                      }
                      value={paypalSecretKeyText}
                      onChange={(e: any) => {
                        setPaypalSecretKeyText(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            paypalSecretKeyText: `Paypal SecretKey is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            paypalSecretKeyText: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-12">
                    <ExInput
                      type={`text`}
                      id={`paypalId`}
                      name={`paypalId`}
                      label={` Paypal id`}
                      placeholder={` Paypal Id`}
                      errorMessage={
                        error.paypalIdText && error.paypalIdText
                      }
                      value={paypalIdText}
                      onChange={(e: any) => {
                        setPaypalIdText(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            paypalIdText: `Paypal is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            paypalIdText: "",
                          });
                        }
                      }}
                    />
                  </div>

                  {/* toggle button  */}

                  <div className="col-12 flex row items-center">
                    <div
                      className="inputData "
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "16px",
                      }}
                    >
                      <div>
                        <label className="">
                          Paypal Android active{" "}
                          <span className="" style={{ fontSize: "12px" }}>
                            (Enable/Disable)
                          </span>
                        </label>
                      </div>
                      <ToggleSwitch
                        onClick={() => handleSettingSwitch("paypalAndroidEnabled")}
                        value={isPaypalAndroid}
                      />
                    </div>
                    <div
                      className="inputData "
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "16px",
                      }}
                    >
                      <div>
                        <label className="">
                          Paypal Ios active{" "}
                          <span className="" style={{ fontSize: "12px" }}>
                            (Enable/Disable)
                          </span>
                        </label>
                      </div>
                      <ToggleSwitch
                        onClick={() => handleSettingSwitch("paypalIosEnabled")}
                        value={isPaypalIos}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-12 col-md-6 mt-3">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2 ">
                <h4 className="settingboxheader">Flutter Wave Setting</h4>
                <InfoTooltip title={"Flutter Wave"} content={flutterWaveContent} />
              </div>
              <hr style={{ width: "95%", margin: "5px 9px" }}></hr>

              {roleSkeleton ? (
                <>
                  <div className="mb-4">
                    <div
                      className="skeleton mb-2"
                      style={{
                        height: "16px",
                        width: "30%",
                        marginLeft: "15px",
                      }}
                    ></div>
                    <div
                      className="skeleton"
                      style={{
                        height: "40px",
                        width: "97%",
                        borderRadius: "8px",
                        marginLeft: "10px",
                      }}
                    ></div>
                  </div>


                  <div>
                    <div
                      className="skeleton mb-2"
                      style={{
                        height: "16px",
                        width: "30%",
                        marginLeft: "15px",
                      }}
                    ></div>
                    <div
                      className="skeleton mb-2"
                      style={{
                        height: "24px",
                        width: "50px",
                        borderRadius: "12px",
                        marginLeft: "10px",
                      }}
                    ></div>
                  </div>
                </>
              ) : (
                <div style={{ padding: "0px 20px 10px" }}>
                  <div className="col-12 ">
                    <ExInput
                      type={`text`}
                      id={`flutterWaveId`}
                      name={`flutterWaveId`}
                      label={`Flutterwave Id`}
                      placeholder={`FlutterWave Id`}
                      errorMessage={
                        error.flutterWaveKeyText && error.flutterWaveKeyText
                      }
                      value={flutterWaveKeyText}
                      onChange={(e: any) => {
                        setFlutterWaveKeyText(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            flutterWaveKeyText: `FlutterWave Id is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            flutterWaveKeyText: "",
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="col-12 flex row items-center">

                    <div
                      className="inputData"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "16px",
                      }}
                    >
                      <div>
                        <label className="">
                          Flutterwave active{" "}
                          <span className="" style={{ fontSize: "12px" }}>
                            (Enable/Disable)
                          </span>
                        </label>
                      </div>
                      <ToggleSwitch
                        onClick={() => handleSettingSwitch("flutterwaveEnabled")}
                        value={isFlutterWave}
                      />
                    </div>

                    <div
                      className="inputData "
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "16px",
                      }}
                    >
                      <div>
                        <label className="">
                          FlutterWave Ios active{" "}
                          <span className="" style={{ fontSize: "12px" }}>
                            (Enable/Disable)
                          </span>
                        </label>
                      </div>
                      <ToggleSwitch
                        onClick={() => handleSettingSwitch("flutterwaveIosEnabled")}
                        value={isflutterWaveEnabled}
                      />
                    </div>
                  </div>


                </div>
              )}
            </div>
          </div>
          <div className="col-12 col-md-6 mt-3 ">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2 ">
                <h4 className="settingboxheader">Google Play Setting</h4>
                <InfoTooltip title={"Google Play"} content={googlePlayContent} />

              </div>
              <hr style={{ width: "95%", margin: "5px 9px" }} />
              <div
                className="d-flex justify-content-between align-items-start"
                style={{
                  paddingRight: "20px",
                }}
              >
                {roleSkeleton === true ? (
                  <>
                    <div
                      className="skeleton mb-4"
                      style={{
                        height: "24px",
                        width: "60%",
                        marginLeft: "15px",
                      }}
                    ></div>

                    <div
                      className="skeleton mb-4"
                      style={{
                        height: "24px",
                        width: "7%",
                        borderRadius: "20px",
                      }}
                    ></div>
                  </>
                ) : (
                  <>
                    <p className="isfake">
                      Google Play{" "}
                      <span className="" style={{ fontSize: "12px" }}>
                        (Enable/Disable)
                      </span>
                    </p>

                    <div>
                      <ToggleSwitch
                        onClick={() => {
                          handleSettingSwitch("googlePlayEnabled");
                        }}
                        value={googlePlayEnabled}
                      />
                    </div>
                    <p className="isfake">
                      Google Play Ios Active{" "}
                      <span className="" style={{ fontSize: "12px" }}>
                        (Enable/Disable)
                      </span>
                    </p>

                    <div>
                      <ToggleSwitch
                        onClick={() => {
                          handleSettingSwitch("googlePayIosEnabled");
                        }}
                        value={isGooglePayIos}
                      />
                    </div>
                  </>


                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PaymetSetting;
