import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import AdminSetting from "@/component/setting/AdminSetting";
import PaymetSetting from "@/component/setting/PaymentSetting";
import WithdrawSetting from "@/component/setting/WithdrawSetting";
import CurrencySetting from "@/component/setting/CurrencySetting";
import DocumentType from "./DocumentType";
import Other from "./Other";
import Fast2SmsSetting from "@/component/setting/Fast2SmsSetting";
import { useRouter } from "next/router";
import { routerChange } from "@/utils/Common";

const Setting = () => {

  const [type, setType] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedType = localStorage.getItem("planType") || "Setting";
    if (storedType) setType(storedType);
  }, []);

  useEffect(() => {
    if (type) {
      localStorage.setItem("planType", type);
    }
  }, [type]);

  useEffect(() => {
    routerChange("/Setting", "planType", router);
  }, []);

  return (
    <>
      <div className="setting setting-tabs-wide">
        <button
          type="button"
          className={type === "Setting" ? "activeBtn" : "disabledBtn"}
          onClick={() => setType("Setting")}
        >
          Setting
        </button>

        <button
          type="button"
          className={type === "PaymetSetting" ? "activeBtn" : "disabledBtn"}
          onClick={() => setType("PaymetSetting")}
        >
          Payment Setting
        </button>

        <button
          type="button"
          className={type === "WithdrawSetting" ? "activeBtn" : "disabledBtn"}
          onClick={() => setType("WithdrawSetting")}
        >
          Withdraw Setting
        </button>

        <button
          type="button"
          className={type === "CurrencySetting" ? "activeBtn" : "disabledBtn"}
          onClick={() => setType("CurrencySetting")}
        >
          Currency Setting
        </button>

        <button
          type="button"
          className={type === "DocumentType" ? "activeBtn" : "disabledBtn"}
          onClick={() => setType("DocumentType")}
        >
          Identity Proof
        </button>

        <button
          type="button"
          className={type === "Other" ? "activeBtn" : "disabledBtn"}
          onClick={() => setType("Other")}
        >
          Other
        </button>

        <button
          type="button"
          className={type === "Fast2Sms" ? "activeBtn" : "disabledBtn"}
          onClick={() => setType("Fast2Sms")}
        >
          Fast2SMS
        </button>
      </div>
      <div style={{ marginBottom: "50px" }}>
        {type === "Setting" && <AdminSetting />}
        {type === "PaymetSetting" && <PaymetSetting />}
        {type === "WithdrawSetting" && <WithdrawSetting />}
        {type === "CurrencySetting" && <CurrencySetting />}
        {type === "DocumentType" && <DocumentType />}
        {type === "Other" && <Other />}
        {type === "Fast2Sms" && <Fast2SmsSetting />}
      </div>

     
    </>
  );
};

Setting.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default Setting;
