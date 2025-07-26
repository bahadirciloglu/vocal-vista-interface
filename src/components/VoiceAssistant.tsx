import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Upload, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  AudioRecorder, 
  transcribeWithAssemblyAI, 
  detectLanguage, 
  formatFileSize,
  getAudioDuration,
  type TranscriptionResult 
} from '@/utils/audioUtils';

// API configuration
const CHAT_API_URL = 'http://localhost:8001/chat';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type AssistantStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'uploading';

const VoiceAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [showMicrophonePermission, setShowMicrophonePermission] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [audioInfo, setAudioInfo] = useState<{ size: string; duration: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRecorderRef = useRef<AudioRecorder>(new AudioRecorder());

  // Backend metrics state
  const [backendMetrics, setBackendMetrics] = useState<any>({});

  // Fetch backend metrics
  const fetchBackendMetrics = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8001/metrics');
      if (response.ok) {
        const metrics = await response.json();
        setBackendMetrics(metrics);
        console.log('Backend metrics updated:', metrics);
      }
    } catch (err) {
      console.error('Failed to fetch backend metrics:', err);
    }
  }, []);

  useEffect(() => {
    fetchBackendMetrics();
    const interval = setInterval(fetchBackendMetrics, 5000);
    return () => clearInterval(interval);
  }, [fetchBackendMetrics]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => { 
    scrollToBottom(); 
  }, [scrollToBottom]);

  const handleMicToggle = async () => {
    if (isListening) {
      await stopListening();
    } else {
      setShowMicrophonePermission(true);
    }
  };

  const startListening = async () => {
    try {
      setError(null);
      setStatus('listening');
      setIsListening(true);
      setUploadProgress(0);
      setAudioInfo(null);
      
      await audioRecorderRef.current.startRecording({
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false
      });
      
      console.log('🎤 Recording started for AssemblyAI batch STT');
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(`Recording failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('idle');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      if (!audioRecorderRef.current.recording) {
        setIsListening(false);
        setStatus('idle');
        return;
      }

      setStatus('uploading');
      setUploadProgress(10);
      
      // Stop recording and get audio blob
      const audioBlob = await audioRecorderRef.current.stopRecording();
      setIsListening(false);
      
      setUploadProgress(30);
      
      // Get audio info for display
      const size = formatFileSize(audioBlob.size);
      const duration = await getAudioDuration(audioBlob);
      const durationStr = `${duration.toFixed(1)}s`;
      
      setAudioInfo({ size, duration: durationStr });
      setUploadProgress(50);
      
      // Transcribe with AssemblyAI batch API
      setStatus('processing');
      setUploadProgress(70);
      
      const result: TranscriptionResult = await transcribeWithAssemblyAI(audioBlob, 'auto');
      
      setUploadProgress(100);
      
      if (result.transcript) {
        setTranscription(result.transcript);
        
        // Detect language and process
        const detectedLanguage = detectLanguage(result.transcript);
        await processTranscription(result.transcript, detectedLanguage);
      } else {
        setError('No transcript received from AssemblyAI');
        setStatus('idle');
      }
      
    } catch (err) {
      console.error('Failed to process recording:', err);
      setError(`Processing failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('idle');
    }
  };

  const processTranscription = async (finalTranscription: string, language: string) => {
    try {
      console.log('Processing transcription:', finalTranscription, 'Language:', language);
      
      if (!finalTranscription.trim()) {
        console.log('Empty transcription, skipping processing');
        setStatus('idle');
        return;
      }
      
      // Add user message to chat
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: finalTranscription,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Send to chat API
      console.log('Sending to chat API...');
      const response = await sendToChatAPI(finalTranscription, language);
      
      if (response) {
        // Add assistant response to chat
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Convert response to speech
        console.log('Converting response to speech...');
        await textToSpeech(response, language);
      } else {
        setError('No response from chat API');
        setStatus('idle');
      }
      
    } catch (err) {
      console.error('Error processing transcription:', err);
      setError(`Processing error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('idle');
    }
  };

  const sendToChatAPI = async (message: string, language: string = 'auto'): Promise<string | null> => {
    try {
      const requestBody = {
        guest_id: 'user123',
        message,
        language
      };
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.message || null;
    } catch (err) {
      return null;
    }
  };

  const textToSpeech = async (text: string, language: string = 'auto'): Promise<void> => {
    try {
      setStatus('speaking');
      if (!window.speechSynthesis) throw new Error('Web Speech API not supported');
      const utterance = new SpeechSynthesisUtterance(text);
      const languageMap: { [key: string]: string } = { 'en': 'en-US', 'tr': 'tr-TR', 'auto': 'en-US' };
      utterance.lang = languageMap[language] || 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = isMuted ? 0 : 1;
      utterance.onend = () => setStatus('idle');
      utterance.onerror = () => setStatus('idle');
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      setStatus('idle');
    }
  };

  const getStatusColor = (currentStatus: AssistantStatus) => {
    switch (currentStatus) {
      case 'listening': return 'bg-listening text-white';
      case 'processing': return 'bg-processing text-white';
      case 'speaking': return 'bg-speaking text-white';
      case 'uploading': return 'bg-blue-600 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (currentStatus: AssistantStatus) => {
    switch (currentStatus) {
      case 'listening': return 'Recording...';
      case 'processing': return 'Transcribing...';
      case 'speaking': return 'Speaking...';
      case 'uploading': return 'Uploading...';
      default: return 'Ready';
    }
  };

  const getMicButtonClass = () => {
    if (status === 'listening') return 'mic-listening bg-listening border-listening text-white hover:bg-listening/90';
    if (status === 'processing' || status === 'uploading') return 'mic-processing bg-processing border-processing text-white';
    return 'bg-primary border-primary text-primary-foreground hover:bg-primary/90';
  };

  return (
    <div className="h-screen flex flex-col bg-background" role="application" aria-label="Voice Assistant">
      {/* Header */}
      <header className="border-b bg-card p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">AssemblyAI Batch STT Agent</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className={`px-3 py-1 font-medium transition-colors ${getStatusColor(status)}`}
              aria-live="polite"
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${
                status === 'listening' ? 'bg-white animate-pulse' :
                status === 'processing' || status === 'uploading' ? 'bg-white animate-spin' :
                status === 'speaking' ? 'bg-white animate-bounce' :
                'bg-current'
              }`} />
              {getStatusText(status)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? 'Unmute assistant' : 'Mute assistant'}
              className="focus-outline"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive flex items-center gap-2">
              <span className="w-2 h-2 bg-destructive rounded-full" />
              {error}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto h-6 px-2 text-xs"
              >
                Dismiss
              </Button>
            </p>
          </div>
        )}
        
        {/* Microphone Permission Info */}
        {showMicrophonePermission && (
          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Mikrofon İzni Gerekli
                </h4>
                <p className="text-sm text-blue-800 mb-3">
                  Sesli asistanı kullanabilmek için tarayıcınız mikrofon erişimi isteyecek. 
                  Bu güvenli bir işlemdir ve sadece ses kaydı için kullanılır.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowMicrophonePermission(false);
                      startListening();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    İzin Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMicrophonePermission(false)}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content - 3 Column Layout */}
      <main className="flex-1 flex gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Left Column - STT/TTS Metrics */}
        <div className="w-80 flex-shrink-0">
          <Card className="p-4 h-full">
            <h3 className="text-lg font-semibold mb-4 text-blue-600">STT & TTS Metrics</h3>
            
            {/* STT Metrics */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Speech-to-Text (STT)</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>STT Type:</span>
                  <span className="font-mono text-green-600">Batch API</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <span className="font-mono">{getStatusText(status)}</span>
                </div>
                {audioInfo && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>File Size:</span>
                      <span className="font-mono">{audioInfo.size}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Duration:</span>
                      <span className="font-mono">{audioInfo.duration}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span>Model:</span>
                  <span className="font-mono text-blue-600">AssemblyAI</span>
                </div>
              </div>
            </div>

            {/* TTS Metrics */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Text-to-Speech (TTS)</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>TTS Engine:</span>
                  <span className="font-mono text-purple-600">Web Speech API</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <span className="font-mono">
                    {status === 'speaking' ? 'Speaking...' : 'Ready'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Volume:</span>
                  <span className="font-mono">
                    {isMuted ? 'Muted' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Upload Progress</h4>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">{uploadProgress.toFixed(0)}%</p>
              </div>
            )}

            {/* Real-time Metrics */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Real-time Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Requests:</span>
                  <span className="font-mono">{backendMetrics.performance?.total_requests || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Success Rate:</span>
                  <span className="font-mono text-green-600">
                    {backendMetrics.performance?.success_rate_percent || 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Response:</span>
                  <span className="font-mono">
                    {backendMetrics.performance?.avg_response_time_ms 
                      ? `${backendMetrics.performance.avg_response_time_ms.toFixed(0)}ms`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Center Column - Chat Interface */}
        <div className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <ScrollArea className="flex-1 rounded-lg border bg-card p-4 mb-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Welcome to AssemblyAI Batch STT Agent</p>
                  <p className="text-sm">Click the microphone button to start recording</p>
                  <div className="mt-4 flex justify-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      <Upload className="h-3 w-3 mr-1" />
                      Batch Upload
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <FileAudio className="h-3 w-3 mr-1" />
                      High Quality
                    </Badge>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Transcription Display */}
          {transcription && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Transcription:</span> {transcription}
              </p>
            </div>
          )}

          {/* Voice Control */}
          <Card className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Button
                size="lg"
                onClick={handleMicToggle}
                disabled={status === 'processing' || status === 'uploading'}
                className={`w-20 h-20 rounded-full p-0 transition-all duration-200 ${getMicButtonClass()}`}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
              >
                {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </Button>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {isListening ? 'Click to stop recording' : 'Click to start recording'}
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  Audio will be uploaded to AssemblyAI for high-quality transcription
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Backend Metrics */}
        <div className="w-80 flex-shrink-0">
          <Card className="p-4 h-full">
            <h3 className="text-lg font-semibold mb-4 text-green-600">Backend System Metrics</h3>
            
            {/* System Metrics */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">System Health</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Memory Usage:</span>
                  <span className={`font-mono ${
                    backendMetrics.system?.memory_usage_percent > 80 ? 'text-red-600' : 
                    backendMetrics.system?.memory_usage_percent > 60 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {backendMetrics.system?.memory_usage_percent?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>CPU Usage:</span>
                  <span className={`font-mono ${
                    backendMetrics.system?.cpu_usage_percent > 80 ? 'text-red-600' : 
                    backendMetrics.system?.cpu_usage_percent > 60 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {backendMetrics.system?.cpu_usage_percent?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Uptime:</span>
                  <span className="font-mono">
                    {backendMetrics.system?.uptime_seconds 
                      ? `${Math.floor(backendMetrics.system.uptime_seconds / 3600)}h ${Math.floor((backendMetrics.system.uptime_seconds % 3600) / 60)}m`
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Active Connections:</span>
                  <span className="font-mono">{backendMetrics.system?.active_connections || 0}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Requests:</span>
                  <span className="font-mono">{backendMetrics.performance?.total_requests || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Success Rate:</span>
                  <span className="font-mono text-green-600">
                    {backendMetrics.performance?.success_rate_percent || 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Response Time:</span>
                  <span className="font-mono">
                    {backendMetrics.performance?.avg_response_time_ms 
                      ? `${backendMetrics.performance.avg_response_time_ms.toFixed(0)}ms`
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Min/Max Response:</span>
                  <span className="font-mono text-xs">
                    {backendMetrics.performance?.min_response_time_ms && backendMetrics.performance?.max_response_time_ms
                      ? `${backendMetrics.performance.min_response_time_ms.toFixed(0)}/${backendMetrics.performance.max_response_time_ms.toFixed(0)}ms`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Requests */}
            {backendMetrics.recent_requests && backendMetrics.recent_requests.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Requests</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {backendMetrics.recent_requests.slice(0, 3).map((req: any, index: number) => (
                    <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                      <div className="flex justify-between">
                        <span className="text-gray-600">#{index + 1}</span>
                        <span className={`font-mono ${
                          req.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {req.success ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className="text-gray-500">
                        {req.duration_ms?.toFixed(0)}ms
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API Status */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">API Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>AssemblyAI:</span>
                  <span className="font-mono text-green-600">✓ Active</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Chat API:</span>
                  <span className="font-mono text-green-600">✓ Active</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Last Update:</span>
                  <span className="font-mono text-xs">Now</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VoiceAssistant;