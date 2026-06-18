#!/bin/bash

# Fintegrity MVP - Process Manager Script
# Usage: ./fintegrity.sh [start|stop|status|logs]

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PID_DIR="$DIR/.pids"
LOG_DIR="$DIR/logs"

# Ensure directories exist
mkdir -p "$PID_DIR"
mkdir -p "$LOG_DIR"

show_help() {
    echo "🛡️ Fintegrity MVP Yönetim Aracı"
    echo "Kullanım: $0 {start|stop|status|logs|train-ai}"
    echo "---------------------------------------------"
    echo "  start     : Tüm servisleri (Blockchain, Backend, Frontend) arka planda başlatır."
    echo "  stop      : Çalışan tüm platform servislerini güvenli bir şekilde durdurur."
    echo "  status    : Servislerin çalışma ve port durumlarını raporlar."
    echo "  logs      : Servislerin güncel log çıktılarını ekrana yazdırır."
    echo "  train-ai  : AI modellerini (Anomali Tespiti & Doküman Sınıflandırma) eğitir."
}

start_services() {
    echo "🛡️ Fintegrity platformu başlatılıyor..."
    echo "---------------------------------------------"

    # 1. Start Blockchain (Hardhat Node)
    if [ -f "$PID_DIR/blockchain.pid" ] && kill -0 $(cat "$PID_DIR/blockchain.pid") 2>/dev/null; then
        echo "⚠️ Blockchain ağı zaten çalışıyor (PID: $(cat "$PID_DIR/blockchain.pid"))."
    else
        echo "🚀 1. Yerel Blockchain Ağı (Hardhat) başlatılıyor..."
        cd "$DIR/blockchain" && npx hardhat node > "$LOG_DIR/blockchain.log" 2>&1 &
        echo $! > "$PID_DIR/blockchain.pid"
        
        echo "⏳ Blockchain ağının ayağa kalkması bekleniyor (5sn)..."
        sleep 5
    fi

    # 2. Deploy Smart Contracts
    echo "📜 2. Akıllı sözleşmeler dağıtılıyor (deploy)..."
    cd "$DIR/blockchain"
    npx hardhat run scripts/deploy.ts --network localhost > "$LOG_DIR/deploy.log" 2>&1
    DEPLOY_STATUS=$?
    
    if [ $DEPLOY_STATUS -ne 0 ]; then
        echo "❌ Akıllı sözleşme dağıtımı başarısız oldu! Detaylar için 'logs/deploy.log' dosyasını inceleyin."
        stop_services
        exit 1
    fi
    echo "✅ Akıllı sözleşmeler başarıyla deploy edildi."

    # 3. Start Backend (FastAPI)
    if [ -f "$PID_DIR/backend.pid" ] && kill -0 $(cat "$PID_DIR/backend.pid") 2>/dev/null; then
        echo "⚠️ Backend sunucusu zaten çalışıyor (PID: $(cat "$PID_DIR/backend.pid"))."
    else
        echo "🚀 3. FastAPI Backend başlatılıyor..."
        cd "$DIR/backend"
        source venv/bin/activate
        uvicorn main:app --host 0.0.0.0 --port 8000 > "$LOG_DIR/backend.log" 2>&1 &
        echo $! > "$PID_DIR/backend.pid"
    fi

    # 4. Start Frontend (React/Vite)
    if [ -f "$PID_DIR/frontend.pid" ] && kill -0 $(cat "$PID_DIR/frontend.pid") 2>/dev/null; then
        echo "⚠️ Frontend geliştirme sunucusu zaten çalışıyor (PID: $(cat "$PID_DIR/frontend.pid"))."
    else
        echo "🚀 4. React Frontend (Vite) başlatılıyor..."
        cd "$DIR/fintegrity-frontend"
        npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
        echo $! > "$PID_DIR/frontend.pid"
    fi

    echo "---------------------------------------------"
    echo "🎉 Tüm servisler başarıyla arka planda başlatıldı!"
    echo "---------------------------------------------"
    echo "🔗 Erişim Linkleri:"
    echo "   - Frontend Arayüzü : http://localhost:5173 (veya 5174)"
    echo "   - Backend API Docs : http://localhost:8000/docs"
    echo "   - Canlı Log Takibi : ./fintegrity.sh logs"
    echo "   - Durdurmak İçin   : ./fintegrity.sh stop"
    echo "---------------------------------------------"
}

