import { useState, useEffect } from 'react';
import axios from 'axios';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: ''
  });

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        setError('Failed to fetch products');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error fetching products');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      category: product.category
    });
    setError('');
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!editFormData.name.trim()) return 'Name is required';
    if (!editFormData.price || Number(editFormData.price) <= 0) return 'Price must be greater than 0';
    if (!editFormData.quantity || Number(editFormData.quantity) < 0) return 'Quantity must be 0 or greater';
    if (!editFormData.category.trim()) return 'Category is required';
    return null;
  };

  const handleUpdate = async (id) => {
    try {
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(''); 
      
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/products/${id}`,
        {
          name: editFormData.name.trim(),
          description: editFormData.description.trim(),
          price: Number(editFormData.price),
          quantity: Number(editFormData.quantity),
          category: editFormData.category.trim()
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setEditingProduct(null);
        await fetchProducts(); 
      } else {
        setError(response.data.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Update error:', error);
      if (error.response?.status === 404) {
        setError('Product not found. The page will refresh.');
        await fetchProducts(); 
        setEditingProduct(null);
      } else {
        setError(error.response?.data?.message || 'Error updating product. Please try again.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setError('');
        
        const token = localStorage.getItem('token');
        const response = await axios.delete(
          `http://localhost:5000/api/products/${id}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          await fetchProducts(); 
        } else {
          setError(response.data.message || 'Failed to delete product');
        }
      } catch (error) {
        console.error('Delete error:', error);
        if (error.response?.status === 404) {
          setError('Product not found. The page will refresh.');
          await fetchProducts(); 
        } else {
          setError(error.response?.data?.message || 'Error deleting product. Please try again.');
        }
      }
    }
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setError('');
  };

  return (
    <div className="product-list-container">
      {error && <div className="error-message">{error}</div>}
      <div className="product-list">
        {products.map(product => (
          <div key={product._id} className="product-card">
            {editingProduct && editingProduct._id === product._id ? (
              <div className="edit-form">
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  placeholder="Name"
                  required
                />
                <input
                  type="text"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditFormChange}
                  placeholder="Description"
                />
                <input
                  type="number"
                  name="price"
                  value={editFormData.price}
                  onChange={handleEditFormChange}
                  placeholder="Price"
                  step="0.01"
                  min="0"
                  required
                />
                <input
                  type="number"
                  name="quantity"
                  value={editFormData.quantity}
                  onChange={handleEditFormChange}
                  placeholder="Quantity"
                  min="0"
                  required
                />
                <input
                  type="text"
                  name="category"
                  value={editFormData.category}
                  onChange={handleEditFormChange}
                  placeholder="Category"
                  required
                />
                <div className="edit-actions">
                  <button 
                    className="save-btn"
                    onClick={() => handleUpdate(product._id)}
                    title="Save changes"
                  >
                    💾 Save
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={handleCancel}
                    title="Cancel editing"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="sku">SKU: {product.sku}</p>
                  {product.description && <p>{product.description}</p>}
                  <p>Price: ₹{product.price.toFixed(2)}</p>
                  <p>Quantity: {product.quantity}</p>
                  <p>Category: {product.category}</p>
                </div>
                <div className="product-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEditClick(product)}
                    title="Edit product"
                  >
                    ✏️
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(product._id)}
                    title="Delete product"
                  >
                    🗑️
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
export default ProductList;
