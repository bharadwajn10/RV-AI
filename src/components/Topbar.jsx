import "./Topbar.css";

function Topbar({ title }) {
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>Educator Dashboard</p>
      </div>

      <div className="profile">
        👩‍🏫 Educator
      </div>
    </header>
  );
}

export default Topbar;