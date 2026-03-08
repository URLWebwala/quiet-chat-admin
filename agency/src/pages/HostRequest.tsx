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


const HostRequest = () => {
    const { dialogueType } = useSelector((state: RootStore) => state.dialogue);

    const dispatch = useAppDispatch();
    const [search, setSearch] = useState<string | undefined>("ALL");
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(0);
    const [type, setType] = useState<string | null>(null);
    const router = useRouter();



    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedType = localStorage.getItem("hostRequestType") || "Pending";
            setType(storedType);
        }
    }, []);


    useEffect(() => {
        if (type) {
            localStorage.setItem("hostRequestType", type);
        }
    }, [type]);

        useEffect(() => {
        routerChange("/HostRequest", "hostRequestType", router)
    }, []);



    return (
        <>
            {/* {dialogueType === "doctor" && <AddDoctor />} */}
            <div
                className={`userTable ${dialogueType === "doctor" ? "d-none" : "d-block"
                    }`}
            >
                <div
                    className="title text-capitalized "
                    style={{ color: "#868686", fontSize: "20px" }}
                >
                    Host Request
                </div>

                <div
                    className="my-2 expert_width"

                >
                    <button
                        type="button"
                        className={`${type === "Pending" ? "activeBtn" : "disabledBtn"}`}
                        onClick={() => setType("Pending")}
                    >
                        Pending
                    </button>
                    <button
                        type="button"
                        className={`${type === "accepted" ? "activeBtn" : "disabledBtn"
                            } ms-1`}
                        onClick={() => setType("accepted")}
                    >
                        Accepted
                    </button>

                    <button
                        type="button"
                        className={`${type === "declined" ? "activeBtn" : "disabledBtn"
                            } ms-1`}
                        onClick={() => setType("declined")}
                    >
                        Declined
                    </button>
                </div>

                {
                    type === "Pending" ? (
                        <PendingHostRequest />
                    ) : type === "accepted" ? (
                        <AcceptedHostRequest />
                    ) : type === "declined" ? (
                        <DeclinedHostRequest />
                    ) : null
                }


            </div>
        </>
    );
};
HostRequest.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};
export default HostRequest;
