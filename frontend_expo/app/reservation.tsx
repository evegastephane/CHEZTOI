import { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getBienById } from "@/data/db";
import DatesSheet      from "@/components/sheets/DatesSheet";
import LocatairesSheet from "@/components/sheets/LocatairesSheet";
import { initierPaiement, statutPaiement } from "@/data/keypay";

import { C } from "@/constants/colors";

type Step     = 1 | 2 | 3;
type Sheet    = "dates" | "locataires" | null;
type ModePaie = "orange" | "mtn" | null;

const MOYENS = [
  { id: "orange" as const, label: "Orange Money",     desc: "Mobile Money Orange", icon: "phone-portrait-outline" as const, color: "#F97316", keypayMethod: "OM_CM"   as const },
  { id: "mtn"    as const, label: "MTN Mobile Money", desc: "Mobile Money MTN",   icon: "phone-portrait-outline" as const, color: "#EAB308", keypayMethod: "MOMO_CM" as const },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nbNuits(d: Date | null, f: Date | null): number {
  if (!d || !f) return 0;
  return Math.max(1, Math.ceil((f.getTime() - d.getTime()) / 86_400_000));
}
function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}
function pluriel(n: number, m: string): string { return `${n} ${m}${n > 1 ? "s" : ""}`; }

// ─── Stepper ──────────────────────────────────────────────────────────────────

function StepNode({ n, step, label }: { n: 1|2|3; step: Step; label: string }) {
  const done   = n < step;
  const active = n === step;
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <View style={[st.circle, active && st.circleActive, done && st.circleDone]}>
        {done
          ? <Ionicons name="checkmark" size={12} color="#FFF" />
          : <Text style={[st.num, (active || done) && st.numOn]}>{n}</Text>
        }
      </View>
      <Text style={[st.lbl, (active || done) && st.lblOn]}>{label}</Text>
    </View>
  );
}

function Stepper({ step }: { step: Step }) {
  return (
    <View style={st.row}>
      <StepNode n={1} step={step} label="Séjour" />
      <View style={[st.conn, step > 1 && st.connDone]} />
      <StepNode n={2} step={step} label="Paiement" />
      <View style={[st.conn, step > 2 && st.connDone]} />
      <StepNode n={3} step={step} label="Coordonnées" />
    </View>
  );
}

