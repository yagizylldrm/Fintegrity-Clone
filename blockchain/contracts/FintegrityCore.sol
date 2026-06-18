// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FintegrityCore
 * @dev Fintegrity platformunun temel kayıt ve takip mekanizması
 * e-Dönüşüm logları ve finansal işlem özetlerinin (hash) değişmezliğini sağlar.
 */
contract FintegrityCore {
    struct TransactionLog {
        string docId;
        string docHash;
        uint256 timestamp;
        address creator;
        string metadata;
    }

    mapping(string => TransactionLog) public logs;
    event LogAdded(string indexed docId, string docHash, address indexed creator);

    /**
     * @dev Sisteme yeni bir e-Dönüşüm kaydı (hash olarak) ekler
     */
    function addDocumentLog(string memory _docId, string memory _docHash, string memory _metadata) public {
        require(bytes(logs[_docId].docId).length == 0, "Document already exists!");
        
        logs[_docId] = TransactionLog({
            docId: _docId,
            docHash: _docHash,
            timestamp: block.timestamp,
            creator: msg.sender,
            metadata: _metadata
        });

        emit LogAdded(_docId, _docHash, msg.sender);
    }

    /**
     * @dev Dokümanın hash kaydını getirir
     */
    function getDocumentLog(string memory _docId) public view returns (string memory, string memory, uint256, address, string memory) {
        TransactionLog memory t = logs[_docId];
        require(bytes(t.docId).length > 0, "Document not found!");
        return (t.docId, t.docHash, t.timestamp, t.creator, t.metadata);
    }
}
