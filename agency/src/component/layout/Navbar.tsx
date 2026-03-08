import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { openDialog } from "@/store/dialogSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { useSelector } from "react-redux";
import NotificationDialog from "../user/NotificationDialogue";
import { agencyProfileGet } from "@/store/adminSlice";
import { getDefaultCurrency, getSetting } from "@/store/settingSlice";
import { baseURL } from "@/utils/config";
import notification from "@/assets/images/notification.svg";
import Image from "next/image";
import male from "@/assets/images/male.png";

const Navbar = () => {
  const router = useRouter();
  const [adminData, setAdminData] = useState<{ name?: string; image?: string }>(
    {}
  );
  const { admin } = useSelector((state: RootStore) => state?.admin);
  const adminDataInitialized = useRef(false); // Ref to track initialization

  const dispatch = useAppDispatch();

  const { dialogue, dialogueType } = useSelector(
    (state: RootStore) => state.dialogue
  );

  useEffect(() => {
    dispatch(agencyProfileGet());
  }, []);

  useEffect(() => {
    setAdminData(admin?.image);
  }, [dispatch]);

  const handleNotify = (id: any) => {
    dispatch(
      openDialog({
        type: "notification",
        data: { id, type: "host", allHost: true },
      })
    );
  };

  const enterFullscreen = () => {
    document.body.requestFullscreen();
  };

  return (
    <div className="mainNavbar">
      <div className="navBar">
        <div className="innerNavbar betBox">
          {dialogueType == "notification" && <NotificationDialog />}
          <div className="leftNav d-flex">
            <i
              className={`${`ri-bar-chart-horizontal-line`} cursor-pointer fs-20 navToggle`}
            ></i>
            <a onClick={enterFullscreen} className="ms-4 text-white cursor">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9F5AFF"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="feather feather-maximize"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              </svg>
            </a>
          </div>

          <div className="rightNav">
            <div
              className="adminProfile cursor-pointer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <button
                className="text-white fs-25 m20-right"
                onClick={() => handleNotify(admin?._id)}
                style={{ background: "transparent" }}
              >
                <img src={notification.src} width={20} height={25} />
              </button>
              <Link
                href="/agencyProfile"
                style={{ backgroundColor: "inherit" }}
              >
                <div className="adminPic">
                  {admin?.image && admin?.image.length > 0 && (
                    <img
                      src={admin?.image ? baseURL + admin?.image : male.src}
                      alt="Image"
                      width={48}
                      height={48}
                      style={{
                        borderRadius: "5px",
                        // border: "2px solid white",
                        objectFit: "cover",
                      }}
                      onError={( e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        const target = e.currentTarget;
                        target.onerror = null; // Prevent infinite loop
                        target.src = male.src;
                      }}
                      className="cursor"
                    />
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
