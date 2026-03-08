import { FakeHost } from "@/component/host/FakeHost";
import { RealHost } from "@/component/host/RealHost";
import RootLayout from "@/component/layout/Layout";
import Button from "@/extra/Button";
import { routerChange } from "@/utils/Common";
import { hostTypes, userTypes } from "@/utils/extra";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import image from "@/assets/images/bannerImage.png";
import { getMessage } from "@/store/hostSlice";
import { openMessageDialog } from "@/store/dialogSlice";
import MessageDialog from "@/component/host/MessageDialog";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";

const Host = () => {
  const dispatch = useDispatch();
  const { dialogue, dialogueType } = useSelector(
    (state: RootStore) => state.dialogue
  );
  const [type, setType] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedType = localStorage.getItem("hostTypeData") || "real_host";
    if (storedType) setType(storedType);
  }, []);

  useEffect(() => {
    if (type) {
      localStorage.setItem("hostTypeData", type);
    }
  }, [type]);

  useEffect(() => {
    routerChange("/Host", "hostTypeData", router);
  }, []);

  return (
    <>
    <div className="d-flex justify-content-between">
      <div className="my-2 host_width mt-2">
        {hostTypes.map((item, index) => (
          <button
            key={index}
            type="button"
            className={`${type === item.value ? "activeBtn" : "disabledBtn"} ${
              index !== 0 ? "ms-1" : ""
            }`}
            onClick={() => setType(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {
        type === "fake_host" && (
        <>

      <div className="d-flex gap-2">
        <div className="betBox">
          <Button
            className={`bg-main p-10 text-white m10-bottom `}
            bIcon={image}
            text="Add Male Message"
            onClick={async () => {
              const data = await dispatch(getMessage({ gender: 1 }));
              dispatch(
                openMessageDialog({
                  type: "messageHost",
                  gender: "male",
                  data: data?.payload?.data?.message.toString(),
                })
              );
            }}
          />
          {dialogueType === "messageHost" && <MessageDialog />}
        </div>
        <div className="betBox">
          <Button
            className={`b p-10 text-white m10-bottom `}
            style={{ backgroundColor: "#EC4899" }}
            bIcon={image}
            text="Add Female Message"
            onClick={async () => {
              const data = await dispatch(getMessage({ gender: 2 }));
              dispatch(
                openMessageDialog({
                  type: "messageHost",
                  gender: "female",
                  data: data?.payload?.data?.message.toString(),
                })
              );
            }}
          />
          {dialogueType === "messageHost" && <MessageDialog />}
        </div>
      </div>
        </>
        )
      }
    </div>

      {type === "real_host" && <RealHost type={type} />}

      {type === "fake_host" && <FakeHost type={type} />}
    </>
  );
};

Host.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default Host;
