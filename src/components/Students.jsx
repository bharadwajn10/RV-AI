import { useState } from "react";
import { students } from "../data/students";
import "./Students.css";

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getStatusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function Students() {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id);
  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId,
  );

  return (
    <section className="page students-page">
      <header className="page-header students-page__header">
        <div>
          <h2>Students</h2>
          <p>Select a student to explore their learning and performance.</p>
        </div>
        <span className="students-page__count">{students.length} students</span>
      </header>

      <div className="students-layout">
        <nav className="students-roster" aria-label="Student roster">
          <div className="students-roster__heading">
            <h3>Class roster</h3>
            <span>{students.length}</span>
          </div>
          <div className="students-roster__list">
            {students.map((student) => (
              <button
                key={student.id}
                className={`student-select${student.id === selectedStudentId ? " is-selected" : ""}`}
                type="button"
                aria-pressed={student.id === selectedStudentId}
                onClick={() => setSelectedStudentId(student.id)}
              >
                <span className="student-avatar" aria-hidden="true">
                  {getInitials(student.name)}
                </span>
                <span className="student-select__copy">
                  <strong>{student.name}</strong>
                  <span>{student.className}</span>
                </span>
                <span
                  className={`student-status student-status--${getStatusClass(student.status)}`}
                >
                  {student.status}
                </span>
              </button>
            ))}
          </div>
          <p className="students-roster__note">
            Sample student records · replaceable with backend data
          </p>
        </nav>

        {selectedStudent ? (
          <article className="student-profile">
            <header className="student-profile__header">
              <div className="student-profile__identity">
                <span className="student-avatar student-avatar--large" aria-hidden="true">
                  {getInitials(selectedStudent.name)}
                </span>
                <div>
                  <span className="student-profile__eyebrow">
                    {selectedStudent.grade} · {selectedStudent.className}
                  </span>
                  <h3>{selectedStudent.name}</h3>
                  <span
                    className={`student-status student-status--${getStatusClass(selectedStudent.status)}`}
                  >
                    {selectedStudent.status}
                  </span>
                </div>
              </div>
              <div className="student-profile__trend">
                <span>Recent trend</span>
                <strong className={selectedStudent.trend.startsWith("+") ? "is-positive" : "is-negative"}>
                  {selectedStudent.trend}
                </strong>
              </div>
            </header>

            <div className="student-performance">
              <div className="student-performance__primary">
                <span>Overall performance</span>
                <strong>{selectedStudent.score}%</strong>
                <div
                  className="student-performance__track"
                  role="progressbar"
                  aria-label="Overall performance"
                  aria-valuenow={selectedStudent.score}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <span style={{ width: `${selectedStudent.score}%` }} />
                </div>
              </div>
              <div className="student-performance__stat">
                <span>Attendance</span>
                <strong>{selectedStudent.attendance}%</strong>
              </div>
              <div className="student-performance__stat">
                <span>Lessons completed</span>
                <strong>
                  {selectedStudent.completedLessons}
                  <small> / {selectedStudent.totalLessons}</small>
                </strong>
              </div>
            </div>

            <div className="student-profile__columns">
              <section className="student-profile__section">
                <h4>Strengths</h4>
                <ul className="student-chip-list">
                  {selectedStudent.strengths.map((strength) => (
                    <li className="student-chip student-chip--strength" key={strength}>
                      {strength}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="student-profile__section">
                <h4>Focus areas</h4>
                <ul className="student-chip-list">
                  {selectedStudent.focusAreas.map((area) => (
                    <li className="student-chip student-chip--focus" key={area}>
                      {area}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="student-profile__section student-assessments">
              <div className="student-profile__section-heading">
                <div>
                  <h4>Recent assessments</h4>
                  <p>Latest results for this student</p>
                </div>
              </div>
              <div className="student-assessments__list">
                {selectedStudent.recentAssessments.map((assessment) => (
                  <div className="student-assessment" key={assessment.name}>
                    <span className="student-assessment__score">{assessment.score}%</span>
                    <strong>{assessment.name}</strong>
                    <span>{assessment.date}</span>
                  </div>
                ))}
              </div>
            </section>

            <aside className="student-teacher-note">
              <span>Teacher note</span>
              <p>{selectedStudent.teacherNote}</p>
            </aside>
          </article>
        ) : (
          <div className="student-profile student-profile--empty">
            <p>Select a student to see their performance profile.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default Students;
