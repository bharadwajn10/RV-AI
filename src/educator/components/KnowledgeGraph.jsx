import { useState, useEffect } from 'react';
import { getKnowledgeGraph, loginEducator } from '../../api';

function KnowledgeGraph() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGraph() {
      try {
        if (!localStorage.getItem('educator_token')) await loginEducator();
        const data = await getKnowledgeGraph();
        setNodes(data.nodes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchGraph();
  }, []);

  return (
    <section className="dashboard-card">
      <h2>Concept Knowledge</h2>

      {loading ? <p>Loading graph...</p> : (
        <div className="concepts" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {nodes.map((node) => (
            <div 
              className="concept" 
              key={node.id} 
              style={{ 
                padding: '0.5rem', 
                border: '1px solid var(--border-color)', 
                borderRadius: '4px',
                borderColor: node.state === 'gap' ? 'red' : 'var(--border-color)' 
              }}
            >
              {node.name} ({node.class_mastery}%)
              {node.predicted_gap && <span style={{ color: 'red', marginLeft: '4px' }}>⚠️ Gap</span>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default KnowledgeGraph;