import { useState } from 'react'
import { facultyTasks } from '../data/mockData.js'
import { TaskContext } from './taskContext.js'

const STORAGE_KEY = 'studyspace-student-tasks'

function readStudentTasks() {
  const storedTasks = window.localStorage.getItem(STORAGE_KEY)
  if (storedTasks === null) return []

  const parsedTasks = JSON.parse(storedTasks)
  if (!Array.isArray(parsedTasks)) {
    throw new Error('Saved student tasks are not in the expected format.')
  }

  return parsedTasks.filter((task) =>
    task &&
    typeof task.id === 'string' &&
    task.source === 'student' &&
    typeof task.title === 'string' &&
    typeof task.deadline === 'string' &&
    ['pending', 'completed'].includes(task.status),
  )
}

function persistStudentTasks(tasks) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

function getDeadlineFromEvent(event) {
  if (event.deadline) return event.deadline
  if (!event.date) return ''
  return `${event.date}T${event.time || '23:59'}`
}

export function TaskProvider({ children }) {
  const [taskState, setTaskState] = useState(() => {
    try {
      return { tasks: readStudentTasks(), error: '' }
    } catch {
      return {
        tasks: [],
        error: 'Saved personal tasks could not be read. New tasks will be available for this visit only.',
      }
    }
  })

  function saveTasks(nextTasks) {
    let error = ''
    try {
      persistStudentTasks(nextTasks)
    } catch {
      error = 'Personal tasks could not be saved. Check your browser storage settings.'
    }
    setTaskState({ tasks: nextTasks, error })
  }

  function addTask(taskDetails) {
    const deadline = getDeadlineFromEvent(taskDetails)
    const newTask = {
      ...taskDetails,
      id: `student-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
      deadline,
      status: 'pending',
      source: 'student',
      destination: null,
      createdAt: new Date().toISOString(),
      faculty: 'You',
      instructions: taskDetails.description || 'This is your personal academic reminder.',
    }
    saveTasks([...taskState.tasks, newTask])
  }

  function addEvent(eventDetails) {
    addTask({
      ...eventDetails,
      deadline: getDeadlineFromEvent(eventDetails),
    })
  }

  function updateEvent(eventId, changes) {
    const task = taskState.tasks.find((item) => item.id === eventId)
    if (!task) return

    const deadline = getDeadlineFromEvent(changes) || task.deadline
    saveTasks(taskState.tasks.map((item) =>
      item.id === eventId
        ? {
            ...item,
            ...changes,
            deadline,
            updatedAt: new Date().toISOString(),
          }
        : item,
    ))
  }

  function deleteEvent(eventId) {
    const task = taskState.tasks.find((item) => item.id === eventId)
    if (!task) return
    saveTasks(taskState.tasks.filter((item) => item.id !== eventId))
  }

  function completeTask(taskId) {
    saveTasks(taskState.tasks.map((task) =>
      task.id === taskId ? { ...task, status: 'completed', completedAt: new Date().toISOString() } : task,
    ))
  }

  const tasks = [...facultyTasks, ...taskState.tasks]

  return (
    <TaskContext.Provider
      value={{
        tasks,
        error: taskState.error,
        addTask,
        addEvent,
        updateEvent,
        deleteEvent,
        completeTask,
        getPendingTasks: () => tasks.filter((task) => task.status === 'pending'),
        getCompletedTasks: () => tasks.filter((task) => task.status === 'completed'),
        getEvents: () => tasks,
        getEventsForDate: (date) => tasks.filter((task) => task.deadline.slice(0, 10) === date),
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}
