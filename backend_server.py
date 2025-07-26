#!/usr/bin/env python3
"""
Voice Assistant Backend
Token generation and API proxy for frontend
Supports both AssemblyAI and OpenAI Whisper
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
import tempfile
import base64
import psutil
import time
import openai
import json

# Load environment variables
load_dotenv('.env.local')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# API Keys from environment
ASSEMBLYAI_API_KEY = os.getenv('ASSEMBLYAI_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Configure OpenAI
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

@app.route('/api/assemblyai-token', methods=['POST'])
def get_assemblyai_token():
    """Generate temporary token for AssemblyAI Real-time API"""
    try:
        if not ASSEMBLYAI_API_KEY:
            return jsonify({'error': 'AssemblyAI API key not configured'}), 500
        
        # Get temporary token from AssemblyAI (Universal-Streaming v3)
        response = requests.get(
            'https://streaming.assemblyai.com/v3/token',
            headers={'Authorization': ASSEMBLYAI_API_KEY},
            params={'expires_in_seconds': 600}  # 10 minutes
        )
        
        if response.status_code == 200:
            token_data = response.json()
            return jsonify(token_data)
        else:
            return jsonify({'error': f'Token generation failed: {response.status_code}'}), response.status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/assemblyai-batch-transcribe', methods=['POST'])
def assemblyai_batch_transcribe():
    """Transcribe audio using AssemblyAI Batch API"""
    try:
        if not ASSEMBLYAI_API_KEY:
            return jsonify({'error': 'AssemblyAI API key not configured'}), 500
        
        # Get audio data from request
        data = request.json
        audio_base64 = data.get('audio')
        language = data.get('language', 'auto')
        
        if not audio_base64:
            return jsonify({'error': 'No audio data provided'}), 400
        
        print(f"🎤 AssemblyAI Batch: Starting transcription, language: {language}")
        
        # Decode base64 audio
        audio_data = base64.b64decode(audio_base64)
        print(f"📊 AssemblyAI Batch: Decoded audio size: {len(audio_data)} bytes")
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name
        
        print(f"📁 AssemblyAI Batch: Saved to temp file: {temp_file_path}")
        
        try:
            # Step 1: Upload audio file to AssemblyAI
            print("📤 AssemblyAI Batch: Uploading audio file...")
            upload_url = "https://api.assemblyai.com/v2/upload"
            
            with open(temp_file_path, 'rb') as audio_file:
                upload_response = requests.post(
                    upload_url,
                    headers={'Authorization': ASSEMBLYAI_API_KEY},
                    data=audio_file
                )
            
            print(f"📤 AssemblyAI Batch: Upload response status: {upload_response.status_code}")
            print(f"📤 AssemblyAI Batch: Upload response: {upload_response.text}")
            
            if upload_response.status_code != 200:
                return jsonify({'error': f'Upload failed: {upload_response.status_code} - {upload_response.text}'}), 500
            
            upload_url_response = upload_response.json()
            audio_url = upload_url_response['upload_url']
            print(f"✅ AssemblyAI Batch: Audio uploaded successfully: {audio_url[:50]}...")
            
            # Step 2: Submit transcription request
            print("🔄 AssemblyAI Batch: Submitting transcription request...")
            transcript_url = "https://api.assemblyai.com/v2/transcript"
            
            # Configure transcription parameters
            transcript_request = {
                "audio_url": audio_url
            }
            
            # Add optional parameters only if specified
            if language != 'auto':
                transcript_request["language_code"] = language
            
            print(f"🔄 AssemblyAI Batch: Request payload: {json.dumps(transcript_request, indent=2)}")
            
            transcript_response = requests.post(
                transcript_url,
                headers={
                    'Authorization': ASSEMBLYAI_API_KEY,
                    'Content-Type': 'application/json'
                },
                json=transcript_request
            )
            
            print(f"🔄 AssemblyAI Batch: Transcription response status: {transcript_response.status_code}")
            print(f"🔄 AssemblyAI Batch: Transcription response: {transcript_response.text}")
            
            if transcript_response.status_code != 200:
                return jsonify({'error': f'Transcription request failed: {transcript_response.status_code} - {transcript_response.text}'}), 500
            
            transcript_data = transcript_response.json()
            transcript_id = transcript_data['id']
            print(f"✅ AssemblyAI Batch: Transcription submitted, ID: {transcript_id}")
            
            # Step 3: Poll for completion
            print("⏳ AssemblyAI Batch: Polling for completion...")
            polling_url = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
            
            max_attempts = 60  # 5 minutes max (5 second intervals)
            attempts = 0
            
            while attempts < max_attempts:
                polling_response = requests.get(
                    polling_url,
                    headers={'Authorization': ASSEMBLYAI_API_KEY}
                )
                
                if polling_response.status_code != 200:
                    return jsonify({'error': f'Polling failed: {polling_response.status_code}'}), 500
                
                status_data = polling_response.json()
                status = status_data['status']
                
                print(f"📊 AssemblyAI Batch: Status: {status} (attempt {attempts + 1})")
                
                if status == 'completed':
                    # Extract transcript
                    transcript = status_data.get('text', '')
                    confidence = status_data.get('confidence', 0)
                    
                    print(f"✅ AssemblyAI Batch: Transcription completed!")
                    print(f"📝 Transcript: {transcript[:100]}...")
                    print(f"🎯 Confidence: {confidence:.2f}")
                    
                    return jsonify({
                        'transcript': transcript,
                        'confidence': confidence,
                        'language': language,
                        'model': 'assemblyai-batch',
                        'transcript_id': transcript_id
                    })
                
                elif status == 'error':
                    error_msg = status_data.get('error', 'Unknown error')
                    return jsonify({'error': f'Transcription failed: {error_msg}'}), 500
                
                # Wait 5 seconds before next poll
                time.sleep(5)
                attempts += 1
            
            return jsonify({'error': 'Transcription timeout'}), 408
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        print(f"💥 AssemblyAI Batch: Exception: {str(e)}")
        return jsonify({'error': f'AssemblyAI batch transcription failed: {str(e)}'}), 500

@app.route('/api/whisper-transcribe', methods=['POST'])
def whisper_transcribe():
    """Transcribe audio using OpenAI Whisper API"""
    try:
        if not OPENAI_API_KEY:
            return jsonify({'error': 'OpenAI API key not configured'}), 500
        
        # Get audio data from request
        data = request.json
        audio_base64 = data.get('audio')
        language = data.get('language', 'auto')
        
        if not audio_base64:
            return jsonify({'error': 'No audio data provided'}), 400
        
        # Decode base64 audio
        audio_data = base64.b64decode(audio_base64)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name
        
        try:
            # Transcribe with Whisper
            with open(temp_file_path, 'rb') as audio_file:
                transcript = openai.Audio.transcribe(
                    model="whisper-1",
                    file=audio_file,
                    language=language if language != 'auto' else None,
                    response_format="text"
                )
            
            return jsonify({
                'transcript': transcript,
                'language': language,
                'model': 'whisper-1'
            })
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        return jsonify({'error': f'Whisper transcription failed: {str(e)}'}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """
    Chat endpoint for qloo+llm integration
    """
    try:
        data = request.json
        message = data.get('message', '')
        language = data.get('language', 'auto')
        
        print(f"💬 Backend: Chat request - Message: {message[:50]}..., Language: {language}")
        
        # TODO: Integrate with qloo+llm backend
        # For now, return a simple response
        response = {
            "response": f"Backend received: {message}",
            "language": language,
            "timestamp": time.time()
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"💥 Backend: Exception in chat endpoint: {str(e)}")
        return jsonify({"error": f"Chat error: {str(e)}"}), 500

@app.route('/metrics', methods=['GET'])
def get_metrics():
    """
    System and performance metrics
    """
    try:
        # System metrics
        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=1)
        
        metrics = {
            "system": {
                "memory_usage_percent": round(memory.percent, 1),
                "memory_available_gb": round(memory.available / (1024**3), 2),
                "cpu_usage_percent": round(cpu_percent, 1),
                "uptime_seconds": time.time(),
                "active_connections": 0
            },
            "performance": {},
            "language_usage": {},
            "intent_usage": {},
            "recent_requests": []
        }
        
        return jsonify(metrics)
        
    except Exception as e:
        return jsonify({"error": f"Metrics error: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": time.time(),
        "services": {
            "assemblyai": bool(ASSEMBLYAI_API_KEY),
            "openai": bool(OPENAI_API_KEY)
        }
    })

if __name__ == '__main__':
    print("🚀 Starting Voice Assistant Backend...")
    print(f"🔑 AssemblyAI API Key: {ASSEMBLYAI_API_KEY[:10] if ASSEMBLYAI_API_KEY else 'Not configured'}...")
    print(f"🔑 OpenAI API Key: {OPENAI_API_KEY[:10] if OPENAI_API_KEY else 'Not configured'}...")
    print("📡 Available endpoints:")
    print("  - POST /api/assemblyai-token - Get AssemblyAI token")
    print("  - POST /api/assemblyai-batch-transcribe - Transcribe with AssemblyAI Batch API")
    print("  - POST /api/whisper-transcribe - Transcribe with OpenAI Whisper")
    print("  - POST /chat - Chat with qloo+llm")
    print("  - GET /metrics - System metrics")
    print("  - GET /health - Health check")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=8000, debug=True) 