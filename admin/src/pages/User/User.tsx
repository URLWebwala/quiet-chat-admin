import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import { openDialog } from "@/store/dialogSlice";
import { getHostRequest, hostRequestUpdate } from "@/store/hostRequestSlice";
import { RootStore } from "@/store/store";
import {  warning, warningForAccept } from "@/utils/Alert";
import { useEffect, useMemo, useState } from "react";
import Select, { StylesConfig } from "react-select";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import info from "@/assets/images/info.svg";
import edit from "@/assets/images/edit.svg";
import { baseURL } from "@/utils/config";
import male from "@/assets/images/male.png";
import { blockuser, deleteAdminUser, getRealOrFakeUser } from "@/store/userSlice";
import ToggleSwitch from "@/extra/TogggleSwitch";
import RootLayout from "@/component/layout/Layout";
import Analytics from "@/extra/Analytic";
import Searching from "@/extra/Searching";
import historyInfo from "@/assets/images/history1.png";
import coin from "@/assets/images/coin.png";
import notification from "@/assets/images/notification1.svg";
import trash from "@/assets/images/delete.svg";
import NotificationDialog from "@/component/user/NotificationDialogue";
import Image from "next/image";
import { formatCoins, getCountryCodeFromEmoji } from "@/utils/Common";
import india from "@/assets/images/india.png";
import { isSkeleton } from "@/utils/allSelector";
import UserShimmer from "@/component/Shimmer/UserShimmer";
import AgencyDialog from "@/component/agency/AgencyDialog";
import CoinUpdateDialog from "@/component/coinPlan/CoinUpdateDialog";

interface SuggestedServiceData {
  _id: string;
  doctor: string;
  name: string;
  gender: string;
  email: string;
  age: number;
  dob: any;
  description: string;
  country: string;
  impression: string;
}

/** Matches dashboard `userStatus` query → API `status` param */
type UserListStatusFilter = "all" | "online" | "blocked" | "vip";

type CoinRangeKey = "all" | "0" | "1-100" | "101-500" | "501-1000" | "1000plus";

type RechargeFilterKey = "all" | "recharged";

type GenderFilterKey = "all" | "male" | "female";

const USER_LIST_STATUS_FILTERS: { key: UserListStatusFilter; label: string }[] = [
  { key: "all", label: "All users" },
  { key: "online", label: "Online" },
  { key: "blocked", label: "Blocked" },
  { key: "vip", label: "VIP" },
];

const COIN_RANGE_OPTIONS: { value: CoinRangeKey; label: string }[] = [
  { value: "all", label: "All balances" },
  { value: "0", label: "0 coins" },
  { value: "1-100", label: "1 – 100 coins" },
  { value: "101-500", label: "101 – 500 coins" },
  { value: "501-1000", label: "501 – 1,000 coins" },
  { value: "1000plus", label: "1,000+ coins" },
];

const RECHARGE_FILTER_OPTIONS: { value: RechargeFilterKey; label: string }[] = [
  { value: "all", label: "All users" },
  { value: "recharged", label: "Recharged only" },
];

const GENDER_FILTER_OPTIONS: { value: GenderFilterKey; label: string }[] = [
  { value: "all", label: "All genders" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

type FilterOption = { value: string; label: string };

const userFilterSelectStyles: StylesConfig<FilterOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 38,
    height: 38,
    borderRadius: 10,
    borderColor: state.isFocused ? "#8F6DFF" : "#e2e5e7",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(143, 109, 255, 0.18)" : "none",
    cursor: "pointer",
    fontSize: 13,
    "&:hover": { borderColor: "#c4b5fd" },
  }),
  valueContainer: (base) => ({ ...base, height: 38, padding: "0 12px" }),
  input: (base) => ({ ...base, margin: 0, padding: 0 }),
  indicatorsContainer: (base) => ({ ...base, height: 38, paddingRight: 6 }),
  dropdownIndicator: (base) => ({ ...base, padding: 6, color: "#666" }),
  placeholder: (base) => ({ ...base, color: "#888" }),
  singleValue: (base) => ({ ...base, color: "#222", fontWeight: 500 }),
  menu: (base) => ({
    ...base,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 6,
    boxShadow: "0 10px 28px rgba(0,0,0,0.12)",
    border: "1px solid #ececf4",
    zIndex: 20,
  }),
  menuList: (base) => ({ ...base, padding: 6 }),
  option: (base, state) => ({
    ...base,
    borderRadius: 8,
    margin: "2px 0",
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: 13,
    backgroundColor: state.isSelected
      ? "#8F6DFF"
      : state.isFocused
        ? "rgba(143, 109, 255, 0.1)"
        : "transparent",
    color: state.isSelected ? "#fff" : "#222",
  }),
};

