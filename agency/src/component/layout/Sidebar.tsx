import Navigator from "@/extra/Navigator";
import { useEffect, useState } from "react";
import sideBarLogo from "../../assets/images/logo.png";
import { useRouter } from "next/navigation";
import $ from "jquery";
import { projectName } from "@/utils/config";
import CommonDialog from "@/utils/CommonDialog";
import { toast } from "react-toastify";
import HostRequest from "../../assets/images/HostRequest";
import Host from "../../assets/images/Host";
import PaymentMethod from "../../assets/images/PaymentMethod";
import HostWithdrawal from "../../assets/images/HostWithdrawal";
import AgencyWithdraw from "../../assets/images/AgencyWithdraw";
import AgenyEarning from "../../assets/images/AgenyEarning";
import LogOut from "../../assets/images/Logout";

const Sidebar = () => {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);

  const handleLogout = () => {
    setShowDialog(true);
  };

  const handleOnClick = () => {
    window && localStorage.removeItem("dialog");
  };

  const confirmLogout = async () => {
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

  const navBarArray = [
    {
      name: "Dashboard",
      path: "/dashboard",
      navSVG: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          className="bi bi-border-all"
          viewBox="0 0 16 16"
        >
          <path d="M0 0h16v16H0zm1 1v6.5h6.5V1zm7.5 0v6.5H15V1zM15 8.5H8.5V15H15zM7.5 15V8.5H1V15z" />
        </svg>
      ),
    },
  ];

  const array1 = [
    {
      name: "Host Request",
      path: "/HostRequest",
      path2: "/HostProfile",
      navSVG: <HostRequest />,
    },

    {
      name: "Host",
      path: "/Host",
      path2: "/Host/HostInfo",
      path3: "/Host/HostHistoryPage",
      navSVG: <Host />,
      onClick: handleOnClick,
    },

    {
      name: "Live Host",
      path: "/LiveHost",
      navSVG: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="21"
          height="21"
          fill="currentColor"
          className="bi bi-person-up"
          viewBox="0 0 16 16"
        >
          <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.354-5.854 1.5 1.5a.5.5 0 0 1-.708.708L13 11.707V14.5a.5.5 0 0 1-1 0v-2.793l-.646.647a.5.5 0 0 1-.708-.708l1.5-1.5a.5.5 0 0 1 .708 0M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
          <path d="M8.256 14a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z" />
        </svg>
      ),
      onClick: handleOnClick,
    },
  ];

  const array2 = [
    {
      name: "Payment Method",
      path: "/PaymentMethod",
      navSVG: <PaymentMethod />,
      onClick: handleOnClick,
    },
    {
      name: "Host Withdrawal",
      path: "/WithdrawRequest",
      navSVG: <HostWithdrawal />,
      onClick: handleOnClick,
    },

    {
      name: "Agency Withdrawal",
      path: "/AgencyWithdrawRequest",
      navSVG: <AgencyWithdraw />,
      onClick: handleOnClick,
    },

    {
      name: "Agency Earning",
      path: "/AgencyEarningHistory",
      navSVG: <AgenyEarning />,
      onClick: handleOnClick,
    },
  ];

  const array5 = [
    {
      name: "Setting",
      path: "/Setting",
      navSVG: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="21"
          height="21"
          fill="currentColor"
          className="bi bi-gear"
          viewBox="0 0 16 16"
        >
          <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0" />
          <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z" />
        </svg>
      ),
      onClick: handleOnClick,
    },
    {
      name: "Profile",
      path: "/agencyProfile",
      navSVG: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="21"
          height="21"
          fill="currentColor"
          className="bi bi-person"
          viewBox="0 0 16 16"
        >
          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
        </svg>
      ),
      onClick: handleOnClick,
    },
    {
      name: "LogOut",
      navSVG: (
       <LogOut />
      ),
      onClick: handleLogout,
    },
  ];

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
        <div className="sideBar">
          <div
            style={{
              paddingLeft: "0px",
              //  background: "#8F6DFF"
            }}
          >
            <div className="sideBarLogo">
              <div className="logo d-flex" style={{ alignItems: "center" }}>
                {/* <img src={Logo} alt="logo" /> */}
                <div style={{ width: "50px" }}>
                  <img src={sideBarLogo.src} width={40} height={40} alt="" />
                </div>
                <h3
                  className="cursor text-nowrap mb-0 ms-1"
                  style={{
                    color: "#535354",
                    fontSize: "22px",
                    margin: "0px !important",
                  }}
                  // onClick={() => router("/admin/adminDashboard")}
                >
                  {projectName}
                </h3>
              </div>
              {/* <div className="smallLogo">
            <img src={""} alt="logo" className="smallLogo" />
          </div> */}
              {/* <i className="ri-close-line closeIcon navToggle"></i>
              <div className="blackBox navToggle"></div> */}
            </div>
          </div>
          {/* ======= Navigation ======= */}
          <div className="navigation">
            <nav>
              {/* About */}
              <ul
                className={`mainMenu webMenu`}
                style={{ padding: "10px 0.75rem" }}
              >
                <p className="navTitle">Menu</p>

                {navBarArray.map((res: any, i: any) => {
                  return (
                    <>
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
                    </>
                  );
                })}

                <p className="navTitle">Host Management</p>

                {array1.map((res: any, i: any) => {
                  return (
                    <>
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
                    </>
                  );
                })}

                <p className="navTitle">Finance</p>
                {array2.map((res: any, i: any) => {
                  return (
                    <>
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
                    </>
                  );
                })}

                <p className="navTitle">Setting</p>

                {array5.map((res: any, i: any) => {
                  return (
                    <>
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
                    </>
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
