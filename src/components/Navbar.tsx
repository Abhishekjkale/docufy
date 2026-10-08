import React from 'react';
import { ShieldCheck, FileCheck2, Cpu, Database, History, BookOpen, Building2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'verifier' | 'issuer' | 'registry' | 'merkle' | 'audit' | 'architecture';
  setActiveTab: (tab: 'verifier' | 'issuer' | 'registry' | 'merkle' | 'audit' | 'architecture') => void;
  activePersona: string;
  setActivePersona: (persona: string) => void;
  documentCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activePersona,
  setActivePersona,
  documentCount,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      {/* Top Banner / System Telemetry */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-4">
          <span className="flex items-center text-emerald-400 font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
            Consortium Fabric: Operational
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400 font-mono hidden sm:inline">
            EVM L2 (Arbitrum): Block #19,941,824
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden md:inline">
            Verification Latency: <strong className="text-white">p95 ≤ 1.2s</strong>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-slate-400 text-xs hidden lg:inline">Active Persona:</label>
          <select
            value={activePersona}
            onChange={(e) => setActivePersona(e.target.value)}
            className="bg-slate-800 text-cyan-300 border border-slate-700 rounded px-2 py-0.5 text-xs font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="CUSTOMS_OFFICER">Customs Officer (Port of Rotterdam / Singapore)</option>
            <option value="EXPORTER_ISSUER">Authorized Issuer (Singapore International Chamber)</option>
            <option value="CARRIER_LOGISTICS">Maritime Carrier (Maersk Line Maritime)</option>
            <option value="NETWORK_AUDITOR">Cross-Border Compliance Auditor</option>
          </select>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('verifier')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">DOCUFY</span>
                <span className="bg-cyan-950 text-cyan-400 text-[10px] font-semibold uppercase px-2 py-0.5 rounded border border-cyan-800/80">
                  Trade v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Cross-Border Blockchain Document Verification Platform
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('verifier')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'verifier'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Verifier Portal</span>
            </button>

            <button
              onClick={() => setActiveTab('issuer')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'issuer'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Issuer Dashboard</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-800 text-slate-300 text-[10px] rounded-full">
                {documentCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('registry')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'registry'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden md:inline">Trust Registry</span>
              <span className="md:hidden">Registry</span>
            </button>

            <button
              onClick={() => setActiveTab('merkle')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'merkle'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="hidden lg:inline">EVM L2 Merkle Anchors</span>
              <span className="lg:hidden">Anchors</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'audit'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Trail</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'architecture'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Architecture & Code</span>
              <span className="sm:hidden">Docs</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
