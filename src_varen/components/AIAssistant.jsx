import { useState } from "react";
import "./AIAssistant.css";
import { sendToAgnes } from "../services/agnesApi";

import VoiceInput from "./VoiceInput";
import VoiceOutput from "./VoiceOutput";
import SpecularButton from "./SpecularButton";

function AIAssistant() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [playingMessage, setPlayingMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVoiceInput = () => {
    // Your teammate will connect STT here
    setIsListening(!isListening);
  };

  const handleVoiceOutput = (index) => {
    // Your teammate will connect TTS here
    setPlayingMessage(index);

    setTimeout(() => {
      setPlayingMessage(null);
    }, 1500);
  };

  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message;

    setChat((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const data = await sendToAgnes(userMessage);

      setChat((prev) => [
        ...prev,
        {
          sender: "agnes",
          text: data.response,
        },
      ]);
    } catch (error) {
      setChat((prev) => [
        ...prev,
        {
          sender: "agnes",
          text: error instanceof Error ? error.message : "Agnes request failed.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page ai-page">

      <div className="page-header">
        <div>
          <h2>AI Assistant</h2>
          <p>Talk to Agnes and brainstorm teaching ideas.</p>
        </div>
      </div>

      <div className="ai-chat-container">

        <div className="chat-messages">

          {chat.length === 0 && (
            <div className="empty-chat">
              <h3>👋 Hello, Educator!</h3>
              <p>
                Ask Agnes about teaching methods, assignments,
                learning paths, or student difficulties.
              </p>
            </div>
          )}

          {chat.map((item, index) => (
            <div
              key={index}
              className={`chat-message ${
                item.sender === "user"
                  ? "user-message"
                  : "agnes-message"
              }`}
            >
              <div className="message-content">
                <p>{item.text}</p>

                {item.sender === "agnes" && (
                  <VoiceOutput
                    isPlaying={playingMessage === index}
                    onPlay={() => handleVoiceOutput(index)}
                  />
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="agnes-message">
              <div className="message-content">
                <p>Agnes is thinking...</p>
              </div>
            </div>
          )}

        </div>

        <div className="chat-input-area">

          <VoiceInput
            isListening={isListening}
            onToggle={handleVoiceInput}
          />

          <input
            type="text"
            placeholder="Ask Agnes something..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend();
              }
            }}
          />

          <SpecularButton
            className="send-btn"
            onClick={handleSend}
            disabled={loading}
          >
            Send
          </SpecularButton>

        </div>

      </div>
    </div>
  );
}

export default AIAssistant;