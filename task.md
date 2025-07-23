AssemblyAI Voice Assistant – Feature Test & Development Checklist
1. Temel Fonksiyonlar (Basit)
[x] Uygulama ana sayfası açılıyor mu?
[x] Konuşma penceresi (chat window) ekranda görünüyor mu?
[x] Mikrofon butonu ekranda ve tıklanabilir mi?
[x] Durum göstergesi (Listening/Processing/Speaking) doğru şekilde değişiyor mu?
[x] Gerçek zamanlı transkript alanı çalışıyor mu?
[x] Kullanıcıdan ses kaydı alınabiliyor mu?
[x] API anahtarları ve endpoint environment variable olarak yönetiliyor mu?
2. Orta Seviye Fonksiyonlar
[x] Mikrofon ile sesli komut verildiğinde, AssemblyAI STT API’sine istek atılıyor mu?
[x] Kullanıcı konuşması doğru şekilde metne çevriliyor mu?
[x] Metin, /chat endpoint’ine gönderilip LLM’den yanıt alınıyor mu?
[x] LLM yanıtı ekranda doğru şekilde gösteriliyor mu?
[x] LLM yanıtı AssemblyAI TTS API’sine gönderilip sesli yanıt oynatılıyor mu?
[x] Kullanıcı ve asistan mesajları chat penceresinde doğru sırada ve baloncuklarla gösteriliyor mu?
[x] Hatalı API yanıtlarında kullanıcıya açık hata mesajı gösteriliyor mu?
3. İleri Seviye ve Yarışma Kurallarına Uygunluk
[ ] Erişilebilirlik: Klavye ile tüm butonlara ve alanlara erişilebiliyor mu?
[ ] Erişilebilirlik: Screen reader ile uygulama kullanılabiliyor mu?
[x] Yüksek kontrast ve okunabilirlik sağlanıyor mu?
[x] Mobil ve masaüstü uyumluluğu (responsive design) test edildi mi?
[ ] Kullanıcı deneyimi: Akışta gecikme <1s (ideali <300ms) sağlanıyor mu?
[x] Kullanıcı deneyimi: Durum göstergeleri ve animasyonlar sezgisel mi?
[x] Yaratıcılık: Uygulamada eklenen özgün/yaratıcı bir özellik var mı? (örn. kişiselleştirilmiş öneri, özel animasyon, ek API entegrasyonu)
[x] Çoklu dil desteği (varsa) test edildi mi?
[x] Kullanıcı ve geliştirici dokümantasyonu güncel ve erişilebilir mi?
[x] CI/CD pipeline ile otomatik test ve deploy çalışıyor mu?
4. Ekstra (Opsiyonel)
[ ] Analytics ve logging dashboard entegre edildi mi?
[ ] Gerçek kullanıcı testleriyle geri bildirim toplandı mı?
[ ] Demo ve sunum materyalleri hazırlandı mı?


# Yapılacaklar (Güncel Liste)

- [ ] Erişilebilirlik: Klavye ile tüm butonlara ve alanlara erişim (tabindex, aria-label, vs.)
- [ ] Erişilebilirlik: Screen reader ile tam uyumluluk
- [ ] Akışta gecikme optimizasyonu (<1s, ideali <300ms)
- [ ] Analytics ve logging dashboard entegrasyonu
- [ ] Gerçek kullanıcı testleri ve geri bildirim
- [ ] Demo ve sunum materyallerinin hazırlanması
- [ ] (Varsa) Eksik API endpointlerinin tamamlanması ve test edilmesi
- [ ] Son kullanıcı ve geliştirici dokümantasyonunun güncellenmesi
