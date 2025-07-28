const API_BASE_URL = 'http://localhost:8000';

export interface ApiResponse {
  content: string;
  current_stage: string;
  follow_up_question?: string;
}

export interface ApiVoiceInputResponse extends ApiResponse {
  transcribed_text?: string;
}

// POST /sessions/{session_id}/upload
export const uploadFile = async (sessionId: string, file: File): Promise<ApiResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `Upload failed with status: ${response.status}` }));
    throw new Error(error.detail);
  }

  return await response.json();
};

// POST /sessions/{session_id}/initial-input
export const sendInitialInput = async (sessionId: string, input: string): Promise<ApiResponse> => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/initial-input`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initial_input: input }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `Request failed with status: ${response.status}` }));
    throw new Error(error.detail);
  }

  return await response.json();
};

// POST /sessions/{session_id}/input
export const sendInput = async (sessionId: string, input: string): Promise<ApiResponse> => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/input`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_input: input }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `Request failed with status: ${response.status}` }));
    throw new Error(error.detail);
  }

  return await response.json();
};

// POST /sessions/{session_id}/voice-input
export const sendVoiceInput = async (sessionId: string, audioData: Blob): Promise<ApiVoiceInputResponse> => {
  const formData = new FormData();
  formData.append('audio_file', audioData, 'voice-input.wav');

  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/voice-input`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `Voice input failed with status: ${response.status}` }));
    throw new Error(error.detail);
  }

  return await response.json();
};