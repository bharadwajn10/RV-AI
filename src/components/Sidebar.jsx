import "./Sidebar.css";
import SpecularButton from "./SpecularButton";

function Sidebar({ activePage, setActivePage }) {

  const menuItems = [
  "Dashboard",
  "Learning Paths",
  "Students",
  "Analytics",
  "Upload Material",
  "Create Assignment",
  "AI Assistant",
];

  return (
    <aside className="sidebar">
      <div className="logo">
        <h2>EduAI</h2>
      </div>

      <nav>
        {menuItems.map((item) => (
          <SpecularButton
            key={item}
            className={activePage === item ? "active" : ""}
            onClick={() => setActivePage(item)}
          >
            {item}
          </SpecularButton>
        ))}
      </nav>
    </aside>
  );
}


export default Sidebar;