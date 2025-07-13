import React from 'react';
import './ProjectCard.css';

const ProjectCard = ({ title, category, description, createdAt, updatedAt }) => {
  return (
    <div className="project-card">
      <div className="project-header">
        <h3>{title}</h3>
        <span className="project-category">{category}</span>
      </div>

      <p className="project-description">{description}</p>

      <div className="project-dates">
        <span>Created: {new Date(createdAt).toLocaleDateString()}</span>
        {/* <span>Updated: {new Date(updatedAt).toLocaleDateString()}</span> */}
      </div>
    </div>
  );
};

export default ProjectCard;
