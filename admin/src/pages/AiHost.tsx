import React from "react";
import RootLayout from "@/component/layout/Layout";
import AiDiscoverComponent from "@/component/ai/AiDiscoverComponent";

const AiHost = () => {
  return (
    <div className="p-3">
      <AiDiscoverComponent initialTab="discover" />
    </div>
  );
};

AiHost.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiHost;
