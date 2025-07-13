import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./note.css";
import { UserContext } from "./context/UserContext.jsx";

const NotesAndProducts = () => {
  const [activeTab, setActiveTab] = useState("notes");
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState(null);
  const { project } = useContext(UserContext);
  const textareaRef = useRef(null);

  useEffect(() => {
    setProjectId(project?.id || localStorage.getItem("projectId"));
  }, [project]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      if (textareaRef.current.scrollHeight > 300) {
        textareaRef.current.style.overflowY = "auto";
      } else {
        textareaRef.current.style.overflowY = "hidden";
      }
    }
  };

  const [notes, setNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);

  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);

  const [summary, setSummary] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adjustTextareaHeight();
  }, [noteContent]);

  const handleResponse = async (response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || "Request failed with status " + response.status
      );
    }
    return response.json();
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/note/get_project_data/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project_id: projectId,
          }),
        });

        const data = await handleResponse(response);

        if (isMounted) {
          setNotes(
            data.notes?.map((note) => ({
              ...note,
              createdAt: note.created_at || new Date().toISOString(),
              updatedAt: note.last_accessed || new Date().toISOString(),
            })) || []
          );

          setProducts(data.products || []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to fetch data");
          setNotes([]);
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (projectId) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const fetchSummary = async () => {
    try {
      setIsGeneratingSummary(true);
      setError(null);
      const response = await fetch("/api/note/get_summary/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
        }),
      });

      const data = await handleResponse(response);
      const formattedSummary = data.summary.replace(/\n\n/g, '\n');
      setSummary(formattedSummary);
    } catch (err) {
      setError(err.message || "Failed to generate summary");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    try {
      if (editingNoteId !== null) {
        const response = await fetch("/api/note/edit_note/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note_id: editingNoteId,
            title: noteTitle,
            content: noteContent,
          }),
        });

        await handleResponse(response);

        setNotes(
          notes.map((note) =>
            note.id === editingNoteId
              ? {
                  ...note,
                  title: noteTitle,
                  content: noteContent,
                  updatedAt: new Date().toISOString(),
                }
              : note
          )
        );
      } else {
        const response = await fetch("/api/note/create_note/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: noteTitle,
            content: noteContent,
            project_id: projectId,
          }),
        });

        const data = await handleResponse(response);
        const newNote = {
          id: data.id,
          title: noteTitle,
          content: noteContent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setNotes([...notes, newNote]);
      }

      setNoteTitle("");
      setNoteContent("");
      setEditingNoteId(null);
    } catch (err) {
      setError(err.message || "Failed to save note");
    }
  };

  const editNote = (note) => {
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setEditingNoteId(note.id);
    setTimeout(adjustTextareaHeight, 0);
  };

  const deleteNote = async (id) => {
    try {
      const response = await fetch("/api/note/delete_note/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note_id: id,
        }),
      });

      await handleResponse(response);
      setNotes(notes.filter((note) => note.id !== id));
      if (editingNoteId === id) {
        setEditingNoteId(null);
        setNoteTitle("");
        setNoteContent("");
      }
    } catch (err) {
      setError(err.message || "Failed to delete note");
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim() || !productPrice) return;

    try {
      const price = parseFloat(productPrice);
      if (isNaN(price)) {
        throw new Error("Please enter a valid price");
      }

      if (editingProductId !== null) {
        const response = await fetch("/api/note/edit_product/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: editingProductId,
            name: productName,
            price: price, 
          }),
        });

        await handleResponse(response);
        setProducts(
          products.map((product) =>
            product.id === editingProductId
              ? { ...product, name: productName, price: price }
              : product
          )
        );
      } else {
        const response = await fetch("/api/note/create_product/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: productName,
            price: price, 
            project_id: projectId,
          }),
        });

        const data = await handleResponse(response);
        const newProduct = {
          id: data.id,
          name: productName,
          price: price,
          createdAt: new Date().toISOString(),
        };
        setProducts([...products, newProduct]);
      }

      setProductName("");
      setProductPrice("");
      setEditingProductId(null);
    } catch (err) {
      setError(err.message || "Failed to save product");
    }
  };

  const editProduct = (product) => {
    setProductName(product.name);
    setProductPrice(product.price.toString()); 
    setEditingProductId(product.id);
  };

  const deleteProduct = async (id) => {
    try {
      const response = await fetch("/api/note/delete_product/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: id,
        }),
      });

      await handleResponse(response);
      setProducts(products.filter((product) => product.id !== id));
      if (editingProductId === id) {
        setEditingProductId(null);
        setProductName("");
        setProductPrice("");
      }
    } catch (err) {
      setError(err.message || "Failed to delete product");
    }
  };

  const calculateTotal = () => {
    return products.reduce(
      (sum, product) => sum + parseFloat(product.price || 0),
      0
    );
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "Unknown date";
    }
  };

  const formatPrice = (price) => {
    const numericPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericPrice || 0);
  };

  if (isLoading) {
    return (
      <div className="tool-dashboard">
        <div className="loader-container">
          <div className="loader"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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
              Back to Dashboard
            </button>
          </div>
          <div className="header-title-group">
            <div className="title-gradient">
              <h1>Notes & Products</h1>
            </div>
            <p className="header-subtitle">
              Manage your notes and product inventory
            </p>
          </div>
        </div>
      </header>

      <main className="notes-products-content">
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

        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === "notes" ? "active" : ""}`}
            onClick={() => setActiveTab("notes")}
          >
            Notes
          </button>
          <button
            className={`tab-button ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            Products
          </button>
        </div>

        {activeTab === "notes" ? (
          <div className="notes-section">
            <form className="note-form" onSubmit={handleNoteSubmit}>
              <h3>{editingNoteId ? "Edit Note" : "Add New Note"}</h3>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  ref={textareaRef}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Note content"
                  rows="1"
                  style={{
                    resize: "none",
                    overflow: "hidden",
                    minHeight: "60px",
                    maxHeight: "300px",
                    transition: "height 0.2s ease",
                  }}
                />
              </div>
              <button type="submit" className="submit-button">
                {editingNoteId ? "Update Note" : "Add Note"}
              </button>
              {editingNoteId && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setEditingNoteId(null);
                    setNoteTitle("");
                    setNoteContent("");
                  }}
                >
                  Cancel
                </button>
              )}
            </form>
            <div className="notes-list">
              <div className="notes-list-header">
                <h3>Your Notes ({notes.length})</h3>
                <button 
                  onClick={fetchSummary} 
                  className="summary-button"
                  disabled={isGeneratingSummary}
                >
                  {isGeneratingSummary ? "Generating..." : "Summary Note"}
                </button>
              </div>
              
              {summary && (
                <div className="summary-note">
                  <div className="summary-header">
                    <h4>Project Summary</h4>
                    <button 
                      onClick={() => setSummary(null)} 
                      className="close-summary"
                      aria-label="Close summary"
                    >
                      ×
                    </button>
                  </div>
                  <div className="summary-content">
                    {summary.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              {notes.length > 0 ? (
                <div className="notes-grid">
                  {notes
                    .sort(
                      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
                    )
                    .map((note) => (
                      <div key={note.id} className="note-card">
                        <div className="note-header">
                          <div className="note-title-wrapper">
                            <h4 className="note-title">{note.title}</h4>
                            <div className="note-date">
                              {formatDate(note.updatedAt)}
                            </div>
                          </div>
                          <div className="note-actions">
                            <button
                              className="edit-button"
                              onClick={() => editNote(note)}
                              aria-label="Edit note"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <path
                                  d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => deleteNote(note.id)}
                              aria-label="Delete note"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <path
                                  d="M3 6H5H21"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M10 11V17"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M14 11V17"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="note-content-wrapper">
                          <p className="note-content">{note.content}</p>
                        </div>
                        <div className="note-footer">
                          <span className="created-date">
                            Created: {formatDate(note.createdAt)}
                          </span>
                          {note.updatedAt !== note.createdAt && (
                            <span className="updated-date">
                              Updated: {formatDate(note.updatedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h4>No notes yet</h4>
                  <p>Create your first note using the form above</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="products-section">
            <form className="product-form" onSubmit={handleProductSubmit}>
              <h3>{editingProductId ? "Edit Product" : "Add New Product"}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Product name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="submit-button">
                {editingProductId ? "Update Product" : "Add Product"}
              </button>
              {editingProductId && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setEditingProductId(null);
                    setProductName("");
                    setProductPrice("");
                  }}
                >
                  Cancel
                </button>
              )}
            </form>

            <div className="products-list">
              <h3>Product Inventory ({products.length})</h3>
              {products.length > 0 ? (
                <>
                  <div className="products-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Price</th>
                          <th>Added On</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>{formatPrice(product.price)}</td>
                            <td>{formatDate(product.createdAt)}</td>
                            <td className="actions-cell">
                              <button onClick={() => editProduct(product)}>
                                Edit
                              </button>
                              <button onClick={() => deleteProduct(product.id)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="products-summary">
                    <div className="summary-card">
                      <span>Total Products</span>
                      <span>{products.length}</span>
                    </div>
                    <div className="summary-card">
                      <span>Total Inventory Value</span>
                      <span>{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <p>No products yet. Add your first product above.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NotesAndProducts;