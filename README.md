# 🛡️ Fintegrity — Blockchain ve Yapay Zeka Destekli Finansal Entegrasyon Platformu

> Staj projesi kapsamında geliştirilmiş MVP/prototip seviyesinde bir finansal entegrasyon platformu.

## 📋 Proje Hakkında

Fintegrity, e-dönüşüm süreçlerini (e-Fatura, e-İrsaliye, e-Sözleşme) blockchain teknolojisi ile güvence altına alan ve yapay zeka ile anomali tespiti yapan bir platformdur.

### Temel Özellikler
- 🏡 **Giriş Öncesi Karşılama / Ana Sayfa (Landing Page)** — Giriş yapmadan önce kullanıcıyı karşılayan, platform özellikleri ve blockchain canlı ağ istatistiklerini (belge sayısı, TPS, anomali vb.) sunan görsel olarak premium giriş kapısı.
- 📄 **e-Dönüşüm Belge Yönetimi** — e-Fatura, e-İrsaliye, e-Sözleşme, e-Makbuz yönetimi.
- 🔗 **Blockchain Kayıt & Doğrulama** — Belge hash'leri Ethereum uyumlu zincire yazılır ve "Zincirde Doğrula" butonu ile gerçek zamanlı doğrulanır.
- 📜 **Akıllı Sözleşme İş Akışı** — Oluştur → Onayla → Tamamla lifecycle akışı.
- 🤖 **AI Anomali Tespiti & Açıklanabilirlik (XAI)** — IsolationForest ile şüpheli işlem tespiti, gerekçe ve aksiyon önerileri.
- 📊 **AI Doküman Sınıflandırma** — TF-IDF + LogisticRegression ile otomatik metin sınıflandırma.
- 🧠 **Yapay Zeka Eğitim Hattı (ML Pipeline)** — Modellerin yerel CSV verileri ile eğitilmesi, diskte `.pkl` formatında saklanması veya in-memory fallback ile yüklenmesi (`make train-ai`).
- 🔐 **JWT Tabanlı Yetkilendirme & Rol İzolasyonu** — Admin ve kullanıcı rolleri ile veri ve yetki izolasyonu (RBAC).
- 📈 **Canlı Dashboard** — Gerçek zamanlı istatistikler, blockchain TPS ve detaylı ağ metrikleri.
- 🌐 **Çoklu Dil Desteği (TR/EN)** — Dinamik TR/EN dil seçici ile karşılama ekranı ve giriş ekranı dahil tüm arayüz, modallar, formlar, alert bildirimleri ve grafiklerin yerelleştirilmesi.

## 🏗️ Mimari

```
fintegrity-staj/
├── backend/                 # FastAPI Backend (Python)
│   ├── app/
│   │   ├── ai_module/       # ML modelleri, CSV veri kümeleri ve eğitim hattı (train.py)
│   │   │   ├── models/      # Kaydedilmiş model pickle dosyaları (git-ignored)
│   │   │   └── sample_data/ # Model eğitimi için sentetik/örnek veri kümeleri
│   │   ├── api/
│   │   │   └── routes/      # API endpoint'leri (auth, documents, contracts, anomalies, stats, audit)
│   │   ├── blockchain_client.py  # Web3.py entegrasyonu
│   │   ├── config.py        # Environment config
│   │   └── database.py      # SQLAlchemy modelleri ve AuditLog tanımları
│   ├── main.py              # FastAPI uygulama giriş noktası
│   ├── requirements.txt     # Python bağımlılıkları
│   └── .env                 # Environment variables
├── blockchain/              # Solidity Smart Contracts
│   ├── contracts/
│   │   ├── FintegrityCore.sol      # Belge hash kayıt kontratı
│   │   └── SmartAgreements.sol     # Akıllı sözleşme kontratı
│   ├── test/                # Hardhat test suite (9 test)
│   └── scripts/deploy.ts    # Deployment script
├── fintegrity-frontend/     # React Frontend (Vite)
│   └── src/
│       ├── components/      # Dashboard bileşeni
│       └── pages/           # Sayfa bileşenleri
├── Makefile                 # Proje komutları
└── README.md                # Bu dosya
```