const st = StyleSheet.create({
  row:         { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 14 },
  conn:        { flex: 1, height: 2, marginTop: 13, marginHorizontal: 6, backgroundColor: C.border },
  connDone:    { backgroundColor: C.accent },
  circle:      { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  circleActive:{ borderColor: C.fg, backgroundColor: C.fg },
  circleDone:  { borderColor: C.accent, backgroundColor: C.accent },
  num:         { fontSize: 12, fontWeight: "700", color: C.mutedFg },
  numOn:       { color: "#FFF" },
  lbl:         { fontSize: 10, fontWeight: "600", color: C.mutedFg },
  lblOn:       { color: C.fg },
});

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function Reservation() {
  const router = useRouter();
  const { bienId } = useLocalSearchParams<{ bienId: string }>();
  const bien = getBienById(bienId ?? "");

  const [step,     setStep]     = useState<Step>(1);
  const [sheet,    setSheet]    = useState<Sheet>(null);
  const [debut,    setDebut]    = useState<Date | null>(null);
  const [fin,      setFin]      = useState<Date | null>(null);
  const [adultes,  setAdultes]  = useState(1);
  const [enfants,  setEnfants]  = useState(0);
  const [chambres, setChambres] = useState(1);
  const [paiement,       setPaiement]       = useState<ModePaie>(null);
  const [infos,          setInfos]          = useState({ telephone: "" });
  const [loading,        setLoading]        = useState(false);
  const [pollMsg,        setPollMsg]        = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nuits     = nbNuits(debut, fin);
  const prixBase  = bien?.prix ?? 0;
  const sousTotal = nuits > 0 ? nuits * prixBase : prixBase;
  const frais     = Math.round(sousTotal * 0.08);
  const total     = sousTotal + frais;

  const goBack = () => {
    if (loading) return; // bloquer retour pendant le polling
    step === 1 ? router.back() : setStep((s) => (s - 1) as Step);
  };

  const stepTitle: Record<Step, string> = { 1: "Récapitulatif", 2: "Paiement", 3: "Coordonnées" };

  const ctaEnabled = (() => {
    if (step === 1) return true;
    if (step === 2) return paiement !== null;
    return infos.telephone.replace(/\D/g, "").length >= 8;
  })();

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const demarrerPolling = (reference: string) => {
    setPollMsg("En attente de votre confirmation sur le téléphone…");
    let attempts = 0;
    const MAX = 30; // 30 × 4 s = 2 minutes max

    pollRef.current = setInterval(async () => {
      attempts++;

      if (attempts >= MAX) {
        clearInterval(pollRef.current!);
        setLoading(false);
        Alert.alert("Délai expiré", "La transaction a expiré sans confirmation. Veuillez réessayer.");
        return;
      }

      try {
        const tx = await statutPaiement(reference);

        if (tx.status === "completed") {
          clearInterval(pollRef.current!);
          setLoading(false);
          router.replace({
            pathname: "/confirmation",
            params: { bienId: bien!.id, debut: debut!.toISOString(), fin: fin!.toISOString(), adultes: String(adultes), total: String(total), modePaie: paiement! },
          });
        } else if (tx.status === "failed" || tx.status === "cancelled") {
          clearInterval(pollRef.current!);
          setLoading(false);
          Alert.alert("Paiement échoué", tx.statusMessage ?? "La transaction a été refusée ou annulée.");
        }
      } catch {
        // réseau instable — on retente au prochain tick
      }
    }, 4000);
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!debut || !fin) { Alert.alert("Dates manquantes", "Veuillez choisir vos dates avant de continuer."); return; }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      const phone = infos.telephone.replace(/\D/g, "");
      if (phone.length < 8) { Alert.alert("Numéro invalide", "Veuillez entrer un numéro de téléphone valide."); return; }

      const moyen = MOYENS.find((m) => m.id === paiement)!;
      const ref   = `CTZ-${bien!.id.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`;

      setLoading(true);
      try {
        const tx = await initierPaiement({
          montant:          Math.round(total),
          telephone:        phone,
          methodePaiement:  moyen.keypayMethod,
          referenceExterne: ref,
          description:      `Réservation CheZToi — ${bien!.nom}`,
        });

        const txRef = tx.reference ?? tx.transactionId ?? "";
        if (!txRef) {
          setLoading(false);
          Alert.alert("Erreur", "Référence de transaction manquante.");
          return;
        }

        demarrerPolling(txRef);
      } catch (err: unknown) {
        setLoading(false);
        const msg = err instanceof Error ? err.message : "Impossible d'initier le paiement.";
        Alert.alert("Erreur de paiement", msg);
      }
    }
  };

  if (!bien) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}><Ionicons name="close" size={20} color={C.fg} /></TouchableOpacity>
          <Text style={s.headerTitle}>Réserver</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.center}><Text style={{ color: C.mutedFg }}>Bien introuvable</Text></View>
      </SafeAreaView>
    );
  }

  const datesLabel   = debut && fin ? `${fmtDate(debut)}  →  ${fmtDate(fin)}` : null;
  const locLabel     = [pluriel(adultes, "adulte"), enfants > 0 ? pluriel(enfants, "enfant") : null, pluriel(chambres, "chambre")].filter(Boolean).join("  ·  ");
  const moyenActif   = MOYENS.find((m) => m.id === paiement);

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <DatesSheet
        visible={sheet === "dates"} onClose={() => setSheet(null)}
        debut={debut} fin={fin} onChange={(d, f) => { setDebut(d); setFin(f); }}
      />
      <LocatairesSheet
        visible={sheet === "locataires"} onClose={() => setSheet(null)}
        adultes={adultes} setAdultes={setAdultes}
        enfants={enfants} setEnfants={setEnfants}
        chambres={chambres} setChambres={setChambres}
      />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.closeBtn} onPress={goBack} activeOpacity={0.7}>
          <Ionicons name={step === 1 ? "close" : "arrow-back"} size={20} color={C.fg} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{stepTitle[step]}</Text>
        <View style={{ width: 40 }} />
      </View>

      <Stepper step={step} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* ── ÉTAPE 1 : Récap + ajustements ─────────────────────────── */}
          {step === 1 && (
            <>
              <View style={s.recapCard}>
                <Image source={{ uri: bien.image }} style={s.recapImg} resizeMode="cover" />
                <View style={s.recapInfo}>
                  <View style={s.recapBadge}><Text style={s.recapBadgeTxt}>{bien.type}</Text></View>
                  <Text style={s.recapNom} numberOfLines={2}>{bien.nom}</Text>
                  <View style={s.recapRow}>
                    <Ionicons name="location-outline" size={12} color={C.mutedFg} />
                    <Text style={s.recapSub}>{bien.ville}, {bien.pays}</Text>
                  </View>
                  <View style={s.recapRow}>
                    <Ionicons name="star" size={12} color={C.gold} />
                    <Text style={s.recapSub}>{bien.note}  ·  {bien.avis} avis</Text>
                  </View>
                  <Text style={s.recapPrix}>{bien.prix} FCFA<Text style={s.recapNuit}> / nuit</Text></Text>
                </View>
              </View>

              <Text style={s.sectionTitre}>Votre séjour</Text>
              <View style={s.bloc}>
                <TouchableOpacity style={[s.zone, datesLabel ? s.zoneActive : null]} onPress={() => setSheet("dates")} activeOpacity={0.75}>
                  <View style={[s.zoneIcon, datesLabel ? s.zoneIconActive : null]}>
                    <Ionicons name="calendar-outline" size={17} color={datesLabel ? C.accent : C.mutedFg} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.zoneLabel}>Dates</Text>
                    {datesLabel ? <Text style={s.zoneVal}>{datesLabel}</Text> : <Text style={s.zoneVide}>Choisir les dates</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={C.border} />
                </TouchableOpacity>
                <View style={s.lineSep} />
                <TouchableOpacity style={s.zone} onPress={() => setSheet("locataires")} activeOpacity={0.75}>
                  <View style={s.zoneIcon}>
                    <Ionicons name="people-outline" size={17} color={C.mutedFg} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.zoneLabel}>Locataires</Text>
                    <Text style={s.zoneVal}>{locLabel}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={C.border} />
                </TouchableOpacity>
              </View>

              <Text style={s.sectionTitre}>Estimation du prix</Text>
              <View style={s.bloc}>
                <View style={s.prixRow}>
                  <Text style={s.prixLib}>{nuits > 0 ? `${bien.prix} FCFA × ${nuits} nuit${nuits > 1 ? "s" : ""}` : "Prix / nuit (dates à choisir)"}</Text>
                  <Text style={s.prixMt}>{sousTotal} FCFA</Text>
                </View>
                <View style={s.lineSep} />
                <View style={s.prixRow}>
                  <Text style={s.prixLib}>Frais de service (8 %)</Text>
                  <Text style={s.prixMt}>{frais} FCFA</Text>
                </View>
                <View style={s.lineSep} />
                <View style={s.prixRow}>
                  <Text style={[s.prixLib, s.prixTotalLib]}>Total</Text>
                  <Text style={[s.prixMt, s.prixTotalMt]}>{total} FCFA</Text>
                </View>
              </View>
            </>
          )}

          {/* ── ÉTAPE 2 : Moyen de paiement ───────────────────────────── */}
          {step === 2 && (
            <>
              <Text style={s.sectionTitre}>Moyen de paiement</Text>
              <View style={s.bloc}>
                {MOYENS.map((m, i) => (
                  <View key={m.id}>
                    {i > 0 && <View style={s.lineSep} />}
                    <TouchableOpacity style={[s.moyenRow, paiement === m.id && s.moyenRowOn]} onPress={() => setPaiement(m.id)} activeOpacity={0.75}>
                      <View style={[s.moyenIcon, { backgroundColor: m.color + "18" }]}>
                        <Ionicons name={m.icon} size={18} color={m.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.moyenLabel}>{m.label}</Text>
                        <Text style={s.moyenDesc}>{m.desc}</Text>
                      </View>
                      <View style={[s.radio, paiement === m.id && s.radioOn]}>
                        {paiement === m.id && <View style={s.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── ÉTAPE 3 : Numéro Mobile Money ─────────────────────────── */}
          {step === 3 && (
            <>
              {moyenActif && (
                <View style={s.moyenChosen}>
                  <View style={[s.moyenIcon, { backgroundColor: moyenActif.color + "18" }]}>
                    <Ionicons name={moyenActif.icon} size={16} color={moyenActif.color} />
                  </View>
                  <Text style={s.moyenChosenLabel}>{moyenActif.label}</Text>
                </View>
              )}

              <Text style={s.sectionTitre}>Numéro de téléphone</Text>
              <View style={s.bloc}>
                <View style={s.formField}>
                  <Text style={s.formLabel}>Numéro {moyenActif?.label}</Text>
                  <View style={s.formInputWrap}>
                    <Ionicons name="phone-portrait-outline" size={16} color={moyenActif?.color} />
                    <TextInput
                      style={s.formInput}
                      placeholder="6XX XXX XXX"
                      placeholderTextColor={C.mutedFg}
                      keyboardType="phone-pad"
                      value={infos.telephone}
                      onChangeText={(v) => setInfos({ telephone: v })}
                    />
                  </View>
                </View>
              </View>

              <View style={s.infoNote}>
                <Ionicons name="information-circle-outline" size={14} color={C.accent} />
                <Text style={s.infoTxt}>
                  Une invite de paiement sera envoyée sur ce numéro. Confirmez sur votre téléphone pour valider la transaction.
                </Text>
              </View>

              {loading && (
                <View style={s.pollBox}>
                  <ActivityIndicator color={C.accent} size="small" />
                  <Text style={s.pollTxt}>{pollMsg}</Text>
                </View>
              )}
            </>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={s.footer}>
        {step === 3 ? (
          <>
            <View>
              <Text style={s.footerLabel}>Total</Text>
              <Text style={s.footerTotal}>{total} FCFA</Text>
            </View>
            <TouchableOpacity style={[s.cta, (!ctaEnabled || loading) && s.ctaOff]} onPress={handleNext} activeOpacity={0.85} disabled={!ctaEnabled || loading}>
              {loading
                ? <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><ActivityIndicator color="#FFF" size="small" /><Text style={s.ctaTxt}>En cours…</Text></View>
                : <Text style={s.ctaTxt}>Payer {total} FCFA</Text>
              }
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[s.cta, { flex: 1 }]} onPress={handleNext} activeOpacity={0.85}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={s.ctaTxt}>Continuer</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingTop: 8, paddingBottom: 16 },

  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 14, backgroundColor: C.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.fg },
  closeBtn:    { width: 40, height: 40, borderRadius: 12, backgroundColor: C.muted, alignItems: "center", justifyContent: "center" },

  // Récap bien
  recapCard:    { marginHorizontal: 20, marginBottom: 24, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, flexDirection: "row", overflow: "hidden" },
  recapImg:     { width: 110, height: 130 },
  recapInfo:    { flex: 1, padding: 14, gap: 4, justifyContent: "center" },
  recapBadge:   { alignSelf: "flex-start", backgroundColor: C.muted, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: C.border, marginBottom: 2 },
  recapBadgeTxt:{ fontSize: 10, fontWeight: "600", color: C.fgSub },
  recapNom:     { fontSize: 14, fontWeight: "700", color: C.fg, letterSpacing: -0.2 },
  recapRow:     { flexDirection: "row", alignItems: "center", gap: 4 },
  recapSub:     { fontSize: 12, color: C.mutedFg },
  recapPrix:    { fontSize: 15, fontWeight: "700", color: C.fg, marginTop: 4 },
  recapNuit:    { fontSize: 11, fontWeight: "400", color: C.mutedFg },

  sectionTitre: { fontSize: 15, fontWeight: "700", color: C.fg, marginHorizontal: 20, marginBottom: 10, letterSpacing: -0.2 },

  bloc:    { marginHorizontal: 20, marginBottom: 24, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  lineSep: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: 16 },

  zone:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  zoneActive:    { backgroundColor: "#F0F7FF" },
  zoneIcon:      { width: 36, height: 36, borderRadius: C.r, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  zoneIconActive:{ backgroundColor: "#DBEAFE", borderColor: "#BFDBFE" },
  zoneLabel:     { fontSize: 10, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  zoneVal:       { fontSize: 14, fontWeight: "600", color: C.fg },
  zoneVide:      { fontSize: 13, color: C.border },

  prixRow:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  prixLib:     { fontSize: 14, color: C.fgSub },
  prixMt:      { fontSize: 14, fontWeight: "600", color: C.fg },
  prixTotalLib:{ fontWeight: "700", color: C.fg },
  prixTotalMt: { fontWeight: "700", color: C.fg, fontSize: 16 },

  moyenRow:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  moyenRowOn:  { backgroundColor: "#F0F7FF" },
  moyenIcon:   { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  moyenLabel:  { fontSize: 14, fontWeight: "600", color: C.fg },
  moyenDesc:   { fontSize: 12, color: C.mutedFg, marginTop: 1 },
  radio:       { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  radioOn:     { borderColor: C.accent },
  radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent },

  moyenChosen:      { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, marginBottom: 16, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  moyenChosenLabel: { fontSize: 14, fontWeight: "600", color: C.fg },

  formField:    { paddingHorizontal: 16, paddingVertical: 14 },
  formLabel:    { fontSize: 10, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 },
  formInputWrap:{ flexDirection: "row", alignItems: "center", gap: 10 },
  formInput:    { flex: 1, fontSize: 15, color: C.fg, paddingVertical: 0 },

  infoNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginHorizontal: 20, marginBottom: 20, marginTop: 0, backgroundColor: "#EFF6FF", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#BFDBFE" },
  infoTxt:  { fontSize: 12, color: "#1D4ED8", flex: 1, lineHeight: 18 },

  footer:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32, backgroundColor: C.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, gap: 16 },
  footerLabel: { fontSize: 12, color: C.mutedFg, marginBottom: 2 },
  footerTotal: { fontSize: 22, fontWeight: "700", color: C.fg },
  cta:         { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  ctaOff:      { backgroundColor: "#A1A1AA" },
  ctaTxt:      { color: C.primaryFg, fontSize: 15, fontWeight: "700" },

  pollBox: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, marginTop: 8, padding: 14, backgroundColor: "#EFF6FF", borderRadius: 12, borderWidth: 1, borderColor: "#BFDBFE" },
  pollTxt: { fontSize: 13, color: "#1D4ED8", flex: 1, lineHeight: 18 },
});