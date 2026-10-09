import { useState } from "react";
import "./Assignments.css";
import SpecularButton from "./SpecularButton";

const initialAssignments = [
  {
    id: 1,
    title: "Photosynthesis",
    subject: "Biology",
    difficulty: "Medium",
    students: 24,
  },
  {
    id: 2,
    title: "Cell Structure",
    subject: "Biology",
    difficulty: "Easy",
    students: 31,
  },
  {
    id: 3,
    title: "Cellular Respiration",
    subject: "Biology",
    difficulty: "Hard",
    students: 18,
  },
];

function Assignments() {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [studentCount, setStudentCount] = useState("24");
  const [confirmation, setConfirmation] = useState("");

  const handleCreateAssignment = async (event) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedSubject = subject.trim();
    const parsedStudentCount = Number(studentCount);

    if (!trimmedTitle || !trimmedSubject || parsedStudentCount < 1) return;

    setConfirmation("Creating assignment draft via API...");

    try {
      const { requestDraft, loginEducator } = await import("../../api.js");
      if (!localStorage.getItem('educator_token')) {
        await loginEducator();
      }
      
      await requestDraft("quiz", { title: trimmedTitle, subject: trimmedSubject, difficulty });
      
      setAssignments((current) => [
        {
          id: `${Date.now()}-${trimmedTitle}`,
          title: trimmedTitle,
          subject: trimmedSubject,
          difficulty,
          students: parsedStudentCount,
        },
        ...current,
      ]);
      setTitle("");
      setSubject("");
      setDifficulty("Medium");
      setStudentCount("24");
      setConfirmation("Assignment added to backend drafts!");
    } catch (err) {
      console.error(err);
      setConfirmation("Failed to create assignment: " + err.message);
    }
  };

  return (
    <section className="page create-assignment-page">
      <header className="page-header">
        <div>
          <h2>Create Assignment</h2>
          <p>Set up a learning activity and choose its subject and level.</p>
        </div>
      </header>

      <form className="assignment-form" onSubmit={handleCreateAssignment}>
        <div className="assignment-form__heading">
          <span className="assignment-form__eyebrow">NEW ACTIVITY</span>
          <h3>Assignment details</h3>
          <p>Start with a clear topic and the class it is intended for.</p>
        </div>

        <div className="assignment-form__fields">
          <label>
            Assignment title
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Plant cell structure"
              required
            />
          </label>

          <label>
            Subject
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Biology"
              required
            />
          </label>

          <label>
            Difficulty
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </label>

          <label>
            Students
            <input
              type="number"
              min="1"
              value={studentCount}
              onChange={(event) => setStudentCount(event.target.value)}
              required
            />
          </label>
        </div>

        <div className="assignment-form__footer">
          <span role="status">
            {confirmation || "Demo mode: assignment is saved in this session only."}
          </span>
          <SpecularButton className="primary-btn" type="submit">
            Create assignment
          </SpecularButton>
        </div>
      </form>

      <div className="assignment-list-heading">
        <div>
          <h3>Assignments</h3>
          <p>Existing and newly created class activities.</p>
        </div>
        <span>{assignments.length} total</span>
      </div>

      <div className="assignment-grid">
        {assignments.map((assignment) => (
          <article className="assignment-card" key={assignment.id}>
            <span className="assignment-card__subject">{assignment.subject}</span>
            <h3>{assignment.title}</h3>
            <div className="assignment-card__meta">
              <span>{assignment.difficulty}</span>
              <span>{assignment.students} students</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Assignments;
