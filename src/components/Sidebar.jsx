import { NavLink } from 'react-router-dom'

const navigationItems = [
  { label: 'Dashboard', to: '/dashboard', icon: 'dashboard' },
  { label: 'Subjects', to: '/subjects', icon: 'subjects' },
  { label: 'Calendar', to: '/calendar', icon: 'calendar' },
  { label: 'Agnes', to: '/voice', icon: 'voice' },
  { label: 'Flashcards', to: '/flashcards', icon: 'flashcards' },
  { label: 'Games', to: '/games', icon: 'games' },
  { label: 'Exam Prep', to: '/exam', icon: 'progress' },
  { label: 'Progress', to: '/progress', icon: 'progress' },
  { label: 'Settings', to: '/settings', icon: 'settings' },
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
    calendar: (
      <>
        <rect x="3.5" y="5" width="17" height="16" rx="2" />
        <path d="M7.5 3v4M16.5 3v4M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
      </>
    ),
    voice: (
      <>
        <rect x="9" y="3" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8" />
      </>
    ),
    flashcards: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h3" />
        <path d="M3 7v13a2 2 0 0 0 2 2h12" />
      </>
    ),
    games: (
      <>
        <path d="M6 8h12a4 4 0 0 1 3.8 5.2l-1.1 3.7a2.5 2.5 0 0 1-4.1 1.1L14 16h-4l-2.6 2a2.5 2.5 0 0 1-4.1-1.1l-1.1-3.7A4 4 0 0 1 6 8z" />
        <path d="M7 11v4m-2-2h4m7-.5h.01M18 14.5h.01" />
      </>
    ),
    progress: (
      <>
        <path d="M4 19V5m0 14h17" />
        <path d="m7 15 4-4 3 2 6-7" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 0 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3z" />
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
      {paths[name]}
    </svg>
  )
}

function Sidebar({ isOpen, onClose }) {
  return (
    <aside
      aria-label="Main navigation"
      className={`sidebar${isOpen ? ' is-open' : ''}`}
    >
      <NavLink aria-label="Studyspace home" className="brand" to="/dashboard">
        <span aria-hidden="true" className="brand-mark">S</span>
        <span>studyspace</span>
      </NavLink>

      <div className="sidebar-section-label">Workspace</div>
      <nav className="sidebar-nav" onClick={onClose}>
        {navigationItems.map((item) => (
          <NavLink
            className={({ isActive }) =>
              `nav-link${isActive ? ' is-active' : ''}`
            }
            key={item.to}
            to={item.to}
          >
            <NavigationIcon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div aria-hidden="true" className="profile-avatar">S</div>
        <div className="profile-copy">
          <strong>Student account</strong>
          <span>Learning workspace</span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
