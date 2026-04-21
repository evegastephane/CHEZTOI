import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SheetBase, { C } from "./SheetBase";

const JOURS     = ["L", "M", "M", "J", "V", "S", "D"];
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

const CELL_W = (Dimensions.get("window").width - 40) / 7;

type Props = {
  visible:  boolean;
  onClose:  () => void;
  debut:    Date | null;
  fin:      Date | null;
  onChange: (debut: Date | null, fin: Date | null) => void;
};

export default function DatesSheet({ visible, onClose, debut, fin, onChange }: Props) {
  const [vue, setVue] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const an = vue.getFullYear();
  const mo = vue.getMonth();

  const offset = (() => { const d = new Date(an, mo, 1).getDay(); return d === 0 ? 6 : d - 1; })();
  const nbj    = new Date(an, mo + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let i = 1; i <= nbj; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayMidnight = (() => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); })();

  const tap = (j: number) => {
    const sel = new Date(an, mo, j);
    if (!debut || (debut && fin)) { onChange(sel, null); return; }
    if (sel < debut)              { onChange(sel, debut); return; }
    if (sameDay(sel, debut))      { onChange(null, null); return; }
    onChange(debut, sel);
  };

  const fmtDate = (d: Date | null) =>
    d ? d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "—";

  return (
    <SheetBase visible={visible} onClose={onClose} titre="Choisir la période" hauteur={0.68}>
      {/* Résumé dates sélectionnées */}
      <View style={s.resume}>
        <View style={s.resumeBloc}>
          <Text style={s.resumeLabel}>Entrée</Text>
          <Text style={[s.resumeVal, !debut && s.resumeVide]}>{fmtDate(debut)}</Text>
        </View>
        <Ionicons name="arrow-forward" size={14} color={C.border} style={{ marginTop: 14 }} />
        <View style={[s.resumeBloc, { alignItems: "flex-end" }]}>
          <Text style={s.resumeLabel}>Sortie</Text>
          <Text style={[s.resumeVal, !fin && s.resumeVide]}>{fmtDate(fin)}</Text>
        </View>
      </View>

      {/* Navigation mois */}
      <View style={s.nav}>
        <TouchableOpacity onPress={() => setVue(new Date(an, mo - 1, 1))} style={s.navBtn}>
          <Ionicons name="chevron-back" size={16} color={C.fg} />
        </TouchableOpacity>
        <Text style={s.navTitre}>{MOIS_NOMS[mo]} {an}</Text>
        <TouchableOpacity onPress={() => setVue(new Date(an, mo + 1, 1))} style={s.navBtn}>
          <Ionicons name="chevron-forward" size={16} color={C.fg} />
        </TouchableOpacity>
      </View>

      {/* En-tête jours */}
      <View style={s.row}>
        {JOURS.map((j, i) => (
          <Text key={i} style={s.jourHeader}>{j}</Text>
        ))}
      </View>

      {/* Grille */}
      <View style={s.row}>
        {cells.map((j, i) => {
          if (j === null) return <View key={`e${i}`} style={{ width: CELL_W, height: CELL_W }} />;
          const date    = new Date(an, mo, j);
          const isStart = debut ? sameDay(date, debut) : false;
          const isEnd   = fin   ? sameDay(date, fin)   : false;
          const isRange = inRange(date, debut, fin);
          const isPast  = date < todayMidnight;
          const isToday = sameDay(date, todayMidnight);
          return (
            <TouchableOpacity
              key={j}
              disabled={isPast}
              onPress={() => tap(j)}
              style={[
                { width: CELL_W, height: CELL_W, alignItems: "center", justifyContent: "center" },
                isRange && { backgroundColor: C.muted },
                (isStart || isEnd) && { backgroundColor: C.primary, borderRadius: CELL_W / 2 },
              ]}
            >
              <Text style={[
                s.jourTxt,
                isPast  && s.jourPasse,
                isToday && !isStart && !isEnd && s.jourAujourd,
                isRange && s.jourRange,
                (isStart || isEnd) && s.jourSelec,
              ]}>{j}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hint ou confirmation */}
      {debut && !fin ? (
        <Text style={s.hint}>Sélectionnez la date de sortie</Text>
      ) : debut && fin ? (
        <TouchableOpacity style={s.confirmBtn} onPress={onClose}>
          <Text style={s.confirmTxt}>Confirmer la période</Text>
        </TouchableOpacity>
      ) : null}
    </SheetBase>
  );
}

const s = StyleSheet.create({
  resume: {
    flexDirection:  "row",
    alignItems:     "flex-start",
    justifyContent: "space-between",
    backgroundColor: C.muted,
    borderWidth:    1,
    borderColor:    C.border,
    borderRadius:   C.r + 2,
    paddingHorizontal: 18,
    paddingVertical:   12,
    marginBottom:   18,
    gap:            8,
  },
  resumeBloc:  { flex: 1 },
  resumeLabel: { fontSize: 10, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  resumeVal:   { fontSize: 14, fontWeight: "600", color: C.fg },
  resumeVide:  { color: C.border },
  nav:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  navBtn:  { width: 32, height: 32, borderRadius: C.r, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  navTitre:{ fontSize: 14, fontWeight: "600", color: C.fg },
  row:     { flexDirection: "row", flexWrap: "wrap" },
  jourHeader: { width: CELL_W, textAlign: "center", fontSize: 11, fontWeight: "600", color: C.mutedFg, paddingBottom: 6 },
  jourTxt:    { fontSize: 13, color: C.fg },
  jourPasse:  { color: C.border },
  jourAujourd:{ fontWeight: "700", color: C.accent },
  jourRange:  { color: C.fgSub },
  jourSelec:  { color: C.primaryFg, fontWeight: "700" },
  hint:       { textAlign: "center", fontSize: 12, color: C.mutedFg, marginTop: 12, fontStyle: "italic" },
  confirmBtn: { marginTop: 14, backgroundColor: C.primary, borderRadius: C.r, paddingVertical: 11, alignItems: "center" },
  confirmTxt: { color: C.primaryFg, fontSize: 13, fontWeight: "600" },
});