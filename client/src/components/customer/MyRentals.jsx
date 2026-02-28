import React, { useState, useEffect } from 'react';
import { getMyRentals, returnRental } from '../../services/api';
import { FaClipboardList, FaTractor, FaClock, FaUndo } from 'react-icons/fa';
import './MyRentals.css';

function MyRentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const response = await getMyRentals();
      setRentals(response.data);
    } catch (error) {
      console.error('Error fetching rentals:', error);
      setError('Failed to load rentals');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (rentalId) => {
    try {
      await returnRental(rentalId);
      setSuccess('Equipment returned successfully!');
      fetchRentals();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to return equipment');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="my-rentals-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading rentals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-rentals-container">
      <div className="page-header">
        <h1>My Rentals</h1>
        <p>Track and manage your equipment rentals</p>
      </div>

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="rentals-list">
        {rentals.map((rental) => (
          <div key={rental.id} className={`rental-card ${rental.status}`}>
            <div className="rental-icon">
              <FaTractor />
            </div>
            <div className="rental-info">
              <h3>{rental.equipment_name}</h3>
              <div className="rental-details">
                <div className="detail-item">
                  <FaClock />
                  <span>{rental.days} days</span>
                </div>
                <div className="detail-item total">
                  <span>₹{rental.total}</span>
                </div>
              </div>
              <div className={`status-badge ${rental.status}`}>
                {rental.status === 'rented' ? 'Active' : 'Returned'}
              </div>
            </div>
            {rental.status === 'rented' && (
              <button 
                className="btn-return"
                onClick={() => handleReturn(rental.id)}
              >
                <FaUndo />
                <span>Return</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {rentals.length === 0 && (
        <div className="empty-state">
          <FaClipboardList />
          <p>You haven't rented any equipment yet</p>
          <a href="/customer/browse" className="btn-browse">
            Browse Equipment
          </a>
        </div>
      )}
    </div>
  );
}

export default MyRentals;