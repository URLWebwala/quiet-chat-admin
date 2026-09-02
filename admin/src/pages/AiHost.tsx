import { useState } from "react";
import { FakeHost } from "@/component/host/FakeHost";
import RootLayout from "@/component/layout/Layout";
import Button from "@/extra/Button";
import image from "@/assets/images/bannerImage.png";
import { useRouter } from "next/router";
import Title from "@/extra/Title";
import { fetchAiProfiles, importAiProfiles, fetchImportPrompt } from "@/utils/aiChatApi";
import { toast } from "react-toastify";
import { FaFileDownload, FaFileUpload, FaRobot, FaCopy, FaCheck } from "react-icons/fa";

const AiHost = () => {
  const router = useRouter();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [promptText, setPromptText] = useState("");
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleExport = async () => {
    setExporting(true);
    try {
      const profiles = await fetchAiProfiles();
      const exportData = profiles && profiles.length > 0 ? profiles : [];
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai_host_profiles_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("AI Host profiles exported successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to export AI Host profiles");
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
      const result = await importAiProfiles(importJsonText.trim());
      toast.success(
        result?.message || `Successfully imported ${result?.imported ?? ""} AI host profiles!`
      );
      setShowImportModal(false);
      setImportJsonText("");
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      console.error("Import error:", err);
      let errorDetail = err?.message || "Import failed. Please verify JSON schema.";
      if (err?.errors && Array.isArray(err.errors)) {
        const msgs = err.errors.map((e: any) => `Item ${e.index !== undefined ? e.index + 1 : "?"}: ${e.message} ${e.field ? `(field: ${e.field})` : ""}`);
        errorDetail += "\n" + msgs.join("\n");
      } else if (typeof err === "string") {
        errorDetail = err;
      }
      toast.error(errorDetail);
    } finally {
      setImporting(false);
    }
  };

  const handleOpenPrompt = async () => {
    setShowPromptModal(true);
    setCopiedPrompt(false);
    try {
      const text = await fetchImportPrompt();
      setPromptText(text || "No prompt template returned from server.");
    } catch (err: any) {
      setPromptText("Failed to load AI Prompt Brief.");
    }
  };

  const handleCopyPrompt = () => {
    if (!promptText) return;
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    toast.success("AI prompt brief copied to clipboard!");
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <>
      <style jsx global>{`
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
      `}</style>

      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <Title name="AI Host List" />
        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* AI Prompt Brief */}
          <button
            type="button"
            className="btn btn-outline-info ai-action-btn"
            onClick={handleOpenPrompt}
            title="Get AI Generation Prompt Brief"
          >
            <FaRobot />
            <span>AI Prompt Brief</span>
          </button>

          {/* Export JSON */}
          <button
            type="button"
            className="btn btn-outline-success ai-action-btn"
            onClick={handleExport}
            disabled={exporting}
            title="Export AI Host profiles to JSON"
          >
            <FaFileDownload />
            <span>{exporting ? "Exporting..." : "Export (JSON)"}</span>
          </button>

          {/* Import JSON */}
          <button
            type="button"
            className="btn btn-outline-primary ai-action-btn"
            style={{ borderColor: "#8F6DFF", color: "#8F6DFF" }}
            onClick={() => setShowImportModal(true)}
            title="Import AI Host profiles from JSON"
          >
            <FaFileUpload />
            <span>Import (JSON)</span>
          </button>

          {/* Add AI Host */}
          <div className="betBox">
            <Button
              className={`bg-button p-10 text-white m10-bottom `}
              bIcon={image}
              text="Add AI Host"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("editAiHostData");
                }
                router.push("/AddAiHost");
              }}
            />
          </div>
        </div>
      </div>

      <FakeHost key={refreshKey} type="fake_host" hideAddButton={true} />

      {/* IMPORT PROFILES MODAL */}
      {showImportModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", zIndex: 9999, backdropFilter: "blur(4px)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
              <div className="modal-header border-bottom px-4 py-3" style={{ backgroundColor: "#f8fafc" }}>
                <h5 className="modal-title fw-bold text-dark fs-16 d-flex align-items-center gap-2">
                  <FaFileUpload style={{ color: "#8F6DFF", fontSize: "1.2rem" }} /> Import AI Host Profiles
                </h5>
                <button
                  type="button"
                  className="btn-close shadow-none"
                  onClick={() => setShowImportModal(false)}
                ></button>
              </div>

              <div className="modal-body px-4 py-4">
                <p className="text-muted fs-14 mb-4">
                  Upload a <code>.json</code> file or paste a JSON array of persona profiles. If any persona has errors, the batch will report the exact line to fix.
                </p>

                <div className="mb-4">
                  <label className="form-label fw-bold fs-13 text-dark mb-2">Upload JSON File</label>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="form-control fs-13 custom-file-input"
                    style={{ borderRadius: "8px", padding: "8px", border: "1px dashed #cbd5e1", backgroundColor: "#f8fafc", cursor: "pointer" }}
                    onChange={handleFileUpload}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold fs-13 text-dark mb-2">Or Paste JSON Data</label>
                  <textarea
                    rows={8}
                    className="form-control fs-13 font-monospace custom-textarea"
                    style={{ borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px" }}
                    placeholder='[&#10;  {&#10;    "name": "Aanya",&#10;    "gender": "female",&#10;    "age": 22,&#10;    "personality": ["Friendly", "Smart"],&#10;    "type": "local"&#10;  }&#10;]'
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                  />
                </div>

                <div className="mt-3 p-3 rounded" style={{ backgroundColor: "#f3f0ff", border: "1px solid #e9d5ff" }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fs-13 text-muted">Need a template for generating this JSON?</span>
                    <button
                      type="button"
                      className="btn btn-sm fw-bold px-3 py-1"
                      style={{ backgroundColor: "#8F6DFF", color: "#fff", borderRadius: "6px" }}
                      onClick={() => {
                        setShowImportModal(false);
                        handleOpenPrompt();
                      }}
                    >
                      Get AI Prompt
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top px-4 py-3" style={{ backgroundColor: "#fcfcfc" }}>
                <button
                  type="button"
                  className="btn btn-light ai-action-btn border"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn text-white ai-action-btn"
                  style={{ backgroundColor: "#8F6DFF" }}
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
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", zIndex: 9999 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow" style={{ borderRadius: "8px" }}>
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
                  Paste this brief into ChatGPT / Claude to generate a valid JSON file of personas ready for 1-click import:
                </p>

                <textarea
                  readOnly
                  rows={12}
                  className="form-control fs-12 font-monospace"
                  style={{ borderRadius: "6px", backgroundColor: "#f8fafc" }}
                  value={promptText}
                />
              </div>

              <div className="modal-footer border-top px-4 py-3 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary ai-action-btn"
                  onClick={() => setShowPromptModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary ai-action-btn"
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
    </>
  );
};

AiHost.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiHost;
