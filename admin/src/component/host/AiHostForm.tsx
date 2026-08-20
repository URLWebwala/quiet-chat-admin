import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/store/store";
import { createHost, updateHost } from "@/store/hostSlice";
import { useRouter } from "next/router";
import femaleAvatar from "@/assets/images/female.png";
import maleAvatar from "@/assets/images/male.png";
import { baseURL } from "@/utils/config";
import { createAiProfile, updateAiProfile } from "@/utils/aiChatApi";

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

// Helper TagInput Component for "type and press enter"
const TagInput = ({
  label,
  placeholder,
  tags,
  onChange,
}: {
  label: string;
  placeholder?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) => {
  const [inputVal, setInputVal] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputVal.trim()) {
      e.preventDefault();
      if (!tags.includes(inputVal.trim())) {
        onChange([...tags, inputVal.trim()]);
      }
      setInputVal("");
    }
  };

  const removeTag = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  return (
    <div className="mb-3">
      <label className="form-label fw-semibold fs-13 text-dark mb-1">{label}</label>
      <div
        className="d-flex flex-wrap align-items-center gap-1.5 p-2 bg-light border rounded-3"
        style={{ minHeight: "44px", backgroundColor: "#F8FAFC" }}
      >
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="badge bg-primary text-white d-flex align-items-center gap-1.5 px-2.5 py-1.5 rounded-pill fs-12"
          >
            {tag}
            <i
              className="ri-close-line cursor-pointer fs-14"
              onClick={() => removeTag(idx)}
            ></i>
          </span>
        ))}
        <input
          type="text"
          className="bg-transparent flex-grow-1 fs-13 px-2 py-1"
          style={{
            border: "none",
            outline: "none",
            boxShadow: "none",
            backgroundColor: "transparent",
          }}
          placeholder={tags.length === 0 ? (placeholder || "type and press enter") : "add another..."}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <small className="text-muted fs-11 ms-1">type and press enter</small>
    </div>
  );
};

