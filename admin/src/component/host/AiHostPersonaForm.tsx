import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import Image from "next/image";
import femaleAvatar from "@/assets/images/female.png";
import maleAvatar from "@/assets/images/male.png";
import {
  AiHostPersona,
  createAiHost,
  updateAiHost,
  fetchSingleHost,
  fetchHostOptions,
  saveHostMedia,
} from "@/utils/aiChatApi";
import { baseURL } from "@/utils/config";
import {
  FaHeart,
  FaRobot,
  FaSave,
  FaTimes,
  FaCopy,
  FaCheck,
  FaPlus,
  FaImage,
  FaVideo,
  FaCoins,
  FaCommentDots,
} from "react-icons/fa";

interface AiHostPersonaFormProps {
  hostId?: string;
}

const DEFAULT_FLAVORS = [
  "Sweet & Romantic",
  "Playful & Teasing",
  "Bold & Sassy",
  "Cute & Bubbly",
  "Charming & Elegant",
  "Witty & Sarcastic",
  "Caring & Supportive",
  "Mysterious & Sultry",
];

const EMPTY_HOST: Partial<AiHostPersona> = {
  flavor: "Sweet & Romantic",
  tagline: "",
  slug: "",
  gender: "female",
  name: "",
  surname: "",
  age: 22,
  home_place: "",
  appearance: "",
  occupation: "",
  daily_routine: "",
  bio: "",
  quirks: "",
  texting_style: "",
  flirting_style: "",
  greeting: "",
  likes: [],
  dislikes: [],
  hobbies: [],
  values: "",
  personality: [],
  type: "local",
  timezone: "Asia/Kolkata",
  is_active: true,
  chatRate: 5,
};

