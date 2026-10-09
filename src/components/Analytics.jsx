import { analyticsReport } from "../data/analyticsReport";
import "./Analytics.css";

const chart = {
  width: 760,
  height: 280,
  left: 42,
  right: 18,
  top: 18,
  bottom: 42,
  minScore: 40,
  maxScore: 100,
};

const lineColors = ["#177e72", "#d98b68", "#6b79bd", "#7b9a62"];

function getPoint(index, score, checkpointCount) {
  const plotWidth = chart.width - chart.left - chart.right;
  const plotHeight = chart.height - chart.top - chart.bottom;

  return {
    x: chart.left + (plotWidth * index) / Math.max(checkpointCount - 1, 1),
    y:
      chart.top +
      (plotHeight * (chart.maxScore - score)) /
        (chart.maxScore - chart.minScore),
  };
}

function getStudentChange(scores) {
  return scores[scores.length - 1] - scores[0];
}

function getStatusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function Analytics() {
  const { className, subject, reportingPeriod, scoreThreshold, checkpoints, students } =
    analyticsReport;

  const classAverages = checkpoints.map((checkpoint, checkpointIndex) => {
    const total = students.reduce(
      (sum, student) => sum + student.scores[checkpointIndex],
      0,
    );

    return {
      ...checkpoint,
      average: Math.round(total / students.length),
    };
  });

  const currentScores = students.map(
    (student) => student.scores[student.scores.length - 1],
  );
  const averageScore = Math.round(
    currentScores.reduce((sum, score) => sum + score, 0) / students.length,
  );
  const averageProgress = Math.round(
    students.reduce((sum, student) => sum + getStudentChange(student.scores), 0) /
      students.length,
  );
  const studentsNeedingSupport = students.filter(
    (student) => student.scores[student.scores.length - 1] < scoreThreshold,
  ).length;

  return (
    <section className="page analytics-page">
      <header className="page-header analytics-page__header">
        <div>
          <span className="analytics-eyebrow">CLASS PERFORMANCE REPORT</span>
          <h2>{subject} analytics</h2>
          <p>
            {className} <span aria-hidden="true">·</span> {reportingPeriod}
          </p>
        </div>
        <span className="analytics-demo-badge">Sample report data</span>
      </header>

      <div className="analytics-summary">
        <article className="analytics-summary__card">
          <span>Class average</span>
          <strong>{averageScore}%</strong>
          <small>Across {students.length} students</small>
        </article>
        <article className="analytics-summary__card">
          <span>Average progress</span>
          <strong className={averageProgress >= 0 ? "is-positive" : "is-negative"}>
            {averageProgress > 0 ? "+" : ""}
            {averageProgress}%
          </strong>
          <small>From first checkpoint</small>
        </article>
        <article className="analytics-summary__card">
          <span>Needs support</span>
          <strong>{studentsNeedingSupport}</strong>
          <small>Below {scoreThreshold}% target</small>
        </article>
        <article className="analytics-summary__card">
          <span>Students reported</span>
          <strong>{students.length}</strong>
          <small>{className}</small>
        </article>
      </div>

      <article className="analytics-panel analytics-progress-panel">
        <header className="analytics-panel__header">
          <div>
            <h3>Class progress</h3>
            <p>Assessment scores across recent learning checkpoints.</p>
          </div>
          <span className="analytics-chart-unit">Score (%)</span>
        </header>

        <div className="analytics-chart-scroll">
          <svg
            className="analytics-chart"
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            role="img"
            aria-label={`Progress chart for ${students
              .map((student) => student.name)
              .join(", ")} in ${subject}`}
          >
            {[40, 50, 60, 70, 80, 90, 100].map((score) => {
              const { y } = getPoint(
                0,
                score,
                checkpoints.length,
              );

              return (
                <g key={score}>
                  <line
                    className="analytics-chart__gridline"
                    x1={chart.left}
                    x2={chart.width - chart.right}
                    y1={y}
                    y2={y}
                  />
                  <text
                    className="analytics-chart__axis-label"
                    x={chart.left - 10}
                    y={y + 4}
                    textAnchor="end"
                  >
                    {score}
                  </text>
                </g>
              );
            })}

            {checkpoints.map((checkpoint, checkpointIndex) => {
              const { x } = getPoint( checkpointIndex, 40, checkpoints.length);
              const averagePoint = getPoint(
                checkpointIndex,
                classAverages[checkpointIndex].average,
                checkpoints.length,
              );

              return (
                <g key={checkpoint.id}>
                  <line
                    className="analytics-chart__gridline analytics-chart__gridline--vertical"
                    x1={x}
                    x2={x}
                    y1={chart.top}
                    y2={chart.height - chart.bottom}
                  />
                  <text
                    className="analytics-chart__axis-label analytics-chart__axis-label--x"
                    x={x}
                    y={chart.height - 15}
                    textAnchor="middle"
                  >
                    {checkpoint.label}
                  </text>
                  <circle
                    className="analytics-chart__average-point"
                    cx={averagePoint.x}
                    cy={averagePoint.y}
                    r="4.5"
                  />
                  <title>
                    {checkpoint.label}: class average{" "}
                    {classAverages[checkpointIndex].average}%
                  </title>
                </g>
              );
            })}

            {students.map((student, studentIndex) => {
              const points = student.scores.map((score, checkpointIndex) =>
                getPoint(checkpointIndex, score, checkpoints.length),
              );

              return (
                <g key={student.id}>
                  <polyline
                    className="analytics-chart__line"
                    points={points.map((point) => `${point.x},${point.y}`).join(" ")}
                    stroke={lineColors[studentIndex % lineColors.length]}
                  />
                  {points.map((point, pointIndex) => (
                    <circle
                      className="analytics-chart__point"
                      key={`${student.id}-${checkpoints[pointIndex].id}`}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill={lineColors[studentIndex % lineColors.length]}
                    >
                      <title>
                        {student.name}: {checkpoints[pointIndex].label},{" "}
                        {student.scores[pointIndex]}%
                      </title>
                    </circle>
                  ))}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="analytics-chart-legend">
          {students.map((student, index) => (
            <span key={student.id}>
              <i style={{ backgroundColor: lineColors[index % lineColors.length] }} />
              {student.name}
            </span>
          ))}
          <span>
            <i className="analytics-chart-legend__average" />
            Class average
          </span>
        </div>
      </article>

      <article className="analytics-panel analytics-report-panel">
        <header className="analytics-panel__header">
          <div>
            <h3>Student performance</h3>
            <p>Current subject score, progress, attendance, and next focus area.</p>
          </div>
        </header>

        <div className="analytics-table-scroll">
          <table className="analytics-table">
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Current score</th>
                <th scope="col">Progress</th>
                <th scope="col">Attendance</th>
                <th scope="col">Status</th>
                <th scope="col">Focus area</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const score = student.scores[student.scores.length - 1];
                const progress = getStudentChange(student.scores);

                return (
                  <tr key={student.id}>
                    <th scope="row">{student.name}</th>
                    <td>
                      <strong className="analytics-table__score">{score}%</strong>
                    </td>
                    <td>
                      <span
                        className={`analytics-table__change ${
                          progress >= 0 ? "is-positive" : "is-negative"
                        }`}
                      >
                        {progress > 0 ? "+" : ""}
                        {progress}%
                      </span>
                    </td>
                    <td>{student.attendance}%</td>
                    <td>
                      <span
                        className={`analytics-student-status analytics-student-status--${getStatusClass(student.status)}`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td>{student.focus}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="analytics-data-note">
          Mock report data is stored in <code>src/data/analyticsReport.js</code>
          {" "}so it can be replaced with a database/API response later.
        </p>
      </article>
    </section>
  );
}

export default Analytics;
