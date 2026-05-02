import { useState, useRef, useEffect } from "react";
import { PageHeader, ErrorBanner, ActionButton } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { useBodyWise } from "../context/BodyWiseContext";

export default function AICoachPage() {
  const { session } = useAuth();
  const { result } = useBodyWise();
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hello! I am BodyWise AI, your personal health coach. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const contextPayload = {
        body: result?.body,
        lifestyle: result?.lifestyle,
        skin: result?.skin,
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ message: userMessage, context: contextPayload }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch response");
      }

      setMessages(prev => [...prev, { role: "ai", text: data.response }]);
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred.");
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

  return (
    <div className="page-container">
      <PageHeader 
        eyebrow="AI Coach" 
        title="Your Personal Health Assistant" 
        description="Ask me anything about diet, fitness, and health." 
      />

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <div className="glass" style={{ display: "flex", flexDirection: "column", height: "60vh", padding: 20 }}>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                background: msg.role === "user" ? "var(--cyan)" : "rgba(255,255,255,0.06)",
                color: msg.role === "user" ? "#000" : "var(--text-primary)",
                padding: "12px 16px",
                borderRadius: 12,
                maxWidth: "80%",
                lineHeight: 1.5,
                fontSize: 15,
                whiteSpace: "pre-wrap"
              }}
            >
              {msg.text}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start", padding: "12px 16px", background: "rgba(255,255,255,0.06)", borderRadius: 12 }}>
              Typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <input 
            type="text" 
            className="field-input" 
            placeholder="Type your message..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ flex: 1 }}
          />
          <ActionButton onClick={handleSend} disabled={!input.trim() || loading}>
            Send
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
