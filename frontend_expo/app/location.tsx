import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

const C = {
  bg:      "#FAFAFA",
  card:    "#FFFFFF",
  border:  "#E4E4E7",
  muted:   "#F4F4F5",
  mutedFg: "#71717A",
  fg:      "#18181B",
  fgSub:   "#3F3F46",
  primary: "#18181B",
  primaryFg:"#FAFAFA",
  accent:  "#208AEF",
  r:       8,
};

const VILLES = [
  { nom: "Dakar",       pays: "Sénégal",        emoji: "🇸🇳" },
  { nom: "Saly",        pays: "Sénégal",        emoji: "🇸🇳" },
  { nom: "Saint-Louis", pays: "Sénégal",        emoji: "🇸🇳" },
  { nom: "Abidjan",     pays: "Côte d'Ivoire",  emoji: "🇨🇮" },
  { nom: "Casablanca",  pays: "Maroc",          emoji: "🇲🇦" },
  { nom: "Marrakech",   pays: "Maroc",          emoji: "🇲🇦" },
  { nom: "Tunis",       pays: "Tunisie",        emoji: "🇹🇳" },
  { nom: "Alger",       pays: "Algérie",        emoji: "🇩🇿" },
  { nom: "Douala",      pays: "Cameroun",       emoji: "🇨🇲" },
  { nom: "Libreville",  pays: "Gabon",          emoji: "🇬🇦" },
  { nom: "Lomé",        pays: "Togo",           emoji: "🇹🇬" },
  { nom: "Accra",       pays: "Ghana",          emoji: "🇬🇭" },
  { nom: "Lagos",       pays: "Nigeria",        emoji: "🇳🇬" },
  { nom: "Bamako",      pays: "Mali",           emoji: "🇲🇱" },
  { nom: "Conakry",     pays: "Guinée",         emoji: "🇬🇳" },
  { nom: "Cotonou",     pays: "Bénin",          emoji: "🇧🇯" },
];

const POPULAIRES = VILLES.slice(0, 5);

export default function Location() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");

  const filtrees = query.length > 0
    ? VILLES.filter(
        (v) =>
          v.nom.toLowerCase().includes(query.toLowerCase()) ||
          v.pays.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  const handleSelect = (ville: (typeof VILLES)[0]) => {
    const lieu = `${ville.nom}, ${ville.pays}`;
    if (params.from === "resultats") {
      router.navigate({ pathname: "/resultats", params: { lieu } });
    } else {
      router.navigate({ pathname: "/", params: { lieu } });
    }
  };

  return (
    <SafeAreaView style={s.root}>

      {/* ── En-tête ────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={C.fg} />
        </TouchableOpacity>
        <View style={s.inputWrap}>
          <Ionicons name="search-outline" size={15} color={C.mutedFg} />
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Ville, quartier, adresse…"
            placeholderTextColor={C.mutedFg}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="words"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={15} color={C.mutedFg} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.scroll}
      >
        {/* ── Recherche en cours ──────────────────────────────────────── */}
        {filtrees !== null ? (
          <>
            <Text style={s.sectionTitre}>
              {filtrees.length > 0
                ? `${filtrees.length} résultat${filtrees.length > 1 ? "s" : ""}`
                : "Aucun résultat"}
            </Text>
            {filtrees.map((v) => (
              <VilleRow key={v.nom} ville={v} onPress={() => handleSelect(v)} />
            ))}
          </>
        ) : (
          /* ── État initial ──────────────────────────────────────────── */
          <>
            {/* Popularité */}
            <Text style={s.sectionTitre}>Destinations populaires</Text>
            {POPULAIRES.map((v) => (
              <VilleRow key={v.nom} ville={v} onPress={() => handleSelect(v)} />
            ))}

            {/* Séparateur */}
            <View style={s.sep} />

            {/* Toutes les villes */}
            <Text style={s.sectionTitre}>Toutes les villes</Text>
            {VILLES.slice(5).map((v) => (
              <VilleRow key={v.nom} ville={v} onPress={() => handleSelect(v)} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Ligne de ville ───────────────────────────────────────────────────────────

function VilleRow({
  ville,
  onPress,
}: {
  ville: (typeof VILLES)[0];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={s.item} onPress={onPress} activeOpacity={0.7}>
      <View style={s.itemFlag}>
        <Text style={{ fontSize: 22 }}>{ville.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.itemNom}>{ville.nom}</Text>
        <Text style={s.itemPays}>{ville.pays}</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={C.border} />
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection:    "row",
    alignItems:       "center",
    paddingHorizontal: 16,
    paddingVertical:  12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
    backgroundColor:  C.card,
    gap: 10,
  },
  backBtn: {
    width:           38,
    height:          38,
    borderRadius:    C.r,
    backgroundColor: C.muted,
    borderWidth:     1,
    borderColor:     C.border,
    alignItems:      "center",
    justifyContent:  "center",
  },
  inputWrap: {
    flex:             1,
    flexDirection:    "row",
    alignItems:       "center",
    backgroundColor:  C.muted,
    borderWidth:      1,
    borderColor:      C.border,
    borderRadius:     C.r,
    paddingHorizontal: 12,
    paddingVertical:  10,
    gap: 8,
  },
  input: {
    flex:     1,
    fontSize: 14,
    color:    C.fg,
    padding:  0,
  },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  sectionTitre: {
    fontSize:     12,
    fontWeight:   "600",
    color:        C.mutedFg,
    textTransform:"uppercase",
    letterSpacing: 0.6,
    marginTop:    24,
    marginBottom: 8,
  },

  sep: {
    height:          1,
    backgroundColor: C.border,
    marginVertical:  8,
  },

  item: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingVertical:   13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
    gap:               12,
  },
  itemFlag: {
    width:           42,
    height:          42,
    borderRadius:    C.r,
    backgroundColor: C.muted,
    borderWidth:     1,
    borderColor:     C.border,
    alignItems:      "center",
    justifyContent:  "center",
  },
  itemNom:  { fontSize: 14, fontWeight: "600", color: C.fg },
  itemPays: { fontSize: 12, color: C.mutedFg, marginTop: 1 },
});