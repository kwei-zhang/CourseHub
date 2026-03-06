const BLOCKED_DOWNLOAD_POLICIES = new Set(["HIGHLY_SENSITIVE"]);
const RESTRICTED_DOWNLOAD_POLICIES = new Set(["EXAM", "SOLUTION"]);
const PRIVILEGED_DOWNLOAD_ROLES = new Set(["TA", "INSTRUCTOR"]);
const VALID_POLICIES = new Set(["LECTURE", "ASSIGNMENT", "EXAM", "SOLUTION", "HIGHLY_SENSITIVE"]);

function normalizeUpper(value) {
  return String(value || "").trim().toUpperCase();
}

function isValidPolicy(policy) {
  return VALID_POLICIES.has(normalizeUpper(policy));
}

function canIssueDownload(resourcePolicy, requesterRole) {
  const normalizedPolicy = normalizeUpper(resourcePolicy);
  if (BLOCKED_DOWNLOAD_POLICIES.has(normalizedPolicy)) {
    return {
      allowed: false,
      message: `Download is not allowed for policy ${resourcePolicy}`,
    };
  }

  if (RESTRICTED_DOWNLOAD_POLICIES.has(normalizedPolicy)) {
    const normalizedRole = normalizeUpper(requesterRole);
    if (!PRIVILEGED_DOWNLOAD_ROLES.has(normalizedRole)) {
      return {
        allowed: false,
        message: `Download for policy ${resourcePolicy} requires role TA or Instructor`,
      };
    }
  }

  return { allowed: true };
}

module.exports = {
  isValidPolicy,
  canIssueDownload,
};
