import { useState, useMemo, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Pressable, TextInput, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BIENS_DB, type Bien } from "@/data/db";
import DatesSheet      from "@/components/sheets/DatesSheet";
import LocatairesSheet from "@/components/sheets/LocatairesSheet";

import { C } from "@/constants/colors";

const TYPES = ["Tout", "Location", "Résidence"] as const;
type TypeFiltre = (typeof TYPES)[number];
type Sheet = "dates" | "locataires" | null;

const VILLES_PICKER = [
  { nom: "Douala",     pays: "Cameroun",      emoji: "🇨🇲" },
  { nom: "Yaoundé",   pays: "Cameroun",      emoji: "🇨🇲" },
  { nom: "Dakar",     pays: "Sénégal",       emoji: "🇸🇳" },
  { nom: "Abidjan",   pays: "Côte d'Ivoire", emoji: "🇨🇮" },
  { nom: "Casablanca",pays: "Maroc",         emoji: "🇲🇦" },
  { nom: "Marrakech", pays: "Maroc",         emoji: "🇲🇦" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(d: Date | null) {
  if (!d) return null;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function pluriel(n: number, mot: string) {
  return `${n} ${mot}${n > 1 ? "s" : ""}`;
}

// ─── Carte résultat ───────────────────────────────────────────────────────────
function BienCard({ bien }: { bien: Bien }) {
  const router = useRouter();
  return (
    <Pressable
      style={s.card}
      onPress={() => router.push({ pathname: "/bien/[id]", params: { id: bien.id } })}
    >
      <Image source={{ uri: bien.image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <View style={s.cardOverlay} />

      {!bien.disponible && (
        <View style={s.indispoOverlay}>
          <Text style={s.indispoTxt}>Indisponible</Text>
        </View>
      )}

      <View style={s.typeBadge}>
        <Text style={s.typeTxt}>{bien.type}</Text>
      </View>

      <View style={s.cardContent}>
        <View style={s.cardNoteRow}>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <Text style={s.cardNoteTxt}>{bien.note} ({bien.avis})</Text>
        </View>
        <Text style={s.cardNom} numberOfLines={2}>{bien.nom}</Text>
        <View style={s.cardVilleRow}>
          <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.8)" />
          <Text style={s.cardVille}>{bien.ville}, {bien.pays}</Text>
        </View>
        <View style={s.cardFooter}>
          <Text style={s.cardPrix}>{bien.prix} €<Text style={s.cardNuit}> / nuit</Text></Text>
          <View style={s.cardMetaItem}>
            <Ionicons name="bed-outline" size={11} color="rgba(255,255,255,0.8)" />
            <Text style={s.cardMetaTxt}>{bien.chambres} ch. · {bien.surface} m²</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Page résultats ───────────────────────────────────────────────────────────
export default function Resultats() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ville?: string; defaut?: string; chambres?: string; adultes?: string; enfants?: string }>();

  const villeParam = params.defaut === "1" ? "Douala" : (params.ville ?? "");

  const [typeFiltre,      setTypeFiltre]      = useState<TypeFiltre>("Tout");
  const [triPrix,         setTriPrix]         = useState<"asc" | "desc" | null>(null);
  const [showFiltres,     setShowFiltres]     = useState(false);
  const [showLieuPicker,  setShowLieuPicker]  = useState(false);
  const [queryLieu,       setQueryLieu]       = useState("");
  const [sheet,           setSheet]           = useState<Sheet>(null);
  const lieuInputRef = useRef<TextInput>(null);

  // Filtres avancés — initialisés depuis les params de navigation
  const [lieu,     setLieu]     = useState(villeParam);
  const [debut,    setDebut]    = useState<Date | null>(null);
  const [fin,      setFin]      = useState<Date | null>(null);
  const [adultes,  setAdultes]  = useState(Number(params.adultes ?? 1));
  const [enfants,  setEnfants]  = useState(Number(params.enfants ?? 0));
  const [chambres, setChambres] = useState(Number(params.chambres ?? 1));

  const datesLabel = debut && fin ? `${fmtDate(debut)}  →  ${fmtDate(fin)}` : null;
  const locLabel   = [
    pluriel(adultes, "adulte"),
    enfants > 0 ? pluriel(enfants, "enfant") : null,
    pluriel(chambres, "chambre"),
  ].filter(Boolean).join("  ·  ");

  const villeActive = lieu || villeParam;

  // Libellé affiché dans la zone Lieu (avec le pays si dispo)
  const resultats = useMemo(() => {
    let liste = BIENS_DB.filter(
      (b) => !villeActive || b.ville.toLowerCase() === villeActive.toLowerCase()
    );
    if (typeFiltre !== "Tout") liste = liste.filter((b) => b.type === typeFiltre);
    // Exact en premier, puis les autres par ordre croissant de chambres
    liste = [...liste].sort((a, b) => {
      const aExact = a.chambres === chambres ? 0 : 1;
      const bExact = b.chambres === chambres ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return a.chambres - b.chambres;
    });
    if (triPrix === "asc")  liste = [...liste].sort((a, b) => a.prix - b.prix);
    if (triPrix === "desc") liste = [...liste].sort((a, b) => b.prix - a.prix);
    return liste;
  }, [villeActive, typeFiltre, chambres, triPrix]);

  const dispo     = resultats.filter((b) => b.disponible).length;
  const titre     = villeActive || "Tous les biens";
  const sousTitre = params.defaut === "1"
    ? `${dispo} disponible${dispo > 1 ? "s" : ""} · Aujourd'hui → Demain`
    : `${resultats.length} résultat${resultats.length > 1 ? "s" : ""}`;

  const filtresActifs = showFiltres || !!(debut || adultes !== 1 || enfants > 0 || chambres !== 1);

  return (
    <SafeAreaView style={s.root}>
      <DatesSheet
        visible={sheet === "dates"} onClose={() => setSheet(null)}
        debut={debut} fin={fin}
        onChange={(d, f) => { setDebut(d); setFin(f); }}
      />
      <LocatairesSheet
        visible={sheet === "locataires"} onClose={() => setSheet(null)}
        adultes={adultes}   setAdultes={setAdultes}
        enfants={enfants}   setEnfants={setEnfants}
        chambres={chambres} setChambres={setChambres}
      />

      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={C.fg} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitre}>{titre}</Text>
          <Text style={s.headerSub}>{sousTitre}</Text>
        </View>
        <TouchableOpacity
          style={[s.filtreBtn, filtresActifs && s.filtreBtnActif]}
          onPress={() => setShowFiltres((p) => !p)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={filtresActifs ? "funnel" : "funnel-outline"}
            size={16}
            color={filtresActifs ? C.primaryFg : C.mutedFg}
          />
        </TouchableOpacity>
      </View>

      {/* ── Panneau de filtres inline ──────────────────────────────────── */}
      {showFiltres && (
        <View style={s.filtresPanel}>
          {showLieuPicker ? (
            /* ── Sélecteur de ville inline ─────────────────────────── */
            <>
              <View style={s.lieuHeader}>
                <TouchableOpacity
                  onPress={() => { setShowLieuPicker(false); setQueryLieu(""); }}
                  style={s.lieuBackBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={16} color={C.fg} />
                </TouchableOpacity>
                <View style={s.lieuInputWrap}>
                  <Ionicons name="search-outline" size={14} color={C.mutedFg} />
                  <TextInput
                    ref={lieuInputRef}
                    style={s.lieuInput}
                    placeholder="Ville, pays…"
                    placeholderTextColor={C.mutedFg}
                    value={queryLieu}
                    onChangeText={setQueryLieu}
                    autoFocus
                    autoCapitalize="words"
                  />
                  {queryLieu.length > 0 && (
                    <TouchableOpacity onPress={() => setQueryLieu("")}>
                      <Ionicons name="close-circle" size={14} color={C.mutedFg} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {VILLES_PICKER
                .filter((v) =>
                  queryLieu.length === 0 ||
                  v.nom.toLowerCase().includes(queryLieu.toLowerCase()) ||
                  v.pays.toLowerCase().includes(queryLieu.toLowerCase())
                )
                .map((v) => (
                  <TouchableOpacity
                    key={v.nom}
                    style={s.lieuItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      setLieu(v.nom);
                      setShowLieuPicker(false);
                      setQueryLieu("");
                    }}
                  >
                    <Text style={s.lieuEmoji}>{v.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.lieuNom}>{v.nom}</Text>
                      <Text style={s.lieuPays}>{v.pays}</Text>
                    </View>
                    {lieu === v.nom && (
                      <Ionicons name="checkmark" size={16} color={C.accent} />
                    )}
                  </TouchableOpacity>
                ))
              }
            </>
          ) : (
            /* ── Zones de filtre ───────────────────────────────────── */
            <>
              <Text style={s.filtresPanelLabel}>Modifier la recherche</Text>

              {/* Lieu */}
              <TouchableOpacity
                style={[s.zone, !!lieu && s.zoneActive]}
                activeOpacity={0.75}
                onPress={() => setShowLieuPicker(true)}
              >
                <View style={[s.zoneIcon, !!lieu && s.zoneIconActive]}>
                  <Ionicons name="location-outline" size={15} color={lieu ? C.accent : C.mutedFg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.zoneLabel}>Lieu</Text>
                  <Text style={[s.zoneVal, !lieu && s.zoneVide]}>
                    {lieu || "Sélectionner une ville…"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={13} color={C.border} />
              </TouchableOpacity>

              {/* Période */}
              <TouchableOpacity
                style={[s.zone, !!datesLabel && s.zoneActive]}
                activeOpacity={0.75}
                onPress={() => setSheet("dates")}
              >
                <View style={[s.zoneIcon, !!datesLabel && s.zoneIconActive]}>
                  <Ionicons name="calendar-outline" size={15} color={datesLabel ? C.accent : C.mutedFg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.zoneLabel}>Période</Text>
                  <Text style={[s.zoneVal, !datesLabel && s.zoneVide]}>
                    {datesLabel ?? "Entrée  →  Sortie"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={13} color={C.border} />
              </TouchableOpacity>

              {/* Locataires */}
              <TouchableOpacity
                style={s.zone}
                activeOpacity={0.75}
                onPress={() => setSheet("locataires")}
              >
                <View style={s.zoneIcon}>
                  <Ionicons name="people-outline" size={15} color={C.mutedFg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.zoneLabel}>Locataires</Text>
                  <Text style={s.zoneVal}>{locLabel}</Text>
                </View>
                <Ionicons name="chevron-forward" size={13} color={C.border} />
              </TouchableOpacity>

              <TouchableOpacity
                style={s.confirmBtn}
                activeOpacity={0.85}
                onPress={() => setShowFiltres(false)}
              >
                <Ionicons name="search" size={15} color={C.primaryFg} />
                <Text style={s.confirmTxt}>Confirmer la recherche</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* ── Filtres type + tri ─────────────────────────────────────────── */}
      <View style={s.filtresRow}>
        {TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTypeFiltre(t)}
            style={[s.pill, typeFiltre === t && s.pillActif]}
            activeOpacity={0.75}
          >
            <Text style={[s.pillTxt, typeFiltre === t && s.pillTxtActif]}>{t}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[s.pill, { marginLeft: "auto" }, triPrix && s.pillActif]}
          onPress={() => setTriPrix((p) => p === "asc" ? "desc" : p === "desc" ? null : "asc")}
          activeOpacity={0.75}
        >
          {triPrix && (
            <Ionicons name={triPrix === "asc" ? "arrow-up" : "arrow-down"} size={12} color={C.primaryFg} />
          )}
          <Text style={[s.pillTxt, triPrix && s.pillTxtActif]}>Prix</Text>
        </TouchableOpacity>
      </View>

      {/* ── Liste ─────────────────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.liste}
      >
        {resultats.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="home-outline" size={48} color={C.border} />
            <Text style={s.emptyTitre}>Aucun résultat</Text>
            <Text style={s.emptyTxt}>Essayez de changer les filtres.</Text>
          </View>
        ) : (
          resultats.map((b) => <BienCard key={b.id} bien={b} />)
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border, backgroundColor: C.card, gap: 12 },
  backBtn:      { width: 38, height: 38, borderRadius: C.r, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  headerTitre:  { fontSize: 16, fontWeight: "700", color: C.fg, letterSpacing: -0.2 },
  headerSub:    { fontSize: 12, color: C.mutedFg, marginTop: 1 },
  filtreBtn:    { width: 38, height: 38, borderRadius: C.r, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  filtreBtnActif:{ backgroundColor: C.primary, borderColor: C.primary },

  // Panneau inline
  filtresPanel:      { backgroundColor: C.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, gap: 4 },
  filtresPanelLabel: { fontSize: 10, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 },

  zone:         { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, gap: 12 },
  zoneActive:   {},
  zoneIcon:     { width: 32, height: 32, borderRadius: C.r, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  zoneIconActive:{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  zoneLabel:    { fontSize: 10, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 1 },
  zoneVal:      { fontSize: 13, fontWeight: "600", color: C.fg },
  zoneVide:     { color: C.mutedFg, fontWeight: "400" },

  confirmBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.primary, borderRadius: C.r, paddingVertical: 13, marginTop: 12, marginBottom: 4 },
  confirmTxt:   { color: C.primaryFg, fontSize: 14, fontWeight: "600" },

  lieuHeader:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  lieuBackBtn:  { width: 34, height: 34, borderRadius: C.r, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  lieuInputWrap:{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, borderRadius: C.r, paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  lieuInput:    { flex: 1, fontSize: 13, color: C.fg, padding: 0 },
  lieuItem:     { flexDirection: "row", alignItems: "center", paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, gap: 10 },
  lieuEmoji:    { fontSize: 20, width: 28, textAlign: "center" },
  lieuNom:      { fontSize: 14, fontWeight: "600", color: C.fg },
  lieuPays:     { fontSize: 11, color: C.mutedFg, marginTop: 1 },

  filtresRow:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border, backgroundColor: C.card },
  pill:         { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  pillActif:    { backgroundColor: C.primary, borderColor: C.primary },
  pillTxt:      { fontSize: 12, fontWeight: "500", color: C.fgSub },
  pillTxtActif: { color: C.primaryFg, fontWeight: "600" },

  liste: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },

  card:         { width: "100%", aspectRatio: 16 / 9, borderRadius: 20, overflow: "hidden" },
  cardOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  indispoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  indispoTxt:     { color: "#FFF", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },

  typeBadge:   { position: "absolute", top: 12, left: 12, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  typeTxt:     { fontSize: 10, color: "#FFF", fontWeight: "700", letterSpacing: 0.3 },

  cardContent:  { position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, gap: 2 },
  cardNoteRow:  { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 2 },
  cardNoteTxt:  { fontSize: 10, fontWeight: "600", color: "#FFF" },
  cardNom:      { fontSize: 14, fontWeight: "700", color: "#FFF", letterSpacing: -0.2 },
  cardVilleRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardVille:    { fontSize: 10, color: "rgba(255,255,255,0.8)" },
  cardFooter:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  cardPrix:     { fontSize: 14, fontWeight: "700", color: "#FFF" },
  cardNuit:     { fontSize: 10, fontWeight: "400", color: "rgba(255,255,255,0.7)" },
  cardMetaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardMetaTxt:  { fontSize: 10, color: "rgba(255,255,255,0.8)" },

  empty:      { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitre: { fontSize: 16, fontWeight: "700", color: C.fg },
  emptyTxt:   { fontSize: 13, color: C.mutedFg },
});
