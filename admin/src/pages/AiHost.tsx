import { FakeHost } from "@/component/host/FakeHost";
import RootLayout from "@/component/layout/Layout";
import Button from "@/extra/Button";
import image from "@/assets/images/bannerImage.png";
import { useRouter } from "next/router";
import Title from "@/extra/Title";

const AiHost = () => {
  const router = useRouter();

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Title name="AI Host List" />
        <div className="d-flex gap-2">
          <div className="betBox">
            <Button
              className={`bg-button p-10 text-white m10-bottom `}
              bIcon={image}
              text="Add AI Host"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("editAiHostData");
                }
                router.push("/AddAiHost");
              }}
            />
          </div>
        </div>
      </div>

      <FakeHost type="fake_host" hideAddButton={true} />
    </>
  );
};

AiHost.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiHost;
