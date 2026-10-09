function EducatorTopbar({ title }) {
  return (
    <header className="topbar">
      <div className="topbar-context">
        <span>Faculty workspace</span>
        {title && (
          <>
            <span style={{ color: '#a0a7b4', margin: '0 8px' }}>/</span>
            <span style={{ color: '#222a3b', fontWeight: 650 }}>{title}</span>
          </>
        )}
      </div>
      <div className="topbar-account">
        <span className="topbar-greeting">Welcome back, Professor</span>
        <span aria-hidden="true" className="topbar-avatar">
          E
        </span>
      </div>
    </header>
  );
}

export default EducatorTopbar;