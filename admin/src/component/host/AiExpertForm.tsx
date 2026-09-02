import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import CustomSelect from "@/extra/CustomSelect";
import {
  AiExpert,
  createAiExpert,
  updateAiExpert,
  fetchSingleExpert,
  fetchExpertOptions,
} from "@/utils/aiChatApi";
import femaleAvatar from "@/assets/images/female.png";
import maleAvatar from "@/assets/images/male.png";
import { baseURL } from "@/utils/config";
import {
  FaUserGraduate,
  FaSave,
  FaArrowLeft,
  FaRobot,
  FaGlobe,
  FaInfoCircle,
  FaPlus,
  FaTimes,
  FaCopy,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

interface AiExpertFormProps {
  initialData?: AiExpert;
  expertId?: string;
}

const EMPTY_EXPERT: Partial<AiExpert> = {
  category: "",
  specialty: "",
  tagline: "",
  gender: "female",
  name: "",
  surname: "",
  age: 28,
  home_place: "",
  appearance: "",
  occupation: "",
  daily_routine: "",
  bio: "",
  likes: [],
  dislikes: [],
  hobbies: [],
  values: "",
  quirks: "",
  texting_style: "",
  greeting: "",
  type: "local",
  timezone: "Asia/Kolkata",
};

const DEFAULT_CATEGORIES = [
  "Career & Exams",
  "Love & Dating",
  "Marriage & Family",
  "Mental Peace & Stress",
  "Money & Finance",
  "Fitness & Health",
  "Family & Society",
  "Friendship & Circle",
  "Love & Relationships",
  "Marriage & Commitment",
  "Mind & Wellbeing",
  "Work & Career",
];

// Modern Integrated Chip/Tag Input with clean spacing and rounded remove button
const ChipTagInput = ({
  label,
  placeholder,
  tags,
  onChange,
  badgeBg = "#8F6DFF",
}: {
  label: string;
  placeholder?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  badgeBg?: string;
}) => {
  const [val, setVal] = useState("");

  const addTag = () => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setVal("");
  };

  const removeTag = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  return (
    <div className="mb-2">
      <label className="form-label fw-semibold fs-13 text-dark mb-1">{label}</label>
      <div
        className="d-flex flex-wrap align-items-center bg-white ai-chip-container"
        style={{
          border: "1.5px solid #cbd5e1",
          borderRadius: "6px",
          minHeight: "44px",
          padding: "6px 8px",
          gap: "6px",
          transition: "all 0.15s ease",
        }}
      >
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="d-inline-flex align-items-center text-white fs-12 fw-medium shadow-sm"
            style={{
              backgroundColor: badgeBg,
              borderRadius: "4px",
              padding: "4px 8px 4px 10px",
              lineHeight: "1.4",
              gap: "6px",
            }}
          >
            <span>{tag}</span>
            <span
              role="button"
              className="d-inline-flex align-items-center justify-content-center cursor-pointer"
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.25)",
                fontSize: "12px",
                lineHeight: "1",
                cursor: "pointer",
                fontWeight: "bold",
              }}
              onClick={() => removeTag(idx)}
              title="Remove tag"
            >
              ×
            </span>
          </span>
        ))}
        <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: "120px" }}>
          <input
            type="text"
            className="bg-transparent border-0 flex-grow-1 fs-13"
            style={{
              outline: "none",
              boxShadow: "none",
              color: "#0f172a",
              padding: "4px 6px",
              minWidth: "100px",
            }}
            placeholder={tags.length === 0 ? (placeholder || "e.g. Type & press Enter") : "Add more..."}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          {val.trim() && (
            <button
              type="button"
              className="btn btn-sm text-white px-2 py-0.5 me-1"
              style={{ backgroundColor: badgeBg, borderRadius: "4px", fontSize: "11px" }}
              onClick={addTag}
            >
              <FaPlus />
            </button>
          )}
        </div>
      </div>
      <small className="text-muted fs-11 mt-1 d-block">Press Enter or comma to add tag</small>
    </div>
  );
};

