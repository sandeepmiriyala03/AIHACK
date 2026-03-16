import { snapshotDownload } from "@huggingface/hub";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function downloadModel() {
  try {
    console.log("⬇ Downloading trocr-small-handwritten...");

    await snapshotDownload({
      repoId: "Xenova/trocr-small-handwritten",
      repoType: "model",
      localDir: path.join(
        __dirname,
        "public/models/xenova/trocr-small-handwritten"
      ),
    });

    console.log("✅ Download completed successfully!");
  } catch (error) {
    console.error("❌ Download failed:", error);
  }
}

downloadModel();