import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { C } from "@/constants/colors";

export default function MessagesProprietaire() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.root} edges={["top"]}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>Espace propriétaire</Text>
          <Text style={s.headerTitle}>Messages</Text>
        </View>
        <TouchableOpacity style={s.newBtn} activeOpacity={0.8}>
          <Ionicons name="create-outline" size={20} color={C.fg} />
        </TouchableOpacity>
      </View>

      {/* État vide */}
      <View style={s.vide}>
        <View style={s.videIconWrap}>
          <Ionicons name="chatbubble-ellipses-outline" size={34} color={C.accent} />
        </View>
        <Text style={s.videTitre}>Aucun message</Text>
        <Text style={s.videDesc}>
          Les demandes de vos locataires et candidats apparaîtront ici une fois vos biens publiés.
        </Text>
        <TouchableOpacity
          style={s.videBtn}
          onPress={() => router.push("/ai")}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={16} color="#FFF" />
          <Text style={s.videBtnTxt}>Demander à Lia</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14,
  },
  headerSub:   { fontSize: 12, color: C.mutedFg, fontWeight: "500" },
  headerTitle: { fontSize: 26, fontWeight: "700", color: C.fg, letterSpacing: -0.5 },
  newBtn:      { width: 38, height: 38, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },

  vide:        { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 12 },
  videIconWrap:{ width: 76, height: 76, borderRadius: 22, backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accentBdr, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  videTitre:   { fontSize: 18, fontWeight: "700", color: C.fg, textAlign: "center" },
  videDesc:    { fontSize: 14, color: C.mutedFg, textAlign: "center", lineHeight: 20 },
  videBtn:     { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  videBtnTxt:  { fontSize: 14, fontWeight: "600", color: "#FFF" },
});