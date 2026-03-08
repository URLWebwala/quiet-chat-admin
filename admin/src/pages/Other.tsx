import PrivacyPolicyLink from "@/component/setting/PrivacyPolicyLink";
import TermsandCondition from "@/component/setting/TermsandCondition";
import { routerChange } from "@/utils/Common";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Other = () => {
  const [statusType, setStatusType] = useState<string>("privacypolicy_link");
  const router = useRouter();
  
  useEffect(() => {
    routerChange("/Setting", "statusType", router);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedType = localStorage.getItem("settingOtherType");
      if (storedType) setStatusType(storedType);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("settingOtherType", statusType);
    }
  }, [statusType]);

  return (
    <>
      <div className="row d-flex align-items-center">
        <div className="col-10">
          <div className="d-flex gap-1" style={{ marginTop: "22px" }}>
            <button
              className={`pendingRequest ${
                statusType === "privacypolicy_link"
                  ? "status-active-pending"
                  : ""
              }`}
              onClick={() => setStatusType("privacypolicy_link")}
            >
              Privacy Policy Link
            </button>

            <button
              className={`accetedRequest ${
                statusType === "termsandcondition"
                  ? "status-active-accepted"
                  : ""
              }`}
              onClick={() => setStatusType("termsandcondition")}
            >
              Terms and Condition
            </button>
          </div>
        </div>
      </div>

  

        {/* Show based on statusType only when type is 'agency' */}
        {statusType === "privacypolicy_link" && <PrivacyPolicyLink />}

        {statusType === "termsandcondition" && <TermsandCondition />}
    </>
  );
};

export default Other;
