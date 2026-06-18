from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import numpy as np

class DocumentClassifier:
    def __init__(self):
        import os
        import pickle
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, "models", "document_classifier.pkl")
        
        if os.path.exists(model_path):
            try:
                with open(model_path, "rb") as f:
                    model_data = pickle.load(f)
                self.vectorizer = model_data["vectorizer"]
                self.classifier = model_data["classifier"]
                print(f"   [AI] Doküman sınıflandırma modeli diskten başarıyla yüklendi: {model_path}")
                return
            except Exception as e:
                print(f"   [AI] Model yüklenirken hata oluştu: {e}. Fallback eğitime geçiliyor.")

        # Labeled training set for documents in Turkish & English keywords/phrases
        self.corpus = [
            # e-Fatura
            "bu fatura bedeli KDV dahil edilerek düzenlenmiştir",
            "invoice for consulting services payment due",
            "toplam tutar fatura kesim tarihi itibariyle ödenecektir",
            "fatura detayı ve vergi numarası e-fatura",
            "kdv matrahı ve fatura kalemi dökümü",
            "toplam tutar ödeme vadesi faturalandırılmıştır",
            # e-İrsaliye
            "sevk irsaliyesi ile ürünler teslim edilmiştir",
            "delivery note for the goods shipped to address",
            "taşıma irsaliyesi detayları ve sevk tarihi",
            "ürünlerin sevkiyatı irsaliye belgesi eşliğinde yapıldı",
            "irsaliye numarası ve teslim alan yetkili",
            "sevk adresi ve depo teslimat irsaliyesi",
            # e-Sözleşme
            "işbu sözleşme taraflar arasında maddeler halinde imzalanmıştır",
            "agreement signed by both parties governing the terms",
            "sözleşme yükümlülükleri ve gizlilik maddesi",
            "kontrat hükümleri gereğince akıllı sözleşme imzalandı",
            "tarafların karşılıklı anlaşması ve sözleşme onayı",
            "gizlilik ve işbirliği sözleşmesi şartları"
        ]
        self.labels = [
            "e-Fatura", "e-Fatura", "e-Fatura", "e-Fatura", "e-Fatura", "e-Fatura",
            "e-İrsaliye", "e-İrsaliye", "e-İrsaliye", "e-İrsaliye", "e-İrsaliye", "e-İrsaliye",
            "e-Sözleşme", "e-Sözleşme", "e-Sözleşme", "e-Sözleşme", "e-Sözleşme", "e-Sözleşme"
        ]
        
        self.vectorizer = TfidfVectorizer()
        self.classifier = LogisticRegression(random_state=42)
        
        # Fit vectorizer and classifier
        X_train = self.vectorizer.fit_transform(self.corpus)
        self.classifier.fit(X_train, self.labels)
        print("   [AI] Doküman sınıflandırma modeli in-memory olarak eğitildi (Fallback).")

    def classify(self, text: str) -> dict:
        if not text or not text.strip():
            return {
                "document_type": "e-Fatura",
                "confidence_score": 0.50,
                "all_scores": {c: 0.33 for c in self.classifier.classes_},
                "top_features": [],
                "model": "TF-IDF + LogisticRegression"
            }
            
        X = self.vectorizer.transform([text])
        pred_label = self.classifier.predict(X)[0]
        
        # Calculate probability/confidence score
        probs = self.classifier.predict_proba(X)[0]
        class_idx = np.where(self.classifier.classes_ == pred_label)[0][0]
        confidence = float(probs[class_idx])
        
        all_scores = {c: round(float(p), 2) for c, p in zip(self.classifier.classes_, probs)}
        
        # Extract top feature words from input text using TF-IDF weights
        feature_names = self.vectorizer.get_feature_names_out()
        tfidf_scores = X.toarray()[0]
        
        # Get indices of non-zero TF-IDF elements
        nonzero_indices = tfidf_scores.nonzero()[0]
        word_scores = [(feature_names[i], float(tfidf_scores[i])) for i in nonzero_indices]
        # Sort by score descending
        word_scores.sort(key=lambda x: x[1], reverse=True)
        top_features = [word for word, score in word_scores[:3]]
        
        return {
            "document_type": pred_label,
            "confidence_score": round(confidence, 2),
            "all_scores": all_scores,
            "top_features": top_features,
            "model": "TF-IDF + LogisticRegression"
        }

# Global singleton instance
document_classifier = DocumentClassifier()

