import RootLayout from "@/component/layout/Layout";
import { RootStore, useAppDispatch } from "@/store/store";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import HostInfo from "@/pages/Host/HostInfo";
import { useRouter } from "next/router";
import { routerChange } from "@/utils/Common";

const HostInfoPage = () => {
    const { dialogueType } = useSelector((state: RootStore) => state.dialogue);
    const router = useRouter();
    const type1 = router.query.type
   

    const dispatch = useAppDispatch();
    const [search, setSearch] = useState<string | undefined>("ALL");
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(0);
    const [type, setType] = useState<string>("profile");

        useEffect(() => {
            routerChange("/Host/HostInfoPage" , "hostInfoType",router)
          }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedType = localStorage.getItem("hostInfoType");
            if (storedType) setType(storedType);
        }
    }, []);


    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("hostInfoType", type);
        }
    }, [type]);


    return (
        <>
            <div
                className={`userTable ${dialogueType === "doctor" ? "d-none" : "d-block"
                    }`}
            >

             

            
                {
                    type === "profile" || type1 === "fakeHost" && (
                        <HostInfo type1={type1}/>
                    ) 
                    
                }


            </div>
        </>
    );
};
HostInfoPage.getLayout = function getLayout(page: React.ReactNode) {
    return <RootLayout>{page}</RootLayout>;
};
export default HostInfoPage;
