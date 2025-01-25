import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const FileUpload = ({ label, accept, onChange, onUpload, buttonText }) => (
  <div className="file-upload-container">
    <label>{label}</label>
    <input type="file" accept={accept} onChange={onChange} />
    {onUpload && <button onClick={onUpload}>{buttonText}</button>}
  </div>
);

function App() {
  const [docxFile, setDocxFile] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [filePath, setFilePath] = useState("");
  const [variables, setVariables] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (setter) => (event) => {
    setter(event.target.files[0]);
  };

  const handleDocxUpload = async () => {
    if (!docxFile) return alert("Please upload a .docx file first.");
    const formData = new FormData();
    formData.append("file", docxFile);

    try {
      const { data } = await axios.post("http://localhost:3000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setVariables(data.variables);
      setFilePath(data.filePath);
      setError("");
    } catch (err) {
      setError("Failed to upload and process the .docx file.");
    }
  };

  const handleGenerate = async () => {
    if (!excelFile || !filePath) {
      setError("Please upload both .docx and Excel files.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("excelFile", excelFile);
    formData.append("filePath", filePath);

    try {
      // Generate files request
      const response = await axios.post("http://localhost:3000/generate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob", // Ensures the response is treated as a downloadable file
      });

      // Create a downloadable link
      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "generated_files.zip");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setError("");
    } catch (err) {
      setError("Error generating the files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main">
      <div className="left">
        <h1>File Generator</h1>
        <FileUpload
          label="Upload .docx file:"
          accept=".docx"
          onChange={handleFileChange(setDocxFile)}
          onUpload={handleDocxUpload}
          buttonText="Extract Variables"
        />
        <FileUpload
          label="Upload Excel file:"
          accept=".xlsx, .xls"
          onChange={handleFileChange(setExcelFile)}
        />
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Files"}
        </button>
      </div>

      <div className="middle">
        {variables.length > 0 && (
          <div className="variables-container">
            <h2>Extracted Variables:</h2>
            <ul>
              {variables.map((variable, index) => (
                <li key={index}>{variable}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="right">
        {error && <div className="error-message">{error}</div>}
        {loading && (
          <div className="loading-spinner">
            <p>Generating files... Please wait.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