export const AiHostForm = ({ initialData }: { initialData?: any }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form state
  const [gender, setGender] = useState<"female" | "male">(initialData?.gender?.toLowerCase() === "male" ? "male" : "female");
  const [name, setName] = useState(initialData?.name || "");
  const [surname, setSurname] = useState(initialData?.surname || "");
  const [age, setAge] = useState(initialData?.age || 20);
  const [chatRate, setChatRate] = useState(initialData?.chatRate || 0);
  const [dobFreeText, setDobFreeText] = useState(initialData?.birthdateFreeText || initialData?.dob || "");
  const [whereFrom, setWhereFrom] = useState(initialData?.whereFrom || initialData?.country || "");
  const [workOrStudy, setWorkOrStudy] = useState(initialData?.workOrStudy || "");
  const [motherName, setMotherName] = useState(initialData?.motherName || "");
  const [fatherName, setFatherName] = useState(initialData?.fatherName || "");
  const [siblings, setSiblings] = useState<string[]>(Array.isArray(initialData?.siblings) ? initialData.siblings : []);

  const [looksLike, setLooksLike] = useState(initialData?.looksLike || "");
  const [normalDay, setNormalDay] = useState(initialData?.normalDay || "");

  const [textingStyle, setTextingStyle] = useState(initialData?.textingStyle || "");
  const [howFlirts, setHowFlirts] = useState(initialData?.howFlirts || "");
  const [quirksAndHabits, setQuirksAndHabits] = useState(initialData?.quirksAndHabits || "");
  const [openingLine, setOpeningLine] = useState(initialData?.openingLine || "");

  const [lifeStory, setLifeStory] = useState(initialData?.lifeStory || initialData?.bio || "");
  const [happyMemories, setHappyMemories] = useState<string[]>(Array.isArray(initialData?.happyMemories) ? initialData.happyMemories : []);
  const [painfulMemories, setPainfulMemories] = useState<string[]>(Array.isArray(initialData?.painfulMemories) ? initialData.painfulMemories : []);
  const [pastRelationship, setPastRelationship] = useState(initialData?.pastRelationship || "");
  const [fearsInsecurities, setFearsInsecurities] = useState(initialData?.fearsInsecurities || "");
  const [dreamsGoals, setDreamsGoals] = useState(initialData?.dreamsGoals || "");
  const [values, setValues] = useState(initialData?.values || "");
  const [likes, setLikes] = useState<string[]>(Array.isArray(initialData?.likes) ? initialData.likes : []);
  const [dislikes, setDislikes] = useState<string[]>(Array.isArray(initialData?.dislikes) ? initialData.dislikes : []);
  const [hobbies, setHobbies] = useState<string[]>(Array.isArray(initialData?.hobbies) ? initialData.hobbies : []);
  const [secrets, setSecrets] = useState<string[]>(Array.isArray(initialData?.secrets) ? initialData.secrets : []);

  const [personality, setPersonality] = useState<string[]>(
    Array.isArray(initialData?.personality) ? initialData.personality : ["Friendly", "Smart"]
  );
  const [textingLanguage, setTextingLanguage] = useState(initialData?.textingLanguage || "English");

  const [email, setEmail] = useState(initialData?.email || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    initialData?.image ? baseURL + initialData.image.replace(/\\/g, "/") : ""
  );

  const togglePersonality = (trait: string) => {
    if (personality.includes(trait)) {
      setPersonality(personality.filter((p) => p !== trait));
    } else {
      setPersonality([...personality, trait]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
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
      formData.append("language", JSON.stringify([textingLanguage]));

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
      formData.append("textingLanguage", textingLanguage);

      if (imageFile) {
        formData.append("image", imageFile);
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
        language: textingLanguage || "Hinglish",
      };

      let res: any;
      if (initialData?._id) {
        formData.append("hostId", initialData._id);
        res = await dispatch(updateHost(formData));
        // Sync profile to Dating AI Chat FastAPI service
        if (initialData?.aiProfileId || initialData?._id) {
          updateAiProfile(initialData.aiProfileId || initialData._id, aiProfilePayload);
        }
      } else {
        res = await dispatch(createHost(formData));
        // Create profile in Dating AI Chat FastAPI service
        createAiProfile(aiProfilePayload);
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
    <form onSubmit={handleSubmit} className="mb-5">
      {/* Top Header Card */}
      <div className="card shadow-sm border rounded-4 p-4 bg-white mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <span className="badge bg-primary-subtle text-primary px-3 py-1.5 rounded-pill fs-13 mb-1">
              {gender === "female" ? "New Girl" : "New Boy"}
            </span>
            <h3 className="fw-bold text-dark mb-0">
              {initialData ? `Edit ${initialData.name}` : `Create AI ${gender === "female" ? "Girl" : "Boy"} Host`}
            </h3>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-pill px-4 py-2 fs-14 fw-medium"
              onClick={() => router.push("/AiHost")}
            >
              Back
            </button>
            <button
              type="submit"
              className="btn btn-primary rounded-pill px-4 py-2 fs-14 fw-semibold shadow"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="alert alert-danger rounded-3 mt-3 mb-0 fs-14">
            <i className="ri-error-warning-line me-2"></i>
            {errorMsg}
          </div>
        )}
      </div>

      <div className="row g-4">
        {/* LEFT COLUMN: IDENTITY & STORY */}
        <div className="col-12 col-lg-8">
          
          {/* SECTION 1: IDENTITY */}
          <div className="card shadow-sm border rounded-4 p-4 bg-white mb-4">
            <h5 className="fw-bold text-dark border-bottom pb-3 mb-4 d-flex align-items-center gap-2">
              <i className="ri-user-smile-line text-primary"></i> Identity
            </h5>

            {/* Gender Selection Pills */}
            <div className="mb-4">
              <label className="form-label fw-semibold fs-13 text-dark">Gender *</label>
              <div className="d-flex gap-3">
                <button
                  type="button"
                  className={`btn rounded-pill px-4 py-2 flex-grow-1 d-flex align-items-center justify-content-center gap-2 ${
                    gender === "female"
                      ? "btn-pink text-white shadow-sm fw-bold"
                      : "btn-outline-secondary"
                  }`}
                  style={gender === "female" ? { backgroundColor: "#EC4899", border: "none" } : {}}
                  onClick={() => setGender("female")}
                >
                  <i className="ri-women-line fs-18"></i> Girl
                </button>
                <button
                  type="button"
                  className={`btn rounded-pill px-4 py-2 flex-grow-1 d-flex align-items-center justify-content-center gap-2 ${
                    gender === "male"
                      ? "btn-primary text-white shadow-sm fw-bold"
                      : "btn-outline-secondary"
                  }`}
                  onClick={() => setGender("male")}
                >
                  <i className="ri-men-line fs-18"></i> Boy
                </button>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold fs-13 text-dark">Name *</label>
                <input
                  type="text"
                  className="form-control py-2 fs-13 rounded-3"
                  placeholder="e.g. Sophia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold fs-13 text-dark">Surname</label>
                <input
                  type="text"
                  className="form-control py-2 fs-13 rounded-3"
                  placeholder="e.g. Miller"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold fs-13 text-dark">Age</label>
                <input
                  type="number"
                  className="form-control py-2 fs-13 rounded-3"
                  placeholder="e.g. 22"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold fs-13 text-dark">Chat Rate (Coins/Message)</label>
                <input
                  type="number"
                  className="form-control py-2 fs-13 rounded-3"
                  placeholder="e.g. 10"
                  value={chatRate}
                  onChange={(e) => setChatRate(Number(e.target.value))}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold fs-13 text-dark">Birthdate (free text)</label>
                <input
                  type="text"
                  className="form-control py-2 fs-13 rounded-3"
                  placeholder="e.g. 14th August 2002"
                  value={dobFreeText}
                  onChange={(e) => setDobFreeText(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold fs-13 text-dark">Where she is from</label>
                <input
                  type="text"
                  className="form-control py-2 fs-13 rounded-3"
                  placeholder="e.g. Mumbai, India"
                  value={whereFrom}
                  onChange={(e) => setWhereFrom(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold fs-13 text-dark">Work or study</label>
                <input
                  type="text"
                  className="form-control py-2 fs-13 rounded-3"
                  placeholder="e.g. Fashion Design Student"
                  value={workOrStudy}
                  onChange={(e) => setWorkOrStudy(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold fs-13 text-dark">Mother's name</label>
                <input
                  type="text"
                  className="form-control py-2 fs-13 rounded-3"
                  placeholder="Mother's name"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold fs-13 text-dark">Father's name</label>
                <input
                  type="text"
                  className="form-control py-2 fs-13 rounded-3"
                  placeholder="Father's name"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                />
              </div>

              <div className="col-12">
                <TagInput
                  label="Siblings"
                  placeholder="Type sibling name & press Enter"
                  tags={siblings}
                  onChange={setSiblings}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: WHAT SHE LOOKS LIKE & DAILY ROUTINE */}
          <div className="card shadow-sm border rounded-4 p-4 bg-white mb-4">
            <h5 className="fw-bold text-dark border-bottom pb-3 mb-4 d-flex align-items-center gap-2">
              <i className="ri-sun-line text-warning"></i> Appearance & Routine
            </h5>

            <div className="mb-3">
              <label className="form-label fw-semibold fs-13 text-dark">What she looks like</label>
              <textarea
                className="form-control fs-13 rounded-3"
                rows={2}
                placeholder="Describe her appearance, hair, eyes, height..."
                value={looksLike}
                onChange={(e) => setLooksLike(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold fs-13 text-dark">A normal day for her</label>
              <textarea
                className="form-control fs-13 rounded-3"
                rows={2}
                placeholder="Describe her typical daily schedule and routine..."
                value={normalDay}
                onChange={(e) => setNormalDay(e.target.value)}
              />
            </div>
          </div>

          {/* SECTION 3: HOW SHE TEXTS */}
          <div className="card shadow-sm border rounded-4 p-4 bg-white mb-4">
            <h5 className="fw-bold text-dark border-bottom pb-3 mb-4 d-flex align-items-center gap-2">
              <i className="ri-chat-smile-2-line text-success"></i> How She Texts
            </h5>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold fs-13 text-dark">Texting style</label>
                <input
                  type="text"
                  className="form-control py-2 fs-13 rounded-3"
                  placeholder="e.g. Uses lots of emojis, casual, playful"
                  value={textingStyle}
                  onChange={(e) => setTextingStyle(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold fs-13 text-dark">How she flirts</label>
                <input
                  type="text"
                  className="form-control py-2 fs-13 rounded-3"
                  placeholder="e.g. Playful teasing, subtle compliments"
                  value={howFlirts}
                  onChange={(e) => setHowFlirts(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold fs-13 text-dark">Quirks and habits</label>
                <input
                  type="text"
                  className="form-control py-2 fs-13 rounded-3"
                  placeholder="e.g. Always sends good morning texts, double texts"
                  value={quirksAndHabits}
                  onChange={(e) => setQuirksAndHabits(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold fs-13 text-dark">
                  Opening line <span className="text-muted font-normal">(shown as her first message)</span>
                </label>
                <textarea
                  className="form-control fs-13 rounded-3"
                  rows={2}
                  placeholder="e.g. Hey there! I was just thinking about you... 😊"
                  value={openingLine}
                  onChange={(e) => setOpeningLine(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: HER STORY & MEMORIES */}
          <div className="card shadow-sm border rounded-4 p-4 bg-white mb-4">
            <h5 className="fw-bold text-dark border-bottom pb-3 mb-4 d-flex align-items-center gap-2">
              <i className="ri-book-open-line text-purple"></i> Her Story & Background
            </h5>

            <div className="mb-3">
              <label className="form-label fw-semibold fs-13 text-dark">Life story</label>
              <textarea
                className="form-control fs-13 rounded-3"
                rows={3}
                placeholder="Her background, childhood, where she grew up..."
                value={lifeStory}
                onChange={(e) => setLifeStory(e.target.value)}
              />
            </div>

            <TagInput
              label="Happy memories"
              placeholder="Type happy memory & press Enter"
              tags={happyMemories}
              onChange={setHappyMemories}
            />

            <TagInput
              label="Painful memories"
              placeholder="Type painful memory & press Enter"
              tags={painfulMemories}
              onChange={setPainfulMemories}
            />

            <div className="mb-3">
              <label className="form-label fw-semibold fs-13 text-dark">About her ex / past relationship</label>
              <textarea
                className="form-control fs-13 rounded-3"
                rows={2}
                placeholder="Details about her past relationship..."
                value={pastRelationship}
                onChange={(e) => setPastRelationship(e.target.value)}
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold fs-13 text-dark">Fears and insecurities</label>
                <input
                  type="text"
                  className="form-control py-2 fs-13 rounded-3"
                  placeholder="e.g. Fear of rejection"
                  value={fearsInsecurities}
                  onChange={(e) => setFearsInsecurities(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold fs-13 text-dark">Dreams and goals</label>
                <input
                  type="text"
                  className="form-control py-2 fs-13 rounded-3"
                  placeholder="e.g. Travel the world, start a brand"
                  value={dreamsGoals}
                  onChange={(e) => setDreamsGoals(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold fs-13 text-dark">What she values</label>
                <input
                  type="text"
                  className="form-control py-2 fs-13 rounded-3"
                  placeholder="e.g. Honesty, loyalty, kindness"
                  value={values}
                  onChange={(e) => setValues(e.target.value)}
                />
              </div>
            </div>

            <TagInput
              label="Likes"
              placeholder="Type liked item & press Enter"
              tags={likes}
              onChange={setLikes}
            />

            <TagInput
              label="Dislikes"
              placeholder="Type disliked item & press Enter"
              tags={dislikes}
              onChange={setDislikes}
            />

            <TagInput
              label="Hobbies"
              placeholder="Type hobby & press Enter"
              tags={hobbies}
              onChange={setHobbies}
            />

            <TagInput
              label="Secrets (revealed slowly, if ever)"
              placeholder="Type secret & press Enter"
              tags={secrets}
              onChange={setSecrets}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: PERSONALITY, AVATAR & LANGUAGE */}
        <div className="col-12 col-lg-4">
          
          {/* AVATAR & MEDIA CARD */}
          <div className="card shadow-sm border rounded-4 p-4 bg-white mb-4">
            <h5 className="fw-bold text-dark border-bottom pb-3 mb-3 d-flex align-items-center gap-2">
              <i className="ri-image-line text-info"></i> Profile Picture
            </h5>

            <div className="text-center py-2">
              <img
                src={imagePreview || defaultAvatar}
                alt="Avatar Preview"
                className="rounded-circle object-fit-cover shadow-sm border border-3 border-white mb-3"
                style={{ width: "130px", height: "130px" }}
              />

              <div>
                <label className="btn btn-outline-primary rounded-pill px-4 py-2 fs-13 cursor-pointer">
                  <i className="ri-upload-cloud-line me-1"></i> Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              <small className="text-muted fs-11 mt-1 d-block">Recommended: Square JPG/PNG</small>
            </div>
          </div>

          {/* PERSONALITY TRAITS CARD */}
          <div className="card shadow-sm border rounded-4 p-4 bg-white mb-4">
            <h5 className="fw-bold text-dark border-bottom pb-3 mb-3 d-flex align-items-center gap-2">
              <i className="ri-emotion-line text-warning"></i> Personality
            </h5>

            <div className="d-flex flex-wrap gap-2">
              {personalityOptions.map((trait) => {
                const isSelected = personality.includes(trait);
                return (
                  <button
                    key={trait}
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 py-1.5 fs-12 fw-medium transition-all ${
                      isSelected
                        ? "btn-primary text-white shadow-sm fw-bold"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => togglePersonality(trait)}
                  >
                    {isSelected && <i className="ri-check-line me-1"></i>}
                    {trait}
                  </button>
                );
              })}
            </div>
          </div>

          {/* LANGUAGE CARD */}
          <div className="card shadow-sm border rounded-4 p-4 bg-white mb-4">
            <h5 className="fw-bold text-dark border-bottom pb-3 mb-3 d-flex align-items-center gap-2">
              <i className="ri-global-line text-success"></i> Texting Language
            </h5>

            <div className="mb-2">
              <label className="form-label fw-semibold fs-13 text-dark">Language she texts in</label>
              <input
                type="text"
                className="form-control py-2 fs-13 rounded-3"
                placeholder="e.g. English"
                value={textingLanguage}
                onChange={(e) => setTextingLanguage(e.target.value)}
              />
            </div>
          </div>

          {/* SAVE / BACK FOOTER CARD */}
          <div className="card shadow-sm border rounded-4 p-4 bg-white">
            <div className="d-flex flex-column gap-2">
              <button
                type="submit"
                className="btn btn-primary rounded-pill py-2.5 fs-14 fw-semibold shadow w-100"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save AI Host"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary rounded-pill py-2.5 fs-14 fw-medium w-100"
                onClick={() => router.push("/AiHost")}
              >
                Back
              </button>
            </div>
          </div>

        </div>
      </div>
    </form>
  );
};

export default AiHostForm;
