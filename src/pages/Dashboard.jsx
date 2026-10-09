import "../components/Dashboard.css";
import StatsCards from "../components/StatsCards";
import NextBestActions from "../components/NextBestActions";
import LearningPath from "../components/LearningPath";
import InterventionImpact from "../components/InterventionImpact";
import KnowledgeGraph from "../components/KnowledgeGraph";

function Dashboard({ setActivePage }) {
  return (
    <>
      <StatsCards />

      <div className="dashboard-grid">
        <NextBestActions setActivePage={setActivePage} />
        <LearningPath />
        <InterventionImpact />
        <KnowledgeGraph />
      </div>
    </>
  );
}

export default Dashboard;