function userListStatusFromQuery(query: { userStatus?: string | string[] }): UserListStatusFilter {
  const raw = query.userStatus;
  const q = Array.isArray(raw) ? raw[0] : raw;
  const s = typeof q === "string" ? q.toLowerCase() : "";
  if (s === "online" || s === "blocked" || s === "vip") return s;
  return "all";
}

function coinRangeFromQuery(query: { coinRange?: string | string[] }): CoinRangeKey {
  const raw = query.coinRange;
  const q = Array.isArray(raw) ? raw[0] : raw;
  const s = typeof q === "string" ? q.trim() : "all";
  const normalized = s === "1000+" ? "1000plus" : s;
  const valid: CoinRangeKey[] = ["all", "0", "1-100", "101-500", "501-1000", "1000plus"];
  return valid.includes(normalized as CoinRangeKey) ? (normalized as CoinRangeKey) : "all";
}

function rechargeFilterFromQuery(query: { rechargeFilter?: string | string[] }): RechargeFilterKey {
  const raw = query.rechargeFilter;
  const q = Array.isArray(raw) ? raw[0] : raw;
  return q === "recharged" ? "recharged" : "all";
}

function genderFromQuery(query: { gender?: string | string[] }): GenderFilterKey {
  const raw = query.gender;
  const q = Array.isArray(raw) ? raw[0] : raw;
  const s = typeof q === "string" ? q.toLowerCase().trim() : "all";
  if (s === "male" || s === "female") return s;
  return "all";
}

