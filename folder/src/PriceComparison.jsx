import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PriceComparison.css";

const PriceComparison = () => {
  const [product, setProduct] = useState("");
  const [sites, setSites] = useState(["amazon", "Flipkart", "Indiamart", "alibaba"]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(83.5);
  const [showSaveProduct, setShowSaveProduct] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [priceSource, setPriceSource] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults(null);
    setShowSaveProduct(false);

    try {
      const rateResponse = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const rateData = await rateResponse.json();
      const currentRate = rateData.rates.INR || 83.5;
      setExchangeRate(currentRate);

      const response = await fetch("/api/price_finder/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product, sites }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Error ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      
      if (!data || typeof data !== 'object') {
        throw new Error("Invalid response format from server");
      }
      
      if (data.alibaba) {
        Object.keys(data.alibaba).forEach(key => {
          if (data.alibaba[key] !== null) {
            data.alibaba[key] = Math.round(data.alibaba[key] * currentRate);
          }
        });
      }
      
      const allPrices = [];
      Object.entries(data).forEach(([site, products]) => {
        if (site !== "keydetail") {
          Object.values(products).forEach(price => {
            if (price !== null) {
              allPrices.push(price);
            }
          });
        }
      });

      if (allPrices.length > 0) {
        data.keydetail = {
          avg_price: allPrices.length > 0 ? calculateAverage(allPrices) : null,
          price_range_low: allPrices.length > 0 ? Math.min(...allPrices) : null,
          price_range_high: allPrices.length > 0 ? Math.max(...allPrices) : null,
          common_price: allPrices.length > 0 ? findCommonPrice(allPrices) : null,
          exchange_rate: currentRate
        };
      } else {
        data.keydetail = {
          avg_price: null,
          price_range_low: null,
          price_range_high: null,
          common_price: null,
          exchange_rate: currentRate
        };
      }
      
      setResults(data);
      setShowSaveProduct(true);
    } catch (err) {
      console.error("Price comparison error:", err);
      setError(
        err.message || "Failed to compare prices. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAverage = (prices) => {
    const sum = prices.reduce((acc, price) => acc + price, 0);
    return Math.round(sum / prices.length);
  };

  const findCommonPrice = (prices) => {
    const priceCounts = {};
    prices.forEach(price => {
      priceCounts[price] = (priceCounts[price] || 0) + 1;
    });
    
    let commonPrice = null;
    let maxCount = 0;
    
    Object.entries(priceCounts).forEach(([price, count]) => {
      if (count > maxCount) {
        commonPrice = parseFloat(price);
        maxCount = count;
      }
    });
    
    return maxCount > 1 ? commonPrice : null;
  };

  const toggleSite = (site) => {
    try {
      setSites(prevSites =>
        prevSites.includes(site)
          ? prevSites.filter(s => s !== site)
          : [...prevSites, site]
      );
    } catch (err) {
      console.error("Error toggling site:", err);
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return "N/A";
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(price);
    } catch (err) {
      console.error("Price formatting error:", err);
      return `₹${price}`;
    }
  };

  const handleSaveProduct = async () => {
    if (!selectedPrice || !priceSource) return;
    
    setSaveLoading(true);
    setSaveSuccess(false);
    
    try {
      const projectId = localStorage.getItem("projectId");
      if (!projectId) {
        throw new Error("No project selected");
      }
      
      const response = await fetch("/api/note/create_product/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: product,
          price: selectedPrice,
          project_id: projectId,
          source: priceSource,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Error ${response.status}: ${response.statusText}`
        );
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving product:", err);
      setError(err.message || "Failed to save product");
    } finally {
      setSaveLoading(false);
    }
  };

  const getAvailablePriceOptions = () => {
    if (!results) return [];
    
    const options = [];
    
    // Add summary options
    if (results.keydetail?.avg_price !== null) {
      options.push({
        label: `Average Price (${formatPrice(results.keydetail.avg_price)})`,
        value: results.keydetail.avg_price,
        source: "average"
      });
    }
    
    if (results.keydetail?.price_range_low !== null) {
      options.push({
        label: `Lowest Price (${formatPrice(results.keydetail.price_range_low)})`,
        value: results.keydetail.price_range_low,
        source: "lowest"
      });
    }
    
    if (results.keydetail?.price_range_high !== null) {
      options.push({
        label: `Highest Price (${formatPrice(results.keydetail.price_range_high)})`,
        value: results.keydetail.price_range_high,
        source: "highest"
      });
    }
    
    if (results.keydetail?.common_price !== null) {
      options.push({
        label: `Common Price (${formatPrice(results.keydetail.common_price)})`,
        value: results.keydetail.common_price,
        source: "common"
      });
    }
    
    // Add site-specific options
    Object.entries(results).forEach(([site, products]) => {
      if (site === "keydetail") return;
      
      const sitePrices = Object.values(products).filter(price => price !== null);
      if (sitePrices.length === 0) return;
      
      const siteAvg = calculateAverage(sitePrices);
      const siteMin = Math.min(...sitePrices);
      const siteMax = Math.max(...sitePrices);
      
      options.push({
        label: `${site} - Average (${formatPrice(siteAvg)})`,
        value: siteAvg,
        source: `${site}_average`
      });
      
      options.push({
        label: `${site} - Minimum (${formatPrice(siteMin)})`,
        value: siteMin,
        source: `${site}_min`
      });
      
      options.push({
        label: `${site} - Maximum (${formatPrice(siteMax)})`,
        value: siteMax,
        source: `${site}_max`
      });
    });
    
    return options;
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
              <h1>Price Comparison</h1>
            </div>
            <p className="header-subtitle">
              Compare product prices across multiple e-commerce sites
            </p>
          </div>
        </div>
      </header>

      <main className="price-comparison-content">
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
          <form className="product-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Enter product name"
                required
                disabled={isLoading}
              />
              <button
                type="submit"
                className="submit-product"
                disabled={isLoading || !product.trim()}
              >
                {isLoading ? <div className="small-loader"></div> : "Compare Prices"}
              </button>
            </div>
            
            <div className="site-selection">
              <h4>Select Sites to Compare:</h4>
              <div className="site-checkboxes">
                {["amazon", "Flipkart", "Indiamart", "alibaba", "robu"].map((site) => (
                  <label key={site} className="site-checkbox">
                    <input
                      type="checkbox"
                      checked={sites.includes(site)}
                      onChange={() => toggleSite(site)}
                      disabled={isLoading}
                    />
                    {site}
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>

        {showSaveProduct && results && (
          <div className="save-product-section">
            <h3>Save Product to List</h3>
            <div className="save-product-form">
              <div className="form-group">
                <label>Product Name:</label>
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  disabled={saveLoading}
                />
              </div>
              
              <div className="form-group">
                <label>Select Price:</label>
                <select
                  value={priceSource}
                  onChange={(e) => {
                    const selectedOption = getAvailablePriceOptions().find(
                      opt => opt.source === e.target.value
                    );
                    setPriceSource(e.target.value);
                    setSelectedPrice(selectedOption?.value || null);
                  }}
                  disabled={saveLoading}
                >
                  <option value="">Select a price option</option>
                  {getAvailablePriceOptions().map((option) => (
                    <option key={option.source} value={option.source}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Selected Price:</label>
                <div className="selected-price-display">
                  {selectedPrice ? formatPrice(selectedPrice) : "N/A"}
                </div>
              </div>
              
              <button
                className="save-product-button"
                onClick={handleSaveProduct}
                disabled={!selectedPrice || !priceSource || saveLoading}
              >
                {saveLoading ? (
                  <div className="small-loader"></div>
                ) : (
                  "Save to Product List"
                )}
              </button>
              
              {saveSuccess && (
                <div className="save-success-message">
                  Product saved successfully!
                </div>
              )}
            </div>
          </div>
        )}

        <div className="results-section">
          {isLoading ? (
            <div className="loader-container">
              <div className="loader"></div>
              <p>Comparing prices...</p>
            </div>
          ) : results ? (
            <div className="comparison-results">
              {results.keydetail?.exchange_rate && (
                <div className="exchange-rate-info">
                  <p>Exchange rate used: 1 USD = ₹{results.keydetail.exchange_rate.toFixed(2)}</p>
                </div>
              )}
              
              {results.keydetail && (
                <div className="price-summary">
                  <h3>Price Summary (All prices in INR)</h3>
                  <div className="summary-cards">
                    {results.keydetail.avg_price !== null && (
                      <div className="summary-card">
                        <span className="summary-label">Average Price</span>
                        <span className="summary-value">
                          {formatPrice(results.keydetail.avg_price)}
                        </span>
                      </div>
                    )}
                    
                    {results.keydetail.price_range_low !== null && (
                      <div className="summary-card">
                        <span className="summary-label">Lowest Price</span>
                        <span className="summary-value">
                          {formatPrice(results.keydetail.price_range_low)}
                        </span>
                      </div>
                    )}
                    
                    {results.keydetail.price_range_high !== null && (
                      <div className="summary-card">
                        <span className="summary-label">Highest Price</span>
                        <span className="summary-value">
                          {formatPrice(results.keydetail.price_range_high)}
                        </span>
                      </div>
                    )}
                    
                    {results.keydetail.common_price !== null && (
                      <div className="summary-card">
                        <span className="summary-label">Common Price</span>
                        <span className="summary-value">
                          {formatPrice(results.keydetail.common_price)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {Object.entries(results).map(([site, products]) => {
                if (site === "keydetail") return null;
                
                return (
                  <div key={site} className="site-results">
                    <h3 className="site-name">{site.charAt(0).toUpperCase() + site.slice(1)}</h3>
                    {Object.keys(products).length > 0 ? (
                      <div className="product-list">
                        {Object.entries(products).map(([name, price]) => (
                          <div key={name} className="product-card">
                            <div className="product-name">{name}</div>
                            <div className="product-price">
                              {formatPrice(price)}
                              {site === 'alibaba' && price !== null && (
                                <span className="original-price">
                                  (${(price / results.keydetail.exchange_rate).toFixed(2)})
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-products">No products found</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">💰</div>
              <h3>Price comparison will appear here</h3>
              <p>Enter a product name and select sites to compare prices</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PriceComparison;