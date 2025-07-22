# Environment Variables

Bu proje için gerekli environment variables'ları ayarlamak için:

## 1. .env.local Dosyası Oluşturun

Proje kök dizininde `.env.local` dosyası oluşturun:

```bash
# AssemblyAI API Key
VITE_ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here

# Backend API URL
VITE_CHAT_API_URL=http://localhost:8000/api/chat

# AssemblyAI WebSocket URL for real-time streaming
VITE_ASSEMBLYAI_WS_URL=wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000
```

## 2. AssemblyAI API Key Alın

1. [AssemblyAI](https://www.assemblyai.com/) sitesine gidin
2. Ücretsiz hesap oluşturun
3. Dashboard'dan API key'inizi kopyalayın
4. `.env.local` dosyasındaki `VITE_ASSEMBLYAI_API_KEY` değerini güncelleyin

## 3. Backend API URL

Eğer backend'iniz farklı bir port'ta çalışıyorsa, `VITE_CHAT_API_URL` değerini güncelleyin.

## 4. Güvenlik Notları

- `.env.local` dosyası otomatik olarak `.gitignore`'da bulunur
- API key'lerinizi asla GitHub'a yüklemeyin
- Production'da environment variables'ları güvenli bir şekilde yönetin

## 5. Test Etme

Environment variables'ları ayarladıktan sonra:

```bash
npm run dev
```

Uygulamayı çalıştırın ve mikrofon butonuna tıklayarak ses kaydını test edin. 