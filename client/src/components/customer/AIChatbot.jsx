import React, { useState, useEffect, useRef } from "react";
import { askAIAssistant } from "../../services/aiService";
import { getEquipment } from "../../services/api";
import { FaRobot, FaPaperPlane, FaTimes, FaUser } from "react-icons/fa";
import "./AIChatbot.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function AIChatbot({ userType = "customer" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "👋 Hi! I'm AgriBot, your farming equipment assistant. How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchEquipment = async () => {
    try {
      const response = await getEquipment();
      setEquipment(response.data);
    } catch (error) {
      console.error("Error fetching equipment:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      type: "user",
      text: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    const context = {
      equipment,
      userType,
      season: getCurrentSeason(),
    };

    const response = await askAIAssistant(inputMessage, context);

    const botMessage = {
      type: "bot",
      text: response.response,
      timestamp: response.timestamp,
    };

    setMessages((prev) => [...prev, botMessage]);
    setLoading(false);
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 2 && month <= 5) return "Spring";
    if (month >= 6 && month <= 9) return "Monsoon";
    if (month >= 10 && month <= 11) return "Autumn";
    return "Winter";
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "What equipment do you have for wheat farming?",
    "How much does a tractor cost per day?",
    "What's the difference between a harvester and a thresher?",
    "Do you offer delivery services?",
    "What equipment is best for small farms?",
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
          <FaRobot />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-icon">
              <FaRobot />
            </div>
            <div className="chatbot-header-text">
              <h3>AgriBot Assistant</h3>
              <p>Powered by AI • Always here to help</p>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                <div className="message-avatar">
                  {msg.type === "bot" ? <FaRobot /> : <FaUser />}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {msg.type === "bot" ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message bot">
                <div className="message-avatar">
                  <FaRobot />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="quick-questions">
              <p>Quick questions:</p>
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  className="quick-question-btn"
                  onClick={() => handleQuickQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          <div className="chatbot-input">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about farming equipment..."
              rows="1"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !inputMessage.trim()}
              className="send-button"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AIChatbot;
