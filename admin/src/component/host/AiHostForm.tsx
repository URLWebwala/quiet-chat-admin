import React, { useState, useEffect, useMemo } from "react";
import { useAppDispatch } from "@/store/store";
import { createHost, updateHost } from "@/store/hostSlice";
import { useRouter } from "next/router";
import femaleAvatar from "@/assets/images/female.png";
import maleAvatar from "@/assets/images/male.png";
import { baseURL } from "@/utils/config";
import { createAiProfile, updateAiProfile } from "@/utils/aiChatApi";
import CustomSelect from "@/extra/CustomSelect";
import {
  FaSun,
  FaComments,
  FaBookOpen,
  FaHeart,
  FaGlobe,
  FaRobot,
  FaPlus,
  FaSave,
  FaTimes,
  FaCopy,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

const personalityOptions = [
  "Smart",
  "Confident",
  "Shy",
  "Friendly",
  "Funny",
  "Insecure",
  "Jealous",
  "Lazy",
  "Stubborn",
];

const TIMEZONE_OPTIONS = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const parseArraySafely = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
    } catch {}
    return val.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return [];
};

// Modern Integrated Chip/Tag Input matching square 6px theme
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
            placeholder={tags.length === 0 ? (placeholder || "Type and press Enter") : "Add more..."}
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

