import React, { useState, useContext } from "react";
import ToolCard from "./components/ToolCard";
import { UserContext } from "./context/UserContext.jsx";
import { useNavigate } from "react-router-dom";
import "./tools.css";

const ToolDashboard = () => {
  const [tools] = useState([
    {
      id: 1,
      title: "Summariser",
      description:
        "Automatically generate clear, concise, and structured summaries of technical research papers and patents—highlighting key objectives, methods, results, and innovations to accelerate understanding and review.",
      icon: "📄",
      category: "Analytics",
      url: "/summarizer",
    },
    {
      id: 2,
      title: "Feedback Analyzer",
      description:
        "Analyze user reviews and customer feedback to identify pain points, feature requests, areas of satisfaction, and improvement opportunities with sentiment breakdown.",
      icon: "💬",
      category: "Analytics",
      url: "/feedback",
    },
    {
      id: 3,
      title: "Price Finder",
      description:
        "Scrape prices from major e-commerce platforms (Amazon, Flipkart, Robu, IndiaMART, Alibaba) with summarized pricing insights.",
      icon: "💰",
      category: "Analytics",
      url: "/pricecomparison",
    },
    {
      id: 4,
      title: "Notes",
      description:
        "Capture and organize important insights, summaries, comparisons, and feedback from other tools. Supports tagging, exporting, and referencing for future tasks or reports.",
      icon: "📝",
      category: "Processing",
      url: "/notes",
    },
    {
      id: 5,
      title: "R&D Cost Calculator",
      description:
        "Accurately estimate total R&D expenses by calculating personnel, material, and equipment costs with adjustable overhead and contingency rates—optimize budget planning for research projects.",
      icon: "🧮",
      category: "Analytics",
      url: "/rdCostCalculator",
    },
  ]);

  const [activeFilter, setActiveFilter] = useState("All");
  const { user, project } = useContext(UserContext);
  const navigate = useNavigate();

  const getInitial = () => {
    return user?.name?.charAt(0)?.toUpperCase() || "";
  };

  const filteredTools =
    activeFilter === "All"
      ? tools
      : tools.filter((tool) => tool.category === activeFilter);

  return (
    <div className="toolDashboard_container">
      <header className="toolDashboard_header">
        <div className="toolDashboard_header-content">
          <button
            className="toolDashboard_back-button"
            onClick={() => navigate(-1)}
            aria-label="Back to project dashboard"
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
            Back to Dashboard
          </button>
          <div className="toolDashboard_header-title-group">
            <div className="toolDashboard_project-info">
              <h1 className="toolDashboard_project-name">
                {project?.title || "Current Project"}
              </h1>
              <div className="toolDashboard_title-gradient">
                <h2>Research and Development Tools</h2>
              </div>
            </div>
            <p className="toolDashboard_header-subtitle">
              Specialized utilities for R&D Development
            </p>
          </div>
          <div className="toolDashboard_user-profile">
            <div className="toolDashboard_profile-info">
              <p className="toolDashboard_welcome-message">
                Welcome back,{" "}
                <span className="toolDashboard_username">
                  {user?.name || "User"}
                </span>
              </p>
              <p className="toolDashboard_user-role">
                {user?.role || "Researcher"}
              </p>
            </div>
            <div className="toolDashboard_profile-circle">
              <span className="toolDashboard_profile-initial">
                {getInitial()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="toolDashboard_content">
        <div className="toolDashboard_tools-header">
          <div className="toolDashboard_section-title">
            <h3>Available Tools</h3>
            <div className="toolDashboard_tool-count">
              {filteredTools.length}{" "}
              {filteredTools.length === 1 ? "tool" : "tools"}
            </div>
          </div>
          <div className="toolDashboard_tools-filter">
            <button
              className={`toolDashboard_filter-btn ${
                activeFilter === "All" ? "toolDashboard_active" : ""
              }`}
              onClick={() => setActiveFilter("All")}
            >
              All
            </button>
            <button
              className={`toolDashboard_filter-btn ${
                activeFilter === "Analytics" ? "toolDashboard_active" : ""
              }`}
              onClick={() => setActiveFilter("Analytics")}
            >
              Analytics
            </button>
            <button
              className={`toolDashboard_filter-btn ${
                activeFilter === "Processing" ? "toolDashboard_active" : ""
              }`}
              onClick={() => setActiveFilter("Processing")}
            >
              Processing
            </button>
          </div>
        </div>

        <div className="toolDashboard_tools-container">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.id}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              category={tool.category}
              url={tool.url}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default ToolDashboard;
