import { useSyncExternalStore } from "react";

export type BienPublie = {
  id:             string;
  proprietaireId: string;
  nom:            string;
  ville:          string;
  pays:           string;
  type:           "Location" | "Résidence";
  prix:           number;
  chambres:       number;
  surface:        number;
  description:    string;
  photos:         string[];  // URIs locales
  disponible:     boolean;
  note:           number;
  avis:           number;
  createdAt:      string;
};

type Listener = () => void;

const _biens: BienPublie[]    = [];
let   _snapshot: BienPublie[] = []; // référence stable — mise à jour uniquement dans notifier()
const _listeners = new Set<Listener>();

function notifier() {
  _snapshot = [..._biens]; // nouvelle référence seulement quand les données changent
  _listeners.forEach((fn) => fn());
}

export const biensStore = {
  ajouter(bien: BienPublie): void {
    _biens.unshift(bien);
    notifier();
  },

  supprimer(id: string): void {
    const i = _biens.findIndex((b) => b.id === id);
    if (i >= 0) { _biens.splice(i, 1); notifier(); }
  },

  mettreAJour(id: string, partiel: Partial<BienPublie>): void {
    const i = _biens.findIndex((b) => b.id === id);
    if (i >= 0) { _biens[i] = { ..._biens[i], ...partiel }; notifier(); }
  },

  lister(): BienPublie[] {
    return _snapshot; // toujours la même référence entre deux notifier()
  },

  subscribe(fn: Listener): () => void {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};

export function useBiens(): BienPublie[] {
  return useSyncExternalStore(biensStore.subscribe, biensStore.lister);
}

// Dérivé côté hook — pas besoin d'un second useSyncExternalStore
export function useBiensProprietaire(uid: string | undefined): BienPublie[] {
  const tous = useBiens();
  return tous.filter((b) => b.proprietaireId === (uid ?? ""));
}