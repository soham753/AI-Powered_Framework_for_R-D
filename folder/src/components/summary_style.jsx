import React from 'react';
import './summaryStyle.css';

const Summary_style = ({ data }) => {
  if (!data) return null;

  const renderList = (items, className = '', icon = '•') => {
    if (!items || items.length === 0 || items.every(item => !item)) return null;
    
    const filteredItems = items.filter(item => item);
    
    return (
      <ul className={`styled-list ${className}`}>
        {filteredItems.map((item, index) => (
          <li key={index}>
            <span className="list-icon">{icon}</span>
            <span className="list-content">{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderObjectList = (obj) => {
    if (!obj || Object.values(obj).every(val => !val || val === "Not specified")) return null;
    
    return (
      <div className="metrics-grid">
        {Object.entries(obj)
          .filter(([_, value]) => value && value !== "Not specified")
          .map(([key, value], index) => (
            <div key={index} className="metric-item">
              <div className="metric-key">{key}:</div>
              <div className="metric-value">{value}</div>
            </div>
          ))}
      </div>
    );
  };

  const renderSection = (title, content, className = '') => {
    if (!content || 
        (Array.isArray(content) && content.length === 0) ||
        (typeof content === 'object' && Object.keys(content).length === 0) ||
        (typeof content === 'string' && !content.trim())) {
      return null;
    }
    
    return (
      <section className={`content-section ${className}`}>
        <h2 className="section-title">{title}</h2>
        <div className="section-content">
          {typeof content === 'string' ? (
            <p className="section-text">{content}</p>
          ) : Array.isArray(content) ? (
            renderList(content, 'section-list')
          ) : (
            renderObjectList(content)
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="paper-summary-container">
      <div className="paper-summary">
        {data.title && (
          <header className="summary-header">
            <h1 className="paper-title">{data.title}</h1>
          </header>
        )}
        
        <div className="summary-content">
          {renderSection("Overview", data.overview, "overview-section")}
          {renderSection("Key Points", data.key_points, "key-points-section")}
          {renderSection("Components", data.components, "components-section")}
          {renderSection("Technologies Used", data.technologies_used, "technologies-section")}
          {renderSection("Workflow", data.workflow, "workflow-section")}
          {renderSection("Accuracy Metrics", data.accuracy_metrics, "metrics-section")}
          {renderSection("Advantages", data.advantages, "advantages-section")}
          {renderSection("Limitations", data.limitations, "limitations-section")}
          {renderSection("Data Pipeline", data.data_pipeline, "pipeline-section")}
          {renderSection("Real World Impact", data.real_world_impact, "impact-section")}
          
          {data.products && data.products.length > 0 && (
            <section className="products-section">
              <h2 className="section-title">Products</h2>
              <div className="product-tags">
                {data.products.map((product, index) => (
                  <span key={index} className="product-tag">
                    {product}
                    <span className="tag-decoration"></span>
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Summary_style;