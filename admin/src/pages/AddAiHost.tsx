import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import { AiHostForm } from "@/component/host/AiHostForm";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { getHostProfile } from "@/store/hostSlice";

const AddAiHost = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { hostProfile } = useSelector((state: any) => state.host);
  const [initialData, setInitialData] = useState<any>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    if (!router.isReady) return;
    const hostId = router.query.id as string;
    if (hostId) {
      if (typeof window !== "undefined") {
        const dataStr = localStorage.getItem("editAiHostData");
        if (dataStr) {
          try {
            setInitialData(JSON.parse(dataStr));
          } catch (e) {
            console.error("Failed to parse editAiHostData:", e);
          }
        }
      }
      dispatch(getHostProfile(hostId) as any);
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem("editAiHostData");
      }
      setInitialData(null);
      setIsReady(true);
    }
  }, [router.isReady, router.query.id, dispatch]);

  useEffect(() => {
    if (router.query.id && hostProfile?._id && String(hostProfile._id) === String(router.query.id)) {
      setInitialData(hostProfile);
      setIsReady(true);
    } else if (!router.query.id) {
      setIsReady(true);
    } else if (initialData) {
      setIsReady(true);
    }
  }, [hostProfile, router.query.id, initialData]);

  if (!isReady) return null;

  return <AiHostForm initialData={initialData} key={initialData?._id || "new-ai-host"} />;
};

AddAiHost.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AddAiHost;
