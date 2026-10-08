import React, { useState } from 'react';
import { Database, GitCommit, Layers, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { INITIAL_MERKLE_BATCHES } from '../blockchain/simulatedLedger';
import { TradeDocument } from '../types/docufy';

interface MerkleAnchorExplorerProps {
  documents: TradeDocument[];
}

export const MerkleAnchorExplorer: React.FC<MerkleAnchorExplorerProps> = ({ documents }) => {
  const [selectedBatch] = useState(INITIAL_MERKLE_BATCHES[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-sm font-semibold tracking-wide uppercase">
              <Database className="w-4 h-4" />
              <span>Independent Public Proof Layer (PRD Section 5.2)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              EVM Layer 2 Merkle Root Anchor Explorer
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Periodic batching of document digests into cryptographic Merkle Trees, anchoring only the Merkle Root onto Arbitrum One EVM L2. Independent public verifiability with zero trade confidentiality leakage.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
            <Layers className="w-4 h-4 text-cyan-400" />
            <div>
              <p className="text-slate-300 font-medium">Chain ID: 42161 (Arbitrum)</p>
              <p className="text-slate-500 font-mono text-[11px]">Gas: ~84,192 (~$0.0003/batch)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Merkle Tree Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <GitCommit className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">
              Merkle Batch Structure: {selectedBatch.batch_id}
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
            Anchor Confirmed
          </span>
        </div>

        {/* Tree Visualizer */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center space-y-6">
          {/* Level 1: Root */}
          <div className="text-center w-full max-w-md">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Anchored Merkle Root (On-Chain EVM L2)
            </span>
            <div className="mt-1 p-3 bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-500/50 rounded-xl text-cyan-300 font-mono text-xs break-all shadow-lg">
              {selectedBatch.merkle_root}
            </div>
          </div>

          {/* Tree Connectors */}
          <div className="w-1/2 h-4 border-t-2 border-r-2 border-l-2 border-slate-700"></div>

          {/* Level 2: Intermediary Hashes */}
          <div className="grid grid-cols-2 gap-6 w-full max-w-xl">
            <div className="text-center">
              <span className="text-[10px] font-mono text-slate-500">Branch Left (H_01)</span>
              <div className="mt-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono text-[11px] truncate">
                0x7f83b1657ff1fc53...26d9069
              </div>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-mono text-slate-500">Branch Right (H_23)</span>
              <div className="mt-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono text-[11px] truncate">
                0x5e884898da280471...1542d8
              </div>
            </div>
          </div>

          {/* Tree Connectors */}
          <div className="w-3/4 h-4 border-t-2 border-r-2 border-l-2 border-slate-800"></div>

          {/* Level 3: Leaf Hashes (Trade Documents) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            {documents.slice(0, 3).map((doc, idx) => (
              <div key={doc.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px] text-cyan-400 font-mono">
                  <span>Leaf #{idx}</span>
                  <span>{doc.id}</span>
                </div>
                <div className="text-white font-medium line-clamp-1">{doc.title}</div>
                <div className="font-mono text-[10px] text-slate-400 truncate">
                  SHA-256: {doc.documentHash}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Public Blockchain Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">NETWORK</span>
            <span className="text-white font-medium">{selectedBatch.chain_name}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">L2 BLOCK NUMBER</span>
            <span className="text-cyan-400 font-medium">#{selectedBatch.block_number}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">TIMESTAMP</span>
            <span className="text-slate-300">{new Date(selectedBatch.anchored_at).toLocaleString()}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">GAS CONSUMPTION</span>
            <span className="text-emerald-400">{selectedBatch.gas_used}</span>
          </div>
        </div>

        {/* Transaction Reference */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
          <div className="font-mono text-slate-400">
            <span>Arbitrum Transaction Hash: </span>
            <span className="text-cyan-300">{selectedBatch.tx_hash}</span>
          </div>
          <span className="inline-flex items-center space-x-1 text-cyan-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Anchored</span>
          </span>
        </div>
      </div>
    </div>
  );
};
