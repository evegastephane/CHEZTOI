import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Pressable, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Bien, BIENS_DB } from "@/data/db";
import { convStore } from "@/data/conversations";

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? "";

const C = {
  bg:        "#FAFAFA",
  card:      "#FFFFFF",
  border:    "#E4E4E7",
  muted:     "#F4F4F5",
  mutedFg:   "#71717A",
  fg:        "#18181B",
  primary:   "#18181B",
  primaryFg: "#FAFAFA",
  accent:    "#208AEF",
  accentBg:  "#EFF6FF",
  accentBdr: "#BFDBFE",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id:        string;
  role:      "user" | "ai";
  content:   string;
  timestamp: Date;
  biens?:    Bien[];
};

// ─── RAG ─────────────────────────────────────────────────────────────────────

function detecterVille(message: string): string | undefined {
  const m = message.toLowerCase();
  if (m.includes("douala"))     return "Douala";
  if (m.includes("yaoundé") || m.includes("yaounde")) return "Yaoundé";
  if (m.includes("dakar"))      return "Dakar";
  if (m.includes("abidjan"))    return "Abidjan";
  if (m.includes("casablanca")) return "Casablanca";
  if (m.includes("marrakech"))  return "Marrakech";
  return undefined;
}

function demandeDesBiens(message: string): boolean {
  const mots = ["disponible", "appartement", "villa", "bien", "logement",
    "cherche", "studio", "chambre", "voir", "louer", "location",
    "quartier", "maison", "riad", "résidence", "duplex", "penthouse",
    "douala", "yaoundé", "yaounde", "dakar", "abidjan", "casablanca", "marrakech"];
  return mots.some((k) => message.toLowerCase().includes(k));
}

function rechercherBiens(ville?: string): Bien[] {
  let res = BIENS_DB.filter((b) => b.disponible);
  if (ville) res = res.filter((b) => b.ville.toLowerCase() === ville.toLowerCase());
  return res;
}

function formaterContexteRAG(biens: Bien[], ville?: string): string {
  const en_tete = ville
    ? `Biens disponibles à ${ville} dans notre catalogue`
    : "Biens disponibles dans notre catalogue";
  const liste = biens.map((b) =>
    `• [${b.id}] ${b.nom} — ${b.type}, ${b.chambres} ch., ${b.surface}m², ${b.ville} — ${b.prix}€/nuit — Note: ${b.note}/5`
  ).join("\n");
  return `\n\n${en_tete} :\n${liste}\n\nMentionne ces biens naturellement dans ta réponse selon la demande.`;
}

