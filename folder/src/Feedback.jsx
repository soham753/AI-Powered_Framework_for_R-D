import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./feedback.css";
import FeedbackCard from "./components/FeedbackCard";

const Feedback = ({ projectId }) => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState({
    title: "",
    content: "",
  });
  const navigate = useNavigate();

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/feedback_analysis/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || "Failed to analyze feedback. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = useCallback(async () => {
    if (!results) {
      console.warn("No analysis results available to copy");
      return;
    }

    try {
      const readableResults = `
📊 Feedback Analysis Results

🔗 Source URL: ${url || "N/A"}

📅 Analysis Date: ${new Date().toLocaleString()}

📝 Summary:
${results.summary || "N/A"}

🔍 Key Insights:
${(results.key_insights || [])
  .map((insight, i) => `${i + 1}. ${insight}`)
  .join("\n")}

🎯 Sentiment Analysis:
- Overall Sentiment: ${results.sentiment?.overall || "N/A"}
- Positive Mentions: ${results.sentiment?.positive_count || 0}
- Negative Mentions: ${results.sentiment?.negative_count || 0}
- Neutral Mentions: ${results.sentiment?.neutral_count || 0}

🏷️ Categories:
- ${(results.categories || []).join("\n- ")}

⚠️ Common Issues:
- ${(results.common_issues || []).join("\n- ")}

👍 Positive Feedback:
- ${(results.positive_feedback || []).join("\n- ")}

📈 Suggestions for Improvement:
- ${(results.suggestions || []).join("\n- ")}

📊 Metadata:
${
  results.metadata
    ? Object.entries(results.metadata)
        .map(([key, value]) => `- ${key.replaceAll("_", " ")}: ${value}`)
        .join("\n")
    : "N/A"
}
`.trim();

      await navigator.clipboard.writeText(readableResults);
      alert("Analysis results copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      if (err instanceof Error && err.name === "NotAllowedError") {
        alert("Please enable clipboard permissions for this site");
      } else {
        alert("Failed to copy results to clipboard");
      }
    }
  }, [results, url]);

  const handleDownload = () => {
    if (!results) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Feedback Analysis Report</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 10px;
          }
          h1 {
            color: #0066cc;
            margin-bottom: 5px;
          }
          .subtitle {
            color: #666;
            font-style: italic;
          }
          h2 {
            color: #0066cc;
            border-left: 4px solid #0066cc;
            padding-left: 10px;
            margin-top: 25px;
          }
          ul {
            padding-left: 20px;
          }
          li {
            margin-bottom: 8px;
          }
          .pros-cons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
          }
          .pros { color: #2e7d32; }
          .cons { color: #c62828; }
          .specs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
            margin-top: 15px;
          }
          .spec-item {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
          }
          .footer {
            margin-top: 30px;
            font-size: 0.8em;
            color: #666;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${url}</h1>
          <div class="subtitle">Customer Feedback Analysis Report</div>
        </div>

        <h2>Product Summary</h2>
        <p>${results.product_summary || "No summary available"}</p>

        <h2>Feedback Overview</h2>
        <p>${results.feedback_summary || "No feedback summary available"}</p>

        <div class="pros-cons">
          <div class="pros">
            <h2>Advantages</h2>
            <ul>
              ${
                results.advantages
                  ?.map((item) => `<li>${item}</li>`)
                  .join("") || "<li>None listed</li>"
              }
            </ul>
          </div>
          <div class="cons">
            <h2>Disadvantages</h2>
            <ul>
              ${
                results.disadvantages
                  ?.map((item) => `<li>${item}</li>`)
                  .join("") || "<li>None listed</li>"
              }
            </ul>
          </div>
        </div>

        <h2>Areas for Improvement</h2>
        <ul>
          ${
            results.areas_to_improve
              ?.map((item) => `<li>${item}</li>`)
              .join("") || "<li>None identified</li>"
          }
        </ul>

        <h2>Target Audience</h2>
        <div class="specs-grid">
          ${
            results.target_audience
              ?.map(
                (item) => `
            <div class="spec-item">${item}</div>
          `
              )
              .join("") || "<div>Not specified</div>"
          }
        </div>

        <h2>Unique Selling Points</h2>
        <ul>
          ${
            results.unique_selling_points
              ?.map((item) => `<li><strong>${item}</strong></li>`)
              .join("") || "<li>None listed</li>"
          }
        </ul>

        <h2>Key Specifications</h2>
        <div class="specs-grid">
          ${
            results.notable_specifications
              ?.map(
                (item) => `
            <div class="spec-item">${item}</div>
          `
              )
              .join("") || "<div>None provided</div>"
          }
        </div>

        <div class="footer">
          Report generated on ${new Date().toLocaleString()} | Source: ${
      url || "Not specified"
    }
        </div>

        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatProductNoteClean = (data) => {
    if (!data) return "";

    const sections = [];

    if (data.product_summary) {
      sections.push(`📦 Product Summary:\n${data.product_summary}`);
    }

    if (data.feedback_summary) {
      sections.push(`💬 Feedback Summary:\n${data.feedback_summary}`);
    }

    if (data.advantages?.length) {
      sections.push(
        `✅ Advantages:\n${data.advantages.map((a) => `- ${a}`).join("\n")}`
      );
    }

    if (data.disadvantages?.length) {
      sections.push(
        `❌ Disadvantages:\n${data.disadvantages.map((d) => `- ${d}`).join("\n")}`
      );
    }

    if (data.areas_to_improve?.length) {
      sections.push(
        `🔧 Areas to Improve:\n${data.areas_to_improve.map((a) => `- ${a}`).join("\n")}`
      );
    }

    if (data.target_audience?.length) {
      sections.push(
        `🎯 Target Audience:\n${data.target_audience.map((a) => `- ${a}`).join("\n")}`
      );
    }

    if (data.unique_selling_points?.length) {
      sections.push(
        `🚀 Unique Selling Points:\n${data.unique_selling_points.map((u) => `- ${u}`).join("\n")}`
      );
    }

    if (data.notable_specifications?.length) {
      sections.push(
        `📐 Notable Specifications:\n${data.notable_specifications.map((s) => `- ${s}`).join("\n")}`
      );
    }

    return sections.join("\n\n").trim();
  };

  const handleAddNote = () => {
    if (!results) return;

    const defaultTitle = `Feedback Analysis: ${url}`;
    const formattedContent = formatProductNoteClean(results);

    setNoteContent({
      title: defaultTitle,
      content: formattedContent,
    });

    setShowNoteModal(true);
  };

  const saveNote = async () => {
    try {
      setIsLoading(true);

      const currentProjectId = projectId || localStorage.getItem("projectId");
      if (!currentProjectId) {
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
          project_id: currentProjectId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save note");
      }

      setShowNoteModal(false);
      setNoteContent({ title: "", content: "" });
    } catch (err) {
      console.error("Error saving note:", err);
      alert(err.message || "Failed to save note");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tool-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-top-row">
            <button className="back-button" onClick={() => navigate(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
          </div>
          <div className="header-title-group">
            <div className="title-gradient">
              <h1>Feedback Analysis</h1>
            </div>
            <p className="header-subtitle">
              Analyze product feedback for insights and patterns
            </p>
          </div>
        </div>
      </header>

      <main className="feedback-analysis-content">
        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        )}

        <div className="input-section">
          <form className="url-form" onSubmit={handleUrlSubmit}>
            <div className="input-group">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter feedback URL or paste text"
                required
                disabled={isLoading}
              />
              <button
                type="submit"
                className="submit-url"
                disabled={isLoading || !url.trim()}
              >
                {isLoading ? <div className="small-loader"></div> : "Analyze"}
              </button>
            </div>
          </form>
        </div>

        <div className="results-section">
          <div className="results-viewer">
            <div className="viewer-header">
              <h3>Analysis Results</h3>
              {results && (
                <div className="viewer-actions">
                  <div className="button-group">
                    <button
                      className="button button-copy"
                      onClick={copyToClipboard}
                      disabled={isLoading}
                    >
                      Copy
                    </button>
                    <button
                      className="button button-download"
                      onClick={handleDownload}
                      disabled={isLoading}
                    >
                      Download
                    </button>
                    <button
                      className="button button-note"
                      onClick={handleAddNote}
                      disabled={isLoading}
                    >
                      Add Note
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="viewer-content">
              {isLoading ? (
                <div className="loader-container">
                  <div className="loader"></div>
                  <p>Analyzing feedback...</p>
                </div>
              ) : results ? (
                <FeedbackCard data={results} />
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3>Analysis will appear here</h3>
                  <p>Analyze feedback to see the results</p>
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
              <h3>Add Note from Analysis</h3>
              <button 
                onClick={() => setShowNoteModal(false)}
                disabled={isLoading}
              >
                ×
              </button>
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
                disabled={isLoading}
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
                placeholder="Analysis content..."
                disabled={isLoading}
                rows={10}
              />
            </div>
            <div className="summarizer_modal_footer">
              <button
                className="summarizer_cancel_btn"
                onClick={() => setShowNoteModal(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="summarizer_save_btn"
                onClick={saveNote}
                disabled={isLoading || !noteContent.title.trim()}
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

export default Feedback;