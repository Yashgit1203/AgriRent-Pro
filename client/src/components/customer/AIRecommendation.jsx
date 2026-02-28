import React, { useState, useEffect } from 'react';
import { getEquipment } from '../../services/api';
import { getAIRecommendation } from '../../services/aiService';
import { FaRobot, FaTractor, FaLeaf, FaCalendar, FaDollarSign, FaMagic } from 'react-icons/fa';
import './AIRecommendation.css';

function AIRecommendation() {
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [formData, setFormData] = useState({
    farmSize: '',
    cropType: '',
    season: '',
    budget: '',
    soilType: 'loamy'
  });

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await getEquipment();
      setEquipment(response.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const userProfile = {
      ...formData,
      availableEquipment: equipment,
      previousRentals: [] // Could fetch from rental history
    };

    const result = await getAIRecommendation(userProfile);
    setRecommendations(result);
    setLoading(false);
  };

  return (
    <div className="ai-recommendation-container">
      <div className="ai-header">
        <div className="ai-icon-large">
          <FaRobot />
        </div>
        <h1>AI-Powered Equipment Advisor</h1>
        <p>Let our AI recommend the perfect equipment for your farm</p>
      </div>

      <form onSubmit={handleSubmit} className="ai-form">
        <div className="form-row">
          <div className="form-group">
            <label>
              <FaTractor />
              <span>Farm Size (acres)</span>
            </label>
            <input
              type="number"
              name="farmSize"
              value={formData.farmSize}
              onChange={handleChange}
              placeholder="e.g., 50"
              required
              min="1"
            />
          </div>

          <div className="form-group">
            <label>
              <FaLeaf />
              <span>Crop Type</span>
            </label>
            <select
              name="cropType"
              value={formData.cropType}
              onChange={handleChange}
              required
            >
              <option value="">Select crop type</option>
              <option value="wheat">Wheat</option>
              <option value="rice">Rice</option>
              <option value="corn">Corn</option>
              <option value="cotton">Cotton</option>
              <option value="sugarcane">Sugarcane</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              <FaCalendar />
              <span>Season</span>
            </label>
            <select
              name="season"
              value={formData.season}
              onChange={handleChange}
              required
            >
              <option value="">Select season</option>
              <option value="spring">Spring (Feb-May)</option>
              <option value="monsoon">Monsoon (Jun-Sep)</option>
              <option value="autumn">Autumn (Oct-Nov)</option>
              <option value="winter">Winter (Dec-Jan)</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <FaDollarSign />
              <span>Daily Budget (₹)</span>
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="e.g., 2000"
              required
              min="100"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Soil Type</label>
          <select
            name="soilType"
            value={formData.soilType}
            onChange={handleChange}
          >
            <option value="clay">Clay</option>
            <option value="sandy">Sandy</option>
            <option value="loamy">Loamy</option>
            <option value="black">Black Soil</option>
            <option value="red">Red Soil</option>
          </select>
        </div>

        <button type="submit" className="btn-ai-generate" disabled={loading}>
          {loading ? (
            <>
              <div className="ai-spinner"></div>
              <span>AI is thinking...</span>
            </>
          ) : (
            <>
              <FaMagic />
              <span>Get AI Recommendations</span>
            </>
          )}
        </button>
      </form>

      {recommendations && !recommendations.error && (
        <div className="ai-results">
          <h2>AI Recommendations for Your Farm</h2>

          <div className="recommendations-grid">
            {recommendations.recommendations?.map((rec, index) => (
              <div key={index} className="recommendation-card">
                <div className="rec-priority">
                  Priority #{rec.priority}
                </div>
                <h3>
                  <FaTractor />
                  {rec.equipment}
                </h3>
                <p className="rec-reason">{rec.reason}</p>
                <div className="rec-details">
                  <div className="rec-detail">
                    <span>Estimated Duration:</span>
                    <strong>{rec.estimatedDays} days</strong>
                  </div>
                  <div className="rec-detail">
                    <span>Estimated Cost:</span>
                    <strong>₹{equipment.find(e => e.name === rec.equipment)?.price * rec.estimatedDays || 'N/A'}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {recommendations.totalEstimatedCost && (
            <div className="cost-summary">
              <h3>Total Estimated Cost</h3>
              <div className="total-cost">₹{recommendations.totalEstimatedCost}</div>
            </div>
          )}

          {recommendations.seasonalTips && (
            <div className="seasonal-tips">
              <h3>🌾 Seasonal Tips</h3>
              <p>{recommendations.seasonalTips}</p>
            </div>
          )}

          {recommendations.costAnalysis && (
            <div className="cost-analysis">
              <h3>💰 Cost-Effectiveness Analysis</h3>
              <p>{recommendations.costAnalysis}</p>
            </div>
          )}
        </div>
      )}

      {recommendations?.error && (
        <div className="ai-error">
          <p>Unable to generate recommendations. Please try again.</p>
        </div>
      )}
    </div>
  );
}

export default AIRecommendation;