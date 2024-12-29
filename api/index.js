import express from "express";
import multer from "multer";
import bodyParser from "body-parser";
import fs from "fs";
import mammoth from "mammoth";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import convertapi from "convertapi";  // Import ConvertAPI SDK
import { fileURLToPath } from "url";  // Import fileURLToPath
import { dirname } from "path";  // Import dirname

const app = express();
const port = 3000;

dotenv.config();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("uploads"));

// Get the current directory in an ES module-safe way
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the 'uploads' directory exists
const ensureDirectoryExistence = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const filename = `${Date.now()}${path.extname(file.originalname)}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .docx files are allowed."));
    }
  },
});

const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Error deleting file: ${filePath}`, err);
    });
  }
};

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
    console.error("Error processing file:", error);
    res.status(500).json({ error: "An error occurred while processing the file." });
  }
});

app.post("/generate", async (req, res) => {
  const { filePath, updatedVariables } = req.body;

  if (!filePath || !updatedVariables) {
    return res.status(400).json({ error: "Missing filePath or updatedVariables." });
  }

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: "File not found." });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    let fileContent = result.value;

    // Replace variables in the content
    Object.keys(updatedVariables).forEach((variable) => {
      const regex = new RegExp(`{{\\s*${variable}\\s*}}`, "g");
      fileContent = fileContent.replace(regex, updatedVariables[variable]);
    });

    const updatedFilePath = filePath.replace(/\.docx$/, "_updated.docx");
    fs.writeFileSync(updatedFilePath, fileContent);

    // Initialize ConvertAPI with your secret key
    const convertApi = new convertapi(process.env.CONVERTAPITOKEN);

    // Use ConvertAPI to convert the updated DOCX file to PDF
    convertApi.convert('pdf', { File: updatedFilePath }).then(function(result) {
      const pdfFilePath = path.join(__dirname, 'uploads', 'updated_file.pdf');
      
      // Ensure the 'uploads' directory exists before saving the PDF
      ensureDirectoryExistence(pdfFilePath);  // Ensure directory exists

      // Save the PDF file to the 'uploads' directory
      result.saveFiles(pdfFilePath).then(() => {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'inline; filename="updated_file.pdf"');
        res.sendFile(pdfFilePath); // Send the PDF file back to the client
      }).catch(error => {
        console.error("Error saving PDF:", error);
        res.status(500).json({ error: "An error occurred while saving the PDF file." });
      });
    }).catch(error => {
      console.error("Error converting DOCX to PDF:", error);
      res.status(500).json({ error: "An error occurred during the conversion." });
    });
    
  } catch (error) {
    console.error("Error generating file:", error);
    res.status(500).json({ error: "An error occurred while generating the file." });
  }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