// ─── API Claude ───────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es Lia, l'assistante IA de CheZToi, une plateforme de location immobilière internationale.
Tu es chaleureuse, professionnelle et experte en immobilier (Cameroun, Sénégal, Côte d'Ivoire, Maroc).
Tu réponds toujours en français, de façon naturelle et concise (2-3 phrases sauf si on demande plus).
Pour les prix, utilise le format "X €/nuit". Ne génère jamais de JSON ou de code dans tes réponses.`;

async function appellerClaude(
  userMessage: string,
  historique: Message[],
  contexteBiens: string
): Promise<string> {
  const conv = historique
    .slice(1)    // ignorer le message de bienvenue
    .slice(-10)  // 5 derniers échanges max
    .map((m) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));

  conv.push({ role: "user", content: userMessage });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key":                                 ANTHROPIC_KEY,
      "anthropic-version":                         "2023-06-01",
      "content-type":                              "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model:    "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system:   SYSTEM_PROMPT + contexteBiens,
      messages: conv,
    }),
  });

  if (!res.ok) throw new Error(`Erreur API ${res.status}`);
  const data = await res.json();
  return data.content[0].text as string;
}

// ─── Composants UI ────────────────────────────────────────────────────────────

// Style identique aux cartes de la page d'accueil
function CarteBien({ b }: { b: Bien }) {
  const router = useRouter();
  return (
    <Pressable
      style={s.propCard}
      onPress={() => router.push({ pathname: "/bien/[id]", params: { id: b.id } })}
    >
      <Image source={{ uri: b.image }} style={s.propImg} resizeMode="cover" />
      <View style={s.propOverlay} />

      <View style={s.propTypeBadge}>
        <Text style={s.propTypeTxt}>{b.type}</Text>
      </View>

      <View style={s.propContent}>
        <View style={s.propNoteRow}>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <Text style={s.propNoteTxt}>{b.note}</Text>
        </View>
        <Text style={s.propNom} numberOfLines={2}>{b.nom}</Text>
        <View style={s.propVilleRow}>
          <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.7)" />
          <Text style={s.propVille}>{b.ville}</Text>
        </View>
        <View style={s.propFooter}>
          <Text style={s.propPrix}>{b.prix} €<Text style={s.propNuit}>/nuit</Text></Text>
          <View style={s.propMetaRow}>
            <Ionicons name="bed-outline" size={11} color="rgba(255,255,255,0.7)" />
            <Text style={s.propMetaTxt}>{b.chambres} ch.</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function BulleMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const heure  = msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  if (isUser) {
    return (
      <View style={s.rowUser}>
        <View style={s.bulleUser}>
          <Text style={s.txtUser}>{msg.content}</Text>
        </View>
        <Text style={s.heure}>{heure}</Text>
      </View>
    );
  }

  return (
    <View style={s.rowAI}>
      <View style={s.avatarAI}>
        <Ionicons name="home-sharp" size={14} color={C.accent} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={s.bulleAI}>
          <Text style={s.txtAI}>{msg.content}</Text>
        </View>
        {msg.biens && msg.biens.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: 4 }}
          >
            {msg.biens.map((b) => <CarteBien key={b.id} b={b} />)}
          </ScrollView>
        )}
        <Text style={s.heure}>{heure}</Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={s.rowAI}>
      <View style={s.avatarAI}>
        <Ionicons name="home-sharp" size={14} color={C.accent} />
      </View>
      <View style={[s.bulleAI, { paddingVertical: 14, paddingHorizontal: 18 }]}>
        <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
          <View style={s.dot} />
          <View style={[s.dot, { opacity: 0.6 }]} />
          <View style={[s.dot, { opacity: 0.3 }]} />
        </View>
      </View>
    </View>
  );
}

const SUGGESTIONS = [
  "Quels biens sont disponibles à Douala ?",
  "Montre-moi les villas",
  "Quartiers les plus abordables ?",
  "Comment fonctionne la réservation ?",
];

const MSG_BIENVENUE: Message = {
  id:        "0",
  role:      "ai",
  content:   "Bonjour ! Je suis Lia, votre assistante immobilière CheZToi 🏠 Je peux vous aider à trouver le logement idéal, répondre à vos questions sur les quartiers et les prix. Par où commençons-nous ?",
  timestamp: new Date(),
};

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function AI() {
  const router  = useRouter();
  const { convId: convIdParam } = useLocalSearchParams<{ convId?: string }>();

  // Identifiant stable de la conversation
  const convIdRef = useRef<string>(convIdParam ?? `conv_${Date.now()}`);

  // Initialiser avec la conversation existante ou une nouvelle
  const [messages, setMessages] = useState<Message[]>(() => {
    if (convIdParam) {
      const conv = convStore.obtenir(convIdParam);
      if (conv) return conv.messages.map((m) => ({ ...m, biens: undefined }));
    }
    return [MSG_BIENVENUE];
  });

  const [input,  setInput]  = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, typing]);

  const envoyer = async (texte?: string) => {
    const contenu = (texte ?? input).trim();
    if (!contenu || typing) return;

    const msgUser: Message = {
      id:        Date.now().toString(),
      role:      "user",
      content:   contenu,
      timestamp: new Date(),
    };
    const avecUser = [...messages, msgUser];

    setMessages(avecUser);
    setInput("");
    setTyping(true);

    try {
      // RAG : récupérer les biens pertinents
      let biens: Bien[] | undefined;
      let contexteBiens = "";
      if (demandeDesBiens(contenu)) {
        const ville = detecterVille(contenu);
        const res   = rechercherBiens(ville);
        if (res.length > 0) {
          biens        = res;
          contexteBiens = formaterContexteRAG(res, ville);
        }
      }

      const reponse = await appellerClaude(contenu, messages, contexteBiens);

      const msgAI: Message = {
        id:        (Date.now() + 1).toString(),
        role:      "ai",
        content:   reponse,
        timestamp: new Date(),
        biens,
      };
      const complet = [...avecUser, msgAI];

      setTyping(false);
      setMessages(complet);

      // Sauvegarder la conversation
      const premierUser = complet.find((m) => m.role === "user");
      convStore.sauvegarder({
        id:       convIdRef.current,
        titre:    premierUser?.content.slice(0, 60) ?? "Conversation",
        apercu:   reponse.slice(0, 80),
        date:     new Date(),
        messages: complet.map((m) => ({
          id:        m.id,
          role:      m.role,
          content:   m.content,
          timestamp: m.timestamp,
        })),
      });
    } catch {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id:        (Date.now() + 1).toString(),
          role:      "ai",
          content:   "Désolée, je rencontre une difficulté technique. Veuillez réessayer dans un instant.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color={C.fg} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <View style={s.headerIcon}>
            <Ionicons name="home-sharp" size={18} color={C.primaryFg} />
          </View>
          <View>
            <Text style={s.headerTitle}>Lia</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={s.onlineDot} />
              <Text style={s.headerSub}>En ligne · Assistante CheZToi</Text>
            </View>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={s.liste}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={typing ? <TypingIndicator /> : null}
          renderItem={({ item }) => <BulleMessage msg={item} />}
        />

        {messages.length <= 1 && !typing && (
          <View style={s.suggestions}>
            <Text style={s.suggestLabel}>Suggestions</Text>
            <View style={s.suggestRow}>
              {SUGGESTIONS.map((sug) => (
                <TouchableOpacity
                  key={sug}
                  style={s.suggestPill}
                  onPress={() => envoyer(sug)}
                  activeOpacity={0.7}
                >
                  <Text style={s.suggestTxt}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={s.inputBar}>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="Posez votre question à Lia…"
              placeholderTextColor={C.mutedFg}
              value={input}
              onChangeText={setInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={() => envoyer()}
            />
            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || typing) && s.sendBtnOff]}
              onPress={() => envoyer()}
              disabled={!input.trim() || typing}
              activeOpacity={0.8}
            >
              {typing
                ? <ActivityIndicator size="small" color={C.primaryFg} />
                : <Ionicons name="arrow-up" size={18} color={C.primaryFg} />
              }
            </TouchableOpacity>
          </View>
          <Text style={s.disclaimer}>Lia peut faire des erreurs. Vérifiez les informations importantes.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 12, backgroundColor: C.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  closeBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: C.muted, alignItems: "center", justifyContent: "center" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  headerTitle:  { fontSize: 15, fontWeight: "700", color: C.fg },
  headerSub:    { fontSize: 11, color: C.mutedFg },
  onlineDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },

  // Messages
  liste:     { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 12 },
  rowUser:   { alignItems: "flex-end", gap: 4 },
  rowAI:     { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  avatarAI:  { width: 30, height: 30, borderRadius: 10, backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accentBdr, alignItems: "center", justifyContent: "center", marginTop: 2 },
  bulleUser: { backgroundColor: C.primary, borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 16, paddingVertical: 10, maxWidth: "80%" },
  bulleAI:   { backgroundColor: C.card, borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  txtUser:   { fontSize: 14, color: C.primaryFg, lineHeight: 20 },
  txtAI:     { fontSize: 14, color: C.fg, lineHeight: 20 },
  heure:     { fontSize: 10, color: C.mutedFg },
  dot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: C.mutedFg },

  // Suggestions
  suggestions:  { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  suggestLabel: { fontSize: 11, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.5 },
  suggestRow:   { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestPill:  { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  suggestTxt:   { fontSize: 13, color: C.fg },

  // Input
  inputBar:   { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 16, backgroundColor: C.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, gap: 6 },
  inputWrap:  { flexDirection: "row", alignItems: "flex-end", backgroundColor: C.muted, borderRadius: 24, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  input:      { flex: 1, fontSize: 14, color: C.fg, maxHeight: 100, paddingTop: 0, paddingBottom: 0 },
  sendBtn:    { width: 34, height: 34, borderRadius: 17, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  sendBtnOff: { backgroundColor: C.border },
  disclaimer: { fontSize: 10, color: C.mutedFg, textAlign: "center" },

  // Cartes propriété — style identique à la page d'accueil
  propCard:      { width: 200, height: 200, borderRadius: 20, overflow: "hidden" },
  propImg:       { ...StyleSheet.absoluteFillObject },
  propOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  propTypeBadge: { position: "absolute", top: 12, left: 12, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  propTypeTxt:   { fontSize: 10, color: "#FFF", fontWeight: "700", letterSpacing: 0.3 },
  propContent:   { position: "absolute", bottom: 0, left: 0, right: 0, padding: 14, gap: 3 },
  propNoteRow:   { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 2 },
  propNoteTxt:   { fontSize: 11, fontWeight: "600", color: "#FFF" },
  propNom:       { fontSize: 15, fontWeight: "700", color: "#FFF", letterSpacing: -0.2 },
  propVilleRow:  { flexDirection: "row", alignItems: "center", gap: 3 },
  propVille:     { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  propFooter:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  propPrix:      { fontSize: 15, fontWeight: "700", color: "#FFF" },
  propNuit:      { fontSize: 11, fontWeight: "400", color: "rgba(255,255,255,0.7)" },
  propMetaRow:   { flexDirection: "row", alignItems: "center", gap: 3 },
  propMetaTxt:   { fontSize: 11, color: "rgba(255,255,255,0.8)" },
});