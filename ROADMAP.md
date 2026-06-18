# 🗺️ Fintegrity Geliştirme Yol Haritası (Roadmap)

Fintegrity, e-Dönüşüm süreçlerini (e-Fatura, e-İrsaliye, e-Sözleşme) blockchain teknolojisiyle immutable hale getiren ve Makine Öğrenmesi (ML) modelleriyle anomali tespiti yapan bütünleşik bir finansal entegrasyon platformudur. 

Bu staj çalışması kapsamında proje, **Basit bir Mock/Demo prototipinden, gerçek teknik karşılıkları olan güvenilir bir MVP (Minimum Viable Product) seviyesine** taşınmıştır.

---

## ⚡ Staj Kapsamında Tamamlanan Çalışmalar (MVP)

### 1. e-Dönüşüm & Veri Yönetimi
* **e-Belge Yönetimi:** e-Fatura, e-İrsaliye, e-Sözleşme ve e-Makbuz belgelerinin oluşturulması, listelenmesi, onaylanması ve silinmesi süreçleri.
* **Role-Based Access Control (RBAC):** `admin` ve `user` rolleri. Kullanıcılar sadece kendi oluşturdukları belgeleri görebilirken, Admin tüm sistemi yönetebilir ve belgeleri silebilir/onaylayabilir.

### 2. Blockchain Entegrasyonu (EVM & Web3.py)
* **FintegrityCore (Solidity):** Belge hash'lerinin ve metadata bilgilerinin zincir üzerinde saklanmasını sağlayan akıllı sözleşme.
* **SmartAgreements (Solidity):** Sözleşmelerin yaşam döngüsünü (Oluşturma -> Onay -> Tamamlama) zincir üzerinde işleten iş akışı kontratı.
* **Zincirde Doğrulama (Verification):** Kullanıcının arayüzdeki tek butonla veritabanı hash'i ile akıllı kontrattaki hash kaydını gerçek zamanlı karşılaştırması ve doğrulaması.
* **Canlı Ağ Metrikleri:** Blok zincir bağlantı durumu, son blok numarası, gaz (gas) fiyatı ve akıllı kontrat adreslerinin dinamik takibi.

### 3. Yapay Zeka & Anomali Tespiti (Scikit-Learn)
* **IsolationForest Modeli:** Harcama limitleri ve işlem hacimlerini analiz ederek anormallikleri tespit eden ML modeli.
* **TF-IDF + LogisticRegression:** Belge içerik metinlerinden tür (Fatura, İrsaliye, Sözleşme) tespiti yapan sınıflandırıcı.
* **Yapay Zeka Eğitim Hattı (ML Pipeline):** Modellerin yerel CSV verileri ile eğitilmesi, pickle dosyası olarak kaydedilmesi ve sunucu başlatılırken diskten yüklenmesi. Model dosyalarının eksik olması durumunda in-memory eğitim ile kesintisiz çalışma.
* **Açıklanabilir AI (XAI):** Tespit edilen anomalinin nedenini (gerekçe) ve önerilen aksiyonu açıklayan akıllı çıktı mekanizması.

### 4. Profesyonel Altyapı & Testler
* **JWT & Bearer Auth:** API endpoint'lerinin güvenliği JWT token'ları ile sağlanmış ve frontend tarafında axios header entegrasyonu tamamlanmıştır.
* **Merkezi Config & Env:** Tüm localhost bağlantıları merkezi `config.js` ve `.env` dosyalarına taşınarak esnek deployment altyapısı kurulmuştur.
* **Makefile Altyapısı:** Kurulum, test ve geliştirme süreçlerini tek komutla çalıştıran script otomasyonu.
* **API Test Suite:** FastAPI API endpoint'lerini otomatik olarak test eden 10 adet pytest test senaryosu.
* **Çoklu Dil Desteği (Language Switcher):** Giriş ekranı dahil tüm uygulama arayüzünün, alertlerin, log mesajlarının, grafik gün isimlerinin, modalların ve CSV çıktılarının TR/EN dillerinde dinamik yerelleştirilmesi.

---

## 🚀 Gelecek Geliştirme Planları (Future Roadmap)

### Kısa Vade (1 - 3 Ay)
1. **Veritabanı Migrasyonu:** SQLite yerine üretim ortamına hazır PostgreSQL entegrasyonu ve schema migrasyonları için Alembic kullanımı.
2. **Dockerization:** Tüm servislerin (FastAPI, React, Hardhat Node) `docker-compose.yml` ile tek komutla ayağa kaldırılabilmesi.
3. **Audit Log İnceleme Arayüzü:** Yönetici panelinde, backend tarafında tutulan denetim loglarının (Audit Logs) filtrelenerek görselleştirileceği gelişmiş bir izleme sayfası tasarımı.

### Orta Vade (3 - 6 Ay)
1. **Özel Blockchain Ağı (Private Consortium Network):** Hardhat yerel node'u yerine Hyperledger Fabric veya özel bir Ethereum PoA (Proof of Authority) ağ geçidi kurulumu.
2. **Zaman Serisi Analizi (LSTM/RNN):** Fatura tutarlarının yanı sıra, zaman içindeki işlem sıklığı ve mevsimsellik trendlerini yakalamak için Derin Öğrenme (Deep Learning) modellerinin entegrasyonu.
3. **OCR Entegrasyonu:** PDF ve taranmış fatura görsellerinden Tesseract OCR veya Google Cloud Vision API kullanarak otomatik metin çıkarma ve sınıflandırma.

### Uzun Vade (6+ Ay)
1. **RegTech & Uyumluluk Modülü:** GİB (Gelir İdaresi Başkanlığı) e-belge standartlarına tam uyumluluk ve otomatik vergi beyannamesi doğrulama entegrasyonu.
2. **Çoklu İmza (Multi-Sig) Cüzdan Desteği:** Sözleşmelerin onaylanma aşamasında MetaMask / WalletConnect entegrasyonu ile yöneticilerin kendi cüzdanlarıyla kriptografik imza atması.
3. **Gerçek Zamanlı Güncellemeler:** Sistemdeki anomali tespitleri ve blockchain onayları için WebSocket tabanlı anlık bildirim kanalları.
