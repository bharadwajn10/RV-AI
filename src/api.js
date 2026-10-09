const API_BASE = 'http://127.0.0.1:8000/api/v1'

export async function loginLearner() {
  const res = await fetch(`${API_BASE}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'learner' })
  })
  if (!res.ok) throw new Error('Login failed')
  const data = await res.json()
  localStorage.setItem('token', data.data.token)
  return data.data
}

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export async function fetchLearnerDashboard() {
  const res = await fetch(`${API_BASE}/learner/dashboard`, {
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error('Failed to fetch dashboard')
  const json = await res.json()
  return json.data
}

export async function sendVoiceTurn(topicId, text, onChunk) {
  const res = await fetch(`${API_BASE}/learner/voice/turn`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ topic_id: topicId, text })
  })
  if (!res.ok) throw new Error('Failed to send voice turn')
  
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    onChunk(decoder.decode(value, { stream: true }))
  }
export async function submitAnswer(topicId, question, answer) {
  const res = await fetch(`${API_BASE}/learner/submit`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ topic_id: topicId, question, answer })
  })
  if (!res.ok) throw new Error('Failed to submit answer')
  return (await res.json()).data
}

// Educator Endpoints
export async function loginEducator() {
  const res = await fetch(`${API_BASE}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'educator' })
  })
  if (!res.ok) throw new Error('Login failed')
  const data = await res.json()
  localStorage.setItem('educator_token', data.data.token)
  return data.data
}

function getEducatorAuthHeaders() {
  const token = localStorage.getItem('educator_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export async function uploadMaterial(title, content) {
  const res = await fetch(`${API_BASE}/educator/materials`, {
    method: 'POST',
    headers: getEducatorAuthHeaders(),
    body: JSON.stringify({ class_id: "ds-class-1", title, content })
  })
  if (!res.ok) throw new Error('Failed to upload material')
  return (await res.json()).data
}

export async function requestDraft(kind, spec) {
  const res = await fetch(`${API_BASE}/educator/drafts`, {
    method: 'POST',
    headers: getEducatorAuthHeaders(),
    body: JSON.stringify({ class_id: "ds-class-1", kind, spec })
  })
  if (!res.ok) throw new Error('Failed to request draft')
  return (await res.json()).data
}

export async function publishPlan(items) {
  const res = await fetch(`${API_BASE}/educator/plans`, {
    method: 'POST',
    headers: getEducatorAuthHeaders(),
    body: JSON.stringify({ class_id: "ds-class-1", items })
  })
  if (!res.ok) throw new Error('Failed to publish plan')
  return (await res.json()).data
}
