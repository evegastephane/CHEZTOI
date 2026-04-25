import { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUser, useClerk } from "@clerk/expo";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";

import { C } from "@/constants/colors";

type Role = "client" | "proprietaire" | "agent";

const ROLES: { id: Role; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
  {
    id:    "client",
    label: "Client",
    icon:  "person-outline",
    desc:  "Recherchez et réservez des biens en toute simplicité.",
  },
  {
    id:    "proprietaire",
    label: "Propriétaire",
    icon:  "home-outline",
    desc:  "Publiez et gérez vos biens, suivez vos réservations et revenus.",
  },
  {
    id:    "agent",
    label: "Agent immobilier",
    icon:  "briefcase-outline",
    desc:  "Gérez un portefeuille de biens pour vos clients propriétaires.",
  },
];

export default function ProfilProprietaire() {
  const { user, isLoaded } = useUser();
  const { signOut }        = useClerk();
  const router             = useRouter();
  const posthog            = usePostHog();

  const [loading,     setLoading]     = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);

  const roleActuel = ((user?.unsafeMetadata?.role as Role) ?? "proprietaire");

  const handleSignOut = async () => {
    setLoading(true);
    try {
      posthog?.capture("user_signed_out");
      await signOut();
      router.replace("/(auth)/sign-in");
    } finally {
      setLoading(false);
    }
  };

  const changerRole = async (role: Role) => {
    if (role === roleActuel || roleLoading) return;
    setRoleLoading(true);
    try {
      await user?.update({ unsafeMetadata: { ...user.unsafeMetadata, role } });
      posthog?.capture("role_changed", { role });
      if (role === "client") {
        router.replace("/(tabs)");
      }
      // agent space à venir
    } catch {
      Alert.alert("Erreur", "Impossible de mettre à jour votre rôle. Réessayez.");
    } finally {
      setRoleLoading(false);
    }
  };

  const initiales = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean).join("").toUpperCase() || "?";

  const nomComplet = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Utilisateur";
  const email      = user?.primaryEmailAddress?.emailAddress ?? "";
  const telephone  = user?.primaryPhoneNumber?.phoneNumber   ?? "";
  const roleInfo   = ROLES.find((r) => r.id === roleActuel) ?? ROLES[1];

  if (!isLoaded) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.center}><ActivityIndicator color={C.accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.titre}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={s.heroCard}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{initiales}</Text>
          </View>
          <Text style={s.nomTxt}>{nomComplet}</Text>
          <Text style={s.emailTxt}>{email}</Text>
          <View style={s.roleBadge}>
            <Ionicons name={roleInfo.icon} size={12} color={C.accent} />
            <Text style={s.roleBadgeTxt}>{roleInfo.label}</Text>
          </View>
        </View>

        {/* ── Informations du compte ── */}
        <View style={s.section}>
          <Text style={s.sectionTitre}>Informations du compte</Text>
          <View style={s.card}>
            <InfoRow icon="person-outline"   label="Prénom"        valeur={user?.firstName ?? "—"} />
            <View style={s.sep} />
            <InfoRow icon="person-outline"   label="Nom"           valeur={user?.lastName  ?? "—"} />
            <View style={s.sep} />
            <InfoRow icon="mail-outline"     label="E-mail"        valeur={email     || "—"} />
            {telephone ? (
              <>
                <View style={s.sep} />
                <InfoRow icon="call-outline" label="Téléphone"     valeur={telephone} />
              </>
            ) : null}
            <View style={s.sep} />
            <InfoRow icon="calendar-outline" label="Membre depuis" valeur={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("fr-FR", {
                    year: "numeric", month: "long", day: "numeric",
                  })
                : "—"
            } />
          </View>
        </View>

        {/* ── Mon rôle ── */}
        <View style={s.section}>
          <Text style={s.sectionTitre}>Mon rôle</Text>
          <View style={s.card}>
            {ROLES.map((r, idx) => {
              const actif = r.id === roleActuel;
              return (
                <View key={r.id}>
                  {idx > 0 && <View style={s.sep} />}
                  <TouchableOpacity
                    style={s.roleRow}
                    onPress={() => changerRole(r.id)}
                    activeOpacity={0.7}
                    disabled={roleLoading}
                  >
                    <View style={[s.roleIconWrap, actif && s.roleIconWrapActif]}>
                      <Ionicons name={r.icon} size={16} color={actif ? C.primaryFg : C.mutedFg} />
                    </View>
                    <View style={s.roleBody}>
                      <Text style={[s.roleLabel, actif && s.roleLabelActif]}>{r.label}</Text>
                      <Text style={s.roleDesc} numberOfLines={2}>{r.desc}</Text>
                    </View>
                    {actif
                      ? <Ionicons name="checkmark-circle" size={20} color={C.primary} />
                      : <View style={s.roleCircle} />
                    }
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
          {roleLoading && (
            <View style={s.roleLoadingRow}>
              <ActivityIndicator size="small" color={C.accent} />
              <Text style={s.roleLoadingTxt}>Mise à jour en cours…</Text>
            </View>
          )}
        </View>

        {/* ── Déconnexion ── */}
        <View style={s.section}>
          <TouchableOpacity
            style={[s.logoutBtn, loading && s.logoutBtnDisabled]}
            onPress={handleSignOut}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={C.red} size="small" />
              : <>
                  <Ionicons name="log-out-outline" size={18} color={C.red} />
                  <Text style={s.logoutTxt}>Se déconnecter</Text>
                </>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, valeur }: { icon: keyof typeof Ionicons.glyphMap; label: string; valeur: string }) {
  return (
    <View style={s.row}>
      <View style={s.rowIcon}><Ionicons name={icon} size={16} color={C.mutedFg} /></View>
      <View style={s.rowBody}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowValeur} numberOfLines={1}>{valeur}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  titre: { fontSize: 20, fontWeight: "700", color: C.fg, letterSpacing: -0.3 },

  scroll: { padding: 20, gap: 20, paddingBottom: 120 },

  heroCard: {
    backgroundColor: C.card, borderRadius: C.r, borderWidth: 1, borderColor: C.border,
    alignItems: "center", padding: 28, gap: 6,
  },
  avatar:       { width: 72, height: 72, borderRadius: 36, backgroundColor: C.accent, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatarTxt:    { fontSize: 26, fontWeight: "700", color: "#FFF" },
  nomTxt:       { fontSize: 18, fontWeight: "700", color: C.fg, letterSpacing: -0.3 },
  emailTxt:     { fontSize: 13, color: C.mutedFg },
  roleBadge:    { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.accentBg, borderRadius: 20, borderWidth: 1, borderColor: C.accentBdr, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4 },
  roleBadgeTxt: { fontSize: 12, fontWeight: "600", color: C.accent },

  section:      { gap: 10 },
  sectionTitre: { fontSize: 12, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.5 },

  card: { backgroundColor: C.card, borderRadius: C.r, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  sep:  { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: 52 },

  row:      { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16, gap: 12 },
  rowIcon:  { width: 24, alignItems: "center" },
  rowBody:  { flex: 1 },
  rowLabel: { fontSize: 11, color: C.mutedFg, marginBottom: 2 },
  rowValeur:{ fontSize: 14, color: C.fg, fontWeight: "500" },

  roleRow:           { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, gap: 14 },
  roleIconWrap:      { width: 36, height: 36, borderRadius: 10, backgroundColor: C.muted, alignItems: "center", justifyContent: "center" },
  roleIconWrapActif: { backgroundColor: C.primary },
  roleBody:          { flex: 1, gap: 2 },
  roleLabel:         { fontSize: 14, fontWeight: "600", color: C.fgSub },
  roleLabelActif:    { color: C.fg },
  roleDesc:          { fontSize: 12, color: C.mutedFg, lineHeight: 17 },
  roleCircle:        { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border },
  roleLoadingRow:    { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  roleLoadingTxt:    { fontSize: 12, color: C.mutedFg },

  logoutBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: C.card, borderRadius: C.r, borderWidth: 1, borderColor: "#FECACA", paddingVertical: 15 },
  logoutBtnDisabled: { opacity: 0.6 },
  logoutTxt:         { fontSize: 15, fontWeight: "600", color: C.red },
});