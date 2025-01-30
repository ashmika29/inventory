import { useState } from 'react';
import ProductList from './ProductList';
import AddProduct from './AddProduct';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductList />;
      case 'add-product':
        return <AddProduct />;
      default:
        return <ProductList />;
    }
  };

  return (
    <div className="dashboard-container">
      {}
      <button 
        className={`hamburger-menu ${!isSidebarOpen ? 'sidebar-closed' : ''}`} 
        onClick={toggleSidebar}
      >
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
      </button>

      {}
      <div className={`dashboard-sidebar ${!isSidebarOpen ? 'closed' : 'open'}`}>
        <div className="sidebar-header">
          <h2>Dashboard</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-link ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'add-product' ? 'active' : ''}`}
            onClick={() => setActiveTab('add-product')}
          >
            Add Product
          </button>
        </nav>
      </div>

      {}
      <div className={`dashboard-main ${!isSidebarOpen ? 'sidebar-closed' : 'sidebar-open'}`}>
        {renderContent()}
      </div>
    </div>
  );
}

export default Dashboard;
