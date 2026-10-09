function VoiceButton({ children = 'Start listening', onClick }) {
  return (
    <button className="voice-button" onClick={onClick} type="button">
      <span aria-hidden="true" className="voice-button-indicator" />
      {children}
    </button>
  )
}

export default VoiceButton
