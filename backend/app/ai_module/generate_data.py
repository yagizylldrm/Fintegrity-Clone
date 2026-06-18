import os
import csv
import random
from datetime import datetime, timedelta

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(CURRENT_DIR, "sample_data")
os.makedirs(DATA_DIR, exist_ok=True)

def generate_transactions(num_rows=1000):
    filepath = os.path.join(DATA_DIR, "sample_transactions.csv")
    print(f"Generating transaction data: {filepath}")
    
    start_time = datetime(2026, 1, 1)
    
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["transaction_id", "account_id", "amount", "timestamp", "is_anomaly"])
        
        for i in range(1, num_rows + 1):
            tx_id = f"TX-{i:04d}"
            acc_id = f"ACC-{random.randint(1000, 9999)}"
            
            # ~6% anomalies
            is_anomaly = 1 if random.random() < 0.06 else 0
            
            if is_anomaly == 1:
                # Anomaly: very high or very low
                if random.random() < 0.8:
                    amount = round(random.uniform(80000.0, 750000.0), 2)
                else:
                    amount = round(random.uniform(5.0, 450.0), 2)
            else:
                # Normal amount between 1,000 and 45,000
                amount = round(random.uniform(1000.0, 45000.0), 2)
                
            tx_time = start_time + timedelta(minutes=random.randint(10, 500000))
            timestamp_str = tx_time.strftime("%Y-%m-%d %H:%M:%S")
            
            writer.writerow([tx_id, acc_id, amount, timestamp_str, is_anomaly])
            
    print(f"Successfully generated {num_rows} transactions.")

def generate_documents():
    filepath = os.path.join(DATA_DIR, "sample_documents.csv")
    print(f"Generating document texts: {filepath}")
    
    fatura_phrases = [
        "fatura bedeli kdv dahil edilerek sirketimize faturalandirilmistir",
        "consulting invoice for custom software development services",
        "toplam tutar fatura kesim tarihi itibariyle banka hesabina odenecektir",
        "fatura detayi ve vergi numarasi e-fatura mukellefi",
        "kdv matrahi ve fatura kalemi dökümü ile birlikte ibraz edilmistir",
        "toplam tutar odeme vadesi faturalandirilmistir",
        "hizmet bedeli e-fatura kesilerek tahsil edilmistir",
        "monthly subscription fees for cloud hosting services invoice",
        "professional services rendering invoice billing code",
        "vergi muafiyeti kapsaminda duzenlenen kdv'siz e-fatura",
        "fatura genel toplami ve yaziyla odenecek tutar",
        "is ortakligi danismanlik bedeli fatura beyannamesi",
        "tasarim ve gelistirme bedeli kdv tevkifati uygulanan fatura",
        "efatura e-arsiv fatura kdv toplami matrah"
    ]
    
    irsaliye_phrases = [
        "sevk irsaliyesi teslimat adresi lojistik yetkilisine teslim",
        "depodan cikis sevk irsaliyesi ve tasima belgesi esliginde",
        "delivery note for the goods shipped to corporate headquarters",
        "irsaliye numarasi ve teslim alan yetkili personel imzasi",
        "sevk adresi ve depo teslimat irsaliyesi kontrolu",
        "tasima irsaliyesi detaylari ve fiili sevk tarihi",
        "urunlerin sevkiyatı irsaliye belgesi esliginde kamyonla yapildi",
        "mal kabul ve irsaliye uzerindeki urun miktarlarinin eslesmesi",
        "sevk irsaliyesi ile sevkiyat ambarina teslim edilen urunler",
        "irsaliyeli fatura ile birlikte teslim edilen koli adedi",
        "lojistik depo cikisi e-irsaliye onay kodu",
        "tasima sirketi irsaliye beyani plaka no ve sofor bilgisi",
        "sevkiyat amiri onayli e-irsaliye ciktisi ve teslim raporu",
        "shipped cargo waybill delivery note details and packages"
    ]
    
    sozlesme_phrases = [
        "isbu gizlilik ve isbirligi sozlesmesi hukumleri taraflarca imzalandi",
        "agreement term sheet signed by both parties governing IP rights",
        "sozlesme yukumlulukleri ve gizlilik maddesi ihlali durumunda",
        "kontrat hukumleri geregince akilli sozlesme onaylandi",
        "taraflarin karsilikli anlasmasi ve sozlesme onayi maddesi",
        "gizlilik ve isbirligi sozlesmesi sartlari saklidir",
        "employment agreement between employer and employee details",
        "master services agreement terms and conditions signed digitally",
        "taraflar bu sozlesme kapsaminda dogacak ihtilaflari kabul eder",
        "sozlesmenin feshi ve tazminat maddeleri aciklanmistir",
        "iki taraf arasinda akdedilen danismanlik sozlesmesi suresi",
        "akilli sozlesme uzerindeki sartlarin yerine getirilmesi",
        "yetkili mahkemeler ve sozlesmenin yururluluk tarihi maddesi",
        "digital service level agreement SLA terms signoff"
    ]
    
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["document_text", "label"])
        
        # Write fatura samples
        for phrase in fatura_phrases:
            writer.writerow([phrase, "e-Fatura"])
            writer.writerow([f"tutar: {random.randint(1000, 50000)} tl {phrase}", "e-Fatura"])
            writer.writerow([f"invoice no: {random.randint(100000, 999999)} - {phrase}", "e-Fatura"])
            
        # Write irsaliye samples
        for phrase in irsaliye_phrases:
            writer.writerow([phrase, "e-İrsaliye"])
            writer.writerow([f"irsaliye tarihi: 2026-06-18 {phrase}", "e-İrsaliye"])
            writer.writerow([f"plaka: 34XYZ{random.randint(10, 99)} - {phrase}", "e-İrsaliye"])
            
        # Write sozlesme samples
        for phrase in sozlesme_phrases:
            writer.writerow([phrase, "e-Sözleşme"])
            writer.writerow([f"isbu sozlesme 12 maddeden olusup {phrase}", "e-Sözleşme"])
            writer.writerow([f"signed agreement - {phrase}", "e-Sözleşme"])
            
    print(f"Successfully generated document texts.")

if __name__ == "__main__":
    generate_transactions()
    generate_documents()