export const AiHostForm = ({ initialData }: { initialData?: any }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Form state
  const [gender, setGender] = useState<"female" | "male">("female");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [age, setAge] = useState(20);
  const [chatRate, setChatRate] = useState(0);
  const [dobFreeText, setDobFreeText] = useState("");
  const [whereFrom, setWhereFrom] = useState("");
  const [workOrStudy, setWorkOrStudy] = useState("");
  const [motherName, setMotherName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [siblings, setSiblings] = useState<string[]>([]);

  const [looksLike, setLooksLike] = useState("");
  const [normalDay, setNormalDay] = useState("");

  const [textingStyle, setTextingStyle] = useState("");
  const [howFlirts, setHowFlirts] = useState("");
  const [quirksAndHabits, setQuirksAndHabits] = useState("");
  const [openingLine, setOpeningLine] = useState("");

  const [lifeStory, setLifeStory] = useState("");
  const [happyMemories, setHappyMemories] = useState<string[]>([]);
  const [painfulMemories, setPainfulMemories] = useState<string[]>([]);
  const [pastRelationship, setPastRelationship] = useState("");
  const [fearsInsecurities, setFearsInsecurities] = useState("");
  const [dreamsGoals, setDreamsGoals] = useState("");
  const [values, setValues] = useState("");
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [secrets, setSecrets] = useState<string[]>([]);

  const [personality, setPersonality] = useState<string[]>(["Friendly", "Smart"]);
  const [profileType, setProfileType] = useState<"local" | "global">("local");
  const [timezone, setTimezone] = useState<string>("Asia/Kolkata");
  const [textingLanguage, setTextingLanguage] = useState("English");

  const [email, setEmail] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Photo Gallery (Moments) State
  const [existingGallery, setExistingGallery] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [removePhotoGalleryIndex, setRemovePhotoGalleryIndex] = useState<number[]>([]);

  // Video State
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [removeVideoIndexes, setRemoveVideoIndexes] = useState<number[]>([]);

  // Synchronize state when initialData is provided
  useEffect(() => {
    if (!initialData) return;
    setGender(initialData.gender?.toLowerCase() === "male" ? "male" : "female");
    setName(initialData.name || "");
    setSurname(initialData.surname || "");
    setAge(initialData.age !== undefined ? Number(initialData.age) : 20);
    setChatRate(initialData.chatRate !== undefined ? Number(initialData.chatRate) : 0);
    setDobFreeText(initialData.birthdateFreeText || initialData.birthdate || initialData.dob || "");
    setWhereFrom(initialData.whereFrom || initialData.home_place || initialData.country || "");
    setWorkOrStudy(initialData.workOrStudy || initialData.occupation || "");
    setMotherName(initialData.motherName || initialData.mother_name || "");
    setFatherName(initialData.fatherName || initialData.father_name || "");
    setSiblings(parseArraySafely(initialData.siblings));

    setLooksLike(initialData.looksLike || initialData.appearance || "");
    setNormalDay(initialData.normalDay || initialData.daily_routine || "");

    setTextingStyle(initialData.textingStyle || initialData.texting_style || "");
    setHowFlirts(initialData.howFlirts || initialData.flirting_style || "");
    setQuirksAndHabits(initialData.quirksAndHabits || initialData.quirks || "");
    setOpeningLine(initialData.openingLine || initialData.greeting || "");

    setLifeStory(initialData.lifeStory || initialData.bio || "");
    setHappyMemories(parseArraySafely(initialData.happyMemories || initialData.happy_memories));
    setPainfulMemories(parseArraySafely(initialData.painfulMemories || initialData.painful_memories));
    setPastRelationship(initialData.pastRelationship || initialData.ex || "");
    setFearsInsecurities(initialData.fearsInsecurities || initialData.fears || "");
    setDreamsGoals(initialData.dreamsGoals || initialData.dreams || "");
    setValues(initialData.values || "");
    setLikes(parseArraySafely(initialData.likes));
    setDislikes(parseArraySafely(initialData.dislikes));
    setHobbies(parseArraySafely(initialData.hobbies));
    setSecrets(parseArraySafely(initialData.secrets));

    const rawPers = parseArraySafely(initialData.personality || initialData.impression);
    setPersonality(rawPers.length > 0 ? rawPers : ["Friendly", "Smart"]);
    setProfileType(initialData.profileType || initialData.type || "local");
    setTimezone(initialData.timezone || "Asia/Kolkata");
    setTextingLanguage(
      initialData.textingLanguage ||
      (Array.isArray(initialData.language) ? initialData.language[0] : initialData.language) ||
      "English"
    );

    setEmail(initialData.email || "");

    if (initialData.image) {
      setImagePreview(
        initialData.image.startsWith("http")
          ? initialData.image
          : baseURL + initialData.image.replace(/\\/g, "/")
      );
    }

    if (Array.isArray(initialData.photoGallery)) {
      setExistingGallery(initialData.photoGallery.filter((img: any) => img && typeof img === "string" && img.trim().length > 0));
    }

    const vids = Array.isArray(initialData.video) && initialData.video.length > 0
      ? initialData.video
      : (Array.isArray(initialData.profileVideo) ? initialData.profileVideo : []);
    setExistingVideos(vids.filter((v: any) => v && typeof v === "string" && v.trim().length > 0));
  }, [initialData]);

  const togglePersonality = (trait: string) => {
    if (personality.includes(trait)) {
      setPersonality(personality.filter((p) => p !== trait));
    } else {
      setPersonality([...personality, trait]);
    }
  };

  // Generate dynamic live prompt for the AI Host
  const generatedPrompt = useMemo(() => {
    if (initialData?.prompt && !name) {
      return initialData.prompt;
    }

    const isBoy = gender === "male";
    const pronoun = isBoy ? "he" : "she";

    let p = `You are ${name || "AI Host"} ${surname || ""}`.trim();
    if (age) p += `, a ${age}-year-old ${gender === "male" ? "man" : "woman"}`;
    if (whereFrom) p += ` from ${whereFrom}`;
    if (workOrStudy) p += `.\nOccupation/Background: ${workOrStudy}`;
    p += `.\n\n`;

    if (looksLike) p += `APPEARANCE:\n${looksLike}\n\n`;
    if (normalDay) p += `DAILY ROUTINE:\n${normalDay}\n\n`;

    p += `TEXTING & COMMUNICATION STYLE:\n`;
    if (textingStyle) p += `- Texting style: ${textingStyle}\n`;
    if (howFlirts) p += `- Flirting style: ${howFlirts}\n`;
    if (quirksAndHabits) p += `- Quirks & habits: ${quirksAndHabits}\n`;
    if (openingLine) p += `- How ${pronoun} greets: ${openingLine}\n`;
    p += `\n`;

    if (lifeStory) p += `BACKSTORY & LIFE STORY:\n${lifeStory}\n\n`;

    if (motherName || fatherName || siblings.length > 0) {
      p += `FAMILY:\n`;
      if (motherName) p += `- Mother: ${motherName}\n`;
      if (fatherName) p += `- Father: ${fatherName}\n`;
      if (siblings.length > 0) p += `- Siblings: ${siblings.join(", ")}\n`;
      p += `\n`;
    }

    if (happyMemories.length > 0) p += `HAPPY MEMORIES:\n- ${happyMemories.join("\n- ")}\n\n`;
    if (painfulMemories.length > 0) p += `PAINFUL MEMORIES:\n- ${painfulMemories.join("\n- ")}\n\n`;
    if (pastRelationship) p += `PAST RELATIONSHIPS / EX:\n${pastRelationship}\n\n`;
    if (fearsInsecurities) p += `FEARS & INSECURITIES:\n${fearsInsecurities}\n\n`;
    if (dreamsGoals) p += `DREAMS & GOALS:\n${dreamsGoals}\n\n`;
    if (values) p += `VALUES:\n${values}\n\n`;

    if (likes.length > 0) p += `LIKES: ${likes.join(", ")}\n`;
    if (dislikes.length > 0) p += `DISLIKES: ${dislikes.join(", ")}\n`;
    if (hobbies.length > 0) p += `HOBBIES: ${hobbies.join(", ")}\n`;
    if (secrets.length > 0) p += `SECRETS (reveal slowly over time): ${secrets.join(", ")}\n`;
    if (personality.length > 0) p += `PERSONALITY TRAITS: ${personality.join(", ")}\n`;

    p += `\nLANGUAGE & TIMEZONE:\n`;
    p += `- Language: ${profileType === "global" ? "English" : "Hinglish (Roman Script)"}\n`;
    p += `- Timezone: ${profileType === "global" ? timezone : "Asia/Kolkata (India)"}\n`;

    return p.trim();
  }, [
    name,
    surname,
    age,
    gender,
    whereFrom,
    workOrStudy,
    looksLike,
    normalDay,
    textingStyle,
    howFlirts,
    quirksAndHabits,
    openingLine,
    lifeStory,
    motherName,
    fatherName,
    siblings,
    happyMemories,
    painfulMemories,
    pastRelationship,
    fearsInsecurities,
    dreamsGoals,
    values,
    likes,
    dislikes,
    hobbies,
    secrets,
    personality,
    profileType,
    timezone,
    initialData,
  ]);

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const compressed = await compressImage(file);
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    }
  };

  // Multi Photo Gallery Handlers
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
    setRemovePhotoGalleryIndex((prev) => [...prev, index]);
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
    setRemoveVideoIndexes((prev) => [...prev, index]);
    setExistingVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopyPrompt = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Name is required!");
      return;
    }
    if (!initialData && !imageFile) {
      setErrorMsg("Profile Image is required when creating a new AI Host!");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("gender", gender);
      formData.append("email", email.trim() || `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now()}@aihost.com`);
      formData.append("bio", lifeStory || openingLine || "AI Host Persona");
      formData.append("dob", dobFreeText || "01/01/2000");
      formData.append("age", age.toString());
      formData.append("country", whereFrom || "India");
      formData.append("countryFlagImage", "https://flagcdn.com/w320/in.png");
      formData.append("chatRate", chatRate.toString());
      formData.append("impression", JSON.stringify(personality));
      formData.append("language", JSON.stringify([profileType === "global" ? "English" : "Hinglish"]));

      // AI Host Persona Prompt Fields
      formData.append("surname", surname);
      formData.append("birthdateFreeText", dobFreeText);
      formData.append("whereFrom", whereFrom);
      formData.append("workOrStudy", workOrStudy);
      formData.append("motherName", motherName);
      formData.append("fatherName", fatherName);
      formData.append("siblings", JSON.stringify(siblings));
      formData.append("looksLike", looksLike);
      formData.append("normalDay", normalDay);
      formData.append("textingStyle", textingStyle);
      formData.append("howFlirts", howFlirts);
      formData.append("quirksAndHabits", quirksAndHabits);
      formData.append("openingLine", openingLine);
      formData.append("lifeStory", lifeStory);
      formData.append("happyMemories", JSON.stringify(happyMemories));
      formData.append("painfulMemories", JSON.stringify(painfulMemories));
      formData.append("pastRelationship", pastRelationship);
      formData.append("fearsInsecurities", fearsInsecurities);
      formData.append("dreamsGoals", dreamsGoals);
      formData.append("values", values);
      formData.append("likes", JSON.stringify(likes));
      formData.append("dislikes", JSON.stringify(dislikes));
      formData.append("hobbies", JSON.stringify(hobbies));
      formData.append("secrets", JSON.stringify(secrets));
      formData.append("personality", JSON.stringify(personality));
      formData.append("profileType", profileType);
      formData.append("timezone", profileType === "global" ? timezone : "Asia/Kolkata");
      formData.append("prompt", generatedPrompt);
      formData.append("textingLanguage", profileType === "global" ? "English" : "Hinglish");

      if (imageFile) {
        const finalImage = await compressImage(imageFile);
        formData.append("image", finalImage);
      }

      // Append Photo Gallery Images
      if (galleryFiles.length > 0) {
        galleryFiles.forEach((file) => {
          formData.append("photoGallery", file);
        });
      }
      if (removePhotoGalleryIndex.length > 0) {
        formData.append("removePhotoGalleryIndex", JSON.stringify(removePhotoGalleryIndex));
      }

      // Append Videos
      if (videoFiles.length > 0) {
        videoFiles.forEach((file) => {
          formData.append("video", file);
        });
      }
      if (removeVideoIndexes.length > 0) {
        formData.append("removeVideoIndexes", JSON.stringify(removeVideoIndexes));
      }

      const aiProfilePayload = {
        name: name.trim(),
        surname: surname.trim() || undefined,
        gender: gender,
        age: Number(age) || 20,
        birthdate: dobFreeText || undefined,
        home_place: whereFrom || undefined,
        mother_name: motherName || undefined,
        father_name: fatherName || undefined,
        siblings: siblings.length ? siblings : undefined,
        appearance: looksLike || undefined,
        occupation: workOrStudy || undefined,
        daily_routine: normalDay || undefined,
        quirks: quirksAndHabits || undefined,
        texting_style: textingStyle || undefined,
        flirting_style: howFlirts || undefined,
        bio: lifeStory || openingLine || undefined,
        happy_memories: happyMemories.length ? happyMemories : undefined,
        painful_memories: painfulMemories.length ? painfulMemories : undefined,
        ex: pastRelationship || undefined,
        fears: fearsInsecurities || undefined,
        dreams: dreamsGoals || undefined,
        likes: likes.length ? likes : undefined,
        dislikes: dislikes.length ? dislikes : undefined,
        hobbies: hobbies.length ? hobbies : undefined,
        values: values || undefined,
        secrets: secrets.length ? secrets : undefined,
        greeting: openingLine || undefined,
        personality: personality,
        language: profileType === "global" ? "English" : "Hinglish",
        type: profileType,
        timezone: profileType === "global" ? timezone : "Asia/Kolkata",
        prompt: generatedPrompt,
      };

      let res: any;
      if (initialData?._id) {
        formData.append("hostId", initialData._id);
        res = await dispatch(updateHost(formData));
        if (initialData?.aiProfileId) {
          updateAiProfile(initialData.aiProfileId, aiProfilePayload).catch(() => {});
        }
      } else {
        res = await dispatch(createHost(formData));
        createAiProfile(aiProfilePayload).catch(() => {});
      }

      if (res?.payload?.status) {
        router.push("/AiHost");
      } else {
        setErrorMsg(res?.payload?.message || "Failed to save AI Host");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  const defaultAvatar = gender === "female" ? femaleAvatar.src : maleAvatar.src;

  return (
    <>
      <style jsx global>{`
        /* AI Host Clean Square Styling Overrides */
        .ai-sq-input {
          border-radius: 6px !important;
          border: 1.5px solid #cbd5e1 !important;
          padding: 9px 12px !important;
          font-size: 13.5px !important;
          background-color: #ffffff !important;
          color: #0f172a !important;
          width: 100% !important;
          outline: none !important;
          box-shadow: none !important;
          transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
        }
        .ai-sq-input:focus,
        .ai-sq-textarea:focus,
        .ai-chip-container:focus-within {
          border-color: #8F6DFF !important;
          box-shadow: 0 0 0 3px rgba(143, 109, 255, 0.15) !important;
        }
        .ai-sq-input::placeholder {
          color: #94a3b8 !important;
        }
        .ai-sq-textarea {
          border-radius: 6px !important;
          border: 1.5px solid #cbd5e1 !important;
          padding: 10px 12px !important;
          font-size: 13.5px !important;
          background-color: #ffffff !important;
          color: #0f172a !important;
          width: 100% !important;
          outline: none !important;
          box-shadow: none !important;
          transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
        }
        .ai-sq-textarea:focus {
          border-color: #8F6DFF !important;
          box-shadow: 0 0 0 3px rgba(143, 109, 255, 0.15) !important;
        }
        .ai-sq-textarea::placeholder {
          color: #94a3b8 !important;
        }
        .ai-sq-btn {
          border-radius: 6px !important;
          font-weight: 600 !important;
          transition: all 0.15s ease !important;
        }
        .ai-tag-badge {
          border-radius: 4px !important;
        }
        .ai-card-sq {
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
        }
      `}</style>

      <form onSubmit={handleSubmit} className="mb-5">
        {/* Top Header Card */}
        <div className="card shadow-sm ai-card-sq p-4 bg-white mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <span
                className="badge px-2.5 py-1 ai-tag-badge fs-12 mb-1 fw-bold"
                style={{
                  backgroundColor: gender === "female" ? "#fce7f3" : "#ede9fe",
                  color: gender === "female" ? "#db2777" : "#7c3aed",
                }}
              >
                {gender === "female" ? "AI Girl Host" : "AI Boy Host"}
              </span>
              <h3 className="fw-bold text-dark mb-0 fs-20">
                {initialData ? `Edit ${initialData.name}` : `Create AI ${gender === "female" ? "Girl" : "Boy"} Host`}
              </h3>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary ai-sq-btn px-4 py-2 fs-13"
                onClick={() => router.push("/AiHost")}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn text-white ai-sq-btn px-4 py-2 fs-13 shadow-sm d-flex align-items-center gap-2"
                style={{ backgroundColor: "#8F6DFF" }}
                disabled={loading}
              >
                <FaSave />
                <span>{loading ? "Saving..." : "Save Host"}</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="alert alert-danger rounded-2 mt-3 mb-0 fs-13 py-2 px-3">
              <i className="ri-error-warning-line me-2"></i>
              {errorMsg}
            </div>
          )}
        </div>

        <div className="row g-4">
          {/* LEFT COLUMN: IDENTITY & STORY */}
          <div className="col-12 col-lg-8">

            {/* SECTION 1: IDENTITY */}
            <div className="card shadow-sm ai-card-sq p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark border-bottom pb-3 mb-4 d-flex align-items-center gap-2 fs-16">
                <i className="ri-user-smile-line" style={{ color: "#8F6DFF" }}></i> Identity Details
              </h5>

              {/* Gender Selection */}
              <div className="mb-4">
                <label className="form-label fw-semibold fs-13 text-dark mb-1">Gender *</label>
                <div className="d-flex gap-3">
                  <button
                    type="button"
                    className={`btn ai-sq-btn px-4 py-2 flex-grow-1 d-flex align-items-center justify-content-center gap-2 fs-13 ${
                      gender === "female"
                        ? "text-white shadow-sm"
                        : "btn-outline-secondary"
                    }`}
                    style={gender === "female" ? { backgroundColor: "#EC4899", borderColor: "#EC4899" } : {}}
                    onClick={() => setGender("female")}
                  >
                    <i className="ri-women-line fs-16"></i> Girl
                  </button>
                  <button
                    type="button"
                    className={`btn ai-sq-btn px-4 py-2 flex-grow-1 d-flex align-items-center justify-content-center gap-2 fs-13 ${
                      gender === "male"
                        ? "text-white shadow-sm"
                        : "btn-outline-secondary"
                    }`}
                    style={gender === "male" ? { backgroundColor: "#8F6DFF", borderColor: "#8F6DFF" } : {}}
                    onClick={() => setGender("male")}
                  >
                    <i className="ri-men-line fs-16"></i> Boy
                  </button>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Name *</label>
                  <input
                    type="text"
                    className="ai-sq-input"
                    placeholder="e.g. Priya"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Surname</label>
                  <input
                    type="text"
                    className="ai-sq-input"
                    placeholder="e.g. Patel"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Age</label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    placeholder="e.g. 23"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Chat Rate (Coins/Message)</label>
                  <input
                    type="number"
                    className="ai-sq-input"
                    placeholder="e.g. 10"
                    value={chatRate}
                    onChange={(e) => setChatRate(Number(e.target.value))}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Birthdate (free text)</label>
                  <input
                    type="text"
                    className="ai-sq-input"
                    placeholder="e.g. 17 November 2002"
                    value={dobFreeText}
                    onChange={(e) => setDobFreeText(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Where she/he is from</label>
                  <input
                    type="text"
                    className="ai-sq-input"
                    placeholder="e.g. Paldi, Ahmedabad"
                    value={whereFrom}
                    onChange={(e) => setWhereFrom(e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Work or study</label>
                  <textarea
                    rows={2}
                    className="ai-sq-textarea"
                    placeholder="e.g. Graphic designer in textile export house on Ashram Road, Ahmedabad..."
                    value={workOrStudy}
                    onChange={(e) => setWorkOrStudy(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Mother's name</label>
                  <input
                    type="text"
                    className="ai-sq-input"
                    placeholder="e.g. Nita (runs tiffin service)"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Father's name</label>
                  <input
                    type="text"
                    className="ai-sq-input"
                    placeholder="e.g. Rajesh (owns small cloth shop)"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <ChipTagInput
                    label="Siblings"
                    placeholder="Type sibling name & press Enter"
                    tags={siblings}
                    onChange={setSiblings}
                    badgeBg="#6366f1"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Custom Email (Optional)</label>
                  <input
                    type="email"
                    className="ai-sq-input"
                    placeholder="e.g. priya@quietchat.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: APPEARANCE & ROUTINE */}
            <div className="card shadow-sm ai-card-sq p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark border-bottom pb-3 mb-4 d-flex align-items-center gap-2 fs-16">
                <i className="ri-sun-line text-warning"></i> Appearance & Routine
              </h5>

              <div className="mb-3">
                <label className="form-label fw-semibold fs-13 text-dark mb-1">What she/he looks like</label>
                <textarea
                  className="ai-sq-textarea"
                  rows={2}
                  placeholder="e.g. 5'6'', long straight black hair, kohl-lined eyes, deep dimple on left cheek..."
                  value={looksLike}
                  onChange={(e) => setLooksLike(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold fs-13 text-dark mb-1">A normal day</label>
                <textarea
                  className="ai-sq-textarea"
                  rows={2}
                  placeholder="Describe daily schedule, morning routine, work hours, evening tea..."
                  value={normalDay}
                  onChange={(e) => setNormalDay(e.target.value)}
                />
              </div>
            </div>

            {/* SECTION 3: TEXTING STYLE & VOICE */}
            <div className="card shadow-sm ai-card-sq p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark border-bottom pb-3 mb-4 d-flex align-items-center gap-2 fs-16">
                <i className="ri-chat-smile-2-line text-success"></i> Texting Style & Voice
              </h5>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Texting style</label>
                  <input
                    type="text"
                    className="ai-sq-input"
                    placeholder="e.g. Short messages, emojis, cheerful, snappy replies"
                    value={textingStyle}
                    onChange={(e) => setTextingStyle(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">How she/he flirts</label>
                  <input
                    type="text"
                    className="ai-sq-input"
                    placeholder="e.g. Playful teasing, subtle compliments"
                    value={howFlirts}
                    onChange={(e) => setHowFlirts(e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Quirks and habits</label>
                  <input
                    type="text"
                    className="ai-sq-input"
                    placeholder="e.g. Uses 'haha' often, double texts when excited"
                    value={quirksAndHabits}
                    onChange={(e) => setQuirksAndHabits(e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">
                    Opening line <span className="text-muted fw-normal">(initial icebreaker message)</span>
                  </label>
                  <textarea
                    className="ai-sq-textarea"
                    rows={2}
                    placeholder="e.g. Hey! Kaisa chal raha hai aaj ka din? 😊"
                    value={openingLine}
                    onChange={(e) => setOpeningLine(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: STORY & BACKGROUND */}
            <div className="card shadow-sm ai-card-sq p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark border-bottom pb-3 mb-4 d-flex align-items-center gap-2 fs-16">
                <i className="ri-book-open-line text-primary"></i> Story, Memories & Secrets
              </h5>

              <div className="mb-3">
                <label className="form-label fw-semibold fs-13 text-dark mb-1">Life story & Bio</label>
                <textarea
                  className="ai-sq-textarea"
                  rows={3}
                  placeholder="Background, where grew up, college days, key turning points..."
                  value={lifeStory}
                  onChange={(e) => setLifeStory(e.target.value)}
                />
              </div>

              <ChipTagInput
                label="Happy memories"
                placeholder="Type happy memory & press Enter"
                tags={happyMemories}
                onChange={setHappyMemories}
                badgeBg="#10b981"
              />

              <ChipTagInput
                label="Painful memories"
                placeholder="Type painful memory & press Enter"
                tags={painfulMemories}
                onChange={setPainfulMemories}
                badgeBg="#ef4444"
              />

              <div className="mb-3">
                <label className="form-label fw-semibold fs-13 text-dark mb-1">About ex / past relationship</label>
                <textarea
                  className="ai-sq-textarea"
                  rows={2}
                  placeholder="e.g. Dated for 2 years in college, broke up peacefully..."
                  value={pastRelationship}
                  onChange={(e) => setPastRelationship(e.target.value)}
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Fears and insecurities</label>
                  <input
                    type="text"
                    className="ai-sq-input"
                    placeholder="e.g. Fear of losing loved ones, failure"
                    value={fearsInsecurities}
                    onChange={(e) => setFearsInsecurities(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Dreams and goals</label>
                  <input
                    type="text"
                    className="ai-sq-input"
                    placeholder="e.g. Travel to Greece, open a design studio"
                    value={dreamsGoals}
                    onChange={(e) => setDreamsGoals(e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">What she/he values</label>
                  <input
                    type="text"
                    className="ai-sq-input"
                    placeholder="e.g. Authenticity, kindness, family bond"
                    value={values}
                    onChange={(e) => setValues(e.target.value)}
                  />
                </div>
              </div>

              <ChipTagInput
                label="Likes"
                placeholder="Type liked item & press Enter"
                tags={likes}
                onChange={setLikes}
                badgeBg="#0ea5e9"
              />

              <ChipTagInput
                label="Dislikes"
                placeholder="Type disliked item & press Enter"
                tags={dislikes}
                onChange={setDislikes}
                badgeBg="#f59e0b"
              />

              <ChipTagInput
                label="Hobbies"
                placeholder="Type hobby & press Enter"
                tags={hobbies}
                onChange={setHobbies}
                badgeBg="#8b5cf6"
              />

              <ChipTagInput
                label="Secrets (revealed slowly over time)"
                placeholder="Type secret & press Enter"
                tags={secrets}
                onChange={setSecrets}
                badgeBg="#1e293b"
              />
            </div>

            {/* SECTION 5: LANGUAGE & TIME */}
            <div className="card shadow-sm ai-card-sq p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark border-bottom pb-3 mb-3 d-flex align-items-center gap-2 fs-16">
                <FaGlobe style={{ color: "#8F6DFF" }} /> Language & Time
              </h5>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold fs-13 text-dark mb-1">Profile Type</label>
                  <div className="d-flex gap-3">
                    <label
                      className={`p-3 border rounded flex-fill cursor-pointer ${
                        profileType === "local" ? "border-primary bg-light" : ""
                      }`}
                      style={{ borderRadius: "6px" }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="radio"
                          name="profileType"
                          checked={profileType === "local"}
                          onChange={() => {
                            setProfileType("local");
                            setTimezone("Asia/Kolkata");
                            setTextingLanguage("Hinglish");
                          }}
                        />
                        <strong className="fs-14">Local — Hinglish (Roman)</strong>
                      </div>
                      <small className="text-muted d-block mt-1 fs-12">
                        {gender === "female" ? "She" : "He"} always texts in Hinglish, on India time (Asia/Kolkata).
                      </small>
                    </label>

                    <label
                      className={`p-3 border rounded flex-fill cursor-pointer ${
                        profileType === "global" ? "border-primary bg-light" : ""
                      }`}
                      style={{ borderRadius: "6px" }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="radio"
                          name="profileType"
                          checked={profileType === "global"}
                          onChange={() => {
                            setProfileType("global");
                            setTextingLanguage("English");
                          }}
                        />
                        <strong className="fs-14">Global — English</strong>
                      </div>
                      <small className="text-muted d-block mt-1 fs-12">
                        Texts in English; requires a selected timezone.
                      </small>
                    </label>
                  </div>
                </div>

                {profileType === "global" && (
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold fs-13 text-dark mb-1">Timezone *</label>
                    <CustomSelect
                      options={TIMEZONE_OPTIONS.map((t) => ({ value: t, label: t }))}
                      value={timezone}
                      onChange={(val) => setTimezone(val)}
                      searchable={true}
                      placeholder="Select or search timezone..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 6: GENERATED PROMPT PREVIEW CARD */}
            <div className="card shadow-sm ai-card-sq p-4 bg-white mb-4">
              <div
                className="d-flex align-items-center justify-content-between cursor-pointer"
                onClick={() => setShowPromptPreview(!showPromptPreview)}
              >
                <div className="d-flex align-items-center gap-2">
                  <FaRobot style={{ color: "#8F6DFF", fontSize: "18px" }} />
                  <span className="fw-bold text-dark fs-15">
                    See {gender === "male" ? "his" : "her"} generated prompt ({generatedPrompt.length} chars)
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
                      Computed live from persona details. Passed to Python AI Backend for system prompt:
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
                    style={{ maxHeight: "300px", overflowY: "auto", whiteSpace: "pre-wrap", borderRadius: "6px" }}
                  >
                    {generatedPrompt}
                  </pre>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: AVATAR, MEDIA & TRAITS */}
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

            {/* PERSONALITY TRAITS CARD */}
            <div className="card shadow-sm ai-card-sq p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark border-bottom pb-3 mb-3 d-flex align-items-center gap-2 fs-15">
                <i className="ri-emotion-line text-warning"></i> Personality Traits
              </h5>

              <div className="d-flex flex-wrap gap-2">
                {personalityOptions.map((trait) => {
                  const isSelected = personality.includes(trait);
                  return (
                    <button
                      key={trait}
                      type="button"
                      className={`btn btn-sm ai-sq-btn px-3 py-1.5 fs-12 ${
                        isSelected
                          ? "text-white shadow-sm"
                          : "btn-outline-secondary"
                      }`}
                      style={isSelected ? { backgroundColor: "#8F6DFF", borderColor: "#8F6DFF" } : {}}
                      onClick={() => togglePersonality(trait)}
                    >
                      {isSelected && <i className="ri-check-line me-1"></i>}
                      {trait}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACTION CARD */}
            <div className="card shadow-sm ai-card-sq p-4 bg-white">
              <div className="d-flex flex-column gap-2">
                <button
                  type="submit"
                  className="btn text-white ai-sq-btn py-2.5 fs-14 shadow-sm w-100 d-flex align-items-center justify-content-center gap-2"
                  style={{ backgroundColor: "#8F6DFF" }}
                  disabled={loading}
                >
                  <FaSave />
                  <span>{loading ? "Saving..." : initialData ? "Update AI Host" : "Create AI Host"}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary ai-sq-btn py-2 fs-13 w-100"
                  onClick={() => router.push("/AiHost")}
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

export default AiHostForm;
