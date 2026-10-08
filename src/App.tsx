/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { VerifierPortal } from './components/VerifierPortal';
import { IssuerDashboard } from './components/IssuerDashboard';
import { TrustRegistry } from './components/TrustRegistry';
import { MerkleAnchorExplorer } from './components/MerkleAnchorExplorer';
import { AuditTrail } from './components/AuditTrail';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { 
  INITIAL_DOCUMENTS, 
  INITIAL_AUDIT_TRAIL, 
  INITIAL_ACCREDITED_ORGS 
} from './blockchain/simulatedLedger';
import { TradeDocument, AuditEvent } from './types/docufy';
import { computeSHA256Text } from './crypto/hasher';

export default function App() {
  const [activeTab, setActiveTab] = useState<'verifier' | 'issuer' | 'registry' | 'merkle' | 'audit' | 'architecture'>('verifier');
  const [activePersona, setActivePersona] = useState<string>('CUSTOMS_OFFICER');
  const [documents, setDocuments] = useState<TradeDocument[]>(INITIAL_DOCUMENTS);
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>(INITIAL_AUDIT_TRAIL);

  // When an issuer registers a new trade document
  const handleRegisterDocument = async (newDoc: TradeDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);

    // Append cryptographic audit event (PRD 4.4)
    const prevEvent = auditTrail[0];
    const prevHash = prevEvent ? prevEvent.event_hash : '0000000000000000000000000000000000000000000000000000000000000000';
    const eventId = `EVT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    
    const eventPayload = `${prevHash}|${eventId}|${newDoc.issuerSignerName}|ISSUE|${nowIso}|${newDoc.id}`;
    const eventHash = await computeSHA256Text(eventPayload);

    const newAuditEvent: AuditEvent = {
      event_id: eventId,
      document_id: newDoc.id,
      actor: newDoc.issuerSignerName,
      organization: newDoc.issuerOrgId,
      role: 'ISSUER_CHECKER',
      action: 'ISSUE',
      timestamp: nowIso,
      event_hash: eventHash,
      previous_event_hash: prevHash,
      correlation_id: newDoc.metadata.customsDeclarationNo,
      details: `Minted and anchored ${newDoc.documentType} on Consortium Fabric Block #${newDoc.ledgerProof.blockNumber} (Tx: ${newDoc.ledgerProof.txHash.substring(0, 16)}...)`,
    };

    setAuditTrail((prev) => [newAuditEvent, ...prev]);
  };

  // When an authorized issuer or admin revokes a document
  const handleRevokeDocument = async (docId: string, reason: string) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          return {
            ...d,
            status: 'REVOKED',
            revokedAt: new Date().toISOString(),
            revocationReason: reason,
          };
        }
        return d;
      })
    );

    // Append revocation audit event
    const prevEvent = auditTrail[0];
    const prevHash = prevEvent ? prevEvent.event_hash : '0000000000000000000000000000000000000000000000000000000000000000';
    const eventId = `EVT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    
    const eventPayload = `${prevHash}|${eventId}|Sarah Lin (CVO)|REVOKE|${nowIso}|${docId}`;
    const eventHash = await computeSHA256Text(eventPayload);

    const revokeEvent: AuditEvent = {
      event_id: eventId,
      document_id: docId,
      actor: 'Sarah Lin (Chief Verification Officer)',
      organization: 'ORG-SGP-CHAMBER',
      role: 'ISSUER_CHECKER',
      action: 'REVOKE',
      timestamp: nowIso,
      event_hash: eventHash,
      previous_event_hash: prevHash,
      correlation_id: 'REV-ACTION-' + Math.floor(10000 + Math.random() * 90000),
      details: `Authoritatively revoked document ${docId}. Reason: ${reason}`,
    };

    setAuditTrail((prev) => [revokeEvent, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activePersona={activePersona}
        setActivePersona={setActivePersona}
        documentCount={documents.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'verifier' && (
          <VerifierPortal
            documents={documents}
            onSelectDocument={(doc) => {
              setActiveTab('verifier');
            }}
          />
        )}

        {activeTab === 'issuer' && (
          <IssuerDashboard
            documents={documents}
            onRegisterDocument={handleRegisterDocument}
            onRevokeDocument={handleRevokeDocument}
          />
        )}

        {activeTab === 'registry' && <TrustRegistry />}

        {activeTab === 'merkle' && <MerkleAnchorExplorer documents={documents} />}

        {activeTab === 'audit' && <AuditTrail auditTrail={auditTrail} />}

        {activeTab === 'architecture' && <ArchitectureDocs />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-xs text-slate-500 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-slate-300">DOCUFY</span>
            <span>—</span>
            <span>Enterprise Cross-Border Trade Document Integrity & Anchoring Infrastructure</span>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-400 max-w-xl">
            Important Legal Notice (PRD Page 1): Docufy is a technology and product blueprint, not legal advice. Country-specific customs, electronic-transactions, and records-retention requirements must be validated with qualified local authorities.
          </div>
        </div>
      </footer>
    </div>
  );
}
