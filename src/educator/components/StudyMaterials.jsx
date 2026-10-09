import { useRef, useState } from "react";
import "./StudyMaterials.css";
import SpecularButton from "./SpecularButton";

const initialMaterials = [
  {
    id: 1,
    name: "Photosynthesis Notes.pdf",
    subject: "Biology",
    date: "Uploaded today",
  },
  {
    id: 2,
    name: "Cell Structure.pptx",
    subject: "Biology",
    date: "Uploaded yesterday",
  },
  {
    id: 3,
    name: "Cellular Respiration.pdf",
    subject: "Biology",
    date: "Uploaded 2 days ago",
  },
];

function StudyMaterials() {
  const [materials, setMaterials] = useState(initialMaterials);
  const fileInputRef = useRef(null);

  const handleFilesSelected = async (event) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;

    try {
      const { uploadMaterial, loginEducator } = await import("../../api.js");
      if (!localStorage.getItem('educator_token')) {
        await loginEducator();
      }

      for (const file of selectedFiles) {
        // Read file as text for demo purposes
        const text = await file.text();
        await uploadMaterial(file.name, text);
        
        setMaterials((currentMaterials) => [
          {
            id: `${file.name}-${file.lastModified}`,
            name: file.name,
            subject: "Uncategorized",
            date: "Added just now",
          },
          ...currentMaterials,
        ]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload material: " + err.message);
    }
    event.target.value = "";
  };

  return (
    <section className="page upload-materials-page">
      <header className="page-header">
        <div>
          <h2>Upload Material</h2>
          <p>Add and organize resources to use in your teaching workflow.</p>
        </div>
        <span className="upload-materials-count">
          {materials.length} materials
        </span>
      </header>

      <div className="upload-dropzone">
        <input
          ref={fileInputRef}
          className="upload-file-input"
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
          multiple
          onChange={handleFilesSelected}
          aria-label="Choose study materials to upload"
        />
        <div className="upload-dropzone__icon" aria-hidden="true">
          ↑
        </div>
        <h3>Bring your learning resources together</h3>
        <p>Choose PDF, PowerPoint, Word, or text files from your device.</p>
        <SpecularButton
          className="primary-btn"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose files
        </SpecularButton>
        <span className="upload-demo-note">
          Demo mode: selected files appear here for this session only.
        </span>
      </div>

      <div className="upload-materials-heading">
        <div>
          <h3>Your materials</h3>
          <p>Resources available to use when preparing lessons.</p>
        </div>
      </div>

      {materials.length > 0 ? (
        <div className="materials-grid">
          {materials.map((material) => (
            <article className="material-card" key={material.id}>
              <div className="material-icon" aria-hidden="true">
                📄
              </div>
              <div>
                <h3>{material.name}</h3>
                <p>{material.subject}</p>
                <span>{material.date}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="upload-empty-state">
          <p>No materials yet. Choose a file to add your first resource.</p>
        </div>
      )}

      {/* Conflicts Panel */}
      <div className="upload-materials-heading" style={{ marginTop: '2rem' }}>
        <div>
          <h3>Conflicts</h3>
          <p>Review contradictions found across uploaded materials.</p>
        </div>
        <SpecularButton 
          type="button" 
          onClick={async () => {
            try {
              const { getConflicts, loginEducator } = await import("../../api.js");
              if (!localStorage.getItem('educator_token')) await loginEducator();
              const res = await getConflicts();
              console.log("Conflicts:", res);
              alert(`Found ${res.conflicts?.length || 0} conflicts. (Check console for details)`);
            } catch (err) {
              alert("Error fetching conflicts: " + err.message);
            }
          }}
        >
          Load Conflicts
        </SpecularButton>
      </div>
    </section>
  );
}

export default StudyMaterials;
