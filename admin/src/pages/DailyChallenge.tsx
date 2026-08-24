import React, { useEffect, useState } from "react";
import RootLayout from "@/component/layout/Layout";
import Button from "@/extra/Button";
import Table from "@/extra/Table";
import { apiInstanceFetch } from "@/utils/ApiInstance";
import { setToast } from "@/utils/toastServices";
import CommonDialog from "@/utils/CommonDialog";

interface CustomTask {
  _id: string;
  title: string;
  rewardPoints: number;
}

interface DailyChallengeItem {
  _id: string;
  title: string;
  description: string;
  date: string;
  startTime?: string;
  endTime?: string;
  tasks: CustomTask[];
  bonusCoins: number;
  isActive: boolean;
}

const DailyChallenge = () => {
  const [challenges, setChallenges] = useState<DailyChallengeItem[]>([]);
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState<string>("00:00");
  const [endTime, setEndTime] = useState<string>("23:59");
  const [bonusCoins, setBonusCoins] = useState<number>(50);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    fetchChallenges();
    fetchCustomTasks();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const res = await apiInstanceFetch.get("api/admin/dailyChallenge/list");
      if (res?.status) {
        setChallenges(res.data || []);
      }
    } catch (err: any) {
      console.error("Error fetching challenges:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomTasks = async () => {
    try {
      const res = await apiInstanceFetch.get("api/admin/customTask/fetch");
      if (res?.status) {
        setCustomTasks(res.tasks || res.data || []);
      }
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
    }
  };

  const openCreateModal = () => {
    setEditId(null);
    setTitle("Daily Target Challenge");
    setDescription("Complete all target tasks today to earn bonus reward coins!");
    setDate(new Date().toISOString().split("T")[0]);
    setStartTime("00:00");
    setEndTime("23:59");
    setBonusCoins(50);
    setSelectedTaskIds([]);
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (item: DailyChallengeItem) => {
    setEditId(item._id);
    setTitle(item.title);
    setDescription(item.description || "");
    setDate(item.date);

    if (item.startTime) {
      const d = new Date(item.startTime);
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      setStartTime(`${hours}:${mins}`);
    } else {
      setStartTime("00:00");
    }

    if (item.endTime) {
      const d = new Date(item.endTime);
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      setEndTime(`${hours}:${mins}`);
    } else {
      setEndTime("23:59");
    }

    setBonusCoins(item.bonusCoins || 50);
    setSelectedTaskIds(item.tasks?.map((t) => t._id) || []);
    setIsActive(item.isActive);
    setShowModal(true);
  };

  const handleTaskToggle = (taskId: string) => {
    if (selectedTaskIds.includes(taskId)) {
      setSelectedTaskIds(selectedTaskIds.filter((id) => id !== taskId));
    } else {
      setSelectedTaskIds([...selectedTaskIds, taskId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      setToast("error", "Please provide Title and Date");
      return;
    }
    if (selectedTaskIds.length === 0) {
      setToast("error", "Please select at least 1 Custom Task for the Daily Challenge");
      return;
    }

    try {
      const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
      const endDateTime = new Date(`${date}T${endTime}:59`).toISOString();

      const payload = {
        title,
        description,
        date,
        startTime: startDateTime,
        endTime: endDateTime,
        tasks: selectedTaskIds,
        bonusCoins,
        isActive,
      };

      let res;
      if (editId) {
        res = await apiInstanceFetch.put(`api/admin/dailyChallenge/update?challengeId=${editId}`, payload);
      } else {
        res = await apiInstanceFetch.post("api/admin/dailyChallenge/create", payload);
      }

      if (res?.status) {
        setToast("success", res.message || "Daily Challenge saved successfully!");
        setShowModal(false);
        fetchChallenges();
      }
    } catch (err: any) {
      console.error("Error saving challenge:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await apiInstanceFetch.delete(`api/admin/dailyChallenge/delete?challengeId=${deleteId}`);
      if (res?.status) {
        setToast("success", "Daily Challenge deleted successfully");
        setDeleteId(null);
        fetchChallenges();
      }
    } catch (err: any) {
      console.error("Error deleting challenge:", err);
    }
  };

  const columns = [
    {
      Header: "Date & Time Window",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: DailyChallengeItem }) => {
        const startT = row?.startTime ? new Date(row.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "00:00";
        const endT = row?.endTime ? new Date(row.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "23:59";
        return (
          <div className="text-center">
            <div className="fw-bold text-primary" style={{ fontSize: "14px" }}>{row?.date}</div>
            <small className="text-muted fw-semibold" style={{ fontSize: "11px" }}>
              ⏱️ {startT} - {endT}
            </small>
          </div>
        );
      },
    },
    {
      Header: "Challenge Title",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: DailyChallengeItem }) => (
        <div className="text-center">
          <div className="fw-bold text-dark" style={{ fontSize: "14px" }}>{row?.title}</div>
          <small className="text-secondary" style={{ fontSize: "12px" }}>{row?.description}</small>
        </div>
      ),
    },
    {
      Header: "Included Tasks",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: DailyChallengeItem }) => (
        <div className="text-center">
          <span className="badge bg-info text-white" style={{ fontSize: "12px", padding: "5px 10px", fontWeight: "600" }}>
            {row?.tasks?.length || 0} Tasks Selected
          </span>
          <div className="text-muted mt-1" style={{ fontSize: "12px" }}>
            {row?.tasks?.slice(0, 3).map((t: CustomTask) => t?.title || "Task").join(", ")}
            {(row?.tasks?.length || 0) > 3 ? "..." : ""}
          </div>
        </div>
      ),
    },
    {
      Header: "Bonus Coins",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: DailyChallengeItem }) => (
        <div className="d-flex justify-content-center">
          <span
            className="badge bg-warning text-dark fw-bold"
            style={{ fontSize: "13px", padding: "6px 12px", borderRadius: "6px" }}
          >
            🎁 +{row?.bonusCoins} Coins
          </span>
        </div>
      ),
    },
    {
      Header: "Status",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: DailyChallengeItem }) => {
        const isExpired = row?.endTime ? new Date() > new Date(row.endTime) : false;
        return (
          <div className="d-flex justify-content-center">
            <span
              className={`badge ${isExpired ? "bg-secondary" : row?.isActive ? "bg-success" : "bg-danger"}`}
              style={{ fontSize: "12px", padding: "5px 10px", fontWeight: "600" }}
            >
              {isExpired ? "Expired ⏱️" : row?.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        );
      },
    },
    {
      Header: "Actions",
      thClass: "text-center",
      tdClass: "text-center",
      Cell: ({ row }: { row: DailyChallengeItem }) => (
        <div className="d-flex gap-2 justify-content-center align-items-center">
          <button
            className="btn btn-sm btn-outline-primary"
            style={{ fontSize: "12px", padding: "4px 10px" }}
            onClick={() => openEditModal(row)}
          >
            <i className="ri-edit-line"></i> Edit
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            style={{ fontSize: "12px", padding: "4px 10px" }}
            onClick={() => setDeleteId(row?._id)}
          >
            <i className="ri-delete-bin-line"></i> Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <RootLayout>
      <div className="mainPage">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="fw-bold text-dark mb-1">🔥 Daily Target & Challenges Management</h4>
            <p className="text-secondary small mb-0">
              Create and manage daily target challenges with start/end timer windows for bonus rewards.
            </p>
          </div>
          <Button
            className="btn btn-primary"
            text="Create New Daily Target"
            onClick={openCreateModal}
          />
        </div>

        {/* Challenges Table */}
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-0">
            {loading ? (
              <div className="p-4 text-center">Loading Daily Challenges...</div>
            ) : (
              <Table data={challenges} mapData={columns} type="server" />
            )}
          </div>
        </div>
      </div>

      {/* Compact Clean Modal Overlay */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.55)",
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
              borderRadius: "16px",
              width: "100%",
              maxWidth: "600px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              overflow: "hidden",
              height: "auto",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#111827", margin: 0 }}>
                {editId ? "Edit Daily Target Challenge" : "Create New Daily Target Challenge"}
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModal(false)}
                style={{ fontSize: "12px" }}
              ></button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="p-4" style={{ overflowY: "auto", flex: 1 }}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small text-dark fw-bold mb-1">Target Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-dark fw-bold mb-1">Start Time (00:00)</label>
                    <input
                      type="time"
                      className="form-control"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-dark fw-bold mb-1">End Time (23:59)</label>
                    <input
                      type="time"
                      className="form-control"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-12">
                    <label className="form-label small text-dark fw-bold mb-1">Bonus Coins Reward</label>
                    <input
                      type="number"
                      className="form-control"
                      value={bonusCoins}
                      onChange={(e) => setBonusCoins(Number(e.target.value))}
                      min="0"
                      required
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label small text-dark fw-bold mb-1">Challenge Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Saturday Mega Target Challenge"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label small text-dark fw-bold mb-1">Description</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Instructions or promo details for users..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>

                  {/* Custom Task Pool Multi-Select */}
                  <div className="col-md-12">
                    <label className="form-label small text-dark fw-bold mb-1 d-block">
                      Select Tasks from Custom Tasks Pool ({selectedTaskIds.length} Selected)
                    </label>
                    <div
                      className="border rounded-3 p-2"
                      style={{ maxHeight: "180px", overflowY: "auto", backgroundColor: "#f8f9fa" }}
                    >
                      {customTasks.length === 0 ? (
                        <div className="text-secondary small text-center py-3">
                          No custom tasks available. Please create custom tasks first in Custom Task manager.
                        </div>
                      ) : (
                        customTasks.map((t) => {
                          const isChecked = selectedTaskIds.includes(t._id);
                          return (
                            <div
                              key={t._id}
                              className={`form-check p-2 mb-2 rounded border ${isChecked ? "border-primary bg-white" : "bg-white"}`}
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <input
                                className="form-check-input ms-0 me-2"
                                type="checkbox"
                                id={`task-${t._id}`}
                                checked={isChecked}
                                onChange={() => handleTaskToggle(t._id)}
                                style={{ marginTop: 0 }}
                              />
                              <label className="form-check-label fw-bold cursor-pointer flex-grow-1 small text-dark mb-0" htmlFor={`task-${t._id}`}>
                                {t.title} <span className="badge bg-warning text-dark ms-2">+{t.rewardPoints} Coins</span>
                              </label>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isActiveSwitch"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <label className="form-check-label small fw-bold text-dark" htmlFor="isActiveSwitch">
                        Challenge Active Status
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="d-flex justify-content-end gap-2 px-4 py-3 border-top bg-light">
                <button type="button" className="btn btn-light px-4" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary px-4">
                  {editId ? "Update Target" : "Create Target"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <CommonDialog
          open={!!deleteId}
          onCancel={() => setDeleteId(null)}
          onConfirm={handleDelete}
          text={"Delete Daily Target"}
        />
      )}
    </RootLayout>
  );
};

export default DailyChallenge;
