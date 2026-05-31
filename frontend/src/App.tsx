import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");

  const [loading, setLoading] = useState(false);

  const [uploadResponse, setUploadResponse] =
    useState<any>(null);

  const [answer, setAnswer] =
    useState("");

  const [sources, setSources] =
    useState<any[]>([]);

  const uploadPdf = async () => {
    if (!file) {
      alert("Please select a PDF");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append(
        "file",
        file
      );

      const res = await axios.post(
        "http://localhost:5001/api/upload",
        formData
      );

      setUploadResponse(
        res.data
      );

      alert(
        "PDF uploaded successfully"
      );

    } catch (error) {
      console.error(error);

      alert(
        "Upload failed"
      );

    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!question) {
      alert(
        "Enter a question"
      );
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5001/api/chat",
        {
          query: question,
        }
      );

      setAnswer(
        res.data.answer
      );

      setSources(
        res.data.sources || []
      );

    } catch (error) {
      console.error(error);

      alert(
        "Question failed"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "40px",
        fontFamily: "Arial"
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto"
        }}
      >
        <h1>
          Project Memory AI
        </h1>

        <p>
          Enterprise Knowledge
          Management System
        </p>

        <hr />

        <h2>
          Upload PDF
        </h2>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) =>
            setFile(
              e.target.files?.[0] ||
              null
            )
          }
        />

        <br />
        <br />

        <button
          onClick={uploadPdf}
          style={{
            padding:
              "10px 20px"
          }}
        >
          {loading
            ? "Uploading..."
            : "Upload PDF"}
        </button>

        {uploadResponse && (
          <div
            style={{
              marginTop: "20px",
              background:
                "#1e293b",
              padding: "15px",
              borderRadius:
                "10px"
            }}
          >
            <h3>
              Upload Result
            </h3>

            <pre>
              {JSON.stringify(
                uploadResponse,
                null,
                2
              )}
            </pre>
          </div>
        )}

        <hr
          style={{
            marginTop: "40px"
          }}
        />

        <h2>
          Ask Questions
        </h2>

        <input
          value={question}
          onChange={(e) =>
            setQuestion(
              e.target.value
            )
          }
          placeholder="Ask something about the document..."
          style={{
            width: "100%",
            padding: "12px",
            borderRadius:
              "8px",
            border:
              "none"
          }}
        />

        <br />
        <br />

        <button
          onClick={askQuestion}
          style={{
            padding:
              "10px 20px"
          }}
        >
          {loading
            ? "Thinking..."
            : "Ask AI"}
        </button>

        {answer && (
          <div
            style={{
              marginTop: "30px",
              background:
                "#1e293b",
              padding: "20px",
              borderRadius:
                "10px"
            }}
          >
            <h2>
              Answer
            </h2>

            <p>
              {answer}
            </p>
          </div>
        )}

        {sources.length > 0 && (
          <div
            style={{
              marginTop: "20px"
            }}
          >
            <h2>
              Sources
            </h2>

            {sources.map(
              (
                source,
                index
              ) => (
                <div
                  key={index}
                  style={{
                    background:
                      "#1e293b",
                    padding:
                      "15px",
                    marginBottom:
                      "10px",
                    borderRadius:
                      "10px"
                  }}
                >
                  <p>
                    <strong>
                      Page:
                    </strong>{" "}
                    {source.page}
                  </p>

                  <p>
                    <strong>
                      Similarity:
                    </strong>{" "}
                    {source.similarity?.toFixed(
                      4
                    )}
                  </p>

                  <p>
                    {source.preview}
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;