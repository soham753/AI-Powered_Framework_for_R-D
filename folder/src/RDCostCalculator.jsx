import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RDCostCalculator.css';

const RDCostCalculator = () => {
  const navigate = useNavigate();
  const projectId = localStorage.getItem('projectId') || '';

  const [inputs, setInputs] = useState({
    employeeCount: 1,
    avgSalary: '',
    projectDuration: 1,
    overhead: 20,
    contingency: 10
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs({
      ...inputs,
      [name]: value
    });
  };

  useEffect(() => {
    if (projectId) {
      fetchProducts();
    } else {
      setError('No project ID found in storage');
    }
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/note/get_products_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const numericInputs = Object.fromEntries(
      Object.entries(inputs).map(([key, val]) => 
        [key, parseFloat(val) || 0]
      )
    );

    const { employeeCount, avgSalary, projectDuration, overhead, contingency } = numericInputs;
    
    // Calculate personnel costs
    const monthlyPersonnelCost = employeeCount * avgSalary;
    const personnelCost = monthlyPersonnelCost * projectDuration;
    
    // Calculate material costs from backend
    const materialCost = products.reduce((sum, product) => sum + (parseFloat(product.price) || 0), 0);
    
    const directCosts = personnelCost + materialCost;
    const totalWithOverhead = directCosts * (1 + overhead / 100);
    const totalWithContingency = totalWithOverhead * (1 + contingency / 100);

    return {
      personnelCost,
      materialCost,
      directCosts,
      totalWithOverhead,
      totalWithContingency,
      monthlyPersonnelCost
    };
  };

  const results = calculateTotal();

  const formatCurrency = (value) => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const handlePrint = () => {
    const printContent = `
      <html>
<head>
  <title>R&D Cost Calculator Report</title>
  <style>
    :root {
      --primary-color: #3a7bd5;
      --secondary-color: #2c3e50;
      --accent-color: #8a2be2;
      --border-color: #e0e0e0;
      --text-dark: #333;
      --text-medium: #555;
      --text-light: #777;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 30px;
      color: var(--text-dark);
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
    }
    
    .print-header {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--primary-color);
      text-align: center;
    }
    
    h1 {
      color: var(--secondary-color);
      font-size: 28px;
      margin-bottom: 10px;
      font-weight: 600;
    }
    
    .report-meta {
      color: var(--text-medium);
      font-size: 14px;
      margin-top: 5px;
    }
    
    .section {
      margin-bottom: 25px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    h2 {
      color: var(--primary-color);
      font-size: 20px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-color);
      font-weight: 500;
    }
    
    .detail-row {
      display: flex;
      margin-bottom: 8px;
    }
    
    .detail-label {
      flex: 1;
      color: var(--text-medium);
      font-weight: 500;
    }
    
    .detail-value {
      flex: 1;
      text-align: right;
      font-weight: 500;
    }
    
    .result-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 15px;
      margin: 5px 0;
      border-radius: 4px;
      background-color: #f9f9f9;
    }
    
    .highlight {
      background-color: #f0f7ff;
      border-left: 4px solid var(--primary-color);
      font-weight: 600;
      margin-top: 20px;
      padding: 12px 15px;
    }
    
    .products-list {
      margin: 20px 0;
    }
    
    .products-list h3 {
      color: var(--secondary-color);
      font-size: 16px;
      margin-bottom: 10px;
    }
    
    .products-list ul {
      padding-left: 0;
      list-style-type: none;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      overflow: hidden;
    }
    
    .products-list li {
      display: flex;
      justify-content: space-between;
      padding: 10px 15px;
      border-bottom: 1px solid var(--border-color);
    }
    
    .products-list li:last-child {
      border-bottom: none;
    }
    
    .product-name {
      color: var(--text-dark);
    }
    
    .product-price {
      color: var(--primary-color);
      font-weight: 500;
    }
    
    .total-materials {
      font-weight: 600;
      margin-top: 15px;
      padding-top: 10px;
      border-top: 2px solid var(--primary-color);
      text-align: right;
      color: var(--secondary-color);
    }
    
    .currency {
      font-family: 'Courier New', monospace;
      font-weight: 600;
    }
    
    @page {
      size: A4;
      margin: 15mm;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .section {
        box-shadow: none;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="print-header">
    <h1>R&D Cost Calculator Report</h1>
    <p class="report-meta">Generated on: ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="section">
    <h2>Project Details</h2>
    <div class="detail-row">
      <span class="detail-label">Number of Employees:</span>
      <span class="detail-value">${inputs.employeeCount}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Average Monthly Salary:</span>
      <span class="detail-value">${formatCurrency(inputs.avgSalary || 0)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Project Duration:</span>
      <span class="detail-value">${inputs.projectDuration} months</span>
    </div>
  </div>
  
  <div class="section">
    <h2>Cost Breakdown</h2>
    <div class="result-item">
      <span>Personnel Costs</span>
      <span class="currency">${formatCurrency(results.personnelCost)}</span>
    </div>
    ${products.length > 0 ? `
      <div class="result-item">
        <span>Material Costs</span>
        <span class="currency">${formatCurrency(results.materialCost)}</span>
      </div>
    ` : ''}
    <div class="result-item">
      <span>Direct Costs</span>
      <span class="currency">${formatCurrency(results.directCosts)}</span>
    </div>
    <div class="result-item">
      <span>+ Overhead (${inputs.overhead}%)</span>
      <span class="currency">${formatCurrency(results.totalWithOverhead)}</span>
    </div>
    <div class="result-item highlight">
      <span>Total R&D Cost (with ${inputs.contingency}% contingency)</span>
      <span class="currency">${formatCurrency(results.totalWithContingency)}</span>
    </div>
  </div>
  
  ${products.length > 0 ? `
    <div class="section">
      <div class="products-list">
        <h3>Materials Included</h3>
        <ul>
          ${products.map(product => `
            <li>
              <span class="product-name">${product.name}</span>
              <span class="product-price currency">${formatCurrency(product.price)}</span>
            </li>
          `).join('')}
        </ul>
        <div class="total-materials">Total Materials: <span class="currency">${formatCurrency(results.materialCost)}</span></div>
      </div>
    </div>
  ` : ''}
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleBack = () => {
    navigate(`/${projectId}/ToolDashboard`);
  };

  return (
    <div className="calculator-container">
      <div className="calculator-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBack}>
            ← Back to Dashboard
          </button>
          <h1>R&D Cost Calculator</h1>
        </div>
        <div className="header-actions">
          <button className="print-button" onClick={handlePrint}>
            Print Report
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      <div className="input-grid">
        <div className="cost-category">
          <h2>Personnel Costs</h2>
          <div className="input-group">
            <label>Number of Employees</label>
            <input
              type="number"
              name="employeeCount"
              value={inputs.employeeCount}
              onChange={handleChange}
              min="1"
              step="1"
            />
          </div>
          <div className="input-group">
            <label>Average Monthly Salary (₹)</label>
            <input
              type="number"
              name="avgSalary"
              value={inputs.avgSalary}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
          </div>
          <div className="input-group">
            <label>Project Duration (months)</label>
            <input
              type="number"
              name="projectDuration"
              value={inputs.projectDuration}
              onChange={handleChange}
              min="1"
              step="1"
            />
          </div>
        </div>

        <div className="cost-category">
          <h2>Material Costs</h2>
          {loading ? (
            <div className="loading-message">Loading materials...</div>
          ) : products.length > 0 ? (
            <div className="products-list">
              <ul>
                {products.map(product => (
                  <li key={product.id}>
                    <span className="product-name">{product.name}</span>
                    <span className="product-price">{formatCurrency(product.price)}</span>
                  </li>
                ))}
              </ul>
              <div className="total-materials">
                Total Materials: {formatCurrency(results.materialCost)}
              </div>
            </div>
          ) : (
            <div className="no-products">
              {error ? error : 'No materials found for this project'}
            </div>
          )}
        </div>

        <div className="cost-category">
          <h2>Additional Factors</h2>
          <div className="input-group">
            <label>Overhead (%)</label>
            <input
              type="number"
              name="overhead"
              value={inputs.overhead}
              onChange={handleChange}
              min="0"
              step="0.1"
            />
          </div>
          <div className="input-group">
            <label>Contingency (%)</label>
            <input
              type="number"
              name="contingency"
              value={inputs.contingency}
              onChange={handleChange}
              min="0"
              step="0.1"
            />
          </div>
        </div>
      </div>

      <div className="results-section">
        <h2>Cost Breakdown</h2>
        <div className="result-item">
          <span>Personnel Costs</span>
          <span>{formatCurrency(results.personnelCost)}</span>
        </div>
        {products.length > 0 && (
          <div className="result-item">
            <span>Material Costs</span>
            <span>{formatCurrency(results.materialCost)}</span>
          </div>
        )}
        <div className="result-item">
          <span>Direct Costs</span>
          <span>{formatCurrency(results.directCosts)}</span>
        </div>
        <div className="result-item">
          <span>+ Overhead ({inputs.overhead}%)</span>
          <span>{formatCurrency(results.totalWithOverhead)}</span>
        </div>
        <div className="result-item highlight">
          <span>Total R&D Cost (with {inputs.contingency}% contingency)</span>
          <span>{formatCurrency(results.totalWithContingency)}</span>
        </div>
      </div>
    </div>
  );
};

export default RDCostCalculator;