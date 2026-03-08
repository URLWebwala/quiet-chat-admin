// import RootLayout from "@/component/layout/Layout";
// import Button from "@/extra/Button";
// import { openDialog } from "@/store/dialogSlice";
// import { RootStore, useAppDispatch } from "@/store/store";
// import { useRouter } from "next/router";
// import { baseURL } from "../utils/config";
// import React, { useEffect, useState } from "react";
// import { useSelector } from "react-redux";
// import { getVipPlanBeneFits } from "@/store/vipPlanSlice";
// import withdrawRequest from "@/assets/images/withdrawRequest.svg";
// import image from "@/assets/images/bannerImage.png";
// import VipPlanBenefitDialog from "@/component/VipPlanBenefitDialog";
// import randommatch from "@/assets/images/random_match.svg";
// import topupcoin_bonus from "@/assets/images/topcoin_bonus.svg";
// import videocall_discount from "@/assets/images/videocall_discount.svg";
// import audiocall_discount from "@/assets/images/audiocall_discount.svg";
// import message from "@/assets/images/message.svg";
// import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
// import { isLoading, isSkeleton } from "@/utils/allSelector";



// interface BannerData {
//     _id: string;
//     image: string;
//     isActive: false;
// }

// const VipPlanPrevilage = ({ type }: any) => {
//     const { dialogue, dialogueType } = useSelector(
//         (state: RootStore) => state.dialogue
//     );

//     const roleSkeleton = useSelector<any>(isSkeleton);

//    
//     const { vipPlanBenefits }: any = useSelector((state: RootStore) => state.vipPlan);
//     const router = useRouter();

//     const dispatch = useAppDispatch();

//     const [data, setData] = useState<any[]>([]);


//     useEffect(() => {
//         dispatch(getVipPlanBeneFits());
//     }, [dispatch]);

//     useEffect(() => {
//         setData(vipPlanBenefits);
//     }, [vipPlanBenefits]);

//     const vipBenefits = [
//         {
//             title: "VIP Frame Badge",
//             value: "Frame",
//             icon: baseURL + (vipPlanBenefits?.vipFrameBadge || "").replace(/\\/g, "/"),
//         },

//         {
//             title: "Audio Call Discount",
//             value: vipPlanBenefits?.audioCallDiscount,
//             icon: audiocall_discount.src,
//         },
//         {
//             title: "Video Call Discount",
//             value: vipPlanBenefits?.videoCallDiscount,
//             icon: videocall_discount.src,
//         },
//         {
//             title: "Random Match Discount.",
//             value: vipPlanBenefits?.randomMatchCallDiscount,
//             icon: randommatch.src,
//         },
//         {
//             title: "TopUp Coin Bonus",
//             value: vipPlanBenefits?.topUpCoinBonus,
//             icon: topupcoin_bonus.src,
//         },
//         {
//             title: "Free Messages",
//             value: vipPlanBenefits?.freeMessages,
//             icon: message.src,
//         },
//     ];





//     return (
//         <>
//             {dialogueType === "banner" && <VipPlanBenefitDialog />}
//             <>
//                 <div className="d-flex justify-content-between align-items-center">
//                     <div
//                         className="title text-capitalized fw-600"
//                         style={{ color: "#404040", fontSize: "20px" }}
//                     >
//                     </div>
//                     <div className="betBox">
//                         <Button
//                             className={`bg-button p-10 text-white m10-bottom `}
//                             bIcon={image}
//                             text="Edit"
//                             onClick={() => {
//                                 dispatch(openDialog({ type: "banner", data: vipPlanBenefits }));
//                             }}
//                         />
//                     </div>
//                 </div>
//                 <div className="mainDashbox1">
//                     <div className="row"
//                         style={{
//                             rowGap: "25px"
//                         }}
//                     >
//                         {vipBenefits.map((card, index) => (
//                             <div
//                                 key={index}
//                                 // className="col-lg-6 col-xl-2 col-md-6 col-sm-6 col-12 p-0"
//                                 style={{
//                                     borderRadius: "20px",
//                                     maxWidth: "250px",
//                                     height: "280px"
//                                 }}
//                             >
//                                 {roleSkeleton ? (
//                                     <div style={{
//                                         width: 200,
//                                         height: 280,
//                                         borderRadius: 20,
//                                         backgroundColor: "#f3f4fb",
//                                         display: "flex",
//                                         flexDirection: "column",
//                                         alignItems: "center",
//                                         padding: 20,
//                                         boxSizing: "border-box",
//                                         boxShadow: "0 0 8px #e0e2f5",
//                                         gap: 20,
//                                     }}>
//                                         {/* Skeleton for icon container */}
//                                         <div style={{
//                                             width: 72,
//                                             height: 72,
//                                             borderRadius: 16,
//                                             backgroundColor: "#d7d8ef",
//                                             position: "relative",
//                                             overflow: "hidden",
//                                         }}>
//                                             {/* Skeleton shimmer effect */}
//                                             <div className="shimmer" style={{
//                                                 width: "100%",
//                                                 height: "100%",
//                                                 background: "#e2e5e7",
//                                                 backgroundSize: "200% 100%",
//                                                 animation: "shimmer 1.5s infinite",
//                                                 borderRadius: 16,
//                                             }} />
//                                         </div>

