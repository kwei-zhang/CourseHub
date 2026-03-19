require("dotenv").config();

const { S3Client, PutBucketCorsCommand } = require("@aws-sdk/client-s3");

const REGION   = process.env.SPACES_REGION   || "tor1";
const ENDPOINT = process.env.SPACES_ENDPOINT || `https://${REGION}.digitaloceanspaces.com`;
const BUCKET   = process.env.SPACES_BUCKET;
const KEY      = process.env.SPACES_KEY;
const SECRET   = process.env.SPACES_SECRET;

if (!BUCKET || !KEY || !SECRET) {
  console.error("Missing SPACES_BUCKET, SPACES_KEY, or SPACES_SECRET in .env");
  process.exit(1);
}

const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: { accessKeyId: KEY, secretAccessKey: SECRET },
  forcePathStyle: true,
});

// Allow all likely frontend origins. Add your production domain here.
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
];

const corsConfig = {
  CORSRules: [
    {
      AllowedOrigins: ALLOWED_ORIGINS,
      AllowedMethods: ["GET", "PUT", "HEAD"],
      // Explicit headers only — DO Spaces does not reliably honour wildcard "*"
      AllowedHeaders: ["Content-Type", "Content-MD5", "Authorization", "x-amz-date", "x-amz-content-sha256"],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3600,
    },
  ],
};

async function main() {
  try {
    await s3.send(new PutBucketCorsCommand({
      Bucket: BUCKET,
      CORSConfiguration: corsConfig,
    }));
    console.log(`✅  CORS rules applied to bucket: ${BUCKET}`);
    console.log("Allowed origins:", ALLOWED_ORIGINS);
  } catch (err) {
    console.error("❌  Failed to set CORS:", err.message);
    process.exit(1);
  }
}

main();