const User = (props: any) => {
  const dispatch = useDispatch();
  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");
  const router = useRouter();
 
  const roleSkeleton = useSelector(isSkeleton);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});

  const toggleReview = (index: number) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const { dialogue, dialogueType } = useSelector(
    (state: RootStore) => state.dialogue
  );
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const { user, total } = useSelector((state: RootStore) => state.user);
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const listStatusFilter: UserListStatusFilter = router.isReady
    ? userListStatusFromQuery(router.query)
    : "all";

  const setUserListStatusFilter = (key: UserListStatusFilter) => {
    setPage(1);
    const q: Record<string, string | string[] | undefined> = { ...router.query };
    if (key === "all") delete q.userStatus;
    else q.userStatus = key;
    router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true });
  };

  const coinRangeFilter: CoinRangeKey = router.isReady
    ? coinRangeFromQuery(router.query)
    : "all";

  const rechargeFilter: RechargeFilterKey = router.isReady
    ? rechargeFilterFromQuery(router.query)
    : "all";

  const genderFilter: GenderFilterKey = router.isReady
    ? genderFromQuery(router.query)
    : "all";

  const setCoinRangeFilter = (key: CoinRangeKey) => {
    setPage(1);
    const q: Record<string, string | string[] | undefined> = { ...router.query };
    if (key === "all") delete q.coinRange;
    else q.coinRange = key;
    router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true });
  };

  const setRechargeFilterKey = (key: RechargeFilterKey) => {
    setPage(1);
    const q: Record<string, string | string[] | undefined> = { ...router.query };
    if (key === "all") delete q.rechargeFilter;
    else q.rechargeFilter = key;
    router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true });
  };

  const setGenderFilter = (key: GenderFilterKey) => {
    setPage(1);
    const q: Record<string, string | string[] | undefined> = { ...router.query };
    if (key === "all") delete q.gender;
    else q.gender = key;
    router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true });
  };

  const coinSelectValue = useMemo(
    () => COIN_RANGE_OPTIONS.find((o) => o.value === coinRangeFilter) ?? COIN_RANGE_OPTIONS[0],
    [coinRangeFilter]
  );

  const rechargeSelectValue = useMemo(
    () =>
      RECHARGE_FILTER_OPTIONS.find((o) => o.value === rechargeFilter) ?? RECHARGE_FILTER_OPTIONS[0],
    [rechargeFilter]
  );

  const genderSelectValue = useMemo(
    () =>
      GENDER_FILTER_OPTIONS.find((o) => o.value === genderFilter) ?? GENDER_FILTER_OPTIONS[0],
    [genderFilter]
  );

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  useEffect(() => {
    if (!router.isReady) return;
    const listStatus = userListStatusFromQuery(router.query);
    const coinRange = coinRangeFromQuery(router.query);
    const rechargeFilterParam = rechargeFilterFromQuery(router.query);
    const genderParam = genderFromQuery(router.query);
    dispatch(
      getRealOrFakeUser({
        start: page,
        limit: rowsPerPage,
        startDate,
        endDate,
        search,
        presenceStatus: listStatus,
        coinRange,
        rechargeFilter: rechargeFilterParam,
        gender: genderParam,
      })
    );
  }, [
    router.isReady,
    router.query.userStatus,
    router.query.coinRange,
    router.query.rechargeFilter,
    router.query.gender,
    page,
    rowsPerPage,
    startDate,
    endDate,
    search,
  ]);

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  const handleFilterData = (filteredData: any) => {
    setPage(1);
    if (typeof filteredData === "string") {
      setSearch(filteredData);
    } else {
      setData(filteredData);
    }
  };

  const handleInfo = (row: any) => {
    router.push({
      pathname: "/User/UserInfoPage",
      query: { id: row?._id },
    });

    typeof window !== "undefined" &&
      localStorage.setItem("userData", JSON.stringify(row));
  };

  const handleRedirect = (row: any) => {
    router.push({
      pathname: "/User/CoinPlanHistoryPage",
      query: { id: row?._id },
    });

    typeof window !== "undefined" &&
      localStorage.setItem("userData", JSON.stringify(row));
  };

  const handleNotify = (id: any) => {
    dispatch(openDialog({ type: "notification", data: { id, type: "user" } }));
  };

  const handleEdit = (row: any) => {
    dispatch(openDialog({ type: "Coin", data: { id: row?._id, type: "Coin", coin: row?.coin } }));
  };

  const userTable = [
    {
      Header: "No",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ index }: { index: any }) => (
        <span className="fw-bold text-muted"> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
      ),
    },

    {
      Header: "User",
      body: "profilePic",
      thClass: "text-start ps-3",
      tdClass: "text-start ps-3",
      Cell: ({ row }: { row: any }) => {
        const rawImagePath = row?.image || "";
        const normalizedImagePath = rawImagePath.replace(/\\/g, "/");

        const imageUrl = normalizedImagePath.includes("storage")
          ? baseURL + normalizedImagePath
          : normalizedImagePath;

        const handleClick = () => {
          router.push({
            pathname: "/User/UserInfoPage",
            query: { id: row?._id },
          });
        };

        return (
          <div style={{ cursor: "pointer" }} onClick={handleClick}>
            <div className="d-flex align-items-center py-1">
              <div className="position-relative flex-shrink-0">
                <img
                  src={row?.image ? imageUrl : male.src}
                  referrerPolicy="no-referrer"
                  alt="Avatar"
                  onError={(e: any) => {
                    e.target.src = male.src;
                  }}
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    height: "44px",
                    width: "44px",
                    border: "2px solid #e5e7eb",
                  }}
                  height={44}
                  width={44}
                />
                {row?.isOnline && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: "11px",
                      height: "11px",
                      backgroundColor: "#10b981",
                      borderRadius: "50%",
                      border: "2px solid #fff",
                    }}
                    title="Online"
                  />
                )}
              </div>
              <div className="d-flex flex-column text-start ms-2 text-nowrap">
                <div className="d-flex align-items-center gap-1">
                  <span className="fw-bold text-dark text-capitalize" style={{ fontSize: "14px" }}>
                    {row?.name || "-"}
                  </span>
                  {row?.isVip && (
                    <span
                      style={{
                        fontSize: "10px",
                        background: "#fef3c7",
                        color: "#d97706",
                        padding: "1px 5px",
                        borderRadius: "6px",
                        fontWeight: 700,
                      }}
                    >
                      VIP
                    </span>
                  )}
                  {row?.isHost && (
                    <span
                      style={{
                        fontSize: "10px",
                        background: "#ede9fe",
                        color: "#7c3aed",
                        padding: "1px 5px",
                        borderRadius: "6px",
                        fontWeight: 700,
                      }}
                    >
                      Host
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "11px", color: "#8c8c8c" }}>
                  ID: {row?.uniqueId || "-"}
                </span>
                {(row?.phone || row?.mobile) && (
                  <span style={{ fontSize: "12px", color: "#374151", fontWeight: 500 }}>
                    {row?.phone || row?.mobile}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },

    {
      Header: "Gender",
      thClass: "text-start ps-3",
      tdClass: "text-start ps-3",
      Cell: ({ row }: { row: any }) => {
        const gender = (row?.gender || "").toLowerCase().trim();
        if (gender === "male") {
          return (
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#2563eb",
                backgroundColor: "#eff6ff",
                border: "1px solid #dbeafe",
                padding: "3px 10px",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                textTransform: "capitalize",
              }}
            >
              <i className="ri-men-line" style={{ fontSize: "13px" }}></i> Male
            </span>
          );
        } else if (gender === "female") {
          return (
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#db2777",
                backgroundColor: "#fdf2f8",
                border: "1px solid #fce7f3",
                padding: "3px 10px",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                textTransform: "capitalize",
              }}
            >
              <i className="ri-women-line" style={{ fontSize: "13px" }}></i> Female
            </span>
          );
        } else if (row?.gender) {
          return (
            <span
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "#6b7280",
                backgroundColor: "#f3f4f6",
                border: "1px solid #e5e7eb",
                padding: "3px 10px",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                textTransform: "capitalize",
              }}
            >
              {row?.gender}
            </span>
          );
        }
        return <span className="text-muted" style={{ fontSize: "13px" }}>-</span>;
      },
    },

    {
      Header: "Country",
      thClass: "text-start ps-3",
      tdClass: "text-start ps-3",
      Cell: ({ row }: { row: any }) => {
        const countryName = row?.country || "-";
        const emoji = row?.countryFlagImage;
        const countryCode = getCountryCodeFromEmoji(emoji);
        const flagImageUrl = countryCode
          ? `https://flagcdn.com/w40/${countryCode}.png`
          : null;

        return (
          <div className="d-flex align-items-center gap-2">
            {flagImageUrl ? (
              <img
                src={flagImageUrl}
                height={18}
                width={26}
                alt={`${countryName} Flag`}
                style={{
                  objectFit: "cover",
                  borderRadius: "3px",
                  border: "1px solid #e5e7eb",
                }}
              />
            ) : (
              <span style={{ fontSize: "18px" }}>{emoji || "🌐"}</span>
            )}
            <span className="text-capitalize text-nowrap" style={{ fontSize: "13px" }}>
              {countryName}
            </span>
          </div>
        );
      },
    },

    {
      Header: "Coins",
      thClass: "text-start ps-3",
      tdClass: "text-start ps-3",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex flex-column text-start">
          <div className="d-flex align-items-center gap-1">
            <img src={coin.src} height={16} width={16} alt="Coin" />
            <span className="fw-bold" style={{ fontSize: "13px", color: "#7c3aed" }}>
              {formatCoins(row?.coin)}
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>
            Recharge: {formatCoins(row?.rechargedCoins)}
          </span>
        </div>
      ),
    },

    {
      Header: "Block",
      body: "isBlock",
      thClass: "text-start ps-3",
      tdClass: "text-start ps-3",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex align-items-center">
          <ToggleSwitch
            value={row?.isBlock}
            onClick={() => {
              const id: any = row?._id;
              dispatch(blockuser(id));
            }}
          />
        </div>
      ),
    },

    {
      Header: "Joined",
      thClass: "text-start ps-3",
      tdClass: "text-start ps-3",
      Cell: ({ row }: { row: any }) => {
        const date = new Date(row?.createdAt);
        const formattedDate = isNaN(date.getTime())
          ? "-"
          : date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        return <span className="text-nowrap text-muted" style={{ fontSize: "12px" }}>{formattedDate}</span>;
      },
    },

    {
      Header: "Actions",
      thClass: "text-start ps-3",
      tdClass: "text-start ps-3",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex align-items-center gap-1">
          {/* Edit Coin */}
          <button
            style={{
              backgroundColor: "#E1F8FF",
              borderRadius: "8px",
              padding: "6px",
              border: "none",
              cursor: "pointer",
            }}
            title="Edit Coins"
            onClick={() => handleEdit(row)}
          >
            <img
              src={edit.src}
              height={18}
              width={18}
              alt="Edit"
              style={{ height: "18px", width: "18px", objectFit: "contain" }}
            />
          </button>

          {/* Info */}
          <button
            style={{
              backgroundColor: "#E1F8FF",
              borderRadius: "8px",
              padding: "6px",
              border: "none",
              cursor: "pointer",
            }}
            title="User Profile Info"
            onClick={() => handleInfo(row)}
          >
            <img
              src={info.src}
              height={18}
              width={18}
              alt="Info"
              style={{ height: "18px", width: "18px", objectFit: "contain" }}
            />
          </button>

          {/* Notification */}
          <button
            style={{
              borderRadius: "8px",
              padding: "6px",
              background: "#FFEFE1",
              border: "none",
              cursor: "pointer",
            }}
            title="Send Notification"
            onClick={() => handleNotify(row?._id)}
          >
            <img
              src={notification.src}
              width={18}
              height={18}
              alt="Notification"
              style={{ height: "18px", width: "18px", objectFit: "contain" }}
            />
          </button>

          {/* History */}
          <button
            style={{
              borderRadius: "8px",
              background: "#FFE7E7",
              padding: "6px",
              border: "none",
              cursor: "pointer",
            }}
            title="Call / Coin History"
            onClick={() => handleRedirect(row)}
          >
            <img
              src={historyInfo.src}
              height={18}
              width={18}
              alt="History"
              style={{ height: "18px", width: "18px", objectFit: "cover" }}
            />
          </button>

          {/* Delete */}
          <button
            style={{
              borderRadius: "8px",
              background: "#FFE5E5",
              padding: "6px",
              border: "none",
              cursor: "pointer",
            }}
            title="Delete User"
            onClick={() => {
              warning("Are you sure you want to delete this user?").then((res: any) => {
                if (res.isConfirmed) {
                  dispatch(deleteAdminUser(row?._id));
                }
              });
            }}
          >
            <img
              src={trash.src}
              height={18}
              width={18}
              alt="Delete"
              style={{ height: "18px", width: "18px", objectFit: "contain" }}
            />
          </button>
        </div>
      ),
    },
  ];
  return (
    <div className="mainCategory">
      {dialogueType == "notification" && <NotificationDialog />}
      {dialogueType === "Coin" && <CoinUpdateDialog />}
      <div
        className="d-flex align-items-center flex-wrap w-100"
        style={{ columnGap: 10, rowGap: 10 }}
      >
        <div
          className="d-flex align-items-center flex-wrap"
          style={{
            columnGap: 10,
            rowGap: 8,
            flex: "0 1 auto",
            minWidth: 0,
          }}
        >
          <div className="flex-shrink-0">
            <Analytics
              analyticsStartDate={startDate}
              analyticsStartEnd={endDate}
              analyticsStartDateSet={setStartDate}
              analyticsStartEndSet={setEndDate}
              direction={"start"}
            />
          </div>
          <div
            className="d-flex align-items-center flex-wrap flex-shrink-0"
            style={{ columnGap: 8, rowGap: 8 }}
          >
            <div className="d-flex align-items-center gap-1 flex-wrap flex-shrink-0">
              {USER_LIST_STATUS_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setUserListStatusFilter(key)}
                  style={{
                    height: "38px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    backgroundColor: listStatusFilter === key ? "#8F6DFF" : "#ececf4",
                    color: listStatusFilter === key ? "#fff" : "#333",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              className="d-flex align-items-center flex-shrink-0"
              style={{ gap: 10 }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#555",
                  whiteSpace: "nowrap",
                  minWidth: 52,
                }}
              >
                Coin
              </span>
              <div style={{ width: 196, minWidth: 180 }}>
                <Select<FilterOption, false>
                  instanceId="user-coin-filter"
                  inputId="user-coin-filter-input"
                  aria-label="Filter by coin balance"
                  isSearchable={false}
                  options={COIN_RANGE_OPTIONS}
                  value={coinSelectValue}
                  onChange={(opt) => opt && setCoinRangeFilter(opt.value as CoinRangeKey)}
                  styles={userFilterSelectStyles}
                />
              </div>
            </div>
            <div
              className="d-flex align-items-center flex-shrink-0"
              style={{ gap: 10 }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#555",
                  whiteSpace: "nowrap",
                  minWidth: 72,
                }}
              >
                Recharge
              </span>
              <div style={{ width: 196, minWidth: 180 }}>
                <Select<FilterOption, false>
                  instanceId="user-recharge-filter"
                  inputId="user-recharge-filter-input"
                  aria-label="Filter by recharge history"
                  isSearchable={false}
                  options={RECHARGE_FILTER_OPTIONS}
                  value={rechargeSelectValue}
                  onChange={(opt) => opt && setRechargeFilterKey(opt.value as RechargeFilterKey)}
                  styles={userFilterSelectStyles}
                />
              </div>
            </div>
            <div
              className="d-flex align-items-center flex-shrink-0"
              style={{ gap: 10 }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#555",
                  whiteSpace: "nowrap",
                  minWidth: 52,
                }}
              >
                Gender
              </span>
              <div style={{ width: 150, minWidth: 140 }}>
                <Select<FilterOption, false>
                  instanceId="user-gender-filter"
                  inputId="user-gender-filter-input"
                  aria-label="Filter by gender"
                  isSearchable={false}
                  options={GENDER_FILTER_OPTIONS}
                  value={genderSelectValue}
                  onChange={(opt) => opt && setGenderFilter(opt.value as GenderFilterKey)}
                  styles={userFilterSelectStyles}
                />
              </div>
            </div>
          </div>
        </div>
        <div
          className="ms-auto"
          style={{
            flex: "1 1 300px",
            minWidth: "min(100%, 260px)",
            maxWidth: "560px",
          }}
        >
          <Searching
            type={`server`}
            data={user}
            setData={setData}
            column={userTable}
            serverSearching={handleFilterData}
            placeholder={"Search by User Name / Unique Id"}
          />
        </div>
      </div>

      <div className="mt-2">
        <Table
          data={user}
          mapData={userTable}
          PerPage={rowsPerPage}
          Page={page}
          type={"server"}
          shimmer={<UserShimmer />}
        />
        <div style={{ marginTop: "40px" }}>
          <Pagination
            type={"server"}
            serverPage={page}
            setServerPage={setPage}
            serverPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            totalData={total}
          />
        </div>
      </div>
    </div>
  );
};

User.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default User;