stop_services() {
    echo "🛡️ Fintegrity platformu durduruluyor..."
    echo "---------------------------------------------"

    # Stop Frontend
    if [ -f "$PID_DIR/frontend.pid" ]; then
        PID=$(cat "$PID_DIR/frontend.pid")
        if kill -0 $PID 2>/dev/null; then
            echo "🛑 Frontend durduruluyor (PID: $PID)..."
            # Kill the process tree (vite starts child processes)
            pkill -P $PID 2>/dev/null
            kill $PID 2>/dev/null
        fi
        rm -f "$PID_DIR/frontend.pid"
    fi

    # Stop Backend
    if [ -f "$PID_DIR/backend.pid" ]; then
        PID=$(cat "$PID_DIR/backend.pid")
        if kill -0 $PID 2>/dev/null; then
            echo "🛑 Backend durduruluyor (PID: $PID)..."
            pkill -P $PID 2>/dev/null
            kill $PID 2>/dev/null
        fi
        rm -f "$PID_DIR/backend.pid"
    fi

    # Stop Blockchain
    if [ -f "$PID_DIR/blockchain.pid" ]; then
        PID=$(cat "$PID_DIR/blockchain.pid")
        if kill -0 $PID 2>/dev/null; then
            echo "🛑 Blockchain ağı durduruluyor (PID: $PID)..."
            pkill -P $PID 2>/dev/null
            kill $PID 2>/dev/null
        fi
        rm -f "$PID_DIR/blockchain.pid"
    fi

    # Fallback to kill any orphan ports
    echo "🧹 Port temizliği yapılıyor..."
    kill -9 $(lsof -t -i:8000) 2>/dev/null
    kill -9 $(lsof -t -i:8545) 2>/dev/null
    kill -9 $(lsof -t -i:5173) 2>/dev/null
    kill -9 $(lsof -t -i:5174) 2>/dev/null

    echo "✅ Tüm servisler başarıyla durduruldu."
    echo "---------------------------------------------"
}

status_services() {
    echo "🛡️ Fintegrity Servis Durum Raporu"
    echo "---------------------------------------------"

    # Check Blockchain
    if [ -f "$PID_DIR/blockchain.pid" ] && kill -0 $(cat "$PID_DIR/blockchain.pid") 2>/dev/null; then
        echo "⛓️ Blockchain (Hardhat): ÇALIŞIYOR (PID: $(cat "$PID_DIR/blockchain.pid"), Port: 8545)"
    else
        echo "⛓️ Blockchain (Hardhat): DURDURULDU"
    fi

    # Check Backend
    if [ -f "$PID_DIR/backend.pid" ] && kill -0 $(cat "$PID_DIR/backend.pid") 2>/dev/null; then
        echo "⚙️ Backend (FastAPI)  : ÇALIŞIYOR (PID: $(cat "$PID_DIR/backend.pid"), Port: 8000)"
    else
        echo "⚙️ Backend (FastAPI)  : DURDURULDU"
    fi

    # Check Frontend
    if [ -f "$PID_DIR/frontend.pid" ] && kill -0 $(cat "$PID_DIR/frontend.pid") 2>/dev/null; then
        echo "🎨 Frontend (Vite)    : ÇALIŞIYOR (PID: $(cat "$PID_DIR/frontend.pid"), Port: 5173/5174)"
    else
        echo "🎨 Frontend (Vite)    : DURDURULDU"
    fi
    echo "---------------------------------------------"
}

show_logs() {
    echo "🛡️ Canlı Log Takibi Başlatıldı (Çıkmak için CTRL+C)"
    echo "---------------------------------------------"
    tail -f "$LOG_DIR/blockchain.log" "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log" 2>/dev/null
}

train_ai() {
    echo "🤖 AI Modelleri eğitiliyor..."
    echo "---------------------------------------------"
    cd "$DIR/backend"
    source venv/bin/activate
    python app/ai_module/train.py
    echo "---------------------------------------------"
}

case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    status)
        status_services
        ;;
    logs)
        show_logs
        ;;
    train-ai)
        train_ai
        ;;
    *)
        show_help
        exit 1
        ;;
esac
