import AcceptedHostRequest from "@/component/hostRequest/AcceptedHostRequest";
import DeclinedHostRequest from "@/component/hostRequest/DeclinedHostRequest";
import PendingHostRequest from "@/component/hostRequest/PendingHostRequest";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { RootStore, useAppDispatch } from "@/store/store";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { routerChange } from "@/utils/Common";
import { setHostRequest } from "@/store/hostRequestSlice";


const HostRequest = () => {
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);
  const dispatch = useAppDispatch();
  const [type, setType] = useState<string | null>(null);
  const router = useRouter();

  // Set `type` on client-side only
  useEffect(() => {
    const storedType = localStorage.getItem("hostRequestType") || "Pending";
    setType(storedType);
  }, []);

  useEffect(() => {
    if (type) {
      localStorage.setItem("hostRequestType", type);
    }
  }, [type]);

  useEffect(() => {
    routerChange("/HostRequest", "hostRequestType", router);
  }, []);

  return (
    <>
      <div className={`userTable ${dialogueType === "doctor" ? "d-none" : "d-block"}`}>
        <Title name="Host Request" />

        <div className="mt-2 mb-3 expert_width">
          <button
            type="button"
            className={`${type === "Pending" ? "activeBtn" : "disabledBtn"}`}
            onClick={() => {

              dispatch(setHostRequest([]));
              setType("Pending")
            }
            }
          >
            Pending
          </button>
          <button
            type="button"
            className={`${type === "accepted" ? "activeBtn" : "disabledBtn"} ms-1`}
            onClick={() => {

              dispatch(setHostRequest([]));
              setType("accepted")
            }}
          >
            Accepted
          </button>
          <button
            type="button"
            className={`${type === "declined" ? "activeBtn" : "disabledBtn"} ms-1`}
            onClick={() => {
              dispatch(setHostRequest([]));
              setType("declined")
            }}
          >
            Declined
          </button>
        </div>

        {/* Render only when type is initialized */}
        {type === "Pending" && <PendingHostRequest type={type} />}
        {type === "accepted" && <AcceptedHostRequest type={type} />}
        {type === "declined" && <DeclinedHostRequest type={type} />}
      </div>
    </>
  );
};

HostRequest.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default HostRequest;
