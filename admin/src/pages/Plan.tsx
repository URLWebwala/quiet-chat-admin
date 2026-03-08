// import AddDoctor from "@/component/doctor/AddDoctor";
// import AllDoctor from "@/component/doctor/AllDoctor";
// import PendingRequest from "@/component/doctor/PendingRequest";
// import RejectedRequest from "@/component/doctor/RejectedRequest";
import AcceptedHostRequest from "@/component/hostRequest/AcceptedHostRequest";
import DeclinedHostRequest from "@/component/hostRequest/DeclinedHostRequest";
import PendingHostRequest from "@/component/hostRequest/PendingHostRequest";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { getHostRequest } from "@/store/hostRequestSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import CoinPlan from "./CoinPlan";
import VipPlan from "./VipPlan";
import Button from "@/extra/Button";
import { openDialog } from "@/store/dialogSlice";
import image from "@/assets/images/bannerImage.png";
import CoinPlanDialog from "@/component/coinPlan/CoinPlanDialog";
import VipPlanDialog from "@/component/vipPlan/VipPlanDialog";
import { useRouter } from "next/router";
import { routerChange } from "@/utils/Common";
import VipPlanPrevilage from "./VipPlanPrevilage";


const Plan = () => {
    const { dialogueType } = useSelector((state: RootStore) => state.dialogue);

    const dispatch = useAppDispatch();
    const [search, setSearch] = useState<string | undefined>("ALL");
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(0);

    const [type, setType] = useState<string | null>(null); // Default value for SSR

        const router = useRouter();
    
   

    useEffect(() => {
          const storedType = localStorage.getItem("planType") || "coinPlan";
          if (storedType) setType(storedType);
      }, []);


      useEffect(() => {
        if (type) {
          localStorage.setItem("planType", type);
        }
      }, [type]);

      useEffect(() => {
        routerChange("/Plan" , "planType",router)
      }, []);

    return (
        <>
            {dialogueType === "coinplan" && <CoinPlanDialog />}
            {dialogueType === "vipPlan" && <VipPlanDialog />}


            <div
                className={`userTable ${dialogueType === "doctor" ? "d-none" : "d-block"
                    }`}
            >
                <div className="plan">

                    <div
                        className="my-2 expert_width"
                    >
                        <button
                            type="button"
                            className={`${type === "coinPlan" ? "activeBtn" : "disabledBtn"}`}
                            onClick={() => setType("coinPlan")}
                        >
                            Coin Plan
                        </button>
                        <button
                            type="button"
                            className={`${type === "vipPlan" ? "activeBtn" : "disabledBtn"
                                } ms-1`}
                            onClick={() => setType("vipPlan")}
                        >
                            Vip Plan
                        </button>


                    </div>
                    {
                        type === "coinPlan" ?
                            <div className="betBox d-flex justify-content-end">
                                <Button
                                    className={`bg-button p-10 text-white `}
                                    bIcon={image}
                                    text="Add Coin Plan"
                                    onClick={() => {
                                        dispatch(openDialog({ type: "coinplan" }));
                                    }} />
                            </div> :

                            <div className="betBox">
                                <Button
                                    className={`bg-button p-10 text-white `}
                                    bIcon={image}
                                    text="Add Vip Plan"
                                    onClick={() => {
                                        dispatch(openDialog({ type: "vipPlan" }));
                                    }} />
                            </div>
                    }



                </div>

                {
                    type === "coinPlan" ? (
                        <CoinPlan type={type} />
                    ) : type === "vipPlan" ? (
                        <VipPlan type={type}/>
                    ) :
                     null
                }


            </div>
        </>
    );
};
Plan.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};
export default Plan;
