import React, { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Title from "@/extra/Title";
import { toast } from "react-toastify";
import {
  AiProfile,
  AiExpert,
  AiHostPersona,
  fetchAiProfiles,
  fetchAiExperts,
  fetchAiHosts,
  deleteAiProfile,
  updateAiProfile,
  importAiProfiles,
  fetchImportPrompt,
} from "@/utils/aiChatApi";
import { HostQAModal } from "@/component/host/HostQAModal";
import {
  FaSearch,
  FaRobot,
  FaPlus,
  FaFileDownload,
  FaFileUpload,
  FaCopy,
  FaCheck,
  FaThLarge,
  FaList,
  FaTable,
  FaComments,
  FaEdit,
  FaTrash,
  FaFlask,
} from "react-icons/fa";

const AVATAR_COLORS = [
  "#c2410c",
  "#b91c1c",
  "#a21caf",
  "#6d28d9",
  "#1d4ed8",
  "#0f766e",
  "#4d7c0f",
  "#be123c",
];

const GENDER_FILTERS = [
  { key: "", label: "Everyone" },
  { key: "female", label: "Girls" },
  { key: "male", label: "Boys" },
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
  if (!flavor) return { bg: "#f3f4f6", text: "#374151", border: "#e5e7eb" };
  const match = FLAVOR_COLORS[flavor];
  if (match) return match;
  return { bg: "#f3f4f6", text: "#374151", border: "#e5e7eb" };
};

function AvatarBadge({
  name = "?",
  id = "",
  size = 44,
  src,
}: {
  name?: string;
  id?: string;
  size?: number;
  src?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  const seed = [...(id || name)].reduce((n, c) => n + c.charCodeAt(0), 0);
  const color = AVATAR_COLORS[seed % AVATAR_COLORS.length];
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color,
        color: "#fff",
        fontWeight: 700,
        fontSize: Math.round(size * 0.42),
        flexShrink: 0,
      }}
    >
      {(name || "?").trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

interface AiDiscoverProps {
  initialTab?: "discover" | "experts" | "hosts";
}

export const AiDiscoverComponent: React.FC<AiDiscoverProps> = ({
  initialTab = "discover",
}) => {
  const router = useRouter();

  // Active top tab: "discover" | "experts" | "hosts"
  const [activeTab, setActiveTab] = useState<"discover" | "experts" | "hosts">(
    initialTab
  );

  // Synchronize activeTab with URL query if provided
  useEffect(() => {
    if (!router.isReady) return;
    const tab = router.query.tab as string;
    if (tab === "discover" || tab === "experts" || tab === "hosts") {
      setActiveTab(tab);
    }
  }, [router.isReady, router.query.tab]);

  // Data states
  const [profiles, setProfiles] = useState<AiProfile[]>([]);
  const [experts, setExperts] = useState<AiExpert[]>([]);
  const [hosts, setHosts] = useState<AiHostPersona[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Common filters & search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"default" | "name">("default");
  const [layoutView, setLayoutView] = useState<"grid" | "list" | "table">("grid");

  // Tab-specific filters
  const [expertCategory, setExpertCategory] = useState<string>("");
  const [hostFlavor, setHostFlavor] = useState<string>("");

  // Modals
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [promptText, setPromptText] = useState<string>("");
  const [importing, setImporting] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [qaModalHost, setQaModalHost] = useState<AiHostPersona | null>(null);

  // Load data based on tab
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "discover") {
        const data = await fetchAiProfiles(genderFilter || undefined);
        setProfiles(Array.isArray(data) ? data : []);
      } else if (activeTab === "experts") {
        const data = await fetchAiExperts(genderFilter || undefined);
        setExperts(Array.isArray(data) ? data : []);
      } else if (activeTab === "hosts") {
        const data = await fetchAiHosts(
          genderFilter || undefined,
          hostFlavor || undefined
        );
        setHosts(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.warn("Error loading AI data:", err);
      toast.error(err?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, genderFilter, hostFlavor]);

  // Keyboard shortcut for search
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping = /^(INPUT|TEXTAREA|SELECT)$/i.test(
        (document.activeElement as HTMLElement)?.tagName || ""
      );
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered Discover Profiles
  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    const q = searchQuery.trim().toLowerCase();
    let list = q
      ? profiles.filter((p) => {
          const haystack = [
            p.name,
            p.surname,
            p.home_place,
            p.occupation,
            p.language,
            p.greeting,
            ...(p.personality || []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
      : profiles.slice();

    if (sortOrder === "name") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    return list;
  }, [profiles, searchQuery, sortOrder]);

  // Expert Categories & Grouped sections
  const expertCategories = useMemo(() => {
    return Array.from(
      new Set(experts.map((e) => e.category).filter(Boolean) as string[])
    ).sort();
  }, [experts]);

  const expertSections = useMemo(() => {
    if (!experts) return [];
    const q = searchQuery.trim().toLowerCase();
    let list = q
      ? experts.filter((e) => {
          const haystack = [
            e.name,
            e.surname,
            e.category,
            e.specialty,
            e.tagline,
            e.occupation,
            e.home_place,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
      : experts.slice();

    if (expertCategory) {
      list = list.filter((e) => e.category === expertCategory);
    }

    const groups = new Map<string, AiExpert[]>();
    for (const exp of list) {
      const cat = exp.category || "General Advice";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(exp);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, items]) => [
        name,
        items.sort((a, b) => (a.name || "").localeCompare(b.name || "")),
      ] as [string, AiExpert[]]);
  }, [experts, searchQuery, expertCategory]);

  // Host Flavors & Filtered list
  const hostFlavors = useMemo(() => {
    return Array.from(
      new Set(hosts.map((h) => h.flavor).filter(Boolean) as string[])
    ).sort();
  }, [hosts]);

  const filteredHosts = useMemo(() => {
    if (!hosts) return [];
    const q = searchQuery.trim().toLowerCase();
    let list = q
      ? hosts.filter((h) => {
          const haystack = [
            h.name,
            h.surname,
            h.flavor,
            h.tagline,
            h.slug,
            h.occupation,
            h.home_place,
            h.bio,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
      : hosts.slice();

    if (hostFlavor) {
      list = list.filter((h) => h.flavor === hostFlavor);
    }
    return list;
  }, [hosts, searchQuery, hostFlavor]);

  // Export Profiles
  const handleExport = async () => {
    setExporting(true);
    try {
      const data =
        activeTab === "discover"
          ? await fetchAiProfiles()
          : activeTab === "experts"
          ? await fetchAiExperts()
          : await fetchAiHosts();
      const blob = new Blob([JSON.stringify(data || [], null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai_${activeTab}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${activeTab} data successfully!`);
    } catch (err: any) {
      toast.error(err?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  // Open AI Prompt Brief
  const handleOpenPrompt = async () => {
    setShowPromptModal(true);
    setCopiedPrompt(false);
    try {
      const text = await fetchImportPrompt();
      setPromptText(text || "No prompt returned from server.");
    } catch (err: any) {
      setPromptText("Failed to load prompt brief.");
    }
  };

  // Copy Prompt
  const handleCopyPrompt = () => {
    if (!promptText) return;
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    toast.success("AI Prompt Brief copied to clipboard!");
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  // Import JSON
  const handleImport = async () => {
    if (!importJsonText.trim()) {
      toast.error("Please paste JSON or choose a .json file");
      return;
    }
    setImporting(true);
    try {
      const res = await importAiProfiles(importJsonText.trim());
      toast.success(res?.message || "Imported profiles successfully!");
      setShowImportModal(false);
      setImportJsonText("");
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "Import failed. Please check JSON format.");
    } finally {
      setImporting(false);
    }
  };

  // Switch tab helper
  const handleTabChange = (newTab: "discover" | "experts" | "hosts") => {
    setActiveTab(newTab);
    setSearchQuery("");
    router.push({ pathname: router.pathname, query: { tab: newTab } }, undefined, {
      shallow: true,
    });
  };

  // Navigate to Chat
  const handleOpenChat = (id: string, kind: "profile" | "expert" | "host") => {
    if (kind === "expert") {
      router.push(`/AiChat?expertId=${id}`);
    } else if (kind === "host") {
      router.push(`/AiChat?hostId=${id}`);
    } else {
      router.push(`/AiChat?profileId=${id}`);
    }
  };

  return (
    <>
      <style jsx global>{`
        /* Top Navigation Tabs matching adminai.quietchat.in */
        .ai-top-tabs {
          display: flex;
          align-items: center;
          gap: 24px;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 18px;
          background: #ffffff;
          padding: 6px 12px 0 12px;
          border-radius: 8px 8px 0 0;
        }
        .ai-top-tab-btn {
          background: none;
          border: none;
          outline: none;
          font-size: 16px;
          font-weight: 600;
          color: #475569;
          padding: 8px 6px 12px 6px;
          cursor: pointer;
          position: relative;
          transition: all 0.15s ease-in-out;
        }
        .ai-top-tab-btn:hover {
          color: #0f172a;
        }
        .ai-top-tab-btn.active {
          color: #0f172a;
          font-weight: 700;
        }
        .ai-top-tab-btn.active::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 3px;
          background-color: #0f172a;
          border-radius: 3px 3px 0 0;
        }

        /* Toolbar */
        .ai-toolbar {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
        }
        .ai-toolbar-left {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          flex: 1 1 320px;
        }
        .ai-toolbar-right {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        /* Search input */
        .ai-search-box {
          position: relative;
          flex: 1 1 240px;
          min-width: 200px;
          display: flex;
          align-items: center;
        }
        .ai-search-box .search-icon {
          position: absolute;
          left: 12px;
          color: #94a3b8;
          font-size: 14px;
          pointer-events: none;
        }
        .ai-search-box input {
          width: 100%;
          padding: 8px 30px 8px 34px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 13px;
          background: #ffffff;
          outline: none;
        }
        .ai-search-box input:focus {
          border-color: #8F6DFF;
          box-shadow: 0 0 0 2px rgba(143, 109, 255, 0.15);
        }
        .ai-search-box .clear-btn {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 16px;
          cursor: pointer;
          padding: 0 4px;
        }

        /* Segmented control buttons */
        .ai-segmented {
          display: inline-flex;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          overflow: hidden;
          background: #fff;
        }
        .ai-segmented-btn {
          border: none;
          background: #ffffff;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          border-left: 1px solid #e2e8f0;
          transition: all 0.12s ease;
        }
        .ai-segmented-btn:first-child {
          border-left: none;
        }
        .ai-segmented-btn:hover {
          background: #f1f5f9;
        }
        .ai-segmented-btn.active {
          background: #0f172a;
          color: #ffffff;
          font-weight: 600;
        }

        /* Action Buttons */
        .ai-btn {
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          padding: 7px 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        /* Discover Person Cards Grid */
        .ai-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: 16px;
        }

        .ai-person-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
          position: relative;
        }
        .ai-person-card:hover {
          transform: translateY(-2px);
          border-color: #8F6DFF;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
        }

        .ai-card-head {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ai-card-name-block {
          min-width: 0;
          flex: 1;
        }
        .ai-card-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ai-card-sub {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 2px;
        }

        .ai-tags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .ai-tag {
          font-size: 11px;
          font-weight: 500;
          background: #f1f5f9;
          color: #475569;
          padding: 2px 7px;
          border-radius: 999px;
        }
        .ai-tag-gender {
          background: #fdf2f8;
          color: #be185d;
          font-weight: 600;
        }
        .ai-tag-boy {
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 600;
        }

        .ai-greeting-quote {
          font-size: 12px;
          color: #64748b;
          font-style: italic;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }

        .ai-card-foot {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 8px;
          border-top: 1px solid #f1f5f9;
        }
        .ai-chat-cta {
          font-size: 13px;
          font-weight: 600;
          color: #1d4ed8;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .ai-chat-cta:hover {
          color: #8F6DFF;
          text-decoration: underline;
        }

        /* List row layout */
        .ai-rows-container {
          display: flex;
          flex-direction: column;
        }
        .ai-list-row {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: -1px;
          cursor: pointer;
          transition: background 0.12s ease;
        }
        .ai-rows-container > .ai-list-row:first-child {
          border-radius: 8px 8px 0 0;
          margin-top: 0;
        }
        .ai-rows-container > .ai-list-row:last-child {
          border-radius: 0 0 8px 8px;
        }
        .ai-list-row:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          position: relative;
          z-index: 1;
        }

        /* Expert Cards */
        .ai-expert-section-head {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #64748b;
          margin: 24px 0 10px 0;
          padding-left: 4px;
        }
        .ai-experts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 14px;
        }
        .ai-expert-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .ai-expert-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
          border-color: #8F6DFF;
        }
        .ai-specialty-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #6d28d9;
          background: #f5f3ff;
          padding: 2px 8px;
          border-radius: 4px;
          letter-spacing: 0.03em;
        }

        /* Host Cards */
        .ai-host-flavor-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid transparent;
        }
      `}</style>

      {/* HEADER SECTION */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
        <Title
          name={
            activeTab === "discover"
              ? "AI Discover Profiles"
              : activeTab === "experts"
              ? "AI Experts"
              : "AI Hosts (1-on-1)"
          }
        />
        <div className="d-flex flex-wrap align-items-center gap-2">
          {activeTab === "discover" && (
            <>
              <button
                type="button"
                className="btn btn-outline-info ai-btn"
                onClick={handleOpenPrompt}
                title="Get Prompt Template to generate profiles with ChatGPT"
              >
                <FaRobot /> AI Prompt
              </button>
              <button
                type="button"
                className="btn btn-outline-success ai-btn"
                onClick={() => setShowImportModal(true)}
                title="Import Profiles JSON"
              >
                <FaFileUpload /> Import JSON
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary ai-btn"
                onClick={handleExport}
                disabled={exporting}
                title="Export Profiles to JSON"
              >
                <FaFileDownload /> {exporting ? "Exporting..." : "Export"}
              </button>
              <button
                type="button"
                className="btn btn-primary ai-btn"
                style={{ backgroundColor: "#8F6DFF", borderColor: "#8F6DFF" }}
                onClick={() => router.push("/AddAiHost")}
              >
                <FaPlus /> Add AI Profile
              </button>
            </>
          )}

          {activeTab === "experts" && (
            <>
              <button
                type="button"
                className="btn btn-outline-secondary ai-btn"
                onClick={handleExport}
                disabled={exporting}
              >
                <FaFileDownload /> {exporting ? "Exporting..." : "Export"}
              </button>
              <button
                type="button"
                className="btn btn-primary ai-btn"
                style={{ backgroundColor: "#8F6DFF", borderColor: "#8F6DFF" }}
                onClick={() => router.push("/AddAiExpert")}
              >
                <FaPlus /> Add AI Expert
              </button>
            </>
          )}

          {activeTab === "hosts" && (
            <>
              <button
                type="button"
                className="btn btn-outline-secondary ai-btn"
                onClick={handleExport}
                disabled={exporting}
              >
                <FaFileDownload /> {exporting ? "Exporting..." : "Export"}
              </button>
              <button
                type="button"
                className="btn btn-primary ai-btn"
                style={{ backgroundColor: "#8F6DFF", borderColor: "#8F6DFF" }}
                onClick={() => router.push("/AddAiHost")}
              >
                <FaPlus /> Add AI Host
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3 TOP TABS: Discover | Experts | Hosts (Directly matches https://adminai.quietchat.in) */}
      <div className="ai-top-tabs">
        <button
          type="button"
          className={`ai-top-tab-btn ${activeTab === "discover" ? "active" : ""}`}
          onClick={() => handleTabChange("discover")}
        >
          Discover
        </button>
        <button
          type="button"
          className={`ai-top-tab-btn ${activeTab === "experts" ? "active" : ""}`}
          onClick={() => handleTabChange("experts")}
        >
          Experts
        </button>
        <button
          type="button"
          className={`ai-top-tab-btn ${activeTab === "hosts" ? "active" : ""}`}
          onClick={() => handleTabChange("hosts")}
        >
          Hosts
        </button>
      </div>

      {/* TOOLBAR: Search, Filters, Sort, Layout */}
      <div className="ai-toolbar">
        <div className="ai-toolbar-left">
          {/* Search box with "/" shortcut */}
          <div className="ai-search-box">
            <span className="search-icon">
              <FaSearch />
            </span>
            <input
              ref={searchInputRef}
              type="search"
              placeholder={
                activeTab === "discover"
                  ? "Search name, place, trait, work... ( / )"
                  : activeTab === "experts"
                  ? "Search topic, name, specialty... ( / )"
                  : "Search host, flavor, vibe... ( / )"
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => setSearchQuery("")}
                title="Clear"
              >
                ×
              </button>
            )}
          </div>

          {/* Gender Filter for Discover */}
          {activeTab === "discover" && (
            <div className="ai-segmented">
              {GENDER_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`ai-segmented-btn ${
                    genderFilter === f.key ? "active" : ""
                  }`}
                  onClick={() => setGenderFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Category Filter for Experts */}
          {activeTab === "experts" && expertCategories.length > 0 && (
            <select
              className="form-select form-select-sm"
              style={{ width: "auto", minWidth: "150px" }}
              value={expertCategory}
              onChange={(e) => setExpertCategory(e.target.value)}
            >
              <option value="">All Topics</option>
              {expertCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Flavor Filter for Hosts */}
          {activeTab === "hosts" && hostFlavors.length > 0 && (
            <select
              className="form-select form-select-sm"
              style={{ width: "auto", minWidth: "150px" }}
              value={hostFlavor}
              onChange={(e) => setHostFlavor(e.target.value)}
            >
              <option value="">All Flavors</option>
              {hostFlavors.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          )}

          {/* Sort order */}
          <select
            className="form-select form-select-sm"
            style={{ width: "auto" }}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
          >
            <option value="default">Newest First</option>
            <option value="name">A – Z</option>
          </select>
        </div>

        {/* View Mode Toggle: Grid / List / Table */}
        <div className="ai-toolbar-right">
          <span className="fs-12 text-muted fw-semibold me-2">
            {activeTab === "discover"
              ? `${filteredProfiles.length} profiles`
              : activeTab === "experts"
              ? `${experts.length} experts`
              : `${filteredHosts.length} hosts`}
          </span>

          <div className="ai-segmented">
            <button
              type="button"
              className={`ai-segmented-btn ${layoutView === "grid" ? "active" : ""}`}
              onClick={() => setLayoutView("grid")}
              title="Card Grid view"
            >
              <FaThLarge />
            </button>
            <button
              type="button"
              className={`ai-segmented-btn ${layoutView === "list" ? "active" : ""}`}
              onClick={() => setLayoutView("list")}
              title="Compact List view"
            >
              <FaList />
            </button>
            <button
              type="button"
              className={`ai-segmented-btn ${layoutView === "table" ? "active" : ""}`}
              onClick={() => setLayoutView("table")}
              title="Management Table view"
            >
              <FaTable />
            </button>
          </div>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted fs-13">Loading {activeTab}...</p>
        </div>
      )}

      {/* ===================== TAB 1: DISCOVER ===================== */}
      {!loading && activeTab === "discover" && (
        <>
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-5 bg-white rounded border">
              <p className="text-muted fs-14 mb-2">
                {searchQuery
                  ? `No profiles match "${searchQuery}".`
                  : "No AI profiles found."}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-link btn-sm"
                  onClick={() => setSearchQuery("")}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : layoutView === "grid" ? (
            /* CARD GRID VIEW */
            <div className="ai-cards-grid">
              {filteredProfiles.map((p) => {
                const isGirl = p.gender === "female";
                const traits = p.personality || [];
                const subTitle = [p.home_place, p.occupation]
                  .filter(Boolean)
                  .join(" · ") || "No details";

                return (
                  <div
                    key={p.id || p._id}
                    className="ai-person-card"
                    onClick={() => handleOpenChat(p.id || p._id || "", "profile")}
                  >
                    <div className="ai-card-head">
                      <AvatarBadge
                        name={p.name}
                        id={p.id || p._id}
                        size={46}
                        src={p.avatar_url || (p as any).image}
                      />
                      <div className="ai-card-name-block">
                        <h4 className="ai-card-title">
                          {p.name} {p.surname || ""}
                          {p.age ? (
                            <span className="text-muted fw-normal fs-13">
                              {" "}
                              · {p.age}
                            </span>
                          ) : null}
                        </h4>
                        <div className="ai-card-sub">{subTitle}</div>
                      </div>
                    </div>

                    <div className="ai-tags-row">
                      <span
                        className={`ai-tag ${
                          isGirl ? "ai-tag-gender" : "ai-tag-boy"
                        }`}
                      >
                        {isGirl ? "Girl" : "Boy"}
                      </span>
                      {traits.slice(0, 2).map((t, i) => (
                        <span key={i} className="ai-tag">
                          {t}
                        </span>
                      ))}
                      {traits.length > 2 && (
                        <span className="ai-tag">+{traits.length - 2}</span>
                      )}
                    </div>

                    {p.greeting && (
                      <p className="ai-greeting-quote">“{p.greeting}”</p>
                    )}

                    <div className="ai-card-foot">
                      <span className="text-muted fs-12">{p.language || "Hindi"}</span>
                      <span className="ai-chat-cta">Chat →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : layoutView === "list" ? (
            /* COMPACT LIST VIEW */
            <div className="ai-rows-container">
              {filteredProfiles.map((p) => {
                const isGirl = p.gender === "female";
                const traits = p.personality || [];
                const subTitle = [p.home_place, p.occupation]
                  .filter(Boolean)
                  .join(" · ") || "No details";

                return (
                  <div
                    key={p.id || p._id}
                    className="ai-list-row"
                    onClick={() => handleOpenChat(p.id || p._id || "", "profile")}
                  >
                    <AvatarBadge
                      name={p.name}
                      id={p.id || p._id}
                      size={34}
                      src={p.avatar_url || (p as any).image}
                    />
                    <div style={{ minWidth: "160px" }}>
                      <strong className="fs-14 text-dark">
                        {p.name} {p.surname || ""}
                      </strong>
                      {p.age ? (
                        <span className="text-muted fs-12"> · {p.age}</span>
                      ) : null}
                    </div>

                    <div
                      className="text-muted fs-12 flex-grow-1"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {subTitle}
                    </div>

                    <div className="ai-tags-row d-none d-md-flex">
                      <span
                        className={`ai-tag ${
                          isGirl ? "ai-tag-gender" : "ai-tag-boy"
                        }`}
                      >
                        {isGirl ? "Girl" : "Boy"}
                      </span>
                      {traits.slice(0, 2).map((t, i) => (
                        <span key={i} className="ai-tag">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="text-muted fs-12 ms-auto me-3 d-none d-sm-block">
                      {p.language || "Hindi"}
                    </div>

                    <span className="ai-chat-cta">Chat →</span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="table-responsive bg-white rounded border">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light">
                  <tr>
                    <th>Profile</th>
                    <th>Name</th>
                    <th>Gender / Age</th>
                    <th>Home / Work</th>
                    <th>Personality</th>
                    <th>Language</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((p) => (
                    <tr key={p.id || p._id}>
                      <td style={{ width: "60px" }}>
                        <AvatarBadge
                          name={p.name}
                          id={p.id || p._id}
                          size={36}
                          src={p.avatar_url || (p as any).image}
                        />
                      </td>
                      <td>
                        <strong>{p.name} {p.surname || ""}</strong>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            p.gender === "female" ? "bg-danger" : "bg-primary"
                          } me-1`}
                        >
                          {p.gender}
                        </span>
                        {p.age ? `${p.age} yrs` : "-"}
                      </td>
                      <td>
                        <div className="fw-semibold">{p.home_place || "-"}</div>
                        <div className="text-muted fs-11">{p.occupation || "-"}</div>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {(p.personality || []).slice(0, 3).map((t, idx) => (
                            <span key={idx} className="badge bg-light text-dark border">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{p.language || "Hindi"}</td>
                      <td>
                        <span className="badge bg-success">Active</span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleOpenChat(p.id || p._id || "", "profile")}
                          title="Open AI Chat"
                        >
                          <FaComments /> Chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ===================== TAB 2: EXPERTS ===================== */}
      {!loading && activeTab === "experts" && (
        <>
          {expertSections.length === 0 ? (
            <div className="text-center py-5 bg-white rounded border">
              <p className="text-muted fs-14">No experts found.</p>
            </div>
          ) : layoutView === "grid" ? (
            /* EXPERTS GROUPED GRID VIEW */
            <div>
              {expertSections.map(([categoryName, people]) => (
                <div key={categoryName} className="mb-4">
                  <h3 className="ai-expert-section-head">{categoryName}</h3>
                  <div className="ai-experts-grid">
                    {people.map((e) => (
                      <div
                        key={e.id || e._id}
                        className="ai-expert-card"
                        onClick={() => handleOpenChat(e.id || e._id || "", "expert")}
                      >
                        <AvatarBadge
                          name={e.name}
                          id={e.id || e._id}
                          size={48}
                          src={e.avatar_url || (e as any).image}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <strong className="fs-15 text-dark text-truncate">
                              {e.name} {e.surname || ""}
                            </strong>
                            <span className="ai-chat-cta">Chat →</span>
                          </div>
                          {e.specialty && (
                            <div className="mb-1">
                              <span className="ai-specialty-badge">{e.specialty}</span>
                            </div>
                          )}
                          {e.tagline && (
                            <div
                              className="text-muted fs-12 mb-1"
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              “{e.tagline}”
                            </div>
                          )}
                          <div className="text-muted fs-11">
                            {[e.language, e.occupation].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* EXPERTS TABLE / LIST VIEW */
            <div className="table-responsive bg-white rounded border">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light">
                  <tr>
                    <th>Expert</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Specialty</th>
                    <th>Tagline</th>
                    <th>Language</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {experts.map((e) => (
                    <tr key={e.id || e._id}>
                      <td style={{ width: "50px" }}>
                        <AvatarBadge
                          name={e.name}
                          id={e.id || e._id}
                          size={36}
                          src={e.avatar_url || (e as any).image}
                        />
                      </td>
                      <td>
                        <strong>{e.name} {e.surname || ""}</strong>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {e.category}
                        </span>
                      </td>
                      <td>
                        <span className="ai-specialty-badge">{e.specialty}</span>
                      </td>
                      <td className="text-muted text-truncate" style={{ maxWidth: "200px" }}>
                        {e.tagline ? `“${e.tagline}”` : "-"}
                      </td>
                      <td>{e.language || "Hindi"}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleOpenChat(e.id || e._id || "", "expert")}
                        >
                          <FaComments /> Chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ===================== TAB 3: HOSTS ===================== */}
      {!loading && activeTab === "hosts" && (
        <>
          {filteredHosts.length === 0 ? (
            <div className="text-center py-5 bg-white rounded border">
              <p className="text-muted fs-14">No 1-on-1 hosts found.</p>
            </div>
          ) : layoutView === "grid" ? (
            /* HOSTS CARDS GRID */
            <div className="ai-cards-grid">
              {filteredHosts.map((h) => {
                const flavorStyle = getFlavorBadgeStyle(h.flavor);
                return (
                  <div
                    key={h.id || h._id}
                    className="ai-person-card"
                    onClick={() => handleOpenChat(h.id || h._id || "", "host")}
                  >
                    <div className="ai-card-head">
                      <AvatarBadge
                        name={h.name}
                        id={h.id || h._id}
                        size={48}
                        src={h.avatar_url || (h as any).image}
                      />
                      <div className="ai-card-name-block">
                        <h4 className="ai-card-title">
                          {h.name} {h.surname || ""}
                          {h.age ? (
                            <span className="text-muted fw-normal fs-13">
                              {" "}
                              · {h.age}
                            </span>
                          ) : null}
                        </h4>
                        {h.flavor && (
                          <div className="mt-1">
                            <span
                              className="ai-host-flavor-badge"
                              style={{
                                backgroundColor: flavorStyle.bg,
                                color: flavorStyle.text,
                                borderColor: flavorStyle.border,
                              }}
                            >
                              {h.flavor}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {h.home_place && (
                      <div className="text-muted fs-12">{h.home_place}</div>
                    )}

                    {h.tagline && (
                      <p className="ai-greeting-quote">“{h.tagline}”</p>
                    )}

                    {h.bio && (
                      <p
                        className="text-muted fs-12 mb-0"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {h.bio}
                      </p>
                    )}

                    <div className="ai-card-foot">
                      <span className="text-muted fs-12">{h.language || "Hindi"}</span>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-info p-1 px-2 fs-11"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQaModalHost(h);
                          }}
                          title="Run QA Diagnostic Test"
                        >
                          <FaFlask /> QA
                        </button>
                        <span className="ai-chat-cta">Chat 1-on-1 →</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* HOSTS TABLE VIEW */
            <div className="table-responsive bg-white rounded border">
              <table className="table table-hover align-middle mb-0 fs-13">
                <thead className="table-light">
                  <tr>
                    <th>Host</th>
                    <th>Name</th>
                    <th>Flavor</th>
                    <th>Tagline</th>
                    <th>Language</th>
                    <th>Chat Rate</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHosts.map((h) => {
                    const flavorStyle = getFlavorBadgeStyle(h.flavor);
                    return (
                      <tr key={h.id || h._id}>
                        <td style={{ width: "50px" }}>
                          <AvatarBadge
                            name={h.name}
                            id={h.id || h._id}
                            size={36}
                            src={h.avatar_url || (h as any).image}
                          />
                        </td>
                        <td>
                          <strong>{h.name} {h.surname || ""}</strong>
                          {h.age ? ` (${h.age})` : ""}
                        </td>
                        <td>
                          <span
                            className="ai-host-flavor-badge"
                            style={{
                              backgroundColor: flavorStyle.bg,
                              color: flavorStyle.text,
                              borderColor: flavorStyle.border,
                            }}
                          >
                            {h.flavor || "General"}
                          </span>
                        </td>
                        <td className="text-muted text-truncate" style={{ maxWidth: "200px" }}>
                          {h.tagline ? `“${h.tagline}”` : "-"}
                        </td>
                        <td>{h.language || "Hindi"}</td>
                        <td>
                          <span className="badge bg-warning text-dark">
                            {h.chatRate || 10} coins/msg
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info me-2"
                            onClick={() => setQaModalHost(h)}
                            title="Run QA Test"
                          >
                            <FaFlask /> QA
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenChat(h.id || h._id || "", "host")}
                          >
                            <FaComments /> Chat
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* IMPORT JSON MODAL */}
      {showImportModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", zIndex: 1055 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow" style={{ borderRadius: "10px" }}>
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark fs-16 d-flex align-items-center gap-2">
                  <FaFileUpload style={{ color: "#8F6DFF" }} /> Bulk Import AI Profiles (JSON)
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowImportModal(false)}
                ></button>
              </div>

              <div className="modal-body px-4 py-3">
                <div className="mb-3">
                  <label className="form-label fw-bold fs-13 text-dark">
                    Upload a .json File
                  </label>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="form-control fs-13"
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

                <div className="mb-2">
                  <label className="form-label fw-bold fs-13 text-dark">
                    Or Paste JSON Array
                  </label>
                  <textarea
                    rows={8}
                    className="form-control fs-13 font-monospace"
                    style={{ backgroundColor: "#f8fafc", padding: "10px" }}
                    placeholder='[&#10;  {&#10;    "name": "Aanya",&#10;    "gender": "female",&#10;    "age": 22,&#10;    "personality": ["Friendly", "Smart"]&#10;  }&#10;]'
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer border-top px-4 py-3">
                <button
                  type="button"
                  className="btn btn-light border ai-btn"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary ai-btn"
                  style={{ backgroundColor: "#8F6DFF", borderColor: "#8F6DFF" }}
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

      {/* AI PROMPT BRIEF MODAL */}
      {showPromptModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", zIndex: 1055 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow" style={{ borderRadius: "10px" }}>
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark fs-16 d-flex align-items-center gap-2">
                  <FaRobot style={{ color: "#0ea5e9" }} /> AI Persona Generation Prompt Brief
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPromptModal(false)}
                ></button>
              </div>

              <div className="modal-body px-4 py-3">
                <p className="text-muted fs-13 mb-2">
                  Paste this brief into ChatGPT or Claude to generate a batch of valid personas in JSON format:
                </p>
                <textarea
                  readOnly
                  rows={10}
                  className="form-control fs-12 font-monospace"
                  style={{ backgroundColor: "#f8fafc" }}
                  value={promptText}
                />
              </div>

              <div className="modal-footer border-top px-4 py-3 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary ai-btn"
                  onClick={() => setShowPromptModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary ai-btn"
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

      {/* HOST QA MODAL */}
      {qaModalHost && (
        <HostQAModal
          host={qaModalHost}
          onClose={() => setQaModalHost(null)}
        />
      )}
    </>
  );
};

export default AiDiscoverComponent;
