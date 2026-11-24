const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error(`Health check failed with status ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching backend health:', error);
    return null;
  }
}

export async function sendChatMessage(sessionId, message, simulateFailureHeader = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (simulateFailureHeader && simulateFailureHeader.trim() !== '') {
    headers['X-Simulate-Failure'] = simulateFailureHeader.trim();
  }

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      session_id: sessionId,
      message: message.trim(),
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || (response.status === 503 ? 'all providers unavailable' : `Request failed (${response.status})`);
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function fetchSessionHistory(sessionId) {
  try {
    const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages`);
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`Failed to load history (${res.status})`);
    }
    const data = await res.json();
    return data.messages || [];
  } catch (error) {
    console.warn(`Could not load session history for ${sessionId}:`, error);
    return [];
  }
}

export async function fetchAllSessions() {
  try {
    const res = await fetch(`${API_BASE_URL}/sessions`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.sessions || [];
  } catch (error) {
    console.warn('Could not load sessions list:', error);
    return [];
  }
}
