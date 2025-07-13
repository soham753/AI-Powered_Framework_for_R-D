import React, { useState, useRef, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProjectDashboard.css";
import add_icon from "./assets/add_icon.png";
import ProjectCard from "./components/Projectcard";
import { UserContext } from "./context/UserContext.jsx";

const ProjectDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [menuDisplay, setMenuDisplay] = useState("none");
  const [profileImage, setProfileImage] = useState(null);
  const { user, setUser, project, setProject } = useContext(UserContext);
  const [projectTitle, setProjectTitle] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(
          "/api/projectDashboard/get_project_details/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: user.id,
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          setProjects(data.projects);
        } else {
          console.error("❌ Error fetching projects:", data.error);
        }
      } catch (error) {
        console.error("❌ Network error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [user?.id]);

  const getInitial = () => {
    return user?.name?.charAt(0)?.toUpperCase() || "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.id) {
      console.error("User ID is missing");
      return;
    }

    try {
      const response = await fetch(
        "/api/projectDashboard/new_project_details/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: projectTitle,
            category: categoryName,
            description: projectDescription,
            user_id: user.id,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setProjects([...projects, result.project]);
        setProjectTitle("");
        setCategoryName("");
        setProjectDescription("");
        setMenuDisplay("none");
      } else {
        console.error(
          "❌ Error creating project:",
          result.error || "Unknown error"
        );
      }
    } catch (error) {
      console.error("❌ Error submitting project:", error);
    }
  };

  const handleProjectClick = (projectId) => {
    const selectedProject = projects.find(
      (project) => project.id === projectId
    );

    if (selectedProject) {
      localStorage.setItem("projectId", projectId);
      setProject(selectedProject);
      navigate(`/${projectId}/ToolDashboard`);
    }
  };

  if (isLoading) {
    return <div className="projectDashboard_loading">Loading...</div>;
  }

  return (
    <div className="projectDashboard_container">
      <header className="projectDashboard_header">
        <div className="projectDashboard_header-content">
          <h1>Project Dashboard</h1>
          <div className="projectDashboard_user-profile">
            <p className="projectDashboard_welcome-message">
              Welcome back,{" "}
              <span className="projectDashboard_username">{user?.name || "User"}</span>
            </p>
            <div className="projectDashboard_profile-circle">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="projectDashboard_profile-image"
                />
              ) : (
                <span className="projectDashboard_profile-initial">{getInitial()}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="projectDashboard_projects-container">
        <div
          className="projectDashboard_creation-card"
          onClick={() => setMenuDisplay("flex")}
        >
          <div className="projectDashboard_creation-card-content">
            <div className="projectDashboard_creation-icon">
              <img src={add_icon} alt="Create Project Icon" />
            </div>
            <h2>Create New Project</h2>
            <p className="projectDashboard_creation-hint">Click to start a new project</p>
          </div>
        </div>

        {projects.map((project) => (
          <div key={project.id} onClick={() => handleProjectClick(project.id)}>
            <ProjectCard
              title={project.title}
              category={project.category}
              description={project.description}
              createdAt={project.created_at}
            />
          </div>
        ))}
      </div>

      <div
        className="projectDashboard_creation-menu-container"
        style={{ display: menuDisplay }}
      >
        <div
          className="projectDashboard_creation-menu-overlay"
          onClick={() => setMenuDisplay("none")}
        ></div>
        <div className="projectDashboard_creation-menu">
          <h2 className="projectDashboard_creation-menu-title">Create New Project</h2>
          <form onSubmit={handleSubmit}>
            <div className="projectDashboard_form-group">
              <label htmlFor="project_title">Project Title</label>
              <input
                type="text"
                id="project_title"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Write project name"
                required
              />
            </div>
            <div className="projectDashboard_form-group">
              <label htmlFor="category_name">Category</label>
              <input
                type="text"
                id="category_name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Write project category"
                required
              />
            </div>
            <div className="projectDashboard_form-group">
              <label htmlFor="project_description">Project Description</label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                id="project_description"
                placeholder="Enter Project Description"
                required
              ></textarea>
            </div>
            <div className="projectDashboard_form-actions">
              <button
                type="button"
                className="projectDashboard_cancel-button"
                onClick={() => setMenuDisplay("none")}
              >
                Cancel
              </button>
              <button type="submit" className="projectDashboard_submit-button">
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;