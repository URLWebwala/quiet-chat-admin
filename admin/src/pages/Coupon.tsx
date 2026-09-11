import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Button from "@/extra/Button";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import ToggleSwitch from "@/extra/TogggleSwitch";
import CommonDialog from "@/utils/CommonDialog";
import CouponDialog from "@/component/coupon/CouponDialog";
import Searching from "@/extra/Searching";
import { useAppDispatch } from "@/store/store";
import { useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import { openDialog } from "@/store/dialogSlice";
import {
  deleteCoupon,
  getCoupons,
  toggleCouponStatus,
  getCouponRedemptions,
  getAllCouponClaims,
} from "@/store/couponSlice";
import coinImg from "@/assets/images/coin.png";
import bannerImage from "@/assets/images/bannerImage.png";
import TrashIcon from "@/assets/images/delete.svg";
import EditIcon from "@/assets/images/edit.svg";
import { Success } from "@/api/toastServices";
import male from "@/assets/images/male.png";
import { baseURL } from "@/utils/config";

const CouponPage = () => {
  const dispatch = useAppDispatch();
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);
  const { coupons, total, redemptions, allClaims, totalClaims } = useSelector(
    (state: any) => state.coupon
  );

  const [activeTab, setActiveTab] = useState<"coupon" | "history">("coupon");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Redemptions History Dialog for single coupon
  const [showRedemptionsModal, setShowRedemptionsModal] = useState(false);
  const [selectedCouponForRedemptions, setSelectedCouponForRedemptions] = useState<any>(null);

  useEffect(() => {
    if (activeTab === "coupon") {
      dispatch(getCoupons({ start: page, limit: rowsPerPage, search }));
    } else {
      dispatch(getAllCouponClaims({ start: page, limit: rowsPerPage, search }));
    }
  }, [dispatch, activeTab, page, rowsPerPage, search]);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  const handleDelete = (id: string) => {
    setSelectedId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedId) {
      dispatch(deleteCoupon(selectedId));
      setShowDeleteDialog(false);
      setSelectedId(null);
    }
  };

  const handleOpenRedemptions = (coupon: any) => {
    setSelectedCouponForRedemptions(coupon);
    dispatch(getCouponRedemptions({ couponId: coupon._id, start: 1, limit: 50 }));
    setShowRedemptionsModal(true);
  };

  const copyText = (text: string) => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      Success("User ID Copied!");
    }
  };

  const getUserImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath || typeof imagePath !== "string" || !imagePath.trim()) {
      return male.src;
    }
    const clean = imagePath.replace(/\\/g, "/").trim();
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      return clean;
    }
    const base = baseURL.endsWith("/") ? baseURL : `${baseURL}/`;
    const path = clean.startsWith("/") ? clean.slice(1) : clean;
    return `${base}${path}`;
  };

  // Coupons Table Columns
  const couponTable = [
    {
      Header: "No",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ index }: { index: any }) => (
        <span className="fw-medium text-secondary">
          {(page - 1) * rowsPerPage + parseInt(index) + 1}
        </span>
      ),
    },
    {
      Header: "Coupon Code",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex justify-content-center">
          <span
            className="badge px-3 py-2 fw-bold font-monospace"
            style={{
              backgroundColor: "#EFF6FF",
              color: "#2563EB",
              border: "1px dashed #93C5FD",
              letterSpacing: "1px",
              fontSize: "13px",
            }}
          >
            {row?.code}
          </span>
        </div>
      ),
    },
    {
      Header: "Description",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex justify-content-center">
          <span className="text-secondary small">{row?.title || "-"}</span>
        </div>
      ),
    },
    {
      Header: "Reward Coins",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex align-items-center justify-content-center gap-1">
          <img src={coinImg.src} height={20} width={20} alt="coin" />
          <span className="fw-bold" style={{ color: "#D97706" }}>
            {row?.coin?.toLocaleString() || 0}
          </span>
        </div>
      ),
    },
    {
      Header: "Expiry Date",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => {
        if (!row?.expiryDate) {
          return (
            <div className="d-flex justify-content-center">
              <span className="text-muted small">No Expiry</span>
            </div>
          );
        }
        const exp = new Date(row.expiryDate);
        const isExpired = exp < new Date();
        return (
          <div className="d-flex justify-content-center">
            <span
              className={`badge ${
                isExpired
                  ? "bg-danger-subtle text-danger border border-danger-subtle"
                  : "bg-success-subtle text-success border border-success-subtle"
              }`}
            >
              {exp.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
              {isExpired ? " (Expired)" : ""}
            </span>
          </div>
        );
      },
    },
    {
      Header: "Per-User Limit",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex justify-content-center">
          {row?.isPerUserLimit ? (
            <span className="badge bg-info-subtle text-info border border-info-subtle">
              1 per user
            </span>
          ) : (
            <span className="badge bg-light text-secondary border">Multiple</span>
          )}
        </div>
      ),
    },
    {
      Header: "Claims",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex justify-content-center">
          <span
            className="badge px-2 py-1 cursor-pointer"
            style={{
              backgroundColor: "#FFF8E7",
              color: "#D97706",
              border: "1px solid #FDE68A",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "12px",
            }}
            onClick={() => handleOpenRedemptions(row)}
            title="Click to view claimed users"
          >
            <i className="ri-user-shared-line me-1"></i>
            {row?.totalRedeemed || 0}
            {row?.maxUsers > 0 ? ` / ${row.maxUsers}` : " (Unlimited)"}
          </span>
        </div>
      ),
    },
    {
      Header: "Active",
      body: "isActive",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex justify-content-center">
          <ToggleSwitch
            value={row?.isActive}
            onClick={() => {
              dispatch(toggleCouponStatus({ couponId: row._id }));
            }}
          />
        </div>
      ),
    },
    {
      Header: "Action",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex justify-content-center">
          <button
            type="button"
            className="custom-action-btn me-2"
            onClick={() => {
              dispatch(openDialog({ type: "coupon", data: row }));
            }}
          >
            <img src={EditIcon.src} alt="Edit" width={20} height={20} />
          </button>
          <button
            type="button"
            className="custom-action-btn"
            onClick={() => handleDelete(row?._id)}
          >
            <img src={TrashIcon.src} alt="Delete" width={20} height={20} />
          </button>
        </div>
      ),
    },
  ];

  // All Claim History Table Columns
  const claimHistoryTable = [
    {
      Header: "No",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ index }: { index: any }) => (
        <span className="fw-medium text-secondary">
          {(page - 1) * rowsPerPage + parseInt(index) + 1}
        </span>
      ),
    },
    {
      Header: "User",
      thClass: "text-start ps-4",
      tdClass: "text-start ps-4",
      Cell: ({ row }: { row: any }) => {
        return (
          <div className="d-flex align-items-center gap-2">
            <img
              src={getUserImageUrl(row?.user?.image)}
              alt=""
              onError={(e: any) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = male.src;
              }}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid #e5e7eb",
              }}
            />
            <div className="text-start">
              <span className="fw-semibold text-dark d-block" style={{ fontSize: "13.5px" }}>
                {row?.user?.name || "Anonymous User"}
              </span>
              {row?.user?.mobileNumber && (
                <span className="text-muted small">{row?.user?.mobileNumber}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      Header: "User ID",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => {
        const uid = row?.user?.uniqueId || row?.user?._id?.toString()?.slice(-6) || "-";
        return (
          <div className="d-flex justify-content-center align-items-center">
            <span
              className="font-monospace small text-secondary cursor-pointer"
              title="Click to copy"
              onClick={() => copyText(uid)}
            >
              {uid} <i className="ri-file-copy-line text-muted ms-1"></i>
            </span>
          </div>
        );
      },
    },
    {
      Header: "Coupon Code",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex justify-content-center">
          <span
            className="badge px-3 py-1 fw-bold font-monospace"
            style={{
              backgroundColor: "#EFF6FF",
              color: "#2563EB",
              border: "1px dashed #93C5FD",
              letterSpacing: "1px",
              fontSize: "12px",
            }}
          >
            {row?.couponCode}
          </span>
        </div>
      ),
    },
    {
      Header: "Coins Added",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex align-items-center justify-content-center gap-1">
          <img src={coinImg.src} height={18} width={18} alt="coin" />
          <span className="fw-bold" style={{ color: "#16A34A" }}>
            +{row?.coin?.toLocaleString() || 0}
          </span>
        </div>
      ),
    },
    {
      Header: "Redeemed Date & Time",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex justify-content-center">
          <span className="small text-secondary">
            {row?.redeemedAt
              ? new Date(row.redeemedAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : "-"}
          </span>
        </div>
      ),
    },
  ];

  return (
    <>
      {dialogueType === "coupon" && <CouponDialog />}

      <div className="userTable">
        {/* Header with Title, Perfectly Aligned Pill Tabs, Search & Action Button */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap" style={{ gap: "16px" }}>
          {/* Left: Title + Pill Tabs */}
          <div className="d-flex align-items-center" style={{ gap: "24px" }}>
            <div
              className="text-capitalize fs-20"
              style={{ color: "#404040", fontWeight: 600, whiteSpace: "nowrap", margin: 0 }}
            >
              Coupon Code
            </div>

            {/* Clean Pill Toggle Tabs */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "#F3F4F6",
                borderRadius: "12px",
                padding: "4px",
                gap: "4px",
                border: "1px solid #E5E7EB",
              }}
            >
              <button
                type="button"
                style={{
                  border: "none",
                  borderRadius: "9px",
                  padding: "7px 18px",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor: activeTab === "coupon" ? "#9f5aff" : "transparent",
                  color: activeTab === "coupon" ? "#ffffff" : "#6B7280",
                  boxShadow: activeTab === "coupon" ? "0 2px 6px rgba(159, 90, 255, 0.35)" : "none",
                }}
                onClick={() => {
                  setActiveTab("coupon");
                  setPage(1);
                  setSearch("");
                }}
              >
                Coupons
              </button>
              <button
                type="button"
                style={{
                  border: "none",
                  borderRadius: "9px",
                  padding: "7px 18px",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor: activeTab === "history" ? "#9f5aff" : "transparent",
                  color: activeTab === "history" ? "#ffffff" : "#6B7280",
                  boxShadow: activeTab === "history" ? "0 2px 6px rgba(159, 90, 255, 0.35)" : "none",
                }}
                onClick={() => {
                  setActiveTab("history");
                  setPage(1);
                  setSearch("");
                }}
              >
                Claim History
              </button>
            </div>
          </div>

          {/* Right: Search & Create Button */}
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: "280px" }}>
              <Searching
                type="server"
                serverSearching={(val: string) => {
                  setSearch(val);
                  setPage(1);
                }}
                placeholder={
                  activeTab === "coupon"
                    ? "Search Code or Title..."
                    : "Search User / Code..."
                }
              />
            </div>
            {activeTab === "coupon" && (
              <div className="betBox">
                <Button
                  className="bg-button p-10 text-white"
                  bIcon={bannerImage}
                  text="Create Coupon"
                  onClick={() => {
                    dispatch(openDialog({ type: "coupon" }));
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="mainTable custom-table">
          {activeTab === "coupon" ? (
            <>
              <Table
                data={coupons}
                mapData={couponTable}
                PerPage={rowsPerPage}
                Page={page}
                type="server"
              />
              <Pagination
                type="server"
                serverPage={page}
                setServerPage={setPage}
                serverPerPage={rowsPerPage}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                totalData={total}
              />
            </>
          ) : (
            <>
              <Table
                data={allClaims}
                mapData={claimHistoryTable}
                PerPage={rowsPerPage}
                Page={page}
                type="server"
              />
              <Pagination
                type="server"
                serverPage={page}
                setServerPage={setPage}
                serverPerPage={rowsPerPage}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                totalData={totalClaims}
              />
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <CommonDialog
          open={showDeleteDialog}
          onCancel={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          text="Delete"
        />
      )}

      {/* Single Coupon Redemptions Modal */}
      {showRedemptionsModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: "16px" }}>
              <div className="modal-header">
                <h5
                  className="modal-title d-flex align-items-center gap-2 fw-bold"
                  style={{ color: "#404040" }}
                >
                  <i className="ri-user-shared-line text-warning"></i>
                  Redemption History:{" "}
                  <span
                    className="badge font-monospace px-2 py-1"
                    style={{
                      backgroundColor: "#EFF6FF",
                      color: "#2563EB",
                      border: "1px dashed #93C5FD",
                    }}
                  >
                    {selectedCouponForRedemptions?.code}
                  </span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRedemptionsModal(false)}
                ></button>
              </div>
              <div className="modal-body p-0" style={{ maxHeight: "420px", overflowY: "auto" }}>
                {redemptions && redemptions.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="text-center">#</th>
                          <th className="text-start ps-3">User</th>
                          <th className="text-center">User ID</th>
                          <th className="text-center">Coins Claimed</th>
                          <th className="text-center">Redeemed At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {redemptions.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="text-center">{idx + 1}</td>
                            <td className="text-start ps-3">
                              <div className="d-flex align-items-center gap-2">
                                <img
                                  src={getUserImageUrl(item.userId?.image)}
                                  alt=""
                                  onError={(e: any) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = male.src;
                                  }}
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "1px solid #e5e7eb",
                                  }}
                                />
                                <div className="text-start">
                                  <span className="fw-medium text-dark d-block" style={{ fontSize: "13px" }}>
                                    {item.userId?.name || "User"}
                                  </span>
                                  {item.userId?.mobileNumber && (
                                    <span className="text-muted" style={{ fontSize: "11px" }}>
                                      {item.userId?.mobileNumber}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="text-center font-monospace small text-secondary">
                              <span
                                className="cursor-pointer"
                                title="Click to copy"
                                onClick={() => copyText(item.userId?.uniqueId || item.userId?._id?.toString()?.slice(-6) || "-")}
                              >
                                {item.userId?.uniqueId || item.userId?._id?.toString()?.slice(-6) || "-"}
                              </span>
                            </td>
                            <td className="text-center fw-bold" style={{ color: "#16A34A" }}>
                              +{item.coin || selectedCouponForRedemptions?.coin || 0}
                            </td>
                            <td className="text-center small text-secondary">
                              {item.redeemedAt
                                ? new Date(item.redeemedAt).toLocaleString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5 text-secondary">
                    <i className="ri-inbox-line fs-1 d-block mb-2 text-muted"></i>
                    <p className="mb-0">No user has claimed this coupon code yet.</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowRedemptionsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

CouponPage.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default CouponPage;
