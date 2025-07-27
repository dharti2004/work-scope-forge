const API_BASE_URL = 'http://localhost:8000';

export interface ApiUploadResponse {
  success: boolean;
  message: string;
  sessionId: string;
}

export interface ApiInputResponse {
  success: boolean;
  response: string;
}

export interface ApiVoiceInputResponse {
  success: boolean;
  response: string;
  transcription?: string;
}

// POST /sessions/{session_id}/upload
export const uploadFile = async (sessionId: string, file: File): Promise<ApiUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
};

// POST /sessions/{session_id}/initial-input
export const sendInitialInput = async (sessionId: string, input: string): Promise<ApiInputResponse> => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/initial-input`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    throw new Error(`Initial input failed: ${response.statusText}`);
  }

  return response.json();
};

// POST /sessions/{session_id}/input
export const sendInput = async (sessionId: string, input: string): Promise<ApiInputResponse> => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/input`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    throw new Error(`Input failed: ${response.statusText}`);
  }

  return response.json();
};

// POST /sessions/{session_id}/voice-input
export const sendVoiceInput = async (sessionId: string, audioData: Blob): Promise<ApiVoiceInputResponse> => {
  const formData = new FormData();
  formData.append('audio', audioData);

  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/voice-input`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Voice input failed: ${response.statusText}`);
  }

  return response.json();
};