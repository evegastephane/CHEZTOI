import { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { convStore, type Conversation } from "@/data/conversations";

import { C } from "@/constants/colors";

function fmtDate(date: Date): string {
  const now  = new Date();
  const diff = now.getTime() - date.getTime();
  const j    = Math.floor(diff / 86_400_000);
  if (j === 0) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (j === 1) return "Hier";
  if (j < 7)  return date.toLocaleDateString("fr-FR", { weekday: "short" });
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function ItemConversation({ conv, onPress }: { conv: Conversation; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [s.item, pressed && s.itemPressed]} onPress={onPress}>
      {/* Avatar Lia */}
      <View style={s.avatarWrap}>
        <View style={s.avatar}>
          <Ionicons name="home-sharp" size={18} color={C.accent} />
        </View>
        <View style={s.onlineDot} />
      </View>

      {/* Contenu */}
      <View style={s.itemBody}>
        <View style={s.itemTop}>
          <Text style={s.itemNom} numberOfLines={1}>Lia</Text>
          <Text style={s.itemDate}>{fmtDate(conv.date)}</Text>
        </View>
        <Text style={s.itemTitre} numberOfLines={1}>{conv.titre}</Text>
        <Text style={s.itemApercu} numberOfLines={1}>{conv.apercu}</Text>
      </View>

      <Ionicons name="chevron-forward" size={14} color={C.border} />
    </Pressable>
  );
}

function EtatVide() {
  const router = useRouter();
  return (
    <View style={s.vide}>
      <View style={s.videIconWrap}>
        <Ionicons name="home-sharp" size={32} color={C.accent} />
      </View>
      <Text style={s.videtitre}>Aucune conversation</Text>
      <Text style={s.videDesc}>
        Démarrez une conversation avec Lia, votre assistante immobilière.
      </Text>
      <TouchableOpacity
        style={s.videBtn}
        onPress={() => router.push("/ai")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={16} color="#FFF" />
        <Text style={s.videBtnTxt}>Nouvelle conversation</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function Messages() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Rafraîchir la liste à chaque fois qu'on arrive sur cet onglet
  useFocusEffect(
    useCallback(() => {
      setConversations(convStore.lister());
    }, [])
  );

  return (
    <SafeAreaView style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>Assistant IA</Text>
          <Text style={s.headerTitle}>Messages</Text>
        </View>
        <TouchableOpacity
          style={s.newBtn}
          onPress={() => router.push("/ai")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={C.fg} />
        </TouchableOpacity>
      </View>

      {/* Bannière Lia */}
      <Pressable
        style={s.banner}
        onPress={() => router.push("/ai")}
      >
        <View style={s.bannerIcon}>
          <Ionicons name="home-sharp" size={20} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitre}>Lia — Assistante CheZToi</Text>
          <Text style={s.bannerDesc}>Trouvez votre logement idéal avec l'IA</Text>
        </View>
        <View style={s.bannerBadge}>
          <View style={s.onlineDotLarge} />
          <Text style={s.bannerStatus}>En ligne</Text>
        </View>
      </Pressable>

      {/* Liste des conversations */}
      <View style={s.section}>
        <Text style={s.sectionTitre}>Historique</Text>
      </View>

      {conversations.length === 0 ? (
        <EtatVide />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          contentContainerStyle={s.liste}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          renderItem={({ item }) => (
            <ItemConversation
              conv={item}
              onPress={() =>
                router.push({ pathname: "/ai", params: { convId: item.id } })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },
  headerSub:   { fontSize: 12, color: C.mutedFg, fontWeight: "500" },
  headerTitle: { fontSize: 26, fontWeight: "700", color: C.fg, letterSpacing: -0.5 },
  newBtn:      { width: 38, height: 38, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },

  // Bannière Lia
  banner:       { marginHorizontal: 20, marginBottom: 16, backgroundColor: C.accent, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  bannerIcon:   { width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  bannerTitre:  { fontSize: 14, fontWeight: "700", color: "#FFF" },
  bannerDesc:   { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 1 },
  bannerBadge:  { flexDirection: "row", alignItems: "center", gap: 4 },
  bannerStatus: { fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: "500" },
  onlineDotLarge: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ADE80" },

  // Section
  section:       { paddingHorizontal: 20, marginBottom: 8 },
  sectionTitre:  { fontSize: 13, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.5 },

  // Liste
  liste: { paddingHorizontal: 20 },
  sep:   { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: 66 },

  // Item conversation
  item:        { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12, backgroundColor: C.bg },
  itemPressed: { opacity: 0.7 },
  avatarWrap:  { position: "relative" },
  avatar:      { width: 46, height: 46, borderRadius: 14, backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accentBdr, alignItems: "center", justifyContent: "center" },
  onlineDot:   { position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: "#22C55E", borderWidth: 2, borderColor: C.bg },
  itemBody:    { flex: 1, gap: 2 },
  itemTop:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemNom:     { fontSize: 14, fontWeight: "700", color: C.fg },
  itemDate:    { fontSize: 11, color: C.mutedFg },
  itemTitre:   { fontSize: 13, color: C.fg, fontWeight: "500" },
  itemApercu:  { fontSize: 12, color: C.mutedFg },

  // État vide
  vide:       { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 12 },
  videIconWrap:{ width: 72, height: 72, borderRadius: 20, backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accentBdr, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  videtitre:   { fontSize: 18, fontWeight: "700", color: C.fg, textAlign: "center" },
  videDesc:    { fontSize: 14, color: C.mutedFg, textAlign: "center", lineHeight: 20 },
  videBtn:     { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  videBtnTxt:  { fontSize: 14, fontWeight: "600", color: "#FFF" },
});