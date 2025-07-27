// POST /sessions/create
export const createSession = async (): Promise<{ sessionId: string }> => {
  const response = await fetch(`${API_BASE_URL}/sessions/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to create session');
  }
  const data = await response.json();
  return { sessionId: data.session_id || data.sessionId };
};
const API_BASE_URL = 'http://localhost:8000';

export interface ApiUploadResponse {
  content: string;
  current_stage: string;
}

export interface ApiInputResponse {
  content: string;
  current_stage: string;
}

export interface ApiVoiceInputResponse {
  content: string;
  current_stage: string;
  transcribed_text?: string;
}

// POST /sessions/{session_id}/upload
export const uploadFile = async (sessionId: string, file: File): Promise<ApiUploadResponse> => {
  console.log('Starting file upload for session:', sessionId);
  console.log('File details:', { name: file.name, type: file.type, size: file.size });
  
  // Create FormData and append file with field name "file" as required by FastAPI
  const formData = new FormData();
  formData.append('file', file, file.name);  // Include filename
  
  try {
    console.log('Making upload request to:', `${API_BASE_URL}/sessions/${sessionId}/upload`);
    console.log('FormData content:', Array.from(formData.entries()));
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/upload`, {
      method: 'POST',
      // Do not set Content-Type header, browser will set it with boundary
      body: formData,
    });

    console.log('Upload response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed response:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || `Upload failed: ${response.statusText}`);
      } catch (e) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log('Upload success response:', data);
    
    return {
      content: data.content,
      current_stage: data.current_stage
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// POST /sessions/{session_id}/initial-input
export const sendInitialInput = async (sessionId: string, input: string): Promise<ApiInputResponse> => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/initial-input`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ initial_input: input }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Initial input failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.content,
    current_stage: data.current_stage
  };
};

// POST /sessions/{session_id}/input
export const sendInput = async (sessionId: string, input: string): Promise<ApiInputResponse> => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/input`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_input: input }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Input failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.content,
    current_stage: data.current_stage
  };
};

// POST /sessions/{session_id}/voice-input
export const sendVoiceInput = async (sessionId: string, audioData: Blob): Promise<ApiVoiceInputResponse> => {
  const formData = new FormData();
  formData.append('audio_file', audioData);

  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/voice-input`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Voice input failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.content,
    current_stage: data.current_stage,
    transcribed_text: data.transcribed_text
  };
};
