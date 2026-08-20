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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Title name="AI Virtual Gifts Catalog" />
        <button
          className="btn btn-primary btn-sm d-flex align-items-center gap-1"
          onClick={handleOpenAddModal}
        >
          <i className="ri-add-line fs-16"></i> Add AI Gift
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-13 text-muted">Persona Gender:</span>
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${genderFilter === "all" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setGenderFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`btn ${genderFilter === "female" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setGenderFilter("female")}
              >
                Female Personas
              </button>
              <button
                type="button"
                className={`btn ${genderFilter === "male" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setGenderFilter("male")}
              >
                Male Personas
              </button>
            </div>
          </div>
          <span className="badge bg-light text-dark border fs-12">
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
            <i className="ri-gift-line fs-1 text-primary mb-2 d-block"></i>
            <h5>No AI Gifts Found</h5>
            <p className="fs-13">Click "Add AI Gift" to create gifts for AI personas to ask for in chat.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle table-hover fs-13">
              <thead className="table-light">
                <tr>
                  <th>Gift Name</th>
                  <th>Persona Gender</th>
                  <th>Coin Price</th>
                  <th>Description (Prompt Frame)</th>
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
                        className={`badge ${
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
                      <span className={`badge ${gift.is_active ? "bg-success" : "bg-secondary"}`}>
                        {gift.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleOpenEditModal(gift)}
                      >
                        <i className="ri-edit-line"></i> Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(gift.id)}
                      >
                        <i className="ri-delete-bin-line"></i> Delete
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
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">
                  {editingGift ? "Edit AI Gift" : "Create New AI Gift"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fs-13 fw-semibold">Gift Name</label>
                    <input
                      type="text"
                      className="form-control bg-light fs-13"
                      placeholder="e.g. Chocolate Bar, Rose Bouquet"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fs-13 fw-semibold">Persona Gender</label>
                      <select
                        className="form-select bg-light fs-13"
                        value={gender}
                        onChange={(e: any) => setGender(e.target.value)}
                      >
                        <option value="female">Female Persona</option>
                        <option value="male">Male Persona</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fs-13 fw-semibold">Coin Price</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control bg-light fs-13"
                        value={coinPrice}
                        onChange={(e) => setCoinPrice(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fs-13 fw-semibold">
                      Description (Prompt Context for AI)
                    </label>
                    <textarea
                      rows={3}
                      className="form-control bg-light fs-13"
                      placeholder="e.g. A small bar of chocolate. The tiniest, most casual ask when she feels like a sweet treat..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    ></textarea>
                    <small className="text-muted fs-11">
                      This text is handed to the AI model to frame how and when the persona asks for this gift.
                    </small>
                  </div>

                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isActiveGiftSwitch"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <label className="form-check-input-label fs-13" htmlFor="isActiveGiftSwitch">
                      Active (Persona can ask for this gift)
                    </label>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary px-4"
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : editingGift ? "Update Gift" : "Create Gift"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

AiGifts.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default AiGifts;
