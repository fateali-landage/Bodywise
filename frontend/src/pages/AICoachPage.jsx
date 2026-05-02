import { aiChat } from "../services/api";
import { useState, useRef, useEffect } from "react";
import { PageHeader, ErrorBanner, ActionButton } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { useBodyWise } from "../context/BodyWiseContext";

export default function AICoachPage() {

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
  setMessages(prev => [
    ...prev,
    { role: "user", text: userMessage }
  ]);

  setInput("");
  setLoading(true);
  setError(null);

  try {
  const contextPayload = {
    body: result?.body,
    lifestyle: result?.lifestyle,
    skin: result?.skin,
  };

  const res = await aiChat({
    message: userMessage,
    context: contextPayload,
  });

  const reply =
    typeof res?.data?.reply === "string" && res.data.reply.trim()
      ? res.data.reply
      : "AI is unavailable right now.";

  setMessages(prev => [
    ...prev,
    { role: "ai", text: reply },
  ]);

} catch (err) {
  console.error(err);

  setMessages(prev => [
    ...prev,
    { role: "ai", text: "⚠️ AI is busy. Try again in a moment." },
  ]);

  setError(err.message || "Something went wrong.");
} finally {
  setLoading(false); // ✅ THIS WAS MISSING
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

      <div className="glass flex flex-col h-[60vh] sm:h-[70vh] p-4 sm:p-5 relative">
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4 pr-2">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`py-3 px-4 rounded-[12px] max-w-[85%] sm:max-w-[75%] leading-relaxed text-[14px] sm:text-[15px] whitespace-pre-wrap ${
                msg.role === "user" 
                  ? "self-end bg-[var(--cyan)] text-black" 
                  : "self-start bg-white/5 text-[var(--text-primary)]"
              }`}
            >
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="self-start py-3 px-4 bg-white/5 text-[var(--text-muted)] rounded-[12px] text-[14px] sm:text-[15px]">
              Typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2.5 mt-auto pt-2">
          <input 
            type="text" 
            className="field-input flex-1" 
            placeholder="Type your message..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <ActionButton
  onClick={handleSend}
  disabled={!input.trim() || loading}
  className="m-0 opacity-100 disabled:opacity-50"
>
  {loading ? "..." : "Send"}
</ActionButton>
        </div>
      </div>
    </div>
  );
}
