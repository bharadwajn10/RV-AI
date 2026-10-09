function StatsCards() {
  const summaryStats = [
    { title: "Total Students", value: "124" },
    { title: "Pass Percentage", value: "78%" },
    { title: "Students At Risk", value: "18" },
  ];

  return (
    <div className="stats-grid">
      <div className="stat-card summary-card">
        <div className="summary-header">
          <p>Performance Overview</p>
          <span>Live</span>
        </div>

        <div className="summary-metrics">
          {summaryStats.map((stat) => (
            <div className="summary-metric" key={stat.title}>
              <p>{stat.title}</p>
              <h2>{stat.value}</h2>
            </div>
          ))}
        </div>
      </div>

      <div className="stat-card action-card">
        <p>Pending Actions</p>
        <h2>6</h2>
      </div>
    </div>
  );
}

export default StatsCards;