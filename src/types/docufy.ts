export type DocumentType = 
  | 'BILL_OF_LADING'
  | 'CERTIFICATE_OF_ORIGIN'
  | 'PHYTOSANITARY_CERTIFICATE'
  | 'COMMERCIAL_INVOICE'
  | 'PACKING_LIST';

export type DocumentStatus = 
  | 'DRAFT'
  | 'APPROVED'
  | 'ISSUED'
  | 'REVOKED'
  | 'SUPERSEDED'
  | 'EXPIRED';

export type VerificationStatus = 
  | 'VALID'
  | 'INVALID'
  | 'REVOKED'
  | 'SUPERSEDED'
  | 'EXPIRED'
  | 'UNKNOWN';

export interface TradeDocument {
  id: string; // e.g. DOC-COO-7F92-2026
  documentType: DocumentType;
  title: string;
  schemaVersion: string;
  issuerOrgId: string;
  issuerOrgName: string;
  issuerSignerName: string;
  issuerSignerRole: string;
  documentHash: string; // SHA-256 canonical hex
  storagePointer: string; // Off-chain encrypted object URI, e.g. s3://docufy-vault-sg/encrypted/doc-7f92.enc
  status: DocumentStatus;
  issuedAt: string;
  expiresAt: string;
  revokedAt?: string;
  revocationReason?: string;
  supersededBy?: string;
  metadata: {
    customsDeclarationNo: string;
    portOfLoading: string;
    portOfDischarge: string;
    vesselOrFlightNo?: string;
    consignorAnonymizedRef: string;
    consigneeAnonymizedRef: string;
    commodityDescription: string;
    grossWeightKg: number;
    customsTariffCode: string;
  };
  ledgerProof: {
    network: 'Docufy Consortium Fabric L1' | 'Arbitrum One EVM L2' | 'Polygon PoS';
    blockNumber: number;
    txHash: string;
    timestamp: string;
    merkleRoot: string;
    merkleLeafIndex: number;
  };
}

export interface VerificationEvidence {
  verification_id: string;
  document_reference: string;
  document_type: DocumentType;
  issuer: {
    organization_id: string;
    name: string;
    credential_status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
    public_key_fingerprint: string;
    accreditation_body: string;
  };
  integrity: {
    algorithm: 'SHA-256';
    presented_document_hash: string;
    registered_document_hash: string;
    match: boolean;
  };
  status: VerificationStatus;
  issued_at: string;
  expires_at: string;
  ledger_reference: {
    network: string;
    transaction_hash: string;
    block_number: number;
    block_timestamp: string;
  };
  public_anchor: {
    network: string;
    transaction: string;
    block_number: number;
    proof_type: 'MERKLE_ROOT';
    merkle_root: string;
  };
  verified_at: string;
  policy_version: string;
  notes?: string;
}

export interface AuditEvent {
  event_id: string;
  document_id: string;
  actor: string;
  organization: string;
  role: string;
  action: 'CREATE' | 'APPROVE' | 'SIGN' | 'ISSUE' | 'VERIFY' | 'REVOKE' | 'SUPERSEDE' | 'MERKLE_ANCHOR';
  timestamp: string;
  event_hash: string;
  previous_event_hash: string;
  correlation_id: string;
  details: string;
}

export interface MerkleBatchAnchor {
  batch_id: string;
  merkle_root: string;
  leaf_count: number;
  document_ids: string[];
  chain_id: number; // e.g. 42161 (Arbitrum One)
  chain_name: string;
  tx_hash: string;
  block_number: number;
  anchored_at: string;
  gas_used: string;
  explorer_url: string;
}

export interface AccreditedOrg {
  org_id: string;
  legal_name: string;
  jurisdiction: string;
  registration_id: string;
  accreditation: string;
  status: 'ACTIVE' | 'SUSPENDED';
  authorized_document_types: DocumentType[];
  publicKey: string;
}
