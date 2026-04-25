import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getBienById } from "@/data/db";

import { C } from "@/constants/colors";

const MOYEN_LABELS: Record<string, string> = {
  carte:    "Carte bancaire",
  orange:   "Orange Money",
  mtn:      "MTN Mobile Money",
  wave:     "Wave",
  virement: "Virement bancaire",
};

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function Confirmation() {
  const router  = useRouter();
  const params  = useLocalSearchParams<{ bienId: string; debut: string; fin: string; adultes: string; total: string; modePaie: string }>();

  const bien     = getBienById(params.bienId ?? "");
  const debut    = params.debut  ? new Date(params.debut)  : null;
  const fin      = params.fin    ? new Date(params.fin)    : null;
  const total    = params.total  ?? "—";
  const adultes  = Number(params.adultes) || 1;
  const modePaie = params.modePaie ?? "";
  const ref      = `CTZ-${(params.bienId ?? "").toUpperCase().slice(0, 6)}-${Date.now().toString().slice(-5)}`;

  const [loadFact, setLoadFact] = useState(false);

  const telechargerFacture = async () => {
    setLoadFact(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoadFact(false);
    Alert.alert("Facture générée", "Votre facture a été envoyée à votre adresse e-mail.", [{ text: "OK" }]);
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Icône succès ────────────────────────────────────────────── */}
        <View style={s.topSection}>
          <View style={s.checkWrap}>
            <View style={s.checkRing}>
              <Ionicons name="checkmark" size={44} color="#FFF" />
            </View>
          </View>
          <Text style={s.titre}>Réservation confirmée !</Text>
          <Text style={s.sousTitre}>Merci pour votre confiance</Text>
        </View>

        {/* ── Récapitulatif ────────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardHeaderTxt}>Référence</Text>
            <Text style={s.refTxt}>{ref}</Text>
          </View>

          {bien && (
            <>
              <View style={s.sep} />
              <View style={s.row}>
                <Text style={s.rowLabel}>Propriété</Text>
                <Text style={s.rowVal} numberOfLines={1}>{bien.nom}</Text>
              </View>
              <View style={s.sep} />
              <View style={s.row}>
                <Text style={s.rowLabel}>Localisation</Text>
                <Text style={s.rowVal}>{bien.ville}, {bien.pays}</Text>
              </View>
            </>
          )}

          {debut && fin && (
            <>
              <View style={s.sep} />
              <View style={s.row}>
                <Text style={s.rowLabel}>Arrivée</Text>
                <Text style={s.rowVal}>{fmtDate(debut)}</Text>
              </View>
              <View style={s.sep} />
              <View style={s.row}>
                <Text style={s.rowLabel}>Départ</Text>
                <Text style={s.rowVal}>{fmtDate(fin)}</Text>
              </View>
            </>
          )}

          <View style={s.sep} />
          <View style={s.row}>
            <Text style={s.rowLabel}>Voyageurs</Text>
            <Text style={s.rowVal}>{adultes} adulte{adultes > 1 ? "s" : ""}</Text>
          </View>

          <View style={s.sep} />
          <View style={s.row}>
            <Text style={s.rowLabel}>Paiement</Text>
            <Text style={s.rowVal}>{MOYEN_LABELS[modePaie] ?? modePaie}</Text>
          </View>

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total payé</Text>
            <Text style={s.totalMt}>{total} €</Text>
          </View>
        </View>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <View style={s.actions}>

          {/* Facture */}
          <TouchableOpacity style={s.btnOutline} onPress={telechargerFacture} activeOpacity={0.8} disabled={loadFact}>
            {loadFact ? (
              <ActivityIndicator size="small" color={C.fg} />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={18} color={C.fg} />
                <Text style={s.btnOutlineTxt}>Télécharger la facture</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Contacter propriétaire */}
          <TouchableOpacity
            style={s.btnAccent}
            onPress={() => router.replace("/(tabs)/messages")}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFF" />
            <Text style={s.btnAccentTxt}>Contacter le propriétaire</Text>
          </TouchableOpacity>

          {/* Retour accueil */}
          <TouchableOpacity
            style={s.btnGhost}
            onPress={() => router.replace("/(tabs)")}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={16} color={C.mutedFg} />
            <Text style={s.btnGhostTxt}>Retour à l'accueil</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },

  // Section succès
  topSection: { alignItems: "center", paddingTop: 48, paddingBottom: 36, paddingHorizontal: 20 },
  checkWrap:  { marginBottom: 20 },
  checkRing:  { width: 88, height: 88, borderRadius: 44, backgroundColor: C.green, alignItems: "center", justifyContent: "center", shadowColor: C.green, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  titre:      { fontSize: 24, fontWeight: "800", color: C.fg, letterSpacing: -0.5, textAlign: "center" },
  sousTitre:  { fontSize: 14, color: C.mutedFg, marginTop: 6, textAlign: "center" },

  // Carte récap
  card:       { marginHorizontal: 20, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 24 },
  cardHeader: { paddingHorizontal: 18, paddingVertical: 14, backgroundColor: C.muted },
  cardHeaderTxt:{ fontSize: 10, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  refTxt:     { fontSize: 16, fontWeight: "700", color: C.fg, letterSpacing: 0.5 },
  sep:        { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: 18 },
  row:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 13 },
  rowLabel:   { fontSize: 13, color: C.mutedFg },
  rowVal:     { fontSize: 13, fontWeight: "600", color: C.fg, maxWidth: "55%", textAlign: "right" },
  totalRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 16, backgroundColor: "#F0FDF4", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#BBF7D0" },
  totalLabel: { fontSize: 14, fontWeight: "700", color: "#15803D" },
  totalMt:    { fontSize: 20, fontWeight: "800", color: "#15803D" },

  // Actions
  actions:      { paddingHorizontal: 20, gap: 12 },
  btnOutline:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
  btnOutlineTxt:{ fontSize: 15, fontWeight: "600", color: C.fg },
  btnAccent:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 12, backgroundColor: C.accent },
  btnAccentTxt: { fontSize: 15, fontWeight: "700", color: "#FFF" },
  btnGhost:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  btnGhostTxt:  { fontSize: 14, color: C.mutedFg, fontWeight: "500" },
});