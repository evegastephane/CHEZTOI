import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Favori() {
  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.titre}>Favoris</Text>
      </View>
      <View style={s.body}>
        <Text style={s.vide}>Vos biens sauvegardés</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#FAFAFA" },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E4E4E7", backgroundColor: "#FFFFFF" },
  titre:  { fontSize: 20, fontWeight: "700", color: "#18181B", letterSpacing: -0.3 },
  body:   { flex: 1, alignItems: "center", justifyContent: "center" },
  vide:   { fontSize: 14, color: "#71717A" },
});