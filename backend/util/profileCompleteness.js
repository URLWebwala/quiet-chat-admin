/**
 * Required profile fields for app users and hosts after phone/OTP onboarding.
 * Gender: male | female | trans
 */

const ALLOWED_GENDERS = new Set(["male", "female", "trans"]);

/**
 * If incoming is null/undefined, keep existing. If incoming is "" or only whitespace, keep existing (do not wipe DB).
 */
function mergeStringField(existing, incoming) {
  if (incoming === undefined || incoming === null) return existing;
  const t = String(incoming).trim();
  return t.length > 0 ? t : existing;
}

/**
 * Parse common DOB strings (ISO, DD/MM/YYYY, MM/DD/YYYY ambiguous → prefer DD/MM for day-first when first > 12).
 * Slash/dot dates are parsed explicitly (not Date.parse) so DD/MM/YYYY from the app is never misread as US MM/DD.
 */
function parseDobToDate(dob) {
  if (dob == null || dob === "") return null;
  const s = String(dob).trim();
  if (!s) return null;

  const slashLike = /^\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4}$/.test(s);

  if (!slashLike) {
    const ts = Date.parse(s);
    if (!Number.isNaN(ts)) {
      const d = new Date(ts);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }

  const parts = s.split(/[/\-.]/).map((p) => p.trim());
  if (parts.length !== 3) return null;

  const a = parseInt(parts[0], 10);
  const b = parseInt(parts[1], 10);
  const c = parseInt(parts[2], 10);
  if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c)) return null;

  // YYYY-MM-DD or YYYY/MM/DD (stored or API ISO-style)
  if (a > 1000) {
    const d = new Date(a, b - 1, c);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  let y = c;
  if (y < 100) y += 2000;

  let day;
  let month;
  if (a > 12) {
    day = a;
    month = b;
  } else if (b > 12) {
    day = b;
    month = a;
  } else {
    // Ambiguous: assume DD/MM/YYYY (common in IN apps)
    day = a;
    month = b;
  }

  const d = new Date(y, month - 1, day);
  return Number.isNaN(d.getTime()) ? null : d;
}

function ageFromBirthDate(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function hasProfileImage(image) {
  if (image == null) return false;
  const s = String(image).trim();
  return s.length > 0;
}

/**
 * @returns {{ complete: boolean, missingFields: string[], errors: string[] }}
 */
function evaluateProfile({ name, gender, dob, image }) {
  const missingFields = [];
  const errors = [];

  const n = name != null ? String(name).trim() : "";
  if (!n) missingFields.push("name");

  const g = gender != null ? String(gender).toLowerCase().trim() : "";
  if (!g) missingFields.push("gender");
  else if (!ALLOWED_GENDERS.has(g)) errors.push(`gender must be one of: ${[...ALLOWED_GENDERS].join(", ")}`);

  const dobStr = dob != null ? String(dob).trim() : "";
  if (!dobStr) missingFields.push("dob");
  else {
    const bd = parseDobToDate(dobStr);
    if (!bd) errors.push("dob is invalid");
    else {
      const age = ageFromBirthDate(bd);
      if (age == null || age < 18) errors.push("You must be 18 or older");
    }
  }

  if (!hasProfileImage(image)) missingFields.push("image");

  const complete = missingFields.length === 0 && errors.length === 0;
  return { complete, missingFields, errors };
}

exports.ALLOWED_GENDERS = ALLOWED_GENDERS;
exports.mergeStringField = mergeStringField;
exports.parseDobToDate = parseDobToDate;
exports.evaluateProfile = evaluateProfile;
