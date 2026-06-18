# 🛡️ Fintegrity — Blockchain ve Yapay Zeka Destekli Finansal Entegrasyon Platformu

> Staj projesi kapsamında geliştirilmiş MVP/prototip seviyesinde bir finansal entegrasyon platformu.

## 📋 Proje Hakkında

Fintegrity, e-dönüşüm süreçlerini (e-Fatura, e-İrsaliye, e-Sözleşme) blockchain teknolojisi ile güvence altına alan ve yapay zeka ile anomali tespiti yapan bir platformdur.

### Temel Özellikler
- 📄 **e-Dönüşüm Belge Yönetimi** — e-Fatura, e-İrsaliye, e-Sözleşme, e-Makbuz
- 🔗 **Blockchain Kayıt & Doğrulama** — Belge hash'leri Ethereum uyumlu zincire yazılır
- 📜 **Akıllı Sözleşme İş Akışı** — Oluştur → Onayla → Tamamla lifecycle
- 🤖 **AI Anomali Tespiti** — IsolationForest ile şüpheli işlem tespiti
- 📊 **AI Doküman Sınıflandırma** — TF-IDF + LogisticRegression ile otomatik sınıflandırma
- 🔐 **JWT Tabanlı Yetkilendirme** — Admin ve kullanıcı rolleri
- 📈 **Canlı Dashboard** — Gerçek zamanlı istatistikler ve blockchain TPS

## 🏗️ Mimari

```
fintegrity-staj/
├── backend/                 # FastAPI Backend (Python)
│   ├── app/
│   │   ├── ai_module/       # ML modelleri (IsolationForest, TF-IDF)
│   │   ├── api/
│   │   │   └── routes/      # API endpoint'leri
│   │   ├── blockchain_client.py  # Web3.py entegrasyonu
│   │   ├── config.py        # Environment config
│   │   └── database.py      # SQLAlchemy modelleri
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
git clone https://github.com/yagizylldrm/Fintegrity-Clone.git
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

### 6. Backend'i Başlat
```bash
make dev-backend
# veya: cd backend && source venv/bin/activate && uvicorn main:app --reload
```

### 7. Frontend'i Başlat
```bash
make dev-frontend
# veya: cd fintegrity-frontend && npm run dev
```

### 8. Uygulamaya Eriş
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

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

Bu proje ARD Bilişim bünyesinde staj projesi olarak geliştirilmiştir.
