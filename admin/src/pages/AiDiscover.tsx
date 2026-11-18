import React from "react";
import RootLayout from "@/component/layout/Layout";
import AiDiscoverComponent from "@/component/ai/AiDiscoverComponent";

const AiDiscover = () => {
  return (
    <div className="p-3">
      <AiDiscoverComponent initialTab="discover" />
    </div>
  );
};

AiDiscover.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiDiscover;
