import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSetting } from "@/store/settingSlice";
import Navigator from "@/extra/Navigator";
import logo from "../../assets/images/logo.png";
import sideBarLogo from "../../assets/images/logo.png";
import { useRouter } from "next/navigation";
import { warning } from "@/utils/Alert";
import Image from "next/image";
import $ from "jquery";
import { projectName } from "@/utils/config";
import logout from "@/assets/images/Log Out.svg";
import CommonDialog from "@/utils/CommonDialog";
import { toast } from "react-toastify";
import AgencyWiseHost from "@/pages/Host/AgencyWiseHost";

const Sidebar = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { setting } = useSelector((state: any) => state.setting);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!setting?._id) {
      dispatch(getSetting() as any);
    }
  }, [dispatch, setting?._id]);

  const handleLogout = () => {
    setShowDialog(true);
  };

  const handleOnClick = () => {
    window && localStorage.removeItem("dialog");
  };

  useEffect(() => {
    const sidebar = document.querySelector(".sideBar");
    if (sidebar) {
      const savedScroll = sessionStorage.getItem("sidebarScrollPos");
      if (savedScroll) {
        sidebar.scrollTop = parseInt(savedScroll, 10);
      }
      const handleScroll = () => {
        sessionStorage.setItem("sidebarScrollPos", sidebar.scrollTop.toString());
      };
      sidebar.addEventListener("scroll", handleScroll);
      return () => sidebar.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const confirmLogout = async () => {
    sessionStorage.removeItem("demo");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("admin");
    sessionStorage.removeItem("key");
    sessionStorage.removeItem("isAuth");
    sessionStorage.setItem("isAgency", "false");
    setTimeout(() => {
      router.push("/");
    }, 1000);
    toast.success("Logout successful");
  };

  const genralMenu = [
    {
      name: "Dashboard",
      path: "/dashboard",
      navSVG: <i className="ri-dashboard-line fs-18"></i>,
    },
    {
      name: "Reward Dashboard",
      path: "/reward-dashboard",
      navSVG: <i className="ri-dashboard-3-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "User",
      path: "/User/User",
      path4: "/User/UserInfoPage",
      path2: "/User/CoinPlanHistoryPage",
      path3: "/PurchaseCoinPlanHistory",
      navSVG: <i className="ri-user-line fs-18"></i>,
      onClick: handleOnClick,
    },
  ];

  const giftAndRewards = [
    {
      name: "Offer Wall",
      path: "/OfferWall",
      navSVG: <i className="ri-advertisement-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Gift Category",
      path: "/GiftCategory",
      navSVG: <i className="ri-folders-line fs-18"></i>,
      onClick: handleOnClick,
    },

    {
      name: "Gift",
      path: "/GiftPage",
      navSVG: <i className="ri-gift-2-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Daily CheckIn",
      path: "/DailyCheckInReward",
      navSVG: <i className="ri-calendar-check-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Daily Target Challenges",
      path: "/DailyChallenge",
      navSVG: <i className="ri-task-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Ads & Points",
      path: "/AdsWatchSetting",
      navSVG: <i className="ri-play-circle-line fs-18"></i>,
      onClick: handleOnClick,
    },
  ];

  const packages = [
    {
      name: "Plan",
      path: "/Plan",
      navSVG: <i className="ri-money-dollar-box-line fs-18"></i>,
      onClick: handleOnClick,
    },

    {
      name: "Vip Plan Benefits",
      path: "/VipPlanPrevilage",
      navSVG: <i className="ri-vip-crown-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Plan History",
      path: "/PlanHistory",
      path2: "/PlanHistory/coinhistory",
      path3: "/PlanHistory/viphistory",
      navSVG: <i className="ri-history-line fs-18"></i>,
      onClick: handleOnClick,
    }
  ];

  const finance = [
    {
      name: "Withdrawal",
      path: "/WithdrawRequest",
      navSVG: <i className="ri-bank-card-line fs-18"></i>,
      onClick: handleOnClick,
    },
  ];

  const rewardSystem = [
    {
      name: "Reward Settings",
      path: "/reward-settings",
      navSVG: <i className="ri-coin-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Survey Providers",
      path: "/survey-providers",
      navSVG: <i className="ri-survey-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Reward Withdrawals",
      path: "/reward-withdrawals",
      navSVG: <i className="ri-hand-coin-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Bulk Payout",
      path: "/bulk-payout",
      navSVG: <i className="ri-file-excel-2-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Reward Reports",
      path: "/reward-reports",
      navSVG: <i className="ri-file-chart-line fs-18"></i>,
      onClick: handleOnClick,
    },
  ];

  const settingMenu = [
    {
      name: "Setting",
      path: "/Setting",
      navSVG: <i className="ri-settings-3-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Profile",
      path: "/adminProfile",
      navSVG: <i className="ri-user-settings-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "LogOut",
      navSVG: <i className="ri-logout-box-r-line fs-18"></i>,
      onClick: handleLogout,
    },
  ];

  const hostAndAgency = [
    {
      name: "Agency",
      path: "/Agency",
      path2: "/Host/AgencyWiseHost",

      navSVG: <i className="ri-building-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Host",
      path: "/Host",
      path2: "/Host/HostInfoPage",
      path3: "/Host/HostHistoryPage",
      navSVG: <i className="ri-user-heart-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Ai Host List",
      path: "/AiHost",
      navSVG: <i className="ri-robot-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Add Ai Host",
      path: "/AddAiHost",
      navSVG: <i className="ri-user-add-line fs-18"></i>,
      onClick: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("editAiHostData");
        }
        handleOnClick();
      },
    },
    {
      name: "Ai Experts",
      path: "/AiExperts",
      navSVG: <i className="ri-graduation-cap-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Add Ai Expert",
      path: "/AddAiExpert",
      navSVG: <i className="ri-user-star-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Ai Chat",
      path: "/AiChat",
      navSVG: <i className="ri-message-3-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Ai Settings",
      path: "/AiSettings",
      navSVG: <i className="ri-settings-4-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Ai Inspector",
      path: "/AiInspector",
      navSVG: <i className="ri-find-replace-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Ai Safety Flags",
      path: "/AiFlags",
      navSVG: <i className="ri-shield-keyhole-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Ai Virtual Gifts",
      path: "/AiGifts",
      navSVG: <i className="ri-gift-line fs-18"></i>,
      onClick: handleOnClick,
    },
    {
      name: "Host Request",
      path: "/HostRequest",
      path2: "/HostProfile",
      navSVG: <i className="ri-user-received-line fs-18"></i>,
    },
    {
      name: "Host Tags",
      path: "/Impression",
      navSVG: <i className="ri-price-tag-3-line fs-18"></i>,
      onClick: handleOnClick,
    },
  ];

  // const screen = typeof window !== "undefined" && window;

  // const webSize = $(screen).width();
  return (
    <>
      <CommonDialog
        open={showDialog}
        onCancel={() => setShowDialog(false)}
        onConfirm={confirmLogout}
        text={"LogOut"}
      />
      <div className="mainSidebar">
        <SideMenuJS />
        <div className="sideBar" style={{ marginBottom: "40px", zIndex: 999 }}>
          <div
            style={{
              paddingLeft: "0px",
              backgroundColor: "white",
              position: "sticky",
              top: "0",
              // borderBottom: "1px solid #8F6DFF",
            }}
          >
            <div className="sideBarLogo">
              <div className="logo d-flex " style={{ alignItems: "center" }}>
                {/* <img src={Logo} alt="logo" /> */}
                <div style={{ width: "50px" }}>
                  <img src={sideBarLogo.src} width={40} height={40} alt="" />
                </div>
                <h3
                  className="cursor text-nowrap  "
                  style={{ color: "#535354", fontSize: "1.375rem" }}
                  // onClick={() => router("/admin/adminDashboard")}
                >
                  {projectName}
                </h3>
              </div>
              {/* <div className="smallLogo">
            <img src={""} alt="logo" className="smallLogo" />
          </div> */}
              <i className="ri-close-line closeIcon navToggle"></i>
              <div className="blackBox navToggle"></div>
            </div>
          </div>
          {/* ======= Navigation ======= */}
          <div className="navigation side">
            <nav style={{ marginBottom: "30px" }}>
              {/* About */}
              <ul
                className={`mainMenu webMenu`}
                style={{ padding: "10px 0.75rem" }}
              >
                <p className="navTitle">General</p>

                {genralMenu.map((res: any, i: any) => {
                  return (
                    <React.Fragment key={res?.path ?? res?.name ?? i}>
                      <Navigator
                        name={res?.name}
                        path={res?.path}
                        path2={res?.path2}
                        path3={res?.path3}
                        path4={res?.path4}
                        navIcon={res?.navIcon}
                        navSVG={res?.navSVG}
                        onClick={res?.onClick && res?.onClick}
                      >
                        {res?.subMenu && (
                          <ul className={`subMenu`}>
                            <span className="subhead">{res?.name}</span>
                            {res?.subMenu?.map((subMenu: any) => {
                              return (
                                <Navigator
                                  name={subMenu.subName}
                                  path={subMenu.subPath}
                                  onClick={subMenu.onClick}
                                  key={subMenu.subPath}
                                />
                              );
                            })}
                          </ul>
                        )}
                      </Navigator>
                    </React.Fragment>
                  );
                })}

                <p className="navTitle">Host & Agency</p>

                {(() => {
                  const showRealHostItems = setting?.isHostEnabled !== false;
                  const filteredHostAndAgency = hostAndAgency.filter((item) => {
                    if (!showRealHostItems) {
                      const realItems = ["Agency", "Host", "Host Request", "Host Tags"];
                      return !realItems.includes(item.name);
                    }
                    return true;
                  });

                  return filteredHostAndAgency.map((res: any, i: any) => {
                    return (
                      <React.Fragment key={res?.path ?? res?.name ?? i}>
                        <Navigator
                          name={res?.name}
                          path={res?.path}
                          path2={res?.path2}
                          path3={res?.path3}
                          path4={res?.path4}
                        navIcon={res?.navIcon}
                        navSVG={res?.navSVG}
                        onClick={res?.onClick && res?.onClick}
                      >
                        {res?.subMenu && (
                          <ul className={`subMenu`}>
                            <span className="subhead">{res?.name}</span>
                            {res?.subMenu?.map((subMenu: any) => {
                              return (
                                <Navigator
                                  name={subMenu.subName}
                                  path={subMenu.subPath}
                                  onClick={subMenu.onClick}
                                  key={subMenu.subPath}
                                />
                              );
                            })}
                          </ul>
                        )}
                      </Navigator>
                    </React.Fragment>
                  );
                });
              })()}

                <p className="navTitle">Gift & Rewards</p>

                {giftAndRewards.map((res: any, i: any) => {
                  return (
                    <React.Fragment key={res?.path ?? res?.name ?? i}>
                      <Navigator
                        name={res?.name}
                        path={res?.path}
                        path2={res?.path2}
                        path3={res?.path3}
                        path4={res?.path4}
                        navIcon={res?.navIcon}
                        navSVG={res?.navSVG}
                        onClick={res?.onClick && res?.onClick}
                      >
                        {res?.subMenu && (
                          <ul className={`subMenu`}>
                            <span className="subhead">{res?.name}</span>
                            {res?.subMenu?.map((subMenu: any) => {
                              return (
                                <Navigator
                                  name={subMenu.subName}
                                  path={subMenu.subPath}
                                  onClick={subMenu.onClick}
                                  key={subMenu.subPath}
                                />
                              );
                            })}
                          </ul>
                        )}
                      </Navigator>
                    </React.Fragment>
                  );
                })}

                <p className="navTitle">Packages</p>

                {packages.map((res: any, i: any) => {
                  return (
                    <React.Fragment key={res?.path ?? res?.name ?? i}>
                      <Navigator
                        name={res?.name}
                        path={res?.path}
                        path2={res?.path2}
                        path3={res?.path3}
                        path4={res?.path4}
                        navIcon={res?.navIcon}
                        navSVG={res?.navSVG}
                        onClick={res?.onClick && res?.onClick}
                      >
                        {res?.subMenu && (
                          <ul className={`subMenu`}>
                            <span className="subhead">{res?.name}</span>
                            {res?.subMenu?.map((subMenu: any) => {
                              return (
                                <Navigator
                                  name={subMenu.subName}
                                  path={subMenu.subPath}
                                  onClick={subMenu.onClick}
                                  key={subMenu.subPath}
                                />
                              );
                            })}
                          </ul>
                        )}
                      </Navigator>
                    </React.Fragment>
                  );
                })}

                <p className="navTitle">Finance</p>

                {finance.map((res: any, i: any) => {
                  return (
                    <React.Fragment key={res?.path ?? res?.name ?? i}>
                      <Navigator
                        name={res?.name}
                        path={res?.path}
                        path2={res?.path2}
                        path3={res?.path3}
                        path4={res?.path4}
                        navIcon={res?.navIcon}
                        navSVG={res?.navSVG}
                        onClick={res?.onClick && res?.onClick}
                      >
                        {res?.subMenu && (
                          <ul className={`subMenu`}>
                            <span className="subhead">{res?.name}</span>
                            {res?.subMenu?.map((subMenu: any) => {
                              return (
                                <Navigator
                                  name={subMenu.subName}
                                  path={subMenu.subPath}
                                  onClick={subMenu.onClick}
                                  key={subMenu.subPath}
                                />
                              );
                            })}
                          </ul>
                        )}
                      </Navigator>
                    </React.Fragment>
                  );
                })}

                <p className="navTitle">Reward System</p>

                {rewardSystem.map((res: any, i: any) => {
                  return (
                    <React.Fragment key={res?.path ?? res?.name ?? i}>
                      <Navigator
                        name={res?.name}
                        path={res?.path}
                        path2={res?.path2}
                        path3={res?.path3}
                        path4={res?.path4}
                        navIcon={res?.navIcon}
                        navSVG={res?.navSVG}
                        onClick={res?.onClick && res?.onClick}
                      >
                        {res?.subMenu && (
                          <ul className={`subMenu`}>
                            <span className="subhead">{res?.name}</span>
                            {res?.subMenu?.map((subMenu: any) => {
                              return (
                                <Navigator
                                  name={subMenu.subName}
                                  path={subMenu.subPath}
                                  onClick={subMenu.onClick}
                                  key={subMenu.subPath}
                                />
                              );
                            })}
                          </ul>
                        )}
                      </Navigator>
                    </React.Fragment>
                  );
                })}
                <p className="navTitle">Setting</p>

                {settingMenu.map((res: any, i: any) => {
                  return (
                    <React.Fragment key={res?.path ?? res?.name ?? i}>
                      <Navigator
                        name={res?.name}
                        path={res?.path}
                        navIcon={res?.navIcon}
                        navSVG={res?.navSVG}
                        onClick={res?.onClick && res?.onClick}
                      >
                        {res?.subMenu && (
                          <ul className={`subMenu`}>
                            <span className="subhead">{res?.name}</span>
                            {res?.subMenu?.map((subMenu: any) => {
                              return (
                                <Navigator
                                  name={subMenu.subName}
                                  path={subMenu.subPath}
                                  onClick={subMenu.onClick}
                                  key={subMenu.subPath}
                                />
                              );
                            })}
                          </ul>
                        )}
                      </Navigator>
                    </React.Fragment>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

export const SideMenuJS = () => {
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    $(".subMenu").hide();

    // ============== sidemenu toggle ==================
    const handleNav = (event: any) => {
      const target = event.currentTarget;
      $(".subMenu").not($(target).next(".subMenu")).slideUp();
      $(".mainMenu i").not($(target).children("i")).removeClass("rotate90");
      $(target).next(".subMenu").slideToggle();
      $(target).children("i").toggleClass("rotate90");
    };
    $(".mainMenu.webMenu > li > a").on("click", handleNav);

    // ============== sidebar toggle ==================
    const handleSidebar = () => {
      // Sidemenu Off In Mobile Menu
      $(".subMenu").slideUp();
      $(".mainMenu i").removeClass("rotate90");
      // Mobile Menu Class
      $(".mainAdminGrid").toggleClass("webAdminGrid");
      $(".mainMenu").toggleClass("mobMenu webMenu");
      setMenu(menu ? false : true);
    };
    $(".navToggle").on("click", handleSidebar);

    return () => {
      $(".mainMenu > li > a").off("click", handleNav);
      $(".navToggle").off("click", handleSidebar);
    };
  }, [menu]);
  return null;
};
