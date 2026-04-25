// Store en mémoire — les conversations persistent pendant la session
// Pour une vraie persistance, remplacer par AsyncStorage ou SQLite

export type ConvMessage = {
  id:        string;
  role:      "user" | "ai";
  content:   string;
  timestamp: Date;
};

export type Conversation = {
  id:       string;
  titre:    string;  // premier message utilisateur (tronqué)
  apercu:   string;  // dernier message IA (tronqué)
  date:     Date;
  messages: ConvMessage[];
};

const _store: Conversation[] = [];

export const convStore = {
  sauvegarder(conv: Conversation): void {
    const i = _store.findIndex((c) => c.id === conv.id);
    if (i >= 0) _store[i] = conv;
    else _store.unshift(conv);
  },
  lister(): Conversation[] {
    return [..._store];
  },
  obtenir(id: string): Conversation | undefined {
    return _store.find((c) => c.id === id);
  },
  supprimer(id: string): void {
    const i = _store.findIndex((c) => c.id === id);
    if (i >= 0) _store.splice(i, 1);
  },
};