import { useState } from "react";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Dashboard from "./pages/Dashboard";
import Students from "./components/Students";
import Analytics from "./components/Analytics";
import StudyMaterials from "./components/StudyMaterials";
import Assignments from "./components/Assignments";
import AIAssistant from "./components/AIAssistant";
import LearningPaths from "./pages/LearningPaths";
import AgnesCompanion from "./components/AgnesCompanion";

import "./App.css";
import "./theme.css";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard setActivePage={setActivePage} />;

      case "Students":
        return <Students />;

      case "Analytics":
        return <Analytics />;

      case "Upload Material":
        return <StudyMaterials />;

      case "Create Assignment":
        return <Assignments />;

      case "AI Assistant":
        return <AIAssistant />;

      case "Learning Paths":
        return <LearningPaths />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="main-content">
        <Topbar
          title={activePage}
          setActivePage={setActivePage}
        />

        {renderPage()}
      </main>
      <AgnesCompanion />
    </div>
  );
}

export default App;