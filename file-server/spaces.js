const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const REGION = process.env.SPACES_REGION || "tor1";
const ENDPOINT = process.env.SPACES_ENDPOINT || `https://${REGION}.digitaloceanspaces.com`;
const BUCKET = process.env.SPACES_BUCKET;
const KEY = process.env.SPACES_KEY;
const SECRET = process.env.SPACES_SECRET;

if (!BUCKET || !KEY || !SECRET) {
  const missing = [].concat(
    !BUCKET ? "SPACES_BUCKET" : [],
    !KEY ? "SPACES_KEY" : [],
    !SECRET ? "SPACES_SECRET" : []
  );
  throw new Error(
    `DigitalOcean Spaces config missing. Set in .env: ${missing.join(", ")}. See .env.example.`
  );
}

const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: KEY,
    secretAccessKey: SECRET,
  },
  forcePathStyle: true,
});

async function presignUpload({ objectKey, contentType, expiresIn = 300 }) {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
    ContentType: contentType,
    ACL: "private",
  });
  return getSignedUrl(s3, cmd, { expiresIn });
}

async function presignDownload({ objectKey, expiresIn = 300 }) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: objectKey });
  return getSignedUrl(s3, cmd, { expiresIn });
}

module.exports = { presignUpload, presignDownload };