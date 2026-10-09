import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import VoiceAssistantWidget from './components/VoiceAssistantWidget.jsx'
import EducatorApp from './EducatorApp.jsx'
import { CourseProvider } from './context/CourseProvider.jsx'
import { TaskProvider } from './context/TaskContext.jsx'
import Calendar from './pages/Calendar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ExamPrep from './pages/ExamPrep.jsx'
import Flashcards from './pages/Flashcards.jsx'
import Games from './pages/Games.jsx'
import Learn from './pages/Learn.jsx'
import Progress from './pages/Progress.jsx'
import Settings from './pages/Settings.jsx'
import SubjectDetails from './pages/SubjectDetails.jsx'
import Subjects from './pages/Subjects.jsx'
import TaskDetails from './pages/TaskDetails.jsx'
import VoiceAssistant from './pages/VoiceAssistant.jsx'

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  function closeSidebar() {
    setIsSidebarOpen(false)
  }

  return (
    <div className="app-shell">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      {isSidebarOpen && (
        <button
          aria-label="Close navigation menu"
          className="sidebar-backdrop"
          onClick={closeSidebar}
          type="button"
        />
      )}
      <div className="workspace">
        <Topbar onMenuClick={() => setIsSidebarOpen((isOpen) => !isOpen)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate replace to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/subjects/:subjectId" element={<SubjectDetails />} />
            <Route path="/learn/:subjectId/:topicId" element={<Learn />} />
            <Route path="/tasks/:taskId" element={<TaskDetails />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/voice" element={<VoiceAssistant />} />
            <Route path="/voice-assistant" element={<VoiceAssistant />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/games" element={<Games />} />
            <Route path="/exam" element={<ExamPrep />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate replace to="/dashboard" />} />
          </Routes>
        </main>
      </div>
      <VoiceAssistantWidget role="student" />
    </div>
  )
}

function App() {
  const [role, setRole] = useState('student') // 'student' or 'educator'

  return (
    <BrowserRouter>
      {/* Universal Floating Role Switcher */}
      <aside
        aria-label="Role Switcher"
        style={{
          position: 'fixed',
          top: '16px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 8px',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(12px)',
          borderRadius: '9999px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        <span
          style={{
            color: '#94a3b8',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            paddingLeft: '8px',
            paddingRight: '4px',
          }}
        >
          View Role
        </span>

        <button
          id="role-switch-student"
          onClick={() => setRole('student')}
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            border: 'none',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            background: role === 'student' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
            color: role === 'student' ? '#ffffff' : '#94a3b8',
            boxShadow: role === 'student' ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none',
          }}
        >
          <span>🎓</span> Student (Krishi)
        </button>

        <button
          id="role-switch-educator"
          onClick={() => setRole('educator')}
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            border: 'none',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            background: role === 'educator' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
            color: role === 'educator' ? '#ffffff' : '#94a3b8',
            boxShadow: role === 'educator' ? '0 2px 8px rgba(99, 102, 241, 0.35)' : 'none',
          }}
        >
          <span>👩‍🏫</span> Educator (Varen)
        </button>
      </aside>

      {role === 'student' ? (
        <CourseProvider key="student-courses">
          <TaskProvider key="student-tasks">
            <DashboardLayout key="student-layout" />
          </TaskProvider>
        </CourseProvider>
      ) : (
        <EducatorApp key="educator-app" />
      )}
    </BrowserRouter>
  )
}

export default App

