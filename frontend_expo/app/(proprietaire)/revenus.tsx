import { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, Pressable,
  RefreshControl, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { useFocusEffect } from "@react-navigation/native";

import { C } from "@/constants/colors";
import { revenusAPI, type Revenu, type RevenusReponse } from "@/services/biens";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function fmtMontant(n: number): string {
  return n.toLocaleString("fr-FR") + " €";
}

// ─── Item transaction ─────────────────────────────────────────────────────────

function ItemTransaction({ item }: { item: Revenu }) {
  const isRetrait = item.Type === "RETRAIT";
  return (
    <View style={s.txItem}>
      <View style={[s.txIcon, { backgroundColor: isRetrait ? "#FEE2E2" : "#DCFCE7" }]}>
        <Ionicons
          name={isRetrait ? "arrow-up-outline" : "arrow-down-outline"}
          size={16}
          color={isRetrait ? C.red : C.green}
        />
      </View>
      <View style={s.txBody}>
        <Text style={s.txLabel}>{item.Description || (isRetrait ? "Retrait" : "Paiement reçu")}</Text>
        <Text style={s.txDate}>{fmtDate(item.CreatedAt)}</Text>
      </View>
      <Text style={[s.txMontant, { color: isRetrait ? C.red : C.green }]}>
        {isRetrait ? "−" : "+"}{fmtMontant(item.Montant)}
      </Text>
    </View>
  );
}

// ─── État vide ────────────────────────────────────────────────────────────────

function EtatVide() {
  return (
    <View style={s.vide}>
      <View style={s.videIconWrap}>
        <Ionicons name="cash-outline" size={34} color={C.accent} />
      </View>
      <Text style={s.videTitre}>Aucune transaction</Text>
      <Text style={s.videDesc}>
        Vos revenus apparaîtront ici une fois que des locataires auront effectué des paiements.
      </Text>
    </View>
  );
}

// ─── Modal retrait ────────────────────────────────────────────────────────────

function ModalRetrait({
  visible,
  solde,
  clerkId,
  onClose,
  onSuccess,
}: {
  visible:   boolean;
  solde:     number;
  clerkId:   string;
  onClose:   () => void;
  onSuccess: (nouveauSolde: number) => void;
}) {
  const [montant,     setMontant]     = useState("");
  const [description, setDescription] = useState("Retrait vers Mobile Money");
  const [loading,     setLoading]     = useState(false);

  const confirmer = async () => {
    const val = parseInt(montant, 10);
    if (!val || val <= 0)  { Alert.alert("Montant invalide", "Saisissez un montant supérieur à 0."); return; }
    if (val > solde)       { Alert.alert("Solde insuffisant", `Votre solde disponible est de ${fmtMontant(solde)}.`); return; }

    setLoading(true);
    try {
      const res = await revenusAPI.retirer(clerkId, val, description);
      onSuccess(res.solde);
      setMontant("");
      onClose();
    } catch (e: unknown) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Impossible d'effectuer le retrait.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose}>
        <Pressable style={s.modalPanel} onPress={() => {}}>
          <View style={s.modalHandle} />

          <View style={s.modalHeader}>
            <Text style={s.modalTitre}>Retirer des fonds</Text>
            <TouchableOpacity style={s.modalCloseBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color={C.fg} />
            </TouchableOpacity>
          </View>

          {/* Solde dispo */}
          <View style={s.soldeBanner}>
            <Text style={s.soldeBannerLabel}>Solde disponible</Text>
            <Text style={s.soldeBannerVal}>{fmtMontant(solde)}</Text>
          </View>

          <View style={s.modalBody}>
            {/* Montant */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Montant à retirer (€)</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.input}
                  placeholder="ex. 50"
                  placeholderTextColor={C.mutedFg}
                  value={montant}
                  onChangeText={setMontant}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={s.maxBtn}
                  onPress={() => setMontant(String(solde))}
                  activeOpacity={0.7}
                >
                  <Text style={s.maxBtnTxt}>MAX</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Description */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Description</Text>
              <TextInput
                style={s.input}
                placeholder="ex. Retrait vers Orange Money"
                placeholderTextColor={C.mutedFg}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <TouchableOpacity
              style={[s.retraitBtn, loading && { opacity: 0.7 }]}
              onPress={confirmer}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={C.primaryFg} />
                : <>
                    <Ionicons name="send-outline" size={16} color={C.primaryFg} />
                    <Text style={s.retraitBtnTxt}>Confirmer le retrait</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function Revenus() {
  const { user } = useUser();

  const [data,        setData]        = useState<RevenusReponse | null>(null);
  const [chargement,  setChargement]  = useState(true);
  const [refresh,     setRefresh]     = useState(false);
  const [erreur,      setErreur]      = useState(false);
  const [modalRetrait, setModalRetrait] = useState(false);

  const charger = useCallback(async (silent = false) => {
    if (!user?.id) return;
    if (!silent) setChargement(true);
    setErreur(false);
    try {
      const res = await revenusAPI.lister(user.id);
      setData(res);
    } catch {
      setErreur(true);
    } finally {
      setChargement(false);
      setRefresh(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const onRetrait = (nouveauSolde: number) => {
    setData((prev) => prev ? { ...prev, solde: nouveauSolde, totalRetraits: prev.totalRecu - nouveauSolde } : prev);
    charger(true);
  };

  const stats = [
    { label: "Reçu",     valeur: fmtMontant(data?.totalRecu ?? 0),     icon: "arrow-down-circle-outline" as const, couleur: C.green   },
    { label: "Retiré",   valeur: fmtMontant(data?.totalRetraits ?? 0),  icon: "arrow-up-circle-outline"   as const, couleur: C.red     },
    { label: "Disponible", valeur: fmtMontant(data?.solde ?? 0),        icon: "wallet-outline"            as const, couleur: C.accent  },
  ];

  return (
    <SafeAreaView style={s.root} edges={["top"]}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>Espace propriétaire</Text>
          <Text style={s.headerTitle}>Mes revenus</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refresh}
            onRefresh={() => { setRefresh(true); charger(true); }}
            tintColor={C.accent}
          />
        }
      >
        {/* Hero solde */}
        <View style={s.heroCard}>
          <Text style={s.heroLabel}>Solde disponible</Text>
          <Text style={s.heroSolde}>{fmtMontant(data?.solde ?? 0)}</Text>
          <TouchableOpacity
            style={[s.retraitHeroBtn, (!data || data.solde <= 0) && s.retraitHeroBtnOff]}
            onPress={() => setModalRetrait(true)}
            disabled={!data || data.solde <= 0}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-up-outline" size={16} color={C.primaryFg} />
            <Text style={s.retraitHeroBtnTxt}>Retirer</Text>
          </TouchableOpacity>
        </View>

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

        {/* Historique */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitre}>Historique</Text>
        </View>

        {chargement ? (
          <View style={s.loader}><ActivityIndicator color={C.accent} /></View>
        ) : erreur ? (
          <View style={s.loader}>
            <Ionicons name="wifi-outline" size={32} color={C.border} />
            <Text style={s.erreurTxt}>Serveur inaccessible</Text>
            <TouchableOpacity onPress={() => charger()} activeOpacity={0.7}>
              <Text style={s.lien}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : !data || data.revenus.length === 0 ? (
          <EtatVide />
        ) : (
          <View style={s.txList}>
            {data.revenus.map((r) => (
              <ItemTransaction key={r.ID} item={r} />
            ))}
          </View>
        )}
      </ScrollView>

      <ModalRetrait
        visible={modalRetrait}
        solde={data?.solde ?? 0}
        clerkId={user?.id ?? ""}
        onClose={() => setModalRetrait(false)}
        onSuccess={onRetrait}
      />
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

  scroll: { paddingBottom: 120 },

  // Hero
  heroCard: {
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: C.primary, borderRadius: C.r + 4,
    padding: 24, alignItems: "center", gap: 8,
  },
  heroLabel:        { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  heroSolde:        { fontSize: 38, fontWeight: "700", color: "#FFF", letterSpacing: -1 },
  retraitHeroBtn:   { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retraitHeroBtnOff:{ opacity: 0.4 },
  retraitHeroBtnTxt:{ fontSize: 14, fontWeight: "600", color: "#FFF" },

  // Stats
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: C.card, borderRadius: C.r, borderWidth: 1, borderColor: C.border, padding: 12, alignItems: "center", gap: 5 },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValeur:{ fontSize: 13, fontWeight: "700", color: C.fg, textAlign: "center" },
  statLabel: { fontSize: 10, color: C.mutedFg, textAlign: "center", lineHeight: 13 },

  // Section
  sectionHeader: { paddingHorizontal: 20, marginBottom: 12 },
  sectionTitre:  { fontSize: 13, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.5 },

  // Transactions
  txList: { paddingHorizontal: 20, gap: 8 },
  txItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, borderRadius: C.r, borderWidth: 1, borderColor: C.border,
    padding: 14,
  },
  txIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  txBody:    { flex: 1, gap: 2 },
  txLabel:   { fontSize: 14, fontWeight: "600", color: C.fg },
  txDate:    { fontSize: 12, color: C.mutedFg },
  txMontant: { fontSize: 15, fontWeight: "700" },

  loader:    { alignItems: "center", paddingTop: 48, gap: 12 },
  erreurTxt: { fontSize: 14, color: C.mutedFg },
  lien:      { fontSize: 13, color: C.accent, fontWeight: "600" },

  // État vide
  vide:        { alignItems: "center", paddingHorizontal: 40, paddingTop: 32, gap: 12 },
  videIconWrap:{ width: 76, height: 76, borderRadius: 22, backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accentBdr, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  videTitre:   { fontSize: 18, fontWeight: "700", color: C.fg, textAlign: "center" },
  videDesc:    { fontSize: 14, color: C.mutedFg, textAlign: "center", lineHeight: 20 },

  // Modal retrait
  modalOverlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalPanel:    { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
  modalHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  modalHeader:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  modalTitre:    { fontSize: 16, fontWeight: "700", color: C.fg },
  modalCloseBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.muted, alignItems: "center", justifyContent: "center" },
  modalBody:     { padding: 20, gap: 16 },

  soldeBanner:    { marginHorizontal: 20, marginTop: 12, backgroundColor: C.accentBg, borderRadius: 12, borderWidth: 1, borderColor: C.accentBdr, padding: 14, alignItems: "center", gap: 2 },
  soldeBannerLabel:{ fontSize: 12, color: C.mutedFg, fontWeight: "500" },
  soldeBannerVal:  { fontSize: 22, fontWeight: "700", color: C.accent },

  fieldWrap:  { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.4 },
  inputWrap:  { flexDirection: "row", alignItems: "center", backgroundColor: C.muted, borderRadius: C.r, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  input:      { flex: 1, fontSize: 15, color: C.fg, padding: 0 },
  maxBtn:     { backgroundColor: C.primary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  maxBtnTxt:  { fontSize: 11, fontWeight: "700", color: C.primaryFg },

  retraitBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: C.primary, borderRadius: C.r, paddingVertical: 16 },
  retraitBtnTxt: { fontSize: 15, fontWeight: "700", color: C.primaryFg },
});