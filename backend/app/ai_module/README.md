# 🤖 Fintegrity Yapay Zeka (AI) Modülü Dokümantasyonu

Yapay Zeka (AI) modülü, platform bünyesindeki finansal e-Dönüşüm belgelerinin sınıflandırılması ve şüpheli işlemlerin anomali taraması amacıyla iki temel Makine Öğrenmesi (ML) modeli içermektedir.

---

## 1. Anomali Tespiti (Isolation Forest)

* **Dosya:** [anomaly.py](file:///Users/yagizylldrm/fintegrity-staj/backend/app/ai_module/anomaly.py)
* **Model Algoritması:** Scikit-Learn `IsolationForest`
* **Amacı:** Fatura tutarları veya transfer miktarlarındaki olağandışı sapmaları ve şüpheli harcama hacimlerini tespit etmek.

### Model Parametreleri & Çalışma Mantığı
* **Contamination (Kirlilik Oranı):** `0.1` (%10). Veri kümesindeki tahmini anomali oranıdır.
* **Eğitim Verisi:** Fatura tutarlarını simüle eden, üstel dağılıma sahip (exponential distribution) ve minimum 1000 ₺ barajı bulunan veri setiyle eğitilmiştir.
* **Karar Mekanizması:** 
  * Isolation Forest, verileri ağaç yapılarına bölerek izole eder. Anomali puanı düşük olan veriler ağacın köklerine daha yakındır (kolay izole edilirler).
  * Ham anomali skoru, `0` ile `1` arasına map edilir. `1` en yüksek riskli harcamayı temsil eder.
  * Risk Skoru `0.80` (yani %80) eşiğini aştığında veya model doğrudan anomali tahmini yaptığında işlem **RİSKLİ** olarak etiketlenir.

### Açıklanabilir Yapay Zeka (XAI) Çıktıları
* **Reason (Gerekçe):** Fatura tutarının normal veri dağılımıyla karşılaştırılmasına göre dinamik gerekçeler üretilir (örneğin: *Tutarı normal işlem dağılımının %99 üzerinde*).
* **Suggested Action (Önerilen Aksiyon):** Tespit edilen riske göre (örneğin, ₺50,000 üzerindeki harcamalara mali onay istemek gibi) aksiyon önerileri sunar.

---

## 2. e-Belge Sınıflandırma (TF-IDF + Logistic Regression)

* **Dosya:** [classifier.py](file:///Users/yagizylldrm/fintegrity-staj/backend/app/ai_module/classifier.py)
* **Algoritma:** TF-IDF (Term Frequency-Inverse Document Frequency) + Logistic Regression
* **Amacı:** Faturaların, irsaliyelerin ve sözleşmelerin içerik metninden (veya OCR çıktılarından) belgenin türünü otomatik olarak tahmin etmek.

### Model Parametreleri & Çalışma Mantığı
* **TF-IDF Vectorizer:** Belgedeki kelimelerin sıklığını ve tüm külliyattaki (corpus) ayırt ediciliğini sayısal vektörlere dönüştürür.
* **Logistic Regression:** TF-IDF vektörlerini girdi olarak alıp belgenin e-Fatura, e-İrsaliye veya e-Sözleşme sınıflarından hangisine ait olduğunu olasılık skoruyla hesaplar.
* **Eğitim Seti:** Türkçe ve İngilizce fatura kalemi dökümleri, sevk irsaliyesi teslimat notları ve akıllı sözleşme maddelerinden oluşan etiketlenmiş bir corpus ile eğitilmiştir.

### Açıklanabilir Yapay Zeka (XAI) Çıktıları
* **All Scores:** Tüm sınıflar için hesaplanan olasılık dağılımı (örneğin, `%85 e-Fatura, %10 e-Sözleşme, %5 e-İrsaliye`).
* **Top Features:** Tahminde en büyük rolü oynayan kelimelerin (TF-IDF ağırlığı en yüksek olan) listesidir.

---

## 📊 Örnek Veri Setleri (Sample Data)

Geliştiricilerin modelleri test edebilmesi veya kendi veri kümeleriyle eğitebilmesi için örnek veri formatları [sample_data/](file:///Users/yagizylldrm/fintegrity-staj/backend/app/ai_module/sample_data) altında sunulmaktadır.
