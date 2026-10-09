import { useState } from "react";

import EducatorSidebar from "./components/EducatorSidebar";
import EducatorTopbar from "./components/EducatorTopbar";

import EducatorDashboard from "./pages/EducatorDashboard";
import Students from "./components/Students";
import Analytics from "./components/Analytics";
import StudyMaterials from "./components/StudyMaterials";
import Assignments from "./components/Assignments";
import AIAssistant from "./components/AIAssistant";
import LearningPaths from "./pages/LearningPaths";
import VoiceAssistantWidget from "./components/VoiceAssistantWidget.jsx";

import "./EducatorApp.css";

function EducatorApp() {
  const [activePage, setActivePage] = useState("Dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <EducatorDashboard setActivePage={setActivePage} />;

      case "Students":
        return <Students />;

      case "Analytics":
        return <Analytics />;

      case "Upload Material":
        return <StudyMaterials />;

      case "Create Assignment":
        return <Assignments />;

      case "Agnes":
      case "AI Assistant":
        return <AIAssistant />;

      case "Learning Paths":
        return <LearningPaths />;

      default:
        return <EducatorDashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="app-shell educator-shell">
      <EducatorSidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <div className="workspace">
        <EducatorTopbar
          title={activePage}
          setActivePage={setActivePage}
        />

        <main className="main-content">
          {renderPage()}
        </main>
      </div>
      <VoiceAssistantWidget role="educator" />
    </div>
  );
}

export default EducatorApp;