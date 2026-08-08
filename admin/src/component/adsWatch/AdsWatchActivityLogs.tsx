import React, { useEffect, useState } from "react";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { formatCoins } from "@/utils/Common";
import coin from "@/assets/images/coin.png";
import Image from "next/image";

interface LogRecord {
  _id: string;
  userId?: { _id: string; name: string; uniqueId: string; image: string };
  hostId?: { _id: string; name: string; uniqueId: string; image: string };
  personType: string;
  action: string;
  coins: number;
  adType: string;
  createdAt: string;
}

const AdsWatchActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [personType, setPersonType] = useState("all");
  const [adType, setAdType] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `api/admin/adsWatch/fetchRecentLogs?start=${page}&limit=${rowsPerPage}`;
      if (personType !== "all") url += `&personType=${personType}`;
      if (adType !== "all") url += `&adType=${adType}`;

      const res = await apiInstanceFetch.get(url);
      if (res?.status) {
        setLogs(res.data || []);
        setTotalLogs(res.total || 0);
      }
    } catch (err) {
      console.error("Fetch ads watch logs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage, personType, adType]);

  const renderNetworkBadge = (type: string) => {
    const t = String(type || "").toLowerCase();
    if (t === "unity") {
      return <span className="badge bg-purple-subtle text-purple border border-purple-subtle" style={{ color: "#7000ff", backgroundColor: "#f3e8ff" }}>Unity Ads 🎬</span>;
    }
    if (t === "bitlabs") {
      return <span className="badge bg-success-subtle text-success border border-success-subtle">BitLabs Survey 📋</span>;
    }
    if (t === "cpx") {
      return <span className="badge bg-info-subtle text-info border border-info-subtle">CPX Research 📊</span>;
    }
    if (t === "custom_task" || t === "customtask" || t === "task") {
      return <span className="badge bg-warning-subtle text-dark border border-warning-subtle">Custom Task 🎯</span>;
    }
    return <span className="badge bg-primary-subtle text-primary border border-primary-subtle">AdMob Rewarded 📺</span>;
  };

  const logsTableColumns = [
    {
      Header: "Date & Time",
      Cell: ({ row }: { row: LogRecord }) => (
        <span className="small text-muted fw-medium">
          {row?.createdAt ? new Date(row.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "-"}
        </span>
      ),
    },
    {
      Header: "User / Host Name",
      Cell: ({ row }: { row: LogRecord }) => (
        <div className="d-flex align-items-center gap-2">
          {row?.userId?.image || row?.hostId?.image ? (
            <img
              src={row?.userId?.image || row?.hostId?.image}
              alt=""
              width={28}
              height={28}
              className="rounded-circle object-fit-cover"
            />
          ) : (
            <div className="rounded-circle bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
              <i className="ri-user-line text-secondary" />
            </div>
          )}
          <span className="fw-semibold text-dark">{row?.userId?.name || row?.hostId?.name || "Unknown"}</span>
        </div>
      ),
    },
    {
      Header: "Unique ID",
      Cell: ({ row }: { row: LogRecord }) => (
        <span className="small text-secondary">{row?.userId?.uniqueId || row?.hostId?.uniqueId || "-"}</span>
      ),
    },
    {
      Header: "Account Type",
      Cell: ({ row }: { row: LogRecord }) => (
        <span className={`badge ${row?.personType === "host" ? "bg-danger-subtle text-danger" : "bg-primary-subtle text-primary"}`}>
          {row?.personType?.toUpperCase() || "USER"}
        </span>
      ),
    },
    {
      Header: "Ad Network / Provider",
      Cell: ({ row }: { row: LogRecord }) => renderNetworkBadge(row?.adType),
    },
    {
      Header: "Action",
      Cell: ({ row }: { row: LogRecord }) => (
        <span className="badge bg-light text-dark border">
          {row?.action === "claim" ? "Claimed Coins" : "Watched / Completed"}
        </span>
      ),
    },
    {
      Header: "Points Earned",
      Cell: ({ row }: { row: LogRecord }) => (
        <span className="fw-bold text-success d-flex align-items-center gap-1">
          <Image src={coin} alt="" width={16} height={16} />
          +{formatCoins(row?.coins || 0)} Pts
        </span>
      ),
    },
  ];

  return (
    <div className="card border-0 shadow-sm p-3 pb-4 mb-5 rounded-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
        <div>
          <h6 className="fw-bold mb-1 text-dark">Real-Time Detailed Ad & Survey Watch Logs</h6>
          <p className="text-muted small mb-0">Exact log history of which user watched which ad or survey and earned points</p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <select
            className="form-select form-select-sm border-secondary-subtle fw-semibold"
            style={{ width: "auto", borderRadius: "8px" }}
            value={personType}
            onChange={(e) => {
              setPersonType(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Accounts</option>
            <option value="user">Users Only</option>
            <option value="host">Hosts Only</option>
          </select>

          <select
            className="form-select form-select-sm border-secondary-subtle fw-semibold"
            style={{ width: "auto", borderRadius: "8px" }}
            value={adType}
            onChange={(e) => {
              setAdType(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Networks</option>
            <option value="rewarded">AdMob Ads</option>
            <option value="unity">Unity Ads</option>
            <option value="bitlabs">BitLabs Surveys</option>
            <option value="cpx">CPX Research</option>
            <option value="custom_task">Custom Tasks</option>
          </select>

          <button
            className="btn btn-sm btn-outline-primary shadow-sm"
            style={{ borderRadius: "8px" }}
            onClick={() => fetchLogs()}
            disabled={loading}
          >
            <i className={`ri-refresh-line ${loading ? "spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="table-responsive mb-3">
        <Table data={logs} mapData={logsTableColumns} type="server" />
      </div>

      <div className="pt-2 border-top">
        <Pagination
          type="server"
          serverPage={page}
          setServerPage={setPage}
          serverPerPage={rowsPerPage}
          onPageChange={(_e: any, p: number) => setPage(p)}
          onRowsPerPageChange={(v: string) => {
            setRowsPerPage(parseInt(v, 10));
            setPage(1);
          }}
          totalData={totalLogs}
        />
      </div>
    </div>
  );
};

export default AdsWatchActivityLogs;
