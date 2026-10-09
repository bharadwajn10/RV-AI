import "./VoiceInput.css";

import SpecularButton from "./SpecularButton";

function VoiceInput({ isListening, onToggle }) {
  return (
    <SpecularButton
      className={`voice-input-btn ${isListening ? "listening" : ""}`}
      onClick={onToggle}
      type="button"
      title={isListening ? "Stop listening" : "Start voice input"}
    >
      {isListening ? "🔴" : "🎤"}
    </SpecularButton>
  );
}

export default VoiceInput;