// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SmartAgreements
 * @dev Fintegrity platformu için Akıllı Sözleşmeler (İş Akışları)
 * Kurumlar arası otomatik anlaşma ve e-Fatura/e-Sözleşme onay süreçlerini yönetir.
 */
contract SmartAgreements {
    enum AgreementState { Pending, Approved, Rejected, Completed }

    struct Agreement {
        uint256 id;
        address partyA;
        address partyB;
        string termsHash;
        AgreementState state;
        uint256 createdAt;
        uint256 updatedAt;
    }

    uint256 public agreementCounter;
    mapping(uint256 => Agreement) public agreements;

    event AgreementCreated(uint256 indexed id, address indexed partyA, address indexed partyB);
    event AgreementStateChanged(uint256 indexed id, AgreementState newState);

    /**
     * @dev Yeni bir akıllı sözleşme (iş akışı) başlatır
     */
    function createAgreement(address _partyB, string memory _termsHash) public {
        agreementCounter++;
        agreements[agreementCounter] = Agreement({
            id: agreementCounter,
            partyA: msg.sender,
            partyB: _partyB,
            termsHash: _termsHash,
            state: AgreementState.Pending,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit AgreementCreated(agreementCounter, msg.sender, _partyB);
    }

    /**
     * @dev Karşı tarafın (partyB) sözleşmeyi onaylaması
     */
    function approveAgreement(uint256 _id) public {
        Agreement storage agg = agreements[_id];
        require(msg.sender == agg.partyB, "Only Party B can approve");
        require(agg.state == AgreementState.Pending, "Agreement not pending");

        agg.state = AgreementState.Approved;
        agg.updatedAt = block.timestamp;

        emit AgreementStateChanged(_id, AgreementState.Approved);
    }

    /**
     * @dev Sözleşmenin reddedilmesi
     */
    function rejectAgreement(uint256 _id) public {
        Agreement storage agg = agreements[_id];
        require(msg.sender == agg.partyB || msg.sender == agg.partyA, "Not authorized");
        require(agg.state == AgreementState.Pending, "Agreement not pending");

        agg.state = AgreementState.Rejected;
        agg.updatedAt = block.timestamp;

        emit AgreementStateChanged(_id, AgreementState.Rejected);
    }

    /**
     * @dev Onaylı sözleşmenin tamamlanması (ödeme yapıldı, fatura kesildi vb.)
     */
    function completeAgreement(uint256 _id) public {
        Agreement storage agg = agreements[_id];
        require(msg.sender == agg.partyA || msg.sender == agg.partyB, "Not authorized");
        require(agg.state == AgreementState.Approved, "Agreement not approved");

        agg.state = AgreementState.Completed;
        agg.updatedAt = block.timestamp;

        emit AgreementStateChanged(_id, AgreementState.Completed);
    }
}
