// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DocufyRegistry
 * @dev Cross-Border Trade Document Integrity & Anchoring Smart Contract
 * Aligned with Docufy PRD v1.0 Section 5.3 & Section 6.
 *
 * Implements:
 * - Deterministic Document Verification via canonical SHA-256 byte hashes (bytes32)
 * - Issuer Organization Access Control & Authority Registry
 * - Document Lifecycle State Machine (ISSUED, REVOKED, SUPERSEDED, EXPIRED)
 * - Batch Merkle Root Anchoring for EVM L2 low-cost, high-scale auditability
 * - Zero on-chain PII or confidential commercial content
 */

contract DocufyRegistry {
    // --- Data Types & Enums ---
    enum DocumentType {
        BILL_OF_LADING,              // 0
        CERTIFICATE_OF_ORIGIN,       // 1
        PHYTOSANITARY_CERTIFICATE,   // 2
        COMMERCIAL_INVOICE,          // 3
        PACKING_LIST                 // 4
    }

    enum DocumentStatus {
        UNREGISTERED, // 0
        ISSUED,       // 1
        REVOKED,      // 2
        SUPERSEDED,   // 3
        EXPIRED       // 4
    }

    enum VerificationResult {
        UNKNOWN,    // 0 - Record not found on ledger
        VALID,      // 1 - Record found, hash matches, currently active
        INVALID,    // 2 - Presented digest mismatch / corrupted
        REVOKED,    // 3 - Explicitly revoked by authorized issuer
        SUPERSEDED, // 4 - Replaced by newer authoritative record
        EXPIRED     // 5 - Validity window ended
    }

    struct DocumentRecord {
        bytes32 docHash;              // Canonical SHA-256 digest of document
        string documentId;            // Opaque business reference (e.g. DOC-COO-7F92)
        string issuerOrgId;           // Registered Organization ID (e.g. ORG-SGP-CHAMBER)
        address issuerAddress;        // Ethereum address of signing key
        DocumentType docType;         // Trade document classification
        DocumentStatus status;        // Current lifecycle state
        uint64 issuedAt;              // Unix timestamp of issuance
        uint64 expiresAt;             // Unix timestamp of validity expiry (0 = perpetual)
        uint64 revokedAt;             // Unix timestamp of revocation (if applicable)
        string revocationReason;      // Reason code (e.g. "ERRONEOUS_CONSIGNEE_DATA")
        bytes32 successorDocHash;     // Points to successor record if SUPERSEDED
    }

    struct MerkleBatch {
        bytes32 merkleRoot;           // Root of the Merkle Tree of document events
        uint32 batchSize;             // Number of document events aggregated
        uint64 anchoredAt;            // Timestamp anchored
        string batchId;               // Batch identifier
        address operator;             // Operator address that submitted anchor
    }

    struct IssuerAuthority {
        bool isAuthorized;
        string orgId;
        uint32 permittedDocTypesMask; // Bitmask of permitted DocumentType enums
        uint64 validUntil;
    }

    // --- State Variables ---
    address public networkAdmin;
    bool public paused;

    // Mapping from canonical SHA-256 hash -> Document Record
    mapping(bytes32 => DocumentRecord) private _documents;
    
    // Mapping from Document ID string -> canonical SHA-256 hash
    mapping(string => bytes32) private _documentIdToHash;

    // Mapping from issuer wallet address -> Authority profile
    mapping(address => IssuerAuthority) public issuerAuthorities;

    // Array of anchored Merkle Batches
    MerkleBatch[] public merkleBatches;

    // Total counts
    uint256 public totalDocumentsRegistered;
    uint256 public totalDocumentsRevoked;

    // --- Events (Audit Trail) ---
    event DocumentRegistered(
        bytes32 indexed docHash,
        string indexed documentId,
        string issuerOrgId,
        address indexed issuerAddress,
        DocumentType docType,
        uint64 issuedAt,
        uint64 expiresAt
    );

    event DocumentRevoked(
        bytes32 indexed docHash,
        string indexed documentId,
        address indexed revoker,
        uint64 revokedAt,
        string reason
    );

    event DocumentSuperseded(
        bytes32 indexed oldDocHash,
        bytes32 indexed newDocHash,
        string oldDocId,
        string newDocId,
        address indexed issuerAddress
    );

    event MerkleRootAnchored(
        bytes32 indexed merkleRoot,
        uint256 indexed batchIndex,
        uint32 batchSize,
        string batchId,
        uint64 anchoredAt
    );

    event IssuerAuthorized(
        address indexed issuerAddress,
        string orgId,
        uint32 permittedDocTypesMask,
        uint64 validUntil
    );

    event IssuerRevoked(address indexed issuerAddress, string orgId);
    event NetworkAdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    // --- Modifiers ---
    modifier onlyAdmin() {
        require(msg.sender == networkAdmin, "Docufy: caller is not network admin");
        _;
    }

    modifier onlyAuthorizedIssuer(DocumentType docType) {
        IssuerAuthority memory auth = issuerAuthorities[msg.sender];
        require(auth.isAuthorized, "Docufy: caller is not an authorized issuer");
        require(auth.validUntil >= block.timestamp, "Docufy: issuer authorization expired");
        require(
            (auth.permittedDocTypesMask & (1 << uint8(docType))) != 0,
            "Docufy: issuer unauthorized for this document type"
        );
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Docufy: registry is paused");
        _;
    }

    // --- Constructor ---
    constructor() {
        networkAdmin = msg.sender;
    }

    // --- Governance Functions ---
    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Docufy: invalid admin address");
        emit NetworkAdminTransferred(networkAdmin, newAdmin);
        networkAdmin = newAdmin;
    }

    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
    }

    function authorizeIssuer(
        address issuerAddress,
        string calldata orgId,
        uint32 permittedDocTypesMask,
        uint64 validUntil
    ) external onlyAdmin {
        require(issuerAddress != address(0), "Docufy: invalid issuer address");
        issuerAuthorities[issuerAddress] = IssuerAuthority({
            isAuthorized: true,
            orgId: orgId,
            permittedDocTypesMask: permittedDocTypesMask,
            validUntil: validUntil
        });

        emit IssuerAuthorized(issuerAddress, orgId, permittedDocTypesMask, validUntil);
    }

    function revokeIssuer(address issuerAddress) external onlyAdmin {
        string memory orgId = issuerAuthorities[issuerAddress].orgId;
        issuerAuthorities[issuerAddress].isAuthorized = false;
        emit IssuerRevoked(issuerAddress, orgId);
    }

    // --- Core Document Issuance Functions ---

    /**
     * @notice Register a newly minted canonical document digest on-chain
     * @param docHash The SHA-256 canonical hash of the document bytes
     * @param documentId Unique business identifier (e.g., DOC-COO-7F92)
     * @param docType Document type classification
     * @param expiresAt Validity expiration Unix timestamp (0 for no expiry)
     */
    function registerDocument(
        bytes32 docHash,
        string calldata documentId,
        DocumentType docType,
        uint64 expiresAt
    ) external whenNotPaused onlyAuthorizedIssuer(docType) {
        require(docHash != bytes32(0), "Docufy: invalid document hash");
        require(bytes(documentId).length > 0, "Docufy: empty document ID");
        require(_documents[docHash].status == DocumentStatus.UNREGISTERED, "Docufy: hash already registered");
        require(_documentIdToHash[documentId] == bytes32(0), "Docufy: document ID already exists");

        string memory orgId = issuerAuthorities[msg.sender].orgId;
        uint64 nowTs = uint64(block.timestamp);

        _documents[docHash] = DocumentRecord({
            docHash: docHash,
            documentId: documentId,
            issuerOrgId: orgId,
            issuerAddress: msg.sender,
            docType: docType,
            status: DocumentStatus.ISSUED,
            issuedAt: nowTs,
            expiresAt: expiresAt,
            revokedAt: 0,
            revocationReason: "",
            successorDocHash: bytes32(0)
        });

        _documentIdToHash[documentId] = docHash;
        totalDocumentsRegistered++;

        emit DocumentRegistered(
            docHash,
            documentId,
            orgId,
            msg.sender,
            docType,
            nowTs,
            expiresAt
        );
    }

    /**
     * @notice Revoke a previously issued trade document
     * @param docHash The SHA-256 hash of the document to revoke
     * @param reason The authoritative reason code
     */
    function revokeDocument(
        bytes32 docHash,
        string calldata reason
    ) external whenNotPaused {
        DocumentRecord storage doc = _documents[docHash];
        require(doc.status != DocumentStatus.UNREGISTERED, "Docufy: document does not exist");
        require(doc.status != DocumentStatus.REVOKED, "Docufy: document already revoked");
        
        // Authorization: Only issuing address or Network Admin can revoke
        require(
            msg.sender == doc.issuerAddress || msg.sender == networkAdmin,
            "Docufy: unauthorized to revoke document"
        );

        doc.status = DocumentStatus.REVOKED;
        doc.revokedAt = uint64(block.timestamp);
        doc.revocationReason = reason;
        totalDocumentsRevoked++;

        emit DocumentRevoked(
            docHash,
            doc.documentId,
            msg.sender,
            doc.revokedAt,
            reason
        );
    }

    /**
     * @notice Supersede an existing document with a new successor document
     * @param oldDocHash SHA-256 hash of the superseded document
     * @param newDocHash SHA-256 hash of the new successor document
     * @param newDocId New document identifier
     * @param docType Document type classification
     * @param newExpiresAt Expiration timestamp of the new document
     */
    function supersedeDocument(
        bytes32 oldDocHash,
        bytes32 newDocHash,
        string calldata newDocId,
        DocumentType docType,
        uint64 newExpiresAt
    ) external whenNotPaused onlyAuthorizedIssuer(docType) {
        DocumentRecord storage oldDoc = _documents[oldDocHash];
        require(oldDoc.status == DocumentStatus.ISSUED, "Docufy: old document is not active");
        require(msg.sender == oldDoc.issuerAddress || msg.sender == networkAdmin, "Docufy: unauthorized");

        // Register new document
        string memory orgId = issuerAuthorities[msg.sender].orgId;
        uint64 nowTs = uint64(block.timestamp);

        _documents[newDocHash] = DocumentRecord({
            docHash: newDocHash,
            documentId: newDocId,
            issuerOrgId: orgId,
            issuerAddress: msg.sender,
            docType: docType,
            status: DocumentStatus.ISSUED,
            issuedAt: nowTs,
            expiresAt: newExpiresAt,
            revokedAt: 0,
            revocationReason: "",
            successorDocHash: bytes32(0)
        });
        _documentIdToHash[newDocId] = newDocHash;
        totalDocumentsRegistered++;

        // Mark old document as SUPERSEDED
        oldDoc.status = DocumentStatus.SUPERSEDED;
        oldDoc.successorDocHash = newDocHash;

        emit DocumentRegistered(newDocHash, newDocId, orgId, msg.sender, docType, nowTs, newExpiresAt);
        emit DocumentSuperseded(oldDocHash, newDocHash, oldDoc.documentId, newDocId, msg.sender);
    }

    // --- EVM L2 Batch Merkle Anchoring ---

    /**
     * @notice Anchor a Merkle Root aggregating multiple off-chain issuance/audit events
     * @param merkleRoot The root hash of the batch Merkle Tree
     * @param batchSize Number of events encapsulated
     * @param batchId Unique identifier for the batch
     */
    function anchorMerkleRoot(
        bytes32 merkleRoot,
        uint32 batchSize,
        string calldata batchId
    ) external onlyAdmin whenNotPaused {
        require(merkleRoot != bytes32(0), "Docufy: invalid Merkle root");
        require(batchSize > 0, "Docufy: batch size must be positive");

        merkleBatches.push(MerkleBatch({
            merkleRoot: merkleRoot,
            batchSize: batchSize,
            anchoredAt: uint64(block.timestamp),
            batchId: batchId,
            operator: msg.sender
        }));

        emit MerkleRootAnchored(
            merkleRoot,
            merkleBatches.length - 1,
            batchSize,
            batchId,
            uint64(block.timestamp)
        );
    }

    // --- Instant Verification (Read-Only / Gas-Free) ---

    /**
     * @notice Deterministic verification endpoint strictly conforming to PRD Section 4.3
     * @param presentedDocHash The SHA-256 hash calculated from the presented document artifact
     * @return result Verification status code (0=UNKNOWN, 1=VALID, 2=INVALID, 3=REVOKED, 4=SUPERSEDED, 5=EXPIRED)
     * @return docId Document Reference ID
     * @return issuerOrg Registered Issuer Organization
     * @return docType Document Type enum
     * @return issuedAt Issuance Unix timestamp
     * @return expiresAt Expiry Unix timestamp
     * @return successorHash Hash of successor if superseded
     */
    function verifyDocument(bytes32 presentedDocHash) external view returns (
        VerificationResult result,
        string memory docId,
        string memory issuerOrg,
        DocumentType docType,
        uint64 issuedAt,
        uint64 expiresAt,
        bytes32 successorHash
    ) {
        DocumentRecord memory doc = _documents[presentedDocHash];

        if (doc.status == DocumentStatus.UNREGISTERED) {
            return (VerificationResult.UNKNOWN, "", "", DocumentType.BILL_OF_LADING, 0, 0, bytes32(0));
        }

        if (doc.status == DocumentStatus.REVOKED) {
            return (VerificationResult.REVOKED, doc.documentId, doc.issuerOrgId, doc.docType, doc.issuedAt, doc.expiresAt, bytes32(0));
        }

        if (doc.status == DocumentStatus.SUPERSEDED) {
            return (VerificationResult.SUPERSEDED, doc.documentId, doc.issuerOrgId, doc.docType, doc.issuedAt, doc.expiresAt, doc.successorDocHash);
        }

        if (doc.expiresAt > 0 && block.timestamp > doc.expiresAt) {
            return (VerificationResult.EXPIRED, doc.documentId, doc.issuerOrgId, doc.docType, doc.issuedAt, doc.expiresAt, bytes32(0));
        }

        if (doc.status == DocumentStatus.ISSUED) {
            return (VerificationResult.VALID, doc.documentId, doc.issuerOrgId, doc.docType, doc.issuedAt, doc.expiresAt, bytes32(0));
        }

        return (VerificationResult.INVALID, doc.documentId, doc.issuerOrgId, doc.docType, doc.issuedAt, doc.expiresAt, bytes32(0));
    }

    /**
     * @notice Query document record by its human-readable Document ID (e.g. DOC-COO-7F92)
     */
    function getDocumentById(string calldata documentId) external view returns (
        bytes32 docHash,
        string memory issuerOrgId,
        DocumentType docType,
        DocumentStatus status,
        uint64 issuedAt,
        uint64 expiresAt,
        bytes32 successorDocHash
    ) {
        bytes32 hash = _documentIdToHash[documentId];
        require(hash != bytes32(0), "Docufy: document ID not found");
        DocumentRecord memory doc = _documents[hash];
        return (
            doc.docHash,
            doc.issuerOrgId,
            doc.docType,
            doc.status,
            doc.issuedAt,
            doc.expiresAt,
            doc.successorDocHash
        );
    }

    /**
     * @notice Query total anchored Merkle batches
     */
    function getMerkleBatchesCount() external view returns (uint256) {
        return merkleBatches.length;
    }
}
