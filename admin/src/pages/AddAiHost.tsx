import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import { AiHostForm } from "@/component/host/AiHostForm";
import { useRouter } from "next/router";

const AddAiHost = () => {
  const router = useRouter();
  const [initialData, setInitialData] = useState<any>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dataStr = localStorage.getItem("editAiHostData");
      if (dataStr && router.query.id) {
        try {
          setInitialData(JSON.parse(dataStr));
        } catch (e) {
          console.error("Failed to parse editAiHostData:", e);
          setInitialData(null);
        }
      } else {
        localStorage.removeItem("editAiHostData");
        setInitialData(null);
      }
      setIsReady(true);
    }
  }, [router.query.id]);

  if (!isReady) return null;

  return <AiHostForm initialData={initialData} key={initialData?._id || "new-ai-host"} />;
};

AddAiHost.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AddAiHost;
