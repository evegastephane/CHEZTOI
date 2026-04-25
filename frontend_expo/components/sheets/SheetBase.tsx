import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";

const SCREEN_H = Dimensions.get("window").height;

export const C = {
  bg:        "#FFFFFF",
  card:      "#FFFFFF",
  border:    "#A3B18A",
  muted:     "#EAE8E3",
  mutedFg:   "#588157",
  fg:        "#344E41",
  fgSub:     "#3A5A40",
  primary:   "#3A5A40",
  primaryFg: "#FFFFFF",
  accent:    "#588157",
  r:         8,
};

type Props = {
  visible:  boolean;
  onClose:  () => void;
  titre:    string;
  hauteur?: number; // fraction de l'écran, ex 0.45
  children: ReactNode;
};

export default function SheetBase({ visible, onClose, titre, hauteur = 0.5, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />

      <View style={[s.sheet, { height: SCREEN_H * hauteur, paddingBottom: insets.bottom + 16 }]}>
        <View style={s.handle} />

        <View style={s.header}>
          <Text style={s.titre}>{titre}</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={15} color={C.fg} />
          </TouchableOpacity>
        </View>

        {children}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position:              "absolute",
    bottom:                0,
    left:                  0,
    right:                 0,
    backgroundColor:       C.card,
    borderTopLeftRadius:   20,
    borderTopRightRadius:  20,
    paddingHorizontal:     20,
    paddingTop:            12,
  },
  handle: {
    width:           36,
    height:          4,
    borderRadius:    2,
    backgroundColor: C.border,
    alignSelf:       "center",
    marginBottom:    14,
  },
  header: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "space-between",
    marginBottom:    18,
  },
  titre: {
    fontSize:    16,
    fontWeight:  "700",
    color:       C.fg,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width:           28,
    height:          28,
    borderRadius:    C.r,
    backgroundColor: C.muted,
    borderWidth:     1,
    borderColor:     C.border,
    alignItems:      "center",
    justifyContent:  "center",
  },
});