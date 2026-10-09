import { useState, useEffect } from 'react';
import { getInterventionImpact, loginEducator } from '../../api';

function InterventionImpact() {
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImpact() {
      try {
        if (!localStorage.getItem('educator_token')) await loginEducator();
        const data = await getInterventionImpact();
        setImpact(data || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchImpact();
  }, []);

  if (loading) return <section className="dashboard-card"><p>Loading...</p></section>;
  if (!impact || !impact.interventions?.length) return <section className="dashboard-card"><p>No interventions to measure.</p></section>;

  const i = impact.interventions[0];

  return (
    <section className="dashboard-card">
      <h2>Intervention Impact</h2>

      <div className="impact-grid" style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
        <div>
          <p>Before Intervention</p>
          <h2>{i.baseline.mastery}%</h2>
        </div>

        <div>
          <p>After Intervention</p>
          <h2>{i.followup.mastery}%</h2>
        </div>

        <div>
          <p>Improvement</p>
          <h2 style={{ color: 'green' }}>+{i.delta}%</h2>
        </div>
      </div>
    </section>
  );
}

export default InterventionImpact;