import SpecularButton from "./SpecularButton";
import { learningPaths } from "../data/learningPaths";

function NextBestActions({ setActivePage }) {
  const statusPriority = {
    "AI-suggested": 0,
    Draft: 1,
    "Under review": 2,
    Published: 3,
  };
  const actions = [...learningPaths]
    .sort(
      (first, second) =>
        (statusPriority[first.status] ?? 4) -
        (statusPriority[second.status] ?? 4),
    )
    .slice(0, 3);

  return (
    <section className="dashboard-card next-best-actions">
      <div className="section-header">
        <h2>Next Best Actions</h2>
        <span>From learning paths</span>
      </div>

      {actions.map((path) => (
        <div className="action-item" key={path.id}>
          <div className="action-copy">
            <div className="topic-row">
              <h3>{path.title}</h3>
              <span
                className={`learning-path-action-status learning-path-action-status--${path.status
                  .toLowerCase()
                  .replaceAll(" ", "-")}`}
              >
                {path.status}
              </span>
            </div>
            <p>{path.goal}</p>
          </div>

          <SpecularButton
            className="review-btn"
            onClick={() => setActivePage("Learning Paths")}
          >
            Review
          </SpecularButton>
        </div>
      ))}
    </section>
  );
}

export default NextBestActions;