export const AiHostPersonaForm: React.FC<AiHostPersonaFormProps> = ({ hostId }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<AiHostPersona>>(EMPTY_HOST);
  const [options, setOptions] = useState<{ flavors?: string[]; timezones?: string[] }>({
    flavors: DEFAULT_FLAVORS,
  });

  // Media state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingGallery, setExistingGallery] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [existingVideos, setExistingVideos] = useState<string[]>([]);

  // Chip input state
  const [likeInput, setLikeInput] = useState("");
  const [dislikeInput, setDislikeInput] = useState("");
  const [hobbyInput, setHobbyInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Load available options
  useEffect(() => {
    fetchHostOptions().then((opts) => {
      if (opts?.flavors?.length) {
        setOptions((prev) => ({ ...prev, flavors: opts.flavors }));
      }
    });
  }, []);

  // Load existing host if editing
  useEffect(() => {
    if (!hostId) return;
    setLoading(true);
    fetchSingleHost(hostId)
      .then((h) => {
        if (h) {
          setFormData({
            ...EMPTY_HOST,
            ...h,
            chatRate: h.chatRate ?? h.chat_rate ?? 5,
          });
          if (h.image || h.avatar_url) {
            setImagePreview(h.image || h.avatar_url || "");
          }
          if (Array.isArray(h.photoGallery)) {
            setExistingGallery(h.photoGallery);
          }
          if (h.video) {
            setExistingVideos(Array.isArray(h.video) ? h.video : [h.video]);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load host:", err);
        toast.error("Failed to load host profile data.");
      })
      .finally(() => setLoading(false));
  }, [hostId]);

  // Handle single field change
  const handleChange = (field: keyof AiHostPersona, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  // Add chip
  const addChip = (field: "likes" | "dislikes" | "hobbies", inputVal: string, resetFn: (s: string) => void) => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    const current = formData[field] || [];
    if (!current.includes(trimmed)) {
      handleChange(field, [...current, trimmed]);
    }
    resetFn("");
  };

  // Remove chip
  const removeChip = (field: "likes" | "dislikes" | "hobbies", item: string) => {
    const current = formData[field] || [];
    handleChange(field, current.filter((x) => x !== item));
  };

  // Auto-generate slug from name and flavor if empty
  const handleNameBlur = () => {
    if (!formData.slug && formData.name) {
      const flavorSlug = (formData.flavor || "host").toLowerCase().replace(/[^a-z0-9]/g, "");
      const nameSlug = formData.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      handleChange("slug", `${nameSlug}-${flavorSlug}`);
    }
  };

  // Image file select
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Gallery files select
  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setGalleryFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  // Video file select
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  // Generated live prompt preview
  const livePrompt = useMemo(() => {
    const lines = [
      `You are ${formData.name || "Host"}${formData.surname ? ` ${formData.surname}` : ""}, a real Indian host persona with a "${formData.flavor || "Sweet & Romantic"}" flavor.`,
      formData.tagline ? `Tagline: "${formData.tagline}"` : "",
      formData.age ? `Age: ${formData.age}` : "",
      formData.home_place ? `City/Place: ${formData.home_place}` : "",
      formData.occupation ? `Occupation: ${formData.occupation}` : "",
      formData.bio ? `Bio: ${formData.bio}` : "",
      formData.texting_style ? `Texting Style: ${formData.texting_style}` : "",
      formData.flirting_style ? `Flirting Style: ${formData.flirting_style}` : "",
      formData.greeting ? `Opening line: "${formData.greeting}"` : "",
      formData.likes?.length ? `Likes: ${formData.likes.join(", ")}` : "",
      formData.dislikes?.length ? `Dislikes: ${formData.dislikes.join(", ")}` : "",
      formData.hobbies?.length ? `Hobbies: ${formData.hobbies.join(", ")}` : "",
      formData.quirks ? `Quirks: ${formData.quirks}` : "",
      formData.values ? `Values: ${formData.values}` : "",
      `Always stay in character, speak natural Hinglish, and never sound like a robotic AI assistant.`,
    ];
    return lines.filter(Boolean).join("\n");
  }, [formData]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(livePrompt);
    setCopiedPrompt(true);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.error("Please enter the Host's Name");
      return;
    }
    if (!formData.flavor?.trim()) {
      toast.error("Please select or enter a Personality Flavor");
      return;
    }

    setLoading(true);

    const payload: any = {
      ...formData,
      name: formData.name.trim(),
      surname: formData.surname?.trim() || null,
      flavor: formData.flavor.trim(),
      tagline: formData.tagline?.trim() || null,
      slug: formData.slug?.trim() || `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, "")}-${formData.flavor.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      age: formData.age ? Number(formData.age) : 22,
      home_place: formData.home_place?.trim() || null,
      appearance: formData.appearance?.trim() || null,
      occupation: formData.occupation?.trim() || null,
      daily_routine: formData.daily_routine?.trim() || null,
      bio: formData.bio?.trim() || null,
      quirks: formData.quirks?.trim() || null,
      texting_style: formData.texting_style?.trim() || null,
      flirting_style: formData.flirting_style?.trim() || null,
      greeting: formData.greeting?.trim() || null,
      likes: formData.likes || [],
      dislikes: formData.dislikes || [],
      hobbies: formData.hobbies || [],
      values: formData.values?.trim() || null,
      type: formData.type || "local",
      timezone: formData.timezone || "Asia/Kolkata",
      is_active: formData.is_active !== undefined ? formData.is_active : true,
      prompt: livePrompt,
      image: formData.image,
      photoGallery: existingGallery,
      video: existingVideos,
    };

    try {
      // 1. Upload files if provided
      if (imageFile || galleryFiles.length > 0 || videoFile) {
        const uploadData = new FormData();
        if (imageFile) uploadData.append("image", imageFile);
        galleryFiles.forEach((f) => uploadData.append("photoGallery", f));
        if (videoFile) uploadData.append("video", videoFile);

        const { apiInstanceFetch } = await import("@/utils/ApiInstance");
        const uploadRes = await apiInstanceFetch.post("api/admin/uploadMedia", uploadData);
        if (uploadRes?.status && uploadRes?.data) {
          if (uploadRes.data.image) {
            payload.image = uploadRes.data.image;
            payload.avatar_url = uploadRes.data.image;
          }
          if (uploadRes.data.photoGallery?.length) {
            payload.photoGallery = [...existingGallery, ...uploadRes.data.photoGallery];
          }
          if (uploadRes.data.video?.length) {
            payload.video = [...existingVideos, ...uploadRes.data.video];
          }
        }
      }

      // 2. Save to Python FastAPI Host Service (/api/hosts)
      let savedHostId = hostId;
      if (hostId) {
        const updated = await updateAiHost(hostId, payload);
        toast.success(`AI Model "${payload.name}" updated successfully!`);
      } else {
        const created = await createAiHost(payload);
        savedHostId = created?.id;
        toast.success(`AI Model "${payload.name}" created successfully!`);
      }

      // 3. Sync media, rates and metadata to MongoDB Host collection
      await saveHostMedia({
        name: payload.name,
        gender: payload.gender,
        image: payload.image || payload.avatar_url,
        photoGallery: payload.photoGallery,
        video: Array.isArray(payload.video) ? payload.video[0] : payload.video,
        chatRate: Number(formData.chatRate) || 5,
        flavor: payload.flavor,
      });

      router.push("/AiModels");
    } catch (err: any) {
      console.error("Save Host error:", err);
      toast.error(err?.message || "Failed to save Host profile. Check AI server connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0">
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-4 pb-5">
        {/* Top Header Card */}
        <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/AiModels")}
                className="btn btn-outline-secondary btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center"
                style={{ width: "36px", height: "36px" }}
              >
                &larr;
              </button>
              <div>
                <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <FaRobot className="text-primary" />
                  {hostId ? `Edit AI Host: ${formData.name || ""}` : "Create New AI Host Persona"}
                </h4>
                <small className="text-muted">
                  Configure identity, personality flavor, Hinglish voice, media and chat rates.
                </small>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/AiModels")}
                className="btn btn-light px-3 rounded-pill"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary d-flex align-items-center gap-2 px-4 rounded-pill shadow-sm"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave /> {hostId ? "Update Host" : "Save & Publish"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Left Column: Form Fields */}
          <div className="col-12 col-xl-8 d-flex flex-column gap-4">
            {/* Section 1: Personality Flavor & Tagline */}
            <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-primary border-bottom pb-2">
                <FaHeart /> 1. Persona Flavor & Vibe
              </h5>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Personality Flavor *</label>
                  <select
                    className="form-select rounded-3 py-2"
                    value={formData.flavor || "Sweet & Romantic"}
                    onChange={(e) => handleChange("flavor", e.target.value)}
                  >
                    {(options.flavors || DEFAULT_FLAVORS).map((fl) => (
                      <option key={fl} value={fl}>
                        {fl}
                      </option>
                    ))}
                    <option value="Custom">Custom / Other</option>
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Identifier Slug</label>
                  <input
                    type="text"
                    className="form-control rounded-3 py-2 font-monospace small"
                    placeholder="e.g. riya-playful"
                    value={formData.slug || ""}
                    onChange={(e) => handleChange("slug", e.target.value)}
                  />
                  <small className="text-muted">Unique slug for direct URL/API routing.</small>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Catchy Tagline / Status</label>
                  <input
                    type="text"
                    className="form-control rounded-3 py-2"
                    placeholder="e.g. Late night talks and soft melodies. Tell me your day."
                    value={formData.tagline || ""}
                    onChange={(e) => handleChange("tagline", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Identity & Demographics */}
            <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-primary border-bottom pb-2">
                👤 2. Identity & Demographics
              </h5>
              <div className="row g-3">
                <div className="col-12 col-md-3">
                  <label className="form-label fw-semibold">Gender *</label>
                  <select
                    className="form-select rounded-3 py-2"
                    value={formData.gender || "female"}
                    onChange={(e) => handleChange("gender", e.target.value)}
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>

                <div className="col-12 col-md-5">
                  <label className="form-label fw-semibold">First Name *</label>
                  <input
                    type="text"
                    className="form-control rounded-3 py-2"
                    placeholder="e.g. Riya"
                    value={formData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    onBlur={handleNameBlur}
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Surname</label>
                  <input
                    type="text"
                    className="form-control rounded-3 py-2"
                    placeholder="e.g. Kapoor"
                    value={formData.surname || ""}
                    onChange={(e) => handleChange("surname", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label fw-semibold">Age</label>
                  <input
                    type="number"
                    min={18}
                    max={60}
                    className="form-control rounded-3 py-2"
                    value={formData.age || 22}
                    onChange={(e) => handleChange("age", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">City / Location</label>
                  <input
                    type="text"
                    className="form-control rounded-3 py-2"
                    placeholder="e.g. Bandra, Mumbai"
                    value={formData.home_place || ""}
                    onChange={(e) => handleChange("home_place", e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-5">
                  <label className="form-label fw-semibold">Occupation / Hobby Job</label>
                  <input
                    type="text"
                    className="form-control rounded-3 py-2"
                    placeholder="e.g. Acoustic music streamer"
                    value={formData.occupation || ""}
                    onChange={(e) => handleChange("occupation", e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Visual Appearance & Look</label>
                  <textarea
                    rows={2}
                    className="form-control rounded-3"
                    placeholder="e.g. 5 feet 5 inches, wavy brown hair, expressive warm hazel eyes, usually in cozy pastel sweaters..."
                    value={formData.appearance || ""}
                    onChange={(e) => handleChange("appearance", e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Section 3: Voice, Personality & Flirting Style */}
            <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-primary border-bottom pb-2">
                <FaCommentDots /> 3. Voice, Personality & Conversation Style
              </h5>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Detailed Persona Bio *</label>
                  <textarea
                    rows={3}
                    className="form-control rounded-3"
                    placeholder="Describe her background, heart, attitude, and how she makes the caller feel..."
                    value={formData.bio || ""}
                    onChange={(e) => handleChange("bio", e.target.value)}
                  ></textarea>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Texting / Chat Style</label>
                  <textarea
                    rows={2}
                    className="form-control rounded-3"
                    placeholder="e.g. Soft, warm, attentive, sends sweet notes, never dry..."
                    value={formData.texting_style || ""}
                    onChange={(e) => handleChange("texting_style", e.target.value)}
                  ></textarea>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Flirting & Vibe Style</label>
                  <textarea
                    rows={2}
                    className="form-control rounded-3"
                    placeholder="e.g. Gentle and dreamy; drops heartfelt compliments that give butterflies..."
                    value={formData.flirting_style || ""}
                    onChange={(e) => handleChange("flirting_style", e.target.value)}
                  ></textarea>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Opening Greeting Message</label>
                  <input
                    type="text"
                    className="form-control rounded-3 py-2"
                    placeholder="e.g. hey there... was hoping you'd drop by tonight. how was your day?"
                    value={formData.greeting || ""}
                    onChange={(e) => handleChange("greeting", e.target.value)}
                  />
                  <small className="text-muted">The opener line sent when starting a new conversation.</small>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Quirks / Habits</label>
                  <input
                    type="text"
                    className="form-control rounded-3 py-2"
                    placeholder="e.g. Sends song recommendations out of nowhere, fiddles with her silver ring..."
                    value={formData.quirks || ""}
                    onChange={(e) => handleChange("quirks", e.target.value)}
                  />
                </div>

                {/* Likes / Dislikes / Hobbies Chips */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Likes (Add & Enter)</label>
                  <div className="input-group mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. acoustic guitar"
                      value={likeInput}
                      onChange={(e) => setLikeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChip("likes", likeInput, setLikeInput))}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => addChip("likes", likeInput, setLikeInput)}
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {(formData.likes || []).map((item) => (
                      <span key={item} className="badge bg-light text-dark border d-flex align-items-center gap-1">
                        {item}
                        <FaTimes className="cursor-pointer text-danger" onClick={() => removeChip("likes", item)} />
                      </span>
                    ))}
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Dislikes</label>
                  <div className="input-group mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. ghosting"
                      value={dislikeInput}
                      onChange={(e) => setDislikeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChip("dislikes", dislikeInput, setDislikeInput))}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => addChip("dislikes", dislikeInput, setDislikeInput)}
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {(formData.dislikes || []).map((item) => (
                      <span key={item} className="badge bg-light text-dark border d-flex align-items-center gap-1">
                        {item}
                        <FaTimes className="cursor-pointer text-danger" onClick={() => removeChip("dislikes", item)} />
                      </span>
                    ))}
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Hobbies</label>
                  <div className="input-group mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. stargazing"
                      value={hobbyInput}
                      onChange={(e) => setHobbyInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChip("hobbies", hobbyInput, setHobbyInput))}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => addChip("hobbies", hobbyInput, setHobbyInput)}
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {(formData.hobbies || []).map((item) => (
                      <span key={item} className="badge bg-light text-dark border d-flex align-items-center gap-1">
                        {item}
                        <FaTimes className="cursor-pointer text-danger" onClick={() => removeChip("hobbies", item)} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Media, Calling Rate & Prompt Preview */}
          <div className="col-12 col-xl-4 d-flex flex-column gap-4">
            {/* Media Card */}
            <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-primary border-bottom pb-2">
                <FaImage /> Profile Photo & Gallery
              </h5>

              {/* Main Avatar */}
              <div className="text-center mb-3">
                <div
                  className="position-relative mx-auto rounded-circle overflow-hidden border shadow-sm mb-2"
                  style={{ width: "130px", height: "130px" }}
                >
                  <Image
                    src={
                      imagePreview
                        ? imagePreview.startsWith("http") || imagePreview.startsWith("blob:")
                          ? imagePreview
                          : `${baseURL}${imagePreview}`
                        : formData.gender === "male"
                        ? maleAvatar
                        : femaleAvatar
                    }
                    alt="Host Avatar"
                    fill
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                </div>
                <label className="btn btn-outline-primary btn-sm rounded-pill px-3 cursor-pointer">
                  Choose New Photo
                  <input type="file" accept="image/*" className="d-none" onChange={handleImageChange} />
                </label>
              </div>

              {/* Photo Gallery */}
              <div className="mb-3">
                <label className="form-label fw-semibold small d-block mb-1">Moments Gallery</label>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {existingGallery.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="position-relative rounded-3 overflow-hidden border"
                      style={{ width: "55px", height: "55px" }}
                    >
                      <Image
                        src={imgUrl.startsWith("http") ? imgUrl : `${baseURL}${imgUrl}`}
                        alt="Gallery"
                        fill
                        style={{ objectFit: "cover" }}
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => setExistingGallery((prev) => prev.filter((_, i) => i !== idx))}
                        className="btn btn-danger btn-sm p-0 position-absolute top-0 end-0 rounded-circle"
                        style={{ width: "18px", height: "18px", fontSize: "10px" }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                <label className="btn btn-outline-secondary btn-sm rounded-pill w-100">
                  <FaPlus className="me-1" /> Add Gallery Photos
                  <input type="file" accept="image/*" multiple className="d-none" onChange={handleGalleryChange} />
                </label>
              </div>

              {/* Video Preview */}
              <div>
                <label className="form-label fw-semibold small d-block mb-1">
                  <FaVideo className="me-1 text-primary" /> Video Call Preview (MP4)
                </label>
                {videoFile && <div className="small text-success mb-1">Selected: {videoFile.name}</div>}
                {existingVideos.length > 0 && !videoFile && (
                  <div className="small text-muted mb-1 text-truncate">Existing Video linked</div>
                )}
                <label className="btn btn-outline-secondary btn-sm rounded-pill w-100">
                  Upload Video
                  <input type="file" accept="video/mp4,video/*" className="d-none" onChange={handleVideoChange} />
                </label>
              </div>
            </div>

            {/* Chat Rate & Calling Rates Card */}
            <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-primary border-bottom pb-2">
                <FaCoins className="text-warning" /> Chat Rate (Coins)
              </h5>
              <div className="mb-2">
                <label className="form-label fw-semibold">Coins Per Message *</label>
                <div className="input-group">
                  <input
                    type="number"
                    min={0}
                    className="form-control rounded-3 py-2 fw-bold fs-5 text-primary"
                    value={formData.chatRate ?? 5}
                    onChange={(e) => handleChange("chatRate", Number(e.target.value))}
                  />
                  <span className="input-group-text bg-light fw-bold">Coins</span>
                </div>
                <small className="text-muted d-block mt-1">
                  Deducted from the user's wallet for each AI chat response.
                </small>
              </div>
            </div>

            {/* Live Generated Prompt Card */}
            <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                  <FaRobot className="text-info" /> Persona System Prompt
                </h6>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-pill"
                >
                  {copiedPrompt ? <FaCheck className="text-success" /> : <FaCopy />}
                  <small>{copiedPrompt ? "Copied" : "Copy"}</small>
                </button>
              </div>
              <textarea
                rows={8}
                readOnly
                className="form-control font-monospace small bg-light border-0 text-muted"
                value={livePrompt}
              ></textarea>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AiHostPersonaForm;
