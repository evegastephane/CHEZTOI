import { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/expo";
import { useFocusEffect } from "@react-navigation/native";

import { C } from "@/constants/colors";
import { biensAPI, premierephoto, type BienAPI } from "@/services/biens";

// ─── Carte bien propriétaire ──────────────────────────────────────────────────

function BienCard({ bien, onSupprimer }: { bien: BienAPI; onSupprimer: (id: string) => void }) {
  const photo = premierephoto(bien);
  const autresPhotos = bien.Photos?.filter((p) => p.Ordre !== 0) ?? [];

  const confirmerSuppression = () =>
    Alert.alert(
      "Supprimer ce bien",
      "Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => onSupprimer(bien.ID) },
      ],
    );

  return (
    <View style={s.bienCard}>
      {/* Image principale */}
      <View style={s.bienImgWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={s.bienImg} resizeMode="cover" />
        ) : (
          <View style={[s.bienImg, s.bienImgVide]}>
            <Ionicons name="image-outline" size={32} color={C.border} />
          </View>
        )}
        <View style={s.bienTypeBadge}>
          <Text style={s.bienTypeTxt}>{bien.Type}</Text>
        </View>
        <TouchableOpacity style={s.bienDelBtn} onPress={confirmerSuppression} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={14} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Infos */}
      <View style={s.bienBody}>
        <View style={s.bienTop}>
          <Text style={s.bienNom} numberOfLines={1}>{bien.Titre}</Text>
          <Text style={s.bienPrix}>{bien.Prix} €<Text style={s.bienNuit}>/nuit</Text></Text>
        </View>
        <View style={s.bienMeta}>
          <View style={s.bienMetaItem}>
            <Ionicons name="location-outline" size={12} color={C.mutedFg} />
            <Text style={s.bienMetaTxt}>{bien.Ville}</Text>
          </View>
          <View style={s.bienMetaItem}>
            <Ionicons name="bed-outline" size={12} color={C.mutedFg} />
            <Text style={s.bienMetaTxt}>{bien.NombreChambres} ch.</Text>
          </View>
          {bien.Superficie > 0 && (
            <View style={s.bienMetaItem}>
              <Ionicons name="expand-outline" size={12} color={C.mutedFg} />
              <Text style={s.bienMetaTxt}>{bien.Superficie} m²</Text>
            </View>
          )}
        </View>

        {/* Photos miniatures supplémentaires */}
        {autresPhotos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
            {autresPhotos.map((p) => (
              <Image key={p.ID} source={{ uri: `${p.URL}` }} style={s.bienThumb} resizeMode="cover" />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// ─── État vide ────────────────────────────────────────────────────────────────

function EtatVide({ onAjouter }: { onAjouter: () => void }) {
  return (
    <View style={s.vide}>
      <View style={s.videIconWrap}>
        <Ionicons name="home-outline" size={34} color={C.accent} />
      </View>
      <Text style={s.videTitre}>Aucun bien publié</Text>
      <Text style={s.videDesc}>
        Publiez votre premier bien pour commencer à recevoir des locataires.
      </Text>
      <TouchableOpacity style={s.videBtn} onPress={onAjouter} activeOpacity={0.85}>
        <Ionicons name="add" size={16} color={C.primaryFg} />
        <Text style={s.videBtnTxt}>Ajouter un bien</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function MesProprietes() {
  const router    = useRouter();
  const { user }  = useUser();

  const [biens,      setBiens]      = useState<BienAPI[]>([]);
  const [chargement, setChargement] = useState(true);
  const [refresh,    setRefresh]    = useState(false);
  const [erreur,     setErreur]     = useState(false);

  const charger = useCallback(async (silent = false) => {
    if (!user?.id) return;
    if (!silent) setChargement(true);
    setErreur(false);
    try {
      const data = await biensAPI.listerParProprietaire(user.id);
      setBiens(data);
    } catch {
      setErreur(true);
    } finally {
      setChargement(false);
      setRefresh(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const supprimer = async (id: string) => {
    try {
      await biensAPI.supprimer(id);
      setBiens((prev) => prev.filter((b) => b.ID !== id));
    } catch {
      Alert.alert("Erreur", "Impossible de supprimer ce bien.");
    }
  };

  const onAjouter = () => router.push("/ajouter-bien");

  const stats = [
    { label: "Biens publiés",  valeur: String(biens.length),                                                  icon: "home-outline"             as const, couleur: C.primary },
    { label: "Disponibles",    valeur: String(biens.filter((b) => b.Statut === "DISPONIBLE").length),          icon: "checkmark-circle-outline" as const, couleur: C.green   },
    { label: "Revenus est.",   valeur: biens.length ? `${biens.reduce((s, b) => s + b.Prix, 0)} €` : "0 €",   icon: "cash-outline"             as const, couleur: C.accent  },
  ];

  return (
    <SafeAreaView style={s.root} edges={["top"]}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>Espace propriétaire</Text>
          <Text style={s.headerTitle}>Mes biens</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={onAjouter} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color={C.primaryFg} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); charger(true); }} tintColor={C.accent} />
        }
      >
        {/* Stats */}
        <View style={s.statsRow}>
          {stats.map((item) => (
            <View key={item.label} style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: item.couleur + "18" }]}>
                <Ionicons name={item.icon} size={16} color={item.couleur} />
              </View>
              <Text style={s.statValeur}>{item.valeur}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Section liste */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitre}>Mes propriétés</Text>
          {biens.length > 0 && (
            <TouchableOpacity onPress={onAjouter} activeOpacity={0.7}>
              <Text style={s.sectionLien}>+ Ajouter</Text>
            </TouchableOpacity>
          )}
        </View>

        {chargement ? (
          <View style={s.loader}><ActivityIndicator color={C.accent} /></View>
        ) : erreur ? (
          <View style={s.loader}>
            <Ionicons name="wifi-outline" size={32} color={C.border} />
            <Text style={s.erreurTxt}>Serveur inaccessible</Text>
            <TouchableOpacity onPress={() => charger()} activeOpacity={0.7}>
              <Text style={s.sectionLien}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : biens.length === 0 ? (
          <EtatVide onAjouter={onAjouter} />
        ) : (
          <View style={s.liste}>
            {biens.map((b) => <BienCard key={b.ID} bien={b} onSupprimer={supprimer} />)}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14,
  },
  headerSub:   { fontSize: 12, color: C.mutedFg, fontWeight: "500" },
  headerTitle: { fontSize: 26, fontWeight: "700", color: C.fg, letterSpacing: -0.5 },
  addBtn:      { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },

  scroll: { paddingBottom: 120 },

  // Stats
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: C.card, borderRadius: C.r, borderWidth: 1, borderColor: C.border, padding: 12, alignItems: "center", gap: 5 },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValeur:{ fontSize: 16, fontWeight: "700", color: C.fg },
  statLabel: { fontSize: 10, color: C.mutedFg, textAlign: "center", lineHeight: 13 },

  // Section
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 12 },
  sectionTitre:  { fontSize: 13, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.5 },
  sectionLien:   { fontSize: 13, color: C.accent, fontWeight: "600" },

  liste: { paddingHorizontal: 20, gap: 16 },

  // Carte bien
  bienCard:    { backgroundColor: C.card, borderRadius: C.r + 4, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  bienImgWrap: { height: 180, position: "relative" },
  bienImg:     { width: "100%", height: "100%" },
  bienTypeBadge:{ position: "absolute", top: 12, left: 12, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  bienTypeTxt:  { fontSize: 11, color: "#FFF", fontWeight: "700", letterSpacing: 0.3 },
  bienDelBtn:   { position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },

  bienBody: { padding: 14, gap: 6 },
  bienTop:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bienNom:  { fontSize: 15, fontWeight: "700", color: C.fg, flex: 1, marginRight: 8 },
  bienPrix: { fontSize: 15, fontWeight: "700", color: C.primary },
  bienNuit: { fontSize: 12, fontWeight: "400", color: C.mutedFg },

  bienMeta:     { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  bienMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  bienMetaTxt:  { fontSize: 12, color: C.mutedFg },

  bienImgVide: { alignItems: "center", justifyContent: "center", backgroundColor: C.muted },
  bienThumb:   { width: 60, height: 60, borderRadius: 8 },
  loader:      { alignItems: "center", paddingTop: 48, gap: 12 },
  erreurTxt:   { fontSize: 14, color: C.mutedFg },

  // État vide
  vide:        { alignItems: "center", paddingHorizontal: 40, paddingTop: 32, gap: 12 },
  videIconWrap:{ width: 76, height: 76, borderRadius: 22, backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accentBdr, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  videTitre:   { fontSize: 18, fontWeight: "700", color: C.fg, textAlign: "center" },
  videDesc:    { fontSize: 14, color: C.mutedFg, textAlign: "center", lineHeight: 20 },
  videBtn:     { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  videBtnTxt:  { fontSize: 14, fontWeight: "600", color: C.primaryFg },
});