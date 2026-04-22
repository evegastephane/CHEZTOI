import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSignIn } from "@clerk/expo";
import { useRouter } from "expo-router";

const C = {
  bg:        "#FAFAFA",
  card:      "#FFFFFF",
  border:    "#E4E4E7",
  muted:     "#F4F4F5",
  mutedFg:   "#71717A",
  fg:        "#18181B",
  fgSub:     "#3F3F46",
  primary:   "#18181B",
  primaryFg: "#FAFAFA",
  accent:    "#208AEF",
  red:       "#EF4444",
  r:         10,
};

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [erreur,   setErreur]   = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setErreur(null);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
      }
    } catch (e: any) {
      const msg = e.errors?.[0]?.longMessage
        ?? e.errors?.[0]?.message
        ?? e.message
        ?? "Identifiants incorrects.";
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
        {/* Logo / titre */}
        <View style={s.hero}>
          <View style={s.logoWrap}>
            <Ionicons name="home" size={28} color={C.primaryFg} />
          </View>
          <Text style={s.appName}>CheZToi</Text>
          <Text style={s.baseline}>Trouvez votre prochain chez-vous</Text>
        </View>

        {/* Carte formulaire */}
        <View style={s.card}>
          <Text style={s.titre}>Connexion</Text>
          <Text style={s.sous}>Accédez à votre espace personnel</Text>

          {erreur && (
            <View style={s.erreurBox}>
              <Ionicons name="alert-circle-outline" size={15} color={C.red} />
              <Text style={s.erreurTxt}>{erreur}</Text>
            </View>
          )}

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
                placeholder="••••••••"
                placeholderTextColor={C.mutedFg}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPwd((p) => !p)} activeOpacity={0.7}>
                <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={16} color={C.mutedFg} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[s.btn, loading && s.btnLoading]}
            onPress={handleSignIn}
            disabled={!isLoaded || loading || !email || !password}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={C.primaryFg} size="small" />
              : <Text style={s.btnTxt}>Se connecter</Text>
            }
          </TouchableOpacity>

          <View style={s.lienRow}>
            <Text style={s.lienTxt}>Pas encore de compte ?</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")} activeOpacity={0.7}>
              <Text style={s.lien}> S'inscrire</Text>
            </TouchableOpacity>
          </View>
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
  sous:  { fontSize: 13, color: C.mutedFg, marginTop: -8 },

  erreurBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: C.r, padding: 12 },
  erreurTxt: { flex: 1, fontSize: 13, color: C.red },

  fieldWrap:  { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: C.fg },
  inputWrap:  { flexDirection: "row", alignItems: "center", backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, borderRadius: C.r, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  input:      { flex: 1, fontSize: 14, color: C.fg, padding: 0 },

  btn:        { backgroundColor: C.primary, borderRadius: C.r, paddingVertical: 14, alignItems: "center" },
  btnLoading: { opacity: 0.7 },
  btnTxt:     { color: C.primaryFg, fontSize: 15, fontWeight: "700" },

  lienRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  lienTxt: { fontSize: 13, color: C.mutedFg },
  lien:    { fontSize: 13, color: C.accent, fontWeight: "600" },
});
