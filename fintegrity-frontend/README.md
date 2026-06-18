# Fintegrity Arayüzü (Frontend)

Fintegrity platformunun modern, responsive ve premium kullanıcı arayüzü. **React + Vite** altyapısıyla geliştirilmiştir. CSS tasarımı için **Vanilla CSS** ve modern görsel efektler (Glassmorphism, karanlık mod, TailwindCSS-like özel gridler, animasyonlar) kullanılmıştır.

## Temel Özellikler

1.  **Güvenli JWT Oturum Yönetimi:**
    *   Kullanıcı girişleri SQL Injection korumalı olup, backend tarafından dönülen JWT Access Token'ları güvenli bir şekilde `localStorage` üzerinde saklanır.
    *   Tüm API isteklerine `Authorization: Bearer <token>` başlığı (Axios Global Interceptors) aracılığıyla eklenir.
    *   Beni Hatırla (Remember Me) ve Kayıt Olma (Public Register) seçenekleri mevcuttur.
2.  **Akıllı Sözleşme Takip & Onay Ekranı:**
    *   `SmartAgreements.sol` kontratı ile entegre çalışır.
    *   Admin rolüne sahip kullanıcılar için "Onayla (Approve)" ve "Reddet (Reject)" butonları aktiftir ve işlemler on-chain yürütülür.
3.  **e-Dönüşüm Belgeleri Tablosu:**
    *   Sözleşmeler, belgeler ve anomali listeleri üzerinde etkileşimli sıralama (artan/azalan) yapılabilir.
    *   İşlemlerin bugün yapılması durumunda tarih yerine saat formatında gösterilmesi sağlanmıştır.
    *   Admin yetkili kullanıcılar için belge silme, onaylama ve reddetme butonları entegre edilmiştir.
4.  **Canlı İşlem Akışı ve TPS:**
    *   Saniyedeki işlem hızı (TPS), yerel blockchain blok işlem oranlarına göre anlık güncellenir.
    *   Boşta kalma veya yoğun işlem gönderimi durumunda grafikler ve istatistikler dinamik olarak değişir.

## Kullanım Kılavuzu

### 1. Bağımlılıkları Yükleme
```shell
npm install
```

### 2. Geliştirici Sunucusunu Çalıştırma
Uygulamayı lokalde başlatmak için:
```shell
npm run dev
```
Sunucu varsayılan olarak `http://localhost:5173` (veya kullanılabilir bir portta, örn. `5174`) çalışmaya başlayacaktır.

### 3. Build Alma
Production ortamı için optimize edilmiş build paketini hazırlamak için:
```shell
npm run build
```
