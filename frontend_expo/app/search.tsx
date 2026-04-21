import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { height: SCREEN_H } = Dimensions.get("window");

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
  r:         8,
};

// ─── Données ──────────────────────────────────────────────────────────────────

const BIENS = [
  { id: "1", nom: "Villa Azur",          ville: "Dakar",      type: "Location", prix: 85,  couleur: "#3B82F6" },
  { id: "2", nom: "Résidence Océane",    ville: "Saly",       type: "Résidence",prix: 120, couleur: "#10B981" },
  { id: "3", nom: "Appartement Plateau", ville: "Abidjan",    type: "Location", prix: 60,  couleur: "#F59E0B" },
  { id: "4", nom: "Maison Corniche",     ville: "Casablanca", type: "Résidence",prix: 145, couleur: "#8B5CF6" },
  { id: "5", nom: "Studio Prestige",     ville: "Tunis",      type: "Location", prix: 55,  couleur: "#EF4444" },
  { id: "6", nom: "Villa Palmeraie",     ville: "Marrakech",  type: "Résidence",prix: 200, couleur: "#F97316" },
];

// ─── Calendrier ───────────────────────────────────────────────────────────────

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];
const MOIS_NOMS = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}
function inRange(d: Date, s: Date | null, e: Date | null) {
  if (!s || !e) return false;
  return d.getTime() > s.getTime() && d.getTime() < e.getTime();
}
function fmtDate(d: Date | null) {
  if (!d) return null;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function CalendarPicker({
  debut, fin,
  onChange,
}: {
  debut: Date | null;
  fin:   Date | null;
  onChange: (s: Date | null, e: Date | null) => void;
}) {
  const today = new Date();
  const [vue, setVue] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const an = vue.getFullYear();
  const mo = vue.getMonth();

  const offset = (() => { const d = new Date(an, mo, 1).getDay(); return d === 0 ? 6 : d - 1; })();
  const nbj    = new Date(an, mo + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let i = 1; i <= nbj; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const tap = (j: number) => {
    const sel = new Date(an, mo, j);
    if (!debut || (debut && fin)) { onChange(sel, null); return; }
    if (sel < debut)         onChange(sel, debut);
    else if (sameDay(sel, debut)) onChange(null, null);
    else                     onChange(debut, sel);
  };

  const CELL = (Dimensions.get("window").width - 40) / 7;

  return (
    <View style={cal.wrap}>
      {/* Navigation mois */}
      <View style={cal.nav}>
        <TouchableOpacity onPress={() => setVue(new Date(an, mo - 1, 1))} style={cal.navBtn}>
          <Ionicons name="chevron-back" size={17} color={C.fg} />
        </TouchableOpacity>
        <Text style={cal.navTitre}>{MOIS_NOMS[mo]} {an}</Text>
        <TouchableOpacity onPress={() => setVue(new Date(an, mo + 1, 1))} style={cal.navBtn}>
          <Ionicons name="chevron-forward" size={17} color={C.fg} />
        </TouchableOpacity>
      </View>

      {/* En-tête jours */}
      <View style={cal.row}>
        {JOURS.map((j, i) => (
          <Text key={i} style={[cal.cellTxt, { width: CELL, textAlign: "center", color: C.mutedFg, fontWeight: "600", fontSize: 11 }]}>{j}</Text>
        ))}
      </View>

      {/* Grille */}
      <View style={cal.row} >
        {cells.map((j, i) => {
          if (j === null) return <View key={`e${i}`} style={{ width: CELL, height: CELL }} />;
          const date     = new Date(an, mo, j);
          const isStart  = debut ? sameDay(date, debut) : false;
          const isEnd    = fin   ? sameDay(date, fin)   : false;
          const isRange  = inRange(date, debut, fin);
          const isPast   = date < todayMidnight;
          const isToday  = sameDay(date, todayMidnight);
          return (
            <TouchableOpacity
              key={j}
              disabled={isPast}
              onPress={() => tap(j)}
              style={[
                { width: CELL, height: CELL, alignItems: "center", justifyContent: "center" },
                isRange && { backgroundColor: C.muted },
                (isStart || isEnd) && { backgroundColor: C.primary, borderRadius: CELL / 2 },
              ]}
            >
              <Text style={[
                cal.cellTxt,
                isPast  && { color: C.border },
                isToday && !isStart && !isEnd && { color: C.accent, fontWeight: "700" },
                isRange && { color: C.fgSub },
                (isStart || isEnd) && { color: C.primaryFg, fontWeight: "700" },
              ]}>{j}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {debut && !fin && (
        <Text style={cal.hint}>Sélectionnez la date de sortie</Text>
      )}
    </View>
  );
}

// ─── Compteur +/- ─────────────────────────────────────────────────────────────

function Compteur({ label, sous, val, min, max, set }: {
  label: string; sous: string;
  val: number; min: number; max: number;
  set: (v: number) => void;
}) {
  return (
    <View style={cpt.row}>
      <View style={{ flex: 1 }}>
        <Text style={cpt.label}>{label}</Text>
        <Text style={cpt.sous}>{sous}</Text>
      </View>
      <View style={cpt.ctrl}>
        <TouchableOpacity
          onPress={() => set(Math.max(min, val - 1))}
          disabled={val <= min}
          style={[cpt.btn, val <= min && cpt.btnOff]}
        >
          <Ionicons name="remove" size={16} color={val <= min ? C.border : C.fg} />
        </TouchableOpacity>
        <Text style={cpt.val}>{val}</Text>
        <TouchableOpacity
          onPress={() => set(Math.min(max, val + 1))}
          disabled={val >= max}
          style={[cpt.btn, val >= max && cpt.btnOff]}
        >
          <Ionicons name="add" size={16} color={val >= max ? C.border : C.fg} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Carte résultat ───────────────────────────────────────────────────────────

function ResultCard({ bien }: { bien: (typeof BIENS)[0] }) {
  const router = useRouter();
  return (
    <Pressable
      style={res.card}
      android_ripple={{ color: C.muted }}
      onPress={() => router.push(`/bien/${bien.id}` as never)}
    >
      <View style={[res.image, { backgroundColor: bien.couleur }]}>
        <Ionicons name="business-outline" size={26} color="rgba(255,255,255,0.65)" />
      </View>
      <View style={res.info}>
        <View style={{ flex: 1 }}>
          <Text style={res.nom} numberOfLines={1}>{bien.nom}</Text>
          <View style={res.villeRow}>
            <Ionicons name="location-outline" size={12} color={C.mutedFg} />
            <Text style={res.ville}>{bien.ville}</Text>
          </View>
        </View>
        <View style={res.droite}>
          <View style={[res.badge, bien.type === "Résidence" && res.badgeAlt]}>
            <Text style={[res.badgeTxt, bien.type === "Résidence" && res.badgeTxtAlt]}>
              {bien.type}
            </Text>
          </View>
          <Text style={res.prix}>{bien.prix} €<Text style={res.nuit}>/nuit</Text></Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Écran recherche ──────────────────────────────────────────────────────────

type Section = "dates" | "personnes" | "chambres" | null;

export default function Search() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [query,    setQuery]    = useState("");
  const [section,  setSection]  = useState<Section>(null);
  const [debut,    setDebut]    = useState<Date | null>(null);
  const [fin,      setFin]      = useState<Date | null>(null);
  const [adultes,  setAdultes]  = useState(1);
  const [enfants,  setEnfants]  = useState(0);
  const [chambres, setChambres] = useState(1);

  const toggleSection = (s: Section) =>
    setSection((prev) => (prev === s ? null : s));

  // Labels des pills
  const datesLabel = debut && fin
    ? `${fmtDate(debut)} → ${fmtDate(fin)}`
    : debut
    ? `${fmtDate(debut)} → …`
    : "Dates";

  const personnesLabel =
    adultes + enfants > 0 ? `${adultes + enfants} pers.` : "Personnes";

  const chambresLabel = chambres > 1 ? `${chambres} chambres` : "1 chambre";

  const pilleActive = (s: Section) => section === s;

  // Filtrage simple sur le nom/ville
  const resultats = BIENS.filter(
    (b) =>
      query.length === 0 ||
      b.nom.toLowerCase().includes(query.toLowerCase()) ||
      b.ville.toLowerCase().includes(query.toLowerCase())
  );

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

      {/* ── Pills filtres ──────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.pills}
        style={s.pillsScroll}
      >
        {/* Dates */}
        <TouchableOpacity
          onPress={() => toggleSection("dates")}
          style={[s.pill, pilleActive("dates") && s.pillActive]}
        >
          <Ionicons
            name="calendar-outline"
            size={13}
            color={pilleActive("dates") ? C.primaryFg : C.fgSub}
          />
          <Text style={[s.pillTxt, pilleActive("dates") && s.pillTxtActive]}>
            {datesLabel}
          </Text>
        </TouchableOpacity>

        {/* Personnes */}
        <TouchableOpacity
          onPress={() => toggleSection("personnes")}
          style={[s.pill, pilleActive("personnes") && s.pillActive]}
        >
          <Ionicons
            name="people-outline"
            size={13}
            color={pilleActive("personnes") ? C.primaryFg : C.fgSub}
          />
          <Text style={[s.pillTxt, pilleActive("personnes") && s.pillTxtActive]}>
            {personnesLabel}
          </Text>
        </TouchableOpacity>

        {/* Chambres */}
        <TouchableOpacity
          onPress={() => toggleSection("chambres")}
          style={[s.pill, pilleActive("chambres") && s.pillActive]}
        >
          <Ionicons
            name="bed-outline"
            size={13}
            color={pilleActive("chambres") ? C.primaryFg : C.fgSub}
          />
          <Text style={[s.pillTxt, pilleActive("chambres") && s.pillTxtActive]}>
            {chambresLabel}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Section active ─────────────────────────────────────────────── */}
      {section && (
        <View style={s.sectionWrap}>
          {/* Dates → calendrier */}
          {section === "dates" && (
            <View style={s.sectionInner}>
              <CalendarPicker
                debut={debut}
                fin={fin}
                onChange={(st, en) => { setDebut(st); setFin(en); }}
              />
              {debut && fin && (
                <TouchableOpacity
                  style={s.sectionConfirm}
                  onPress={() => setSection(null)}
                >
                  <Text style={s.sectionConfirmTxt}>Confirmer la période</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Personnes → adultes + enfants */}
          {section === "personnes" && (
            <View style={s.sectionInner}>
              <Compteur
                label="Adultes"
                sous="18 ans et plus"
                val={adultes} min={0} max={20}
                set={setAdultes}
              />
              <View style={s.sep} />
              <Compteur
                label="Enfants"
                sous="Moins de 18 ans"
                val={enfants} min={0} max={10}
                set={setEnfants}
              />
            </View>
          )}

          {/* Chambres → compteur seul */}
          {section === "chambres" && (
            <View style={s.sectionInner}>
              <Compteur
                label="Chambres"
                sous="Nombre de chambres"
                val={chambres} min={1} max={10}
                set={setChambres}
              />
            </View>
          )}
        </View>
      )}

      {/* ── Résultats ──────────────────────────────────────────────────── */}
      <View style={s.resultsHeader}>
        <Text style={s.resultsTitre}>
          {resultats.length} résultat{resultats.length !== 1 ? "s" : ""}
        </Text>
        {(debut || adultes + enfants > 1 || chambres > 1) && (
          <TouchableOpacity onPress={() => { setDebut(null); setFin(null); setAdultes(1); setEnfants(0); setChambres(1); }}>
            <Text style={s.resetTxt}>Réinitialiser</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.resultsList}
        keyboardShouldPersistTaps="handled"
      >
        {resultats.map((b) => (
          <ResultCard key={b.id} bien={b} />
        ))}
        {resultats.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="search-outline" size={40} color={C.border} />
            <Text style={s.emptyTxt}>Aucun résultat pour « {query} »</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn:     { width: 38, height: 38, borderRadius: C.r, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  inputWrap:   { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, borderRadius: C.r, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  input:       { flex: 1, fontSize: 14, color: C.fg, padding: 0 },

  pillsScroll: { maxHeight: 52, borderBottomWidth: 1, borderColor: C.border },
  pills:       { paddingHorizontal: 16, alignItems: "center", gap: 8, paddingBottom: 10 },
  pill:        { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  pillActive:  { backgroundColor: C.primary, borderColor: C.primary },
  pillTxt:     { fontSize: 13, fontWeight: "500", color: C.fgSub },
  pillTxtActive:{ color: C.primaryFg, fontWeight: "600" },

  sectionWrap:    { borderBottomWidth: 1, borderColor: C.border, backgroundColor: C.card, maxHeight: SCREEN_H * 0.48 },
  sectionInner:   { padding: 20 },
  sectionConfirm: { marginTop: 12, backgroundColor: C.primary, borderRadius: C.r, paddingVertical: 10, alignItems: "center" },
  sectionConfirmTxt: { color: C.primaryFg, fontSize: 13, fontWeight: "600" },
  sep:            { height: StyleSheet.hairlineWidth, backgroundColor: C.border },

  resultsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  resultsTitre:  { fontSize: 13, fontWeight: "600", color: C.fg },
  resetTxt:      { fontSize: 13, color: C.mutedFg, fontWeight: "500" },
  resultsList:   { paddingHorizontal: 16, gap: 10, paddingBottom: 32 },

  empty:    { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTxt: { fontSize: 14, color: C.mutedFg, textAlign: "center" },
});

const cal = StyleSheet.create({
  wrap:   {},
  nav:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  navBtn: { width: 32, height: 32, borderRadius: C.r, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  navTitre: { fontSize: 14, fontWeight: "600", color: C.fg },
  row:    { flexDirection: "row", flexWrap: "wrap" },
  cellTxt:{ fontSize: 13, color: C.fg },
  hint:   { textAlign: "center", fontSize: 12, color: C.mutedFg, marginTop: 10, fontStyle: "italic" },
});

const cpt = StyleSheet.create({
  row:   { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  label: { fontSize: 15, fontWeight: "600", color: C.fg, marginBottom: 2 },
  sous:  { fontSize: 12, color: C.mutedFg },
  ctrl:  { flexDirection: "row", alignItems: "center", gap: 16 },
  btn:   { width: 32, height: 32, borderRadius: C.r, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, alignItems: "center", justifyContent: "center" },
  btnOff:{ backgroundColor: C.muted },
  val:   { fontSize: 16, fontWeight: "600", color: C.fg, minWidth: 22, textAlign: "center" },
});

const res = StyleSheet.create({
  card:     { flexDirection: "row", backgroundColor: C.card, borderRadius: C.r + 2, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  image:    { width: 90, alignItems: "center", justifyContent: "center" },
  info:     { flex: 1, flexDirection: "row", alignItems: "center", padding: 14, gap: 8 },
  nom:      { fontSize: 14, fontWeight: "600", color: C.fg, marginBottom: 4 },
  villeRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ville:    { fontSize: 12, color: C.mutedFg },
  droite:   { alignItems: "flex-end", gap: 6 },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border },
  badgeAlt: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  badgeTxt: { fontSize: 11, fontWeight: "500", color: C.fgSub },
  badgeTxtAlt: { color: "#1D4ED8" },
  prix:     { fontSize: 15, fontWeight: "700", color: C.fg },
  nuit:     { fontSize: 11, fontWeight: "400", color: C.mutedFg },
});