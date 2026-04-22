import { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DatesSheet      from "@/components/sheets/DatesSheet";
import LocatairesSheet from "@/components/sheets/LocatairesSheet";
import { BIENS_DB, type Bien } from "@/data/db";

// ─── Palette shadcn/ui ────────────────────────────────────────────────────────
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
  r:         8,
};

// ─── Données ──────────────────────────────────────────────────────────────────
const VILLES = [
  { id: "1", nom: "Douala",     pays: "Cameroun",      nb: 34, bg: "#18181B" },
  { id: "2", nom: "Yaoundé",    pays: "Cameroun",      nb: 21, bg: "#3F3F46" },
  { id: "3", nom: "Dakar",      pays: "Sénégal",       nb: 58, bg: "#18181B" },
  { id: "4", nom: "Abidjan",    pays: "Côte d'Ivoire", nb: 47, bg: "#3F3F46" },
  { id: "5", nom: "Casablanca", pays: "Maroc",         nb: 62, bg: "#18181B" },
  { id: "6", nom: "Marrakech",  pays: "Maroc",         nb: 29, bg: "#3F3F46" },
];

const PROPRIETES: Bien[] = BIENS_DB.filter((b) => b.disponible).slice(0, 6);

const FAQ = [
  {
    id: "1",
    icon: "help-circle-outline" as const,
    titre: "Comment réserver ?",
    contenu: "Sélectionnez un lieu, choisissez vos dates et le nombre de locataires, puis cliquez sur Rechercher. Confirmez votre réservation en quelques étapes.",
  },
  {
    id: "2",
    icon: "card-outline" as const,
    titre: "Moyens de paiement",
    contenu: "Nous acceptons les cartes bancaires, Mobile Money (Orange, MTN, Wave) et les virements. Tous les paiements sont sécurisés.",
  },
  {
    id: "3",
    icon: "close-circle-outline" as const,
    titre: "Politique d'annulation",
    contenu: "Annulation gratuite jusqu'à 48h avant l'arrivée. Au-delà, une nuit est retenue. En cas de force majeure, contactez notre support.",
  },
  {
    id: "4",
    icon: "headset-outline" as const,
    titre: "Assistance 24h/24",
    contenu: "Notre équipe est disponible à toute heure par chat, email ou téléphone. Délai de réponse moyen : 10 minutes.",
  },
];

const VILLES_PICKER = [
  { nom: "Douala",     pays: "Cameroun",      emoji: "🇨🇲" },
  { nom: "Yaoundé",   pays: "Cameroun",      emoji: "🇨🇲" },
  { nom: "Dakar",     pays: "Sénégal",       emoji: "🇸🇳" },
  { nom: "Abidjan",   pays: "Côte d'Ivoire", emoji: "🇨🇮" },
  { nom: "Casablanca",pays: "Maroc",         emoji: "🇲🇦" },
  { nom: "Marrakech", pays: "Maroc",         emoji: "🇲🇦" },
];

const FILTRES = ["Tout", "Location", "Résidence"] as const;
type Filtre = (typeof FILTRES)[number];

// ─── Carte ville ──────────────────────────────────────────────────────────────
function VilleCard({ v }: { v: (typeof VILLES)[0] }) {
  const router = useRouter();
  return (
    <Pressable style={[sk.villeCard, { backgroundColor: v.bg }]} onPress={() => router.push({ pathname: "/resultats", params: { ville: v.nom } })}>
      <View style={sk.villeCircle} />
      <View style={{ gap: 2 }}>
        <Text style={sk.villeNom}>{v.nom}</Text>
        <Text style={sk.villePays}>{v.pays}</Text>
      </View>
      <View style={sk.villeBadge}>
        <Text style={sk.villeBadgeTxt}>{v.nb} établissements</Text>
      </View>
    </Pressable>
  );
}

