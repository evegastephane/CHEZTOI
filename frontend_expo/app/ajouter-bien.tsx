import { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, Image, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/expo";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

import { C } from "@/constants/colors";
import { biensAPI } from "@/services/biens";

type TypeBien = "Location" | "Résidence";

const VILLES = [
  { nom: "Douala",      pays: "Cameroun" },
  { nom: "Yaoundé",     pays: "Cameroun" },
  { nom: "Dakar",       pays: "Sénégal" },
  { nom: "Abidjan",     pays: "Côte d'Ivoire" },
  { nom: "Casablanca",  pays: "Maroc" },
  { nom: "Marrakech",   pays: "Maroc" },
];

export default function AjouterBien() {
  const router    = useRouter();
  const { user }  = useUser();

  const [nom,         setNom]         = useState("");
  const [type,        setType]        = useState<TypeBien>("Location");
  const [villeIdx,    setVilleIdx]    = useState<number | null>(null);
  const [prix,        setPrix]        = useState("");
  const [chambres,    setChambres]    = useState("1");
  const [surface,     setSurface]     = useState("");
  const [description, setDescription] = useState("");
  const [photos,      setPhotos]      = useState<string[]>([]);
  const [loading,     setLoading]     = useState(false);

  const villeSelectionnee = villeIdx !== null ? VILLES[villeIdx] : null;

  const ajouterPhoto = async () => {
    if (photos.length >= 5) {
      Alert.alert("Maximum atteint", "Vous pouvez ajouter jusqu'à 5 photos.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Autorisez l'accès à vos photos dans les réglages.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 5 - photos.length,
      quality: 0.75,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
    }
  };

  const supprimerPhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  };

  const valider = (): boolean => {
    if (!nom.trim())             { Alert.alert("Champ requis", "Saisissez le nom du bien."); return false; }
    if (villeIdx === null)       { Alert.alert("Champ requis", "Sélectionnez une ville."); return false; }
    if (!prix || isNaN(+prix) || +prix <= 0) { Alert.alert("Champ requis", "Indiquez un prix valide."); return false; }
    if (photos.length === 0)     { Alert.alert("Photo requise", "Ajoutez au moins une photo."); return false; }
    return true;
  };

  const publier = async () => {
    if (!valider()) return;
    setLoading(true);
    try {
      // Lire chaque photo en base64
      const photosBase64 = await Promise.all(
        photos.map((uri) =>
          FileSystem.readAsStringAsync(uri, { encoding: "base64" })
        )
      );

      await biensAPI.creer({
        proprietaireClerkId: user?.id ?? "",
        titre:               nom.trim(),
        description:         description.trim(),
        prix:                parseInt(prix, 10),
        superficie:          parseInt(surface, 10) || 0,
        nombreChambres:      parseInt(chambres, 10) || 1,
        ville:               villeSelectionnee!.nom,
        pays:                villeSelectionnee!.pays,
        type,
        photosBase64,
      });

      router.back();
    } catch {
      Alert.alert("Erreur", "Impossible de publier le bien. Vérifiez votre connexion et que le serveur est démarré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="close" size={18} color={C.fg} />
        </TouchableOpacity>
        <Text style={s.headerTitre}>Publier un bien</Text>
        <View style={{ width: 34 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Photos ── */}
          <View style={s.section}>
            <Text style={s.sectionTitre}>Photos</Text>
            <Text style={s.sectionDesc}>Ajoutez jusqu'à 5 photos de votre bien.</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.photosRow}>
              {/* Bouton ajout */}
              <TouchableOpacity style={s.photoAdd} onPress={ajouterPhoto} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={24} color={C.mutedFg} />
                <Text style={s.photoAddTxt}>{photos.length}/5</Text>
              </TouchableOpacity>

              {/* Miniatures */}
              {photos.map((uri) => (
                <View key={uri} style={s.photoWrap}>
                  <Image source={{ uri }} style={s.photoThumb} resizeMode="cover" />
                  <TouchableOpacity
                    style={s.photoDelBtn}
                    onPress={() => supprimerPhoto(uri)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ── Informations générales ── */}
          <View style={s.section}>
            <Text style={s.sectionTitre}>Informations générales</Text>

            <View style={s.card}>
              {/* Nom */}
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Nom du bien</Text>
                <TextInput
                  style={s.input}
                  placeholder="ex. Villa Bonamoussadi"
                  placeholderTextColor={C.mutedFg}
                  value={nom}
                  onChangeText={setNom}
                />
              </View>

              <View style={s.sep} />

              {/* Type */}
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Type</Text>
                <View style={s.typeRow}>
                  {(["Location", "Résidence"] as TypeBien[]).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[s.typeBtn, type === t && s.typeBtnActif]}
                      onPress={() => setType(t)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.typeBtnTxt, type === t && s.typeBtnTxtActif]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.sep} />

              {/* Ville */}
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Ville</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {VILLES.map((v, i) => (
                    <TouchableOpacity
                      key={v.nom}
                      style={[s.villeChip, villeIdx === i && s.villeChipActif]}
                      onPress={() => setVilleIdx(i)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.villeChipTxt, villeIdx === i && s.villeChipTxtActif]}>{v.nom}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* ── Caractéristiques ── */}
          <View style={s.section}>
            <Text style={s.sectionTitre}>Caractéristiques</Text>

            <View style={s.card}>
              {/* Prix */}
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Prix par nuit (€)</Text>
                <TextInput
                  style={s.input}
                  placeholder="ex. 45"
                  placeholderTextColor={C.mutedFg}
                  value={prix}
                  onChangeText={setPrix}
                  keyboardType="numeric"
                />
              </View>

              <View style={s.sep} />

              {/* Chambres */}
              <View style={[s.fieldWrap, { flexDirection: "row", alignItems: "center" }]}>
                <Text style={[s.fieldLabel, { flex: 1, marginBottom: 0 }]}>Chambres</Text>
                <View style={s.counterRow}>
                  <TouchableOpacity
                    style={s.counterBtn}
                    onPress={() => setChambres((p) => String(Math.max(1, parseInt(p) - 1)))}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={16} color={C.fg} />
                  </TouchableOpacity>
                  <Text style={s.counterVal}>{chambres}</Text>
                  <TouchableOpacity
                    style={s.counterBtn}
                    onPress={() => setChambres((p) => String(Math.min(10, parseInt(p) + 1)))}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={16} color={C.fg} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.sep} />

              {/* Surface */}
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Surface (m²)</Text>
                <TextInput
                  style={s.input}
                  placeholder="ex. 80"
                  placeholderTextColor={C.mutedFg}
                  value={surface}
                  onChangeText={setSurface}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* ── Description ── */}
          <View style={s.section}>
            <Text style={s.sectionTitre}>Description</Text>
            <View style={s.card}>
              <TextInput
                style={[s.input, s.textarea]}
                placeholder="Décrivez votre bien : emplacement, équipements, points forts…"
                placeholderTextColor={C.mutedFg}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* ── Bouton publier ── */}
          <TouchableOpacity
            style={[s.publishBtn, loading && { opacity: 0.7 }]}
            onPress={publier}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={C.primaryFg} />
              : <>
                  <Ionicons name="cloud-upload-outline" size={18} color={C.primaryFg} />
                  <Text style={s.publishBtnTxt}>Publier le bien</Text>
                </>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  closeBtn:    { width: 34, height: 34, borderRadius: 10, backgroundColor: C.muted, alignItems: "center", justifyContent: "center" },
  headerTitre: { fontSize: 16, fontWeight: "700", color: C.fg },

  scroll: { padding: 20, gap: 20, paddingBottom: 48 },

  section:      { gap: 10 },
  sectionTitre: { fontSize: 13, fontWeight: "700", color: C.fg },
  sectionDesc:  { fontSize: 12, color: C.mutedFg, marginTop: -6 },

  // Photos
  photosRow: { gap: 10, paddingVertical: 4 },
  photoAdd:  {
    width: 90, height: 90, borderRadius: 12,
    backgroundColor: C.muted, borderWidth: 1.5, borderColor: C.border,
    borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4,
  },
  photoAddTxt:  { fontSize: 11, color: C.mutedFg, fontWeight: "500" },
  photoWrap:    { width: 90, height: 90, borderRadius: 12, overflow: "hidden" },
  photoThumb:   { width: "100%", height: "100%" },
  photoDelBtn:  {
    position: "absolute", top: 4, right: 4,
    backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 10,
  },

  // Card + champs
  card:      { backgroundColor: C.card, borderRadius: C.r, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  sep:       { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: 16 },
  fieldWrap: { paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  fieldLabel:{ fontSize: 11, fontWeight: "600", color: C.mutedFg, textTransform: "uppercase", letterSpacing: 0.4 },
  input:     { fontSize: 15, color: C.fg, padding: 0 },
  textarea:  { minHeight: 100, paddingTop: 4, padding: 16 },

  // Type buttons
  typeRow:       { flexDirection: "row", gap: 8 },
  typeBtn:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.muted },
  typeBtnActif:  { backgroundColor: C.primary, borderColor: C.primary },
  typeBtnTxt:    { fontSize: 13, fontWeight: "600", color: C.mutedFg },
  typeBtnTxtActif: { color: C.primaryFg },

  // Ville chips
  villeChip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.muted },
  villeChipActif:  { backgroundColor: C.primary, borderColor: C.primary },
  villeChipTxt:    { fontSize: 13, fontWeight: "500", color: C.mutedFg },
  villeChipTxtActif: { color: C.primaryFg },

  // Compteur
  counterRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  counterBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  counterVal: { fontSize: 16, fontWeight: "700", color: C.fg, minWidth: 24, textAlign: "center" },

  // Bouton publier
  publishBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: C.primary, borderRadius: C.r, paddingVertical: 16, marginTop: 4 },
  publishBtnTxt: { fontSize: 15, fontWeight: "700", color: C.primaryFg },
});