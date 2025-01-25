import express from "express";
import multer from "multer";
import bodyParser from "body-parser";
import fs from "fs";
import mammoth from "mammoth";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import xlsx from "xlsx";
import archiver from "archiver";

const app = express();
const port = 3000;

dotenv.config();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("uploads"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the 'uploads' directory exists
const ensureDirectoryExistence = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const filename = `${Date.now()}${path.extname(file.originalname)}`;
    cb(null, filename);
  },
});

// Configure Multer File Filter
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .docx and .xlsx files are allowed."));
    }
  },
});

// Upload and Extract Variables from DOCX
app.post("/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file?.path;

  if (!filePath) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    const cleanedContent = result.value.replace(/\u00A0/g, " ").trim();
    const variableRegex = /{{\s*([\w.-]+)\s*}}/g;
    const variables = [...cleanedContent.matchAll(variableRegex)].map(
      (match) => match[1]
    );

    res.json({ variables, filePath });
  } catch (error) {
    console.error("Error processing DOCX file:", error);
    res.status(500).json({ error: "An error occurred while processing the DOCX file." });
  }
});

// Generate Updated Files from DOCX and Excel
app.post("/generate", upload.single("excelFile"), async (req, res) => {
  const { filePath } = req.body; // Path to the uploaded .docx file
  const excelFile = req.file?.path; // Path to the uploaded Excel file

  if (!filePath || !excelFile) {
    return res.status(400).json({ error: "Missing required filePath or Excel file." });
  }

  try {
    // Parse Excel File
    const workbook = xlsx.readFile(excelFile);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: "DOCX file not found." });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    const templateContent = result.value;

    const generatedFiles = await Promise.all(
      rows.map(async (row, index) => {
        if (!row.name) return null; // Skip if the "name" variable is blank

        let updatedContent = templateContent;

        Object.keys(row).forEach((variable) => {
          const regex = new RegExp(`{{\\s*${variable}\\s*}}`, "g");
          updatedContent = updatedContent.replace(regex, row[variable]);
        });

        // const outputFilePath = path.join(__dirname, "uploads", `updated_file_${index + 1}.docx`);
        const sanitizedFileName = row.name.replace(/[^a-zA-Z0-9-_]/g, "_");
        const outputFilePath = path.join(__dirname, "uploads", `${sanitizedFileName}.docx`);
        ensureDirectoryExistence(outputFilePath);
        await fs.promises.writeFile(outputFilePath, updatedContent);

        return outputFilePath;
      })
    );

    const validGeneratedFiles = generatedFiles.filter(Boolean);

    if (!validGeneratedFiles.length) {
      return res.status(400).json({ error: "No valid rows processed for file generation." });
    }

    const zipFilePath = path.join(__dirname, "uploads", "generated_files.zip");
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);
    validGeneratedFiles.forEach((file) => {
      archive.file(file, { name: path.basename(file) });
    });
    await archive.finalize();

    output.on("close", () => {
      res.download(zipFilePath, "generated_files.zip", (err) => {
        if (err) console.error("Error downloading ZIP file:", err);
      });
    });
  } catch (error) {
    console.error("Error generating files:", error);
    res.status(500).json({ error: "An error occurred while generating the files." });
  } finally {
    if (excelFile) await fs.promises.unlink(excelFile);
  }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
