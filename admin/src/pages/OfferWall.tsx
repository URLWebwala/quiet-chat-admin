import React, { useEffect, useState, useRef } from "react";
import RootLayout from "@/component/layout/Layout";
import Button from "@/extra/Button";
import Table from "@/extra/Table";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { setToast } from "@/utils/toastServices";
import CommonDialog from "@/utils/CommonDialog";
import { getImageUrl } from "@/utils/getImageUrl";
import Image from "next/image";

interface OfferWallItem {
  _id: string;
  title: string;
  description?: string;
  image: string;
  buttonText: string;
  actionUrl: string;
  actionType: "link" | "in_app" | "survey" | "custom_task" | "ad_watch";
  durationDays: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isExpired?: boolean;
  daysLeft?: number;
  computedStatus?: "active" | "closed" | "expired";
  impressionCount: number;
  clickCount: number;
  priority: number;
  createdAt: string;
}

interface OfferMetrics {
  totalOffers: number;
  activeOffers: number;
  totalImpressions: number;
  totalClicks: number;
}

const OfferWall = () => {
  const [offers, setOffers] = useState<OfferWallItem[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<OfferWallItem[]>([]);
  const [metrics, setMetrics] = useState<OfferMetrics>({
    totalOffers: 0,
    activeOffers: 0,
    totalImpressions: 0,
    totalClicks: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<OfferWallItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<OfferWallItem | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [buttonText, setButtonText] = useState<string>("START EARNING TODAY!");
  const [actionUrl, setActionUrl] = useState<string>("");
  const [actionType, setActionType] = useState<string>("link");
  const [durationDays, setDurationDays] = useState<number>(7);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [priority, setPriority] = useState<number>(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchOfferWall();
  }, []);

  useEffect(() => {
    filterData();
  }, [offers, searchTerm, statusFilter]);

  // Synchronize end date when startDate or durationDays changes
  const updateEndDateFromDays = (start: string, days: number) => {
    if (!start) return;
    const s = new Date(start);
    const e = new Date(s.getTime() + days * 24 * 60 * 60 * 1000);
    setEndDate(e.toISOString().split("T")[0]);
  };

  const fetchOfferWall = async () => {
    setLoading(true);
    try {
      const res = await apiInstanceFetch.get("api/admin/offerWall/list");
      if (res?.status) {
        setOffers(res.data || []);
        if (res.metrics) {
          setMetrics(res.metrics);
        }
      }
    } catch (err: any) {
      console.error("Error fetching offer wall:", err);
      setToast("error", err?.message || "Failed to load Offer Wall");
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let result = [...offers];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o.title?.toLowerCase().includes(q) ||
          o.description?.toLowerCase().includes(q) ||
          o.actionUrl?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((o) => o.computedStatus === statusFilter);
    }
    setFilteredOffers(result);
  };

  const openCreateModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setEditItem(null);
    setTitle("");
    setDescription("");
    setButtonText("START EARNING TODAY!");
    setActionUrl("");
    setActionType("link");
    setDurationDays(7);
    setStartDate(today);
    updateEndDateFromDays(today, 7);
    setIsActive(true);
    setPriority(1);
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };

  const openEditModal = (item: OfferWallItem) => {
    setEditItem(item);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setButtonText(item.buttonText || "START EARNING TODAY!");
    setActionUrl(item.actionUrl || "");
    setActionType(item.actionType || "link");
    setDurationDays(item.durationDays || 7);
    
    const sDate = item.startDate ? new Date(item.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    const eDate = item.endDate ? new Date(item.endDate).toISOString().split("T")[0] : "";
    setStartDate(sDate);
    setEndDate(eDate);
    setIsActive(item.isActive);
    setPriority(item.priority || 1);
    setImageFile(null);
    setImagePreview(item.image ? (getImageUrl(item.image) || "") : "");
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleDurationPreset = (days: number) => {
    setDurationDays(days);
    updateEndDateFromDays(startDate, days);
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    updateEndDateFromDays(val, durationDays);
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (startDate && val) {
      const s = new Date(startDate);
      const e = new Date(val);
      const diffDays = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
      setDurationDays(diffDays);
    }
  };

  const handleToggleStatus = async (item: OfferWallItem) => {
    try {
      const res = await apiInstanceFetch.patch(`api/admin/offerWall/toggleStatus?offerWallId=${item._id}`, {});
      if (res?.status) {
        setToast("success", res.message || "Status updated");
        fetchOfferWall();
      }
    } catch (err: any) {
      console.error("Error toggling status:", err);
      setToast("error", "Failed to update status");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setToast("error", "Please provide Offer Title");
      return;
    }

    if (!editItem && !imageFile) {
      setToast("error", "Please upload a Banner Image for the Offer Wall");
      return;
    }

    if (!startDate || !endDate) {
      setToast("error", "Please select valid Start & End dates");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("buttonText", buttonText.trim());
      formData.append("actionUrl", actionUrl.trim());
      formData.append("actionType", actionType);
      formData.append("durationDays", String(durationDays));
      formData.append("startDate", new Date(startDate).toISOString());
      formData.append("endDate", new Date(`${endDate}T23:59:59`).toISOString());
      formData.append("isActive", String(isActive));
      formData.append("priority", String(priority));

      if (imageFile) {
        formData.append("image", imageFile);
      }

      let res;
      if (editItem) {
        res = await apiInstanceFetch.patch(`api/admin/offerWall/updateOfferWall?offerWallId=${editItem._id}`, formData);
      } else {
        res = await apiInstanceFetch.post("api/admin/offerWall/addOfferWall", formData);
      }

      if (res?.status) {
        setToast("success", res.message || (editItem ? "Offer updated!" : "Offer created!"));
        setShowModal(false);
        fetchOfferWall();
      } else {
        setToast("error", res?.message || "Failed to save Offer Wall banner");
      }
    } catch (err: any) {
      console.error("Error saving offer:", err);
      setToast("error", err?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await apiInstanceFetch.delete(`api/admin/offerWall/delete?offerWallId=${deleteId}`);
      if (res?.status) {
        setToast("success", res.message || "Offer deleted successfully");
        setDeleteId(null);
        fetchOfferWall();
      }
    } catch (err: any) {
      console.error("Error deleting offer:", err);
      setToast("error", err?.message || "Failed to delete");
    }
  };

  // Table Columns Definition
  const columns = [
    {
      Header: "Banner Preview",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: OfferWallItem }) => {
        const fullImg = getImageUrl(row?.image) || "/images/placeholder.png";
        return (
          <div className="d-flex justify-content-center align-items-center">
            <div
              className="position-relative rounded-3 overflow-hidden shadow-sm border"
              style={{ width: "90px", height: "90px", cursor: "pointer", background: "#f1f5f9" }}
              onClick={() => setPreviewItem(row)}
              title="Click to live preview popup"
            >
              <img
                src={fullImg}
                alt={row?.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e: any) => {
                  e.target.src = "https://placehold.co/100x100?text=Banner";
                }}
              />
              <span
                className="position-absolute bottom-0 end-0 bg-dark text-white px-1 py-0"
                style={{ fontSize: "10px", opacity: 0.85, borderTopLeftRadius: "4px" }}
              >
                <i className="ri-eye-line"></i> View
              </span>
            </div>
          </div>
        );
      },
    },
    {
      Header: "Offer Details",
      thClass: "text-start",
      tdClass: "text-start",
      Cell: ({ row }: { row: OfferWallItem }) => (
        <div style={{ maxWidth: "320px" }}>
          <div className="fw-bold text-dark text-truncate" style={{ fontSize: "14px" }} title={row?.title}>
            {row?.title}
          </div>
          {row?.description && (
            <div className="text-secondary small text-truncate mt-1" style={{ fontSize: "12px" }} title={row?.description}>
              {row?.description}
            </div>
          )}
          {row?.buttonText && (
            <div className="mt-1 d-flex align-items-center gap-1">
              <span className="badge bg-light text-dark border" style={{ fontSize: "11px", borderRadius: "4px" }}>
                Button Text: <strong>{row?.buttonText}</strong>
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      Header: "Display Validity",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: OfferWallItem }) => {
        const startStr = row?.startDate ? new Date(row.startDate).toLocaleDateString() : "-";
        const endStr = row?.endDate ? new Date(row.endDate).toLocaleDateString() : "-";
        const isExp = row?.isExpired;
        return (
          <div className="text-center">
            <div className="small fw-semibold text-dark mb-1">
              📅 {startStr} - {endStr}
            </div>
            {isExp ? (
              <span className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: "11px" }}>
                ⌛ Expired
              </span>
            ) : (
              <span className="badge bg-info-subtle text-info border border-info-subtle" style={{ fontSize: "11px" }}>
                ⏳ {row?.daysLeft ?? row?.durationDays ?? 0} Days Remaining
              </span>
            )}
          </div>
        );
      },
    },
    {
      Header: "Status",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: OfferWallItem }) => {
        return (
          <div className="d-flex flex-column align-items-center gap-1">
            <div className="form-check form-switch p-0 m-0" style={{ minHeight: "auto" }}>
              <input
                className="form-check-input ms-0 cursor-pointer"
                type="checkbox"
                role="switch"
                checked={row?.isActive}
                onChange={() => handleToggleStatus(row)}
                style={{ width: "36px", height: "20px" }}
                title={row?.isActive ? "Click to close/deactivate" : "Click to activate"}
              />
            </div>
            <span
              className={`badge ${
                !row?.isActive
                  ? "bg-secondary text-white"
                  : row?.isExpired
                  ? "bg-warning text-dark"
                  : "bg-success text-white"
              }`}
              style={{ fontSize: "11px", padding: "3px 8px" }}
            >
              {!row?.isActive ? "Closed / Inactive" : row?.isExpired ? "Expired" : "Active 🟢"}
            </span>
          </div>
        );
      },
    },
    {
      Header: "Views & Clicks",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: OfferWallItem }) => {
        const views = row?.impressionCount || 0;
        const clicks = row?.clickCount || 0;
        const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0.0";
        return (
          <div className="text-center">
            <div className="small text-dark fw-bold">
              👁️ {views} <span className="text-muted fw-normal">views</span>
            </div>
            <div className="small text-success fw-bold">
              🎯 {clicks} <span className="text-muted fw-normal">clicks</span>
            </div>
            <small className="text-muted" style={{ fontSize: "10px" }}>
              CTR: {ctr}%
            </small>
          </div>
        );
      },
    },
    {
      Header: "Actions",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: OfferWallItem }) => (
        <div className="d-flex gap-1 justify-content-center align-items-center">
          <button
            className="btn btn-sm btn-outline-info"
            style={{ fontSize: "12px", padding: "4px 8px" }}
            onClick={() => setPreviewItem(row)}
            title="Preview Popup Modal"
          >
            <i className="ri-fullscreen-line"></i> Preview
          </button>
          <button
            className="btn btn-sm btn-outline-primary"
            style={{ fontSize: "12px", padding: "4px 8px" }}
            onClick={() => openEditModal(row)}
            title="Edit Offer"
          >
            <i className="ri-edit-line"></i> Edit
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            style={{ fontSize: "12px", padding: "4px 8px" }}
            onClick={() => setDeleteId(row?._id)}
            title="Delete Offer"
          >
            <i className="ri-delete-bin-line"></i>
          </button>
        </div>
      ),
    },
  ];

  return (
    <RootLayout>
      <div className="mainPage">
        {/* Top Header */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <i className="ri-advertisement-fill text-primary"></i> Offer Wall & Promotional Popup Management
            </h4>
            <p className="text-secondary small mb-0">
              Create and manage promotional popup offer banners for User App & Web App with customizable validity duration & random rotation.
            </p>
          </div>
          <Button
            className="btn btn-primary d-flex align-items-center gap-2"
            text="+ Create New Offer Banner"
            onClick={openCreateModal}
          />
        </div>

        {/* Metric Summary Cards */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small fw-semibold">Total Offers</span>
                  <h3 className="fw-bold text-dark mb-0 mt-1">{metrics.totalOffers}</h3>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center bg-primary-subtle text-primary"
                  style={{ width: "48px", height: "48px", fontSize: "22px" }}
                >
                  <i className="ri-gift-2-line"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small fw-semibold">Active Offers</span>
                  <h3 className="fw-bold text-success mb-0 mt-1">{metrics.activeOffers}</h3>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center bg-success-subtle text-success"
                  style={{ width: "48px", height: "48px", fontSize: "22px" }}
                >
                  <i className="ri-checkbox-circle-line"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small fw-semibold">Total Views / Shows</span>
                  <h3 className="fw-bold text-info mb-0 mt-1">{metrics.totalImpressions}</h3>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center bg-info-subtle text-info"
                  style={{ width: "48px", height: "48px", fontSize: "22px" }}
                >
                  <i className="ri-eye-line"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small fw-semibold">Total Clicks</span>
                  <h3 className="fw-bold text-warning mb-0 mt-1">{metrics.totalClicks}</h3>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center bg-warning-subtle text-warning"
                  style={{ width: "48px", height: "48px", fontSize: "22px" }}
                >
                  <i className="ri-cursor-line"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar Row (Clean, No extra card background) */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select offer-filter-select"
              style={{ width: "auto", minWidth: "160px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses ({offers.length})</option>
              <option value="active">Active Only</option>
              <option value="closed">Closed / Inactive</option>
              <option value="expired">Expired</option>
            </select>

            <button
              className="offer-refresh-btn"
              onClick={fetchOfferWall}
              title="Refresh Offers"
            >
              <i className="ri-refresh-line"></i>
            </button>
          </div>

          <div
            className="d-flex align-items-center"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #8F6DFF40",
              borderRadius: "8px",
              overflow: "hidden",
              height: "44px",
              width: "100%",
              maxWidth: "320px",
            }}
          >
            <input
              type="search"
              className="flex-grow-1 border-0 bg-transparent px-3"
              style={{
                height: "100%",
                fontSize: "14px",
                color: "#1e293b",
                outline: "none",
              }}
              placeholder="Search offers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") filterData();
              }}
            />
            {searchTerm && (
              <button
                className="btn btn-sm btn-link text-muted p-0 me-2 text-decoration-none"
                type="button"
                onClick={() => setSearchTerm("")}
              >
                <i className="ri-close-line fs-5"></i>
              </button>
            )}
            <div
              className="d-flex align-items-center justify-content-center cursor-pointer"
              style={{
                width: "44px",
                height: "100%",
                backgroundColor: "#8F6DFF",
                color: "#ffffff",
                flexShrink: 0,
              }}
              onClick={() => filterData()}
              title="Search"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.5 9C20.6421 9 24 12.3579 24 16.5M24.9882 24.9823L31.5 31.5M28.5 16.5C28.5 23.1275 23.1275 28.5 16.5 28.5C9.87258 28.5 4.5 23.1275 4.5 16.5C4.5 9.87258 9.87258 4.5 16.5 4.5C23.1275 4.5 28.5 9.87258 28.5 16.5Z"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Offer Wall Table */}
        <div className="card shadow-sm border-0 rounded-3">
          <div className="card-body p-0">
            {loading ? (
              <div className="p-5 text-center text-muted">
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <div>Loading Offer Wall banners...</div>
              </div>
            ) : filteredOffers.length === 0 ? (
              <div className="p-5 text-center">
                <i className="ri-advertisement-line fs-1 text-secondary mb-2 d-block"></i>
                <h5 className="fw-bold text-dark mb-1">No Offers Found</h5>
                <p className="text-muted small mb-3">Create your first offer wall banner to display promotional popups to users.</p>
                <button className="btn btn-primary offer-sq-btn px-3" onClick={openCreateModal}>
                  + Create Offer Banner
                </button>
              </div>
            ) : (
              <Table data={filteredOffers} mapData={columns} type="server" />
            )}
          </div>
        </div>
      </div>

      {/* ===================== ADD / EDIT OFFER MODAL ===================== */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "680px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
              overflow: "hidden",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom bg-light">
              <div>
                <h5 className="fw-bold text-dark mb-0">
                  {editItem ? "✏️ Edit Offer Wall Banner" : "✨ Create New Offer Wall Banner"}
                </h5>
                <small className="text-secondary">Fill in details and duration to show this popup banner in apps.</small>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModal(false)}
              ></button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="p-4" style={{ overflowY: "auto", flex: 1 }}>
                <div className="row g-3">
                  {/* Image Upload Area */}
                  <div className="col-12">
                    <label className="form-label small text-dark fw-bold mb-1 d-flex justify-content-between">
                      <span>Banner Image <span className="text-danger">*</span></span>
                      <span className="text-muted fw-normal">Recommended: 600x600 or 800x800 px</span>
                    </label>
                    <div
                      className="offer-upload-box text-center position-relative cursor-pointer"
                      style={{
                        backgroundColor: "#f8fafc",
                        border: `2px dashed ${imagePreview ? "#3b82f6" : "#cbd5e1"}`,
                        borderRadius: "8px",
                        padding: "20px",
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="d-none"
                        onChange={handleImageChange}
                      />
                      {imagePreview ? (
                        <div className="d-flex flex-column align-items-center justify-content-center">
                          <img
                            src={imagePreview}
                            alt="Banner Preview"
                            style={{
                              maxWidth: "200px",
                              maxHeight: "200px",
                              objectFit: "contain",
                              borderRadius: "6px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary mt-2 offer-sq-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                          >
                            <i className="ri-image-edit-line me-1"></i> Change Image
                          </button>
                        </div>
                      ) : (
                        <div className="py-3">
                          <i className="ri-upload-cloud-2-line fs-2 text-primary mb-2 d-block"></i>
                          <div className="fw-semibold text-dark">Click to upload or drag & drop banner image</div>
                          <small className="text-muted">Supports PNG, JPG, WEBP, GIF</small>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="col-md-12">
                    <label className="form-label small text-dark fw-bold mb-1">
                      Offer Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control offer-sq-input"
                      placeholder="e.g. CPA LEADS - Complete Surveys & Earn Points"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-12">
                    <label className="form-label small text-dark fw-bold mb-1">
                      Offer Description / Highlights (Optional)
                    </label>
                    <textarea
                      className="form-control offer-sq-input"
                      rows={2}
                      placeholder="e.g. Earn up to 100,000+ Points instantly! Start now to unlock rewards."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>

                  {/* Button CTA Text */}
                  <div className="col-md-12">
                    <label className="form-label small text-dark fw-bold mb-1">
                      Button CTA Text (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-control offer-sq-input"
                      placeholder="e.g. START EARNING TODAY!"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                    />
                  </div>

                  {/* Duration Presets & Dates */}
                  <div className="col-12">
                    <label className="form-label small text-dark fw-bold mb-1 d-flex justify-content-between">
                      <span>Display Duration & Validity (Kitne din tak dikhana hai)</span>
                      <span className="badge bg-primary text-white" style={{ borderRadius: "4px", padding: "4px 8px" }}>
                        {durationDays} Days Active
                      </span>
                    </label>

                    {/* Quick Presets */}
                    <div className="d-flex gap-2 flex-wrap mb-2">
                      {[1, 3, 7, 15, 30].map((d) => (
                        <button
                          key={d}
                          type="button"
                          className={`offer-duration-pill ${durationDays === d ? "active" : ""}`}
                          onClick={() => handleDurationPreset(d)}
                        >
                          {d} {d === 1 ? "Day" : "Days"}
                        </button>
                      ))}
                    </div>

                    <div className="row g-2">
                      <div className="col-6">
                        <small className="text-muted d-block mb-1">Start Date</small>
                        <input
                          type="date"
                          className="form-control offer-sq-input"
                          value={startDate}
                          onChange={(e) => handleStartDateChange(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block mb-1">End Date (Auto calculated)</small>
                        <input
                          type="date"
                          className="form-control offer-sq-input"
                          value={endDate}
                          onChange={(e) => handleEndDateChange(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Switch */}
                  <div className="col-12 pt-2">
                    <div className="form-check form-switch d-flex align-items-center gap-2 p-0">
                      <input
                        className="form-check-input ms-0 cursor-pointer"
                        type="checkbox"
                        id="modalActiveSwitch"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        style={{ width: "38px", height: "20px" }}
                      />
                      <label className="form-check-label small fw-bold text-dark cursor-pointer mb-0" htmlFor="modalActiveSwitch">
                        Active Status (Check to display to users immediately)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="d-flex justify-content-end gap-2 px-4 py-3 border-top bg-light">
                <button
                  type="button"
                  className="offer-cancel-btn"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="offer-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Saving...
                    </>
                  ) : editItem ? (
                    "Update Offer Banner"
                  ) : (
                    "Publish Offer Banner"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== LIVE POPUP SIMULATION MODAL ===================== */}
      {previewItem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(10, 15, 29, 0.82)",
            backdropFilter: "blur(6px)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setPreviewItem(null)}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "380px",
              animation: "popupFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button on Top Right (Exact match with user design) */}
            <button
              onClick={() => setPreviewItem(null)}
              style={{
                position: "absolute",
                top: "-18px",
                right: "-8px",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 10,
                color: "#1e293b",
                fontSize: "20px",
                fontWeight: "bold",
              }}
              title="Close Popup"
            >
              <i className="ri-close-line"></i>
            </button>

            {/* Popup Card matching user's design */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                padding: "8px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                overflow: "hidden",
                border: "4px solid #ffffff",
              }}
            >
              <div
                style={{
                  borderRadius: "18px",
                  overflow: "hidden",
                  backgroundColor: "#f8fafc",
                }}
              >
                {/* Banner Image */}
                <img
                  src={getImageUrl(previewItem.image) || "https://placehold.co/400x400?text=Offer+Banner"}
                  alt={previewItem.title}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    borderRadius: "16px",
                  }}
                />
              </div>

              {/* Action Button & Live Info Bar */}
              <div className="p-3 text-center">
                {previewItem.actionUrl && (
                  <a
                    href={previewItem.actionUrl.startsWith("http") ? previewItem.actionUrl : `https://${previewItem.actionUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn w-100 fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                    style={{
                      background: "linear-gradient(135deg, #ffb703 0%, #fb8500 100%)",
                      color: "#0f172a",
                      borderRadius: "9999px",
                      fontSize: "14px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <i className="ri-play-fill fs-5"></i>
                    {previewItem.buttonText || "START EARNING TODAY!"}
                  </a>
                )}
                <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                  💡 Live Preview Simulator (This is how users will see it in the app)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <CommonDialog
          open={!!deleteId}
          onCancel={() => setDeleteId(null)}
          onConfirm={handleDelete}
          text={"Delete Offer Banner"}
        />
      )}

      <style jsx global>{`
        @keyframes popupFadeIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Square Form Controls for OfferWall */
        .offer-sq-input {
          border-radius: 6px !important;
          border: 1px solid #d1d5db !important;
          padding: 8px 12px !important;
          font-size: 14px !important;
          background-color: #ffffff !important;
          color: #1e293b !important;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out !important;
        }

        .offer-sq-input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
          outline: none !important;
        }

        /* Duration Pills with High-Contrast Hover */
        .offer-duration-pill {
          border-radius: 6px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          padding: 6px 14px !important;
          border: 1px solid #cbd5e1 !important;
          background-color: #f8fafc !important;
          color: #1e293b !important;
          cursor: pointer !important;
          transition: all 0.15s ease-in-out !important;
          user-select: none !important;
        }

        .offer-duration-pill:hover {
          background-color: #e2e8f0 !important;
          color: #0f172a !important;
          border-color: #94a3b8 !important;
        }

        .offer-duration-pill.active {
          background-color: #3b82f6 !important;
          color: #ffffff !important;
          border-color: #2563eb !important;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4) !important;
        }

        .offer-duration-pill.active:hover {
          background-color: #2563eb !important;
          color: #ffffff !important;
          border-color: #1d4ed8 !important;
        }

        /* Modal Buttons with High-Contrast Hover */
        .offer-cancel-btn {
          border-radius: 6px !important;
          font-weight: 500 !important;
          background-color: #ffffff !important;
          color: #334155 !important;
          border: 1px solid #cbd5e1 !important;
          padding: 8px 22px !important;
          font-size: 14px !important;
          cursor: pointer !important;
          transition: all 0.15s ease-in-out !important;
        }

        .offer-cancel-btn:hover {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
          border-color: #94a3b8 !important;
        }

        .offer-submit-btn {
          border-radius: 6px !important;
          font-weight: 600 !important;
          background-color: #3b82f6 !important;
          color: #ffffff !important;
          border: 1px solid #2563eb !important;
          padding: 8px 24px !important;
          font-size: 14px !important;
          cursor: pointer !important;
          transition: all 0.15s ease-in-out !important;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3) !important;
        }

        /* Search Bar & Filter Controls (Square & Seamless) */
        .offer-search-wrap {
          display: flex;
          align-items: center;
          background-color: #f8fafc;
          border: 1px solid #d1d5db;
          border-radius: 6px !important;
          padding: 0 12px;
          height: 42px;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out, background-color 0.15s;
        }

        .offer-search-wrap:focus-within {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
          background-color: #ffffff !important;
        }

        .offer-search-input {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          padding: 6px 8px !important;
          font-size: 14px !important;
          color: #1e293b !important;
          flex: 1;
          outline: none !important;
          border-radius: 0 !important;
        }

        .offer-search-input::placeholder {
          color: #94a3b8 !important;
        }

        .offer-filter-select {
          border: 1px solid #8F6DFF40 !important;
          border-radius: 8px !important;
          background-color: #ffffff !important;
          height: 44px !important;
          font-size: 14px !important;
          padding: 8px 12px !important;
          color: #1e293b !important;
          transition: border-color 0.15s, box-shadow 0.15s !important;
        }

        .offer-filter-select:focus {
          border-color: #8F6DFF !important;
          box-shadow: 0 0 0 3px rgba(143, 109, 255, 0.2) !important;
          outline: none !important;
          background-color: #ffffff !important;
        }

        .offer-refresh-btn {
          border: 1px solid #8F6DFF40 !important;
          border-radius: 8px !important;
          background-color: #ffffff !important;
          color: #8F6DFF !important;
          min-width: 44px !important;
          height: 44px !important;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: pointer !important;
          transition: all 0.15s ease-in-out !important;
        }

        .offer-refresh-btn:hover {
          background-color: #8F6DFF !important;
          color: #ffffff !important;
          border-color: #8F6DFF !important;
        }
      `}</style>
    </RootLayout>
  );
};

export default OfferWall;
