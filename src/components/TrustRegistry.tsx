import React from 'react';
import { Building2, ShieldCheck, CheckCircle2, Key, Globe, FileBadge } from 'lucide-react';
import { INITIAL_ACCREDITED_ORGS } from '../blockchain/simulatedLedger';

export const TrustRegistry: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-sm font-semibold tracking-wide uppercase">
              <Building2 className="w-4 h-4" />
              <span>Network Trust & Issuer Authority Registry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Accredited Organizations & Public Keys
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              PRD Section 4.5: Authoritative mapping of legal entities, permitted trade document classes, and cryptographically registered public signing keys.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-slate-300 font-medium">PKI Root Trust</p>
              <p className="text-slate-500 font-mono text-[11px]">Consortium Endorsed (4 Root CAs)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {INITIAL_ACCREDITED_ORGS.map((org) => (
          <div
            key={org.org_id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                  {org.org_id}
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{org.legal_name}</h3>
                <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>{org.jurisdiction}</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono">{org.registration_id}</span>
                </div>
              </div>

              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{org.status}</span>
              </span>
            </div>

            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-300">
                <FileBadge className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold">Accreditation:</span>
                <span className="text-slate-400">{org.accreditation}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Authorized Document Classes:</span>
                <div className="flex flex-wrap gap-1.5">
                  {org.authorized_document_types.map((type) => (
                    <span
                      key={type}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-900 text-cyan-300 border border-slate-700"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <div className="flex items-center space-x-1 text-slate-400 mb-1">
                  <Key className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px] font-semibold">Registered Public Key:</span>
                </div>
                <div className="p-1.5 bg-slate-900 rounded font-mono text-[10px] text-slate-300 break-all border border-slate-800">
                  {org.publicKey}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Governance Explanatory Box */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-xs text-slate-400 space-y-2">
        <h4 className="text-sm font-semibold text-white">Consortium Authority Enforcement Rule</h4>
        <p>
          Per PRD Section 4.5, an authenticated user identity alone is insufficient to mint a valid document. The Docufy smart contract strictly validates that the issuing organization possesses an active authority bitmask for that specific document class in that jurisdiction. Issuance outside authorized bounds fails closed on-chain.
        </p>
      </div>
    </div>
  );
};
