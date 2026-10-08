/**
 * Cryptographic utility module for Docufy
 * Implements deterministic canonical SHA-256 calculation and Merkle tree generation
 * adhering to PRD Section 6.2 and 6.3.
 */

// Convert ArrayBuffer to hex string
export function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Compute standard SHA-256 digest of arbitrary ArrayBuffer
export async function computeSHA256Buffer(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return bufferToHex(hashBuffer);
}

// Compute SHA-256 of text string (UTF-8)
export async function computeSHA256Text(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

// Compute SHA-256 of a browser File object
export async function computeSHA256File(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  return computeSHA256Buffer(arrayBuffer);
}

// Canonical JSON representation: deterministic key ordering, no extra whitespace
export function canonicalizeJSON(obj: Record<string, unknown>): string {
  const sortedKeys = Object.keys(obj).sort();
  const result: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    const val = obj[key];
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = JSON.parse(canonicalizeJSON(val as Record<string, unknown>));
    } else {
      result[key] = val;
    }
  }
  return JSON.stringify(result);
}

// Pairwise hash for Merkle Tree nodes (RFC 6962 standard format)
export async function hashPair(leftHex: string, rightHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const combined = leftHex.toLowerCase() + rightHex.toLowerCase();
  const data = encoder.encode(combined);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hash);
}

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
}

// Build a complete Merkle Tree from a list of leaf hashes
export async function buildMerkleTree(leafHashes: string[]): Promise<{
  root: string;
  leaves: string[];
  layers: string[][];
}> {
  if (leafHashes.length === 0) {
    return {
      root: '0000000000000000000000000000000000000000000000000000000000000000',
      leaves: [],
      layers: [[]],
    };
  }

  const layers: string[][] = [];
  let currentLayer = [...leafHashes];
  layers.push(currentLayer);

  while (currentLayer.length > 1) {
    const nextLayer: string[] = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      const left = currentLayer[i];
      const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left; // duplicate if odd
      const parentHash = await hashPair(left, right);
      nextLayer.push(parentHash);
    }
    layers.push(nextLayer);
    currentLayer = nextLayer;
  }

  return {
    root: currentLayer[0],
    leaves: leafHashes,
    layers,
  };
}

// Generate audit event hash for hash chaining
export async function computeAuditEventHash(
  prevHash: string,
  eventId: string,
  actor: string,
  action: string,
  timestamp: string,
  details: string
): Promise<string> {
  const payload = `${prevHash}|${eventId}|${actor}|${action}|${timestamp}|${details}`;
  return computeSHA256Text(payload);
}
