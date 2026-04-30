/**
 * sanitize.js
 * Strips characters that could be used for prompt injection before
 * any user-supplied string is forwarded to an AI model.
 */

/** Max length allowed for free-text fields sent to AI prompts */
const MAX_TEXT_LENGTH = 200;

/**
 * Removes shell-like injection patterns and trims the string.
 * @param {string} value
 * @returns {string}
 */
export const sanitizeText = (value) => {
  if (typeof value !== "string") return String(value ?? "");
  return value
    .slice(0, MAX_TEXT_LENGTH)                   // hard length cap
    .replace(/[`${}[\]\\]/g, "")                 // remove shell / template chars
    .replace(/\b(ignore|forget|override|system|assistant|user)\b/gi, "") // prompt injection keywords
    .trim();
};

/**
 * Converts a value to a positive finite number, or returns null.
 * @param {*} value
 * @returns {number|null}
 */
export const sanitizeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Sanitizes the standard health payload sent to AI endpoints.
 * Returns a clean object and a list of any validation errors.
 * @param {{ weight, height, age, activity, gender, diet, sleep }} raw
 * @returns {{ clean: object, errors: string[] }}
 */
export const sanitizeHealthPayload = (raw = {}) => {
  const errors = [];

  const weight = sanitizeNumber(raw.weight);
  const height = sanitizeNumber(raw.height);
  const age    = sanitizeNumber(raw.age);

  if (!weight || weight < 20 || weight > 500)  errors.push("weight must be a number between 20–500 kg");
  if (!height || height < 50 || height > 300)  errors.push("height must be a number between 50–300 cm");
  if (!age    || age < 1    || age > 120)       errors.push("age must be a number between 1–120");

  const activity = sanitizeText(raw.activity || "");
  const gender   = sanitizeText(raw.gender   || "");
  const diet     = sanitizeText(raw.diet     || "");
  const sleep    = sanitizeNumber(raw.sleep) || 0;

  return {
    clean: { weight, height, age, activity, gender, diet, sleep },
    errors,
  };
};
