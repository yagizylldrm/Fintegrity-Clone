export const mockDocuments = [
  { id: 'DOC-001', type: 'e-Fatura', amount: 15400, date: '2026-06-17', status: 'Onaylandı', sender: 'Tech Corp A.Ş.', hash: '0xabc1...34f' },
  { id: 'DOC-002', type: 'e-İrsaliye', amount: 0, date: '2026-06-17', status: 'Beklemede', sender: 'Lojistik Ltd.', hash: '0x892...11a' },
  { id: 'DOC-003', type: 'e-Sözleşme', amount: 50000, date: '2026-06-16', status: 'İmzalandı', sender: 'Danışmanlık A.Ş.', hash: '0xfed3...99b' },
  { id: 'DOC-004', type: 'e-Fatura', amount: 8250, date: '2026-06-15', status: 'Onaylandı', sender: 'Yazılım Evi', hash: '0x123...456' },
  { id: 'DOC-005', type: 'e-Makbuz', amount: 1200, date: '2026-06-14', status: 'Reddedildi', sender: 'Bireysel Müşteri', hash: '0xdef...789' },
  { id: 'DOC-006', type: 'e-Fatura', amount: 125000, date: '2026-06-13', status: 'Beklemede', sender: 'Mega İnşaat', hash: '0xaaa...bbb' },
  { id: 'DOC-007', type: 'e-İrsaliye', amount: 0, date: '2026-06-12', status: 'Onaylandı', sender: 'Oto Parça Sanayi', hash: '0xccc...ddd' },
];

export const mockContracts = [
  { id: 'SC-1029', parties: ['Tech Corp', 'Lojistik Ltd.'], type: 'Tedarik Zinciri Sözleşmesi', status: 'Active', hash: '0x1122...3344', value: '150,000 ₺' },
  { id: 'SC-1030', parties: ['Danışmanlık A.Ş.', 'Bireysel'], type: 'Hizmet Sözleşmesi', status: 'Pending', hash: '0x5566...7788', value: '25,000 ₺' },
  { id: 'SC-1031', parties: ['Devlet Kurumu', 'Yazılım Evi'], type: 'Kamu İhalesi', status: 'Completed', hash: '0x99aa...bbcc', value: '1,200,000 ₺' },
  { id: 'SC-1032', parties: ['Otomotiv A.Ş.', 'Yedek Parça Ltd.'], type: 'Aylık Satın Alma', status: 'Active', hash: '0xddee...ff00', value: '450,000 ₺' },
];

export const mockAnomalies = [
  { id: 'ANM-001', txHash: '0xabc1...34f', account: 'ACC-1054', score: 0.95, amount: 250000, date: '2026-06-17 10:45', status: 'İnceleniyor', risk: 'Yüksek' },
  { id: 'ANM-002', txHash: '0x892...11a', account: 'ACC-8821', score: 0.88, amount: 15000, date: '2026-06-16 14:20', status: 'Açık', risk: 'Yüksek' },
  { id: 'ANM-003', txHash: '0xfed3...99b', account: 'ACC-3329', score: 0.76, amount: 5000, date: '2026-06-15 09:10', status: 'Kapatıldı - Yanlış Alarm', risk: 'Orta' },
  { id: 'ANM-004', txHash: '0x123...456', account: 'ACC-9910', score: 0.92, amount: 120000, date: '2026-06-14 16:55', status: 'Donduruldu', risk: 'Kritik' },
];
