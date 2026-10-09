import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { useCourses } from '../context/useCourses.js'
import { useTasks } from '../context/useTasks.js'
import './Calendar.css'

const eventTypes = [
  'Assignment',
  'Test',
  'Exam',
  'Assessment',
  'Quiz',
  'Project',
  'Study',
  'Revision',
  'Personal Task',
  'Other',
]

const eventIcons = {
  Assignment: '📝',
  Test: '📋',
  Exam: '🎓',
  Assessment: '🎯',
  Quiz: '❓',
  Project: '💻',
  Lab: '🔬',
  Presentation: '🎤',
  Study: '📚',
  Revision: '📖',
  'Personal Task': '📚',
  Other: '📌',
}

const eventTone = (type) => `calendar-event-${type.toLowerCase().replaceAll(' ', '-')}`
const formatDateKey = (date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
)
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

function eventDateTime(event) {
  return new Date(event.deadline)
}

function formatEventTime(event) {
  const date = eventDateTime(event)
  if (Number.isNaN(date.getTime())) return 'Time unavailable'
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function formatEventDate(event) {
  const date = eventDateTime(event)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatCompactDate(date) {
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function dateHeading(date, today) {
  const dayDifference = Math.round((startOfDay(date) - startOfDay(today)) / 86400000)
  if (dayDifference === 0) return 'Today'
  if (dayDifference === 1) return 'Tomorrow'
  return formatCompactDate(date)
}

function EventFormDialog({ courses, event, onClose, onSave }) {
  function handleSubmit(formEvent) {
    formEvent.preventDefault()
    const data = new FormData(formEvent.currentTarget)
    onSave({
      title: String(data.get('title')).trim(),
      type: String(data.get('type')),
      subject: String(data.get('subject')),
      date: String(data.get('date')),
      time: String(data.get('time')) || '23:59',
      description: String(data.get('description')).trim(),
    })
    onClose()
  }

  const initialDate = event?.deadline ? event.deadline.slice(0, 10) : ''
  const initialTime = event?.deadline ? event.deadline.slice(11, 16) : ''

  return (
    <div
      className="calendar-modal-backdrop"
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) onClose()
      }}
      role="presentation"
    >
      <section
        aria-labelledby="calendar-event-form-title"
        aria-modal="true"
        className="calendar-modal"
        role="dialog"
      >
        <div className="calendar-modal-heading">
          <div>
            <span className="calendar-eyebrow">{event ? 'UPDATE YOUR EVENT' : 'PERSONAL ACADEMIC EVENT'}</span>
            <h2 id="calendar-event-form-title">{event ? 'Edit Event' : 'Add Event'}</h2>
          </div>
          <button aria-label="Close event form" className="calendar-modal-close" onClick={onClose} type="button">×</button>
        </div>
        <form className="calendar-form" onSubmit={handleSubmit}>
          <label>
            Title <span aria-hidden="true">*</span>
            <input autoFocus maxLength="120" name="title" placeholder="e.g. Revise Binary Trees" required defaultValue={event?.title || ''} />
          </label>
          <div className="calendar-form-row">
            <label>
              Type <span aria-hidden="true">*</span>
              <select defaultValue={event?.type || 'Study'} name="type" required>
                {eventTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label>
              Subject
              <select defaultValue={event?.subject || ''} name="subject">
                <option value="">General</option>
                {courses.map((course) => <option key={course.id}>{course.name}</option>)}
              </select>
            </label>
          </div>
          <div className="calendar-form-row">
            <label>
              Date <span aria-hidden="true">*</span>
              <input defaultValue={initialDate} name="date" required type="date" />
            </label>
            <label>
              Time
              <input defaultValue={initialTime} name="time" type="time" />
            </label>
          </div>
          <label>
            Description
            <textarea defaultValue={event?.description || ''} maxLength="500" name="description" placeholder="Add any helpful details" rows="3" />
          </label>
          <div className="calendar-form-actions">
            <button className="calendar-cancel-button" onClick={onClose} type="button">Cancel</button>
            <button className="calendar-submit-button" type="submit">{event ? 'Save Changes' : 'Add Event'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function EventDetailsDialog({ event, onClose, onEdit, onDelete, onComplete }) {
  return (
    <div
      className="calendar-modal-backdrop"
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) onClose()
      }}
      role="presentation"
    >
      <section
        aria-labelledby="calendar-event-detail-title"
        aria-modal="true"
        className="calendar-modal event-detail-modal"
        role="dialog"
      >
        <div className="calendar-modal-heading">
          <div className="event-detail-type">
            <span aria-hidden="true" className={`calendar-event-icon ${eventTone(event.type)}`}>
              {eventIcons[event.type] || '📌'}
            </span>
            <span className="calendar-eyebrow">{event.type}</span>
          </div>
          <button aria-label="Close event details" className="calendar-modal-close" onClick={onClose} type="button">×</button>
        </div>
        <h2 className="event-detail-title" id="calendar-event-detail-title">{event.title}</h2>
        <p className="event-detail-subject">{event.subject || 'General'}</p>
        <div className="event-detail-facts">
          <div><span>DATE</span><strong>{formatEventDate(event)}</strong></div>
          <div><span>TIME</span><strong>{formatEventTime(event)}</strong></div>
          <div><span>DEADLINE</span><strong>{formatEventDate(event)} · {formatEventTime(event)}</strong></div>
          <div><span>SOURCE</span><strong>{event.source === 'faculty' ? 'Faculty' : 'My event'}</strong></div>
        </div>
        <div className="event-detail-description">
          <span>DESCRIPTION</span>
          <p>{event.description || 'No additional details provided.'}</p>
        </div>
        <div className="event-detail-actions">
          {event.source === 'student' ? (
            <>
              <button className="calendar-secondary-button" onClick={() => onEdit(event)} type="button">Edit</button>
              {event.status !== 'completed' && (
                <button className="calendar-secondary-button" onClick={() => onComplete(event)} type="button">✓ Mark Complete</button>
              )}
              <button className="calendar-delete-button" onClick={() => onDelete(event)} type="button">Delete</button>
            </>
          ) : (
            <Link className="calendar-open-task-button" onClick={onClose} to={event.destination || `/tasks/${event.id}`}>
              Open Task <span aria-hidden="true">→</span>
            </Link>
          )}
          {event.source === 'student' && event.destination && (
            <Link className="calendar-open-task-button" onClick={onClose} to={event.destination}>
              Open Task <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}

function CalendarEventButton({ event, compact = false, onClick }) {
  return (
    <button
      aria-label={`${event.type}: ${event.title}`}
      className={`calendar-event-button ${eventTone(event.type)}${compact ? ' is-compact' : ''}${event.status === 'completed' ? ' is-completed' : ''}`}
      onClick={() => onClick(event)}
      type="button"
    >
      <span aria-hidden="true">{eventIcons[event.type] || '📌'}</span>
      <span>{event.title}</span>
    </button>
  )
}

function MonthView({ monthDate, selectedDate, eventsByDate, onSelectDate, onSelectEvent }) {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(firstOfMonth.getDate() - mondayOffset)
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return date
  })

  return (
    <div aria-label="Month view" className="calendar-month-grid">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
        <div className="calendar-weekday" key={day}>{day}</div>
      ))}
      {days.map((date) => {
        const dateKey = formatDateKey(date)
        const dayEvents = eventsByDate.get(dateKey) || []
        const isSelected = formatDateKey(selectedDate) === dateKey
        const isCurrentMonth = date.getMonth() === monthDate.getMonth()
        const isToday = formatDateKey(new Date()) === dateKey
        return (
          <div
            aria-label={`${date.toLocaleDateString(undefined, { dateStyle: 'full' })}, ${dayEvents.length} events`}
            className={`calendar-day-cell${isCurrentMonth ? '' : ' is-outside-month'}${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
            key={dateKey}
            role="gridcell"
          >
            <button
              aria-pressed={isSelected}
              className="calendar-day-number"
              onClick={() => onSelectDate(date)}
              type="button"
            >
              {date.getDate()}
            </button>
            <div className="calendar-day-events">
              {dayEvents.slice(0, 3).map((event) => (
                <CalendarEventButton compact event={event} key={event.id} onClick={onSelectEvent} />
              ))}
              {dayEvents.length > 3 && <span className="calendar-more-events">+{dayEvents.length - 3} more</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function WeekView({ selectedDate, eventsByDate, onSelectDate, onSelectEvent }) {
  const monday = new Date(selectedDate)
  monday.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7))
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return date
  })

  return (
    <div aria-label="Week view" className="calendar-week-view">
      {days.map((date) => {
        const dayEvents = eventsByDate.get(formatDateKey(date)) || []
        return (
          <section className="calendar-week-day" key={formatDateKey(date)}>
            <button className="calendar-week-day-heading" onClick={() => onSelectDate(date)} type="button">
              <span>{date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
              <strong>{date.getDate()}</strong>
            </button>
            {dayEvents.length === 0
              ? <span className="calendar-no-events">No events</span>
              : dayEvents.map((event) => <CalendarEventButton event={event} key={event.id} onClick={onSelectEvent} />)}
          </section>
        )
      })}
    </div>
  )
}

function ListView({ events, onSelectEvent }) {
  if (events.length === 0) {
    return <div className="calendar-empty-state"><strong>No academic events</strong><span>You&apos;re free for this day! 🎉</span></div>
  }

  return (
    <div aria-label="Upcoming events" className="calendar-list-view">
      <span className="calendar-list-eyebrow">UPCOMING</span>
      {events.map((event) => {
        const date = eventDateTime(event)
        return (
          <button className="calendar-list-event" key={event.id} onClick={() => onSelectEvent(event)} type="button">
            <span className="calendar-list-date">
              <strong>{formatCompactDate(date)}</strong>
              <small>{formatEventTime(event)}</small>
            </span>
            <span aria-hidden="true" className={`calendar-event-icon ${eventTone(event.type)}`}>
              {eventIcons[event.type] || '📌'}
            </span>
            <span className="calendar-list-copy">
              <strong>{event.title}</strong>
              <small>{event.subject || 'General'}{event.source === 'student' ? ' · My event' : ''}</small>
            </span>
            <span className="calendar-list-type">{event.type}</span>
          </button>
        )
      })}
    </div>
  )
}

function Calendar() {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [view, setView] = useState('Month')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [notification, setNotification] = useState('')
  const { courses } = useCourses()
  const { getEvents, addEvent, updateEvent, deleteEvent, completeTask, error } = useTasks()
  const events = getEvents()
  const selectedEvent = events.find((event) => event.id === selectedEventId)
  const monthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  const eventsByDate = useMemo(() => {
    const groupedEvents = new Map()
    for (const event of events) {
      const date = eventDateTime(event)
      if (Number.isNaN(date.getTime())) continue
      const key = formatDateKey(date)
      groupedEvents.set(key, [...(groupedEvents.get(key) || []), event])
    }
    for (const dayEvents of groupedEvents.values()) {
      dayEvents.sort((first, second) => eventDateTime(first) - eventDateTime(second))
    }
    return groupedEvents
  }, [events])
  const selectedDateKey = formatDateKey(selectedDate)
  const selectedDayEvents = eventsByDate.get(selectedDateKey) || []
  const chronologicalEvents = [...events]
    .filter((event) => event.status === 'pending' && !Number.isNaN(eventDateTime(event).getTime()))
    .sort((first, second) => eventDateTime(first) - eventDateTime(second))
  const upcomingEvents = chronologicalEvents.slice(0, 5)
  const today = startOfDay(new Date())
  const monthLabel = monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  function changeMonth(amount) {
    setSelectedDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() + amount, 1))
  }

  function handleEventSave(eventDetails) {
    if (editingEvent) {
      updateEvent(editingEvent.id, eventDetails)
      setNotification('Event updated.')
      setEditingEvent(null)
    } else {
      addEvent(eventDetails)
      setNotification('Event added to your calendar.')
      setIsAddingEvent(false)
    }
  }

  function handleDelete(event) {
    deleteEvent(event.id)
    setSelectedEventId('')
    setNotification('Event deleted.')
  }

  function handleComplete(event) {
    completeTask(event.id)
    setSelectedEventId('')
    setNotification('Event marked complete.')
  }

  return (
    <div className="calendar-page">
      <header className="calendar-page-header">
        <PageHeader
          description="Keep track of your classes, deadlines, exams and important academic dates."
          title="Academic Calendar"
        />
        <button className="calendar-add-button" onClick={() => setIsAddingEvent(true)} type="button">
          <span aria-hidden="true">＋</span> Add Event
        </button>
      </header>

      {(error || notification) && (
        <p aria-live="polite" className={`calendar-notice${error ? ' is-error' : ''}`}>
          {error || notification}
        </p>
      )}

      <div className="calendar-layout">
        <section aria-label="Academic calendar" className="calendar-main-panel">
          <div className="calendar-toolbar">
            <div className="calendar-month-navigation">
              <h2>{view === 'List' ? 'All Upcoming' : view === 'Week' ? 'Week of ' + mondayLabel(selectedDate) : monthLabel}</h2>
              <div className="calendar-date-controls">
                <button aria-label="Previous period" onClick={() => view === 'Month' ? changeMonth(-1) : setSelectedDate((current) => shiftDate(current, view, -1))} type="button">← Previous</button>
                <button onClick={() => setSelectedDate(startOfDay(new Date()))} type="button">Today</button>
                <button aria-label="Next period" onClick={() => view === 'Month' ? changeMonth(1) : setSelectedDate((current) => shiftDate(current, view, 1))} type="button">Next →</button>
              </div>
            </div>
            <div aria-label="Calendar view" className="calendar-view-switch" role="group">
              {['Month', 'Week', 'List'].map((viewName) => (
                <button
                  aria-pressed={view === viewName}
                  className={view === viewName ? 'is-active' : ''}
                  key={viewName}
                  onClick={() => setView(viewName)}
                  type="button"
                >
                  {viewName}
                </button>
              ))}
            </div>
          </div>
          {view === 'Month' && (
            <>
              <MonthView
                eventsByDate={eventsByDate}
                monthDate={monthDate}
                onSelectDate={setSelectedDate}
                onSelectEvent={(event) => setSelectedEventId(event.id)}
                selectedDate={selectedDate}
              />
              <div className="calendar-selected-day">
                <div className="calendar-selected-day-heading">
                  <div>
                    <span className="calendar-eyebrow">{selectedDate.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase()}</span>
                    <h3>{formatEventDate({ deadline: `${selectedDateKey}T12:00` })}</h3>
                  </div>
                  <span>{selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'event' : 'events'}</span>
                </div>
                {selectedDayEvents.length === 0 ? (
                  <div className="calendar-empty-state"><strong>No academic events</strong><span>You&apos;re free for this day! 🎉</span></div>
                ) : selectedDayEvents.map((event) => (
                  <CalendarEventButton event={event} key={event.id} onClick={(item) => setSelectedEventId(item.id)} />
                ))}
              </div>
            </>
          )}
          {view === 'Week' && (
            <WeekView
              eventsByDate={eventsByDate}
              onSelectDate={setSelectedDate}
              onSelectEvent={(event) => setSelectedEventId(event.id)}
              selectedDate={selectedDate}
            />
          )}
          {view === 'List' && <ListView events={chronologicalEvents} onSelectEvent={(event) => setSelectedEventId(event.id)} />}
        </section>

        <aside aria-labelledby="calendar-upcoming-title" className="calendar-upcoming-panel">
          <div className="calendar-upcoming-heading">
            <div>
              <span className="calendar-eyebrow">YOUR SCHEDULE</span>
              <h2 id="calendar-upcoming-title">Upcoming</h2>
            </div>
            <span className="calendar-upcoming-count">{upcomingEvents.length}</span>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="calendar-upcoming-empty">No upcoming events.</div>
          ) : (
            <div className="calendar-upcoming-list">
              {upcomingEvents.map((event) => {
                const date = eventDateTime(event)
                return (
                  <button className="calendar-upcoming-event" key={event.id} onClick={() => setSelectedEventId(event.id)} type="button">
                    <span className="calendar-upcoming-date">{dateHeading(date, today)}</span>
                    <span aria-hidden="true" className={`calendar-event-icon ${eventTone(event.type)}`}>
                      {eventIcons[event.type] || '📌'}
                    </span>
                    <span className="calendar-upcoming-copy">
                      <strong>{event.title}</strong>
                      <small>{event.subject || 'General'}</small>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          <div className="calendar-legend">
            <span><i className="legend-assignment" /> Assignments</span>
            <span><i className="legend-assessment" /> Tests & assessments</span>
            <span><i className="legend-personal" /> Personal events</span>
          </div>
        </aside>
      </div>

      {isAddingEvent && (
        <EventFormDialog courses={courses} onClose={() => setIsAddingEvent(false)} onSave={handleEventSave} />
      )}
      {editingEvent && (
        <EventFormDialog courses={courses} event={editingEvent} onClose={() => setEditingEvent(null)} onSave={handleEventSave} />
      )}
      {selectedEvent && !editingEvent && (
        <EventDetailsDialog
          event={selectedEvent}
          onClose={() => setSelectedEventId('')}
          onComplete={handleComplete}
          onDelete={handleDelete}
          onEdit={(event) => {
            setSelectedEventId('')
            setEditingEvent(event)
          }}
        />
      )}
    </div>
  )
}

function shiftDate(date, view, direction) {
  const days = new Date(date)
  days.setDate(days.getDate() + (view === 'Week' ? 7 : 1) * direction)
  return days
}

function mondayLabel(date) {
  const monday = new Date(date)
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default Calendar
