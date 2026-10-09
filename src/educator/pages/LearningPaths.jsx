import { useState } from "react";
import { learningPaths } from "../data/learningPaths";
import SpecularButton from "../components/SpecularButton";
import "./LearningPaths.css";

function LearningPaths() {
  const [paths, setPaths] = useState(learningPaths);

  const updatePathStatus = async (pathId, status) => {
    setPaths((currentPaths) =>
      currentPaths.map((path) =>
        path.id === pathId ? { ...path, status } : path,
      ),
    );
    
    if (status === "Accepted") {
      try {
        const { publishPlan, loginEducator } = await import("../../api.js");
        if (!localStorage.getItem('educator_token')) {
          await loginEducator();
        }
        
        const path = paths.find(p => p.id === pathId);
        if (path) {
          const items = path.modules.map(module => ({
            topic: module,
            materials: []
          }));
          await publishPlan(items);
          alert("Plan published successfully via API!");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to publish plan: " + err.message);
      }
    }
  };

  return (
    <section className="page learning-paths-page">
      <header className="page-header learning-paths-header">
        <div>
          <p className="learning-paths-eyebrow">PERSONALIZED CURRICULUM</p>
          <h2>Learning Paths</h2>
          <p>
            Structured course plans with goals, pacing, prerequisites, and
            outcomes. These are sample AI-suggested paths for now.
          </p>
          <SpecularButton 
            type="button" 
            className="primary-btn" 
            style={{ marginTop: '1rem' }}
            onClick={async () => {
              try {
                const { suggestPath, loginEducator } = await import("../../api.js");
                if (!localStorage.getItem('educator_token')) await loginEducator();
                const res = await suggestPath();
                alert("Started suggestion job: " + res.job_id);
              } catch (err) {
                alert("Error: " + err.message);
              }
            }}
          >
            Suggest Plan from Materials
          </SpecularButton>
        </div>
        <span className="learning-paths-count">
          {paths.length} sample paths
        </span>
      </header>

      <div className="learning-path-change-box" style={{ padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Describe a requirement change</h3>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <input 
            type="text" 
            id="change-input"
            placeholder="e.g. Exam moved to Friday, add new topic on Graphs..." 
            style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)' }}
          />
          <button 
            type="button" 
            style={{ padding: '0.5rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}
            onClick={async () => {
              const input = document.getElementById('change-input');
              const text = input.value.trim();
              if (!text) return;
              try {
                const { changePath, loginEducator } = await import("../../api.js");
                if (!localStorage.getItem('educator_token')) await loginEducator();
                const res = await changePath(text);
                alert("Proposed Change: " + JSON.stringify(res.proposed_change));
                input.value = "";
              } catch (err) {
                alert("Error: " + err.message);
              }
            }}
          >
            <span aria-hidden="true">🎤</span> Voice / Submit
          </button>
        </div>
      </div>

      <div className="learning-path-list">
        {paths.map((path) => (
          <article className="learning-path-card" key={path.id}>
            <div className="learning-path-card__top">
              <div className="learning-path-card__title">
                <span className="learning-path-subject">{path.subject}</span>
                <h3>{path.title}</h3>
                <p className="learning-path-audience">
                  Designed for {path.audience.toLowerCase()}
                </p>
              </div>

              <div className="learning-path-card__status">
                <span
                  className={`learning-path-status learning-path-status--${path.status
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}
                >
                  {path.status}
                </span>
                <span className="learning-path-version">{path.version}</span>
              </div>
            </div>

            <p className="learning-path-goal">{path.goal}</p>

            <div className="learning-path-facts">
              <div>
                <span className="learning-path-fact-label">Duration</span>
                <strong>{path.duration}</strong>
              </div>
              <div>
                <span className="learning-path-fact-label">Recommended pace</span>
                <strong>{path.pace}</strong>
              </div>
              <div>
                <span className="learning-path-fact-label">Difficulty</span>
                <strong>
                  {path.difficulty.start} <span aria-hidden="true">→</span>{" "}
                  {path.difficulty.end}
                </strong>
              </div>
            </div>

            <div className="learning-path-details">
              <section className="learning-path-detail">
                <h4>Learning outcomes</h4>
                <ul>
                  {path.outcomes.map((outcome) => (
                    <li key={outcome}>{outcome}</li>
                  ))}
                </ul>
              </section>

              <section className="learning-path-detail learning-path-detail--weightage">
                <h4>Assessment weightage</h4>
                <strong className="learning-path-weightage__total">
                  {path.weightage.totalMarks} marks total
                </strong>
                <ul className="learning-path-weightage">
                  {path.weightage.components.map((component) => (
                    <li key={component.name}>
                      <span>{component.name}</span>
                      <strong>{component.marks} marks</strong>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="learning-path-detail">
                <h4>Entry requirements</h4>
                <ul>
                  {path.prerequisites.map((prerequisite) => (
                    <li key={prerequisite}>{prerequisite}</li>
                  ))}
                </ul>
                <div className="learning-path-diagnostic">
                  <span className="learning-path-diagnostic__label">
                    Optional diagnostic
                  </span>
                  {path.diagnosticTest ? (
                    <>
                      <strong>{path.diagnosticTest.title}</strong>
                      <span>{path.diagnosticTest.details}</span>
                    </>
                  ) : (
                    <span>No placement diagnostic included in this draft.</span>
                  )}
                </div>
              </section>
            </div>

            <div className="learning-path-modules">
              <h4>Path outline</h4>
              <ol>
                {path.modules.map((module) => (
                  <li key={module}>{module}</li>
                ))}
              </ol>
            </div>

            <footer className="learning-path-card__footer">
              <span>Sample content · ready to connect to a path-generation API</span>
              <span>{path.modules.length} modules</span>
            </footer>

            <div className="learning-path-review">
              <span>Review this path</span>
              <div className="learning-path-review__actions">
                <SpecularButton
                  type="button"
                  className="learning-path-review__button learning-path-review__button--accept"
                  aria-pressed={path.status === "Accepted"}
                  onClick={() => updatePathStatus(path.id, "Accepted")}
                >
                  Accept
                </SpecularButton>
                <SpecularButton
                  type="button"
                  className="learning-path-review__button learning-path-review__button--in-review"
                  aria-pressed={path.status === "Under review"}
                  onClick={() => updatePathStatus(path.id, "Under review")}
                >
                  In review
                </SpecularButton>
                <SpecularButton
                  type="button"
                  className="learning-path-review__button learning-path-review__button--reject"
                  aria-pressed={path.status === "Rejected"}
                  onClick={() => updatePathStatus(path.id, "Rejected")}
                >
                  Reject
                </SpecularButton>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default LearningPaths;
