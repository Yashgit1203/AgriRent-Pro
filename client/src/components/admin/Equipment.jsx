import React, { useState, useEffect } from 'react';
import { 
  getAllEquipment, 
  addEquipment, 
  activateEquipment, 
  deactivateEquipment 
} from '../../services/api';
import { FaPlus, FaTractor, FaToggleOn, FaToggleOff, FaEdit } from 'react-icons/fa';
import './Equipment.css';

function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await getAllEquipment();
      setEquipment(response.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      setError('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await addEquipment(formData);
      setSuccess('Equipment added successfully!');
      setFormData({ name: '', price: '' });
      setShowModal(false);
      fetchEquipment();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add equipment');
    }
  };

  const handleToggleStatus = async (id, isActive) => {
    try {
      if (isActive) {
        await deactivateEquipment(id);
      } else {
        await activateEquipment(id);
      }
      fetchEquipment();
      setSuccess(`Equipment ${isActive ? 'deactivated' : 'activated'} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update equipment status');
    }
  };

  if (loading) {
    return (
      <div className="equipment-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading equipment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="equipment-container">
      <div className="page-header">
        <div>
          <h1>Equipment Management</h1>
          <p>Manage your farming equipment inventory</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus />
          <span>Add Equipment</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="equipment-grid">
        {equipment.map((item) => (
          <div key={item.id} className={`equipment-card ${!item.is_active ? 'inactive' : ''}`}>
            <div className="equipment-icon">
              <FaTractor />
            </div>
            <div className="equipment-info">
              <h3>{item.name}</h3>
              <div className="equipment-price">₹{item.price}/day</div>
              <div className={`equipment-status ${item.is_active ? 'active' : 'inactive'}`}>
                {item.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
            <button 
              className={`btn-toggle ${item.is_active ? 'active' : 'inactive'}`}
              onClick={() => handleToggleStatus(item.id, item.is_active)}
            >
              {item.is_active ? <FaToggleOn /> : <FaToggleOff />}
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Equipment</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Equipment Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Tractor, Harvester"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="price">Price per Day (₹)</label>
                <input
                  type="number"
                  id="price"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="e.g., 1500"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Equipment;