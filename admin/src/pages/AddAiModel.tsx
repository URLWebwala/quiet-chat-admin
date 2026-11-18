import React from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { useRouter } from "next/router";
import { AiHostPersonaForm } from "@/component/host/AiHostPersonaForm";

const AddAiModel = () => {
  const router = useRouter();
  const hostId = typeof router.query.id === "string" ? router.query.id : undefined;

  return (
    <div className="p-3">
      <Title name={hostId ? "Edit AI Model" : "Add AI Model"} />
      <div className="mt-3">
        <AiHostPersonaForm hostId={hostId} key={hostId || "new-model"} />
      </div>
    </div>
  );
};

AddAiModel.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AddAiModel;
