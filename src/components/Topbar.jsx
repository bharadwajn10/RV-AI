import { useState, useEffect } from 'react';
import { API_BASE, getAuthHeaders } from '../api';

function Topbar({ onMenuClick }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const res = await fetch(`${API_BASE}/learner/notifications`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.data?.notifications || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchNotifs();
  }, []);

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
      <div className="topbar-account" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative' }}
          onClick={() => alert(notifications.length ? notifications.map(n => n.body).join('\n') : 'No notifications')}
        >
          <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>🔔</span>
          {notifications.length > 0 && (
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', padding: '0 4px', fontSize: '0.75rem' }}>
              {notifications.length}
            </span>
          )}
        </button>
        <span className="topbar-greeting">Welcome back</span>
        <span aria-hidden="true" className="topbar-avatar">S</span>
      </div>
    </header>
  )
}

export default Topbar
