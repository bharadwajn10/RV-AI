function KnowledgeGraph() {
  const concepts = [
    "Cell",
    "Nucleus",
    "Mitochondria",
    "Photosynthesis",
    "Respiration",
  ];

  return (
    <section className="dashboard-card">
      <h2>Concept Knowledge</h2>

      <div className="concepts">
        {concepts.map((concept) => (
          <div className="concept" key={concept}>
            {concept}
          </div>
        ))}
      </div>
    </section>
  );
}

export default KnowledgeGraph;