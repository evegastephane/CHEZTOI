import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Pressable, Image, Modal, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useRouter } from "expo-router";
import { Bien, BIENS_DB } from "@/data/db";
import { convStore } from "@/data/conversations";
import { C } from "@/constants/colors";

const SCREEN_W      = Dimensions.get("window").width;
const CARD_W        = (SCREEN_W - 20 * 2 - 10) / 2;
const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? "";

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
  if (m.includes("douala"))                          return "Douala";
  if (m.includes("yaoundé") || m.includes("yaounde")) return "Yaoundé";
  if (m.includes("dakar"))                           return "Dakar";
  if (m.includes("abidjan"))                         return "Abidjan";
  if (m.includes("casablanca"))                      return "Casablanca";
  if (m.includes("marrakech"))                       return "Marrakech";
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

function dateRelative(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const j    = Math.floor(diff / 86400000);
  if (j === 0) return "Aujourd'hui";
  if (j === 1) return "Hier";
  if (j < 7)   return `Il y a ${j} jours`;
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ─── Modèles disponibles ─────────────────────────────────────────────────────

type ModeleIA = { id: string; nom: string; desc: string };

const MODELES: ModeleIA[] = [
  { id: "claude-haiku-4-5-20251001", nom: "Claude Haiku",  desc: "Rapide et efficace" },
  { id: "claude-sonnet-4-6",         nom: "Claude Sonnet", desc: "Plus puissant"       },
];

// ─── API Claude ───────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es Lia, l'assistante professionnelle de CheZToi, une plateforme de location immobilière internationale spécialisée en Afrique subsaharienne et au Maghreb (Cameroun, Sénégal, Côte d'Ivoire, Maroc).
Tu es courtoise, formelle et experte en immobilier.
Tu vouvoies systématiquement les clients et tu t'exprimes avec respect et professionnalisme.
Tu n'utilises jamais d'émojis dans tes réponses.
Tu réponds en français de façon concise et précise (2-4 phrases sauf si l'on te demande des détails).
Tu peux structurer tes réponses avec des listes à puces (- item) ou du texte en gras (**texte**) lorsque cela améliore la lisibilité.
Pour les prix, utilise le format "X €/nuit". Ne génère jamais de JSON ni de code dans tes réponses.`;

async function appellerClaude(
  userMessage: string,
  historique:  Message[],
  contexteBiens: string,
  modele: string
): Promise<string> {
  const conv = historique
    .slice(-10)
    .map((m) => ({
      role:    (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));

  conv.push({ role: "user", content: userMessage });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key":                                  ANTHROPIC_KEY,
      "anthropic-version":                          "2023-06-01",
      "content-type":                               "application/json",
      "anthropic-dangerous-direct-browser-access":  "true",
    },
    body: JSON.stringify({
      model:      modele,
      max_tokens: 512,
      system:     SYSTEM_PROMPT + contexteBiens,
      messages:   conv,
    }),
  });

  if (!res.ok) throw new Error(`Erreur API ${res.status}`);
  const data = await res.json();
  return data.content[0].text as string;
}

// ─── Rendu Markdown ───────────────────────────────────────────────────────────

function renderInline(text: string, color: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex  = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Text key={key++} style={{ color, fontSize: 14, lineHeight: 22 }}>
          {text.slice(lastIndex, match.index)}
        </Text>
      );
    }
    if (match[1]) {
      parts.push(<Text key={key++} style={{ color, fontSize: 14, lineHeight: 22, fontWeight: "700", fontStyle: "italic" }}>{match[1]}</Text>);
    } else if (match[2]) {
      parts.push(<Text key={key++} style={{ color, fontSize: 14, lineHeight: 22, fontWeight: "700" }}>{match[2]}</Text>);
    } else if (match[3]) {
      parts.push(<Text key={key++} style={{ color, fontSize: 14, lineHeight: 22, fontStyle: "italic" }}>{match[3]}</Text>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(<Text key={key++} style={{ color, fontSize: 14, lineHeight: 22 }}>{text.slice(lastIndex)}</Text>);
  }

  return parts.length > 0 ? parts : text;
}

function RenduMarkdown({ content, isUser }: { content: string; isUser: boolean }) {
  const color = isUser ? C.primaryFg : C.fg;
  const lines = content.split("\n");

  return (
    <View style={{ gap: 4 }}>
      {lines.map((raw, i) => {
        const line = raw.trim();
        if (!line) return <View key={i} style={{ height: 4 }} />;

        const bullet   = line.match(/^[-•]\s+(.*)/);
        const numbered = line.match(/^(\d+)\.\s+(.*)/);
        const h3       = line.match(/^###\s+(.*)/);
        const h2       = line.match(/^##\s+(.*)/);
        const h1       = line.match(/^#\s+(.*)/);

        if (bullet) return (
          <View key={i} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
            <Text style={{ color, fontSize: 14, lineHeight: 22, marginTop: 1 }}>•</Text>
            <Text style={{ flex: 1, fontSize: 14, lineHeight: 22, color }}>{renderInline(bullet[1], color)}</Text>
          </View>
        );

        if (numbered) return (
          <View key={i} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
            <Text style={{ color, fontSize: 14, lineHeight: 22, minWidth: 20 }}>{numbered[1]}.</Text>
            <Text style={{ flex: 1, fontSize: 14, lineHeight: 22, color }}>{renderInline(numbered[2], color)}</Text>
          </View>
        );

        if (h3) return <Text key={i} style={{ color, fontSize: 14, fontWeight: "700", lineHeight: 22 }}>{renderInline(h3[1], color)}</Text>;
        if (h2) return <Text key={i} style={{ color, fontSize: 15, fontWeight: "700", lineHeight: 23 }}>{renderInline(h2[1], color)}</Text>;
        if (h1) return <Text key={i} style={{ color, fontSize: 16, fontWeight: "700", lineHeight: 24 }}>{renderInline(h1[1], color)}</Text>;

        return (
          <Text key={i} style={{ color, fontSize: 14, lineHeight: 22 }}>
            {renderInline(line, color)}
          </Text>
        );
      })}
    </View>
  );
}

// ─── Carte bien ───────────────────────────────────────────────────────────────

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

// ─── Bulles de messages ───────────────────────────────────────────────────────

function BulleMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <View style={s.rowUser}>
        <MotiView
          from={{ opacity: 0, translateX: 14 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "timing", duration: 280 }}
        >
          <View style={s.bulleUser}>
            <RenduMarkdown content={msg.content} isUser />
          </View>
        </MotiView>
      </View>
    );
  }

  return (
    <View style={s.rowAI}>
      <MotiView
        from={{ opacity: 0, translateX: -14 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: "timing", duration: 280 }}
        style={{ maxWidth: "90%", gap: 8 }}
      >
        <View style={s.bulleAI}>
          <RenduMarkdown content={msg.content} isUser={false} />
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
      </MotiView>
    </View>
  );
}

// ─── Indicateur de frappe ─────────────────────────────────────────────────────

function DotAnimated({ delay }: { delay: number }) {
  return (
    <MotiView
      from={{ translateY: 0 }}
      animate={{ translateY: -5 }}
      transition={{ loop: true, type: "timing", duration: 380, delay, repeatReverse: true }}
      style={s.dot}
    />
  );
}

function TypingIndicator() {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 220 }}
      style={s.rowAI}
    >
      <View style={[s.bulleAI, { paddingVertical: 14, paddingHorizontal: 18 }]}>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          <DotAnimated delay={0} />
          <DotAnimated delay={140} />
          <DotAnimated delay={280} />
        </View>
      </View>
    </MotiView>
  );
}

// ─── État vide ────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { icon: "location-outline" as const, texte: "Biens disponibles à Douala ?" },
  { icon: "home-outline"     as const, texte: "Montre-moi les villas" },
  { icon: "cash-outline"     as const, texte: "Quartiers les plus abordables ?" },
  { icon: "calendar-outline" as const, texte: "Comment fonctionne la réservation ?" },
];

function EtatVide({ onSuggestion }: { onSuggestion: (t: string) => void }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <MotiView
        from={{ opacity: 0, translateY: 18 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 420 }}
        style={s.videContainer}
      >
        <MotiView
          from={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", delay: 80 }}
          style={s.videAvatar}
        >
          <Ionicons name="home-sharp" size={28} color={C.primaryFg} />
        </MotiView>

        <Text style={s.videTitre}>Bonjour, je suis Lia</Text>
        <Text style={s.videSous}>Comment puis-je vous aider aujourd'hui ?</Text>

        <View style={s.suggestGrid}>
          {SUGGESTIONS.map((item, idx) => (
            <MotiView
              key={item.texte}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 340, delay: 120 + idx * 70 }}
              style={{ width: CARD_W }}
            >
              <TouchableOpacity
                style={s.suggestCard}
                onPress={() => onSuggestion(item.texte)}
                activeOpacity={0.7}
              >
                <View style={s.suggestIconWrap}>
                  <Ionicons name={item.icon} size={16} color={C.accent} />
                </View>
                <Text style={s.suggestTxt}>{item.texte}</Text>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>
      </MotiView>
    </ScrollView>
  );
}

// ─── Modal historique ─────────────────────────────────────────────────────────

function ModalHistorique({
  visible,
  onClose,
  onCharger,
}: {
  visible:   boolean;
  onClose:   () => void;
  onCharger: (id: string, messages: Message[]) => void;
}) {
  const [conversations, setConversations] = useState(convStore.lister());

  useEffect(() => {
    if (visible) setConversations(convStore.lister());
  }, [visible]);

  const supprimer = (id: string) => {
    convStore.supprimer(id);
    setConversations(convStore.lister());
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose}>
        <Pressable style={s.modalPanel} onPress={() => {}}>
          <View style={s.modalHandle} />

          <View style={s.modalHeader}>
            <Text style={s.modalTitre}>Historique</Text>
            <TouchableOpacity style={s.modalCloseBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color={C.fg} />
            </TouchableOpacity>
          </View>

          {conversations.length === 0 ? (
            <View style={s.modalVide}>
              <Ionicons name="chatbubble-outline" size={36} color={C.border} />
              <Text style={s.modalVideTxt}>Aucune conversation pour l'instant</Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(c) => c.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
              ItemSeparatorComponent={() => <View style={s.separator} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.histItem}
                  onPress={() => {
                    const msgs: Message[] = item.messages.map((m) => ({
                      ...m,
                      timestamp: new Date(m.timestamp),
                      biens:     undefined,
                    }));
                    onCharger(item.id, msgs);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={s.histTitre} numberOfLines={1}>{item.titre}</Text>
                    <Text style={s.histApercu} numberOfLines={1}>{item.apercu}</Text>
                    <Text style={s.histDate}>{dateRelative(item.date)}</Text>
                  </View>
                  <TouchableOpacity
                    style={s.histDelBtn}
                    onPress={() => supprimer(item.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={C.mutedFg} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function AI() {
  const router = useRouter();

  const convIdRef = useRef<string>(`conv_${Date.now()}`);

  const [messages,          setMessages]          = useState<Message[]>([]);
  const [input,             setInput]             = useState("");
  const [typing,            setTyping]            = useState(false);
  const [historiqueOpen,    setHistoriqueOpen]    = useState(false);
  const [menuOpen,          setMenuOpen]          = useState(false);
  const [selectedModel,     setSelectedModel]     = useState(MODELES[0].id);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, typing]);

  const nouvelleConversation = () => {
    convIdRef.current = `conv_${Date.now()}`;
    setMessages([]);
    setInput("");
  };

  const supprimerConversation = () => {
    convStore.supprimer(convIdRef.current);
    nouvelleConversation();
  };

  const chargerConversation = (id: string, msgs: Message[]) => {
    convIdRef.current = id;
    setMessages(msgs);
  };

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
      let biens: Bien[] | undefined;
      let contexteBiens = "";
      if (demandeDesBiens(contenu)) {
        const ville = detecterVille(contenu);
        const res   = rechercherBiens(ville);
        if (res.length > 0) {
          biens         = res;
          contexteBiens = formaterContexteRAG(res, ville);
        }
      }

      const reponse = await appellerClaude(contenu, messages, contexteBiens, selectedModel);

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
        <TouchableOpacity style={s.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="close" size={18} color={C.fg} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <TouchableOpacity
            style={s.modelChip}
            onPress={() => setModelSelectorOpen(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="sparkles" size={10} color={C.accent} />
            <Text style={s.modelChipTxt}>
              {MODELES.find((m) => m.id === selectedModel)?.nom ?? "Claude Haiku"}
            </Text>
            <Ionicons name="chevron-down" size={10} color={C.mutedFg} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.iconBtn} onPress={() => setMenuOpen(true)} activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={17} color={C.fg} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {messages.length === 0 && !typing ? (
          <EtatVide onSuggestion={(t) => envoyer(t)} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={s.liste}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={typing ? <TypingIndicator /> : null}
            renderItem={({ item }) => <BulleMessage msg={item} />}
          />
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

      <ModalHistorique
        visible={historiqueOpen}
        onClose={() => setHistoriqueOpen(false)}
        onCharger={chargerConversation}
      />

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={s.menuOverlay} onPress={() => setMenuOpen(false)}>
          <View style={s.menuPanel}>
            <TouchableOpacity style={s.menuItem} onPress={() => { setMenuOpen(false); setHistoriqueOpen(true); }} activeOpacity={0.7}>
              <Ionicons name="time-outline" size={16} color={C.fg} />
              <Text style={s.menuItemTxt}>Historique</Text>
            </TouchableOpacity>
            <View style={s.menuSep} />
            <TouchableOpacity style={s.menuItem} onPress={() => { setMenuOpen(false); nouvelleConversation(); }} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={16} color={C.fg} />
              <Text style={s.menuItemTxt}>Nouvelle conversation</Text>
            </TouchableOpacity>
            <View style={s.menuSep} />
            <TouchableOpacity style={s.menuItem} onPress={() => { setMenuOpen(false); supprimerConversation(); }} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={16} color={C.red} />
              <Text style={[s.menuItemTxt, { color: C.red }]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Sélecteur de modèle */}
      <Modal visible={modelSelectorOpen} transparent animationType="fade" onRequestClose={() => setModelSelectorOpen(false)}>
        <Pressable style={s.menuOverlay} onPress={() => setModelSelectorOpen(false)}>
          <View style={s.modelPanel}>
            <Text style={s.modelPanelTitre}>Modèle IA</Text>
            {MODELES.map((m, i) => {
              const actif = m.id === selectedModel;
              return (
                <View key={m.id}>
                  {i > 0 && <View style={s.menuSep} />}
                  <TouchableOpacity
                    style={s.modelItem}
                    onPress={() => { setSelectedModel(m.id); setModelSelectorOpen(false); }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[s.modelItemNom, actif && { color: C.primary }]}>{m.nom}</Text>
                      <Text style={s.modelItemDesc}>{m.desc}</Text>
                    </View>
                    {actif && <Ionicons name="checkmark-circle" size={18} color={C.primary} />}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, backgroundColor: C.bg },
  headerCenter: { alignItems: "center", flex: 1, gap: 5 },
  headerTitle:  { fontSize: 15, fontWeight: "700", color: C.fg },
  modelChip:    { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.accentBg, borderRadius: 20, borderWidth: 1, borderColor: C.accentBdr, paddingHorizontal: 20, paddingVertical: 7 },
  modelChipTxt: { fontSize: 10, fontWeight: "600", color: C.accent },
  iconBtn:      { width: 34, height: 34, borderRadius: 10, backgroundColor: C.muted, alignItems: "center", justifyContent: "center" },

  // Sélecteur de modèle
  modelPanel:      { position: "absolute", top: 72, left: "50%", transform: [{ translateX: -110 }], width: 220, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 8, overflow: "hidden" },
  modelPanelTitre: { fontSize: 11, fontWeight: "700", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  modelItem:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  modelItemNom:    { fontSize: 14, fontWeight: "600", color: C.fg },
  modelItemDesc:   { fontSize: 11, color: C.mutedFg, marginTop: 1 },

  // Menu déroulant
  menuOverlay:   { flex: 1 },
  menuPanel:     { position: "absolute", top: 58, right: 12, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 8, minWidth: 200 },
  menuItem:      { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  menuItemTxt:   { fontSize: 14, color: C.fg },
  menuSep:       { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: 12 },


  // Messages
  liste:    { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 12 },
  rowUser:  { alignItems: "flex-end" },
  rowAI:    { alignItems: "flex-start" },
  bulleUser:{ backgroundColor: C.primary, borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 16, paddingVertical: 11, maxWidth: SCREEN_W * 0.82 },
  bulleAI:  { backgroundColor: C.card, borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 11, borderWidth: 1, borderColor: C.border },
  dot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: C.mutedFg },

  // État vide
  videContainer:  { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 24, gap: 10 },
  videAvatar:     { width: 60, height: 60, borderRadius: 18, backgroundColor: C.accent, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  videTitre:      { fontSize: 20, fontWeight: "700", color: C.fg, letterSpacing: -0.3, textAlign: "center" },
  videSous:       { fontSize: 13, color: C.mutedFg, textAlign: "center", marginBottom: 4 },
  suggestGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  suggestCard:    { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, gap: 6, width: "100%" },
  suggestIconWrap:{ width: 28, height: 28, borderRadius: 8, backgroundColor: C.accentBg, alignItems: "center", justifyContent: "center" },
  suggestTxt:     { fontSize: 12, color: C.fg, lineHeight: 17 },

  // Barre de saisie
  inputBar:   { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 16, backgroundColor: C.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, gap: 6 },
  inputWrap:  { flexDirection: "row", alignItems: "flex-end", backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  input:      { flex: 1, fontSize: 14, color: C.fg, maxHeight: 100, paddingTop: 0, paddingBottom: 0 },
  sendBtn:    { width: 34, height: 34, borderRadius: 17, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  sendBtnOff: { backgroundColor: C.border },
  disclaimer: { fontSize: 10, color: C.mutedFg, textAlign: "center" },

  // Modal historique
  modalOverlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalPanel:    { backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "65%", paddingBottom: 16 },
  modalHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginTop: 12, marginBottom: 8 },
  modalHeader:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  modalTitre:    { fontSize: 15, fontWeight: "700", color: C.fg },
  modalCloseBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.muted, alignItems: "center", justifyContent: "center" },
  modalVide:     { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 12 },
  modalVideTxt:  { fontSize: 14, color: C.mutedFg },
  separator:     { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: 20 },
  histItem:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  histTitre:     { fontSize: 14, fontWeight: "600", color: C.fg },
  histApercu:    { fontSize: 12, color: C.mutedFg },
  histDate:      { fontSize: 11, color: C.accent },
  histDelBtn:    { width: 32, height: 32, borderRadius: 8, backgroundColor: C.muted, alignItems: "center", justifyContent: "center" },

  // Cartes propriété
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
