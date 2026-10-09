import { useEffect, useRef, useState, useCallback } from "react";
import "./AIAssistant.css";
import { VoiceSession } from "../services/voiceService.js";

import VoiceInput from "./VoiceInput";
import VoiceOutput from "./VoiceOutput";
import SpecularButton from "./SpecularButton";

function AIAssistant() {
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | listening | processing | disconnected
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const sessionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, streamingText]);

  // Initialize session on mount
  useEffect(() => {
    const session = new VoiceSession({
      role: "educator",
      userId: "educator-1",
      onReady: (data) => {
        if (data.greeting) {
          setChat([{ sender: "agnes", text: data.greeting }]);
        }
        setStatus("idle");
        setError("");
      },
      onStatus: (s) => setStatus(s),
      onTranscript: (data) => {
        if (data.sender === "assistant") {
          setStreamingText("");
          setChat((prev) => [...prev, { sender: "agnes", text: data.text }]);
          session.speak(data.text);
        } else if (data.sender === "user") {
          setChat((prev) => [...prev, { sender: "user", text: data.text }]);
        }
      },
      onToken: (token) => {
        setStreamingText((prev) => prev + token);
      },
      onError: (msg) => {
        setError(msg);
        setStatus("idle");
      },
      onSpeakingChange: (speaking) => {
        setIsSpeaking(speaking);
      },
    });

    session.connect();
    sessionRef.current = session;

    return () => {
      session.disconnect();
    };
  }, []);

  const handleVoiceToggle = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    if (session.isListening) {
      session.stopListening();
    } else {
      setError("");
      session.startListening();
    }
  }, []);

  const handleSend = useCallback(() => {
    const text = message.trim();
    if (!text || !sessionRef.current) return;
    sessionRef.current.sendMessage(text);
    setMessage("");
    setError("");
  }, [message]);

  const handleVoiceOutput = (text) => {
    sessionRef.current?.speak(text);
  };

  const isListening = status === "listening";
  const isLoading = status === "processing";

  return (
    <div className="page ai-page">
      <div className="page-header">
        <div>
          <h2>Agnes</h2>
          <p>Talk to Agnes and brainstorm teaching ideas.</p>
        </div>
      </div>

      <div className="ai-chat-container">
        <div className="chat-messages" aria-live="polite">
          {chat.length === 0 && !streamingText && (
            <div className="empty-chat">
              <h3>👋 Hello, Educator!</h3>
              <p>
                Ask Agnes about teaching methods, assignments,
                learning paths, or student difficulties. Tap the mic or type below.
              </p>
            </div>
          )}

          {chat.map((item, index) => (
            <div
              key={index}
              className={`chat-message ${
                item.sender === "user" ? "user-message" : "agnes-message"
              }`}
            >
              <div className="message-content">
                <p>{item.text}</p>
                {item.sender === "agnes" && (
                  <VoiceOutput
                    isPlaying={false}
                    onPlay={() => handleVoiceOutput(item.text)}
                  />
                )}
              </div>
            </div>
          ))}

          {streamingText && (
            <div className="chat-message agnes-message">
              <div className="message-content">
                <p>
                  {streamingText}
                  <span className="vaw-cursor" style={{ marginLeft: "4px", display: "inline-block", width: "8px", height: "1em", backgroundColor: "currentColor", animation: "blink 1s step-end infinite" }} />
                </p>
              </div>
            </div>
          )}

          {isListening && (
            <div className="chat-message user-message">
              <div className="message-content">
                <p><em>Listening...</em></p>
              </div>
            </div>
          )}

          {isLoading && !streamingText && (
            <div className="chat-message agnes-message">
              <div className="message-content">
                <p><em>Agnes is thinking...</em></p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="chat-message agnes-message error-message">
               <div className="message-content">
                 <p style={{color: "var(--color-danger)"}}><strong>Error:</strong> {error}</p>
               </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          {isSpeaking && (
            <button
              className="stop-speaking-btn"
              onClick={() => sessionRef.current?.stopSpeaking()}
              type="button"
              title="Stop Agnes from speaking"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ⏹ Stop Agnes
            </button>
          )}

          <VoiceInput
            isListening={isListening}
            onToggle={handleVoiceToggle}
            disabled={isLoading}
          />

          <input
            type="text"
            placeholder={isListening ? "Listening... (auto-sends after 2s silence)" : "Ask Agnes something..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend();
              }
            }}
            disabled={isLoading}
          />

          <SpecularButton
            className="send-btn"
            onClick={handleSend}
            disabled={isLoading || !message.trim()}
          >
            Send
          </SpecularButton>
        </div>
      </div>
    </div>
  );
}

export default AIAssistant;