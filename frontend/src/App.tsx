import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<any>(null);

  const uploadPdf = async () => {
    if (!file) {
      alert("Please select a PDF");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post("http://localhost:5001/api/upload", formData);
      setUploadResponse(res.data);
      alert("PDF uploaded successfully");
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Project Memory AI</h1>
      <p>Enterprise Knowledge Management System</p>
      <hr />
      <h2>Upload PDF</h2>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <br /><br />
      <button onClick={uploadPdf}>Upload PDF</button>
      {uploadResponse && (
        <pre>{JSON.stringify(uploadResponse, null, 2)}</pre>
      )}
    </div>
  );
}

export default App;
