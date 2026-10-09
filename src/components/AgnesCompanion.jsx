import { useEffect, useRef, useState } from "react";
import { sendToAgnes } from "../services/agnesApi";
import "./AgnesCompanion.css";

function AgnesCompanion() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [notice, setNotice] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const messagesRef = useRef(null);
  const recognitionRef = useRef(null);
  const speakResponseRef = useRef(false);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [chat, isLoading]);

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    },
    [],
  );

  const sendMessage = async (text) => {
    const trimmedMessage = text.trim();
    if (!trimmedMessage || isLoading) return;

    setChat((currentChat) => [
      ...currentChat,
      { sender: "user", text: trimmedMessage },
    ]);
    setMessage("");
    setNotice("");
    setIsLoading(true);

    try {
      const data = await sendToAgnes(trimmedMessage);
      setChat((currentChat) => [
        ...currentChat,
        { sender: "agnes", text: data.response },
      ]);
      if (speakResponseRef.current && window.speechSynthesis) {
        speakMessage(data.response);
      }
    } catch (error) {
      setChat((currentChat) => [
        ...currentChat,
        {
          sender: "agnes",
          text: error instanceof Error ? error.message : "Agnes request failed.",
        },
      ]);
    } finally {
      speakResponseRef.current = false;
      setIsLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotice("Voice input is not supported in this browser. You can still type to Agnes.");
      return;
    }

    setNotice("");
    let recognizedText = "";
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      recognizedText = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ")
        .trim();
    };
    recognition.onerror = (event) => {
      setNotice(
        event.error === "not-allowed"
          ? "Microphone access is blocked. Allow it in your browser settings."
          : "I couldn't hear that clearly. Please try again or type your message.",
      );
      setIsListening(false);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      if (recognizedText) {
        speakResponseRef.current = true;
        void sendMessage(recognizedText);
      }
    };
    recognitionRef.current = recognition;
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setNotice("I couldn't start the microphone. Please try again or type your message.");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    startListening();
  };

  const speakMessage = (text) => {
    if (!window.speechSynthesis) {
      setNotice("Voice playback is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    setSubtitle(text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const closePanel = () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setIsListening(false);
    setIsSpeaking(false);
    setSubtitle("");
    setIsOpen(false);
  };

  const openPanel = () => {
    setIsOpen(true);
    speakMessage("Hi, I'm Agnes. Tap the microphone and tell me what you need.");
  };

  return (
    <div className="agnes-companion">
      {isOpen && (
        <section
          className="agnes-panel"
          aria-label="Chat with Agnes"
          aria-live="polite"
        >
          <header className="agnes-panel__header">
            <div className="agnes-panel__identity">
              <span className="agnes-avatar agnes-avatar--small" aria-hidden="true">
                <span className="agnes-avatar__eyes" />
                <span className="agnes-avatar__smile" />
              </span>
              <div>
                <strong>Agnes</strong>
                <span>Your teaching companion</span>
              </div>
            </div>
            <button
              className="agnes-panel__close"
              type="button"
              aria-label="Close Agnes"
              onClick={closePanel}
            >
              ×
            </button>
          </header>

          {subtitle && (
            <div className="agnes-panel__subtitles" role="status" aria-live="polite">
              <span>Agnes · subtitles</span>
              <p>{subtitle}</p>
            </div>
          )}

          <div className="agnes-panel__messages" ref={messagesRef}>
            {chat.length === 0 && (
              <div className="agnes-panel__welcome">
                <strong>Hi there! I’m Agnes.</strong>
                <p>Ask me about your students, lessons, or learning paths.</p>
              </div>
            )}
            {chat.map((item, index) => (
              <div
                className={`agnes-bubble agnes-bubble--${item.sender}`}
                key={`${item.sender}-${index}`}
              >
                <p>{item.text}</p>
                {item.sender === "agnes" && (
                  <button
                    className="agnes-bubble__speak"
                    type="button"
                    aria-label="Speak Agnes's response"
                    onClick={() => speakMessage(item.text)}
                  >
                    🔊
                  </button>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="agnes-bubble agnes-bubble--agnes">
                <p>Thinking of a helpful answer...</p>
              </div>
            )}
          </div>

          {notice && <p className="agnes-panel__notice" role="status">{notice}</p>}

          <div className="agnes-panel__voice">
            <button
              className={`agnes-panel__voice-button${isListening ? " is-listening" : ""}${isSpeaking ? " is-speaking" : ""}`}
              type="button"
              aria-label={isListening ? "Stop listening" : "Start voice chat with Agnes"}
              title={isListening ? "Tap to finish speaking" : "Tap to speak"}
              onClick={toggleListening}
              disabled={isLoading}
            >
              <span aria-hidden="true">{isListening ? "■" : "🎙"}</span>
            </button>
            <strong>
              {isListening
                ? "Listening... tap when you're finished"
                : isLoading
                  ? "Agnes is thinking..."
                  : isSpeaking
                    ? "Agnes is speaking..."
                    : "Tap the mic and talk to Agnes"}
            </strong>
            <span>Your message and Agnes's reply are spoken aloud.</span>
            <button
              className="agnes-panel__text-toggle"
              type="button"
              onClick={() => setIsTextMode((currentMode) => !currentMode)}
            >
              {isTextMode ? "Back to voice chat" : "Type instead"}
            </button>
          </div>

          {isTextMode && (
            <form
              className="agnes-panel__composer"
              onSubmit={(event) => {
                event.preventDefault();
                speakResponseRef.current = false;
                void sendMessage(message);
              }}
            >
              <input
                aria-label="Message Agnes"
                placeholder="Type a message..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <button
                className="agnes-panel__send"
                type="submit"
                aria-label="Send message"
                disabled={isLoading || !message.trim()}
              >
                ↑
              </button>
            </form>
          )}
        </section>
      )}

      <button
        className={`agnes-launcher${isOpen ? " is-open" : ""}${isSpeaking ? " is-speaking" : ""}`}
        type="button"
        aria-label={isOpen ? "Close Agnes assistant" : "Talk to Agnes"}
        aria-expanded={isOpen}
        onClick={isOpen ? closePanel : openPanel}
      >
        <span className="agnes-avatar" aria-hidden="true">
          <span className="agnes-avatar__shine" />
          <span className="agnes-avatar__eyes" />
          <span className="agnes-avatar__smile" />
        </span>
        <span className="agnes-launcher__label">Agnes</span>
      </button>
    </div>
  );
}

export default AgnesCompanion;
