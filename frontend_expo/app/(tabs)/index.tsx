import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

import DatesSheet      from "@/components/sheets/DatesSheet";
import LocatairesSheet from "@/components/sheets/LocatairesSheet";

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg:        "#FAFAFA",
  card:      "#FFFFFF",
  border:    "#E4E4E7",
  muted:     "#F4F4F5",
  mutedFg:   "#71717A",
  fg:        "#18181B",
  fgSub:     "#3F3F46",
  primary:   "#18181B",
  primaryFg: "#FAFAFA",
  accent:    "#208AEF",
  green:     "#16A34A",
  radius:    8,
};

// ─── Données biens (scroll horizontal) ───────────────────────────────────────
const BIENS = [
  { id: "1", nom: "Villa Azur",          ville: "Dakar",      prix: 85,  couleur: "#3B82F6" },
  { id: "2", nom: "Résidence Océane",    ville: "Saly",       prix: 120, couleur: "#10B981" },
  { id: "3", nom: "Appartement Plateau", ville: "Abidjan",    prix: 60,  couleur: "#F59E0B" },
  { id: "4", nom: "Maison Corniche",     ville: "Casablanca", prix: 145, couleur: "#8B5CF6" },
  { id: "5", nom: "Studio Prestige",     ville: "Tunis",      prix: 55,  couleur: "#EF4444" },
];

const FILTRES = ["Tout", "Location", "Résidence"] as const;
type Filtre = (typeof FILTRES)[number];

