import React from "react";
import { useNavigate } from "react-router-dom";
import "./ToolCard.css";

const ToolCard = ({ title, description, icon, url }) => {
  const navigate = useNavigate();

  return (
    <div className="tool-card">
      <div className="card-header">
        <div className="card-icon">{icon}</div>
        <h3 className="card-title">{title}</h3>
      </div>
      <div className="card-body">
        <p className="card-description">{description}</p>
      </div>
      <div className="card-footer">
        <button className="card-button" onClick={() => navigate(url)}>
          Open Tool
        </button>
        <div className="card-meta">
          {/* Optional metadata here */}
        </div>
      </div>
    </div>
  );
};

export default ToolCard;