import React, { useState } from 'react';
import { History, Link2, ShieldCheck, Filter, FileText, ArrowDown } from 'lucide-react';
import { AuditEvent } from '../types/docufy';

interface AuditTrailProps {
  auditTrail: AuditEvent[];
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ auditTrail }) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredEvents = filterAction === 'ALL'
    ? auditTrail
    : auditTrail.filter(e => e.action === filterAction);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-sm font-semibold tracking-wide uppercase">
              <History className="w-4 h-4" />
              <span>Tamper Detection & Append-Only Audit Trail (PRD 4.4)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Cryptographic Audit Log & Event Chain
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Every document creation, maker-checker approval, cryptographic signature, and verification is chained via SHA-256 hashes to guarantee historical immutability.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-slate-950 text-cyan-300 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none"
            >
              <option value="ALL">All Lifecycle Actions</option>
              <option value="CREATE">CREATE (Draft)</option>
              <option value="APPROVE">APPROVE (Maker-Checker)</option>
              <option value="SIGN">SIGN (HSM ECDSA)</option>
              <option value="ISSUE">ISSUE (Ledger Anchor)</option>
              <option value="MERKLE_ANCHOR">MERKLE_ANCHOR (EVM L2)</option>
              <option value="REVOKE">REVOKE (Revocation)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Chronology */}
      <div className="space-y-3">
        {filteredEvents.map((evt, idx) => (
          <div
            key={evt.event_id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-sm transition space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-cyan-400">{evt.event_id}</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-xs text-slate-300">{evt.document_id}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    evt.action === 'CREATE'
                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                      : evt.action === 'APPROVE'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : evt.action === 'SIGN'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : evt.action === 'ISSUE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : evt.action === 'MERKLE_ANCHOR'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {evt.action}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {new Date(evt.timestamp).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-200">{evt.details}</p>

            {/* Context & Hash Chaining */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
              <div>
                <span className="text-slate-500">Actor:</span>{' '}
                <span className="text-slate-300">{evt.actor} ({evt.role})</span>
              </div>
              <div>
                <span className="text-slate-500">Correlation ID:</span>{' '}
                <span className="text-slate-300">{evt.correlation_id}</span>
              </div>
              <div className="md:col-span-2 pt-1 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400">
                <div className="truncate max-w-xs">
                  <span className="text-slate-500">Prev Hash:</span> {evt.previous_event_hash.substring(0, 16)}...
                </div>
                <div className="flex items-center space-x-1 text-cyan-400">
                  <Link2 className="w-3 h-3" />
                  <span className="truncate max-w-xs">Event Hash: {evt.event_hash.substring(0, 16)}...</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
