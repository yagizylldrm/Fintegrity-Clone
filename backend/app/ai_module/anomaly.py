import numpy as np
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    def __init__(self):
        import os
        import pickle
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, "models", "anomaly_detector.pkl")
        
        if os.path.exists(model_path):
            try:
                with open(model_path, "rb") as f:
                    self.model = pickle.load(f)
                print(f"   [AI] Anomali tespiti modeli diskten başarıyla yüklendi: {model_path}")
                return
            except Exception as e:
                print(f"   [AI] Model yüklenirken hata oluştu: {e}. Fallback eğitime geçiliyor.")

        # Fallback in-memory training
        self.model = IsolationForest(contamination=0.1, random_state=42)
        # Generate representative normal transaction amounts (e.g. from 1000 to 50000)
        np.random.seed(42)
        normal_amounts = np.random.exponential(scale=15000, size=150) + 1000
        self.X_train = normal_amounts.reshape(-1, 1)
        self.model.fit(self.X_train)
        print("   [AI] Anomali tespiti modeli in-memory olarak eğitildi (Fallback).")

    def detect_anomaly(self, amount: float) -> dict:
        # Reshape input to 2D array for scikit-learn
        X = np.array([[amount]])
        
        # sklearn decision_function outputs raw scores (lower means more anomalous)
        raw_score = self.model.decision_function(X)[0]
        
        # Normalize and map raw_score to a 0 to 1 scale where 1 is highest risk.
        # Raw scores typically span from -0.5 to 0.5.
        score_mapped = float(1.0 - (raw_score - (-0.5)) / (0.5 - (-0.5)))
        score_mapped = max(0.0, min(1.0, score_mapped))
        
        # sklearn predict outputs -1 for anomaly, 1 for normal
        pred = self.model.predict(X)[0]
        is_anomaly = bool(pred == -1 or score_mapped > 0.8)
        
        # Determine reason and action
        if is_anomaly:
            if amount > 50000:
                reason = f"İşlem tutarı (₺{amount:,.2f}), normal işlem dağılımının (₺1,000 - ₺50,000) çok üzerindedir."
                action = "Mali onay gerektirir. İşlemin doğruluğunu teyit edin."
            elif amount < 1000:
                reason = f"İşlem tutarı (₺{amount:,.2f}), normal fatura limitlerinin altındadır."
                action = "Düşük tutarlı e-Belge kurallarına uygunluğunu kontrol edin."
            else:
                reason = "İşlem tutarı istatistiksel olarak normal frekans aralığının dışındadır."
                action = "Belge içeriğini ve gönderici profilini manuel inceleyin."
        else:
            reason = "İşlem tutarı normal harcama profili ve işlem sıklığı ile tam uyumludur."
            action = "İşlem güvenli; ek bir aksiyon gerekmemektedir."

        return {
            "score": round(score_mapped, 2),
            "is_anomaly": is_anomaly,
            "reason": reason,
            "suggested_action": action,
            "threshold": 0.80,
            "model": "IsolationForest"
        }

# Global singleton instance
anomaly_detector = AnomalyDetector()

