/**
 * Server-side API utilities for ISR (Incremental Static Regeneration)
 * These functions run on the server during build/revalidation time
 */

// Server-side fetch requires absolute URLs
// Handle both absolute and relative URLs from env
const getApiUrl = () => {
  console.log('[API Server] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  let envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // Clean up potential quotes or whitespace
  envUrl = envUrl.replace(/["']/g, '').trim();

  // If it's a relative URL (starts with /), use the backend server URL
  if (envUrl.startsWith('/')) {
    // In production, use the Railway backend URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    console.log('[API Server] Using Backend URL:', backendUrl);
    return backendUrl;
  }
  console.log('[API Server] Resolved API_URL:', envUrl);
  return envUrl;
};

const API_URL = getApiUrl();

export interface Ipo {
  id: string;
  name: string;
  subStart: string | null;
  subEnd: string | null;
  offerPrice: number | null;
  bandLow: number | null;
  bandHigh: number | null;
  competition: string | null;
  underwriter: string | null;
  lockupRate: string | null;
  circulatingSupply: string | null;
  otcPrice: string | null;
  refundDate: string | null;
  listDate: string | null;
}

export async function getIpoListServer(): Promise<Ipo[]> {
  const res = await fetch(`${API_URL}/ipo`, {
    next: { revalidate: 60 }, // ISR: Revalidate every 60 seconds
  });

  if (!res.ok) {
    throw new Error('Failed to fetch IPO list');
  }

  return res.json();
}

export async function getIpoDetailServer(id: string): Promise<Ipo | null> {
  const res = await fetch(`${API_URL}/ipo/${id}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}
