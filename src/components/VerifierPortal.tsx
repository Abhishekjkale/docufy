import React, { useState } from 'react';
import { 
  Search, 
  UploadCloud, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Copy, 
  CheckCircle2, 
  Download, 
  Hash, 
  ExternalLink,
  Layers,
  Clock,
  Sparkles
} from 'lucide-react';
import { TradeDocument, VerificationEvidence, VerificationStatus } from '../types/docufy';
import { computeSHA256File, computeSHA256Text } from '../crypto/hasher';

interface VerifierPortalProps {
  documents: TradeDocument[];
  onSelectDocument: (doc: TradeDocument) => void;
}

export const VerifierPortal: React.FC<VerifierPortalProps> = ({ documents, onSelectDocument }) => {
  const [query, setQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [evidence, setEvidence] = useState<VerificationEvidence | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [presentedHash, setPresentedHash] = useState<string | null>(null);
  const [tamperSimulationActive, setTamperSimulationActive] = useState(false);

  // Perform deterministic verification strictly adhering to PRD Section 4.3 & Appendix A
  const runVerification = async (targetQuery: string, customCalculatedHash?: string, isTampered = false) => {
    setIsVerifying(true);
    setTamperSimulationActive(isTampered);

    // Simulate realistic ultra-low latency (target p95 <= 1.5s per PRD 9.0)
    await new Promise((resolve) => setTimeout(resolve, 450));

    const cleanQuery = targetQuery.trim();
    let matchedDoc: TradeDocument | undefined;

    // Check if query is a document ID
    matchedDoc = documents.find(
      (d) => d.id.toLowerCase() === cleanQuery.toLowerCase()
    );

    // If not found by ID, check if it's a 64-char hex hash
    if (!matchedDoc && cleanQuery.length === 64) {
      matchedDoc = documents.find(
        (d) => d.documentHash.toLowerCase() === cleanQuery.toLowerCase()
      );
    }

    // If custom hash is provided (e.g. from file upload)
    const effectivePresentedHash = isTampered
      ? 'f3910249cbe87114228964e528b10f543ad48092147321e90ef817b2b528dead' // altered byte hash
      : (customCalculatedHash || (matchedDoc ? matchedDoc.documentHash : cleanQuery));

    setPresentedHash(effectivePresentedHash);

    const now = new Date();
    const verificationId = `VER-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    if (!matchedDoc) {
      // UNKNOWN Result
      setEvidence({
        verification_id: verificationId,
        document_reference: cleanQuery || 'UNRESOLVED_REFERENCE',
        document_type: 'BILL_OF_LADING',
        issuer: {
          organization_id: 'ORG-UNKNOWN',
          name: 'Unregistered Entity',
          credential_status: 'UNKNOWN' as any,
          public_key_fingerprint: 'NONE',
          accreditation_body: 'None',
        },
        integrity: {
          algorithm: 'SHA-256',
          presented_document_hash: effectivePresentedHash,
          registered_document_hash: 'NOT_FOUND_ON_LEDGER',
          match: false,
        },
        status: 'UNKNOWN',
        issued_at: 'N/A',
        expires_at: 'N/A',
        ledger_reference: {
          network: 'Docufy Consortium Fabric L1',
          transaction_hash: '0x0000000000000000000000000000000000000000',
          block_number: 0,
          block_timestamp: now.toISOString(),
        },
        public_anchor: {
          network: 'Arbitrum One EVM L2',
          transaction: '0x0000000000000000000000000000000000000000',
          block_number: 0,
          proof_type: 'MERKLE_ROOT',
          merkle_root: '0x0000000000000000000000000000000000000000',
        },
        verified_at: now.toISOString(),
        policy_version: 'VERIFY-1.0',
        notes: 'FAIL-CLOSED: Record does not exist on consortium ledger or public EVM anchor.',
      });
      setIsVerifying(false);
      return;
    }

    // Determine Status
    let status: VerificationStatus = 'VALID';
    let notes = 'Document integrity and authoritative issuer credentials verified.';

    if (isTampered) {
      status = 'INVALID';
      notes = 'SECURITY ALERT: Presented artifact hash does NOT match registered hash on ledger. Potential tampering or altered data!';
    } else if (matchedDoc.status === 'REVOKED') {
      status = 'REVOKED';
      notes = `AUTHORITATIVE REVOCATION: ${matchedDoc.revocationReason || 'Withdrawn by authorized issuer.'}`;
    } else if (matchedDoc.status === 'SUPERSEDED') {
      status = 'SUPERSEDED';
      notes = `SUPERSEDED BY AUTHORITATIVE SUCCESSOR: ${matchedDoc.supersededBy || 'Newer version available.'}`;
    } else if (matchedDoc.expiresAt && new Date(matchedDoc.expiresAt) < now) {
      status = 'EXPIRED';
      notes = 'VALIDITY WINDOW EXPIRED: This certificate is past its designated validity date.';
    }

    setEvidence({
      verification_id: verificationId,
      document_reference: matchedDoc.id,
      document_type: matchedDoc.documentType,
      issuer: {
        organization_id: matchedDoc.issuerOrgId,
        name: matchedDoc.issuerOrgName,
        credential_status: 'ACTIVE',
        public_key_fingerprint: '0x04e6c98c...9d691 (HSM ECDSA P-256)',
        accreditation_body: 'ICC World Chambers Federation Chain Certified',
      },
      integrity: {
        algorithm: 'SHA-256',
        presented_document_hash: effectivePresentedHash,
        registered_document_hash: matchedDoc.documentHash,
        match: !isTampered && effectivePresentedHash.toLowerCase() === matchedDoc.documentHash.toLowerCase(),
      },
      status,
      issued_at: matchedDoc.issuedAt,
      expires_at: matchedDoc.expiresAt,
      ledger_reference: {
        network: matchedDoc.ledgerProof.network,
        transaction_hash: matchedDoc.ledgerProof.txHash,
        block_number: matchedDoc.ledgerProof.blockNumber,
        block_timestamp: matchedDoc.ledgerProof.timestamp,
      },
      public_anchor: {
        network: 'Arbitrum One EVM L2',
        transaction: '0x17c9b88231e84a569201f9cba77d48293774020aef103859d188fe3920c7d4289b',
        block_number: 19941824,
        proof_type: 'MERKLE_ROOT',
        merkle_root: matchedDoc.ledgerProof.merkleRoot,
      },
      verified_at: now.toISOString(),
      policy_version: 'VERIFY-1.0',
      notes,
    });

    setIsVerifying(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const hash = await computeSHA256File(file);
    setPresentedHash(hash);
    setQuery(hash);
    runVerification(hash, hash);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const hash = await computeSHA256File(file);
    setPresentedHash(hash);
    setQuery(hash);
    runVerification(hash, hash);
  };

  const copyEvidenceJSON = () => {
    if (!evidence) return;
    navigator.clipboard.writeText(JSON.stringify(evidence, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReceipt = () => {
    if (!evidence) return;
    const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Docufy-Verification-Receipt-${evidence.verification_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'VALID':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          badge: 'bg-emerald-500 text-slate-950',
          icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
        };
      case 'INVALID':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          badge: 'bg-rose-500 text-white',
          icon: <ShieldAlert className="w-8 h-8 text-rose-400" />,
        };
      case 'REVOKED':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          badge: 'bg-amber-500 text-slate-950',
          icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
        };
      case 'SUPERSEDED':
        return {
          bg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
          badge: 'bg-sky-500 text-slate-950',
          icon: <Layers className="w-8 h-8 text-sky-400" />,
        };
      case 'EXPIRED':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
          badge: 'bg-yellow-500 text-slate-950',
          icon: <Clock className="w-8 h-8 text-yellow-400" />,
        };
      case 'UNKNOWN':
      default:
        return {
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          badge: 'bg-slate-600 text-white',
          icon: <AlertTriangle className="w-8 h-8 text-slate-400" />,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Context Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-sm font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Customs & Border Authority Verification Node</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Cross-Border Trade Document Authenticator
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Deterministic, zero-ambiguity verification in &lt;1.5s. Validates cryptographic SHA-256 byte digests against the consortium ledger and EVM L2 Merkle anchors. Raw commercial documents remain strictly off-chain.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-ping"></span>
              Live Consensus Node
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Zero-PII On-Chain Policy
            </span>
          </div>
        </div>
      </div>

      {/* Verification Action Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input & Drop Zone (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Verification Reference ID or SHA-256 Hash
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. DOC-COO-7F92-2026 or paste 64-char SHA-256 digest"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && query && runVerification(query)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>
              <button
                onClick={() => query && runVerification(query)}
                disabled={isVerifying || !query.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
              >
                {isVerifying ? (
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Verifying...</span>
                  </span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Verify</span>
                  </>
                )}
              </button>
            </div>

            {/* Drag & Drop File Zone */}
            <div className="mt-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-6 text-center bg-slate-950/60 transition cursor-pointer group"
                onClick={() => document.getElementById('verifier-file-input')?.click()}
              >
                <input
                  type="file"
                  id="verifier-file-input"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.json,.xml,.txt"
                />
                <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto group-hover:scale-110 transition mb-2" />
                <p className="text-sm font-medium text-slate-200">
                  Drop electronic trade document (PDF, XML, JSON) here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  SHA-256 fingerprint is computed locally in browser. Artifact is never leaked.
                </p>
                {uploadedFileName && (
                  <div className="mt-3 inline-flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-full text-xs text-cyan-300 font-mono">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{uploadedFileName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PRD Tamper Detection Demonstration Sandbox */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Interactive Test Suite (PRD Section 4.3 & 7.3)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Click to run scenario:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setQuery('DOC-COO-7F92-2026');
                  runVerification('DOC-COO-7F92-2026', undefined, false);
                }}
                className="text-left px-3 py-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 rounded-lg text-xs transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-400">1. Authentic Certificate</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                    VALID
                  </span>
                </div>
                <p className="text-slate-400 mt-1 line-clamp-1">
                  Singapore Chamber Nickel COO (Valid & intact)
                </p>
              </button>

              <button
                onClick={() => {
                  setQuery('DOC-COO-7F92-2026 (Tampered)');
                  runVerification('DOC-COO-7F92-2026', undefined, true);
                }}
                className="text-left px-3 py-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-rose-500/40 rounded-lg text-xs transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-400">2. Tampered Document</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-400 border border-rose-800">
                    INVALID
                  </span>
                </div>
                <p className="text-slate-400 mt-1 line-clamp-1">
                  Altered cargo weight: byte digest mismatch!
                </p>
              </button>

              <button
                onClick={() => {
                  setQuery('DOC-INV-3320-2025');
                  runVerification('DOC-INV-3320-2025', undefined, false);
                }}
                className="text-left px-3 py-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 rounded-lg text-xs transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-400">3. Revoked Record</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950 text-amber-400 border border-amber-800">
                    REVOKED
                  </span>
                </div>
                <p className="text-slate-400 mt-1 line-clamp-1">
                  Swiss SGS Invoice flagged for export control
                </p>
              </button>

              <button
                onClick={() => {
                  setQuery('DOC-PKG-1188-2025');
                  runVerification('DOC-PKG-1188-2025', undefined, false);
                }}
                className="text-left px-3 py-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/40 rounded-lg text-xs transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sky-400">4. Superseded Record</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-950 text-sky-400 border border-sky-800">
                    SUPERSEDED
                  </span>
                </div>
                <p className="text-slate-400 mt-1 line-clamp-1">
                  Packing List replaced with authorized v2
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Real-time Verification Output / Deterministic Badge (5 cols) */}
        <div className="lg:col-span-5">
          {evidence ? (
            <div className={`rounded-xl border p-5 ${getStatusColor(evidence.status).bg} shadow-lg transition-all`}>
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div className="flex items-center space-x-3">
                  {getStatusColor(evidence.status).icon}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                      DETERMINISTIC VERDICT
                    </span>
                    <h2 className="text-2xl font-black tracking-tight">{evidence.status}</h2>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${getStatusColor(evidence.status).badge}`}>
                  {evidence.status}
                </span>
              </div>

              {/* Status explanation */}
              <div className="mt-3 text-xs leading-relaxed bg-slate-950/40 rounded-lg p-3 border border-slate-800/40">
                <p className="font-medium text-slate-200">{evidence.notes}</p>
              </div>

              {/* Integrity Checklist */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800/40">
                  <span>Document Reference:</span>
                  <span className="font-mono font-medium text-white">{evidence.document_reference}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800/40">
                  <span>Trade Doc Type:</span>
                  <span className="font-medium text-cyan-300">{evidence.document_type}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800/40">
                  <span>Issuer Identity:</span>
                  <span className="font-medium text-white truncate max-w-[180px]">{evidence.issuer.name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800/40">
                  <span>Digest Match (SHA-256):</span>
                  <span className={`font-mono font-bold ${evidence.integrity.match ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {evidence.integrity.match ? 'MATCH 100%' : 'MISMATCH (TAMPERED)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800/40">
                  <span>Consortium Fabric Block:</span>
                  <span className="font-mono text-slate-300">#{evidence.ledger_reference.block_number}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 py-1">
                  <span>EVM L2 Merkle Anchor:</span>
                  <span className="text-cyan-400 font-medium">Arbitrum Verified</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex gap-2">
                <button
                  onClick={downloadReceipt}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Receipt (JSON)</span>
                </button>
                <button
                  onClick={copyEvidenceJSON}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition"
                  title="Copy JSON Evidence"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center text-slate-400 min-h-[320px]">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mb-3">
                <ShieldCheck className="w-7 h-7 text-slate-500" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300">Ready for Verification</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Enter a document identifier above or select one of the PRD test scenarios to trigger instant verification.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Complete Evidence Package (PRD Appendix A Specification) */}
      {evidence && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">
                Verifiable Cryptographic Evidence Package (PRD Appendix A)
              </h3>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
              ID: {evidence.verification_id}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Hash Comparison Box */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <div className="text-slate-400 font-sans font-semibold mb-1 flex items-center justify-between">
                <span>Presented Artifact SHA-256 Digest:</span>
                {tamperSimulationActive && (
                  <span className="text-rose-400 text-[10px] bg-rose-950 px-1.5 py-0.2 rounded border border-rose-800">
                    Altered Payload
                  </span>
                )}
              </div>
              <div className="break-all text-cyan-300 bg-slate-900/80 p-2 rounded border border-slate-800">
                {evidence.integrity.presented_document_hash}
              </div>

              <div className="text-slate-400 font-sans font-semibold mt-3 mb-1">
                Authoritative Registered Digest on Ledger:
              </div>
              <div className="break-all text-emerald-400 bg-slate-900/80 p-2 rounded border border-slate-800">
                {evidence.integrity.registered_document_hash}
              </div>
            </div>

            {/* Blockchain Anchoring Evidence */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <div className="text-slate-400 font-sans font-semibold mb-1">
                Consortium & EVM L2 Anchoring Proof:
              </div>
              <div className="space-y-1.5 text-slate-300">
                <div>
                  <span className="text-slate-500">L1 Fabric Tx:</span>{' '}
                  <span className="text-white break-all">{evidence.ledger_reference.transaction_hash}</span>
                </div>
                <div>
                  <span className="text-slate-500">L2 Merkle Root:</span>{' '}
                  <span className="text-cyan-300 break-all">{evidence.public_anchor.merkle_root}</span>
                </div>
                <div>
                  <span className="text-slate-500">Arbitrum Tx:</span>{' '}
                  <span className="text-blue-400 break-all">{evidence.public_anchor.transaction}</span>
                </div>
                <div>
                  <span className="text-slate-500">Issued Timestamp:</span>{' '}
                  <span className="text-slate-200">{evidence.issued_at}</span>
                </div>
                <div>
                  <span className="text-slate-500">Verified Timestamp:</span>{' '}
                  <span className="text-slate-200">{evidence.verified_at}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Raw JSON viewer */}
          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-sans font-medium">Standard Machine-Readable JSON Output:</span>
              <button
                onClick={copyEvidenceJSON}
                className="text-cyan-400 hover:text-cyan-300 font-sans flex items-center space-x-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Payload</span>
              </button>
            </div>
            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-2 bg-slate-900/60 rounded">
              {JSON.stringify(evidence, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
