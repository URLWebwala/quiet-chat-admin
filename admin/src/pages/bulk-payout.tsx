import React, { useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { setToast } from "@/utils/toastServices";
import { baseURL, key } from "@/utils/config";

export default function BulkPayout() {
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleDownloadTemplate = async (format: "bank" | "standard") => {
    try {
      setToast("info", "Generating Excel template...");
      const token = typeof window !== "undefined" ? sessionStorage.getItem("token") || localStorage.getItem("token") || "" : "";
      const uid = typeof window !== "undefined" ? sessionStorage.getItem("uid") || localStorage.getItem("uid") || "" : "";

      const response = await fetch(`${baseURL}api/admin/reward/payout/template?format=${format}`, {
        method: "GET",
        headers: {
          key: key,
          Authorization: token ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`) : "",
          "x-admin-uid": uid,
        },
      });

      if (!response.ok) {
        setToast("error", "Failed to download template");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Corporate_Bulk_Payout_${format}_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setToast("success", "Excel template downloaded!");
    } catch (err) {
      console.error(err);
      setToast("error", "Error downloading template");
    }
  };

  const handleUploadAndValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setToast("error", "Please select an Excel file (.xlsx)");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiInstanceFetch.post("api/admin/reward/payout/upload-excel", formData);
      if (res.status) {
        setValidationResult(res.data);
        setToast("success", `Corporate File validated: ${res.data.validRecords} valid records found.`);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessBatch = async () => {
    if (!validationResult || !validationResult.records) return;

    try {
      setProcessing(true);
      const res = await apiInstanceFetch.post("api/admin/reward/payout/process", {
        filename: file?.name || "corporate_bulk_payout.xlsx",
        records: validationResult.records,
      });

      if (res.status) {
        setToast("success", res.message);
        setValidationResult(null);
        setFile(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <RootLayout>
      <div className="main-content">
        <Title title="Bulk Payout Management" name="Bulk Payout" />

        {/* Stepper Header */}
        <div className="row mt-4 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 text-center bg-white h-100">
              <span className="badge bg-primary mb-2 mx-auto" style={{ width: "30px" }}>1</span>
              <h6 className="fw-bold mb-1">Download Template</h6>
              <div className="d-flex flex-column gap-2 mt-2">
                <button className="btn btn-sm btn-primary text-white fw-semibold" onClick={() => handleDownloadTemplate("bank")}>
                  <i className="ri-building-4-line me-1"></i> IDFC / Corporate Format
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => handleDownloadTemplate("standard")}>
                  <i className="ri-file-excel-line me-1"></i> Standard Format
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 text-center bg-white h-100">
              <span className="badge bg-primary mb-2 mx-auto" style={{ width: "30px" }}>2</span>
              <h6 className="fw-bold mb-1">Upload & Validate</h6>
              <small className="text-muted d-block mt-2">Supports IDFC, Axis, ICICI Corporate Excel files & Standard Excel</small>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 text-center bg-white h-100">
              <span className="badge bg-primary mb-2 mx-auto" style={{ width: "30px" }}>3</span>
              <h6 className="fw-bold mb-1">Preview & Verify</h6>
              <small className="text-muted d-block mt-2">Auto-verifies account numbers, IFSC codes & amounts</small>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 text-center bg-white h-100">
              <span className="badge bg-success mb-2 mx-auto" style={{ width: "30px" }}>4</span>
              <h6 className="fw-bold mb-1">Execute Batch Payout</h6>
              <small className="text-muted d-block mt-2">Process transactions & auto-mark withdrawals complete</small>
            </div>
          </div>
        </div>

        {/* Upload Box */}
        <div className="card shadow-sm border-0 p-4 mb-4">
          <h5 className="fw-bold mb-2">
            <i className="ri-upload-cloud-2-line text-primary me-2"></i>
            Upload Corporate Bank Payout Excel File (.xlsx / .csv)
          </h5>
          <p className="text-muted small mb-3">
            Upload your Bank Corporate Payout Excel sheet (with <code>Beneficiary Account Number</code>, <code>IFSC</code>, <code>Transaction Type</code>, <code>Amount</code>) to run auto-validation.
          </p>

          <form onSubmit={handleUploadAndValidate}>
            <div
              className="p-4 rounded-4 text-center mb-3 border-2 border-dashed position-relative"
              style={{
                backgroundColor: file ? "#f0e6ff" : "#f8fafc",
                borderColor: file ? "#7c4dff" : "#cbd5e1",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
              }}
            >
              <input
                type="file"
                className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                style={{ cursor: "pointer", zIndex: 10 }}
                accept=".xlsx, .xls, .csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />

              <div className="py-2">
                <i
                  className={`ri-file-excel-2-line display-4 d-block mb-2`}
                  style={{ color: file ? "#7c4dff" : "#64748b" }}
                ></i>

                {file ? (
                  <div>
                    <span className="badge bg-primary fs-6 px-3 py-2" style={{ backgroundColor: "#7c4dff" }}>
                      📄 Selected File: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                    <small className="d-block text-muted mt-2">Click to choose a different Excel file</small>
                  </div>
                ) : (
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Click to Browse or Drag & Drop Corporate Excel File</h6>
                    <small className="text-muted">Supports IDFC, Axis, ICICI, HDFC Bank Excel templates (.xlsx, .csv)</small>
                  </div>
                )}
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
              style={{ backgroundColor: "#7c4dff", borderColor: "#7c4dff", height: "50px", borderRadius: "12px" }}
              type="submit"
              disabled={loading || !file}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Validating Corporate Rows...
                </>
              ) : (
                <>
                  <i className="ri-checkbox-circle-line me-1 fs-5 align-middle"></i> Upload & Validate Corporate Excel
                </>
              )}
            </button>
          </form>
        </div>

        {/* Preview & Execution Section */}
        {validationResult && (
          <div className="card shadow-sm border-0 p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-1">Corporate File Validation Summary</h5>
                <span className="badge bg-info me-2">Total Rows: {validationResult.totalRecords}</span>
                <span className="badge bg-success me-2">Valid: {validationResult.validRecords}</span>
                <span className="badge bg-danger me-2">Invalid: {validationResult.invalidRecords}</span>
                <span className="badge bg-warning text-dark fw-bold">Total Payout: ₹{validationResult.totalAmount?.toFixed(2)}</span>
              </div>

              <button
                className="btn btn-success px-4 py-2 fw-bold shadow-sm"
                onClick={handleProcessBatch}
                disabled={processing || validationResult.validRecords === 0}
              >
                {processing ? "Processing Payout Batch..." : `Execute ${validationResult.validRecords} Valid Payouts →`}
              </button>
            </div>

            <div className="table-responsive mt-3">
              <table className="table table-sm table-hover align-middle border">
                <thead className="table-light">
                  <tr>
                    <th>Row #</th>
                    <th>Request / Ref No</th>
                    <th>Account Holder / Remarks</th>
                    <th>Beneficiary Account Number</th>
                    <th>IFSC Code</th>
                    <th>Payout Amount</th>
                    <th>Validation Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(validationResult.records || []).map((row: any, idx: number) => (
                    <tr key={idx} className={row.isValid ? "" : "table-danger"}>
                      <td>{row.rowNumber}</td>
                      <td className="fw-bold">{row.requestNumber}</td>
                      <td>{row.accountHolderName || "N/A"}</td>
                      <td><code>{row.accountNumber || row.upiId || "N/A"}</code></td>
                      <td><code>{row.ifscCode || "N/A"}</code></td>
                      <td className="fw-bold text-success">₹{row.amountCurrency?.toFixed(2)}</td>
                      <td>
                        {row.isValid ? (
                          <span className="badge bg-success">✓ Valid Record</span>
                        ) : (
                          <span className="badge bg-danger">{row.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </RootLayout>
  );
}