// ─── Carte propriété ──────────────────────────────────────────────────────────
function ProprieteCard({ p }: { p: Bien }) {
  const router = useRouter();
  return (
    <Pressable
      style={sk.propCard}
      onPress={() => router.push({ pathname: "/bien/[id]", params: { id: p.id } })}
    >
      <Image source={{ uri: p.image }} style={sk.propImg} resizeMode="cover" />
      <View style={sk.propOverlay} />

      <View style={sk.propTypeBadge}>
        <Text style={sk.propTypeTxt}>{p.type}</Text>
      </View>

      <View style={sk.propContent}>
        <View style={sk.propNoteRow}>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <Text style={sk.propNoteTxt}>{p.note}</Text>
        </View>
        <Text style={sk.propNom} numberOfLines={2}>{p.nom}</Text>
        <View style={sk.propVilleRow}>
          <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.7)" />
          <Text style={sk.propVille}>{p.ville}</Text>
        </View>
        <View style={sk.propFooter}>
          <Text style={sk.propPrix}>{p.prix} €<Text style={sk.propNuit}>/nuit</Text></Text>
          <View style={sk.propMetaRow}>
            <Ionicons name="bed-outline" size={11} color="rgba(255,255,255,0.7)" />
            <Text style={sk.propMetaTxt}>{p.chambres} ch.</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Item FAQ dépliable ───────────────────────────────────────────────────────
function FaqItem({ item }: { item: (typeof FAQ)[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={sk.faqItem}>
      <TouchableOpacity
        style={sk.faqHeader}
        onPress={() => setOpen((p) => !p)}
        activeOpacity={0.7}
      >
        <View style={sk.faqIconWrap}>
          <Ionicons name={item.icon} size={16} color={C.fgSub} />
        </View>
        <Text style={sk.faqTitre}>{item.titre}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={14}
          color={C.mutedFg}
        />
      </TouchableOpacity>

      {open && (
        <View style={sk.faqContenu}>
          <Text style={sk.faqTxt}>{item.contenu}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: Date | null) {
  if (!d) return null;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function pluriel(n: number, mot: string) {
  return `${n} ${mot}${n > 1 ? "s" : ""}`;
}

// ─── Section header réutilisable ──────────────────────────────────────────────
function SectionHeader({ titre, lien, onLien }: { titre: string; lien?: string; onLien?: () => void }) {
  return (
    <View style={sk.sectionRow}>
      <Text style={sk.sectionTitre}>{titre}</Text>
      {lien && <TouchableOpacity onPress={onLien}><Text style={sk.sectionLien}>{lien}</Text></TouchableOpacity>}
    </View>
  );
}

// ─── Écran ────────────────────────────────────────────────────────────────────
type Sheet = "dates" | "locataires" | null;

export default function Accueil() {
  const router = useRouter();

  const [filtreActif,    setFiltreActif]    = useState<Filtre>("Tout");
  const [sheet,          setSheet]          = useState<Sheet>(null);
  const [lieu,           setLieu]           = useState<string | null>(null);
  const [showLieuPicker, setShowLieuPicker] = useState(false);
  const [queryLieu,      setQueryLieu]      = useState("");
  const [debut,          setDebut]          = useState<Date | null>(null);
  const [fin,            setFin]            = useState<Date | null>(null);
  const [adultes,        setAdultes]        = useState(1);
  const [enfants,        setEnfants]        = useState(0);
  const [chambres,       setChambres]       = useState(1);
  const lieuInputRef = useRef<TextInput>(null);

  const locatairesLabel = [
    pluriel(adultes, "adulte"),
    enfants > 0 ? pluriel(enfants, "enfant") : null,
    pluriel(chambres, "chambre"),
  ].filter(Boolean).join("  ·  ");

  const datesLabel = debut && fin
    ? `${fmtDate(debut)}  →  ${fmtDate(fin)}`
    : null;

  return (
    <SafeAreaView style={sk.root}>
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

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={sk.header}>
        <View style={{ flex: 1 }}>
          <Text style={sk.headerSub}>Tableau de bord</Text>
          <Text style={sk.headerTitle}>CheZToi</Text>
        </View>
        <TouchableOpacity style={sk.bellBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={20} color={C.fg} />
          <View style={sk.badge} />
        </TouchableOpacity>
      </View>

      {/* ── Filtres ─────────────────────────────────────────────────────── */}
      <View style={sk.filtresWrap}>
        <View style={sk.filtres}>
          {FILTRES.map((f) => (
            <TouchableOpacity
              key={f} onPress={() => setFiltreActif(f)} activeOpacity={0.8}
              style={[sk.pill, filtreActif === f && sk.pillActif]}
            >
              <Text style={[sk.pillTxt, filtreActif === f && sk.pillTxtActif]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Scroll principal ────────────────────────────────────────────── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sk.scroll}>

        {/* Carte réservation */}
        <View style={sk.card}>
          <Text style={sk.cardLabel}>Nouvelle réservation</Text>

          {showLieuPicker ? (
            /* ── Sélecteur de ville inline ─────────────────────── */
            <>
              <View style={sk.lieuHeader}>
                <TouchableOpacity
                  onPress={() => { setShowLieuPicker(false); setQueryLieu(""); }}
                  style={sk.lieuBackBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={16} color={C.fg} />
                </TouchableOpacity>
                <View style={sk.lieuInputWrap}>
                  <Ionicons name="search-outline" size={14} color={C.mutedFg} />
                  <TextInput
                    ref={lieuInputRef}
                    style={sk.lieuInput}
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
                    style={sk.lieuItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      setLieu(v.nom);
                      setShowLieuPicker(false);
                      setQueryLieu("");
                    }}
                  >
                    <Text style={sk.lieuEmoji}>{v.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={sk.lieuNom}>{v.nom}</Text>
                      <Text style={sk.lieuPays}>{v.pays}</Text>
                    </View>
                    {lieu === v.nom && (
                      <Ionicons name="checkmark" size={16} color={C.accent} />
                    )}
                  </TouchableOpacity>
                ))
              }
            </>
          ) : (
            /* ── Zones normales ─────────────────────────────────── */
            <>
              <TouchableOpacity style={[sk.zone, lieu && sk.zoneActive]} activeOpacity={0.75} onPress={() => setShowLieuPicker(true)}>
                <View style={[sk.zoneIcon, !!lieu && sk.zoneIconActive]}>
                  <Ionicons name="location-outline" size={16} color={lieu ? C.accent : C.mutedFg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={sk.zoneLabel}>Lieu</Text>
                  <Text style={[sk.zoneVal, !lieu && sk.zoneVide]}>{lieu ?? "Sélectionner une ville…"}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={C.border} />
              </TouchableOpacity>

              <TouchableOpacity style={[sk.zone, datesLabel && sk.zoneActive]} activeOpacity={0.75} onPress={() => setSheet("dates")}>
                <View style={[sk.zoneIcon, datesLabel && sk.zoneIconActive]}>
                  <Ionicons name="calendar-outline" size={16} color={datesLabel ? C.accent : C.mutedFg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={sk.zoneLabel}>Période</Text>
                  <Text style={[sk.zoneVal, !datesLabel && sk.zoneVide]}>{datesLabel ?? "Entrée  →  Sortie"}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={C.border} />
              </TouchableOpacity>

              <TouchableOpacity style={[sk.zone, { borderBottomWidth: 0 }]} activeOpacity={0.75} onPress={() => setSheet("locataires")}>
                <View style={sk.zoneIcon}>
                  <Ionicons name="people-outline" size={16} color={C.mutedFg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={sk.zoneLabel}>Locataires</Text>
                  <Text style={sk.zoneVal}>{locatairesLabel}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={C.border} />
              </TouchableOpacity>

              <TouchableOpacity
                style={sk.cardBtn}
                activeOpacity={0.85}
                onPress={() => {
                  const ville = lieu ?? "";
                  router.push({ pathname: "/resultats", params: { ville, chambres, adultes, enfants } });
                }}
              >
                <Ionicons name="search" size={15} color={C.primaryFg} />
                <Text style={sk.cardBtnTxt}>Rechercher</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Section villes ──────────────────────────────────────────── */}
        <SectionHeader titre="Biens disponibles" lien="Voir tout" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sk.hScroll}>
          {VILLES.map((v) => <VilleCard key={v.id} v={v} />)}
        </ScrollView>

        {/* ── Section propriétés ──────────────────────────────────────── */}
        <SectionHeader titre="Propriétés à la une" lien="Voir tout" onLien={() => router.push({ pathname: "/resultats", params: { defaut: "1" } })} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sk.hScroll}>
          {PROPRIETES.map((p) => <ProprieteCard key={p.id} p={p} />)}
        </ScrollView>

        {/* ── Section infos dépliables ────────────────────────────────── */}
        <SectionHeader titre="Infos utiles" />
        <View style={sk.faqWrap}>
          {FAQ.map((item, i) => (
            <View key={item.id}>
              <FaqItem item={item} />
              {i < FAQ.length - 1 && <View style={sk.faqSep} />}
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const sk = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 16 },

  // Header
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },
  headerSub:   { fontSize: 12, color: C.mutedFg, fontWeight: "500" },
  headerTitle: { fontSize: 26, fontWeight: "700", color: C.fg, letterSpacing: -0.5 },
  bellBtn:     { width: 38, height: 38, borderRadius: C.r, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  badge:       { position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: C.bg },

  // Filtres
  filtresWrap: { alignItems: "center", marginBottom: 16 },
  filtres:     { flexDirection: "row", backgroundColor: C.muted, borderRadius: C.r + 2, borderWidth: 1, borderColor: C.border, padding: 3, gap: 2 },
  pill:        { paddingHorizontal: 20, paddingVertical: 7, borderRadius: C.r },
  pillActif:   { backgroundColor: C.card, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  pillTxt:     { fontSize: 13, fontWeight: "500", color: C.mutedFg },
  pillTxtActif:{ color: C.fg, fontWeight: "600" },

  // Carte réservation
  card:          { marginHorizontal: 20, backgroundColor: C.card, borderRadius: C.r + 4, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 4 },
  cardLabel:     { fontSize: 11, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.6, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  zone:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border, gap: 12 },
  zoneActive:    { backgroundColor: "#F0F7FF" },
  zoneIcon:      { width: 34, height: 34, borderRadius: C.r, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  zoneIconActive:{ backgroundColor: "#DBEAFE", borderColor: "#BFDBFE" },
  zoneLabel:     { fontSize: 10, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  zoneVal:       { fontSize: 14, fontWeight: "600", color: C.fg },
  zoneVide:      { fontSize: 14, fontWeight: "400", color: C.border },
  cardBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, margin: 14, backgroundColor: C.primary, borderRadius: C.r, paddingVertical: 13 },
  cardBtnTxt:    { color: C.primaryFg, fontSize: 14, fontWeight: "600" },

  // Sélecteur de ville inline
  lieuHeader:    { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 4 },
  lieuBackBtn:   { width: 34, height: 34, borderRadius: C.r, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  lieuInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, borderRadius: C.r, paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  lieuInput:     { flex: 1, fontSize: 13, color: C.fg, padding: 0 },
  lieuItem:      { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, gap: 12 },
  lieuEmoji:     { fontSize: 20, width: 28, textAlign: "center" },
  lieuNom:       { fontSize: 14, fontWeight: "600", color: C.fg },
  lieuPays:      { fontSize: 11, color: C.mutedFg, marginTop: 1 },

  // Section headers
  sectionRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionTitre: { fontSize: 16, fontWeight: "700", color: C.fg, letterSpacing: -0.2 },
  sectionLien:  { fontSize: 13, color: C.mutedFg, fontWeight: "500" },

  // Scroll horizontal
  hScroll: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },

  // Cartes villes
  villeCard:     { width: 220, height: 118, borderRadius: C.r + 4, padding: 16, justifyContent: "space-between", overflow: "hidden" },
  villeCircle:   { position: "absolute", right: -20, top: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.06)" },
  villeNom:      { fontSize: 22, fontWeight: "700", color: "#FFF", letterSpacing: -0.5 },
  villePays:     { fontSize: 12, color: "rgba(255,255,255,0.55)" },
  villeBadge:    { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.13)", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  villeBadgeTxt: { fontSize: 11, color: "#FFF", fontWeight: "500" },

  // Cartes propriétés (grande carte carrée avec vraie image)
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

  // FAQ dépliable
  faqWrap:    { marginHorizontal: 20, backgroundColor: C.card, borderRadius: C.r + 2, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  faqItem:    {},
  faqHeader:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  faqIconWrap:{ width: 30, height: 30, borderRadius: C.r, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  faqTitre:   { flex: 1, fontSize: 14, fontWeight: "600", color: C.fg },
  faqContenu: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 2 },
  faqTxt:     { fontSize: 13, color: C.mutedFg, lineHeight: 20 },
  faqSep:     { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: 16 },
});