//                                         {/* Skeleton for subtitle text */}
//                                         <div style={{
//                                             width: 100,
//                                             height: 12,
//                                             backgroundColor: "#e2e5e7",
//                                             borderRadius: 6,
//                                         }} />

//                                         {/* Skeleton for big number text */}
//                                         <div style={{
//                                             width: 80,
//                                             height: 28,
//                                             backgroundColor: "#e2e5e7",
//                                             borderRadius: 6,
//                                         }} />

//                                         <style>{`
//         @keyframes shimmer {
//           0% {
//             background-position: -200% 0;
//           }
//           100% {
//             background-position: 200% 0;
//           }
//         }
//       `}</style>
//                                     </div>
//                                 ) : (
//                                     <DashBox
//                                         title={card.title}
//                                         dashSVG={<img src={card.icon} width={70} height={70} />}
//                                         amount={card.value}
//                                     />
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </>
//         </>
//     );
// };
// VipPlanPrevilage.getLayout = function getLayout(page: React.ReactNode) {
//     return <RootLayout>{page}</RootLayout>;
// };
// export default VipPlanPrevilage;


// const DashBox = ({ dashIcon, dashSVG, title, amount, onClick }: any) => {
//     return (
//         <div className="vipplanbenefitBox" onClick={onClick}>
//             <div className="dashIconBox midBox">
//                 <div className="vipplanbenefitIcon vipplanbenefitsvg midBox d-flex justify-content-center">
//                     {dashIcon ? <i className={`${dashIcon}`}></i> : dashSVG}
//                 </div>
//             </div>
//             <div className="boxContent text-center col-xl-12 col-md-7 col-6">
//                 <div className="boxTitle midBox1">
//                     <p className="text-decoration-underline">{title}</p>
//                 </div>
//                 <div className="boxAmount midBox1 mt-2 pb-4">
//                     <p>{amount}</p>
//                 </div>
//             </div>
//         </div>
//     );
// };



import RootLayout from "@/component/layout/Layout";
import Button from "@/extra/Button";
import { openDialog } from "@/store/dialogSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { warning } from "@/utils/Alert";
import { useRouter } from "next/router";
import { baseURL } from "../utils/config";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getVipPlanBeneFits } from "@/store/vipPlanSlice";
import withdrawRequest from "@/assets/images/withdrawRequest.svg";
import image from "@/assets/images/bannerImage.png";
import VipPlanBenefitDialog from "@/component/VipPlanBenefitDialog";
import randommatch from "@/assets/images/random_match.svg";
import topupcoin_bonus from "@/assets/images/topcoin_bonus.svg";
import videocall_discount from "@/assets/images/videocall_discount.svg";
import audiocall_discount from "@/assets/images/audiocall_discount.svg";
import message from "@/assets/images/message.svg";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { isLoading, isSkeleton } from "@/utils/allSelector";

interface BannerData {
    _id: string;
    image: string;
    isActive: false;
}

