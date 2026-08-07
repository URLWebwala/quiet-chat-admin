import React, { useEffect, useState } from "react";
import Button from "@/extra/Button";
import Table from "@/extra/Table";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { ExInput } from "@/extra/Input";
import { apiInstanceFetch } from "@/api/axiosApi";
import { Success, Secondary } from "@/api/toastServices";

interface CustomTask {
  _id: string;
  title: string;
  description: string;
  actionUrl: string;
  rewardPoints: number;
  requireProof: boolean;
  maxCompletionsPerUser: number;
  totalCompletions: number;
  isActive: boolean;
  createdAt: string;
}

const CustomTaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<CustomTask[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog State
  const [openModal, setOpenModal] = useState(false);
  const [editingTask, setEditingTask] = useState<CustomTask | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [rewardPoints, setRewardPoints] = useState(50);
  const [requireProof, setRequireProof] = useState(true);
  const [maxCompletionsPerUser, setMaxCompletionsPerUser] = useState(1);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await apiInstanceFetch.get("/admin/customTask/fetch");
      if (res?.status) {
        setTasks(res.tasks || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setActionUrl("");
    setRewardPoints(50);
    setRequireProof(true);
    setMaxCompletionsPerUser(1);
    setOpenModal(true);
  };

  const handleOpenEditModal = (task: CustomTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setActionUrl(task.actionUrl || "");
    setRewardPoints(task.rewardPoints || 50);
    setRequireProof(task.requireProof);
    setMaxCompletionsPerUser(task.maxCompletionsPerUser || 1);
    setOpenModal(true);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      Secondary("Task title is required");
      return;
    }

    try {
      if (editingTask) {
        const res = await apiInstanceFetch.patch(`/admin/customTask/update?taskId=${editingTask._id}`, {
          title,
          description,
          actionUrl,
          rewardPoints,
          requireProof,
          maxCompletionsPerUser,
        });
        if (res?.status) {
          Success("Task updated successfully!");
          setOpenModal(false);
          fetchTasks();
        }
      } else {
        const res = await apiInstanceFetch.post("/admin/customTask/create", {
          title,
          description,
          actionUrl,
          rewardPoints,
          requireProof,
          maxCompletionsPerUser,
        });
        if (res?.status) {
          Success("Task created successfully!");
          setOpenModal(false);
          fetchTasks();
        }
      }
    } catch (err: any) {
      console.error(err);
      Secondary("Failed to save task");
    }
  };

  const handleToggleActive = async (task: CustomTask) => {
    try {
      const res = await apiInstanceFetch.patch(`/admin/customTask/update?taskId=${task._id}`, {
        isActive: !task.isActive,
      });
      if (res?.status) {
        fetchTasks();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task? All proof submissions for this task will also be deleted.")) {
      return;
    }
    try {
      const res = await apiInstanceFetch.delete(`/admin/customTask/delete?taskId=${taskId}`);
      if (res?.status) {
        Success("Task deleted successfully");
        fetchTasks();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const columns = [
    {
      Header: "Task Title",
      Cell: ({ row }: { row: CustomTask }) => (
        <div>
          <div className="fw-semibold">{row.title}</div>
          <small className="text-muted text-truncate d-block" style={{ maxWidth: "250px" }}>
            {row.description || "No description"}
          </small>
        </div>
      ),
    },
    {
      Header: "Action URL",
      Cell: ({ row }: { row: CustomTask }) => (
        row.actionUrl ? (
          <a href={row.actionUrl} target="_blank" rel="noreferrer" className="text-primary text-truncate d-block" style={{ maxWidth: "200px" }}>
            {row.actionUrl}
          </a>
        ) : (
          <span className="text-muted">-</span>
        )
      ),
    },
    {
      Header: "Reward Points",
      Cell: ({ row }: { row: CustomTask }) => (
        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 fs-6">
          +{row.rewardPoints} Points
        </span>
      ),
    },
    {
      Header: "Proof Required",
      Cell: ({ row }: { row: CustomTask }) => (
        <span className={`badge ${row.requireProof ? "bg-warning-subtle text-warning border border-warning-subtle" : "bg-info-subtle text-info border border-info-subtle"}`}>
          {row.requireProof ? "Screenshot Proof" : "Instant Reward"}
        </span>
      ),
    },
    {
      Header: "Completions",
      Cell: ({ row }: { row: CustomTask }) => (
        <span>{row.totalCompletions || 0} users</span>
      ),
    },
    {
      Header: "Status",
      Cell: ({ row }: { row: CustomTask }) => (
        <ToggleSwitch checked={row.isActive} onChange={() => handleToggleActive(row)} />
      ),
    },
    {
      Header: "Actions",
      Cell: ({ row }: { row: CustomTask }) => (
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-primary" onClick={() => handleOpenEditModal(row)} title="Edit Task">
            <i className="ri-pencil-line"></i>
          </button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteTask(row._id)} title="Delete Task">
            <i className="ri-delete-bin-line"></i>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="card border-0 shadow-sm p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h5 className="mb-1">Custom Earn Tasks</h5>
          <p className="text-muted small mb-0">Create custom tasks (Instagram, PlayStore review, YouTube, Telegram) with points & proof verification</p>
        </div>
        <Button text="Create New Task" icon="ri-add-line" onClick={handleOpenCreateModal} />
      </div>

      <Table data={tasks} mapData={columns} />

      {/* Modal Form */}
      {openModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title">{editingTask ? "Edit Custom Task" : "Create New Custom Task"}</h5>
                <button type="button" className="btn-close" onClick={() => setOpenModal(false)}></button>
              </div>
              <form onSubmit={handleSubmitTask}>
                <div className="modal-body d-flex flex-column gap-3">
                  <ExInput
                    label="Task Title *"
                    placeholder="e.g. Follow us on Instagram"
                    value={title}
                    onChange={(e: any) => setTitle(e.target.value)}
                  />
                  <div>
                    <label className="form-label small text-muted">Description / Instructions</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g. Follow @quietchatapp on Instagram, take a screenshot of your following screen and submit here."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <ExInput
                    label="Action URL (Link to open)"
                    placeholder="https://instagram.com/xxx or https://play.google.com/..."
                    value={actionUrl}
                    onChange={(e: any) => setActionUrl(e.target.value)}
                  />
                  <div className="row g-3">
                    <div className="col-6">
                      <ExInput
                        label="Reward Points *"
                        type="number"
                        placeholder="100"
                        value={rewardPoints}
                        onChange={(e: any) => setRewardPoints(Number(e.target.value))}
                      />
                    </div>
                    <div className="col-6">
                      <ExInput
                        label="Max Completions / User"
                        type="number"
                        placeholder="1"
                        value={maxCompletionsPerUser}
                        onChange={(e: any) => setMaxCompletionsPerUser(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 mt-2">
                    <div>
                      <div className="fw-semibold small">Require Screenshot Proof</div>
                      <div className="text-muted extra-small">If enabled, admin must verify screenshot proof before awarding points</div>
                    </div>
                    <ToggleSwitch checked={requireProof} onChange={() => setRequireProof(!requireProof)} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setOpenModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4">
                    {editingTask ? "Update Task" : "Create Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTaskManagement;
