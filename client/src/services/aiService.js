/**
 * Updated AI Service - Calls Flask Backend (NO CORS Issues!)
 * 
 * Instead of calling Anthropic API directly from browser (which causes CORS),
 * we now call our Flask backend which then calls Anthropic API.
 * 
 * Flow: React → Flask Backend → Anthropic API → Flask → React
 */

import api from './api';

/**
 * AI-Powered Equipment Recommendation
 * Now calls /api/ai/recommend on your Flask backend
 */
export const getAIRecommendation = async (userProfile) => {
  try {
    const response = await api.post('/ai/recommend', {
      farmSize: userProfile.farmSize,
      cropType: userProfile.cropType,
      season: userProfile.season,
      budget: userProfile.budget,
      soilType: userProfile.soilType,
      previousRentals: userProfile.previousRentals || []
    });

    return response.data;
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    return { 
      error: error.response?.data?.error || 'Failed to get recommendations. Please try again.' 
    };
  }
};

/**
 * AI-Powered Chatbot Assistant
 * Now calls /api/ai/chat on your Flask backend
 */
export const askAIAssistant = async (question, context) => {
  try {
    const response = await api.post('/ai/chat', {
      question: question,
      context: context
    });

    return {
      response: response.data.response,
      timestamp: response.data.timestamp
    };
  } catch (error) {
    console.error('AI Assistant Error:', error);
    return { 
      response: "I'm having trouble connecting right now. Please try again or contact support.",
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * AI-Powered Rental Contract Generator
 * Now calls /api/ai/contract on your Flask backend
 */
export const generateRentalContract = async (rentalDetails) => {
  try {
    const response = await api.post('/ai/contract', {
      customerName: rentalDetails.customerName,
      equipmentName: rentalDetails.equipmentName,
      days: rentalDetails.days,
      startDate: rentalDetails.startDate,
      dailyRate: rentalDetails.dailyRate,
      totalCost: rentalDetails.totalCost,
      deposit: rentalDetails.deposit
    });

    return {
      contractHtml: response.data.contractHtml,
      generatedAt: response.data.generatedAt
    };
  } catch (error) {
    console.error('Contract Generation Error:', error);
    return { 
      error: error.response?.data?.error || 'Failed to generate contract'
    };
  }
};

export default {
  getAIRecommendation,
  askAIAssistant,
  generateRentalContract
};