import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!admin.apps.length) {
  try {
    // ✅ PRODUCTION (Render / Cloud)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        ),
      });
      console.log("✅ Firebase initialized from ENV");
    }
    // ✅ LOCAL DEVELOPMENT
    else {
      const serviceAccountPath = path.join(
        __dirname,
        "/interviewai-237e4-firebase-adminsdk-fbsvc-1a041a83d9.json"
      );

      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, "utf-8")
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase initialized from local file");
    }
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error.message);
  }
}

export default admin;
