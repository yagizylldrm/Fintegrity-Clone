import os
import pickle
import csv
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# Set paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(CURRENT_DIR, "sample_data")
MODEL_DIR = os.path.join(CURRENT_DIR, "models")

# Ensure models directory exists
os.makedirs(MODEL_DIR, exist_ok=True)

def train_anomaly_detector():
    print("🤖 Anomali Tespiti (IsolationForest) modeli eğitiliyor...")
    csv_path = os.path.join(DATA_DIR, "sample_transactions.csv")
    
    amounts = []
    if os.path.exists(csv_path):
        try:
            with open(csv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if "amount" in row and row["amount"]:
                        amounts.append(float(row["amount"]))
            X_train = np.array(amounts).reshape(-1, 1)
            print(f"   - CSV'den {len(X_train)} adet işlem tutarı yüklendi.")
        except Exception as e:
            print(f"   - CSV okunurken hata: {e}. Fallback verisi kullanılıyor.")
            amounts = []
            
    if not amounts:
        # Fallback generated data if CSV not found
        print("   - CSV bulunamadı veya boş, yapay veri seti üretiliyor...")
        np.random.seed(42)
        normal_amounts = np.random.exponential(scale=15000, size=150) + 1000
        X_train = normal_amounts.reshape(-1, 1)
        
    model = IsolationForest(contamination=0.1, random_state=42)
    model.fit(X_train)
    
    # Save model
    model_path = os.path.join(MODEL_DIR, "anomaly_detector.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    print(f"   - Modeli başarıyla kaydedildi: {model_path}")

def train_document_classifier():
    print("🤖 Doküman Sınıflandırma (TF-IDF + LogisticRegression) modeli eğitiliyor...")
    csv_path = os.path.join(DATA_DIR, "sample_documents.csv")
    
    corpus = []
    labels = []
    
    if os.path.exists(csv_path):
        try:
            with open(csv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if "document_text" in row and "label" in row:
                        corpus.append(row["document_text"])
                        labels.append(row["label"])
            print(f"   - CSV'den {len(corpus)} adet etiketli metin yüklendi.")
        except Exception as e:
            print(f"   - CSV okunurken hata: {e}. Varsayılan metin seti kullanılıyor.")
            corpus = []
            labels = []
            
    if not corpus:
        # Fallback corpus if CSV not found or empty
        print("   - CSV bulunamadı veya boş, varsayılan metin seti kullanılıyor...")
        corpus = [
            "bu fatura bedeli KDV dahil edilerek düzenlenmiştir",
            "invoice for consulting services payment due",
            "toplam tutar fatura kesim tarihi itibariyle ödenecektir",
            "fatura detayı ve vergi numarası e-fatura",
            "kdv matrahı ve fatura kalemi dökümü",
            "toplam tutar ödeme vadesi faturalandırılmıştır",
            "sevk irsaliyesi ile ürünler teslim edilmiştir",
            "delivery note for the goods shipped to address",
            "taşıma irsaliyesi detayları ve sevk tarihi",
            "ürünlerin sevkiyatı irsaliye belgesi eşliğinde yapıldı",
            "irsaliye numarası ve teslim alan yetkili",
            "sevk adresi ve depo teslimat irsaliyesi",
            "işbu sözleşme taraflar arasında maddeler halinde imzalanmıştır",
            "agreement signed by both parties governing the terms",
            "sözleşme yükümlülükleri ve gizlilik maddesi",
            "kontrat hükümleri gereğince akıllı sözleşme imzalandı",
            "tarafların karşılıklı anlaşması ve sözleşme onayı",
            "gizlilik ve işbirliği sözleşmesi şartları"
        ]
        labels = [
            "e-Fatura", "e-Fatura", "e-Fatura", "e-Fatura", "e-Fatura", "e-Fatura",
            "e-İrsaliye", "e-İrsaliye", "e-İrsaliye", "e-İrsaliye", "e-İrsaliye", "e-İrsaliye",
            "e-Sözleşme", "e-Sözleşme", "e-Sözleşme", "e-Sözleşme", "e-Sözleşme", "e-Sözleşme"
        ]
        
    vectorizer = TfidfVectorizer()
    X_train = vectorizer.fit_transform(corpus)
    
    classifier = LogisticRegression(random_state=42)
    classifier.fit(X_train, labels)
    
    # Save vectorizer and classifier together
    model_data = {
        "vectorizer": vectorizer,
        "classifier": classifier
    }
    
    model_path = os.path.join(MODEL_DIR, "document_classifier.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model_data, f)
    print(f"   - Modeli başarıyla kaydedildi: {model_path}")

if __name__ == "__main__":
    print("--------------------------------------------------")
    print("🚀 Fintegrity ML Modelleri Eğitim Hattı (Pipeline)")
    print("--------------------------------------------------")
    train_anomaly_detector()
    print("")
    train_document_classifier()
    print("--------------------------------------------------")
    print("✅ Eğitim tamamlandı! Modeller 'models/' dizinine kaydedildi.")
    print("--------------------------------------------------")
