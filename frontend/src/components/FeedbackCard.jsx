import React from 'react';
import './feedbackcard.css';

const FeedbackCard = ({ data }) => {
  return (
    <div className="feedback-analysis-container">
      <div className="product-header">
        <h1>Product Feedback Analysis</h1>
        <p className="product-summary">{data.product_summary}</p>
      </div>

      <div className="feedback-summary">
        <h2>Overall Feedback</h2>
        <p>{data.feedback_summary}</p>
      </div>

      <div className="analysis-grid">
        <div className="analysis-card positive">
          <h3>👍 Advantages</h3>
          <ul>
            {data.advantages.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="analysis-card negative">
          <h3>👎 Disadvantages</h3>
          <ul>
            {data.disadvantages.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="analysis-card improvement">
          <h3>🔧 Areas to Improve</h3>
          <ul>
            {data.areas_to_improve.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="analysis-card audience">
          <h3>🎯 Target Audience</h3>
          <ul>
            {data.target_audience.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="analysis-card usp">
          <h3>✨ Unique Selling Points</h3>
          <ul>
            {data.unique_selling_points.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="analysis-card specs">
          <h3>⚙️ Notable Specifications</h3>
          <ul>
            {data.notable_specifications.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FeedbackCard;