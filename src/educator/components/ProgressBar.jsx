function ProgressBar({ value = 0, label, max = 100 }) {
  const safeMax = Math.max(max, 1)
  const percentage = Math.min(Math.max((value / safeMax) * 100, 0), 100)

  return (
    <div className="progress-component">
      {label && (
        <div className="progress-label-row">
          <span>{label}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        aria-label={label || 'Progress'}
        aria-valuemax={safeMax}
        aria-valuemin="0"
        aria-valuenow={Math.min(Math.max(value, 0), safeMax)}
        className="progress-track"
        role="progressbar"
      >
        <span className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

export default ProgressBar
