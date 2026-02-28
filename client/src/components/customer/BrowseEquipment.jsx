import React, { useState, useEffect } from 'react';
import { getEquipment, createRental } from '../../services/api';
import { FaTractor, FaCalendarAlt, FaDollarSign } from 'react-icons/fa';
import './BrowseEquipment.css';

function BrowseEquipment() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [days, setDays] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await getEquipment();
      setEquipment(response.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      setError('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleRent = (item) => {
    setSelectedEquipment(item);
    setDays(1);
    setShowModal(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await createRental({
        equipment_id: selectedEquipment.id,
        days: parseInt(days)
      });
      setSuccess('Equipment rented successfully!');
      setShowModal(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to rent equipment');
    }
  };

  const calculateTotal = () => {
    if (!selectedEquipment) return 0;
    return (selectedEquipment.price * days).toFixed(2);
  };

  if (loading) {
    return (
      <div className="browse-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading equipment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-container">
      <div className="page-header">
        <h1>Browse Equipment</h1>
        <p>Find the perfect equipment for your farming needs</p>
      </div>

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="equipment-grid">
        {equipment.map((item) => (
          <div key={item.id} className="equipment-card">
            <div className="equipment-icon-large">
              <FaTractor />
            </div>
            <div className="equipment-details">
              <h3>{item.name}</h3>
              <div className="equipment-price-tag">
                <FaDollarSign />
                <span>₹{item.price}/day</span>
              </div>
              <button 
                className="btn-rent"
                onClick={() => handleRent(item)}
              >
                Rent Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {equipment.length === 0 && (
        <div className="empty-state">
          <FaTractor />
          <p>No equipment available at the moment</p>
        </div>
      )}

      {showModal && selectedEquipment && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rent {selectedEquipment.name}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}
              
              <div className="rental-summary">
                <div className="summary-item">
                  <span>Equipment:</span>
                  <strong>{selectedEquipment.name}</strong>
                </div>
                <div className="summary-item">
                  <span>Price per day:</span>
                  <strong>₹{selectedEquipment.price}</strong>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="days">
                  <FaCalendarAlt />
                  <span>Number of Days</span>
                </label>
                <input
                  type="number"
                  id="days"
                  min="1"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  required
                />
              </div>

              <div className="total-calculation">
                <span>Total Amount:</span>
                <strong>₹{calculateTotal()}</strong>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Rental
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrowseEquipment;