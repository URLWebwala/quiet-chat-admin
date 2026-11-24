import React, { useEffect, useMemo, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import ToggleSwitch from "@/extra/TogggleSwitch";
import Searching from "@/extra/Searching";
import {
  AiHostPersona,
  fetchAiHosts,
  deleteAiHost,
  updateAiHost,
  fetchHostImportPrompt,
  importAiHosts,
  updateHostChatRate,
  updateHostMetrics,
} from "@/utils/aiChatApi";
import { baseURL } from "@/utils/config";
import Image from "next/image";
import female from "@/assets/images/female.png";
import male from "@/assets/images/male.png";
import { HostQAModal } from "@/component/host/HostQAModal";
import {
  FaRobot,
  FaPlus,
  FaFileDownload,
  FaFileUpload,
  FaComments,
  FaCopy,
  FaCheck,
  FaSearch,
  FaStar,
  FaHeart,
  FaCoins,
  FaCheckCircle,
} from "react-icons/fa";

const GENDER_FILTERS = [
  { key: "", label: "All Genders" },
  { key: "female", label: "Women" },
  { key: "male", label: "Men" },
];

const FLAVOR_COLORS: { [key: string]: { bg: string; text: string; border: string } } = {
  "Sweet & Romantic": { bg: "#fdf2f8", text: "#db2777", border: "#fbcfe8" },
  "Playful & Teasing": { bg: "#faf5ff", text: "#9333ea", border: "#e9d5ff" },
  "Bold & Sassy": { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
  "Cute & Bubbly": { bg: "#fefce8", text: "#ca8a04", border: "#fef08a" },
  "Charming & Elegant": { bg: "#f0f9ff", text: "#0284c7", border: "#bae6fd" },
  "Witty & Sarcastic": { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" },
  "Caring & Supportive": { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  "Mysterious & Sultry": { bg: "#f8fafc", text: "#334155", border: "#cbd5e1" },
};

const getFlavorBadgeStyle = (flavor?: string) => {
  if (!flavor) return { backgroundColor: "#f3f4f6", color: "#374151", borderColor: "#e5e7eb" };
  const match = FLAVOR_COLORS[flavor];
  if (match) return { backgroundColor: match.bg, color: match.text, borderColor: match.border };
  return { backgroundColor: "#f3f4f6", color: "#374151", borderColor: "#e5e7eb" };
};

const AiModels = () => {
  const router = useRouter();
  const [hosts, setHosts] = useState<AiHostPersona[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [flavorFilter, setFlavorFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [qaHost, setQaHost] = useState<AiHostPersona | null>(null);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Modals
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [promptText, setPromptText] = useState<string>("");
  const [importing, setImporting] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  // Editing coin chat rate in-line
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState<number>(5);

  // Load models
  const loadModels = async () => {
    setLoading(true);
    try {
      const data = await fetchAiHosts(
        genderFilter || undefined,
        flavorFilter || undefined
      );
      setHosts(data || []);
    } catch (err: any) {
      console.warn("Could not load AI models:", err);
      toast.error(err?.message || "Failed to load AI Models");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, [genderFilter, flavorFilter]);

  // Unique Flavors for Filter Dropdown
  const availableFlavors = useMemo(() => {
    const set = new Set<string>();
    hosts.forEach((h) => {
      if (h.flavor) set.add(h.flavor);
    });
    return Array.from(set).sort();
  }, [hosts]);

  // Filtered & Searched data
  const filteredData = useMemo(() => {
    return hosts.filter((h) => {
      if (statusFilter === "active" && h.is_active === false) return false;
      if (statusFilter === "inactive" && h.is_active !== false) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchText = [
        h.name,
        h.surname,
        h.flavor,
        h.tagline,
        h.slug,
        h.home_place,
        h.occupation,
        h.uniqueId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchText.includes(q);
    });
  }, [hosts, statusFilter, searchQuery]);

  // Paged Data
  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  // Delete Model
  const handleDelete = async (host: AiHostPersona) => {
    const hostId = host.id || host._id;
    if (!hostId) return;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete AI Model "${host.name} ${host.surname || ""}"?`
      )
    ) {
      return;
    }
    try {
      const ok = await deleteAiHost(hostId);
      if (ok) {
        toast.success(`AI Model "${host.name}" deleted successfully.`);
        setHosts((prev) => prev.filter((h) => (h.id || h._id) !== hostId));
      } else {
        toast.error("Failed to delete AI Model.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (host: AiHostPersona) => {
    const hostId = host.id || host._id;
    if (!hostId) return;
    const nextState = host.is_active === false ? true : false;
    try {
      await updateAiHost(hostId, { is_active: nextState });
      toast.success(
        `AI Model "${host.name}" is now ${nextState ? "Active" : "Inactive"}.`
      );
      setHosts((prev) =>
        prev.map((h) =>
          (h.id || h._id) === hostId ? { ...h, is_active: nextState } : h
        )
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  // Save inline chat rate
  const handleSaveRate = async (host: AiHostPersona) => {
    const hostId = host.id || host._id;
    if (!hostId) return;
    try {
      await updateHostChatRate({ hostId, name: host.name }, tempRate);
      toast.success(`Chat rate for ${host.name} updated to ${tempRate} credits/msg`);
      setHosts((prev) =>
        prev.map((h) =>
          (h.id || h._id) === hostId
            ? { ...h, chatRate: tempRate, chat_rate: tempRate }
            : h
        )
      );
      setEditingRateId(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update rate");
    }
  };

  // Export JSON
  const handleExport = () => {
    setExporting(true);
    try {
      const blob = new Blob([JSON.stringify(hosts, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai_models_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${hosts.length} AI models successfully!`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to export models");
    } finally {
      setExporting(false);
    }
  };

  // Import JSON
  const handleImport = async () => {
    if (!importJsonText.trim()) {
      toast.error("Please paste JSON or upload a .json file");
      return;
    }
    setImporting(true);
    try {
      const res = await importAiHosts(importJsonText.trim());
      toast.success(
        res?.message || `Successfully imported ${Array.isArray(res) ? res.length : ""} models!`
      );
      setShowImportModal(false);
      setImportJsonText("");
      loadModels();
    } catch (err: any) {
      toast.error(err?.message || "Import failed. Please check JSON format.");
    } finally {
      setImporting(false);
    }
  };

  // Prompt template modal
  const handleOpenPrompt = async () => {
    setShowPromptModal(true);
    setCopiedPrompt(false);
    try {
      const text = await fetchHostImportPrompt();
      setPromptText(text || "No prompt returned.");
    } catch (err) {
      setPromptText("Failed to load prompt template.");
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    toast.success("Brief copied to clipboard!");
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Table Columns
  const tableData = [
    {
      Header: "NO",
      Cell: ({ index }: { index: number }) => (
        <span className="text-secondary fw-semibold">{(page - 1) * rowsPerPage + index + 1}</span>
      ),
    },
    {
      Header: "AI MODEL",
      Cell: ({ row }: { row: AiHostPersona }) => {
        const fallbackImages: Record<string, string> = {
          aisha: "storage/1795265677148.jpg",
          riya: "storage/1770636189581.jpg",
          sanya: "storage/1795268165609.jpg",
          tara: "storage/1795267494038.jpg",
          shanaya: "storage/1788543557169.jpg",
        };
        const fallback = fallbackImages[(row.name || "").toLowerCase()] || "";
        const rawAvatar = row.image || row.avatar_url || fallback || (row.gender === "male" ? male : female);
        const avatarSrc = typeof rawAvatar === "object" && rawAvatar?.src ? rawAvatar.src : rawAvatar;
        const resolvedSrc = typeof avatarSrc === "string" && (avatarSrc.startsWith("http") || avatarSrc.startsWith("/"))
          ? avatarSrc
          : typeof avatarSrc === "string" && avatarSrc
          ? `${baseURL}${avatarSrc}`
          : "/assets/images/female.png";
        return (
          <div className="d-flex align-items-center gap-3">
            <div
              className="position-relative rounded-circle overflow-hidden border shadow-sm flex-shrink-0"
              style={{ width: "48px", height: "48px" }}
            >
              <Image
                src={resolvedSrc}
                alt={row.name}
                fill
                style={{ objectFit: "cover" }}
                unoptimized
              />
            </div>
            <div>
              <div className="fw-bold text-dark d-flex align-items-center gap-2">
                <span>{row.name} {row.surname || ""}</span>
                {row.age && <small className="text-muted fw-normal">({row.age}y)</small>}
              </div>
              <small className="text-muted text-truncate d-block" style={{ maxWidth: "200px" }}>
                {row.home_place || row.occupation || "Dedicated Model"}
              </small>
            </div>
          </div>
        );
      },
    },
    {
      Header: "GENDER / AGE",
      Cell: ({ row }: { row: AiHostPersona }) => (
        <div>
          <span
            className={`badge rounded-pill px-3 py-1 fw-semibold ${
              row.gender === "female" ? "bg-danger-subtle text-danger" : "bg-primary-subtle text-primary"
            }`}
          >
            {row.gender === "female" ? "Woman" : "Man"}
          </span>
          <div className="small text-muted mt-1">{row.age ? `${row.age} yrs old` : "Age: N/A"}</div>
        </div>
      ),
    },
    {
      Header: "FLAVOR & VIBE",
      Cell: ({ row }: { row: AiHostPersona }) => {
        const style = getFlavorBadgeStyle(row.flavor);
        return (
          <div>
            <span
              className="badge px-3 py-1 rounded-pill fw-semibold border"
              style={{
                backgroundColor: style.backgroundColor,
                color: style.color,
                borderColor: style.borderColor,
              }}
            >
              {row.flavor || "Sweet & Romantic"}
            </span>
            {row.tagline && (
              <small className="text-muted d-block mt-1 fst-italic text-truncate" style={{ maxWidth: "220px" }}>
                “{row.tagline}”
              </small>
            )}
          </div>
        );
      },
    },
    {
      Header: "LIVE MEDIA",
      Cell: ({ row }: { row: AiHostPersona }) => {
        const photosCount = Array.isArray(row.photoGallery) ? row.photoGallery.length : 0;
        const hasVideo = !!row.video;
        return (
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-light text-dark border">
                📸 {photosCount > 0 ? `${photosCount} Photos` : "Avatar only"}
              </span>
              {hasVideo && <span className="badge bg-success-subtle text-success">🎥 Video</span>}
            </div>
          </div>
        );
      },
    },
    {
      Header: "CHAT RATE",
      Cell: ({ row }: { row: AiHostPersona }) => {
        const isEditing = editingRateId === (row.id || row._id);
        const currentRate = row.chatRate ?? row.chat_rate ?? 5;
        if (isEditing) {
          return (
            <div className="d-flex align-items-center gap-2">
              <input
                type="number"
                min="0"
                max="500"
                className="form-control form-control-sm text-center"
                style={{ width: "70px" }}
                value={tempRate}
                onChange={(e) => setTempRate(Number(e.target.value))}
              />
              <button
                type="button"
                className="btn btn-sm btn-success rounded-pill px-2"
                onClick={() => handleSaveRate(row)}
              >
                ✓
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-2"
                onClick={() => setEditingRateId(null)}
              >
                ✕
              </button>
            </div>
          );
        }
        return (
          <div
            className="d-inline-flex align-items-center gap-1 cursor-pointer bg-warning-subtle text-warning-emphasis px-3 py-1 rounded-pill fw-semibold border border-warning-subtle"
            onClick={() => {
              setEditingRateId(row.id || row._id || null);
              setTempRate(currentRate);
            }}
            title="Click to edit credit cost per message"
          >
            <FaCoins className="text-warning" />
            <span>{currentRate} credits/msg</span>
          </div>
        );
      },
    },
    {
      Header: "STATUS",
      Cell: ({ row }: { row: AiHostPersona }) => (
        <ToggleSwitch
          value={row.is_active !== false}
          onChange={() => handleToggleActive(row)}
        />
      ),
    },
    {
      Header: "ACTIONS",
      Cell: ({ row }: { row: AiHostPersona }) => (
        <div className="d-flex align-items-center gap-2">
          {/* Chat Now */}
          <button
            type="button"
            onClick={() => router.push(`/AiChat?hostId=${row.id}`)}
            className="btn btn-sm btn-primary rounded-pill px-3 py-1 d-flex align-items-center gap-1 shadow-sm text-nowrap"
            title="Open test chat with this model"
          >
            <FaComments /> Chat
          </button>

          {/* QA Benchmark */}
          <button
            type="button"
            onClick={() => setQaHost(row)}
            className="btn btn-sm btn-outline-info rounded-pill px-2 py-1 text-nowrap"
            title="Run QA Benchmark test scenarios"
          >
            <FaCheckCircle className="me-1" /> QA
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => router.push(`/AddAiModel?id=${row.id}`)}
            className="btn btn-sm btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center"
            style={{ width: "32px", height: "32px" }}
            title="Edit AI Model"
          >
            ✏️
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => handleDelete(row)}
            className="btn btn-sm btn-outline-danger rounded-circle p-2 d-flex align-items-center justify-content-center"
            style={{ width: "32px", height: "32px" }}
            title="Delete AI Model"
          >
            🗑️
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-3">
      {/* Page Title & Summary */}
      <Title name="AI Models" />

      {/* Top Banner Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white mt-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
              <FaRobot className="text-primary" /> Dedicated 1-on-1 AI Models
            </h4>
            <p className="text-muted small mb-0">
              Personalized AI Model personas with dedicated flavors (Sweet & Romantic, Playful & Teasing, etc.),
              custom Hinglish conversation engine, live media sync, and coin chat billing.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenPrompt}
              className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-2 d-flex align-items-center gap-2"
            >
              <FaCopy /> AI Prompt Brief
            </button>
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="btn btn-outline-primary btn-sm rounded-pill px-3 py-2 d-flex align-items-center gap-2"
            >
              <FaFileUpload /> Import Models
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || hosts.length === 0}
              className="btn btn-outline-dark btn-sm rounded-pill px-3 py-2 d-flex align-items-center gap-2"
            >
              <FaFileDownload /> Export JSON
            </button>
            <button
              type="button"
              onClick={() => router.push("/AddAiModel")}
              className="btn btn-primary btn-sm rounded-pill px-4 py-2 d-flex align-items-center gap-2 shadow-sm fw-semibold"
            >
              <FaPlus /> Add AI Model
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="row g-3 align-items-center border-top mt-3 pt-3">
          {/* Search Box */}
          <div className="col-12 col-md-5">
            <Searching
              placeholder="Search by name, flavor, location, occupation..."
              data={hosts}
              setData={setHosts}
              searchValue={searchQuery}
              setSearchValue={setSearchQuery}
            />
          </div>

          {/* Gender Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setPage(1);
              }}
            >
              {GENDER_FILTERS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* Flavor Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={flavorFilter}
              onChange={(e) => {
                setFlavorFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Flavors</option>
              {availableFlavors.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-4">
        <Table
          data={paginatedData}
          mapData={tableData}
          PerPage={rowsPerPage}
          Page={page}
          type="server"
        />

        {/* Pagination Bar */}
        <div className="p-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
          <small className="text-muted">
            Showing {filteredData.length > 0 ? (page - 1) * rowsPerPage + 1 : 0} to{" "}
            {Math.min(page * rowsPerPage, filteredData.length)} of {filteredData.length} AI Models
          </small>
          <Pagination
            type="server"
            serverPage={page}
            setServerPage={setPage}
            serverPerPage={rowsPerPage}
            totalData={filteredData.length}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(perPage) => {
              setRowsPerPage(Number(perPage));
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* QA Benchmark Modal */}
      {qaHost && (
        <HostQAModal
          host={qaHost}
          onClose={() => setQaHost(null)}
        />
      )}

      {/* Import Models Modal */}
      {showImportModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1055 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 bg-primary text-white p-3">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 fs-6">
                  <FaFileUpload /> Bulk Import AI Model Personas (JSON)
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowImportModal(false)}
                />
              </div>

              <div className="modal-body p-4">
                <p className="text-muted small mb-3">
                  Paste an array of Model Persona JSON objects or upload a <code>.json</code> file.
                  Each object should have: <code>name</code>, <code>gender</code>, <code>flavor</code>, <code>tagline</code>, <code>bio</code>, etc.
                </p>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">
                    Upload .json File
                  </label>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="form-control form-control-sm"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setImportJsonText((ev.target?.result as string) || "");
                      };
                      reader.readAsText(file);
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">
                    Or Paste JSON Array
                  </label>
                  <textarea
                    rows={8}
                    className="form-control font-monospace small bg-light"
                    placeholder={`[\n  {\n    "name": "Aisha",\n    "flavor": "Sweet & Romantic",\n    "gender": "female",\n    "tagline": "Late night talks",\n    "bio": "I love chai and music."\n  }\n]`}
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer border-0 p-3 bg-light d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm rounded-pill px-4 fw-semibold"
                  onClick={handleImport}
                  disabled={importing || !importJsonText.trim()}
                >
                  {importing ? "Importing..." : "Run Import"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Prompt Brief Modal */}
      {showPromptModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1055 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 bg-dark text-white p-3">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 fs-6">
                  <FaRobot className="text-info" /> AI Model Persona Generation Prompt Brief
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowPromptModal(false)}
                />
              </div>

              <div className="modal-body p-4">
                <p className="text-muted small mb-2">
                  Paste this prompt into ChatGPT or Claude to generate a batch of ready-to-import AI Model personas:
                </p>
                <textarea
                  readOnly
                  rows={10}
                  className="form-control font-monospace small bg-light"
                  value={promptText}
                />
              </div>

              <div className="modal-footer border-0 p-3 bg-light d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                  onClick={() => setShowPromptModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm rounded-pill px-4 d-flex align-items-center gap-2"
                  onClick={handleCopyPrompt}
                >
                  {copiedPrompt ? (
                    <>
                      <FaCheck /> Copied!
                    </>
                  ) : (
                    <>
                      <FaCopy /> Copy Prompt
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AiModels.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiModels;
