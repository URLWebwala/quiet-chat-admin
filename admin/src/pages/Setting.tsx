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

  const tabs = [
    { id: "Setting", label: "App & General", icon: "ri-settings-4-line" },
    { id: "PaymetSetting", label: "Payment Gateways", icon: "ri-bank-card-line" },
    { id: "WithdrawSetting", label: "Withdrawal Limits", icon: "ri-wallet-3-line" },
    { id: "CurrencySetting", label: "Currency", icon: "ri-money-dollar-circle-line" },
    { id: "DocumentType", label: "Identity Proof", icon: "ri-file-user-line" },
    { id: "Fast2Sms", label: "Fast2SMS OTP", icon: "ri-message-3-line" },
    { id: "Other", label: "Legal & Policies", icon: "ri-shield-check-line" },
  ];

  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-4 p-2 bg-white rounded-4 shadow-sm align-items-center">
        {tabs.map((tab) => {
          const isActive = (type || "Setting") === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className="btn btn-sm d-flex align-items-center gap-2 px-3 py-2 fw-semibold rounded-3 transition-all"
              style={{
                background: isActive ? "linear-gradient(135deg, #9f5aff 0%, #7c3aed 100%)" : "transparent",
                color: isActive ? "#ffffff" : "#64748b",
                border: "none",
                boxShadow: isActive ? "0 4px 12px rgba(159, 90, 255, 0.3)" : "none",
                fontSize: "13px",
                transition: "all 0.2s ease",
              }}
              onClick={() => setType(tab.id)}
            >
              <i className={`${tab.icon} fs-16`}></i>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ marginBottom: "60px" }}>
        {(!type || type === "Setting") && <AdminSetting />}
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
