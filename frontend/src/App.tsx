import { useState } from "react";

function App() {
  const [file, setFile] = useState<File | null>(null);

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
      <button>Upload PDF</button>
    </div>
  );
}

export default App;
