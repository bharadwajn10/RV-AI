import { useState, useEffect } from "react";
import SpecularButton from "./SpecularButton";
import { getNextActions, loginEducator } from "../../api";

function NextBestActions({ setActivePage }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActions() {
      try {
        if (!localStorage.getItem('educator_token')) await loginEducator();
        const data = await getNextActions();
        setActions(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchActions();
  }, []);

  return (
    <section className="dashboard-card next-best-actions">
      <div className="section-header">
        <h2>Next Best Actions</h2>
        <span>Prioritized tasks</span>
      </div>

      {loading ? <p>Loading actions...</p> : actions.map((action) => (
        <div className="action-item" key={action.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <div className="action-copy">
            <div className="topic-row">
              <h3>{action.title}</h3>
              <span className={`learning-path-action-status`}>
                Priority {action.priority}
              </span>
            </div>
            <p>{action.detail}</p>
          </div>

          <SpecularButton
            className="review-btn"
            onClick={() => alert(`Action: ${action.cta.route}`)}
          >
            {action.cta.label}
          </SpecularButton>
        </div>
      ))}
    </section>
  );
}

export default NextBestActions;