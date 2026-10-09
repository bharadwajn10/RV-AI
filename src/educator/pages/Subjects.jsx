import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import SubjectCard from '../components/SubjectCard.jsx'
import { useCourses } from '../context/useCourses.js'
import { subjectTopics } from '../data/mockData.js'
import './Subjects.css'

const statusFilters = [
  { label: 'All subjects', value: 'all' },
  { label: 'In progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
]

function SubjectSection({ title, description, subjects: sectionSubjects, badge, onEnroll, onStart }) {
  if (sectionSubjects.length === 0) return null

  return (
    <section aria-label={title} className="subjects-section">
      <div className="subjects-section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="subjects-section-count">
          {sectionSubjects.length} {sectionSubjects.length === 1 ? 'subject' : 'subjects'}
        </span>
      </div>
      <div className="subjects-grid">
        {sectionSubjects.map((subject) => (
          <SubjectCard
            badge={badge?.(subject)}
            key={subject.id}
            onEnroll={() => onEnroll(subject)}
            onStart={() => onStart(subject)}
            subject={subject}
          />
        ))}
      </div>
    </section>
  )
}

function Subjects() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const navigate = useNavigate()
  const { courses, enrollCourse, startCourse, error } = useCourses()

  const categories = useMemo(
    () => [...new Set(courses.map((course) => course.category))],
    [courses],
  )

  const filteredSubjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return courses.filter((subject) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${subject.name} ${subject.description} ${subject.lastStudiedTopic}`
          .toLowerCase()
          .includes(normalizedSearch)
      const matchesCategory =
        categoryFilter === 'all' || subject.category === categoryFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && subject.progress === 100) ||
        (statusFilter === 'in-progress' &&
          subject.progress > 0 &&
          subject.progress < 100)

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [categoryFilter, courses, searchTerm, statusFilter])

  const recentlyStudied = filteredSubjects.filter((subject) => subject.progress > 0)
  const recommended = filteredSubjects.filter((subject) => subject.recommended)
  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    statusFilter !== 'all' ||
    categoryFilter !== 'all'

  function beginCourse(course) {
    startCourse(course.id)
    const topics = subjectTopics[course.id] || []
    const firstTopic = topics.find((topic) => topic.status === 'in-progress') ||
      topics.find((topic) => topic.status !== 'completed') ||
      topics[0]
    if (firstTopic) navigate(`/learn/${course.id}/${firstTopic.id}`)
    else navigate(`/subjects/${course.id}`)
  }

  function enrollInCourse(course) {
    enrollCourse(course.id)
  }

  return (
    <div className="subjects-page">
      <PageHeader
        description="Your courses, progress, and next steps in one place."
        title="My Subjects"
      />

      <div className="subjects-toolbar">
        <label className="subjects-search">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            aria-label="Search subjects or topics"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search subjects or topics"
            type="search"
            value={searchTerm}
          />
        </label>
        <label className="category-select-label">
          <span className="visually-hidden">Filter by category</span>
          <select
            aria-label="Filter by category"
            onChange={(event) => setCategoryFilter(event.target.value)}
            value={categoryFilter}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>

      <div aria-label="Filter subjects by progress" className="subject-status-filters">
        {statusFilters.map((filter) => (
          <button
            aria-pressed={statusFilter === filter.value}
            className={statusFilter === filter.value ? 'is-selected' : ''}
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && <p aria-live="polite" className="course-storage-error">{error}</p>}

      {filteredSubjects.length === 0 ? (
        <div className="subjects-empty-state">
          <span aria-hidden="true">⌕</span>
          <h2>No subjects found</h2>
          <p>Try a different search or adjust your filters.</p>
        </div>
      ) : (
        <>
          {!hasActiveFilters && (
            <>
              <SubjectSection
                badge={(subject) => subject.progress >= 70 ? 'On a roll' : null}
                description="Quickly get back to where you left off."
                onEnroll={enrollInCourse}
                onStart={beginCourse}
                subjects={recentlyStudied}
                title="Recently Studied"
              />
              <SubjectSection
                badge={() => 'For you'}
                description="A few good picks for your next study session."
                onEnroll={enrollInCourse}
                onStart={beginCourse}
                subjects={recommended}
                title="Recommended"
              />
            </>
          )}
          <SubjectSection
            badge={(subject) => subject.enrolled
              ? subject.progress === 100 ? 'Completed' : subject.progress > 0 ? 'In progress' : 'Enrolled'
              : 'Available'}
            description="Explore courses, enroll, and continue learning."
            onEnroll={enrollInCourse}
            onStart={beginCourse}
            subjects={filteredSubjects}
            title="Available Courses"
          />
        </>
      )}
    </div>
  )
}

export default Subjects
