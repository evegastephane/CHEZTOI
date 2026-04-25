import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSignUp } from "@clerk/expo";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { C } from "@/constants/colors";

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const posthog = usePostHog();

  const [etape,    setEtape]    = useState<"infos" | "verification">("infos");
  const [prenom,   setPrenom]   = useState("");
  const [nom,      setNom]      = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [code,     setCode]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [erreur,   setErreur]   = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!isLoaded) { setErreur("Clerk se charge… Réessayez."); return; }
    if (!signUp)   { setErreur("Erreur d'initialisation. Relancez l'application."); return; }
    setLoading(true);
    setErreur(null);
    try {
      await signUp.create({
        ...(prenom && { firstName: prenom }),
        ...(nom    && { lastName:  nom }),
        emailAddress: email,
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setEtape("verification");
    } catch (e: any) {
      const msg = e.errors?.[0]?.longMessage
        ?? e.errors?.[0]?.message
        ?? e.message
        ?? "Une erreur est survenue.";
      posthog?.capture("user_signup_failed", { error: msg, etape: "creation" });
      setErreur(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!isLoaded || !signUp) { setErreur("Erreur d'initialisation. Relancez l'application."); return; }
    setLoading(true);
    setErreur(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        posthog?.capture("user_signed_up", { method: "email" });
        router.replace("/");
      }
    } catch (e: any) {
      const msg = e.errors?.[0]?.longMessage
        ?? e.errors?.[0]?.message
        ?? e.message
        ?? "Code invalide.";
      posthog?.capture("user_signup_failed", { error: msg, etape: "verification" });
      setErreur(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.kav}
      >
        <View style={s.hero}>
          <View style={s.logoWrap}>
            <Ionicons name="home" size={28} color={C.primaryFg} />
          </View>
          <Text style={s.appName}>CheZToi</Text>
          <Text style={s.baseline}>Créez votre compte gratuitement</Text>
        </View>

        <View style={s.card}>
          {etape === "infos" ? (
            <>
              <Text style={s.titre}>Inscription</Text>
              <Text style={s.sous}>Rejoignez la communauté CheZToi</Text>

              {erreur && (
                <View style={s.erreurBox}>
                  <Ionicons name="alert-circle-outline" size={15} color={C.red} />
                  <Text style={s.erreurTxt}>{erreur}</Text>
                </View>
              )}

              <View style={s.row}>
                <View style={[s.fieldWrap, { flex: 1 }]}>
                  <Text style={s.fieldLabel}>Prénom</Text>
                  <View style={s.inputWrap}>
                    <TextInput
                      style={s.input}
                      placeholder="Jean"
                      placeholderTextColor={C.mutedFg}
                      value={prenom}
                      onChangeText={setPrenom}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                <View style={[s.fieldWrap, { flex: 1 }]}>
                  <Text style={s.fieldLabel}>Nom</Text>
                  <View style={s.inputWrap}>
                    <TextInput
                      style={s.input}
                      placeholder="Dupont"
                      placeholderTextColor={C.mutedFg}
                      value={nom}
                      onChangeText={setNom}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              </View>

              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Adresse e-mail</Text>
                <View style={s.inputWrap}>
                  <Ionicons name="mail-outline" size={16} color={C.mutedFg} />
                  <TextInput
                    style={s.input}
                    placeholder="vous@exemple.com"
                    placeholderTextColor={C.mutedFg}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </View>
              </View>

              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Mot de passe</Text>
                <View style={s.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={16} color={C.mutedFg} />
                  <TextInput
                    style={s.input}
                    placeholder="8 caractères minimum"
                    placeholderTextColor={C.mutedFg}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPwd}
                    autoComplete="new-password"
                  />
                  <TouchableOpacity onPress={() => setShowPwd((p) => !p)} activeOpacity={0.7}>
                    <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={16} color={C.mutedFg} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[s.btn, (loading || !email || !password) && s.btnLoading]}
                onPress={handleSignUp}
                disabled={loading || !email || !password}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={C.primaryFg} size="small" />
                  : <Text style={s.btnTxt}>Créer mon compte</Text>
                }
              </TouchableOpacity>

              <View style={s.lienRow}>
                <Text style={s.lienTxt}>Déjà un compte ?</Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")} activeOpacity={0.7}>
                  <Text style={s.lien}> Se connecter</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={s.verifIcon}>
                <Ionicons name="mail-open-outline" size={28} color={C.accent} />
              </View>
              <Text style={s.titre}>Vérifiez votre e-mail</Text>
              <Text style={s.sous}>
                Un code à 6 chiffres a été envoyé à{"\n"}
                <Text style={{ fontWeight: "600", color: C.fg }}>{email}</Text>
              </Text>

              {erreur && (
                <View style={s.erreurBox}>
                  <Ionicons name="alert-circle-outline" size={15} color={C.red} />
                  <Text style={s.erreurTxt}>{erreur}</Text>
                </View>
              )}

              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Code de vérification</Text>
                <View style={[s.inputWrap, s.codeInput]}>
                  <TextInput
                    style={[s.input, s.codeTxt]}
                    placeholder="000000"
                    placeholderTextColor={C.border}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    textAlign="center"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[s.btn, loading && s.btnLoading]}
                onPress={handleVerification}
                disabled={loading || code.length < 6}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={C.primaryFg} size="small" />
                  : <Text style={s.btnTxt}>Vérifier</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={s.retourBtn}
                onPress={() => { setEtape("infos"); setErreur(null); setCode(""); }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={14} color={C.mutedFg} />
                <Text style={s.retourTxt}>Modifier l'e-mail</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  kav:  { flex: 1, justifyContent: "center", paddingHorizontal: 24, gap: 28 },

  hero:     { alignItems: "center", gap: 10 },
  logoWrap: { width: 64, height: 64, borderRadius: 18, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  appName:  { fontSize: 28, fontWeight: "700", color: C.fg, letterSpacing: -0.5 },
  baseline: { fontSize: 14, color: C.mutedFg },

  card:  { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 24, gap: 16 },
  titre: { fontSize: 20, fontWeight: "700", color: C.fg, letterSpacing: -0.3 },
  sous:  { fontSize: 13, color: C.mutedFg, marginTop: -8, lineHeight: 20 },

  erreurBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: C.r, padding: 12 },
  erreurTxt: { flex: 1, fontSize: 13, color: C.red },

  row:        { flexDirection: "row", gap: 10 },
  fieldWrap:  { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: C.fg },
  inputWrap:  { flexDirection: "row", alignItems: "center", backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, borderRadius: C.r, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  input:      { flex: 1, fontSize: 14, color: C.fg, padding: 0 },

  btn:        { backgroundColor: C.primary, borderRadius: C.r, paddingVertical: 14, alignItems: "center" },
  btnLoading: { opacity: 0.7 },
  btnTxt:     { color: C.primaryFg, fontSize: 15, fontWeight: "700" },

  lienRow:  { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  lienTxt:  { fontSize: 13, color: C.mutedFg },
  lien:     { fontSize: 13, color: C.accent, fontWeight: "600" },

  verifIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE", alignItems: "center", justifyContent: "center" },
  codeInput: { justifyContent: "center" },
  codeTxt:   { fontSize: 24, fontWeight: "700", letterSpacing: 8 },

  retourBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  retourTxt: { fontSize: 13, color: C.mutedFg },
});
