import RootLayout from "@/component/layout/Layout";
import { RootStore, useAppDispatch } from "@/store/store";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import CallHistory from "@/component/history/CallHistory";
import GiftHistory from "@/component/history/GiftHistory";
import { useRouter } from "next/router";
import LiveBroadCastHistory from "@/component/history/LiveBroadCastHistory";
import { routerChange } from "@/utils/Common";
import CoinPlanUserHistory from "@/component/history/CoinPlanHistory";

const CoinPlanHistoryPage = () => {
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);

  const dispatch = useAppDispatch();
  const [search, setSearch] = useState<string | undefined>("ALL");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(0);
  const [type, setType] = useState<string>("coin_plan");

  const router = useRouter();
  const queryType = router.query.type;

  useEffect(() => {
    routerChange("/Host/HostHistoryPage", "coinplantype", router);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedType = localStorage.getItem("coinplantype");
      if (storedType) setType(storedType);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("coinplantype", type);
    }
  }, [type]);

  return (
    <>
      {/* {dialogueType === "doctor" && <AddDoctor />} */}
      <div
        className={`userTable ${
          dialogueType === "doctor" ? "d-none" : "d-block"
        }`}
      >
        <div
          className="d-flex"
          style={{ gap: "8px", padding: "2px", width: "fit-content" }}
        >
          <div>
            <button
              className={
                type === "coin_plan" ? "status-active-coinplan" : "coinplan"
              }
              onClick={() => setType("coin_plan")}
            >
              Coin History
            </button>
          </div>

          <div>
            <button
              className={type === "call" ? "status-active-call" : "call"}
              onClick={() => setType("call")}
            >
              Call History
            </button>
          </div>

          <div>
            <button
              className={type === "gift" ? "status-active-gift" : "gift"}
              onClick={() => setType("gift")}
            >
              Gift History
            </button>
          </div>

          <div>
            <button
              className={
                type === "vip_plan_purchase"
                  ? "status-active-livebroadcasthistory"
                  : "livebroadcasthistory"
              }
              onClick={() => setType("vip_plan_purchase")}
            >
              Live History
            </button>
          </div>
        </div>

        {type === "coin_plan" ? (
          <CoinPlanUserHistory />
        ) : type === "call" ? (
          <CallHistory />
        ) : type === "gift" ? (
          <GiftHistory />
        ) : type === "vip_plan_purchase" ? (
          <LiveBroadCastHistory />
        ) : null}
      </div>
    </>
  );
};
CoinPlanHistoryPage.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default CoinPlanHistoryPage;
