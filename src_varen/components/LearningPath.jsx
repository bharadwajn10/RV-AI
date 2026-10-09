function LearningPath() {
  const topics = [
    { name: "Cell Basics", progress: 92 },
    { name: "Cell Structure", progress: 74 },
    { name: "Photosynthesis", progress: 61 },
    { name: "Cellular Respiration", progress: 48 },
  ];

  return (
    <section className="dashboard-card">
      <h2>Learning Path</h2>

      {topics.map((topic) => (
        <div className="path-item" key={topic.name}>
          <div className="path-header">
            <span>{topic.name}</span>
            <span>{topic.progress}%</span>
          </div>

          <div className="progress-bar">
            <div style={{ width: `${topic.progress}%` }} />
          </div>
        </div>
      ))}
    </section>
  );
}

export default LearningPath;