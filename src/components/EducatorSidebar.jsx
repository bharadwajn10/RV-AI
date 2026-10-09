const menuItems = [
  { label: 'Dashboard', icon: 'dashboard' },
  { label: 'Learning Paths', icon: 'subjects' },
  { label: 'Students', icon: 'students' },
  { label: 'Analytics', icon: 'analytics' },
  { label: 'Upload Material', icon: 'materials' },
  { label: 'Create Assignment', icon: 'assignments' },
  { label: 'Agnes', icon: 'voice' },
]

function NavigationIcon({ name }) {
  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    subjects: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" />
        <path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20" />
        <path d="M8 7h8M8 10h6" />
      </>
    ),
    students: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    analytics: (
      <>
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </>
    ),
    materials: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </>
    ),
    assignments: (
      <>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M9 14l2 2 4-4" />
      </>
    ),
    voice: (
      <>
        <rect x="9" y="3" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      className="nav-icon"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {paths[name] || paths.dashboard}
    </svg>
  )
}

function EducatorSidebar({ activePage, setActivePage }) {
  return (
    <aside aria-label="Educator navigation" className="sidebar">
      <div className="brand" style={{ cursor: 'pointer' }} onClick={() => setActivePage('Dashboard')}>
        <span aria-hidden="true" className="brand-mark" style={{ background: 'linear-gradient(145deg, #4d60c9, #3746a8)' }}>
          E
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>studyspace</span>
          <span
            style={{
              fontSize: '10px',
              background: '#eef0ff',
              color: '#4b5fc9',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            FACULTY
          </span>
        </div>
      </div>

      <div className="sidebar-section-label">Faculty Workspace</div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={`nav-link${activePage === item.label ? ' is-active' : ''}`}
            onClick={() => setActivePage(item.label)}
            type="button"
            style={{
              width: '100%',
              border: 'none',
              background: activePage === item.label ? 'var(--color-primary-soft)' : 'none',
              textAlign: 'left',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            <NavigationIcon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div aria-hidden="true" className="profile-avatar">E</div>
        <div className="profile-copy">
          <strong>Educator account</strong>
          <span>Faculty workspace</span>
        </div>
      </div>
    </aside>
  )
}

export default EducatorSidebar