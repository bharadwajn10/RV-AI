import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import VoiceAssistantBubble from './components/VoiceAssistantBubble.jsx'
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
      <VoiceAssistantBubble />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <CourseProvider>
        <TaskProvider>
          <DashboardLayout />
        </TaskProvider>
      </CourseProvider>
    </BrowserRouter>
  )
}

export default App
