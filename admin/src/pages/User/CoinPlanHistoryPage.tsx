import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { getHostRequest } from "@/store/hostRequestSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import UserInfo from "../UserInfo";
import UserFollowingList from "./UserFollowingList";
import CoinPlanHistory from "../CoinPlanHistory";
import HostBlock from "./HostBlock";
import CallHistory from "@/component/history/CallHistory";
import GiftHistory from "@/component/history/GiftHistory";
import CoinPlanPurchaseHistory from "@/component/history/CoinPlanPurchaseHistory";
import VipPlanHistory from "@/component/history/VipPlanHistory";
import { useRouter } from "next/router";
import { routerChange } from "@/utils/Common";

const CoinPlanHistoryPage = () => {
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);

  const dispatch = useAppDispatch();
  const [search, setSearch] = useState<string | undefined>("ALL");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(0);
  const [type, setType] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedType = localStorage.getItem("coinplantype") || "coin_plan";
    if (storedType) setType(storedType);
  }, []);

  useEffect(() => {
    if (type) {
      localStorage.setItem("coinplantype", type);
    }
  }, [type]);

  useEffect(() => {
    routerChange("/CoinPlanHistoryPage", "coinplantype", router);
  }, []);

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
          style={{
            gap: "5px",
            width: "fit-content",
            // backgroundColor: "black",
            padding: "2px",
            borderRadius: "10px",
            // border : "1px solid #f2f2f2"
          }}
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
                type === "coin_plan_purchase"
                  ? "active-purchase-coinPlan"
                  : "purchasecoinplan"
              }
              onClick={() => setType("coin_plan_purchase")}
            >
              Purchase Coin Plan
            </button>
          </div>

          <div>
            <button
              className={
                type === "vip_plan_purchase"
                  ? "status-active-purchasevipplan"
                  : "purchasevipplan"
              }
              onClick={() => setType("vip_plan_purchase")}
            >
              Purchase Vip Plan
            </button>
          </div>
        </div>
        {type === "coin_plan" ? (
          <CoinPlanHistory />
        ) : type === "call" ? (
          <CallHistory />
        ) : type === "gift" ? (
          <GiftHistory />
        ) : type === "coin_plan_purchase" ? (
          <CoinPlanPurchaseHistory />
        ) : type === "vip_plan_purchase" ? (
          <VipPlanHistory />
        ) : null}
      </div>
    </>
  );
};
CoinPlanHistoryPage.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default CoinPlanHistoryPage;