const VipPlanPrevilage = ({ type }: any) => {
    const { dialogue, dialogueType } = useSelector(
        (state: RootStore) => state.dialogue
    );

    const roleSkeleton = useSelector<any>(isSkeleton);

    const { vipPlanBenefits }: any = useSelector((state: RootStore) => state.vipPlan);
    const router = useRouter();

    const dispatch = useAppDispatch();

    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        dispatch(getVipPlanBeneFits());
    }, [dispatch]);

    useEffect(() => {
        setData(vipPlanBenefits);
    }, [vipPlanBenefits]);

    const vipBenefits = [
        {
            title: "VIP Frame Badge",
            value: "Frame",
            icon: baseURL + (vipPlanBenefits?.vipFrameBadge || "").replace(/\\/g, "/"),
        },
        {
            title: "Audio Call Discount",
            value: vipPlanBenefits?.audioCallDiscount,
            icon: audiocall_discount.src,
        },
        {
            title: "Video Call Discount",
            value: vipPlanBenefits?.videoCallDiscount,
            icon: videocall_discount.src,
        },
        {
            title: "Random Match Discount.",
            value: vipPlanBenefits?.randomMatchCallDiscount,
            icon: randommatch.src,
        },
        {
            title: "TopUp Coin Bonus",
            value: vipPlanBenefits?.topUpCoinBonus,
            icon: topupcoin_bonus.src,
        },
        {
            title: "Free Messages",
            value: vipPlanBenefits?.freeMessages,
            icon: message.src,
        },
    ];

    return (
        <>
            {dialogueType === "banner" && <VipPlanBenefitDialog />}
            <>
                <div className="d-flex justify-content-between align-items-center">
                    <div
                        className="title text-capitalized fw-600"
                        style={{ color: "#404040", fontSize: "20px" }}
                    >
                    </div>
                    <div className="betBox">
                        <Button
                            className={`bg-button p-10 text-white m10-bottom `}
                            bIcon={image}
                            text="Edit"
                            onClick={() => {
                                dispatch(openDialog({ type: "banner", data: vipPlanBenefits }));
                            }}
                        />
                    </div>
                </div>
                
                <div className="vip-benefits-container">
                    <div className="vip-benefits-grid">
                        {vipBenefits.map((card, index) => (
                            <div key={index} className="vip-benefit-card">
                                {roleSkeleton ? (
                                    <div className="vip-benefit-skeleton">
                                        <div className="skeleton-icon">
                                            <div className="shimmer" />
                                        </div>
                                        <div className="skeleton-text-group">
                                            <div className="skeleton-title" />
                                            <div className="skeleton-value" />
                                        </div>
                                    </div>
                                ) : (
                                    <DashBox
                                        title={card.title}
                                        dashSVG={<img src={card.icon} width={40} height={40} alt={card.title} />}
                                        amount={card.value}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <style jsx>{`
                    .vip-benefits-container {
                        padding: 20px;
                        border-radius: 12px;
                    }

                    .vip-benefits-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 20px;
                        margin: 0 auto;
                    }

                    .vip-benefit-card {
                        background: white;
                        border-radius: 12px;
                        padding: 24px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                        border: 1px solid #e9ecef;
                    }

                    .vip-benefit-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
                    }

                    .vip-benefit-content {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                    }

                    .vip-benefit-icon {
                        width: 56px;
                        height: 56px;
                        border-radius: 12px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }

                    .vip-benefit-info {
                        flex: 1;
                    }

                    .vip-benefit-title {
                        font-size: 14px;
                        font-weight: 500;
                        color: #6c757d;
                        margin: 0 0 8px 0;
                        text-decoration: underline;
                    }

                    .vip-benefit-value {
                        font-size: 24px;
                        font-weight: 700;
                        color: #495057;
                        margin: 0;
                    }

                    /* Skeleton styles */
                    .vip-benefit-skeleton {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                    }

                    .skeleton-icon {
                        width: 56px;
                        height: 56px;
                        border-radius: 12px;
                        background-color: #e9ecef;
                        position: relative;
                        overflow: hidden;
                    }

                    .skeleton-text-group {
                        flex: 1;
                    }

                    .skeleton-title {
                        width: 120px;
                        height: 14px;
                        background-color: #e9ecef;
                        border-radius: 4px;
                        margin-bottom: 8px;
                    }

                    .skeleton-value {
                        width: 80px;
                        height: 24px;
                        background-color: #e9ecef;
                        border-radius: 4px;
                    }

                    .shimmer {
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%);
                        background-size: 200% 100%;
                        animation: shimmer 1.5s infinite;
                        border-radius: 12px;
                    }

                    @keyframes shimmer {
                        0% {
                            background-position: -200% 0;
                        }
                        100% {
                            background-position: 200% 0;
                        }
                    }

                    /* Responsive design */
                    @media (max-width: 768px) {
                        .vip-benefits-grid {
                            grid-template-columns: 1fr;
                            gap: 16px;
                        }
                        
                        .vip-benefit-card {
                            padding: 20px;
                        }
                        
                        .vip-benefit-value {
                            font-size: 20px;
                        }
                    }
                `}</style>
            </>
        </>
    );
};

VipPlanPrevilage.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};

export default VipPlanPrevilage;

const DashBox = ({ dashIcon, dashSVG, title, amount, onClick }: any) => {
    return (
        <div className="vip-benefit-content" onClick={onClick}>
            <div className="vip-benefit-icon">
                {dashIcon ? <i className={`${dashIcon}`}></i> : dashSVG}
            </div>
            <div className="vip-benefit-info">
                <p className="vip-benefit-title">{title}</p>
                <p className="vip-benefit-value">{amount}</p>
            </div>
        </div>
    );
};