export const AiExpertForm: React.FC<AiExpertFormProps> = ({ initialData, expertId }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<AiExpert>>(EMPTY_EXPERT);
  const [options, setOptions] = useState<{
    genders: string[];
    types: string[];
    timezones: string[];
    categories: string[];
  }>({
    genders: ["female", "male"],
    types: ["local", "global"],
    timezones: ["Asia/Kolkata", "America/New_York", "Europe/London", "Asia/Dubai"],
    categories: DEFAULT_CATEGORIES,
  });

  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPromptPreview, setShowPromptPreview] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  // Media State (Profile Avatar, Moments Gallery, Shorts/Reels Videos)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [existingGallery, setExistingGallery] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchExpertOptions()
      .then((opts) => {
        if (opts) {
          setOptions({
            genders: opts.genders?.length ? opts.genders : ["female", "male"],
            types: opts.types?.length ? opts.types : ["local", "global"],
            timezones: opts.timezones?.length ? opts.timezones : ["Asia/Kolkata"],
            categories: opts.categories?.length
              ? Array.from(new Set([...opts.categories, ...DEFAULT_CATEGORIES]))
              : DEFAULT_CATEGORIES,
          });
        }
      })
      .catch((err) => console.warn("Failed to load expert options:", err));
  }, []);

  useEffect(() => {
    const applyData = (data: Partial<AiExpert>) => {
      setFormData({
        ...EMPTY_EXPERT,
        ...data,
        likes: Array.isArray(data.likes) ? data.likes : [],
        dislikes: Array.isArray(data.dislikes) ? data.dislikes : [],
        hobbies: Array.isArray(data.hobbies) ? data.hobbies : [],
      });
      setPrompt(data.prompt || "");

      if (data.image) {
        setImagePreview(
          data.image.startsWith("http")
            ? data.image
            : baseURL + data.image.replace(/\\/g, "/")
        );
      }
      if (Array.isArray(data.photoGallery)) {
        setExistingGallery(data.photoGallery.filter((img) => img && typeof img === "string"));
      }
      if (Array.isArray(data.video)) {
        setExistingVideos(data.video.filter((v) => v && typeof v === "string"));
      }
    };

    if (initialData) {
      applyData(initialData);
    } else if (expertId) {
      fetchSingleExpert(expertId).then((exp) => {
        if (exp) applyData(exp);
      });
    }
  }, [initialData, expertId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "age" ? (value === "" ? null : Number(value)) : value,
    }));
  };

  // Image Compression Helper
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (file.type === "image/svg+xml" || file.type === "image/gif" || file.size < 400 * 1024) {
        return resolve(file);
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.82
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  // Profile Image Handlers
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const compressed = await compressImage(file);
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    }
  };

  // Photo Gallery (Moments) Handlers
  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const newFiles: File[] = [];
      const newPreviews: string[] = [];

      for (const file of filesArray) {
        const compressed = await compressImage(file);
        newFiles.push(compressed);
        newPreviews.push(URL.createObjectURL(compressed));
      }

      setGalleryFiles((prev) => [...prev, ...newFiles]);
      setGalleryPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeNewGalleryPhoto = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingGalleryPhoto = (index: number) => {
    setExistingGallery((prev) => prev.filter((_, i) => i !== index));
  };

  // Video Handlers
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));

      setVideoFiles((prev) => [...prev, ...filesArray]);
      setVideoPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeNewVideo = (index: number) => {
    setVideoFiles((prev) => prev.filter((_, i) => i !== index));
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingVideo = (index: number) => {
    setExistingVideos((prev) => prev.filter((_, i) => i !== index));
  };

  // Live Computed System Prompt
  const livePrompt = useMemo(() => {
    if (prompt && !formData.name) return prompt;

    const isMale = formData.gender === "male";
    const pronoun = isMale ? "He" : "She";
    const posPronoun = isMale ? "His" : "Her";

    let p = `You are ${formData.name || "AI Expert"} ${formData.surname || ""}`.trim();
    if (formData.age) p += `, a ${formData.age}-year-old topic advisor`;
    if (formData.category) p += ` specializing in ${formData.specialty || formData.category}`;
    if (formData.home_place) p += ` from ${formData.home_place}`;
    p += `.\n\n`;

    if (formData.tagline) p += `CORE PHILOSOPHY / TAGLINE:\n"${formData.tagline}"\n\n`;
    if (formData.occupation) p += `PROFESSIONAL BACKGROUND:\n${formData.occupation}\n\n`;
    if (formData.appearance) p += `APPEARANCE:\n${formData.appearance}\n\n`;
    if (formData.daily_routine) p += `DAILY ROUTINE:\n${formData.daily_routine}\n\n`;

    p += `ADVISING & TEXTING STYLE:\n`;
    if (formData.texting_style) p += `- Texting style: ${formData.texting_style}\n`;
    if (formData.greeting) p += `- Opener hint: ${formData.greeting}\n`;
    if (formData.quirks) p += `- Quirks & habits: ${formData.quirks}\n`;
    if (formData.values) p += `- Core values: ${formData.values}\n`;
    p += `\n`;

    if (formData.bio) p += `${posPronoun.toUpperCase()} STORY & JOURNEY:\n${formData.bio}\n\n`;

    if (formData.likes?.length) p += `LIKES: ${formData.likes.join(", ")}\n`;
    if (formData.dislikes?.length) p += `DISLIKES: ${formData.dislikes.join(", ")}\n`;
    if (formData.hobbies?.length) p += `HOBBIES: ${formData.hobbies.join(", ")}\n`;

    p += `\nLANGUAGE & TIMEZONE:\n`;
    p += `- Language: ${formData.type === "global" ? "English" : "Hinglish (Roman Script)"}\n`;
    p += `- Timezone: ${formData.type === "global" ? (formData.timezone || "America/New_York") : "Asia/Kolkata (India)"}\n`;

    p += `\nSAFETY GUARDS:\n`;
    p += `- You are a supportive topic mentor, not a licensed therapist or physician.\n`;
    p += `- Route medical, legal, or crisis emergencies immediately to professional emergency helplines.\n`;
    p += `- No relationship stages, no flirting, no gift asks.\n`;

    return p.trim();
  }, [formData, prompt]);

  const handleCopyPrompt = () => {
    if (!livePrompt) return;
    navigator.clipboard.writeText(livePrompt);
    setCopiedPrompt(true);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.error("Please enter the Expert's Name");
      return;
    }
    if (!formData.category?.trim()) {
      toast.error("Please enter or select a Category");
      return;
    }
    if (!formData.specialty?.trim()) {
      toast.error("Please enter the Specialty");
      return;
    }
    if (formData.type === "global" && !formData.timezone) {
      toast.error("Please select a Timezone for global expert");
      return;
    }

    setLoading(true);

    const payload: any = {
      ...formData,
      category: formData.category?.trim(),
      specialty: formData.specialty?.trim(),
      tagline: formData.tagline?.trim() || null,
      name: formData.name?.trim(),
      surname: formData.surname?.trim() || null,
      age: formData.age ? Number(formData.age) : null,
      home_place: formData.home_place?.trim() || null,
      appearance: formData.appearance?.trim() || null,
      occupation: formData.occupation?.trim() || null,
      daily_routine: formData.daily_routine?.trim() || null,
      bio: formData.bio?.trim() || null,
      values: formData.values?.trim() || null,
      quirks: formData.quirks?.trim() || null,
      texting_style: formData.texting_style?.trim() || null,
      greeting: formData.greeting?.trim() || null,
      likes: formData.likes || [],
      dislikes: formData.dislikes || [],
      hobbies: formData.hobbies || [],
      type: formData.type || "local",
      timezone: formData.type === "global" ? formData.timezone : undefined,
      prompt: livePrompt,
    };

    try {
      if (expertId) {
        const updated = await updateAiExpert(expertId, payload);
        toast.success("AI Expert updated successfully!");
        if (updated?.prompt) setPrompt(updated.prompt);
      } else {
        const created = await createAiExpert(payload);
        toast.success("AI Expert created successfully!");
        if (created?.id) {
          router.push(`/AiExperts`);
        }
      }
    } catch (err: any) {
      console.error("Save Expert error:", err);
      const errMsg =
        typeof err === "string"
          ? err
          : err?.detail
          ? JSON.stringify(err.detail)
          : err?.message || "Failed to save AI Expert";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const isMale = formData.gender === "male";
  const pronoun = isMale ? "He" : "She";
  const posPronoun = isMale ? "His" : "Her";
  const defaultAvatar = isMale ? maleAvatar.src : femaleAvatar.src;

  return (
    <>
      <style jsx global>{`
        .ai-sq-input,
        .ai-sq-textarea,
        .ai-sq-select {
          border-radius: 6px !important;
          border: 1.5px solid #cbd5e1 !important;
          padding: 9px 12px !important;
          font-size: 13.5px !important;
          color: #0f172a !important;
          background-color: #ffffff !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) !important;
          transition: all 0.15s ease !important;
          width: 100%;
        }
        .ai-sq-input:focus,
        .ai-sq-textarea:focus,
        .ai-sq-select:focus,
        .ai-chip-container:focus-within {
          border-color: #8f6dff !important;
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(143, 109, 255, 0.2) !important;
        }
        .ai-card-sq {
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
          background: #ffffff !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
        }
        .ai-sq-btn {
          border-radius: 6px !important;
          font-weight: 600 !important;
          font-size: 13.5px !important;
          padding: 8px 18px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 7px !important;
          transition: all 0.15s ease !important;
        }
        .form-section-title {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 10px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>

      <form onSubmit={handleSubmit} className="d-flex flex-column gap-4 pb-5">
        {/* Top Sticky Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between p-3 ai-card-sq shadow-sm sticky-top bg-white">
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="btn btn-outline-secondary ai-sq-btn"
              onClick={() => router.push("/AiExperts")}
            >
              <FaArrowLeft />
              <span>Back to Experts</span>
            </button>
            <div>
              <h4 className="fw-bold mb-0 text-dark fs-18">
                {expertId ? `Edit Expert: ${formData.name || ""}` : "Create New AI Expert"}
              </h4>
              <p className="text-muted mb-0 fs-12">
                Topic advisor with structured expertise (No dating stages, no gift asks, built-in safety)
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn text-white ai-sq-btn shadow-sm"
              style={{ backgroundColor: "#8F6DFF" }}
            >
              <FaSave />
              <span>{loading ? "Saving..." : expertId ? "Save Changes" : "Create Expert"}</span>
            </button>
          </div>
        </div>

        {/* Main 2-Column Form Body */}
        <div className="row g-4">
          
          {/* ================= LEFT COLUMN: PERSONA DOSSIER ================= */}
          <div className="col-12 col-lg-8">
            
            {/* SECTION 1: WHAT PEOPLE COME TO THEM FOR */}
            <div className="card ai-card-sq p-4 mb-4">
              <div className="form-section-title">
                <FaUserGraduate style={{ color: "#8F6DFF" }} />
                <span>1. What People Come to {posPronoun} For (App Card Fields)</span>
              </div>
              <p className="text-muted fs-13 mb-3">
                These three fields define how the advisor appears in the app cards and category listings.
              </p>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">
                    Category * <span className="text-muted fw-normal">(Groups cards in app sections)</span>
                  </label>
                  <input
                    type="text"
                    name="category"
                    list="expert-category-options"
                    className="ai-sq-input"
                    placeholder="e.g. Career & Exams, Love & Dating, Mind & Wellbeing..."
                    value={formData.category || ""}
                    onChange={handleChange}
                    required
                  />
                  <datalist id="expert-category-options">
                    {options.categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">
                    Specialty * <span className="text-muted fw-normal">(Badge on the card)</span>
                  </label>
                  <input
                    type="text"
                    name="specialty"
                    className="ai-sq-input"
                    placeholder="e.g. Exam Stress, Marriage Pressure, Burnout..."
                    value={formData.specialty || ""}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">
                    Tagline <span className="text-muted fw-normal">(The punchline under the card title)</span>
                  </label>
                  <input
                    type="text"
                    name="tagline"
                    className="ai-sq-input"
                    placeholder="e.g. Panic won't crack it. A plan will."
                    value={formData.tagline || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: IDENTITY & BACKGROUND */}
            <div className="card ai-card-sq p-4 mb-4">
              <div className="form-section-title">
                <i className="ri-user-smile-line" style={{ color: "#8F6DFF" }}></i>
                <span>2. Identity & Professional Background</span>
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-3">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Gender *</label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn flex-fill ai-sq-btn justify-content-center ${
                        formData.gender === "female" ? "text-white" : "btn-outline-secondary"
                      }`}
                      style={{
                        backgroundColor: formData.gender === "female" ? "#db2777" : undefined,
                        borderColor: formData.gender === "female" ? "#db2777" : undefined,
                      }}
                      onClick={() => setFormData((p) => ({ ...p, gender: "female" }))}
                    >
                      Woman
                    </button>
                    <button
                      type="button"
                      className={`btn flex-fill ai-sq-btn justify-content-center ${
                        formData.gender === "male" ? "text-white" : "btn-outline-secondary"
                      }`}
                      style={{
                        backgroundColor: formData.gender === "male" ? "#2563eb" : undefined,
                        borderColor: formData.gender === "male" ? "#2563eb" : undefined,
                      }}
                      onClick={() => setFormData((p) => ({ ...p, gender: "male" }))}
                    >
                      Man
                    </button>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="ai-sq-input"
                    placeholder="First Name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Surname</label>
                  <input
                    type="text"
                    name="surname"
                    className="ai-sq-input"
                    placeholder="Last Name"
                    value={formData.surname || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 col-md-2">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Age</label>
                  <input
                    type="number"
                    min="18"
                    max="90"
                    name="age"
                    className="ai-sq-input"
                    placeholder="28"
                    value={formData.age !== undefined && formData.age !== null ? formData.age : ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Where {pronoun} is from</label>
                  <input
                    type="text"
                    name="home_place"
                    className="ai-sq-input"
                    placeholder="e.g. Pune, Delhi, Bengaluru..."
                    value={formData.home_place || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">What {pronoun} looks like</label>
                  <input
                    type="text"
                    name="appearance"
                    className="ai-sq-input"
                    placeholder="e.g. Warm eyes behind simple glasses, hair tied back"
                    value={formData.appearance || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">
                    Work and Background <span className="text-muted fw-normal">(What makes them the expert)</span>
                  </label>
                  <textarea
                    name="occupation"
                    rows={2}
                    className="ai-sq-textarea"
                    placeholder="e.g. Study coach — coached hundreds of students through boards and NEET successfully."
                    value={formData.occupation || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">
                    A Normal Day for {pronoun}
                  </label>
                  <textarea
                    name="daily_routine"
                    rows={2}
                    className="ai-sq-textarea"
                    placeholder="e.g. Student chats through the day, reads case studies in the evening."
                    value={formData.daily_routine || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: HOW THEY HELP & ADVISING STYLE */}
            <div className="card ai-card-sq p-4 mb-4">
              <div className="form-section-title">
                <i className="ri-heart-pulse-line text-danger"></i>
                <span>3. How {pronoun} Helps (Mindset, Story & Voice)</span>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">
                    {posPronoun} Story <span className="text-muted fw-normal">(How {pronoun.toLowerCase()} came to do this work)</span>
                  </label>
                  <textarea
                    name="bio"
                    rows={3}
                    className="ai-sq-textarea"
                    placeholder="e.g. Froze in her own 12th boards, then learned why panic beats preparation, now dedicates her life to mentorship..."
                    value={formData.bio || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">
                    Values <span className="text-muted fw-normal">(What {pronoun.toLowerCase()} believes in when helping people)</span>
                  </label>
                  <textarea
                    name="values"
                    rows={2}
                    className="ai-sq-textarea"
                    placeholder="e.g. Small steps done daily beat heroic plans."
                    value={formData.values || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">
                    Quirks and Habits
                  </label>
                  <textarea
                    name="quirks"
                    rows={2}
                    className="ai-sq-textarea"
                    placeholder="e.g. Celebrates tiny wins like festivals."
                    value={formData.quirks || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">
                    Texting Style
                  </label>
                  <textarea
                    name="texting_style"
                    rows={2}
                    className="ai-sq-textarea"
                    placeholder="e.g. Calm short lines, one precise question at a time."
                    value={formData.texting_style || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">
                    Greeting <span className="text-muted fw-normal">(Style hint for how {pronoun.toLowerCase()} says hi)</span>
                  </label>
                  <textarea
                    name="greeting"
                    rows={2}
                    className="ai-sq-textarea"
                    placeholder="e.g. Hey, batao kya chal raha hai"
                    value={formData.greeting || ""}
                    onChange={handleChange}
                  />
                </div>

                {/* Seamless Chip Inputs: Likes, Dislikes, Hobbies */}
                <div className="col-12 col-md-4">
                  <ChipTagInput
                    label="Likes"
                    placeholder="e.g. Handwritten notes"
                    tags={formData.likes || []}
                    onChange={(tags) => setFormData((p) => ({ ...p, likes: tags }))}
                    badgeBg="#0ea5e9"
                  />
                </div>

                <div className="col-12 col-md-4">
                  <ChipTagInput
                    label="Dislikes"
                    placeholder="e.g. All-nighters"
                    tags={formData.dislikes || []}
                    onChange={(tags) => setFormData((p) => ({ ...p, dislikes: tags }))}
                    badgeBg="#f59e0b"
                  />
                </div>

                <div className="col-12 col-md-4">
                  <ChipTagInput
                    label="Hobbies"
                    placeholder="e.g. Reading, Sudoku"
                    tags={formData.hobbies || []}
                    onChange={(tags) => setFormData((p) => ({ ...p, hobbies: tags }))}
                    badgeBg="#64748b"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: LANGUAGE & TIMEZONE */}
            <div className="card ai-card-sq p-4 mb-4">
              <div className="form-section-title">
                <FaGlobe style={{ color: "#8F6DFF" }} />
                <span>4. Language & Timezone</span>
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Profile Type</label>
                  <div className="d-flex gap-3">
                    <label
                      className={`p-3 border rounded flex-fill cursor-pointer ${
                        formData.type === "local" ? "border-primary bg-light" : ""
                      }`}
                      style={{ borderRadius: "6px" }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="radio"
                          name="type"
                          checked={formData.type === "local"}
                          onChange={() => setFormData((p) => ({ ...p, type: "local", timezone: "Asia/Kolkata" }))}
                        />
                        <strong className="fs-14">Local (Hinglish)</strong>
                      </div>
                      <small className="text-muted d-block mt-1">
                        Always Hinglish in Roman script; Timezone pinned to Asia/Kolkata.
                      </small>
                    </label>

                    <label
                      className={`p-3 border rounded flex-fill cursor-pointer ${
                        formData.type === "global" ? "border-primary bg-light" : ""
                      }`}
                      style={{ borderRadius: "6px" }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="radio"
                          name="type"
                          checked={formData.type === "global"}
                          onChange={() => setFormData((p) => ({ ...p, type: "global" }))}
                        />
                        <strong className="fs-14">Global (English)</strong>
                      </div>
                      <small className="text-muted d-block mt-1">
                        Speaks English; Requires a specific IANA Timezone.
                      </small>
                    </label>
                  </div>
                </div>

                {formData.type === "global" && (
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold fs-13 text-dark mb-1">IANA Timezone *</label>
                    <CustomSelect
                      options={options.timezones}
                      value={formData.timezone || "America/New_York"}
                      onChange={(val) => setFormData((p) => ({ ...p, timezone: val }))}
                      searchable={true}
                      placeholder="Select or search timezone..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* NOTICE: BUILT-IN SAFETY */}
            <div
              className="p-3 d-flex align-items-start gap-2 rounded border mb-4"
              style={{ backgroundColor: "#f8fafc", borderColor: "#cbd5e1" }}
            >
              <FaInfoCircle className="text-primary mt-1 flex-shrink-0" />
              <div className="fs-12 text-muted">
                <strong>Built-in Safety:</strong> Safety is built into every expert prompt. {pronoun} never
                claims a medical/legal license, never gives dosages or prescriptions, points serious medical issues
                to a doctor, and routes self-harm to crisis helplines. Expert chats have no relationship stages, no
                flirting, and no gift asks.
              </div>
            </div>

            {/* GENERATED PROMPT PREVIEW */}
            <div className="card ai-card-sq p-4">
              <div
                className="d-flex align-items-center justify-content-between cursor-pointer"
                onClick={() => setShowPromptPreview(!showPromptPreview)}
              >
                <div className="d-flex align-items-center gap-2">
                  <FaRobot style={{ color: "#8F6DFF", fontSize: "18px" }} />
                  <span className="fw-bold text-dark fs-15">
                    See {isMale ? "his" : "her"} generated prompt ({livePrompt.length} chars)
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary ai-sq-btn px-2 py-1 fs-12"
                >
                  {showPromptPreview ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>

              {showPromptPreview && (
                <div className="mt-3 pt-3 border-top">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted fs-12">
                      Computed live from advisor details. Sent to AI Chat model as system prompt:
                    </small>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary ai-sq-btn px-2.5 py-1 fs-12 d-flex align-items-center gap-1"
                      onClick={handleCopyPrompt}
                    >
                      {copiedPrompt ? <FaCheck /> : <FaCopy />}
                      <span>{copiedPrompt ? "Copied!" : "Copy Prompt"}</span>
                    </button>
                  </div>
                  <pre
                    className="bg-light p-3 border rounded fs-12 text-dark font-monospace mb-0"
                    style={{ maxHeight: "250px", overflowY: "auto", whiteSpace: "pre-wrap" }}
                  >
                    {livePrompt}
                  </pre>
                </div>
              )}
            </div>

          </div>

          {/* ================= RIGHT COLUMN: AVATAR, MEDIA & ACTION ================= */}
          <div className="col-12 col-lg-4">
            
            {/* PROFILE PICTURE CARD */}
            <div className="card shadow-sm ai-card-sq p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark border-bottom pb-3 mb-3 d-flex align-items-center gap-2 fs-16">
                <i className="ri-image-line text-info"></i> Profile Picture
              </h5>

              <div className="text-center py-2">
                <div
                  className="mx-auto overflow-hidden border border-2 shadow-sm mb-3 position-relative"
                  style={{ width: "130px", height: "130px", borderRadius: "6px", backgroundColor: "#f1f5f9" }}
                >
                  <img
                    src={imagePreview || defaultAvatar}
                    alt="Avatar Preview"
                    className="w-100 h-100 object-fit-cover"
                    onError={(e: any) => {
                      e.target.src = defaultAvatar;
                    }}
                  />
                </div>

                <div>
                  <label
                    className="btn btn-outline-primary ai-sq-btn px-4 py-2 fs-13 cursor-pointer"
                    style={{ borderColor: "#8F6DFF", color: "#8F6DFF" }}
                  >
                    <i className="ri-upload-cloud-line me-1"></i> Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      className="d-none"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                <small className="text-muted fs-11 mt-2 d-block">
                  Recommended: <strong>1080 x 1080 px (Square 1:1)</strong> • JPG/PNG
                </small>
              </div>
            </div>

            {/* PHOTO GALLERY (MOMENTS) CARD */}
            <div className="card shadow-sm ai-card-sq p-4 bg-white mb-4">
              <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2 fs-15">
                    <i className="ri-gallery-line" style={{ color: "#8F6DFF" }}></i> Photo Gallery (Moments)
                  </h5>
                  <small className="text-muted fs-11">Ratio: <strong>1080 x 1350 px (4:5)</strong></small>
                </div>
                <label
                  className="btn btn-sm btn-outline-primary ai-sq-btn px-3 py-1 fs-12 cursor-pointer mb-0"
                  style={{ borderColor: "#8F6DFF", color: "#8F6DFF" }}
                >
                  <i className="ri-add-line me-1"></i> Add Photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="d-none"
                    onChange={handleGalleryChange}
                  />
                </label>
              </div>

              {existingGallery.length === 0 && galleryPreviews.length === 0 ? (
                <div className="text-center py-4 border border-dashed rounded-2 bg-light">
                  <i className="ri-image-add-line fs-28 text-muted mb-1 d-block"></i>
                  <span className="text-muted fs-12 d-block">No gallery photos added yet</span>
                  <label className="d-block mt-2">
                    <span className="btn btn-sm text-white ai-sq-btn px-3 fs-12 cursor-pointer" style={{ backgroundColor: "#8F6DFF" }}>
                      Upload Photos
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="d-none"
                      onChange={handleGalleryChange}
                    />
                  </label>
                </div>
              ) : (
                <div className="row g-2">
                  {existingGallery.map((img, idx) => (
                    <div key={`existing-${idx}`} className="col-4 position-relative">
                      <div className="ratio ratio-1x1 overflow-hidden border shadow-sm" style={{ borderRadius: "4px" }}>
                        <img
                          src={img.startsWith("http") ? img : baseURL + img.replace(/\\/g, "/")}
                          alt={`Gallery ${idx}`}
                          className="object-fit-cover w-100 h-100"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-0 d-flex align-items-center justify-content-center shadow-sm"
                        style={{ width: "20px", height: "20px", borderRadius: "3px", zIndex: 2 }}
                        onClick={() => removeExistingGalleryPhoto(idx)}
                        title="Remove Photo"
                      >
                        <i className="ri-close-line fs-12 text-white"></i>
                      </button>
                    </div>
                  ))}

                  {galleryPreviews.map((preview, idx) => (
                    <div key={`new-${idx}`} className="col-4 position-relative">
                      <div className="ratio ratio-1x1 overflow-hidden border border-primary shadow-sm" style={{ borderRadius: "4px" }}>
                        <img
                          src={preview}
                          alt={`New Gallery ${idx}`}
                          className="object-fit-cover w-100 h-100"
                        />
                      </div>
                      <span className="badge position-absolute bottom-0 start-0 m-1 fs-9 px-1 py-0.5" style={{ backgroundColor: "#8F6DFF", borderRadius: "2px" }}>
                        NEW
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-0 d-flex align-items-center justify-content-center shadow-sm"
                        style={{ width: "20px", height: "20px", borderRadius: "3px", zIndex: 2 }}
                        onClick={() => removeNewGalleryPhoto(idx)}
                        title="Remove Photo"
                      >
                        <i className="ri-close-line fs-12 text-white"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* VIDEOS (SHORTS / REELS) CARD */}
            <div className="card shadow-sm ai-card-sq p-4 bg-white mb-4">
              <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2 fs-15">
                    <i className="ri-video-line text-danger"></i> Videos (Shorts / Reels)
                  </h5>
                  <small className="text-muted fs-11">Ratio: <strong>1080 x 1920 px (9:16)</strong></small>
                </div>
                <label className="btn btn-sm btn-outline-danger ai-sq-btn px-3 py-1 fs-12 cursor-pointer mb-0">
                  <i className="ri-video-upload-line me-1"></i> Add Video
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    className="d-none"
                    onChange={handleVideoChange}
                  />
                </label>
              </div>

              {existingVideos.length === 0 && videoPreviews.length === 0 ? (
                <div className="text-center py-4 border border-dashed rounded-2 bg-light">
                  <i className="ri-movie-line fs-28 text-muted mb-1 d-block"></i>
                  <span className="text-muted fs-12 d-block">No videos uploaded yet</span>
                  <label className="d-block mt-2">
                    <span className="btn btn-sm btn-danger ai-sq-btn px-3 fs-12 cursor-pointer">
                      Upload Video (MP4)
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      className="d-none"
                      onChange={handleVideoChange}
                    />
                  </label>
                </div>
              ) : (
                <div className="row g-2">
                  {existingVideos.map((vid, idx) => (
                    <div key={`existing-vid-${idx}`} className="col-6 position-relative">
                      <div
                        className="overflow-hidden bg-black border shadow-sm position-relative d-flex align-items-center justify-content-center"
                        style={{ height: "200px", width: "100%", borderRadius: "6px" }}
                      >
                        <video
                          src={vid.startsWith("http") ? vid : baseURL + vid.replace(/\\/g, "/")}
                          className="w-100 h-100"
                          style={{ objectFit: "cover" }}
                          controls
                          playsInline
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1.5 p-0 d-flex align-items-center justify-content-center shadow-sm"
                        style={{ width: "22px", height: "22px", borderRadius: "3px", zIndex: 10 }}
                        onClick={() => removeExistingVideo(idx)}
                        title="Remove Video"
                      >
                        <i className="ri-close-line fs-12 text-white"></i>
                      </button>
                    </div>
                  ))}

                  {videoPreviews.map((preview, idx) => (
                    <div key={`new-vid-${idx}`} className="col-6 position-relative">
                      <div
                        className="overflow-hidden bg-black border border-danger shadow-sm position-relative d-flex align-items-center justify-content-center"
                        style={{ height: "200px", width: "100%", borderRadius: "6px" }}
                      >
                        <video
                          src={preview}
                          className="w-100 h-100"
                          style={{ objectFit: "cover" }}
                          controls
                          playsInline
                        />
                      </div>
                      <span
                        className="badge bg-danger position-absolute bottom-0 start-0 m-2 fs-9 px-1.5 py-0.5 shadow"
                        style={{ zIndex: 10, borderRadius: "2px" }}
                      >
                        NEW
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1.5 p-0 d-flex align-items-center justify-content-center shadow-sm"
                        style={{ width: "22px", height: "22px", borderRadius: "3px", zIndex: 10 }}
                        onClick={() => removeNewVideo(idx)}
                        title="Remove Video"
                      >
                        <i className="ri-close-line fs-12 text-white"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACTION CARD */}
            <div className="card shadow-sm ai-card-sq p-4 bg-white">
              <div className="d-flex flex-column gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn text-white ai-sq-btn py-2.5 fs-14 shadow-sm w-100 d-flex align-items-center justify-content-center gap-2"
                  style={{ backgroundColor: "#8F6DFF" }}
                >
                  <FaSave />
                  <span>{loading ? "Saving..." : expertId ? "Save Changes" : "Create Expert"}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary ai-sq-btn py-2 fs-13 w-100"
                  onClick={() => router.push("/AiExperts")}
                >
                  Cancel
                </button>
              </div>
            </div>

          </div>
        </div>
      </form>
    </>
  );
};

export default AiExpertForm;
