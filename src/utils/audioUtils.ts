/**
 * Audio utilities for AssemblyAI Batch STT
 * Handles recording, encoding, and uploading audio files
 */

export interface AudioRecordingOptions {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export interface TranscriptionResult {
  transcript: string;
  confidence?: number;
  language: string;
  model: string;
  transcript_id?: string;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;

  /**
   * Start recording audio
   */
  async startRecording(options: AudioRecordingOptions = {}): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: options.sampleRate || 16000,
          channelCount: options.channelCount || 1,
          echoCancellation: options.echoCancellation ?? true,
          noiseSuppression: options.noiseSuppression ?? true,
          autoGainControl: options.autoGainControl ?? false
        }
      });

      this.mediaStream = stream;
      this.audioChunks = [];

      // Create MediaRecorder with optimal settings for AssemblyAI
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // 100ms chunks
      this.isRecording = true;

      console.log('🎤 Audio recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw new Error(`Recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop recording and return audio data
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
        this.cleanup();
        console.log('🎤 Audio recording stopped, size:', audioBlob.size, 'bytes');
        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = (event) => {
        this.cleanup();
        reject(new Error(`Recording error: ${event}`));
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.audioChunks = [];
  }

  /**
   * Check if currently recording
   */
  get recording(): boolean {
    return this.isRecording;
  }
}

/**
 * Convert audio blob to base64 for API transmission
 */
export async function audioBlobToBase64(audioBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just the base64 string
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to convert audio to base64'));
    reader.readAsDataURL(audioBlob);
  });
}

/**
 * Detect language from text using common words
 */
export function detectLanguage(text: string): string {
  const turkishWords = [
    'merhaba', 'nasıl', 'nerede', 'ne', 'kim', 'hangi', 'bu', 'şu', 'o',
    'ben', 'sen', 'biz', 'siz', 'onlar', 'evet', 'hayır', 'teşekkür',
    'lütfen', 'güzel', 'iyi', 'kötü', 'büyük', 'küçük', 'var', 'yok'
  ];
  
  const englishWords = [
    'hello', 'how', 'where', 'what', 'who', 'which', 'this', 'that',
    'i', 'you', 'we', 'they', 'yes', 'no', 'thank', 'please', 'good',
    'bad', 'big', 'small', 'can', 'will', 'would', 'could', 'is', 'are'
  ];

  const lowerText = text.toLowerCase();
  let turkishCount = 0;
  let englishCount = 0;

  turkishWords.forEach(word => {
    if (lowerText.includes(word)) turkishCount++;
  });

  englishWords.forEach(word => {
    if (lowerText.includes(word)) englishCount++;
  });

  if (turkishCount > englishCount) return 'tr';
  if (englishCount > turkishCount) return 'en';
  return 'auto';
}

/**
 * Transcribe audio using AssemblyAI Batch API
 */
export async function transcribeWithAssemblyAI(
  audioBlob: Blob,
  language: string = 'auto'
): Promise<TranscriptionResult> {
  try {
    console.log('🎤 Starting AssemblyAI batch transcription...');
    
    // Convert audio to base64
    const audioBase64 = await audioBlobToBase64(audioBlob);
    
    // Send to backend
    const response = await fetch('/api/assemblyai-batch-transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: audioBase64,
        language: language
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ AssemblyAI batch transcription completed:', result);
    
    return result;
  } catch (error) {
    console.error('❌ AssemblyAI batch transcription failed:', error);
    throw error;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get audio duration from blob (approximate)
 */
export function getAudioDuration(audioBlob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };
    audio.onerror = () => {
      // Fallback: estimate duration based on file size
      // Assuming 16kbps mono audio
      const estimatedDuration = (audioBlob.size * 8) / (16000 * 1);
      resolve(estimatedDuration);
    };
    audio.src = URL.createObjectURL(audioBlob);
  });
} 