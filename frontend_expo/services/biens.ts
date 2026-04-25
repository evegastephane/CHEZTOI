import { Platform } from "react-native";

const DEFAULT_URL =
  Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

export type PhotoAPI = {
  ID:     string;
  BienID: string;
  URL:    string;
  Ordre:  number;
};

export type BienAPI = {
  ID:                  string;
  ProprietaireClerkID: string;
  Titre:               string;
  Description:         string;
  Prix:                number;
  Superficie:          number;
  NombreChambres:      number;
  Note:                number;
  NombreAvis:          number;
  Ville:               string;
  Pays:                string;
  Type:                string;
  Statut:              string;
  Photos:              PhotoAPI[];
  CreatedAt:           string;
};

export type CreerBienPayload = {
  proprietaireClerkId: string;
  titre:               string;
  description:         string;
  prix:                number;
  superficie:          number;
  nombreChambres:      number;
  ville:               string;
  pays:                string;
  type:                string;
  photosBase64:        string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function photoURL(url: string): string {
  return `${API_URL}${url}`;
}

export function premierephoto(bien: BienAPI): string {
  const p = bien.Photos?.find((ph) => ph.Ordre === 0) ?? bien.Photos?.[0];
  return p ? photoURL(p.URL) : "";
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const biensAPI = {
  async lister(ville?: string): Promise<BienAPI[]> {
    const qs  = ville ? `?ville=${encodeURIComponent(ville)}` : "";
    const res = await fetch(`${API_URL}/api/biens${qs}`);
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return res.json();
  },

  async listerParProprietaire(clerkId: string): Promise<BienAPI[]> {
    const res = await fetch(`${API_URL}/api/biens/proprietaire/${encodeURIComponent(clerkId)}`);
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return res.json();
  },

  async creer(payload: CreerBienPayload): Promise<BienAPI> {
    const res = await fetch(`${API_URL}/api/biens`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return res.json();
  },

  async supprimer(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/biens/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
  },
};

// ─── Types revenus ────────────────────────────────────────────────────────────

export type Revenu = {
  ID:                  string;
  ProprietaireClerkID: string;
  BienID?:             string;
  Montant:             number;
  Type:                "LOCATION" | "RETRAIT";
  Description:         string;
  CreatedAt:           string;
};

export type RevenusReponse = {
  revenus:       Revenu[];
  totalRecu:     number;
  totalRetraits: number;
  solde:         number;
};

// ─── API revenus ──────────────────────────────────────────────────────────────

export const revenusAPI = {
  async lister(clerkId: string): Promise<RevenusReponse> {
    const res = await fetch(`${API_URL}/api/revenus/proprietaire/${encodeURIComponent(clerkId)}`);
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return res.json();
  },

  async retirer(proprietaireClerkId: string, montant: number, description: string): Promise<{ solde: number }> {
    const res = await fetch(`${API_URL}/api/revenus/retirer`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ proprietaireClerkId, montant, description }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
    return data;
  },
};