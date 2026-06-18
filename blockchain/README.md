# Fintegrity Blockchain Module

Bu dizin, Fintegrity platformunun blokzincir (blockchain) akıllı sözleşme altyapısını içerir. Sistem **Hardhat 3** framework'ü üzerine inşa edilmiştir ve yerel bir blokzincir ağında e-Dönüşüm belgelerinin özet (hash) kaydını ve kurumlar arası akıllı sözleşme onay iş akışlarını simüle eder.

## Akıllı Sözleşmeler

Sistemde iki adet Solidity akıllı sözleşmesi bulunmaktadır (`contracts/` dizininde):

1.  **`FintegrityCore.sol`**:
    *   **Amaç:** e-Dönüşüm logları ve finansal işlem özetlerinin (hash) değişmezliğini sağlar.
    *   **Temel Fonksiyonlar:**
        *   `addDocumentLog(string memory _docId, string memory _docHash, string memory _metadata)`: Belge ID ve hash verisini on-chain olarak kaydeder.
        *   `getDocumentLog(string memory _docId)`: Kayıtlı belgenin hash, zaman damgası ve yaratıcı adresini sorgular.
2.  **`SmartAgreements.sol`**:
    *   **Amaç:** Kurumlar arası akıllı sözleşmelerin (iş akışlarının) onay süreçlerini yönetir.
    *   **Temel Fonksiyonlar:**
        *   `createAgreement(address _partyB, string memory _termsHash)`: Yeni bir sözleşme başlatır (State: `Pending`).
        *   `approveAgreement(uint256 _id)`: Sözleşmeyi onaylar (State: `Approved`, yalnızca Party B yetkilidir).
        *   `rejectAgreement(uint256 _id)`: Sözleşmeyi reddeder (State: `Rejected`, Party A veya Party B yetkilidir).
        *   `completeAgreement(uint256 _id)`: Onaylanmış sözleşmeyi tamamlar (State: `Completed`, Party A veya Party B yetkilidir).

## Kullanım Kılavuzu

### 1. Bağımlılıkları Yükleme
Dizindeki Node.js paketlerini yüklemek için:
```shell
npm install
```

### 2. Yerel Blokzincir Node'unu Başlatma
Arka planda çalışacak yerel bir Hardhat Ethereum node'u başlatın. Bu node varsayılan olarak `http://127.0.0.1:8545` üzerinde dinleyecektir ve 20 adet pre-funded (fonlanmış) test adresi sağlayacaktır:
```shell
npx hardhat node
```

### 3. Akıllı Sözleşmeleri Derleme
Solidity dosyalarını derlemek için:
```shell
npx hardhat compile
```

### 4. Akıllı Sözleşmeleri Deploy Etme
Sözleşmeleri yerel ağa deploy etmek için:
```shell
npx hardhat run scripts/deploy.ts --network localhost
```
*Not: Deploy edilen adresler `backend/.env` dosyasına kaydedilmelidir.*

### 5. Testleri Çalıştırma
Yazılmış olan tüm birim testlerini (Mocha & Chai) çalıştırmak için:
```shell
npx hardhat test
```
