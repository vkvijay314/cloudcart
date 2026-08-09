import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi there! 👋 I am your Lumina Assistant. Ask me anything about our products, check your cart, or track your orders!"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Send message
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    // Add user message to state
    const updatedMessages = [...messages, { role: "user", content: text }];
    setMessages(updatedMessages);
    if (!textToSend) setInput(""); // Clear input if sent from box
    setIsLoading(true);

    try {
      // API call to chatbot backend endpoint
      const response = await api.post("/chat", {
        messages: updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      if (response.data?.success) {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: response.data.message }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "Sorry, I couldn't process that request. Please try again." }
        ]);
      }
    } catch (error) {
      console.error("Chatbot API error:", error);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Network error. Make sure the backend server is running!" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Form submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  // Suggestions handler
  const handleSuggestion = (suggestionText) => {
    handleSendMessage(suggestionText);
  };

  // Custom parser for Markdown bold (**text**) and relative links ([Text](/route))
  const renderMessageContent = (content) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      // Add text before link
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      const linkText = match[1];
      const linkUrl = match[2];
      
      // Add Link component (closes chat on click if navigating to key areas)
      parts.push(
        <Link
          key={match.index}
          to={linkUrl}
          onClick={() => {
            if (window.innerWidth < 768) {
              setIsOpen(false);
            }
          }}
          className="text-primary font-bold underline hover:text-secondary-container transition-colors inline-flex items-center gap-0.5 mx-1"
        >
          {linkText}
          <span className="material-symbols-outlined text-[12px]">open_in_new</span>
        </Link>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    // Process bold segments inside parts
    return parts.map((part, index) => {
      if (typeof part === "string") {
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const boldParts = [];
        let bLastIdx = 0;
        let bMatch;
        
        while ((bMatch = boldRegex.exec(part)) !== null) {
          if (bMatch.index > bLastIdx) {
            boldParts.push(part.substring(bLastIdx, bMatch.index));
          }
          boldParts.push(
            <strong key={bMatch.index} className="font-extrabold text-on-surface">
              {bMatch[1]}
            </strong>
          );
          bLastIdx = boldRegex.lastIndex;
        }
        
        if (bLastIdx < part.length) {
          boldParts.push(part.substring(bLastIdx));
        }
        
        return boldParts.length > 0 ? boldParts : part;
      }
      return part;
    });
  };

  return (
    <>
      {/* FLOATING ACTION BUBBLE BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-primary to-secondary text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer"
        aria-label="Toggle chatbot"
      >
        {isOpen ? (
          <span className="material-symbols-outlined text-[24px] sm:text-[28px] transition-transform duration-300 rotate-90">
            close
          </span>
        ) : (
          <div className="relative w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
            {/* Custom glowing AI vector logo */}
            <svg className="w-full h-full text-white animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="1.5" className="animate-ping" style={{ transformOrigin: 'center', animationDuration: '3s' }}/>
            </svg>
          </div>
        )}
        
        {/* Glow indicator */}
        <span className="absolute inline-flex h-full w-full rounded-full bg-primary/20 animate-ping -z-10 group-hover:animate-none"></span>
      </button>

      {/* CHAT DRAWER */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50 flex flex-col w-[calc(100vw-2rem)] sm:w-96 h-[75vh] sm:h-[550px] max-h-[580px] glass-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 border border-outline-variant/30">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-primary to-secondary text-white">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/20">
                <svg className="w-5 h-5 text-white animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 2Z" fill="currentColor"/>
                </svg>
                {/* Active Indicator dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-primary rounded-full"></span>
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm leading-none">Lumina Assistant</h3>
                <span className="text-[10px] text-white/70">Online &amp; Context Aware</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-surface-container-lowest/50">
            
            {/* Disclaimer or System Banner */}
            <div className="text-[11px] text-center text-on-surface-variant bg-surface-container-low/60 py-1.5 px-3 rounded-lg border border-outline-variant/10">
              ⚡ Lumina can view inventory, track orders &amp; summaries in real-time.
            </div>

            {messages.map((msg, index) => {
              const isBot = msg.role === "assistant";
              return (
                <div
                  key={index}
                  className={`flex ${isBot ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all ${
                      isBot
                        ? "bg-surface-container text-on-surface border border-outline-variant/20 rounded-tl-none font-normal"
                        : "bg-gradient-to-tr from-primary to-secondary text-white rounded-tr-none font-medium"
                    }`}
                  >
                    <div className="whitespace-pre-line leading-relaxed">
                      {isBot ? renderMessageContent(msg.content) : msg.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bouncing Loader */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface-container text-on-surface border border-outline-variant/20 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5 py-0.5">
                    <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions panel */}
          {messages.length === 1 && (
            <div className="px-4 py-2 flex flex-wrap gap-2 bg-surface-container-lowest/70 border-t border-outline-variant/10">
              <button
                onClick={() => handleSuggestion("What products do you have?")}
                className="text-xs text-primary bg-primary-fixed/20 hover:bg-primary-fixed/40 px-2.5 py-1.5 rounded-full border border-primary/20 transition-all font-medium cursor-pointer"
              >
                Browse Shop 🛍️
              </button>
              <button
                onClick={() => handleSuggestion("What items are in my cart?")}
                className="text-xs text-primary bg-primary-fixed/20 hover:bg-primary-fixed/40 px-2.5 py-1.5 rounded-full border border-primary/20 transition-all font-medium cursor-pointer"
              >
                My Cart 🛒
              </button>
              <button
                onClick={() => handleSuggestion("Check my recent orders status")}
                className="text-xs text-primary bg-primary-fixed/20 hover:bg-primary-fixed/40 px-2.5 py-1.5 rounded-full border border-primary/20 transition-all font-medium cursor-pointer"
              >
                Track Orders 📦
              </button>
              <button
                onClick={() => handleSuggestion("How do I split expenses?")}
                className="text-xs text-primary bg-primary-fixed/20 hover:bg-primary-fixed/40 px-2.5 py-1.5 rounded-full border border-primary/20 transition-all font-medium cursor-pointer"
              >
                Split Expenses 👥
              </button>
            </div>
          )}

          {/* Input Panel */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-4 py-3 bg-surface-container-lowest border-t border-outline-variant/30"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Lumina anything..."
              disabled={isLoading}
              className="flex-grow px-4 py-2 text-sm bg-surface-container-low border border-outline-variant/40 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface placeholder-on-surface-variant/50 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary hover:bg-primary-container text-white disabled:opacity-40 disabled:hover:bg-primary transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default Chatbot;
