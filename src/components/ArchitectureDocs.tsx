import React, { useState } from 'react';
import { 
  Code2, 
  Server, 
  ShieldCheck, 
  Cpu, 
  Copy, 
  CheckCircle2, 
  BookOpen, 
  Layers, 
  Lock,
  Globe,
  FileCode2
} from 'lucide-react';
import { BACKEND_ARCHITECTURE_CODE } from '../backend/apiSnippets';

const SOLIDITY_CONTRACT_PREVIEW = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DocufyRegistry
 * @dev Cross-Border Trade Document Integrity & Anchoring Smart Contract
 * Aligned with Docufy PRD v1.0 Section 5.3 & Section 6.
 */
contract DocufyRegistry {
    enum DocumentType {
        BILL_OF_LADING,              // 0
        CERTIFICATE_OF_ORIGIN,       // 1
        PHYTOSANITARY_CERTIFICATE,   // 2
        COMMERCIAL_INVOICE,          // 3
        PACKING_LIST                 // 4
    }

    enum DocumentStatus { UNREGISTERED, ISSUED, REVOKED, SUPERSEDED, EXPIRED }
    enum VerificationResult { UNKNOWN, VALID, INVALID, REVOKED, SUPERSEDED, EXPIRED }

    struct DocumentRecord {
        bytes32 docHash;              // Canonical SHA-256 digest
        string documentId;            // e.g. DOC-COO-7F92
        string issuerOrgId;           // e.g. ORG-SGP-CHAMBER
        address issuerAddress;        // Authorized signer
        DocumentType docType;
        DocumentStatus status;
        uint64 issuedAt;
        uint64 expiresAt;
        uint64 revokedAt;
        string revocationReason;
        bytes32 successorDocHash;
    }

    struct MerkleBatch {
        bytes32 merkleRoot;
        uint32 batchSize;
        uint64 anchoredAt;
        string batchId;
        address operator;
    }

    mapping(bytes32 => DocumentRecord) private _documents;
    mapping(string => bytes32) private _documentIdToHash;
    MerkleBatch[] public merkleBatches;

    event DocumentRegistered(bytes32 indexed docHash, string indexed documentId, string issuerOrgId, address indexed issuerAddress, DocumentType docType, uint64 issuedAt, uint64 expiresAt);
    event DocumentRevoked(bytes32 indexed docHash, string indexed documentId, address indexed revoker, uint64 revokedAt, string reason);
    event MerkleRootAnchored(bytes32 indexed merkleRoot, uint256 indexed batchIndex, uint32 batchSize, string batchId, uint64 anchoredAt);

    function registerDocument(bytes32 docHash, string calldata documentId, DocumentType docType, uint64 expiresAt) external;
    function revokeDocument(bytes32 docHash, string calldata reason) external;
    function supersedeDocument(bytes32 oldDocHash, bytes32 newDocHash, string calldata newDocId, DocumentType docType, uint64 newExpiresAt) external;
    function anchorMerkleRoot(bytes32 merkleRoot, uint32 batchSize, string calldata batchId) external;
    function verifyDocument(bytes32 presentedDocHash) external view returns (VerificationResult result, string memory docId, string memory issuerOrg, DocumentType docType, uint64 issuedAt, uint64 expiresAt, bytes32 successorHash);
}`;

export const ArchitectureDocs: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'stack' | 'contract' | 'backend' | 'security'>('stack');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-sm font-semibold tracking-wide uppercase">
              <BookOpen className="w-4 h-4" />
              <span>Full-Stack Architecture & Implementation Blueprint</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Docufy Technical Specifications (PRD v1.0)
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Complete engineering design covering hybrid trust topology, production Solidity contracts, Node.js/Ethers.js backend services, and zero-PII security controls.
            </p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab('stack')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeSubTab === 'stack' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Architecture Stack
            </button>
            <button
              onClick={() => setActiveSubTab('contract')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeSubTab === 'contract' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Smart Contract
            </button>
            <button
              onClick={() => setActiveSubTab('backend')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeSubTab === 'backend' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              3. Backend API
            </button>
            <button
              onClick={() => setActiveSubTab('security')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeSubTab === 'security' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              4. Privacy & Security
            </button>
          </div>
        </div>
      </div>

      {/* Subtab 1: Architecture Stack */}
      {activeSubTab === 'stack' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Globe className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Frontend Layer</h3>
              </div>
              <ul className="text-xs text-slate-400 space-y-1.5 pt-1">
                <li>• <strong>React 19 / Next.js</strong> with TypeScript</li>
                <li>• Tailwind CSS for modern responsive styling</li>
                <li>• Client-side Web Crypto API (<code className="text-cyan-300">crypto.subtle</code>)</li>
                <li>• QR Code generation & decoding</li>
                <li>• Sub-second responsive UI (<code className="text-emerald-400">p95 ≤ 1.5s</code>)</li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center space-x-2 text-blue-400">
                <Server className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Backend Services</h3>
              </div>
              <ul className="text-xs text-slate-400 space-y-1.5 pt-1">
                <li>• <strong>Node.js / Express & NestJS</strong></li>
                <li>• Ethers.js v6 for EVM contract interactions</li>
                <li>• Canonicalization & SHA-256 byte hashing</li>
                <li>• Maker-Checker RBAC policy enforcement</li>
                <li>• REST & Webhook APIs for ERP/Customs</li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center space-x-2 text-purple-400">
                <Layers className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Ledger Architecture</h3>
              </div>
              <ul className="text-xs text-slate-400 space-y-1.5 pt-1">
                <li>• <strong>Hybrid Trust Architecture</strong> (PRD 5.0)</li>
                <li>• Hyperledger Fabric for private consortium state</li>
                <li>• Arbitrum One / Polygon EVM L2 for Merkle roots</li>
                <li>• Gas-free instant query lookups via view RPCs</li>
                <li>• Sub-cent transaction fee profile ($0.0003/batch)</li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Lock className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Key & Data Vault</h3>
              </div>
              <ul className="text-xs text-slate-400 space-y-1.5 pt-1">
                <li>• Cloud KMS / HSM for enterprise signing keys</li>
                <li>• S3 Encrypted Object Store (AES-256)</li>
                <li>• Zero-PII on public blockchain policy</li>
                <li>• FIDO2/WebAuthn MFA for privileged signers</li>
                <li>• Append-only hash chained audit log</li>
              </ul>
            </div>
          </div>

          {/* Hybrid Trust Workflow Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <h3 className="text-base font-bold text-white">Hybrid Trust Model (PRD Section 5.0 & 6.3)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Traditional blockchain approaches fail in cross-border trade because putting raw trade documents or commercial secrets on a public chain creates catastrophic privacy and GDPR violations. Docufy solves this through a rigorous <strong>Content-Versus-Evidence Separation</strong>:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <strong className="text-cyan-400 block mb-1">1. Off-Chain Document Vault</strong>
                <span className="text-slate-400">
                  Full PDF/XML artifacts and sensitive party identities are encrypted with AES-256 and stored off-chain. Lawful deletion and GDPR "Right to be Forgotten" are fully compliant.
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <strong className="text-purple-400 block mb-1">2. Consortium Ledger</strong>
                <span className="text-slate-400">
                  Maintains authoritative lifecycle states (ISSUED, REVOKED, SUPERSEDED) and issuer organizational authority bitmasks among accredited customs and chambers.
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <strong className="text-blue-400 block mb-1">3. Public EVM L2 Anchoring</strong>
                <span className="text-slate-400">
                  Periodically aggregates document events into a Merkle Tree and publishes only the 32-byte Merkle Root to Arbitrum One. Provides censorship-resistant third-party timestamp proof.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Solidity Smart Contract */}
      {activeSubTab === 'contract' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">
                Solidity Smart Contract (<code className="text-cyan-400">DocufyRegistry.sol</code>)
              </h3>
              <p className="text-xs text-slate-400">
                Implements document registration, state transitions, authority registry, and batch Merkle anchoring.
              </p>
            </div>
            <button
              onClick={() => handleCopy(SOLIDITY_CONTRACT_PREVIEW, 'sol')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition"
            >
              {copiedCode === 'sol' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === 'sol' ? 'Copied' : 'Copy Contract'}</span>
            </button>
          </div>

          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px]">
            <pre>{SOLIDITY_CONTRACT_PREVIEW}</pre>
          </div>
        </div>
      )}

      {/* Subtab 3: Backend API */}
      {activeSubTab === 'backend' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">
                Production Express & Ethers.js API Implementation
              </h3>
              <p className="text-xs text-slate-400">
                Core endpoints for file upload, canonical hashing, Ethers.js transactions, and PRD Appendix A verification responses.
              </p>
            </div>
            <button
              onClick={() => handleCopy(BACKEND_ARCHITECTURE_CODE, 'backend')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition"
            >
              {copiedCode === 'backend' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === 'backend' ? 'Copied' : 'Copy API Code'}</span>
            </button>
          </div>

          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px]">
            <pre>{BACKEND_ARCHITECTURE_CODE}</pre>
          </div>
        </div>
      )}

      {/* Subtab 4: Privacy & Security */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-white">
              Privacy-by-Design & Zero-PII Enforcement (PRD Section 8.1 - 8.3)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Docufy establishes strict security controls to guarantee regulatory compliance with GDPR, WCO Data Model, and UN/CEFACT international standards:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-rose-400 block">Threat: Public Chain Privacy Leakage</span>
                <p className="text-slate-400">
                  Writing raw commercial trade invoices, buyer names, or container contents to a public chain is immutable and non-compliant with GDPR.
                </p>
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-emerald-400">
                  <strong>Docufy Control:</strong> Never write raw files or PII on-chain. Only the 256-bit cryptographic digest and opaque references exist on ledger.
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-rose-400 block">Threat: Compromised Issuer Credentials</span>
                <p className="text-slate-400">
                  A stolen credential or insider could forge unauthorized certificates under a legitimate chamber of commerce identity.
                </p>
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-emerald-400">
                  <strong>Docufy Control:</strong> Hardware Security Module (HSM) custody keys, phishing-resistant WebAuthn MFA, and dual Maker-Checker segregation of duties.
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-rose-400 block">Threat: QR Code Cloning / Tampering</span>
                <p className="text-slate-400">
                  A fraudulent exporter might copy a genuine QR code from an approved container onto a counterfeit consignment.
                </p>
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-emerald-400">
                  <strong>Docufy Control:</strong> QR code contains an opaque reference. When verifier compares the physical cargo document hash, the hash mismatch immediately flags <code className="text-rose-400">INVALID</code>!
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-rose-400 block">Threat: Audit Log Manipulation</span>
                <p className="text-slate-400">
                  A malicious database admin attempting to rewrite historical approval timestamps or cover illicit changes.
                </p>
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-emerald-400">
                  <strong>Docufy Control:</strong> Cryptographic Hash Chaining (<code className="text-cyan-300">prev_hash + event_data = event_hash</code>). Any alteration invalidates all successor hashes.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
