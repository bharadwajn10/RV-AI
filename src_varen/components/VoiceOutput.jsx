import "./VoiceOutput.css";

import SpecularButton from "./SpecularButton";

function VoiceOutput({ isPlaying, onPlay }) {
  return (
    <SpecularButton
      className={`voice-output-btn ${isPlaying ? "playing" : ""}`}
      onClick={onPlay}
      type="button"
      title={isPlaying ? "Playing" : "Play response"}
    >
      {isPlaying ? "🔊" : "🔈"}
    </SpecularButton>
  );
}

export default VoiceOutput;