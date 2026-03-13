const crypto = require("crypto");

function sanitizeSegment(value) {
  return String(value)
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extensionFromContentType(contentType) {
  const map = {
    "application/pdf": "pdf",
    "text/plain": "txt",
    "text/markdown": "md",
    "application/json": "json",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "application/zip": "zip",
  };
  return map[contentType] || "bin";
}

function buildObjectKey({ courseCode, uploaderId, contentType }) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = crypto.randomBytes(8).toString("hex");
  const ext = extensionFromContentType(contentType);
  const safeCourseCode = sanitizeSegment(courseCode) || "course";
  const safeUploaderId = sanitizeSegment(uploaderId) || "uploader";
  return `${safeCourseCode}/${date}/${safeUploaderId}/${randomPart}.${ext}`;
}

module.exports = {
  buildObjectKey,
};
