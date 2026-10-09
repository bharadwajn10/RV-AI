import { useContext } from 'react'
import { TaskContext } from './taskContext.js'

export function useTasks() {
  const context = useContext(TaskContext)
  if (context === null) {
    throw new Error('useTasks must be used within a TaskProvider.')
  }
  return context
}
