import { aiChat } from "../services/api";
import { useState, useRef, useEffect } from "react";
import { PageHeader, ErrorBanner, ActionButton } from "../components/ui";
import { useBodyWise } from "../context/BodyWiseContext";

const SUGGESTED_PROMPTS = [
  "What is my calorie goal based on BMR?",
  "How does hydration impact skin quality?",
  "Create a quick weekly workout routine",
  "Explain my current BMI analysis",
];

// Simple, safe Markdown renderer that translates headers, bold text, lists, and inline code to JSX
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  
  return lines.map((line, idx) => {
    // Headers
    if (line.trim().startsWith("### ")) {
      return <h4 key={idx} className="font-syne font-bold text-[14px] text-[var(--text-primary)] mt-3 mb-1">{line.trim().slice(4)}</h4>;
    }
    if (line.trim().startsWith("## ")) {
      return <h3 key={idx} className="font-syne font-bold text-[16px] text-[var(--text-primary)] mt-4 mb-2">{line.trim().slice(3)}</h3>;
    }
    if (line.trim().startsWith("# ")) {
      return <h2 key={idx} className="font-syne font-bold text-[18px] text-[var(--text-primary)] mt-4 mb-2">{line.trim().slice(2)}</h2>;
    }
    
    // Lists
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      return (
        <ul key={idx} className="list-disc pl-5 my-1 text-[13.5px] text-[var(--text-secondary)]">
          <li>{renderInline(line.trim().slice(2))}</li>
        </ul>
      );
    }
    
    // Default Paragraphs
    if (line.trim() === "") return <div key={idx} className="h-2" />;
    return <p key={idx} className="my-1.5 leading-relaxed text-[13.5px] text-[var(--text-secondary)]">{renderInline(line)}</p>;
  });
}

function renderInline(text) {
  // Bold parser: **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-[var(--text-primary)]">{part.slice(2, -2)}</strong>;
    }
    // Inline code parser: `code`
    const subparts = part.split(/(`.*?`)/g);
    return subparts.map((sub, j) => {
      if (sub.startsWith("`") && sub.endsWith("`")) {
        return <code key={j} className="mono bg-[rgba(255,255,255,0.06)] border border-[var(--border)] px-1 py-0.5 rounded text-[11.5px] text-[var(--cyan)] font-medium">{sub.slice(1, -1)}</code>;
      }
      return sub;
    });
  });
}

export default function AICoachPage() {
  const { result } = useBodyWise();
  const [messages, setMessages] = useState([
    { 
      role: "ai", 
      text: "Hello! I am BodyWise AI, your personal health coach. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (customMessage = null) => {
    const textToSend = customMessage ? customMessage.trim() : input.trim();
    if (!textToSend || loading) return;

    setMessages(prev => [
      ...prev,
      { 
        role: "user", 
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    if (!customMessage) setInput("");
    setLoading(true);
    setError(null);

    try {
      const contextPayload = {
        body: result?.body,
        lifestyle: result?.lifestyle,
        skin: result?.skin,
      };

      const res = await aiChat({
        message: textToSend,
        context: contextPayload,
      });

      const reply =
        typeof res?.data?.reply === "string" && res.data.reply.trim()
          ? res.data.reply
          : "AI Coach is currently offline. Please try again.";

      setMessages(prev => [
        ...prev,
        { 
          role: "ai", 
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { 
          role: "ai", 
          text: "⚠️ Something went wrong on my network layers. Click regenerate to retry.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ]);
      setError(err.message || "Failed to reach AI Coach server.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = () => {
    // Find last user message
    const userMsgs = messages.filter(m => m.role === "user");
    if (userMsgs.length > 0) {
      const lastText = userMsgs[userMsgs.length - 1].text;
      handleSend(lastText);
    }
  };

  return (
    <div className="page-container">
      <PageHeader 
        eyebrow="AI Wellness Companion" 
        title="Your Health Coach" 
        description="Ask contextual questions about calorie balance, skin signals, sleeping habits, or diet plans." 
      />

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <div className="glass flex flex-col h-[65vh] sm:h-[70vh] p-4 sm:p-5 relative hover:border-[var(--border-hover)]">
        
        {/* Messages scroll list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4 pr-1 scrollbar">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div 
                key={idx} 
                className={`flex flex-col gap-1.5 max-w-[85%] sm:max-w-[75%] ${isUser ? "self-end items-end" : "self-start items-start"}`}
              >
                <div 
                  className={`py-3 px-4 rounded-[16px] text-[14px] leading-relaxed shadow-sm transition-all duration-200 ${
                    isUser 
                      ? "bg-gradient-to-tr from-[var(--cyan)] to-[#0ea5e9] text-black font-medium rounded-tr-none" 
                      : "bg-[var(--bg-surface-2)] text-[var(--text-primary)] border border-[var(--border)] rounded-tl-none"
                  }`}
                >
                  {isUser ? msg.text : renderMarkdown(msg.text)}
                  
                  {/* Actions for AI responses */}
                  {!isUser && (
                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
                      <button 
                        onClick={() => copyToClipboard(msg.text, idx)} 
                        className="bg-transparent border-none text-[var(--text-muted)] hover:text-[var(--cyan)] cursor-pointer transition-colors px-0 flex items-center gap-1 font-semibold"
                      >
                        {copiedId === idx ? "Copied! ✔" : "📋 Copy"}
                      </button>
                      {idx === messages.length - 1 && (
                        <button 
                          onClick={handleRegenerate}
                          className="bg-transparent border-none text-[var(--text-muted)] hover:text-[var(--cyan)] cursor-pointer transition-colors px-0 flex items-center gap-1 font-semibold"
                        >
                          🔁 Regenerate
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono px-1">
                  {msg.timestamp || "—"}
                </span>
              </div>
            );
          })}
          
          {/* Typing Indicator */}
          {loading && (
            <div className="self-start flex flex-col items-start gap-1">
              <div className="py-3 px-4 bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-[16px] rounded-tl-none text-[14px] text-[var(--text-muted)] flex items-center">
                <span className="typing-dots">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts (renders if no active request) */}
        {!loading && messages.length <= 2 && (
          <div className="flex flex-wrap gap-2 mb-3.5 mt-auto">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="py-1.5 px-3 rounded-full text-xs font-semibold bg-[var(--bg-surface-2)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--cyan)] hover:border-[var(--cyan)] hover:-translate-y-[0.5px] transition-all cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input box */}
        <div className="flex gap-2 pt-2 border-t border-[var(--border)] items-center">
          <input 
            type="text" 
            className="field-input flex-1 h-11" 
            placeholder="Ask anything about calorie intake, workouts, body parameters..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <ActionButton
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="m-0 h-11 px-5 w-auto flex-shrink-0"
          >
            {loading ? "..." : "Send"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
