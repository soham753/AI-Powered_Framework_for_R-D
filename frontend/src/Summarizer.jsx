import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./summarizer.css";
import Summary_style from "./components/summary_style.jsx";

const Summarizer = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState({
    title: "",
    content: "",
    file_name: "",
  });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.includes("pdf")) {
        setError("Please upload a PDF file");
        return;
      }
      if (selectedFile.size > 25 * 1024 * 1024) {
        setError("File size exceeds 25MB limit");
        return;
      }

      setError(null);
      setFile(selectedFile);
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (url) {
      try {
        new URL(url);
        setError(null);
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      } catch {
        setError("Please enter a valid URL");
      }
    }
  };

  const generateSummary = useCallback(async () => {
    if (!file && !url) return;

    setIsSummarizing(true);
    setError(null);

    try {
      let response;

      if (file) {
        const formData = new FormData();
        formData.append("pdf", file);

        response = await fetch("/api/summarize-pdf/", {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
        });
      } else {
        response = await fetch("/api/summarize-url/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ url }),
          credentials: "include",
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate summary");
      }

      const data = await response.json();
      setSummary(data.summary || "No summary could be generated.");
    } catch (err) {
      console.error("Error generating summary:", err);
      setError(
        err.message || "An error occurred while generating the summary."
      );
      setSummary(null);
    } finally {
      setIsSummarizing(false);
    }
  }, [file, url]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.type.includes("pdf")) {
        setError("Please drop a PDF file");
        return;
      }
      if (droppedFile.size > 25 * 1024 * 1024) {
        setError("File size exceeds 25MB limit");
        return;
      }

      setError(null);
      setFile(droppedFile);
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  }, []);

  const copyToClipboard = useCallback(async () => {
    if (!summary) {
      console.warn("No summary available to copy");
      return;
    }

    try {
      const readableSummary = `
📘 Title: ${summary.title || "N/A"}

📝 Overview:
${summary.overview || "N/A"}

🔑 Key Points:
${(summary.key_points || []).map((point, i) => `${i + 1}. ${point}`).join("\n")}

🧩 Components:
- ${(summary.components || []).join("\n- ")}

🧪 Ingredients:
- ${(summary.ingredients || []).join("\n- ")}

⚙️ Workflow:
- ${(summary.workflow || []).join("\n- ")}

📊 Accuracy Metrics:
${
  summary.accuracy_metrics
    ? Object.entries(summary.accuracy_metrics)
        .map(([key, value]) => `- ${key.replaceAll("_", " ")}: ${value}`)
        .join("\n")
    : "N/A"
}

🛠 Technologies Used:
- ${(summary.technologies_used || []).join("\n- ")}

⚠️ Limitations:
- ${(summary.limitations || []).join("\n- ")}

✅ Advantages:
- ${(summary.advantages || []).join("\n- ")}

🔄 Data Pipeline:
- ${(summary.data_pipeline || []).join("\n- ")}

🌍 Real-World Impact:
- ${(summary.real_world_impact || []).join("\n- ")}

🧾 Products:
- ${(summary.products || []).join("\n- ")}
`.trim();

      await navigator.clipboard.writeText(readableSummary);
    } catch (err) {
      console.error("Failed to copy:", err);
      if (err instanceof Error && err.name === "NotAllowedError") {
        alert("Please enable clipboard permissions for this site");
      }
    }
  }, [summary]);

  const formatSummaryToText = (summary) => {
    if (!summary) return "";

    let output = "";

    if (summary.title) output += `Title: ${summary.title}\n\n`;
    if (summary.overview) output += `Overview:\n${summary.overview}\n\n`;

    if (summary.key_points?.length)
      output += `Key Points:\n${summary.key_points
        .map((p, i) => `${i + 1}. ${p}`)
        .join("\n")}\n\n`;

    if (summary.components?.length)
      output += `Components:\n${summary.components
        .map((c) => `- ${c}`)
        .join("\n")}\n\n`;

    if (summary.ingredients?.length)
      output += `Ingredients:\n${summary.ingredients
        .map((i) => `- ${i}`)
        .join("\n")}\n\n`;

    if (summary.workflow?.length)
      output += `Workflow:\n${summary.workflow
        .map((s) => `- ${s}`)
        .join("\n")}\n\n`;

    if (
      summary.accuracy_metrics &&
      Object.keys(summary.accuracy_metrics).length
    )
      output += `Accuracy Metrics:\n${Object.entries(summary.accuracy_metrics)
        .map(([k, v]) => `- ${k.replace(/_/g, " ")}: ${v}`)
        .join("\n")}\n\n`;

    if (summary.technologies_used?.length)
      output += `Technologies Used:\n${summary.technologies_used
        .map((t) => `- ${t}`)
        .join("\n")}\n\n`;

    if (summary.limitations?.length)
      output += `Limitations:\n${summary.limitations
        .map((l) => `- ${l}`)
        .join("\n")}\n\n`;

    if (summary.advantages?.length)
      output += `Advantages:\n${summary.advantages
        .map((a) => `- ${a}`)
        .join("\n")}\n\n`;

    if (summary.data_pipeline?.length)
      output += `Data Pipeline:\n${summary.data_pipeline
        .map((d) => `- ${d}`)
        .join("\n")}\n\n`;

    if (summary.real_world_impact?.length)
      output += `Real-World Impact:\n${summary.real_world_impact
        .map((r) => `- ${r}`)
        .join("\n")}\n\n`;

    if (summary.products?.length)
      output += `Products:\n${summary.products
        .map((p) => `- ${p}`)
        .join("\n")}\n`;

    return output.trim();
  };

  const handleDownload = () => {
    const summaryContent = document.querySelector(".summary-content");
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>${file ? file.name : "Webpage Summary"}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #3a7bd5; }
            h2 { color: #3a7bd5; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            ul { padding-left: 20px; }
            li { margin-bottom: 8px; }
            .product-tag { 
              display: inline-block;
              background: #e3f2fd;
              color: #1976d2;
              padding: 3px 10px;
              border-radius: 20px;
              margin-right: 8px;
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <h1>${file ? file.name : "Webpage Summary"}</h1>
          ${summaryContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleAddNote = () => {
    const defaultTitle = `Summary Note: ${
      file ? file.name : url.substring(0, 30)
    }...`;
    const formattedContent = formatSummaryToText(summary);

    setNoteContent({
      title: defaultTitle,
      content: formattedContent,
      file_name: file ? file.name : url,
    });

    setShowNoteModal(true);
  };

  const saveNote = async () => {
    try {
      setIsLoading(true);

      const projectId = localStorage.getItem("projectId");
      if (!projectId) {
        throw new Error("No project selected");
      }

      const response = await fetch("/api/note/create_note/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: noteContent.title,
          content: noteContent.content,
          project_id: projectId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save note");
      }

      setShowNoteModal(false);
      setNoteContent({ title: "", content: "", file_name: "" });
      console.log("Note saved successfully!");
    } catch (err) {
      console.error("Error saving note:", err);
      alert(err.message || "Failed to save note");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="summarizer_dashboard">
      <header className="summarizer_dashboard_header">
        <div className="summarizer_header_content">
          <button
            className="summarizer_back_button"
            onClick={() => navigate(-1)}
            aria-label="Back to tools dashboard"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Tools
          </button>
          <div className="summarizer_header_title_group">
            <div className="summarizer_title_gradient">
              <h1>Summarizer</h1>
            </div>
            <p className="summarizer_header_subtitle">
              Generate concise summaries of research papers and documents
            </p>
          </div>
        </div>
      </header>

      <main className="summarizer_content">
        {error && (
          <div className="summarizer_error_message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="summarizer_input_section">
          <div className="summarizer_tabs">
            <button
              className={`summarizer_tab_btn ${
                activeTab === "upload" ? "summarizer_tab_btn_active" : ""
              }`}
              onClick={() => setActiveTab("upload")}
            >
              Upload PDF
            </button>
          </div>

          {activeTab === "upload" ? (
            <div
              className="summarizer_upload_area"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                style={{ display: "none" }}
              />
              {isLoading ? (
                <div className="summarizer_loader_container">
                  <div className="summarizer_loader"></div>
                  <p>Processing your document...</p>
                </div>
              ) : file ? (
                <div className="summarizer_file_preview">
                  <div className="summarizer_file_icon">📄</div>
                  <div className="summarizer_file_info">
                    <h3>{file.name}</h3>
                    <p>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    className="summarizer_change_file_btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <div className="summarizer_upload_icon">📤</div>
                  <h3>Drag & Drop PDF here</h3>
                  <p>or click to browse files</p>
                  <p className="summarizer_upload_note">
                    Supports PDF documents up to 25MB
                  </p>
                </>
              )}
            </div>
          ) : (
            <form className="summarizer_url_form" onSubmit={handleUrlSubmit}>
              <div className="summarizer_input_group">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter webpage URL (e.g., https://arxiv.org/abs/1234.5678)"
                  required
                />
                <button type="submit" className="summarizer_submit_url">
                  {isLoading ? (
                    <div className="summarizer_small_loader"></div>
                  ) : (
                    "Fetch"
                  )}
                </button>
              </div>
            </form>
          )}

          {(file || (url && !isLoading)) && (
            <button
              className="summarizer_summarize_btn"
              onClick={generateSummary}
              disabled={isSummarizing}
            >
              {isSummarizing ? (
                <>
                  <div className="summarizer_small_loader"></div>
                  Summarizing...
                </>
              ) : (
                "Generate Summary"
              )}
            </button>
          )}
        </div>

        <div className="summarizer_results_section">
          <div className="summarizer_content_viewer">
            <div className="summarizer_viewer_header">
              <h3>{file ? file.name : "Webpage Content"}</h3>
            </div>
            <div className="summarizer_viewer_content">
              {isLoading ? (
                <div className="summarizer_loader_container">
                  <div className="summarizer_loader"></div>
                  <p>Loading content...</p>
                </div>
              ) : file || url ? (
                <div className="summarizer_document_preview">
                  {file ? (
                    <iframe
                      src={URL.createObjectURL(file)}
                      title="PDF Preview"
                      className="summarizer_pdf_iframe"
                    />
                  ) : (
                    <div className="summarizer_webpage_preview">
                      <div className="summarizer_webpage_mockup">
                        <div className="summarizer_mockup_header">
                          <div className="summarizer_mockup_url_bar">{url}</div>
                        </div>
                        <div className="summarizer_mockup_content">
                          <div className="summarizer_mockup_title"></div>
                          <div className="summarizer_mockup_text"></div>
                          <div className="summarizer_mockup_text summarizer_mockup_text_shorter"></div>
                          <div className="summarizer_mockup_image"></div>
                          <div className="summarizer_mockup_text"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="summarizer_empty_state">
                  <div className="summarizer_empty_icon">📄</div>
                  <h3>No content to display</h3>
                  <p>Upload a PDF or enter a URL to begin</p>
                </div>
              )}
            </div>
          </div>

          <div className="summarizer_summary_viewer">
            <div className="summarizer_viewer_header">
              <h3>Generated Summary</h3>
              {summary && (
                <div className="summarizer_viewer_actions">
                  <button
                    className="summarizer_action_btn"
                    onClick={handleDownload}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 15V3M12 15L8 11M12 15L16 11"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M20 17V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V17"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Download
                  </button>
                  <button
                    className="summarizer_action_btn"
                    onClick={handleAddNote}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 22H5C3.89543 22 3 21.1046 3 20V4C3 2.89543 3.89543 2 5 2H12.5858C12.851 2 13.1054 2.10536 13.2929 2.29289L19.7071 8.70711C19.8946 8.89464 20 9.149 20 9.41421V12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M18 14V20M18 20L15 17M18 20L21 17"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Add Note
                  </button>
                  <button
                    className="summarizer_action_btn"
                    onClick={copyToClipboard}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.2426C20 6.70435 19.7893 6.18806 19.4142 5.81299L16.187 2.58579C15.812 2.21071 15.2956 2 14.7574 2H10C8.89543 2 8 2.89543 8 4Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V8C4 6.89543 4.89543 6 6 6H8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Copy
                  </button>
                </div>
              )}
            </div>
            <div className="summarizer_viewer_content">
              {isSummarizing ? (
                <div className="summarizer_loader_container">
                  <div className="summarizer_loader"></div>
                  <p>Generating summary...</p>
                </div>
              ) : summary ? (
                <div className="summarizer_summary_content">
                  <Summary_style data={summary} />
                </div>
              ) : (
                <div className="summarizer_empty_state">
                  <div className="summarizer_empty_icon">📝</div>
                  <h3>Summary will appear here</h3>
                  <p>Generate a summary to see the results</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showNoteModal && (
        <div className="summarizer_modal_overlay">
          <div className="summarizer_note_modal">
            <div className="summarizer_modal_header">
              <h3>Add Note to Summary</h3>
              <button onClick={() => setShowNoteModal(false)}>×</button>
            </div>
            <div className="summarizer_modal_body">
              <input
                type="text"
                value={noteContent.title}
                onChange={(e) =>
                  setNoteContent({
                    ...noteContent,
                    title: e.target.value,
                  })
                }
                placeholder="Note title"
                className="summarizer_note_title_input"
              />
              <textarea
                className="summarizer_note_textarea"
                value={noteContent.content}
                onChange={(e) =>
                  setNoteContent({
                    ...noteContent,
                    content: e.target.value,
                  })
                }
                placeholder="Add your notes about this summary..."
                autoFocus
              />
            </div>
            <div className="summarizer_modal_footer">
              <button
                className="summarizer_cancel_btn"
                onClick={() => setShowNoteModal(false)}
              >
                Cancel
              </button>
              <button
                className="summarizer_save_btn"
                onClick={saveNote}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Summarizer;
