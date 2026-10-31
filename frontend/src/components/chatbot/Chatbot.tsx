import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomerToken } from "../../services/authService";
import { API_URL } from "../../services/api";

interface ChatMessage {
  sender: "AI" | "You";
  text: string;
}

interface ChatResponse {
  success?: boolean;
  source?: string;
  conversation_id?: number;
  reply?: string;
  message?: string;
}

const suggestedQuestions = [
  "What rooms are available?",
  "How much does a room cost?",
  "How can I book a room?",
  "Which room is best for my family?",
];

export default function Chatbot() {
  const navigate = useNavigate();

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: "AI",
      text: "Hello! 👋 Welcome to SmartStay AI. How can I help you find a room today?",
    },
  ]);

  async function sendMessage(question?: string) {
    const messageText = (question ?? chatInput).trim();

    if (!messageText || chatLoading) return;

    const token = getCustomerToken();

    if (!token) {
      setChatMessages((previous) => [
        ...previous,
        {
          sender: "AI",
          text: "Please log in to your customer account before using SmartStay AI.",
        },
      ]);

      setChatInput("");
      return;
    }

    setChatMessages((previous) => [
      ...previous,
      { sender: "You", text: messageText },
    ]);

    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageText,
          ...(conversationId
            ? { conversation_id: conversationId }
            : {}),
        }),
      });

      const result: ChatResponse = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Your session has expired. Please log in again.");
        }

        if (response.status === 403) {
          throw new Error("Customer access only. Please use a customer account.");
        }

        throw new Error(
          result.message || "The AI assistant is unavailable.",
        );
      }

      if (result.conversation_id) {
        setConversationId(result.conversation_id);
      }

      setChatMessages((previous) => [
        ...previous,
        {
          sender: "AI",
          text: result.reply || "Sorry, I could not generate a response.",
        },
      ]);
    } catch (error) {
      setChatMessages((previous) => [
        ...previous,
        {
          sender: "AI",
          text:
            error instanceof Error
              ? `Sorry, I couldn't connect to the AI assistant. ${error.message}`
              : "Sorry, I could not connect to the AI assistant. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleLogin() {
    setChatOpen(false);
    navigate("/login");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setChatOpen((open) => !open)}
        aria-label={chatOpen ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={chatOpen}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-violet-700 text-2xl text-white shadow-lg transition hover:scale-105 hover:bg-violet-800"
      >
        {chatOpen ? "×" : "✦"}
      </button>

      {chatOpen && (
        <section
          aria-label="SmartStay AI Assistant"
          className="fixed bottom-24 right-4 z-50 flex h-[500px] w-[calc(100%-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:right-6"
        >
          <div className="bg-violet-700 p-4 text-white">
            <h2 className="font-bold">SmartStay AI Assistant</h2>
            <p className="mt-1 text-sm text-violet-100">
              Ask us about your stay!
            </p>
          </div>

          <div
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4"
          >
            {chatMessages.map((message, index) => (
              <div
                key={`${index}-${message.sender}`}
                className={`max-w-[90%] whitespace-pre-wrap rounded-xl p-3 text-sm leading-6 ${
                  message.sender === "You"
                    ? "ml-auto bg-violet-700 text-white"
                    : "bg-white text-slate-700 shadow-sm"
                }`}
              >
                <p className="mb-1 text-xs font-bold opacity-70">
                  {message.sender}
                </p>
                {message.text}
              </div>
            ))}

            {chatLoading && (
              <p className="text-sm text-slate-500">
                SmartStay AI is thinking...
              </p>
            )}

            {chatMessages.length === 1 && (
              <div className="pt-2">
                <p className="mb-3 text-xs font-semibold text-slate-500">
                  SUGGESTED QUESTIONS
                </p>

                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => void sendMessage(question)}
                      disabled={chatLoading}
                      className="rounded-full border border-violet-200 bg-white px-3 py-2 text-left text-xs text-violet-700 transition hover:border-violet-600 hover:bg-violet-50 disabled:opacity-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
            className="flex gap-2 border-t border-slate-200 bg-white p-3"
          >
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask about our hotel..."
              aria-label="Your message"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-600"
            />

            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {chatLoading ? "Sending..." : "Send"}
            </button>
          </form>

          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-2">
            <span className="text-xs text-slate-400">
              Powered by SmartStay AI
            </span>

            <button
              type="button"
              onClick={handleLogin}
              className="text-xs font-semibold text-violet-700 hover:text-violet-900"
            >
              Customer Login
            </button>
          </div>
        </section>
      )}
    </>
  );
}