import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [filePath, setFilePath] = useState("");
  const [variables, setVariables] = useState([]);
  const [userInputs, setUserInputs] = useState({});
  const [generatedFile, setGeneratedFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); 
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please upload a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:3000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setVariables(response.data.variables);
      setFilePath(response.data.filePath);
      setError("");
    } catch (error) {
      setError("Error uploading the file.");
    }
  };

  const handleInputChange = (variable, value) => {
    setUserInputs({
      ...userInputs,
      [variable]: value,
    });
  };

  const handleGenerate = async () => {
    if (Object.keys(userInputs).length === variables.length) {
      setLoading(true); 
      try {
        const response = await axios.post(
          "http://localhost:3000/generate",
          {
            filePath,
            updatedVariables: userInputs,
          },
          {
            responseType: "blob", // Ensure the response is treated as a binary blob
          }
        );

        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setGeneratedFile(pdfUrl);
        setError("");
      } catch (error) {
        console.error("Error generating file:", error);
        setError("Error generating the file.");
      } finally {
        setLoading(false); 
      }
    } else {
      setError("Please fill all inputs.");
    }
  };

  return (
    <div className="main">
      <div className="left">
        <h1>File Generator</h1>
        <div className="file-upload-container">
          <input type="file" accept=".docx" onChange={handleFileChange} />
          <button onClick={handleUpload}>Upload</button>
        </div>
      </div>

      <div className="middle">
        {variables.length > 0 && (
          <div className="form-container">
            <h2>Fill in the following variables:</h2>
            {variables.map((variable) => (
              <div key={variable}>
                <label>{variable}:</label>
                <input
                  type="text"
                  onChange={(e) => handleInputChange(variable, e.target.value)}
                />
              </div>
            ))}
            <button onClick={handleGenerate}>Generate</button>
          </div>
        )}
      </div>

      <div className="right">
        {error && <div className="error-message">{error}</div>}
        {loading && (
          <div className="loading-spinner">
            <p>Generating your PDF... Please wait.</p>
          </div>
        )}
        {generatedFile && !loading && (
          <div className="generated-file-container">
            <h2>Generated File:</h2>
            <iframe
              src={generatedFile}
              title="Generated PDF"
              width="100%"
              height="500px"
              frameBorder="0"
            ></iframe>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
