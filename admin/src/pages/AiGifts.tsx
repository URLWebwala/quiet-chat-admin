import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Title from "@/extra/Title";
import {
  fetchAiGifts,
  createAiGift,
  updateAiGift,
  deleteAiGift,
  AiGift,
} from "@/utils/aiChatApi";
import { toast } from "react-toastify";
import { FaGift, FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import CustomSelect from "@/extra/CustomSelect";

const AiGifts = () => {
  const [gifts, setGifts] = useState<AiGift[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingGift, setEditingGift] = useState<AiGift | null>(null);

  // Form fields
  const [name, setName] = useState<string>("");
  const [gender, setGender] = useState<"female" | "male">("female");
  const [coinPrice, setCoinPrice] = useState<number>(50);
  const [description, setDescription] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadGifts();
  }, [genderFilter]);

  const loadGifts = async () => {
    setLoading(true);
    try {
      const data = await fetchAiGifts(genderFilter === "all" ? undefined : genderFilter);
      setGifts(data);
    } catch (e) {
      console.error("Failed to load AI gifts:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingGift(null);
    setName("");
    setGender("female");
    setCoinPrice(50);
    setDescription("");
    setIsActive(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (gift: AiGift) => {
    setEditingGift(gift);
    setName(gift.name || "");
    setGender(gift.gender || "female");
    setCoinPrice(gift.coin_price || 0);
    setDescription(gift.description || "");
    setIsActive(gift.is_active !== undefined ? gift.is_active : true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Gift name is required!");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required!");
      return;
    }

    setSubmitting(true);
    try {
      const giftPayload = {
        name: name.trim(),
        gender,
        coin_price: Number(coinPrice),
        description: description.trim(),
        is_active: isActive,
      };

      if (editingGift) {
        const updated = await updateAiGift(editingGift.id, giftPayload);
        if (updated) {
          toast.success("AI Gift updated successfully!");
          setShowModal(false);
          loadGifts();
        } else {
          toast.error("Failed to update AI gift");
        }
      } else {
        const created = await createAiGift(giftPayload);
        if (created) {
          toast.success("AI Gift created successfully!");
          setShowModal(false);
          loadGifts();
        } else {
          toast.error("Failed to create AI gift");
        }
      }
    } catch (err) {
      toast.error("An error occurred while saving gift.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (giftId: string) => {
    if (!confirm("Are you sure you want to delete this AI gift?")) return;

    try {
      const ok = await deleteAiGift(giftId);
      if (ok) {
        toast.success("Gift deleted successfully!");
        loadGifts();
      } else {
        toast.error("Failed to delete gift");
      }
    } catch (e) {
      toast.error("Error deleting gift");
    }
  };

  return (
    <>
      <style jsx global>{`
        .ai-sq-input,
        .ai-sq-textarea,
        .ai-sq-select {
          border-radius: 6px !important;
          border: 1.5px solid #cbd5e1 !important;
          padding: 8px 12px !important;
          font-size: 13.5px !important;
          color: #0f172a !important;
          background-color: #ffffff !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) !important;
          transition: all 0.15s ease !important;
          width: 100%;
        }
        .ai-sq-input:focus,
        .ai-sq-textarea:focus,
        .ai-sq-select:focus {
          border-color: #8f6dff !important;
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(143, 109, 255, 0.2) !important;
        }
        .ai-sq-card {
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
          background: #ffffff !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
        }
        .ai-sq-btn {
          border-radius: 6px !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          padding: 7px 16px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          transition: all 0.15s ease !important;
        }
        .ai-sq-pill {
          border-radius: 4px !important;
          font-weight: 500 !important;
        }
      `}</style>

      <div className="p-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <Title name="AI Virtual Gifts Catalog" display="none" />
          <button
            className="btn text-white ai-sq-btn shadow-sm"
            style={{ backgroundColor: "#8F6DFF" }}
            onClick={handleOpenAddModal}
          >
            <FaPlus />
            <span>Add AI Gift</span>
          </button>
        </div>

        <div className="card ai-sq-card p-4 mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="fs-13 fw-semibold text-dark">Persona Gender:</span>
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ai-sq-btn ${
                    genderFilter === "all" ? "btn-dark text-white" : "btn-outline-secondary"
                  }`}
                  onClick={() => setGenderFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`btn ai-sq-btn ${
                    genderFilter === "female" ? "btn-danger text-white" : "btn-outline-secondary"
                  }`}
                  onClick={() => setGenderFilter("female")}
                >
                  Female Personas
                </button>
                <button
                  type="button"
                  className={`btn ai-sq-btn ${
                    genderFilter === "male" ? "btn-primary text-white" : "btn-outline-secondary"
                  }`}
                  onClick={() => setGenderFilter("male")}
                >
                  Male Personas
                </button>
              </div>
            </div>
            <span className="badge bg-light text-dark border ai-sq-pill fs-12 px-3 py-2">
              Total Gifts: {gifts.length}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted mt-2 fs-13">Loading AI gift catalog...</p>
            </div>
          ) : gifts.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FaGift className="fs-1 text-secondary mb-3 d-block mx-auto" />
              <h5 className="fw-bold text-dark">No AI Gifts Found</h5>
              <p className="fs-13 mb-3">Click "Add AI Gift" to create gifts for AI personas to ask for in chat.</p>
              <button
                type="button"
                className="btn text-white ai-sq-btn"
                style={{ backgroundColor: "#8F6DFF" }}
                onClick={handleOpenAddModal}
              >
                <FaPlus /> Create Gift
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle table-hover fs-13 mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Gift Name</th>
                    <th>Persona Gender</th>
                    <th>Coin Price</th>
                    <th>Description (Prompt Context)</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {gifts.map((gift) => (
                    <tr key={gift.id}>
                      <td>
                        <span className="fw-bold text-dark">{gift.name}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ai-sq-pill px-2.5 py-1 ${
                            gift.gender === "female"
                              ? "bg-danger-subtle text-danger border border-danger-subtle"
                              : "bg-primary-subtle text-primary border border-primary-subtle"
                          }`}
                        >
                          {gift.gender}
                        </span>
                      </td>
                      <td>
                        <span className="fw-bold text-warning-emphasis">
                          <i className="ri-coin-fill text-warning me-1"></i>
                          {gift.coin_price} coins
                        </span>
                      </td>
                      <td style={{ maxWidth: "350px" }}>
                        <small className="text-muted d-block text-truncate" title={gift.description}>
                          {gift.description}
                        </small>
                      </td>
                      <td>
                        <span
                          className={`badge ai-sq-pill px-2.5 py-1 ${
                            gift.is_active ? "bg-success text-white" : "bg-secondary text-white"
                          }`}
                        >
                          {gift.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-info ai-sq-btn px-2.5 py-1 me-1"
                          onClick={() => handleOpenEditModal(gift)}
                          title="Edit Gift"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger ai-sq-btn px-2.5 py-1"
                          onClick={() => handleDelete(gift.id)}
                          title="Delete Gift"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CREATE / EDIT GIFT MODAL */}
        {showModal && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", zIndex: 9999 }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content ai-sq-card border-0 shadow">
                <div className="modal-header border-bottom px-4 py-3">
                  <h5 className="modal-title fw-bold text-dark fs-16 d-flex align-items-center gap-2">
                    <FaGift style={{ color: "#8F6DFF" }} />
                    {editingGift ? "Edit AI Gift" : "Create New AI Gift"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body px-4 py-3">
                    <div className="mb-3">
                      <label className="form-label fs-13 fw-semibold text-dark">Gift Name *</label>
                      <input
                        type="text"
                        className="ai-sq-input"
                        placeholder="e.g. Chocolate Bar, Rose Bouquet"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label fs-13 fw-semibold text-dark mb-1">Persona Gender *</label>
                        <CustomSelect
                          options={[
                            { value: "female", label: "Female Persona" },
                            { value: "male", label: "Male Persona" },
                          ]}
                          value={gender}
                          onChange={(val) => setGender(val)}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fs-13 fw-semibold text-dark">Coin Price *</label>
                        <input
                          type="number"
                          min="0"
                          className="ai-sq-input"
                          value={coinPrice}
                          onChange={(e) => setCoinPrice(Number(e.target.value))}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fs-13 fw-semibold text-dark">
                        Description * <span className="text-muted fw-normal">(Prompt context for AI)</span>
                      </label>
                      <textarea
                        rows={3}
                        className="ai-sq-textarea"
                        placeholder="e.g. A small bar of chocolate. The tiniest, most casual ask when she feels like a sweet treat..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                      />
                      <small className="text-muted fs-11 mt-1 d-block">
                        This text is handed to the AI model to frame how and when the persona asks for this gift.
                      </small>
                    </div>

                    <div className="form-check mb-2">
                      <input
                        className="form-check-input cursor-pointer"
                        type="checkbox"
                        id="isActiveGiftSwitch"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <label className="form-check-label fs-13 fw-semibold text-dark cursor-pointer ms-1" htmlFor="isActiveGiftSwitch">
                        Active (Persona can ask for this gift in chat)
                      </label>
                    </div>
                  </div>

                  <div className="modal-footer border-top px-4 py-3 d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary ai-sq-btn"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn text-white ai-sq-btn shadow-sm"
                      style={{ backgroundColor: "#8F6DFF" }}
                      disabled={submitting}
                    >
                      <FaSave />
                      <span>{submitting ? "Saving..." : editingGift ? "Update Gift" : "Create Gift"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

AiGifts.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiGifts;
