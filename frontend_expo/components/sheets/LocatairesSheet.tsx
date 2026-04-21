import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SheetBase, { C } from "./SheetBase";

type Props = {
  visible:     boolean;
  onClose:     () => void;
  adultes:     number;
  enfants:     number;
  chambres:    number;
  setAdultes:  (v: number) => void;
  setEnfants:  (v: number) => void;
  setChambres: (v: number) => void;
};

function Compteur({ label, sous, val, min, max, set }: {
  label: string; sous: string;
  val: number; min: number; max: number;
  set: (v: number) => void;
}) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.sous}>{sous}</Text>
      </View>
      <View style={s.ctrl}>
        <TouchableOpacity
          onPress={() => set(Math.max(min, val - 1))}
          disabled={val <= min}
          style={[s.btn, val <= min && s.btnOff]}
        >
          <Ionicons name="remove" size={17} color={val <= min ? C.border : C.fg} />
        </TouchableOpacity>
        <Text style={s.val}>{val}</Text>
        <TouchableOpacity
          onPress={() => set(Math.min(max, val + 1))}
          disabled={val >= max}
          style={[s.btn, val >= max && s.btnOff]}
        >
          <Ionicons name="add" size={17} color={val >= max ? C.border : C.fg} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function LocatairesSheet({
  visible, onClose,
  adultes, enfants, chambres,
  setAdultes, setEnfants, setChambres,
}: Props) {
  return (
    <SheetBase visible={visible} onClose={onClose} titre="Locataires & Chambres" hauteur={0.46}>
      <View style={s.wrap}>
        <Compteur
          label="Adultes"
          sous="18 ans et plus"
          val={adultes} min={0} max={20} set={setAdultes}
        />
        <View style={s.sep} />
        <Compteur
          label="Enfants"
          sous="Moins de 18 ans"
          val={enfants} min={0} max={10} set={setEnfants}
        />
        <View style={s.sep} />
        <Compteur
          label="Chambres"
          sous="Nombre de chambres"
          val={chambres} min={1} max={10} set={setChambres}
        />
      </View>

      <TouchableOpacity style={s.doneBtn} onPress={onClose}>
        <Text style={s.doneTxt}>Confirmer</Text>
      </TouchableOpacity>
    </SheetBase>
  );
}

const s = StyleSheet.create({
  wrap: {
    borderWidth:  1,
    borderColor:  C.border,
    borderRadius: C.r + 2,
    paddingHorizontal: 16,
    backgroundColor: C.card,
    marginBottom: 16,
  },
  sep:   { height: StyleSheet.hairlineWidth, backgroundColor: C.border },
  row:   { flexDirection: "row", alignItems: "center", paddingVertical: 15 },
  label: { fontSize: 15, fontWeight: "600", color: C.fg, marginBottom: 2 },
  sous:  { fontSize: 12, color: C.mutedFg },
  ctrl:  { flexDirection: "row", alignItems: "center", gap: 16 },
  btn:   { width: 32, height: 32, borderRadius: C.r, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, alignItems: "center", justifyContent: "center" },
  btnOff:{ backgroundColor: C.muted },
  val:   { fontSize: 16, fontWeight: "700", color: C.fg, minWidth: 24, textAlign: "center" },
  doneBtn: { backgroundColor: C.primary, borderRadius: C.r, paddingVertical: 13, alignItems: "center" },
  doneTxt: { color: C.primaryFg, fontSize: 14, fontWeight: "600" },
});