import { useContext } from 'react'
import { CourseContext } from './courseContext.js'

export function useCourses() {
  const context = useContext(CourseContext)
  if (context === null) {
    throw new Error('useCourses must be used within a CourseProvider.')
  }
  return context
}
