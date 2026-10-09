import { useState } from 'react'
import { courses as courseCatalog, subjectTopics } from '../data/mockData.js'
import { CourseContext } from './courseContext.js'

const STORAGE_KEY = 'studyspace-course-enrollments'

function readStoredCourses() {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === null) return courseCatalog

  const savedCourses = JSON.parse(stored)
  if (!Array.isArray(savedCourses)) {
    throw new Error('Saved course enrollments are not in the expected format.')
  }

  const savedById = new Map(
    savedCourses
      .filter((course) =>
        course &&
        typeof course.id === 'string' &&
        typeof course.enrolled === 'boolean' &&
        Number.isFinite(course.progress),
      )
      .map((course) => [course.id, course]),
  )

  return courseCatalog.map((course) => {
    const saved = savedById.get(course.id)
    if (!saved) return course

    return {
      ...course,
      enrolled: saved.enrolled,
      progress: Math.min(100, Math.max(0, Math.round(saved.progress))),
      lastStudiedTopic: typeof saved.lastStudiedTopic === 'string'
        ? saved.lastStudiedTopic
        : course.lastStudiedTopic,
      lastStudied: typeof saved.lastStudied === 'string'
        ? saved.lastStudied
        : course.lastStudied,
    }
  })
}

function storedCourseState(courses) {
  return JSON.stringify(courses.map(({ id, enrolled, progress, lastStudiedTopic, lastStudied }) => ({
    id,
    enrolled,
    progress,
    lastStudiedTopic,
    lastStudied,
  })))
}

export function CourseProvider({ children }) {
  const [courseState, setCourseState] = useState(() => {
    try {
      return { courses: readStoredCourses(), error: '' }
    } catch {
      return {
        courses: courseCatalog,
        error: 'Saved course data could not be read. Changes will remain for this visit only.',
      }
    }
  })

  function commitCourses(nextCourses) {
    let error = ''
    try {
      window.localStorage.setItem(STORAGE_KEY, storedCourseState(nextCourses))
    } catch {
      error = 'Course changes could not be saved. Check your browser storage settings.'
    }

    setCourseState({ courses: nextCourses, error })
  }

  function enrollCourse(courseId) {
    const course = courseState.courses.find((item) => item.id === courseId)
    if (!course || course.enrolled) return
    commitCourses(courseState.courses.map((item) =>
      item.id === courseId ? { ...item, enrolled: true, progress: 0 } : item,
    ))
  }

  function startCourse(courseId) {
    const course = courseState.courses.find((item) => item.id === courseId)
    if (!course) return
    const topics = subjectTopics[courseId] || []
    const firstTopic = topics.find((topic) => topic.status === 'in-progress') ||
      topics.find((topic) => topic.status !== 'completed') ||
      topics[0]
    commitCourses(courseState.courses.map((item) =>
      item.id === courseId
        ? {
            ...item,
            enrolled: true,
            progress: Math.max(item.progress, 1),
            lastStudiedTopic: firstTopic?.name || item.lastStudiedTopic,
            lastStudied: 'Just now',
          }
        : item,
    ))
  }

  function updateCourseProgress(courseId, progress) {
    const course = courseState.courses.find((item) => item.id === courseId)
    if (!course || !course.enrolled || !Number.isFinite(progress)) return
    const safeProgress = Math.min(100, Math.max(1, Math.round(progress)))
    commitCourses(courseState.courses.map((item) =>
      item.id === courseId
        ? { ...item, enrolled: true, progress: safeProgress }
        : item,
    ))
  }

  const value = {
    courses: courseState.courses,
    error: courseState.error,
    enrollCourse,
    startCourse,
    updateCourseProgress,
    getEnrolledCourses: () => courseState.courses.filter((course) => course.enrolled),
    getStartedCourses: () => courseState.courses.filter((course) => course.progress > 0),
  }

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
}
