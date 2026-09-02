import React, { useEffect, useMemo, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import ToggleSwitch from "@/extra/TogggleSwitch";
import CustomSelect from "@/extra/CustomSelect";
import Searching from "@/extra/Searching";
import {
  AiExpert,
  fetchAiExperts,
  deleteAiExpert,
  updateAiExpert,
  fetchExpertImportPrompt,
  importAiExperts,
} from "@/utils/aiChatApi";
import info from "@/assets/images/info.svg";
import EditIcon from "@/assets/images/edit.svg";
import TrashIcon from "@/assets/images/delete.svg";
import Image from "next/image";
import female from "@/assets/images/female.png";
import male from "@/assets/images/male.png";
import userIcon from "@/assets/images/user.png";
import {
  FaUserGraduate,
  FaPlus,
  FaFileDownload,
  FaFileUpload,
  FaRobot,
  FaComments,
  FaCopy,
  FaCheck,
  FaSearch,
  FaArrowLeft,
  FaExternalLinkAlt,
} from "react-icons/fa";

const GENDER_FILTERS = [
  { key: "", label: "All Genders" },
  { key: "female", label: "Women" },
  { key: "male", label: "Men" },
];

const AiExperts = () => {
  const router = useRouter();
  const [experts, setExperts] = useState<AiExpert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Modals
  const [selectedExpert, setSelectedExpert] = useState<AiExpert | null>(null);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [promptText, setPromptText] = useState<string>("");
  const [importing, setImporting] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedModalPrompt, setCopiedModalPrompt] = useState<boolean>(false);

  const loadExperts = async () => {
    setLoading(true);
    try {
      const data = await fetchAiExperts(genderFilter || undefined);
      setExperts(data);
    } catch (err) {
      console.error("Failed to load experts:", err);
      toast.error("Failed to load AI Experts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperts();
  }, [genderFilter]);

  const categories = useMemo(() => {
    return Array.from(new Set(experts.map((e) => e.category).filter(Boolean))).sort();
  }, [experts]);

  const femaleCount = useMemo(() => {
    return experts.filter((e) => e.gender?.toLowerCase() === "female").length;
  }, [experts]);

  const maleCount = useMemo(() => {
    return experts.filter((e) => e.gender?.toLowerCase() === "male").length;
  }, [experts]);

  const totalChatUsers = useMemo(() => {
    return experts.reduce(
      (sum, e) => sum + ((e.totalUsers ?? e.connected_users) || 0),
      0
    );
  }, [experts]);

  const mostInteractiveExpert = useMemo(() => {
    if (!experts.length) return null;
    return (
      [...experts].sort(
        (a, b) =>
          ((b.totalUsers ?? b.connected_users ?? 0) + (b.totalMessages ?? 0)) -
          ((a.totalUsers ?? a.connected_users ?? 0) + (a.totalMessages ?? 0))
      )[0] || experts[0]
    );
  }, [experts]);

  const filteredExperts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = experts;

    if (q) {
      list = list.filter((e) => {
        const text = [
          e.name,
          e.surname,
          e.category,
          e.specialty,
          e.tagline,
          e.occupation,
          e.home_place,
          e.language,
          e.id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(q);
      });
    }

    if (categoryFilter) {
      list = list.filter((e) => e.category === categoryFilter);
    }

    return list.sort(
      (a, b) =>
        (a.category || "").localeCompare(b.category || "") ||
        (a.name || "").localeCompare(b.name || "")
    );
  }, [experts, searchQuery, categoryFilter]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredExperts.slice(start, start + rowsPerPage);
  }, [filteredExperts, page, rowsPerPage]);

  const handleToggleStatus = async (expert: AiExpert) => {
    const newStatus = expert.is_active === false;
    try {
      setExperts((prev) =>
        prev.map((e) => (e.id === expert.id ? { ...e, is_active: newStatus } : e))
      );
      await updateAiExpert(expert.id, { ...expert, is_active: newStatus });
      toast.success(`${expert.name} is now ${newStatus ? "Active" : "Disabled"}`);
    } catch (err) {
      toast.error("Failed to update status");
      loadExperts();
    }
  };

  const handleInfo = (expert: AiExpert) => {
    setSelectedExpert(expert);
    setShowInfoModal(true);
  };

  const handleDelete = async (expert: AiExpert) => {
    if (!window.confirm(`Are you sure you want to delete "${expert.name} ${expert.surname || ""}"?`)) return;
    try {
      const ok = await deleteAiExpert(expert.id);
      if (ok) {
        toast.success(`Deleted expert ${expert.name}`);
        loadExperts();
      } else {
        toast.error("Failed to delete expert");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete expert");
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const allExperts = await fetchAiExperts();
      const blob = new Blob([JSON.stringify(allExperts, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai_experts_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("AI Experts exported successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to export experts");
    } finally {
      setExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importJsonText.trim()) {
      toast.error("Please paste JSON or upload a .json file");
      return;
    }

    setImporting(true);
    try {
      const result = await importAiExperts(importJsonText.trim());
      toast.success(
        result?.message || `Successfully imported ${result?.imported ?? ""} AI experts!`
      );
      setShowImportModal(false);
      setImportJsonText("");
      loadExperts();
    } catch (err: any) {
      console.error("Import error:", err);
      const errorDetail =
        typeof err === "string"
          ? err
          : err?.detail
          ? JSON.stringify(err.detail)
          : err?.message || "Import failed. Please verify JSON schema.";
      toast.error(errorDetail);
    } finally {
      setImporting(false);
    }
  };

  const handleOpenPrompt = async () => {
    setShowPromptModal(true);
    setCopiedPrompt(false);
    try {
      const text = await fetchExpertImportPrompt();
      setPromptText(text || "No prompt template returned from server.");
    } catch (err) {
      setPromptText("Failed to load Expert Prompt Brief.");
    }
  };

  const handleCopyPrompt = () => {
    if (!promptText) return;
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    toast.success("Expert prompt brief copied to clipboard!");
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleCopyModalPrompt = () => {
    if (!selectedExpert?.prompt) return;
    navigator.clipboard.writeText(selectedExpert.prompt);
    setCopiedModalPrompt(true);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopiedModalPrompt(false), 2000);
  };

  // Define Table Columns matching FakeHost.tsx 100%
  const expertTableMap = [
    {
      Header: "No",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ index }: { index: any }) => (
        <span className="fw-semibold text-muted">
          {(page - 1) * rowsPerPage + index + 1}
        </span>
      ),
    },

    {
      Header: "Unique Id",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <span
          className="fw-bold cursor-pointer"
          style={{ color: "#3B82F6", fontSize: "13px" }}
          onClick={() => handleInfo(row)}
          title="Click to view details"
        >
          {row?.id ? (row.id.length > 8 ? row.id.slice(-8) : row.id) : "-"}
        </span>
      ),
    },

    {
      Header: "Expert",
      thClass: "text-start",
      tdClass: "text-start",
      Cell: ({ row }: { row: any }) => {
        const isFemale = row?.gender === "female";
        return (
          <div className="d-flex align-items-center">
            <div
              className="d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
              style={{
                borderRadius: "50px",
                height: "40px",
                width: "40px",
                backgroundColor: isFemale ? "#EC4899" : "#8F6DFF",
                fontSize: "15px",
                flexShrink: 0,
              }}
            >
              {row?.name ? row.name.slice(0, 1).toUpperCase() : "E"}
            </div>
            <div className="d-flex flex-column justify-content-center text-start ms-2">
              <span className="mb-0 text-sm fw-semibold text-capitalize text-dark">
                {row?.name} {row?.surname || ""}
              </span>
              <span className="text-muted" style={{ fontSize: "11.5px" }}>
                {row?.age ? `${row.age} yrs • ` : ""}
                {row?.home_place || "India"}
              </span>
            </div>
          </div>
        );
      },
    },

    {
      Header: "Gender",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-normal">{row?.gender || "-"}</span>
      ),
    },

    {
      Header: "Connected Users",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => {
        const totalUsers = row?.totalUsers ?? row?.connected_users ?? 0;
        const regularUsers = row?.regularUsers ?? row?.regular_users ?? 0;
        return (
          <div className="d-flex flex-column align-items-center justify-content-center py-1">
            <span
              className="fw-bold text-dark d-inline-flex align-items-center gap-1"
              style={{ fontSize: "14px", letterSpacing: "0.2px" }}
            >
              <i className="ri-user-smile-fill text-primary" style={{ fontSize: "16px" }}></i>
              <span>{totalUsers} {totalUsers === 1 ? "User" : "Users"}</span>
            </span>
            <span
              className="badge rounded-pill mt-1 d-inline-flex align-items-center gap-1"
              style={{
                backgroundColor: regularUsers > 0 ? "#DCFCE7" : "#F1F5F9",
                color: regularUsers > 0 ? "#15803D" : "#64748B",
                fontSize: "11.5px",
                fontWeight: 600,
                padding: "3px 8px",
                border: regularUsers > 0 ? "1px solid #BBF7D0" : "1px solid #E2E8F0",
              }}
              title="Users with regular chat interactions"
            >
              <i className="ri-repeat-2-line" style={{ fontSize: "12px" }}></i>
              {regularUsers} Regular
            </span>
          </div>
        );
      },
    },

    {
      Header: "Message Stats",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => {
        const hostSent = row?.hostSentMessages ?? row?.expert_sent_messages ?? 0;
        const totalMsgs = row?.totalMessages ?? row?.total_messages ?? 0;
        return (
          <div className="d-flex flex-column align-items-center justify-content-center py-1">
            <span
              className="badge rounded-pill mb-1 fw-bold d-inline-flex align-items-center gap-1"
              style={{
                backgroundColor: "#EEF2FF",
                color: "#4338CA",
                fontSize: "12.5px",
                padding: "4px 10px",
                border: "1px solid #C7D2FE",
              }}
              title="Messages sent by this AI Expert"
            >
              <i className="ri-send-plane-fill" style={{ fontSize: "13px" }}></i>
              {hostSent} Sent
            </span>
            <span
              className="text-secondary fw-semibold d-inline-flex align-items-center gap-1"
              style={{ fontSize: "12px" }}
            >
              <span>Total:</span>
              <strong className="text-dark" style={{ fontSize: "12.5px" }}>{totalMsgs}</strong>
              <span>msgs</span>
            </span>
          </div>
        );
      },
    },

    {
      Header: "Chat Rate",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize fw-bold text-dark fs-14">
          {row?.chatRate ?? row?.chat_rate ?? 5}
        </span>
      ),
    },

    {
      Header: "Category & Specialty",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex flex-column align-items-center justify-content-center py-1">
          <span
            className="badge rounded-pill mb-1 fw-semibold d-inline-flex align-items-center"
            style={{
              backgroundColor: "#ede9fe",
              color: "#6d28d9",
              fontSize: "12px",
              padding: "4px 10px",
              border: "1px solid #ddd6fe",
            }}
          >
            {row?.specialty || "-"}
          </span>
          <span className="text-secondary fw-semibold" style={{ fontSize: "12px" }}>
            {row?.category || "-"}
          </span>
        </div>
      ),
    },

    {
      Header: "Tagline / Headline",
      thClass: "text-start",
      tdClass: "text-start",
      Cell: ({ row }: { row: any }) => (
        <div style={{ maxWidth: "260px" }}>
          <span
            className="text-dark d-block text-truncate"
            style={{ fontSize: "13px" }}
            title={row?.tagline || row?.occupation || "-"}
          >
            {row?.tagline || row?.occupation || "-"}
          </span>
        </div>
      ),
    },

    {
      Header: "Type & Language",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex flex-column align-items-center justify-content-center gap-1">
          <span
            className="badge rounded-pill px-2.5 py-1"
            style={{
              backgroundColor: "#F1F5F9",
              color: "#334155",
              fontSize: "11.5px",
              border: "1px solid #E2E8F0",
              fontWeight: 600,
            }}
          >
            {row?.type === "global" ? `Global (${row?.timezone || "UTC"})` : "Local (India)"}
          </span>
          <span className="text-muted" style={{ fontSize: "11px" }}>
            {row?.type === "global" ? "English" : "Hinglish (Roman)"}
          </span>
        </div>
      ),
    },

    {
      Header: "Status",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => {
        const isEnabled = row?.is_active !== false;
        return (
          <div className="d-flex align-items-center justify-content-center gap-2">
            <ToggleSwitch
              checked={isEnabled}
              onChange={() => handleToggleStatus(row)}
            />
            <span
              className={`badge ${isEnabled ? "bg-success text-white" : "bg-danger text-white"}`}
              style={{ fontSize: "11px", fontWeight: "600", padding: "4px 8px", borderRadius: "4px" }}
            >
              {isEnabled ? "Active" : "Disabled"}
            </span>
          </div>
        );
      },
    },

    {
      Header: "Info",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex justify-content-center">
          <button
            style={{
              backgroundColor: "#E1F8FF",
              borderRadius: "10px",
              padding: "8px",
              border: "none",
            }}
            onClick={() => handleInfo(row)}
            title="Expert Dossier & Details"
          >
            <img
              src={info.src}
              height={22}
              width={22}
              alt="Info-Image"
              style={{ height: "22px", width: "22px", objectFit: "contain" }}
            />
          </button>
        </div>
      ),
    },

    {
      Header: "Action",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex justify-content-center align-items-center">
          {/* Test Chat Button */}
          <button
            className="me-2"
            style={{
              backgroundColor: "#E0F2FE",
              borderRadius: "8px",
              padding: "8px",
              border: "none",
            }}
            onClick={() => router.push(`/AiChat?expertId=${row?.id}`)}
            title="Test Chat with Expert"
          >
            <FaComments style={{ color: "#0284C7", fontSize: "18px" }} />
          </button>

          {/* Edit Button */}
          <button
            className="me-2"
            style={{
              backgroundColor: "#CFF3FF",
              borderRadius: "8px",
              padding: "8px",
              border: "none",
            }}
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.setItem("editAiExpertData", JSON.stringify(row));
              }
              router.push({
                pathname: "/AddAiExpert",
                query: { id: row?.id },
              });
            }}
            title="Edit Expert"
          >
            <img src={EditIcon.src} alt="Edit Icon" width={22} height={22} />
          </button>

          {/* Delete Button */}
          <button
            style={{
              backgroundColor: "#FFE7E7",
              borderRadius: "8px",
              padding: "8px",
              border: "none",
            }}
            onClick={() => handleDelete(row)}
            title="Delete Expert"
          >
            <img src={TrashIcon.src} alt="Trash Icon" width={22} height={22} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <style jsx global>{`
        .ai-sq-card {
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
          background: #ffffff !important;
        }
        .ai-action-btn {
          border-radius: 6px !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          padding: 8px 16px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          transition: all 0.15s ease !important;
        }
        .ai-sq-input-sm {
          border-radius: 6px !important;
          border: 1.5px solid #cbd5e1 !important;
          padding: 7px 12px !important;
          font-size: 13.5px !important;
        }
        .ai-sq-input-sm:focus {
          border-color: #8f6dff !important;
          outline: none !important;
          box-shadow: 0 0 0 2px rgba(143, 109, 255, 0.2) !important;
        }
        .info-field-label {
          font-size: 11.5px;
          text-transform: uppercase;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
        }
        .info-field-value {
          font-size: 13.5px;
          color: #0f172a;
          font-weight: 500;
        }
        .info-field-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px 14px;
          height: 100%;
        }
      `}</style>

      <div className="p-3">
        {/* Top Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <Title name="AI Experts" display="none" />

          <div className="d-flex flex-wrap align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-info ai-action-btn"
              onClick={handleOpenPrompt}
              title="Get AI Generation Prompt Brief for Experts"
            >
              <FaRobot />
              <span>Prompt Brief</span>
            </button>

            <button
              type="button"
              className="btn btn-outline-success ai-action-btn"
              onClick={handleExport}
              disabled={exporting}
              title="Export all Experts to JSON"
            >
              <FaFileDownload />
              <span>{exporting ? "Exporting..." : "Export (JSON)"}</span>
            </button>

            <button
              type="button"
              className="btn btn-outline-primary ai-action-btn"
              style={{ borderColor: "#8F6DFF", color: "#8F6DFF" }}
              onClick={() => setShowImportModal(true)}
              title="Import Experts from JSON"
            >
              <FaFileUpload />
              <span>Import (JSON)</span>
            </button>

            <button
              type="button"
              className="btn text-white ai-action-btn shadow-sm"
              style={{ backgroundColor: "#8F6DFF" }}
              onClick={() => router.push("/AddAiExpert")}
            >
              <FaPlus />
              <span>Add AI Expert</span>
            </button>
          </div>
        </div>

        {/* ─── Total Female / Male Expert Stats Cards ────────────────────── */}
        <div className="row g-3 mb-4 mt-1">
          {/* Card 1: Total Female Experts */}
          <div className="col-12 col-sm-6 col-md-6 col-lg-3">
            <div
              className="card border-0 rounded-4 shadow-sm p-3 h-100 position-relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #FFF0F5 0%, #FFE4E6 100%)",
                borderLeft: "4px solid #E11D48",
                boxShadow: "0 4px 15px rgba(225, 29, 72, 0.08)",
                transition: "all 0.25s ease",
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted fw-semibold" style={{ fontSize: "13px", letterSpacing: "0.2px" }}>
                    Total Female Experts
                  </span>
                  <h3 className="mb-0 mt-1 fw-bold" style={{ color: "#E11D48", fontSize: "26px" }}>
                    {femaleCount}
                  </h3>
                  <span
                    className="badge rounded-pill mt-2 d-inline-flex align-items-center gap-1 px-2 py-1"
                    style={{ backgroundColor: "#FFE4E6", color: "#BE123C", fontSize: "11px", fontWeight: 600 }}
                  >
                    <i className="ri-women-line"></i> Female Profiles
                  </span>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{
                    width: "50px",
                    height: "50px",
                    background: "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",
                    boxShadow: "0 6px 16px rgba(225, 29, 72, 0.25)",
                  }}
                >
                  <Image src={female} alt="Female Expert" width={30} height={30} style={{ borderRadius: "50%", objectFit: "cover" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Total Male Experts */}
          <div className="col-12 col-sm-6 col-md-6 col-lg-3">
            <div
              className="card border-0 rounded-4 shadow-sm p-3 h-100 position-relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
                borderLeft: "4px solid #2563EB",
                boxShadow: "0 4px 15px rgba(37, 99, 235, 0.08)",
                transition: "all 0.25s ease",
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted fw-semibold" style={{ fontSize: "13px", letterSpacing: "0.2px" }}>
                    Total Male Experts
                  </span>
                  <h3 className="mb-0 mt-1 fw-bold" style={{ color: "#2563EB", fontSize: "26px" }}>
                    {maleCount}
                  </h3>
                  <span
                    className="badge rounded-pill mt-2 d-inline-flex align-items-center gap-1 px-2 py-1"
                    style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8", fontSize: "11px", fontWeight: 600 }}
                  >
                    <i className="ri-men-line"></i> Male Profiles
                  </span>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{
                    width: "50px",
                    height: "50px",
                    background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                    boxShadow: "0 6px 16px rgba(37, 99, 235, 0.25)",
                  }}
                >
                  <Image src={male} alt="Male Expert" width={30} height={30} style={{ borderRadius: "50%", objectFit: "cover" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Total Chat Users */}
          <div className="col-12 col-sm-6 col-md-6 col-lg-3">
            <div
              className="card border-0 rounded-4 shadow-sm p-3 h-100 position-relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
                borderLeft: "4px solid #10B981",
                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.08)",
                transition: "all 0.25s ease",
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted fw-semibold" style={{ fontSize: "13px", letterSpacing: "0.2px" }}>
                    Total Chat Users
                  </span>
                  <h3 className="mb-0 mt-1 fw-bold" style={{ color: "#059669", fontSize: "26px" }}>
                    {totalChatUsers}
                  </h3>
                  <span
                    className="badge rounded-pill mt-2 d-inline-flex align-items-center gap-1 px-2 py-1"
                    style={{ backgroundColor: "#D1FAE5", color: "#047857", fontSize: "11px", fontWeight: 600 }}
                  >
                    <i className="ri-user-voice-line"></i> Interacting Users
                  </span>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{
                    width: "50px",
                    height: "50px",
                    background: "linear-gradient(135deg, #34D399 0%, #10B981 100%)",
                    boxShadow: "0 6px 16px rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <Image src={userIcon} alt="Chat Users" width={28} height={28} style={{ objectFit: "contain" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Top Interactive Expert */}
          <div className="col-12 col-sm-6 col-md-6 col-lg-3">
            <div
              className="card border-0 rounded-4 shadow-sm p-3 h-100 position-relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)",
                borderLeft: "4px solid #8B5CF6",
                boxShadow: "0 4px 15px rgba(139, 92, 246, 0.08)",
                transition: "all 0.25s ease",
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div style={{ maxWidth: "calc(100% - 55px)" }}>
                  <span className="text-muted fw-semibold" style={{ fontSize: "13px", letterSpacing: "0.2px" }}>
                    Top Interactive Expert
                  </span>
                  <h3 className="mb-0 mt-1 fw-bold text-truncate" style={{ color: "#7C3AED", fontSize: "22px" }} title={mostInteractiveExpert?.name || "None"}>
                    {mostInteractiveExpert ? `${mostInteractiveExpert.name} ${mostInteractiveExpert.surname || ""}` : "None"}
                  </h3>
                  <span
                    className="badge rounded-pill mt-2 d-inline-flex align-items-center gap-1 px-2 py-1 text-truncate"
                    style={{ backgroundColor: "#EDE9FE", color: "#6D28D9", fontSize: "11px", fontWeight: 600, maxWidth: "100%" }}
                  >
                    <i className="ri-fire-line"></i> {(mostInteractiveExpert?.totalUsers ?? mostInteractiveExpert?.connected_users) || 0} Users • {mostInteractiveExpert?.totalMessages || 0} Msgs
                  </span>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                  style={{
                    width: "50px",
                    height: "50px",
                    background: "linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)",
                    boxShadow: "0 6px 16px rgba(139, 92, 246, 0.25)",
                  }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{ fontSize: "18px" }}
                  >
                    {mostInteractiveExpert?.name ? mostInteractiveExpert.name.slice(0, 1).toUpperCase() : "E"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar using Custom Searching Component */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
          <div className="d-flex flex-wrap align-items-center gap-2" style={{ minWidth: "320px", flex: "1 1 320px" }}>
            <div style={{ minWidth: "260px", maxWidth: "360px", flex: 1 }}>
              <CustomSelect
                options={[
                  { value: "", label: `All Categories (${categories.length})` },
                  ...categories.map((c) => ({ value: c, label: c })),
                ]}
                value={categoryFilter}
                onChange={(val: any) => {
                  setCategoryFilter(val);
                  setPage(1);
                }}
                searchable={true}
                placeholder="Filter by category..."
              />
            </div>
          </div>

          <div style={{ minWidth: "280px", maxWidth: "450px", flex: "1 1 280px" }}>
            <Searching
              type="server"
              serverSearching={(val: string) => {
                setSearchQuery(val || "");
                setPage(1);
              }}
              placeholder="Search Expert by Name, Category, Specialty..."
            />
          </div>
        </div>

        {/* Standard Table View */}
        <div className="card ai-sq-card shadow-sm overflow-hidden mb-3">
          <Table
            data={paginatedData}
            mapData={expertTableMap}
            type="server"
            className="table-hover"
          />

          {filteredExperts.length > 0 && (
            <div className="p-3 border-top d-flex align-items-center justify-content-between">
              <span className="text-muted fs-13">
                Showing {(page - 1) * rowsPerPage + 1} to{" "}
                {Math.min(page * rowsPerPage, filteredExperts.length)} of {filteredExperts.length} experts
              </span>
              <Pagination
                type="server"
                serverPage={page}
                setServerPage={setPage}
                serverPerPage={rowsPerPage}
                totalData={filteredExperts.length}
                onPageChange={(_, newPage: number) => setPage(newPage)}
                onRowsPerPageChange={(newVal: string) => {
                  setRowsPerPage(Number(newVal) || 10);
                  setPage(1);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: EXPERT INFO DOSSIER ================= */}
      {showInfoModal && selectedExpert && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1050 }}
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "10px" }}>
              {/* Modal Header */}
              <div className="modal-header border-bottom p-3.5 bg-light">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "10px",
                      backgroundColor: selectedExpert.gender === "female" ? "#EC4899" : "#8F6DFF",
                      fontSize: "18px",
                    }}
                  >
                    {selectedExpert.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="fw-bold mb-0 text-dark">
                        {selectedExpert.name} {selectedExpert.surname || ""}
                      </h5>
                      <span
                        className="badge px-2 py-0.5"
                        style={{
                          backgroundColor: "#ede9fe",
                          color: "#6d28d9",
                          borderRadius: "4px",
                          fontSize: "11px",
                        }}
                      >
                        {selectedExpert.specialty}
                      </span>
                    </div>
                    <p className="text-muted mb-0 fs-12">
                      {selectedExpert.category} • {selectedExpert.tagline || "-"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowInfoModal(false)}
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4 d-flex flex-column gap-3">
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <div className="info-field-box">
                      <div className="info-field-label">Gender / Age</div>
                      <div className="info-field-value text-capitalize">
                        {selectedExpert.gender || "-"}, {selectedExpert.age ? `${selectedExpert.age} Yrs` : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="info-field-box">
                      <div className="info-field-label">Where From</div>
                      <div className="info-field-value">{selectedExpert.home_place || "-"}</div>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="info-field-box">
                      <div className="info-field-label">Type & Language</div>
                      <div className="info-field-value">
                        {selectedExpert.type === "global"
                          ? `Global (${selectedExpert.timezone || "UTC"})`
                          : "Local (Hinglish Roman)"}
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="info-field-box">
                      <div className="info-field-label">Appearance & Looks</div>
                      <div className="info-field-value">{selectedExpert.appearance || "-"}</div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="info-field-box">
                      <div className="info-field-label">Occupation & Background</div>
                      <div className="info-field-value">{selectedExpert.occupation || "-"}</div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="info-field-box">
                      <div className="info-field-label">A Normal Day / Routine</div>
                      <div className="info-field-value">{selectedExpert.daily_routine || "-"}</div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="info-field-box">
                      <div className="info-field-label">Story & Life Journey</div>
                      <div className="info-field-value" style={{ whiteSpace: "pre-wrap" }}>
                        {selectedExpert.bio || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="info-field-box">
                      <div className="info-field-label">Values</div>
                      <div className="info-field-value">{selectedExpert.values || "-"}</div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="info-field-box">
                      <div className="info-field-label">Quirks & Habits</div>
                      <div className="info-field-value">{selectedExpert.quirks || "-"}</div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="info-field-box">
                      <div className="info-field-label">Texting Style</div>
                      <div className="info-field-value">{selectedExpert.texting_style || "-"}</div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="info-field-box">
                      <div className="info-field-label">Greeting Line</div>
                      <div className="info-field-value text-primary font-italic">
                        "{selectedExpert.greeting || "-"}"
                      </div>
                    </div>
                  </div>

                  {Array.isArray(selectedExpert.likes) && selectedExpert.likes.length > 0 && (
                    <div className="col-12 col-md-4">
                      <div className="info-field-box">
                        <div className="info-field-label">Likes</div>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {selectedExpert.likes.map((l, i) => (
                            <span key={i} className="badge bg-info text-dark" style={{ borderRadius: "3px" }}>
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {Array.isArray(selectedExpert.dislikes) && selectedExpert.dislikes.length > 0 && (
                    <div className="col-12 col-md-4">
                      <div className="info-field-box">
                        <div className="info-field-label">Dislikes</div>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {selectedExpert.dislikes.map((d, i) => (
                            <span key={i} className="badge bg-warning text-dark" style={{ borderRadius: "3px" }}>
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {Array.isArray(selectedExpert.hobbies) && selectedExpert.hobbies.length > 0 && (
                    <div className="col-12 col-md-4">
                      <div className="info-field-box">
                        <div className="info-field-label">Hobbies</div>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {selectedExpert.hobbies.map((h, i) => (
                            <span key={i} className="badge bg-secondary" style={{ borderRadius: "3px" }}>
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Generated Prompt Box */}
                {selectedExpert.prompt && (
                  <div className="border rounded p-3 bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="fw-bold text-dark fs-12 d-flex align-items-center gap-1">
                        <FaRobot style={{ color: "#8F6DFF" }} />
                        <span>Generated System Prompt ({selectedExpert.prompt.length} chars)</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary py-0.5 px-2 fs-11 d-flex align-items-center gap-1"
                        style={{ borderRadius: "4px" }}
                        onClick={handleCopyModalPrompt}
                      >
                        {copiedModalPrompt ? <FaCheck /> : <FaCopy />}
                        <span>{copiedModalPrompt ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <pre
                      className="bg-white p-2.5 border rounded fs-12 text-dark font-monospace mb-0"
                      style={{ maxHeight: "180px", overflowY: "auto", whiteSpace: "pre-wrap" }}
                    >
                      {selectedExpert.prompt}
                    </pre>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer border-top p-3 bg-light d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-primary d-flex align-items-center gap-2"
                  style={{ borderRadius: "6px", fontSize: "13px" }}
                  onClick={() => {
                    setShowInfoModal(false);
                    router.push(`/AiChat?expertId=${selectedExpert.id}`);
                  }}
                >
                  <FaComments />
                  <span>Test Chat Sandbox</span>
                </button>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    style={{ borderRadius: "6px", fontSize: "13px" }}
                    onClick={() => setShowInfoModal(false)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn text-white"
                    style={{ backgroundColor: "#8F6DFF", borderRadius: "6px", fontSize: "13px" }}
                    onClick={() => {
                      setShowInfoModal(false);
                      router.push(`/AddAiExpert?id=${selectedExpert.id}`);
                    }}
                  >
                    Edit Expert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: IMPORT JSON ================= */}
      {showImportModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1050 }}
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "10px" }}>
              <div className="modal-header border-bottom p-3">
                <h5 className="modal-title fw-bold text-dark fs-16 d-flex align-items-center gap-2">
                  <FaFileUpload style={{ color: "#8F6DFF" }} />
                  <span>Import AI Experts from JSON</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowImportModal(false)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <p className="text-muted fs-13 mb-3">
                  Upload a <code>.json</code> file or paste a JSON array of expert personas below.
                </p>

                <div className="mb-3">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">
                    Upload .json File
                  </label>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="form-control"
                    onChange={handleFileUpload}
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">
                    Or Paste JSON Array
                  </label>
                  <textarea
                    rows={10}
                    className="form-control font-monospace fs-12"
                    placeholder={`[\n  {\n    "kind": "expert",\n    "name": "Devanshi",\n    "surname": "Shah",\n    "gender": "female",\n    "category": "Family & Society",\n    "specialty": "Parental Pressure",\n    "tagline": "Choose your life without losing your parents."\n  }\n]`}
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer border-top p-3 bg-light">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  style={{ borderRadius: "6px" }}
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importing || !importJsonText.trim()}
                  className="btn text-white"
                  style={{ backgroundColor: "#8F6DFF", borderRadius: "6px" }}
                  onClick={handleImport}
                >
                  {importing ? "Importing..." : "Execute Import"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PROMPT BRIEF ================= */}
      {showPromptModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1050 }}
          onClick={() => setShowPromptModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "10px" }}>
              <div className="modal-header border-bottom p-3 bg-light">
                <h5 className="modal-title fw-bold text-dark fs-16 d-flex align-items-center gap-2">
                  <FaRobot style={{ color: "#8F6DFF" }} />
                  <span>AI Expert Generation Brief</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPromptModal(false)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <p className="text-muted fs-13 mb-3">
                  Copy this prompt brief to ChatGPT / Claude to generate high quality topic advisor JSON arrays:
                </p>
                <pre
                  className="bg-light p-3 border rounded fs-12 text-dark font-monospace mb-0"
                  style={{ maxHeight: "350px", overflowY: "auto", whiteSpace: "pre-wrap" }}
                >
                  {promptText}
                </pre>
              </div>

              <div className="modal-footer border-top p-3 bg-light d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-primary d-flex align-items-center gap-1.5"
                  style={{ borderRadius: "6px" }}
                  onClick={handleCopyPrompt}
                >
                  {copiedPrompt ? <FaCheck /> : <FaCopy />}
                  <span>{copiedPrompt ? "Copied to Clipboard!" : "Copy Brief"}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ borderRadius: "6px" }}
                  onClick={() => setShowPromptModal(false)}
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

AiExperts.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiExperts;
