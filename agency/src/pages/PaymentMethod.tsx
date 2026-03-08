import RootLayout from "@/component/layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { useEffect, useState } from "react";
import Analytics from "@/extra/Analytic";
import Image from "next/image";
import { baseURL } from "@/utils/config";
import male from "@/assets/images/male.png"
import { getDefaultCurrency, getPaymentMethod } from "@/store/settingSlice";
import { useRouter } from "next/router";
import historyInfo from "@/assets/images/History.png"
import CoinPlanShimmer from "@/component/shimmer/CoinPlanShimmer";


const PaymentMethod = () => {
    const dispatch = useDispatch();
    const { dialogue, dialogueType } = useSelector(
        (state: RootStore) => state.dialogue
    );

    const {paymentMethod} = useSelector((state : RootStore) => state?.setting)


    useEffect(() => {
        dispatch(getPaymentMethod())
    }, [dispatch])




    const coinPlanTable = [
        {
            Header: "No",
            Cell: ({ index }: { index: any }) => (
                <span> {index + 1}</span>
            ),
        },

        {
            Header: "Image",
            body: "profilePic",
            Cell: ({ row }: { row: any }) => {
              const updatedImagePath = row?.image ? row.image.replace(/\\/g, "/") : "";
      
              return (
                <div style={{ cursor: "pointer" }}>
               
                      <img
                        src={row?.image ? baseURL + updatedImagePath : male.src}
                        alt="Image"
                        loading="eager"
                        draggable="false"
                        style={{ borderRadius: "50%", objectFit: "cover", height: "50px", width: "50px" }}
                        height={70}
                        width={70}
                      />
                    </div>
                    
             
              );
            },
          },

        {
            Header: "Name",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{row?.name}</span>
            ),
        },

        {
            Header: "DETAILS",
            body: "details",
            Cell: ({ row }: { row: any }) => (
              <span className="text-capitalize text-nowrap">
                <ul>
                  {row?.details?.map((detail: any, index: number) => (
                    <>
                      <span></span>
                      <li>{`${detail}`}</li>
                    </>
                  ))}
                </ul>
              </span>
            ),
          },

        {
            Header: "Active",
            Cell: ({ row }: { row: any }) => (
                <span className="text-capitalize">{row?.isActive ? "Yes" : "No"}</span>
            ),
        },
    {
            Header: "Created At",
            Cell: ({ row }: { row: any }) => {
                const date = new Date(row?.createdAt);
                const formattedDate = isNaN(date.getTime())
                    ? "-"
                    : date.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                    });
                return <span className="text-nowrap text-normal">{formattedDate}</span>;
            },
        },
    ];

    return (
        <>
            <div className="row d-flex align-items-center ">
                <div className="col-12 col-lg-6 col-md-6 col-sm-12 fw-400 livehosttext"
                    style={{ color: "#868686" , fontSize: "20px" }}
                >
                    Payment Method
                </div>
            </div>

            <div className="mt-2">
                <Table
                    data={paymentMethod}
                    mapData={coinPlanTable}
                    type="server"
                    shimmer={<CoinPlanShimmer />}
                />
                
            </div>
        </>
    )
}

PaymentMethod.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};
export default PaymentMethod;