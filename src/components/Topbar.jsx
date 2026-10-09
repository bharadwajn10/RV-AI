function Topbar({ onMenuClick }) {
  return (
    <header className="topbar">
      <button
        aria-label="Open navigation menu"
        className="menu-button"
        onClick={onMenuClick}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>
      <div className="topbar-context">Your learning space</div>
      <div className="topbar-account">
        <span className="topbar-greeting">Welcome back</span>
        <span aria-hidden="true" className="topbar-avatar">S</span>
      </div>
    </header>
  )
}

export default Topbar