// ─── Carte bien ───────────────────────────────────────────────────────────────
function BienCard({ bien }: { bien: (typeof BIENS)[0] }) {
  return (
    <Pressable style={s.bienCard} android_ripple={{ color: C.muted }}>
      <View style={[s.bienImage, { backgroundColor: bien.couleur }]}>
        <Ionicons name="business-outline" size={28} color="rgba(255,255,255,0.65)" />
      </View>
      <View style={s.bienBody}>
        <Text style={s.bienNom} numberOfLines={1}>{bien.nom}</Text>
        <View style={s.bienVilleRow}>
          <Ionicons name="location-outline" size={11} color={C.mutedFg} />
          <Text style={s.bienVille}>{bien.ville}</Text>
        </View>
        <View style={s.bienSep} />
        <Text>
          <Text style={s.bienPrix}>{bien.prix} €</Text>
          <Text style={s.bienNuit}> / nuit</Text>
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Helpers affichage ────────────────────────────────────────────────────────
function fmtDate(d: Date | null) {
  if (!d) return null;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function pluriel(n: number, mot: string) {
  return `${n} ${mot}${n > 1 ? "s" : ""}`;
}

// ─── Écran ────────────────────────────────────────────────────────────────────
type Sheet = "dates" | "locataires" | null;

export default function Accueil() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lieu?: string }>();

  const [filtreActif, setFiltreActif] = useState<Filtre>("Tout");
  const [sheet,       setSheet]       = useState<Sheet>(null);

  // État de la carte de réservation
  const [lieu,     setLieu]     = useState<string | null>(null);

  useEffect(() => {
    if (params.lieu) setLieu(params.lieu as string);
  }, [params.lieu]);
  const [debut,    setDebut]    = useState<Date | null>(null);
  const [fin,      setFin]      = useState<Date | null>(null);
  const [adultes,  setAdultes]  = useState(1);
  const [enfants,  setEnfants]  = useState(0);
  const [chambres, setChambres] = useState(1);

  const locatairesLabel = [
    pluriel(adultes, "adulte"),
    enfants > 0 ? pluriel(enfants, "enfant") : null,
    pluriel(chambres, "chambre"),
  ].filter(Boolean).join("  ·  ");

  const datesLabel = debut && fin
    ? `${fmtDate(debut)}  →  ${fmtDate(fin)}`
    : null;

  return (
    <SafeAreaView style={s.root}>
      {/* ── Sheets ──────────────────────────────────────────────────────── */}
      <DatesSheet
        visible={sheet === "dates"}
        onClose={() => setSheet(null)}
        debut={debut}
        fin={fin}
        onChange={(d, f) => { setDebut(d); setFin(f); }}
      />
      <LocatairesSheet
        visible={sheet === "locataires"}
        onClose={() => setSheet(null)}
        adultes={adultes}   setAdultes={setAdultes}
        enfants={enfants}   setEnfants={setEnfants}
        chambres={chambres} setChambres={setChambres}
      />

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>Tableau de bord</Text>
          <Text style={s.headerTitle}>CheZToi</Text>
        </View>
        <TouchableOpacity style={s.bellBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={20} color={C.fg} />
          <View style={s.badge} />
        </TouchableOpacity>
      </View>

      {/* ── Carte réservation ─────────────────────────────────────────────── */}
      <View style={s.card}>
        <Text style={s.cardTitre}>Nouvelle réservation</Text>

        {/* Zone 1 — Lieu */}
        <TouchableOpacity
          style={[s.zone, lieu && s.zoneActive]}
          activeOpacity={0.75}
          onPress={() => router.push("/location")}
        >
          <View style={[s.zoneIcon, lieu && s.zoneIconActive]}>
            <Ionicons name="location-outline" size={16} color={lieu ? C.accent : C.mutedFg} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.zoneLabel}>Lieu</Text>
            <Text style={[s.zoneVal, !lieu && s.zoneValVide]}>
              {lieu ?? "Sélectionner une ville…"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={C.border} />
        </TouchableOpacity>

        {/* Zone 2 — Dates */}
        <TouchableOpacity
          style={[s.zone, datesLabel && s.zoneActive]}
          activeOpacity={0.75}
          onPress={() => setSheet("dates")}
        >
          <View style={[s.zoneIcon, datesLabel && s.zoneIconActive]}>
            <Ionicons name="calendar-outline" size={16} color={datesLabel ? C.accent : C.mutedFg} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.zoneLabel}>Période</Text>
            {datesLabel ? (
              <Text style={s.zoneVal}>{datesLabel}</Text>
            ) : (
              <Text style={s.zoneValVide}>Entrée  →  Sortie</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={14} color={C.border} />
        </TouchableOpacity>

        {/* Zone 3 — Locataires */}
        <TouchableOpacity
          style={[s.zone, { borderBottomWidth: 0 }]}
          activeOpacity={0.75}
          onPress={() => setSheet("locataires")}
        >
          <View style={s.zoneIcon}>
            <Ionicons name="people-outline" size={16} color={C.mutedFg} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.zoneLabel}>Locataires</Text>
            <Text style={s.zoneVal}>{locatairesLabel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={C.border} />
        </TouchableOpacity>

        {/* CTA */}
        <TouchableOpacity style={s.cardBtn} activeOpacity={0.85}>
          <Ionicons name="search" size={15} color={C.primaryFg} />
          <Text style={s.cardBtnTxt}>Rechercher</Text>
        </TouchableOpacity>
      </View>

      {/* ── Filtres centrés ─────────────────────────────────────────────── */}
      <View style={s.filtresWrap}>
        <View style={s.filtres}>
          {FILTRES.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFiltreActif(f)}
              activeOpacity={0.8}
              style={[s.filtrePill, filtreActif === f && s.filtrePillActif]}
            >
              <Text style={[s.filtreTxt, filtreActif === f && s.filtreTxtActif]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Biens disponibles ───────────────────────────────────────────── */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitre}>Biens disponibles</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={s.sectionVoir}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.bienScroll}
      >
        {BIENS.map((b) => <BienCard key={b.id} bien={b} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16 },
  headerSub:   { fontSize: 12, color: C.mutedFg, fontWeight: "500", letterSpacing: 0.2 },
  headerTitle: { fontSize: 26, fontWeight: "700", color: C.fg, letterSpacing: -0.5, marginTop: 1 },
  bellBtn:     { width: 38, height: 38, borderRadius: C.radius, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  badge:       { position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: C.bg },

  // Carte
  card:      { marginHorizontal: 20, backgroundColor: C.card, borderRadius: C.radius + 4, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  cardTitre: { fontSize: 13, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12 },

  // Zones cliquables de la carte
  zone:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border, gap: 12 },
  zoneActive:   { backgroundColor: "#F0F7FF" },
  zoneIcon:     { width: 34, height: 34, borderRadius: C.radius, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  zoneIconActive:{ backgroundColor: "#DBEAFE", borderColor: "#BFDBFE" },
  zoneLabel:    { fontSize: 10, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  zoneVal:      { fontSize: 14, fontWeight: "600", color: C.fg },
  zoneValVide:  { fontSize: 14, fontWeight: "400", color: C.border },

  // Bouton CTA
  cardBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, margin: 14, backgroundColor: C.primary, borderRadius: C.radius, paddingVertical: 13 },
  cardBtnTxt: { color: C.primaryFg, fontSize: 14, fontWeight: "600" },

  // Filtres
  filtresWrap:     { alignItems: "center", marginTop: 22 },
  filtres:         { flexDirection: "row", backgroundColor: C.muted, borderRadius: C.radius + 2, borderWidth: 1, borderColor: C.border, padding: 3, gap: 2 },
  filtrePill:      { paddingHorizontal: 20, paddingVertical: 7, borderRadius: C.radius },
  filtrePillActif: { backgroundColor: C.card, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  filtreTxt:       { fontSize: 13, fontWeight: "500", color: C.mutedFg },
  filtreTxtActif:  { color: C.fg, fontWeight: "600" },

  // Section biens
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionTitre:  { fontSize: 16, fontWeight: "700", color: C.fg, letterSpacing: -0.2 },
  sectionVoir:   { fontSize: 13, color: C.mutedFg, fontWeight: "500" },
  bienScroll:    { paddingHorizontal: 20, gap: 12, paddingBottom: 32 },
  bienCard:      { width: 156, backgroundColor: C.card, borderRadius: C.radius + 2, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  bienImage:     { height: 100, alignItems: "center", justifyContent: "center" },
  bienBody:      { padding: 12 },
  bienNom:       { fontSize: 13, fontWeight: "600", color: C.fg, marginBottom: 3 },
  bienVilleRow:  { flexDirection: "row", alignItems: "center", gap: 3 },
  bienVille:     { fontSize: 11, color: C.mutedFg },
  bienSep:       { height: 1, backgroundColor: C.border, marginVertical: 8 },
  bienPrix:      { fontSize: 14, fontWeight: "700", color: C.fg },
  bienNuit:      { fontSize: 11, color: C.mutedFg },
});