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
