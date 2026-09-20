import "server-only";
import * as ed from "@noble/ed25519";

// DEMO-ONLY synthetic issuer key, generated once per server process --
// never a real credential (see the project brief's synthetic-demo-data
// principle). Mirrors src/crypto/ed25519.ts's generateIssuerKeyPair(); no
// shared package exists between backend and frontend, so this is a small,
// deliberate duplication. The "server-only" import above makes this module
// throw a build error if anything ever tries to pull it into client code.

interface DemoKeyPair {
  privateKey: Uint8Array;
  publicKeyHex: string;
}

let cachedKeyPair: Promise<DemoKeyPair> | null = null;

async function generateDemoKeyPair(): Promise<DemoKeyPair> {
  const privateKey = ed.etc.randomBytes(32);
  const publicKeyBytes = await ed.getPublicKeyAsync(privateKey);
  const publicKeyHex = Buffer.from(publicKeyBytes).toString("hex");
  return { privateKey, publicKeyHex };
}

// Memoized so the same demo identity signs every claim for the lifetime of
// the running server process (fixed enough for a live demo), without
// committing a private key -- synthetic or not -- into source control.
export function getDemoKeyPair(): Promise<DemoKeyPair> {
  if (!cachedKeyPair) {
    cachedKeyPair = generateDemoKeyPair();
  }
  return cachedKeyPair;
}
