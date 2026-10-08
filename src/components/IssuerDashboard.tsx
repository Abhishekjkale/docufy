import React, { useState } from 'react';
import QRCode from 'qrcode';
import { 
  Upload, 
  FileCheck, 
  CheckCircle, 
  ShieldCheck, 
  Key, 
  QrCode, 
  Download, 
  AlertCircle, 
  FileText, 
  PlusCircle, 
  X, 
  Lock,
  ArrowRight,
  RefreshCw,
  Ban
} from 'lucide-react';
import { TradeDocument, DocumentType } from '../types/docufy';
import { computeSHA256File, computeSHA256Text } from '../crypto/hasher';

interface IssuerDashboardProps {
  documents: TradeDocument[];
  onRegisterDocument: (newDoc: TradeDocument) => void;
  onRevokeDocument: (docId: string, reason: string) => void;
}

export const IssuerDashboard: React.FC<IssuerDashboardProps> = ({
  documents,
  onRegisterDocument,
  onRevokeDocument,
}) => {
  // Issuance Wizard State
  const [docType, setDocType] = useState<DocumentType>('CERTIFICATE_OF_ORIGIN');
  const [title, setTitle] = useState('Certificate of Origin - Singapore Manufactured Goods');
  const [customsRef, setCustomsRef] = useState(`SG-EXP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
  const [portLoading, setPortLoading] = useState('Port of Singapore (SGSIN)');
  const [portDischarge, setPortDischarge] = useState('Port of Rotterdam (NLRTM)');
  const [commodity, setCommodity] = useState('High Purity Nickel Cathodes 99.99%');
  const [weightKg, setWeightKg] = useState('50000');
  const [tariffCode, setTariffCode] = useState('7502.10.00');
  const [validityMonths, setValidityMonths] = useState('12');
  
  // File & Hash state
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [computedHash, setComputedHash] = useState<string>('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const [isHashing, setIsHashing] = useState(false);

  // Maker-Checker state (PRD 4.1 Segregation of Duties)
  const [checkerApproved, setCheckerApproved] = useState(true);
  const [isMinting, setIsMinting] = useState(false);

  // Mint Success Modal & QR Code
  const [newlyMintedDoc, setNewlyMintedDoc] = useState<TradeDocument | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Revocation modal state
  const [revokingDoc, setRevokingDoc] = useState<TradeDocument | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Handle file upload and calculate SHA-256
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileObject(file);
    setIsHashing(true);
    const hash = await computeSHA256File(file);
    setComputedHash(hash);
    setIsHashing(false);
  };

  // Quick preset template selection
  const handleSelectTemplate = (type: DocumentType) => {
    setDocType(type);
    if (type === 'CERTIFICATE_OF_ORIGIN') {
      setTitle('Certificate of Origin - Singapore Manufactured Goods');
      setCommodity('High Purity Nickel Cathodes 99.99%');
      setTariffCode('7502.10.00');
    } else if (type === 'BILL_OF_LADING') {
      setTitle('Ocean Bill of Lading - 2x40ft Containers Precision Machinery');
      setCommodity('CNC Milling Systems & Industrial Robotics');
      setTariffCode('8457.10.00');
    } else if (type === 'PHYTOSANITARY_CERTIFICATE') {
      setTitle('Federal Phytosanitary Certificate - Fresh Agricultural Produce');
      setCommodity('Organic Valencia Oranges (Pest Inspection Passed)');
      setTariffCode('0805.10.00');
    } else if (type === 'COMMERCIAL_INVOICE') {
      setTitle('Commercial Export Invoice - Microelectronic Components');
      setCommodity('Semiconductor IC Microcontrollers');
      setTariffCode('8542.31.00');
    } else {
      setTitle('Consolidated Export Cargo Packing List');
      setCommodity('Packaged Goods & Modular Pallets');
      setTariffCode('9999.00.00');
    }
  };

  // Submit and Mint/Anchor Document to Blockchain
  const handleMintDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkerApproved) {
      alert('Segregation of duties: Checker approval is required before issuance.');
      return;
    }

    setIsMinting(true);

    // Simulate blockchain latency (Consortium Fabric consensus + Arb EVM L2)
    await new Promise((resolve) => setTimeout(resolve, 800));

    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + parseInt(validityMonths, 10));

    const randomSuffix = Math.random().toString(16).substring(2, 6).toUpperCase();
    const docPrefixMap: Record<DocumentType, string> = {
      'CERTIFICATE_OF_ORIGIN': 'DOC-COO',
      'BILL_OF_LADING': 'DOC-BOL',
      'PHYTOSANITARY_CERTIFICATE': 'DOC-PHYTO',
      'COMMERCIAL_INVOICE': 'DOC-INV',
      'PACKING_LIST': 'DOC-PKG',
    };
    const documentId = `${docPrefixMap[docType]}-${randomSuffix}-${now.getFullYear()}`;

    // Random transaction and block simulation
    const blockNumber = 148300 + Math.floor(Math.random() * 500);
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const merkleRoot = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newDoc: TradeDocument = {
      id: documentId,
      documentType: docType,
      title,
      schemaVersion: 'UN-CEFACT-v2.1',
      issuerOrgId: 'ORG-SGP-CHAMBER',
      issuerOrgName: 'Singapore International Chamber of Commerce',
      issuerSignerName: 'Sarah Lin, Chief Verification Officer',
      issuerSignerRole: 'Authorized Chambers Attestor',
      documentHash: computedHash,
      storagePointer: `s3://docufy-vault-sg/encrypted/${documentId.toLowerCase()}.enc`,
      status: 'ISSUED',
      issuedAt: now.toISOString(),
      expiresAt: expiryDate.toISOString(),
      metadata: {
        customsDeclarationNo: customsRef,
        portOfLoading: portLoading,
        portOfDischarge: portDischarge,
        vesselOrFlightNo: 'MSC Irina / Voy 2611E',
        consignorAnonymizedRef: 'EXP-SG-CORP-9102 (Off-Chain Token)',
        consigneeAnonymizedRef: 'IMP-EU-DISTRIB-4412 (Off-Chain Token)',
        commodityDescription: commodity,
        grossWeightKg: parseFloat(weightKg) || 1000,
        customsTariffCode: tariffCode,
      },
      ledgerProof: {
        network: 'Docufy Consortium Fabric L1',
        blockNumber,
        txHash,
        timestamp: now.toISOString(),
        merkleRoot,
        merkleLeafIndex: documents.length,
      },
    };

    // Generate real scannable QR Code
    const qrPayload = JSON.stringify({
      v: 'DOCUFY-1.0',
      ref: newDoc.id,
      hash: newDoc.documentHash.substring(0, 16),
      url: `https://docufy.trade/verify?ref=${newDoc.id}`,
    });
    const qrUrl = await QRCode.toDataURL(qrPayload, {
      width: 250,
      margin: 1,
      color: { dark: '#0284c7', light: '#ffffff' },
    });

    setQrDataUrl(qrUrl);
    setNewlyMintedDoc(newDoc);
    onRegisterDocument(newDoc);
    setIsMinting(false);
  };

  const confirmRevocation = () => {
    if (!revokingDoc || !revokeReason.trim()) return;
    onRevokeDocument(revokingDoc.id, revokeReason);
    setRevokingDoc(null);
    setRevokeReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-sm font-semibold tracking-wide uppercase">
              <Key className="w-4 h-4" />
              <span>Authorized Exporter / Issuing Authority Node</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Issue & Anchor Trade Documents
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Cryptographically fingerprint canonical artifacts, enforce maker-checker controls, and anchor proofs to the consortium ledger and EVM L2.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
            <Lock className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-slate-300 font-medium">HSM Key Custody: Active</p>
              <p className="text-slate-500 font-mono text-[11px]">ECDSA P-256 (Cloud HSM SG-01)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Issuance Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Container (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleMintDocument} className="space-y-5">
            {/* Quick Template Picker */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                1. Select Document Class (PRD Section 4.2)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(
                  [
                    ['CERTIFICATE_OF_ORIGIN', 'Certificate of Origin'],
                    ['BILL_OF_LADING', 'Bill of Lading'],
                    ['PHYTOSANITARY_CERTIFICATE', 'Phytosanitary'],
                    ['COMMERCIAL_INVOICE', 'Commercial Invoice'],
                    ['PACKING_LIST', 'Packing List'],
                  ] as [DocumentType, string][]
                ).map(([type, label]) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => handleSelectTemplate(type)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition ${
                      docType === type
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Document Title / Description
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Customs Declaration Reference
                </label>
                <input
                  type="text"
                  value={customsRef}
                  onChange={(e) => setCustomsRef(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Validity Window (Months)
                </label>
                <select
                  value={validityMonths}
                  onChange={(e) => setValidityMonths(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months (1 Year)</option>
                  <option value="24">24 Months (2 Years)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Port of Loading
                </label>
                <input
                  type="text"
                  value={portLoading}
                  onChange={(e) => setPortLoading(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Port of Discharge
                </label>
                <input
                  type="text"
                  value={portDischarge}
                  onChange={(e) => setPortDischarge(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Declared Gross Weight (kg)
                </label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Harmonized Tariff (HS Code)
                </label>
                <input
                  type="text"
                  value={tariffCode}
                  onChange={(e) => setTariffCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {/* Privacy Architecture Notice */}
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">PRD 6.3 Content-Versus-Evidence Separation:</strong>
                <p>
                  Sensitive trade parties (Consignor / Consignee) are tokenized into opaque identifiers. Raw document files are encrypted off-chain in S3/Vault. Only the canonical SHA-256 digest is committed on-chain.
                </p>
              </div>
            </div>

            {/* Maker-Checker Controls */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Maker-Checker Governance (PRD 4.1)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Dual control required: Checker must attest before cryptographic key signing.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkerApproved}
                    onChange={(e) => setCheckerApproved(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 font-mono">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Attestor: Sarah Lin (Chief Verification Officer, Singapore Chamber)</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isMinting || !checkerApproved}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isMinting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing & Committing Proof to Ledger...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign & Anchor to Consortium Ledger</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Canonical Cryptographic Hasher (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">
                  Canonical SHA-256 Engine (DOC-002)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                Deterministic
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Attach the original PDF/XML artifact to compute its exact 256-bit cryptographic fingerprint before committing to blockchain.
            </p>

            {/* File Input */}
            <div className="border border-slate-800 rounded-lg p-3 bg-slate-950">
              <input
                type="file"
                id="issuer-file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.json,.xml"
              />
              <label
                htmlFor="issuer-file"
                className="flex items-center justify-center space-x-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-medium cursor-pointer transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{fileObject ? `Attached: ${fileObject.name}` : 'Attach Trade Artifact (PDF/XML)'}</span>
              </label>

              {fileObject && (
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Size: {(fileObject.size / 1024).toFixed(1)} KB</span>
                  <span className="text-emerald-400">MIME Validated</span>
                </div>
              )}
            </div>

            {/* Live Computed SHA-256 Digest */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300">
                  Authoritative Digest (bytes32):
                </span>
                <span className="text-[10px] text-slate-500 font-mono">256-BIT CHECKSUM</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 break-all font-mono text-xs text-cyan-300 leading-relaxed">
                {isHashing ? 'Computing SHA-256...' : computedHash}
              </div>
            </div>

            {/* Technical Verification Binding Summary */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-2 text-slate-400">
              <div className="font-semibold text-slate-200">Evidence Binding (DOC-003):</div>
              <div className="flex justify-between text-[11px]">
                <span>Issuer Org:</span>
                <span className="text-white font-mono">ORG-SGP-CHAMBER</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Ledger Network:</span>
                <span className="text-cyan-400 font-mono">Consortium Fabric L1</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Public Proof Anchor:</span>
                <span className="text-blue-400 font-mono">Arbitrum One EVM L2</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Signing Algorithm:</span>
                <span className="text-emerald-400 font-mono">ECDSA P-256</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Issued Documents Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white">Authoritative Documents Ledger</h2>
            <p className="text-xs text-slate-400">
              Active, revoked, and superseded cross-border trade records anchored on-chain.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            Total Records: <strong className="text-cyan-400">{documents.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Document ID</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Digest (SHA-256)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Issued At</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-mono font-medium text-cyan-300">
                    {doc.id}
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-medium">
                    {doc.documentType}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400 max-w-[150px] truncate">
                    {doc.documentHash}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.status === 'ISSUED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : doc.status === 'REVOKED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {new Date(doc.issuedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    {doc.status === 'ISSUED' && (
                      <button
                        onClick={() => setRevokingDoc(doc)}
                        className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-medium transition"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mint Success Modal */}
      {newlyMintedDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">
                  Document Successfully Anchored to Ledger!
                </h3>
              </div>
              <button
                onClick={() => setNewlyMintedDoc(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              {qrDataUrl && (
                <div className="bg-white p-2 rounded-xl shadow-md shrink-0">
                  <img src={qrDataUrl} alt="Verification QR Code" className="w-28 h-28" />
                </div>
              )}
              <div className="text-xs space-y-1.5">
                <div className="text-slate-400">
                  Reference ID:{' '}
                  <strong className="text-cyan-300 font-mono">{newlyMintedDoc.id}</strong>
                </div>
                <div className="text-slate-400">
                  Fabric Block:{' '}
                  <span className="text-white font-mono">#{newlyMintedDoc.ledgerProof.blockNumber}</span>
                </div>
                <div className="text-slate-400">
                  Arbitrum Merkle Root:{' '}
                  <span className="text-blue-400 font-mono truncate block max-w-[200px]">
                    {newlyMintedDoc.ledgerProof.merkleRoot}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Share this QR code with customs authorities & logistics carriers for instantaneous verification.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setNewlyMintedDoc(null)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-lg text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revocation Modal */}
      {revokingDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-400">
              <Ban className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">
                Revoke Document (DOC-006)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Revoking marks this document as non-valid across all international customs portals. Historical evidence remains auditable on the blockchain.
            </p>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400">Target Document: </span>
              <strong className="text-white font-mono">{revokingDoc.id}</strong>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Authoritative Revocation Reason Code:
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. SANCTIONS_SCREENING_FLAG: Erroneous commodity tariff classification; corrected version re-issued."
                rows={3}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setRevokingDoc(null)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmRevocation}
                disabled={!revokeReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