## 🛠️ Teknoloji Stack

| Katman | Teknoloji |
|--------|----------|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy, SQLite |
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Framer Motion, Recharts |
| **Blockchain** | Solidity ^0.8.20, Hardhat 3, Web3.py, ethers.js |
| **AI/ML** | scikit-learn (IsolationForest, LogisticRegression, TF-IDF) |
| **Auth** | JWT (PyJWT), bcrypt |

## 🚀 Kurulum

### Ön Gereksinimler
- Python 3.11+
- Node.js 18+
- npm 9+

### 1. Repoyu Klonla
```bash
git clone https://github.com/yagizylldrm/Fintegrity-Clone
cd Fintegrity-Clone
```

### 2. Tüm Bağımlılıkları Kur
```bash
make install
```

Veya manuel:
```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend
cd fintegrity-frontend
npm install
cd ..

# Blockchain
cd blockchain
npm install
cd ..
```

### 3. Blockchain Yerel Ağını Başlat
```bash
make dev-blockchain
# veya: cd blockchain && npx hardhat node
```
> Bu terminal açık kalmalı.

### 4. Akıllı Kontratları Deploy Et
Yeni bir terminalde:
```bash
make deploy-contracts
# veya: cd blockchain && npx hardhat run scripts/deploy.ts --network localhost
```

Çıktıdaki kontrat adreslerini not edin:
```
FintegrityCore deployed to: 0x5FbDB...
SmartAgreements deployed to: 0xe7f17...
```

### 5. Backend Environment'ı Ayarla
```bash
cp backend/.env.example backend/.env
```
`.env` dosyasını düzenleyip deploy çıktısındaki adresleri girin.

### 6. AI Modellerini Eğit (İsteğe Bağlı)
Yapay Zeka modellerini yerel CSV dosyalarıyla eğitip diske kaydetmek için:
```bash
make train-ai
# veya: ./fintegrity.sh train-ai
```
*(Modeller eğitilmese bile backend ilk başlatıldığında in-memory eğitim fallback mekanizması sayesinde otomatik olarak eğitilir ve çalışır.)*

### 7. Backend'i Başlat
```bash
make dev-backend
# veya: cd backend && source venv/bin/activate && uvicorn main:app --reload
```

### 8. Frontend'i Başlat
```bash
make dev-frontend
# veya: cd fintegrity-frontend && npm run dev
```

### 9. Uygulamaya Eriş
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 💡 Ekstra: fintegrity.sh Yönetim Aracı
Projeyi arka planda kolayca yönetmek, durumunu sorgulamak ve logları takip etmek için merkezi `fintegrity.sh` kabuk betiğini (shell script) kullanabilirsiniz:

```bash
# Servislerin durumunu ve port durumlarını raporlar
./fintegrity.sh status

# Tüm servisleri (Blockchain Node, Backend ve Frontend) arka planda başlatır ve kontratları deploy eder
./fintegrity.sh start

# Servislerin log çıktılarını canlı olarak terminale yazdırır
./fintegrity.sh logs

# Yapay zeka modellerini yerel CSV veri kümeleriyle eğitir
./fintegrity.sh train-ai

# Çalışan tüm arka plan servislerini ve portları temizleyip güvenli şekilde durdurur
./fintegrity.sh stop
```

## 👤 Demo Kullanıcılar

| Kullanıcı | Şifre | Rol | Yetkiler |
|-----------|-------|-----|----------|
| `admin` | `admin123` | Admin | Tüm CRUD, onay/red, silme, kullanıcı yönetimi |
| `user` | `user123` | Kullanıcı | Belge oluşturma, kendi belgelerini görme |

> ⚠️ Bu kimlik bilgileri sadece demo/geliştirme amaçlıdır. Üretim ortamında değiştirilmelidir.

## 🧪 Testler

```bash
# Tüm testler
make test

# Sadece blockchain testleri
make test-blockchain

# Sadece backend API testleri
make test-backend

# Frontend lint kontrolü
make lint
```

## 📝 Lisans

Bu proje ARD Grup Bilişim bünyesinde staj projesi olarak geliştirilmiştir.
