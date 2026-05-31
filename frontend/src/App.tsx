import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<any>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

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

  const askQuestion = async () => {
    if (!question) {
      alert("Enter a question");
      return;
    }
    try {
      const res = await axios.post("http://localhost:5001/api/chat", { query: question });
      setAnswer(res.data.answer);
    } catch (error) {
      console.error(error);
      alert("Question failed");
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
      
      <hr style={{ marginTop: "40px" }} />
      <h2>Ask Questions</h2>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask something about the document..."
        style={{ width: "100%", padding: "12px" }}
      />
      <br /><br />
      <button onClick={askQuestion}>Ask AI</button>
      
      {answer && (
        <div style={{ marginTop: "30px", background: "#1e293b", padding: "20px", color: "white" }}>
          <h2>Answer</h2>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default App;
