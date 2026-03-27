
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { getHostRequest } from "@/store/hostRequestSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import CoinPlanHistory from "../CoinPlanHistory";
import CallHistory from "@/component/history/CallHistory";
import GiftHistory from "@/component/history/GiftHistory";
import ChatHistory from "@/component/history/ChatHistory";
import CoinPlanPurchaseHistory from "@/component/history/CoinPlanPurchaseHistory";
import VipPlanHistory from "@/component/history/VipPlanHistory";
import { useRouter } from "next/router";
import LiveBroadCastHistory from "@/component/history/LiveBroadCastHistory";
import { routerChange } from "@/utils/Common";

const HostHistoryPage = () => {
    const { dialogueType } = useSelector((state: RootStore) => state.dialogue);

    const dispatch = useAppDispatch();
    const [type, setType] = useState<string | null>(null);
    const router = useRouter();
    const queryType = router.query.type

    useEffect(() => {
        if (router.isReady) {
          const storedType = localStorage.getItem('coinplantype') || 'coin_plan';
          setType(storedType);
        }
      }, [router.isReady]);
      
    useEffect(() => {
        if (type) {
            localStorage.setItem("coinplantype", type);
        }
    }, [type]);

    useEffect(() => {
        routerChange("/Host/HostHistoryPage" , "coinplantype",router)
      }, []);


    return (
        <>
            {/* {dialogueType === "doctor" && <AddDoctor />} */}
                <div
                    className={`userTable ${dialogueType === "doctor" ? "d-none" : "d-block"
                        }`}
                >
                    <div className="d-flex"
                        style={{
                            gap: "8px",
                            // border : "1px solid #e3e3e3",
                            padding : "2px",
                            width : "fit-content",
                            borderRadius : "5px"
                        }}
                    >
                        <div>
                            <button className={type === "coin_plan" ? "status-active-coinplan" : "coinplan"}
                                onClick={() => setType("coin_plan")}
                            >
                                Coin History
                            </button>
                        </div>

                        <div>
                            <button className={type === "call" ? "status-active-call" : "call"} 
                                onClick={() => setType("call")}
                            >
                                Call History
                            </button>
                        </div>

                        <div>
                            <button className={type === "gift" ? "status-active-gift": "gift"}
                                onClick={() => setType("gift")}
                            >
                                Gift History
                            </button>
                        </div>

                        <div>
                            <button className={type === "chat" ? "status-active-gift": "gift"}
                                onClick={() => setType("chat")}
                            >
                                Chat History
                            </button>
                        </div>

                        
                        <div>
                            <button className={type === "vip_plan_purchase" ?
                            "status-active-livebroadcasthistory" : "livebroadcasthistory"}
                                onClick={() => setType("vip_plan_purchase")}
                            >
                                Live History
                            </button>
                        </div>

                    </div>

                    {
                        type === "coin_plan" ? (
                            <CoinPlanHistory queryType={queryType}/>
                        ) : type === "call" ? (
                            <CallHistory queryType={queryType}/>
                        ) : type === "gift" ? (
                            <GiftHistory queryType={queryType}/>
                        ) : type === "chat" ? (
                            <ChatHistory />
                        )
                          :
                                type === "vip_plan_purchase" ? (
                                    <LiveBroadCastHistory />
                                ) :

                                    null
                    }


                </div>
        </>
    );
};
HostHistoryPage.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};
export default HostHistoryPage;
