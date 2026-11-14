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
  return { backgroundColor: "#f3f4f6", color: "#4f46e5", borderColor: "#e0e7ff" };
};

const AiHosts = () => {
  const router = useRouter();
  const [hosts, setHosts] = useState<AiHostPersona[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [flavorFilter, setFlavorFilter] = useState<string>("");

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);

  // Modals
  const [qaHost, setQaHost] = useState<AiHostPersona | null>(null);
  const [selectedHost, setSelectedHost] = useState<AiHostPersona | null>(null);
  const [metricHost, setMetricHost] = useState<AiHostPersona | null>(null);
  const [editChatRate, setEditChatRate] = useState<number>(5);
  const [editRating, setEditRating] = useState<number>(4.9);
  const [editHelpedCount, setEditHelpedCount] = useState<string>("");
  const [updatingMetric, setUpdatingMetric] = useState<boolean>(false);

  // Import / Export
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [promptText, setPromptText] = useState<string>("");
  const [importing, setImporting] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  // Load hosts
  const loadHosts = async () => {
    setLoading(true);
    try {
      const data = await fetchAiHosts(
        genderFilter || undefined,
        flavorFilter || undefined
      );
      setHosts(data || []);
    } catch (err: any) {
      console.error("Failed to fetch hosts:", err);
      toast.error("Failed to load AI host personas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHosts();
  }, [genderFilter, flavorFilter]);

  // Available unique flavors in the current list
  const availableFlavors = useMemo(() => {
    const set = new Set<string>();
    hosts.forEach((h) => {
      if (h.flavor) set.add(h.flavor.trim());
    });
    return Array.from(set).sort();
  }, [hosts]);

  // Filtered by search
  const filteredHosts = useMemo(() => {
    if (!search.trim()) return hosts;
    const q = search.toLowerCase().trim();
    return hosts.filter((h) => {
      const name = `${h.name || ""} ${h.surname || ""}`.toLowerCase();
      const flavor = (h.flavor || "").toLowerCase();
      const tagline = (h.tagline || "").toLowerCase();
      const city = (h.home_place || "").toLowerCase();
      const occ = (h.occupation || "").toLowerCase();
      return (
        name.includes(q) ||
        flavor.includes(q) ||
        tagline.includes(q) ||
        city.includes(q) ||
        occ.includes(q)
      );
    });
  }, [hosts, search]);

  const totalPages = Math.ceil(filteredHosts.length / rowsPerPage) || 1;
  const paginatedHosts = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredHosts.slice(start, start + rowsPerPage);
  }, [filteredHosts, page, rowsPerPage]);

  // Toggle active status
  const handleToggleStatus = async (host: AiHostPersona) => {
    const newStatus = !host.is_active;
    try {
      await updateAiHost(host.id, { is_active: newStatus });
      setHosts((prev) =>
        prev.map((h) => (h.id === host.id ? { ...h, is_active: newStatus } : h))
      );
      toast.success(`${host.name} is now ${newStatus ? "Active" : "Inactive"}`);
    } catch (err) {
      toast.error("Failed to toggle host status.");
    }
  };

  // Delete host
  const handleDelete = async (host: AiHostPersona) => {
    if (!confirm(`Are you sure you want to permanently delete AI Host "${host.name}"?`)) {
      return;
    }
    try {
      const ok = await deleteAiHost(host.id);
      if (ok) {
        setHosts((prev) => prev.filter((h) => h.id !== host.id));
        toast.success(`Deleted host "${host.name}"`);
      }
    } catch (err) {
      toast.error("Failed to delete host.");
    }
  };

  // Open Metrics Edit Modal
  const handleOpenMetrics = (host: AiHostPersona) => {
    setMetricHost(host);
    setEditChatRate(Number(host.chatRate ?? host.chat_rate ?? 5));
    setEditRating(Number(host.rating ?? 4.9));
    setEditHelpedCount(String(host.helpedCount || host.helped_count || ""));
  };

  const handleSaveMetrics = async () => {
    if (!metricHost) return;
    setUpdatingMetric(true);
    try {
      await Promise.all([
        updateHostChatRate({ hostId: metricHost.hostId || undefined, name: metricHost.name }, editChatRate),
        updateHostMetrics(
          { hostId: metricHost.hostId || undefined, name: metricHost.name },
          { rating: editRating, helpedCount: editHelpedCount }
        ),
      ]);
      setHosts((prev) =>
        prev.map((h) =>
          h.id === metricHost.id
            ? {
                ...h,
                chatRate: editChatRate,
                chat_rate: editChatRate,
                rating: editRating,
                helpedCount: editHelpedCount,
              }
            : h
        )
      );
      toast.success("Host rates & metrics updated!");
      setMetricHost(null);
    } catch (err) {
      toast.error("Failed to update host metrics.");
    } finally {
      setUpdatingMetric(false);
    }
  };

  // Export hosts JSON
  const handleExport = () => {
    setExporting(true);
    try {
      const blob = new Blob([JSON.stringify(hosts, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai_hosts_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("AI Hosts exported successfully!");
    } catch (err) {
      toast.error("Failed to export hosts.");
    } finally {
      setExporting(false);
    }
  };

  // Import hosts
  const handleImport = async () => {
    if (!importJsonText.trim()) {
      toast.error("Please paste JSON or upload a .json file");
      return;
    }
    setImporting(true);
    try {
      const res = await importAiHosts(importJsonText.trim());
      toast.success(
        res?.message || `Successfully imported ${Array.isArray(res) ? res.length : ""} hosts!`
      );
      setShowImportModal(false);
      setImportJsonText("");
      loadHosts();
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
      Header: "AI HOST",
      Cell: ({ row }: { row: AiHostPersona }) => {
        const rawAvatar = row.image || row.avatar_url || (row.gender === "male" ? male : female);
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
                {row.home_place || row.occupation || "Dedicated Host"}
              </small>
            </div>
          </div>
        );
      },
    },
    {
      Header: "FLAVOR & VIBE",
      Cell: ({ row }: { row: AiHostPersona }) => {
        const style = getFlavorBadgeStyle(row.flavor);
        return (
          <div>
            <span
              className="badge px-3 py-1 rounded-pill fw-semibold border shadow-2xs d-inline-block"
              style={style}
            >
              <FaHeart className="me-1 small" />
              {row.flavor || "Sweet & Romantic"}
            </span>
            {row.tagline && (
              <small className="text-muted d-block mt-1 text-truncate" style={{ maxWidth: "240px" }} title={row.tagline}>
                "{row.tagline}"
              </small>
            )}
          </div>
        );
      },
    },
    {
      Header: "CHAT RATE",
      Cell: ({ row }: { row: AiHostPersona }) => (
        <button
          type="button"
          onClick={() => handleOpenMetrics(row)}
          className="btn btn-sm btn-light border rounded-pill px-3 py-1 d-flex align-items-center gap-1 shadow-2xs text-nowrap"
          title="Click to change coin chat rate"
        >
          <FaCoins className="text-warning" />
          <span className="fw-bold text-primary">{row.chatRate ?? row.chat_rate ?? 5}</span>
          <small className="text-muted">coins</small>
        </button>
      ),
    },
    {
      Header: "RATING",
      Cell: ({ row }: { row: AiHostPersona }) => (
        <button
          type="button"
          onClick={() => handleOpenMetrics(row)}
          className="btn btn-sm btn-light border rounded-pill px-3 py-1 d-flex align-items-center gap-1 shadow-2xs"
          title="Click to edit rating"
        >
          <FaStar className="text-warning" />
          <span className="fw-bold">{row.rating ?? 4.9}</span>
        </button>
      ),
    },
    {
      Header: "STATUS",
      Cell: ({ row }: { row: AiHostPersona }) => (
        <ToggleSwitch
          value={row.is_active !== false}
          onChange={() => handleToggleStatus(row)}
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
            title="Open test chat with this host"
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
            onClick={() => router.push(`/AddAiHost?id=${row.id}`)}
            className="btn btn-sm btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center"
            style={{ width: "32px", height: "32px" }}
            title="Edit Host"
          >
            ✏️
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => handleDelete(row)}
            className="btn btn-sm btn-outline-danger rounded-circle p-2 d-flex align-items-center justify-content-center"
            style={{ width: "32px", height: "32px" }}
            title="Delete Host"
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
      <Title name="AI Host Personas" />

      {/* Top Banner Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white mt-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
              <FaRobot className="text-primary" /> Dedicated 1-on-1 AI Hosts
            </h4>
            <p className="text-muted small mb-0">
              Personalized AI Host personas with dedicated flavors (Sweet & Romantic, Playful & Teasing, etc.),
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
              <FaFileUpload /> Import Hosts
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
              onClick={() => router.push("/AddAiHost")}
              className="btn btn-primary btn-sm rounded-pill px-4 py-2 d-flex align-items-center gap-2 shadow-sm fw-semibold"
            >
              <FaPlus /> Add AI Host
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="row g-3 align-items-center border-top mt-3 pt-3">
          {/* Search Box */}
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <FaSearch className="text-muted small" />
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 ps-0"
                placeholder="Search by name, flavor, tagline, city..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Gender Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select bg-light rounded-3"
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setPage(1);
              }}
            >
              {GENDER_FILTERS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Flavor Filter */}
          <div className="col-6 col-md-4">
            <select
              className="form-select bg-light rounded-3"
              value={flavorFilter}
              onChange={(e) => {
                setFlavorFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Personality Flavors</option>
              {availableFlavors.map((fl) => (
                <option key={fl} value={fl}>
                  {fl}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted small mt-2">Loading AI Host personas...</p>
          </div>
        ) : filteredHosts.length === 0 ? (
          <div className="text-center py-5">
            <FaRobot className="text-muted fs-1 mb-2" />
            <h6 className="fw-bold text-dark">No AI Hosts Found</h6>
            <p className="text-muted small mb-3">
              {search || genderFilter || flavorFilter
                ? "Try clearing filters or search keywords."
                : "Get started by adding your first AI Host persona!"}
            </p>
            <button
              type="button"
              onClick={() => router.push("/AddAiHost")}
              className="btn btn-primary btn-sm rounded-pill px-4 py-2"
            >
              <FaPlus className="me-1" /> Add AI Host
            </button>
          </div>
        ) : (
          <>
            <Table data={paginatedHosts} mapData={tableData} type="server" />
            <div className="p-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
              <small className="text-muted">
                Showing {(page - 1) * rowsPerPage + 1} to{" "}
                {Math.min(page * rowsPerPage, filteredHosts.length)} of {filteredHosts.length} hosts
              </small>
              <Pagination
                type="server"
                serverPage={page}
                setServerPage={setPage}
                serverPerPage={rowsPerPage}
                totalData={filteredHosts.length}
                onPageChange={(e, p) => setPage(p)}
                onRowsPerPageChange={(v) => {
                  setRowsPerPage(Number(v) || 12);
                  setPage(1);
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* QA Benchmark Modal */}
      {qaHost && <HostQAModal host={qaHost} onClose={() => setQaHost(null)} />}

      {/* Edit Metrics & Chat Rate Modal */}
      {metricHost && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header border-bottom p-3">
                <h6 className="modal-title fw-bold">Edit Rates & Metrics: {metricHost.name}</h6>
                <button type="button" className="btn-close" onClick={() => setMetricHost(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Coins per Message</label>
                  <div className="input-group">
                    <input
                      type="number"
                      min={0}
                      className="form-control"
                      value={editChatRate}
                      onChange={(e) => setEditChatRate(Number(e.target.value))}
                    />
                    <span className="input-group-text">Coins</span>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Star Rating (1.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={1}
                    max={5}
                    className="form-control"
                    value={editRating}
                    onChange={(e) => setEditRating(Number(e.target.value))}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Helped Count Display (e.g. 1.2k+)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 2.4k+"
                    value={editHelpedCount}
                    onChange={(e) => setEditHelpedCount(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-top p-3">
                <button type="button" className="btn btn-light rounded-pill" onClick={() => setMetricHost(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updatingMetric}
                  className="btn btn-primary rounded-pill px-4"
                  onClick={handleSaveMetrics}
                >
                  {updatingMetric ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import JSON Modal */}
      {showImportModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header border-bottom p-3">
                <h6 className="modal-title fw-bold">Bulk Import AI Host Personas</h6>
                <button type="button" className="btn-close" onClick={() => setShowImportModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="small text-muted mb-2">
                  Paste raw JSON array of host personas (matching the seed schema) or upload a <code>.json</code> file:
                </p>
                <textarea
                  rows={10}
                  className="form-control font-monospace small mb-3"
                  placeholder='[\n  {\n    "name": "Riya",\n    "flavor": "Playful & Teasing",\n    ...\n  }\n]'
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                ></textarea>
                <input
                  type="file"
                  accept=".json"
                  className="form-control form-control-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setImportJsonText(ev.target?.result as string);
                      reader.readAsText(file);
                    }
                  }}
                />
              </div>
              <div className="modal-footer border-top p-3">
                <button type="button" className="btn btn-light rounded-pill" onClick={() => setShowImportModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importing || !importJsonText.trim()}
                  className="btn btn-primary rounded-pill px-4"
                  onClick={handleImport}
                >
                  {importing ? "Importing..." : "Start Import"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Brief Modal */}
      {showPromptModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header border-bottom p-3 d-flex justify-content-between align-items-center">
                <h6 className="modal-title fw-bold">AI Generation Brief for Host Personas</h6>
                <button type="button" className="btn-close" onClick={() => setShowPromptModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="small text-muted mb-2">
                  Copy and paste this brief into ChatGPT / Claude to generate valid JSON containing new Indian host personas:
                </p>
                <textarea
                  rows={12}
                  readOnly
                  className="form-control font-monospace small bg-light"
                  value={promptText}
                ></textarea>
              </div>
              <div className="modal-footer border-top p-3 d-flex justify-content-between">
                <button type="button" className="btn btn-light rounded-pill" onClick={() => setShowPromptModal(false)}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2"
                  onClick={handleCopyPrompt}
                >
                  {copiedPrompt ? <FaCheck /> : <FaCopy />}
                  {copiedPrompt ? "Copied!" : "Copy Brief"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AiHosts.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiHosts;
