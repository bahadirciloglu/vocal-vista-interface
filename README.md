# AssemblyAI Batch STT Voice Assistant

Modern bir sesli asistan uygulaması - AssemblyAI'nin batch (dosya yükleme) API'si ile yüksek kaliteli konuşma tanıma.

## 🚀 Özellikler

- **AssemblyAI Batch STT**: Yüksek kaliteli konuşma tanıma
- **Gerçek zamanlı ses kaydı**: Web Audio API ile optimize edilmiş kayıt
- **Çok dilli destek**: Türkçe ve İngilizce otomatik dil algılama
- **Modern UI**: React + TypeScript + Tailwind CSS
- **Progress tracking**: Yükleme ve işleme durumu takibi
- **Web Speech API TTS**: Yerleşik metin-konuşma dönüşümü

## 🏗️ Mimari

```
Frontend (React + TypeScript)
├── VoiceAssistant.tsx     # Ana sesli asistan bileşeni
├── utils/audioUtils.ts    # Ses kaydı ve API utility'leri
└── components/ui/         # Shadcn/ui bileşenleri

Backend (Python + Flask)
├── backend_server.py      # Ana Flask sunucusu
├── /api/assemblyai-batch-transcribe  # Batch STT endpoint'i
├── /chat                  # Chat API endpoint'i
└── /metrics               # Sistem metrikleri
```

## 📋 Gereksinimler

- Node.js 18+
- Python 3.8+
- AssemblyAI API anahtarı

## 🛠️ Kurulum

### 1. Bağımlılıkları yükleyin

```bash
# Frontend bağımlılıkları
npm install

# Backend bağımlılıkları
pip install flask flask-cors requests python-dotenv openai psutil
```

### 2. Environment değişkenlerini ayarlayın

`.env.local` dosyası oluşturun:

```env
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here  # Opsiyonel
```

### 3. Backend'i başlatın

```bash
python backend_server.py
```

Backend http://localhost:8000 adresinde çalışacak.

### 4. Frontend'i başlatın

```bash
npm run dev
```

Frontend http://localhost:5173 adresinde çalışacak.

## 🎤 Kullanım

1. **Mikrofon izni verin**: İlk kullanımda tarayıcı mikrofon erişimi isteyecek
2. **Kayıt başlatın**: Mikrofon butonuna tıklayarak kayıt başlatın
3. **Konuşun**: Net ve anlaşılır konuşun
4. **Kayıt durdurun**: Tekrar butona tıklayarak kaydı durdurun
5. **Sonucu görün**: AssemblyAI batch API'si sesi transkript edecek

## 🔧 API Endpoint'leri

### AssemblyAI Batch STT
```
POST /api/assemblyai-batch-transcribe
Content-Type: application/json

{
  "audio": "base64_encoded_audio_data",
  "language": "auto|tr|en"
}
```

### Chat API
```
POST /chat
Content-Type: application/json

{
  "guest_id": "user123",
  "message": "transcribed_text",
  "language": "auto|tr|en"
}
```

### Metrics
```
GET /metrics
```

## 🧪 Test

Batch STT endpoint'ini test etmek için:

```bash
python test_assemblyai_batch.py
```

## 📊 Performans

- **Ses kalitesi**: 16kHz, mono, WebM/Opus formatı
- **Yükleme süresi**: Dosya boyutuna bağlı (genellikle 1-5 saniye)
- **Transkripsiyon süresi**: AssemblyAI batch API'sine bağlı (genellikle 10-30 saniye)
- **Toplam gecikme**: ~15-35 saniye (yüksek kalite için)

## 🔍 Hata Ayıklama

### Yaygın Sorunlar

1. **Mikrofon erişimi reddedildi**
   - Tarayıcı ayarlarından mikrofon iznini kontrol edin
   - HTTPS üzerinden çalıştığınızdan emin olun

2. **AssemblyAI API hatası**
   - API anahtarınızın doğru olduğunu kontrol edin
   - API kotanızı kontrol edin

3. **Backend bağlantı hatası**
   - Backend sunucusunun çalıştığını kontrol edin
   - Port 8000'in açık olduğunu kontrol edin

### Log'ları kontrol edin

```bash
# Backend log'ları
python backend_server.py

# Frontend log'ları (browser console)
F12 > Console
```

## 🚀 Geliştirme

### Yeni özellik ekleme

1. Frontend'de yeni bileşen oluşturun
2. Backend'de gerekli endpoint'i ekleyin
3. API utility'lerini güncelleyin
4. Test edin

### Stil değişiklikleri

```bash
# Tailwind CSS'i yeniden derleyin
npm run build
```

## 📝 Lisans

MIT License

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 Destek

Sorunlar için GitHub Issues kullanın veya iletişime geçin.
