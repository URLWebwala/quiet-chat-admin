import React from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { useRouter } from "next/router";
import { AiExpertForm } from "@/component/host/AiExpertForm";

const AddAiExpert = () => {
  const router = useRouter();
  const expertId = typeof router.query.id === "string" ? router.query.id : undefined;

  return (
    <>
      <div className="p-3">
        <Title name={expertId ? "Edit AI Expert" : "Add AI Expert"} />
        <div className="mt-3">
          <AiExpertForm expertId={expertId} />
        </div>
      </div>
    </>
  );
};

AddAiExpert.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AddAiExpert;
