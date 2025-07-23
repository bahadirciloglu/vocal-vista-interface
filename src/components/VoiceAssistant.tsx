import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// API configuration
const ASSEMBLYAI_API_KEY = import.meta.env.VITE_ASSEMBLYAI_API_KEY;
const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000/chat';
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

// Universal-Streaming configuration
const UNIVERSAL_STREAMING_URL = 'wss://api.assemblyai.com/v2/realtime/transcribe';
const ASSEMBLYAI_UPLOAD_URL = 'https://api.assemblyai.com/v2/upload';
const ASSEMBLYAI_TRANSCRIPT_URL = 'https://api.assemblyai.com/v2/transcript';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type AssistantStatus = 'idle' | 'listening' | 'processing' | 'speaking';

const VoiceAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [showMicrophonePermission, setShowMicrophonePermission] = useState<boolean>(false);
  
  // Universal-Streaming refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Performance tracking
  const [latency, setLatency] = useState<number>(0);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    avgLatency: number;
    totalRequests: number;
    successRate: number;
    processingTime: number;
  }>({
    avgLatency: 0,
    totalRequests: 0,
    successRate: 100,
    processingTime: 0
  });

  // TTS metrics state
  const [ttsMetrics, setTtsMetrics] = useState<{
    latency: number;
    totalRequests: number;
    successRate: number;
    avgLatency: number;
  }>({
    latency: 0,
    totalRequests: 0,
    successRate: 100,
    avgLatency: 0
  });

  // Real-time performance metrics state
  const [realTimeMetrics, setRealTimeMetrics] = useState<{
    totalLatency: number;
    endToEndLatency: number;
    memoryUsage: number;
    cpuUsage: number;
  }>({
    totalLatency: 0,
    endToEndLatency: 0,
    memoryUsage: 0,
    cpuUsage: 0
  });

  // Backend metrics state
  const [backendMetrics, setBackendMetrics] = useState<{
    system: {
      memory_usage_percent: number;
      cpu_usage_percent: number;
      uptime_seconds: number;
      active_connections: number;
    };
    performance: {
      total_requests: number;
      success_rate_percent: number;
      avg_response_time_ms: number;
      min_response_time_ms: number;
      max_response_time_ms: number;
    };
  }>({
    system: {
      memory_usage_percent: 0,
      cpu_usage_percent: 0,
      uptime_seconds: 0,
      active_connections: 0
    },
    performance: {
      total_requests: 0,
      success_rate_percent: 100,
      avg_response_time_ms: 0,
      min_response_time_ms: 0,
      max_response_time_ms: 0
    }
  });

  // Fetch backend metrics
  const fetchBackendMetrics = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/metrics');
      if (response.ok) {
        const metrics = await response.json();
        setBackendMetrics(metrics);
        console.log('Backend metrics updated:', metrics);
      }
    } catch (err) {
      console.error('Failed to fetch backend metrics:', err);
    }
  }, []);

  // Reset metrics on component mount and fetch backend metrics
  useEffect(() => {
    setLatency(0);
    setPerformanceMetrics({
      avgLatency: 0,
      totalRequests: 0,
      successRate: 100,
      processingTime: 0
    });
    
    // Fetch initial backend metrics
    fetchBackendMetrics();
    
    // Set up interval to fetch metrics every 5 seconds
    const interval = setInterval(fetchBackendMetrics, 5000);
    
    return () => clearInterval(interval);
  }, [fetchBackendMetrics]);

  // Simple language detection based on common words
  const detectLanguage = (text: string): string => {
    const turkishWords = ['merhaba', 'nasıl', 'nerede', 'ne', 'kim', 'hangi', 'bu', 'şu', 'o', 'ben', 'sen', 'biz', 'siz', 'onlar', 'evet', 'hayır', 'teşekkür', 'lütfen', 'güzel', 'iyi', 'kötü', 'büyük', 'küçük'];
    const englishWords = ['hello', 'how', 'where', 'what', 'who', 'which', 'this', 'that', 'i', 'you', 'we', 'they', 'yes', 'no', 'thank', 'please', 'good', 'bad', 'big', 'small', 'can', 'will', 'would', 'could'];
    
    const lowerText = text.toLowerCase();
    let turkishCount = 0;
    let englishCount = 0;
    
    turkishWords.forEach(word => {
      if (lowerText.includes(word)) turkishCount++;
    });
    
    englishWords.forEach(word => {
      if (lowerText.includes(word)) englishCount++;
    });
    
    console.log(`Language detection: Turkish=${turkishCount}, English=${englishCount}`);
    
    if (turkishCount > englishCount) return 'tr';
    if (englishCount > turkishCount) return 'en';
    return 'auto'; // Default to auto-detection
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const handleMicToggle = () => {
    console.log('Mic button clicked, current state:', isListening);
    if (isListening) {
      stopListening();
    } else {
      // Check if this is the first time requesting microphone access
      if (!mediaStreamRef.current) {
        setShowMicrophonePermission(true);
      } else {
        startListening();
      }
    }
  };

  const startListening = async () => {
    try {
      console.log('Starting recording via button');
      setError(null);
      setStatus('listening');
      setIsListening(true);
      
      // Start end-to-end latency measurement
      const e2eStartTime = performance.now();
      sessionStorage.setItem('e2eStartTime', e2eStartTime.toString());
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      mediaStreamRef.current = stream;
      console.log('Microphone access granted');
      
      // Start recording with optimized settings
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
      };
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Audio data available:', event.data.size, 'bytes');
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstart = () => {
        console.log('Recording started successfully');
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('Recording error:', event);
        setError('Recording failed. Please try again.');
        setStatus('idle');
        setIsListening(false);
      };
      
      // Start recording with very small chunks for ultra-low latency
      mediaRecorder.start(50); // 50ms chunks for sub-300ms latency
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(`Microphone access failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('idle');
      setIsListening(false);
    }
  };

  const initializeUniversalStreaming = async () => {
    try {
      const startTime = performance.now();
      
      // Create WebSocket connection for Universal-Streaming
      const ws = new WebSocket(UNIVERSAL_STREAMING_URL);
      websocketRef.current = ws;
      
      ws.onopen = () => {
        console.log('Universal-Streaming WebSocket connected');
        
        // Send configuration
        ws.send(JSON.stringify({
          authorization: ASSEMBLYAI_API_KEY,
          sample_rate: 16000,
          language_code: 'tr',
          enable_partials: true,
          enable_entities: true,
          enable_sentiment: true
        }));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const endTime = performance.now();
        const currentLatency = endTime - startTime;
        
        console.log('Universal-Streaming response:', data);
        
        if (data.text) {
          setTranscription(data.text);
          
          // Update performance metrics
          setLatency(currentLatency);
          setPerformanceMetrics(prev => ({
            avgLatency: (prev.avgLatency * prev.totalRequests + currentLatency) / (prev.totalRequests + 1),
            totalRequests: prev.totalRequests + 1,
            successRate: prev.successRate,
            processingTime: prev.processingTime
          }));
          
          // If final result, process the complete transcription
          if (data.is_final) {
            console.log('Final transcription received:', data.text);
            processTranscription(data.text);
          }
        }
      };
      
      ws.onerror = (error) => {
        console.error('Universal-Streaming WebSocket error:', error);
        console.log('Falling back to standard STT API...');
        // Don't set error, just log it and continue with fallback
      };
      
      ws.onclose = () => {
        console.log('Universal-Streaming WebSocket closed');
      };
      
    } catch (err) {
      console.error('Error initializing Universal-Streaming:', err);
      console.log('Falling back to standard STT API...');
      // Don't set error, just log it and continue with fallback
    }
  };

  const stopListening = async () => {
    console.log('Stopping recording via button');
    
    const startTime = performance.now(); // Start performance measurement
    
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    setIsListening(false);
    setStatus('processing');
    
    // Process audio with fallback STT if Universal-Streaming didn't work
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      try {
        console.log('Processing audio with AssemblyAI STT...');
        
        // Upload audio file
        const uploadResponse = await fetch(ASSEMBLYAI_UPLOAD_URL, {
          method: 'POST',
          headers: {
            'Authorization': ASSEMBLYAI_API_KEY,
            'Content-Type': 'application/octet-stream'
          },
          body: audioBlob
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`);
        }
        
        const uploadData = await uploadResponse.json();
        console.log('Audio uploaded:', uploadData.upload_url);
        
        // Request transcription with optimized settings
        const transcriptResponse = await fetch(ASSEMBLYAI_TRANSCRIPT_URL, {
          method: 'POST', 
          headers: {
            'Authorization': ASSEMBLYAI_API_KEY,
            'Content-Type': 'application/json'
          },
                      body: JSON.stringify({
              audio_url: uploadData.upload_url,
              // Remove language_code to enable auto-detection
              punctuate: true,
              format_text: true,
              boost_param: 'high' // Faster processing
            })
        });
        
        if (!transcriptResponse.ok) {
          throw new Error(`Transcription failed: ${transcriptResponse.status}`);
        }
        
        const transcriptData = await transcriptResponse.json();
        console.log('Transcription response:', transcriptData);
        
        // Poll for completion
        let transcript = null;
        let attempts = 0;
        const maxAttempts = 10; // Reduced for faster response
        
        while (!transcript && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Check every 500ms
          attempts++;
          
          console.log(`Checking transcription status (attempt ${attempts})...`);
          
          const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}`, {
            headers: {
              'Authorization': ASSEMBLYAI_API_KEY
            }
          });
          
          if (!statusResponse.ok) {
            console.error('Status check failed:', statusResponse.status);
            continue;
          }
          
          const statusData = await statusResponse.json();
          console.log('Status:', statusData.status);
          
          if (statusData.status === 'completed') {
            transcript = statusData.text;
            console.log('Transcription completed:', transcript);
          } else if (statusData.status === 'error') {
            throw new Error(`Transcription error: ${statusData.error || 'Unknown error'}`);
          }
        }
        
        if (transcript) {
          const endTime = performance.now();
          const processingTime = endTime - startTime;
          
          // Update performance metrics
          setPerformanceMetrics(prev => ({
            ...prev,
            totalRequests: prev.totalRequests + 1,
            processingTime: processingTime,
            avgLatency: (prev.avgLatency * prev.totalRequests + processingTime) / (prev.totalRequests + 1)
          }));
          
          setLatency(Math.round(processingTime));
          console.log(`Processing completed in ${processingTime.toFixed(2)}ms`);
          
          await processTranscription(transcript);
        } else {
          throw new Error('Transcription timeout');
        }
      } catch (err) {
        console.error('Error in fallback STT:', err);
        setError('Speech recognition failed');
        setStatus('idle');
        
        // Update metrics for failed requests
        setPerformanceMetrics(prev => ({
          ...prev,
          totalRequests: prev.totalRequests + 1,
          successRate: ((prev.totalRequests * prev.successRate / 100) / (prev.totalRequests + 1)) * 100,
          processingTime: prev.processingTime,
          avgLatency: prev.avgLatency
        }));
      }
    }
  };

  const processTranscription = async (finalTranscription: string) => {
    try {
      console.log('Processing final transcription:', finalTranscription);
      
      if (!finalTranscription.trim()) {
        console.log('Empty transcription, skipping processing');
        setStatus('idle');
        return;
      }
      
      // Detect language of the transcription
      const detectedLanguage = detectLanguage(finalTranscription);
      console.log('Detected language:', detectedLanguage);
      
      // Add user message to chat
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: finalTranscription,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Send to chat API with language info
      console.log('Sending transcription to chat API...');
      const response = await sendToChatAPI(finalTranscription, detectedLanguage);
      
              if (response) {
          // Add assistant response to chat
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: response,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
          
          // Convert response to speech with detected language
          console.log('Converting response to speech...');
          await textToSpeech(response, detectedLanguage);
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
      console.log('Sending to Qloo+LLM API:', message);
      console.log('Detected language:', language);
      console.log('Chat history length:', messages.length);
      
      const requestBody = {
        guest_id: 'user123', // Sabit bir guest_id kullanıyoruz
        message,
        language // Send detected language to backend
      };
      
      console.log('Request body:', requestBody);
      console.log('API URL:', CHAT_API_URL);
      
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chat API error response:', response.status, errorText);
        throw new Error(`Chat API request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Chat API response:', data);
      
      if (!data.message) {
        console.warn('No message field in API response:', data);
        return 'Sorry, I received an unexpected response format.';
      }
      
      return data.message;
      
    } catch (err) {
      console.error('Chat API error:', err);
      return `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  };

  const textToSpeech = async (text: string, language: string = 'auto'): Promise<void> => {
    try {
      console.log('Starting TTS for text:', text);
      console.log('TTS language:', language);
      setStatus('speaking');
      
      const ttsStartTime = performance.now(); // Start TTS performance measurement
      
      if (!ELEVENLABS_API_KEY) {
        console.error('ElevenLabs API key not configured for TTS');
        setStatus('idle');
        setError('ElevenLabs API key not configured for TTS');
        return;
      }
      
      // Use ElevenLabs TTS API
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs TTS API error:', response.status, errorText);
        throw new Error(`TTS failed: ${response.status} ${errorText}`);
      }

      const audioBlob = await response.blob();
      console.log('TTS audio received:', audioBlob.size, 'bytes');
      
      if (audioBlob.size === 0) {
        throw new Error('Empty audio response from TTS API');
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onloadeddata = () => {
        console.log('TTS audio loaded successfully');
      };
      
      audio.onended = () => {
        console.log('TTS audio playback ended');
        setStatus('idle');
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = (error) => {
        console.error('TTS audio playback error:', error);
        setStatus('idle');
        URL.revokeObjectURL(audioUrl);
        setError(`TTS Playback Error: ${error}`);
      };
      
      if (!isMuted) {
        await audio.play();
        console.log('TTS audio playback started');
        
        // Update TTS metrics on success
        const ttsEndTime = performance.now();
        const ttsLatency = ttsEndTime - ttsStartTime;
        
        setTtsMetrics(prev => ({
          latency: ttsLatency,
          totalRequests: prev.totalRequests + 1,
          successRate: 100,
          avgLatency: (prev.avgLatency * prev.totalRequests + ttsLatency) / (prev.totalRequests + 1)
        }));
        
        // Calculate end-to-end latency
        const e2eStartTime = sessionStorage.getItem('e2eStartTime');
        if (e2eStartTime) {
          const e2eLatency = performance.now() - parseFloat(e2eStartTime);
          const totalLatency = performanceMetrics.processingTime + ttsLatency;
          
          setRealTimeMetrics({
            totalLatency: totalLatency,
            endToEndLatency: e2eLatency,
            memoryUsage: (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 0,
            cpuUsage: 0 // Browser doesn't provide CPU usage directly
          });
          
          console.log(`End-to-end latency: ${e2eLatency.toFixed(2)}ms`);
          console.log(`Total latency (STT + TTS): ${totalLatency.toFixed(2)}ms`);
        }
        
        console.log(`TTS completed in ${ttsLatency.toFixed(2)}ms`);
      } else {
        console.log('TTS audio muted, skipping playback');
        setStatus('idle');
        URL.revokeObjectURL(audioUrl);
      }
      
    } catch (err) {
      console.error('TTS error:', err);
      setStatus('idle');
      setError(`TTS Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Update TTS metrics on error
      setTtsMetrics(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + 1,
        successRate: ((prev.totalRequests * prev.successRate / 100) / (prev.totalRequests + 1)) * 100
      }));
      
      // Fallback to Web Speech API if ElevenLabs fails
      console.log('Falling back to Web Speech API...');
      await fallbackTextToSpeech(text);
    }
  };

  const fallbackTextToSpeech = async (text: string): Promise<void> => {
    try {
      console.log('Using fallback Web Speech API for TTS');
      
      if (!window.speechSynthesis) {
        console.warn('Speech synthesis not supported');
        return;
      }
      
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const turkishVoice = voices.find(voice => 
        voice.lang.includes('tr') || voice.lang.includes('TR')
      );
      
      if (turkishVoice) {
        utterance.voice = turkishVoice;
        console.log('Using Turkish voice:', turkishVoice.name);
      }
      
      utterance.onend = () => {
        console.log('Fallback TTS ended');
        setStatus('idle');
      };
      
      utterance.onerror = (event) => {
        console.error('Fallback TTS error:', event.error);
        setStatus('idle');
      };
      
      if (!isMuted) {
        window.speechSynthesis.speak(utterance);
        console.log('Fallback TTS started');
      } else {
        setStatus('idle');
      }
      
    } catch (err) {
      console.error('Fallback TTS error:', err);
      setStatus('idle');
    }
  };

  const getStatusColor = (currentStatus: AssistantStatus) => {
    switch (currentStatus) {
      case 'listening': return 'bg-listening text-white';
      case 'processing': return 'bg-processing text-white';
      case 'speaking': return 'bg-speaking text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (currentStatus: AssistantStatus) => {
    switch (currentStatus) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Processing...';
      case 'speaking': return 'Speaking...';
      default: return 'Ready';
    }
  };

  const getMicButtonClass = () => {
    if (status === 'listening') return 'mic-listening bg-listening border-listening text-white hover:bg-listening/90';
    if (status === 'processing') return 'mic-processing bg-processing border-processing text-white';
    return 'bg-primary border-primary text-primary-foreground hover:bg-primary/90';
  };

  return (
    <div className="h-screen flex flex-col bg-background" role="application" aria-label="Voice Assistant">
      {/* Header */}
      <header className="border-b bg-card p-4 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">AssemblyAI Voice Agent</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className={`px-3 py-1 font-medium transition-colors ${getStatusColor(status)}`}
              aria-live="polite"
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${
                status === 'listening' ? 'bg-white animate-pulse' :
                status === 'processing' ? 'bg-white animate-spin' :
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
        
        {/* Left Column - Frontend Metrics */}
        <div className="w-80 flex-shrink-0">
          <Card className="p-4 h-full">
            <h3 className="text-lg font-semibold mb-4 text-blue-600">Frontend Metrics</h3>
            
            {/* AssemblyAI STT Metrics */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">AssemblyAI STT</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>STT Latency:</span>
                  <span className="font-mono">{latency.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg STT:</span>
                  <span className="font-mono">{performanceMetrics.avgLatency.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Requests:</span>
                  <span className="font-mono">{performanceMetrics.totalRequests}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Success Rate:</span>
                  <span className="font-mono">{performanceMetrics.successRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* ElevenLabs TTS Metrics */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">ElevenLabs TTS</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>TTS Latency:</span>
                  <span className="font-mono">{ttsMetrics.latency.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg TTS:</span>
                  <span className="font-mono">{ttsMetrics.avgLatency.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TTS Requests:</span>
                  <span className="font-mono">{ttsMetrics.totalRequests}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TTS Success:</span>
                  <span className="font-mono">{ttsMetrics.successRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Real-time Performance */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Real-time Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Latency:</span>
                  <span className="font-mono">{realTimeMetrics.totalLatency.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>End-to-End:</span>
                  <span className="font-mono">{realTimeMetrics.endToEndLatency.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Memory Usage:</span>
                  <span className="font-mono">{realTimeMetrics.memoryUsage}MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>CPU Usage:</span>
                  <span className="font-mono">{realTimeMetrics.cpuUsage}%</span>
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
                  <p className="text-lg font-medium">Welcome to AssemblyAI Voice Agent</p>
                  <p className="text-sm">Click the microphone button to start speaking</p>
                  <div className="mt-4 flex justify-center">
                    <Badge variant="outline" className="text-xs">
                      Universal-Streaming Enabled
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

          {/* Real-time Transcription Display */}
          {transcription && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Real-time:</span> {transcription}
              </p>
            </div>
          )}

          {/* Voice Control */}
          <Card className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Button
                size="lg"
                onClick={handleMicToggle}
                disabled={status === 'processing'}
                className={`w-20 h-20 rounded-full p-0 transition-all duration-200 ${getMicButtonClass()}`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                <Mic className="h-8 w-8" />
              </Button>
              
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {isListening ? 'Click to stop' : 'Click to start recording'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Backend Metrics */}
        <div className="w-80 flex-shrink-0">
          <Card className="p-4 h-full">
            <h3 className="text-lg font-semibold mb-4 text-green-600">Backend Metrics</h3>
            
            {/* System Metrics */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">System</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Memory Usage:</span>
                  <span className="font-mono">{typeof backendMetrics.system.memory_usage_percent === 'number' ? backendMetrics.system.memory_usage_percent.toFixed(1) + '%' : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>CPU Usage:</span>
                  <span className="font-mono">{typeof backendMetrics.system.cpu_usage_percent === 'number' ? backendMetrics.system.cpu_usage_percent.toFixed(1) + '%' : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Uptime:</span>
                  <span className="font-mono">{typeof backendMetrics.system.uptime_seconds === 'number' ? backendMetrics.system.uptime_seconds.toFixed(1) + 's' : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Active Connections:</span>
                  <span className="font-mono">{typeof backendMetrics.system.active_connections === 'number' ? backendMetrics.system.active_connections : '-'}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Requests:</span>
                  <span className="font-mono">{typeof backendMetrics.performance.total_requests === 'number' ? backendMetrics.performance.total_requests : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Success Rate:</span>
                  <span className="font-mono">{typeof backendMetrics.performance.success_rate_percent === 'number' ? backendMetrics.performance.success_rate_percent.toFixed(1) + '%' : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Response:</span>
                  <span className="font-mono">{typeof backendMetrics.performance.avg_response_time_ms === 'number' ? backendMetrics.performance.avg_response_time_ms.toFixed(0) + 'ms' : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Min/Max:</span>
                  <span className="font-mono">{typeof backendMetrics.performance.min_response_time_ms === 'number' && typeof backendMetrics.performance.max_response_time_ms === 'number' ? backendMetrics.performance.min_response_time_ms.toFixed(0) + '/' + backendMetrics.performance.max_response_time_ms.toFixed(0) + 'ms' : '-'}</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Backend:</span>
                  <Badge variant="outline" className="text-xs">
                    {backendMetrics.performance.total_requests > 0 ? 'Active' : 'Idle'}
                  </Badge>
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