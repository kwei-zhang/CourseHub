const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const REGION = process.env.SPACES_REGION || "tor1";
const ENDPOINT = process.env.SPACES_ENDPOINT || `https://${REGION}.digitaloceanspaces.com`;
const BUCKET = process.env.SPACES_BUCKET;

const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET,
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