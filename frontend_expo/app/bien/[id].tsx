import { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, ScrollView, Dimensions, NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getBienById, type Bien } from "@/data/db";
import { C } from "@/constants/colors";

const { width: W } = Dimensions.get("window");

// ─── Galerie d'images ─────────────────────────────────────────────────────────
function getImages(bien: Bien): string[] {
  return [
    bien.image,
    `https://picsum.photos/seed/${bien.id}-int/800/500`,
    `https://picsum.photos/seed/${bien.id}-ext/800/500`,
  ];
}

// ─── Commodités ───────────────────────────────────────────────────────────────
type Commo = { label: string; icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap };

function getCommodites(bien: Bien): Commo[] {
  const list: Commo[] = [
    { label: "WiFi",          icon: "wifi-outline" },
    { label: "Climatisation", icon: "snow-outline" },
    { label: "Cuisine",       icon: "restaurant-outline" },
    { label: "Télévision",    icon: "tv-outline" },
  ];
  if (bien.prix >= 35) list.push({ label: "Parking",   icon: "car-outline" });
  if (bien.prix >= 55) list.push({ label: "Sécurité",  icon: "shield-checkmark-outline" });
  if (bien.type === "Résidence") list.push({ label: "Jardin", icon: "leaf-outline" });
  if (bien.prix >= 70) list.push({ label: "Piscine",   icon: "water-outline" });
  if (bien.prix >= 100) list.push({ label: "Terrasse", icon: "sunny-outline" });
  return list;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BienDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bien = getBienById(id ?? "");

  const [imgIndex,    setImgIndex]    = useState(0);
  const [descOuverte, setDescOuverte] = useState(false);

  if (!bien) {
    return (
      <SafeAreaView style={s.root}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#18181B" />
        </TouchableOpacity>
        <View style={s.center}>
          <Text style={s.sectionTitre}>Bien introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const images    = getImages(bien);
  const commodites = getCommodites(bien);
  const capacite  = bien.chambres * 2;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    setImgIndex(idx);
  };

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── Galerie ──────────────────────────────────────────────────── */}
        <View style={s.galerie}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {images.map((uri, i) => (
              <Image key={i} source={{ uri }} style={s.galerieImg} resizeMode="cover" />
            ))}
          </ScrollView>

          {/* Dots */}
          <View style={s.dots}>
            {images.map((_, i) => (
              <View key={i} style={[s.dot, i === imgIndex && s.dotActif]} />
            ))}
          </View>

          {/* Bouton retour */}
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color="#FFF" />
          </TouchableOpacity>

          {/* Badge dispo */}
          {!bien.disponible && (
            <View style={s.indispoBadge}>
              <Text style={s.indispoTxt}>Indisponible</Text>
            </View>
          )}
        </View>

        {/* ── Fiche ────────────────────────────────────────────────────── */}
        <View style={s.fiche}>

          {/* Nom + badge */}
          <View style={s.nomRow}>
            <Text style={s.nom} numberOfLines={2}>{bien.nom}</Text>
            <View style={[s.badge, bien.type === "Résidence" && s.badgeAlt]}>
              <Text style={[s.badgeTxt, bien.type === "Résidence" && s.badgeTxtAlt]}>
                {bien.type}
              </Text>
            </View>
          </View>

          {/* Ville */}
          <View style={s.villeRow}>
            <Ionicons name="location-outline" size={13} color={C.mutedFg} />
            <Text style={s.ville}>{bien.ville}, {bien.pays}</Text>
          </View>

          {/* Note */}
          <View style={s.noteRow}>
            {[1,2,3,4,5].map((i) => (
              <Ionicons key={i} name={i <= Math.round(bien.note) ? "star" : "star-outline"} size={14} color={C.gold} />
            ))}
            <Text style={s.noteTxt}>{bien.note} · {bien.avis} avis</Text>
          </View>

          <View style={s.sep} />

          {/* ── Stats ──────────────────────────────────────────────────── */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <View style={s.statIcon}>
                <Ionicons name="bed-outline" size={20} color={C.fg} />
              </View>
              <Text style={s.statVal}>{bien.chambres}</Text>
              <Text style={s.statLabel}>Chambre{bien.chambres > 1 ? "s" : ""}</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <View style={s.statIcon}>
                <Ionicons name="expand-outline" size={20} color={C.fg} />
              </View>
              <Text style={s.statVal}>{bien.surface} m²</Text>
              <Text style={s.statLabel}>Surface</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <View style={s.statIcon}>
                <Ionicons name="people-outline" size={20} color={C.fg} />
              </View>
              <Text style={s.statVal}>{capacite}</Text>
              <Text style={s.statLabel}>Personnes</Text>
            </View>
          </View>

          <View style={s.sep} />

          {/* ── Commodités ─────────────────────────────────────────────── */}
          <Text style={s.sectionTitre}>Commodités</Text>
          <View style={s.commoGrid}>
            {commodites.map((c) => (
              <View key={c.label} style={s.commoItem}>
                <View style={s.commoIcon}>
                  <Ionicons name={c.icon} size={18} color={C.fg} />
                </View>
                <Text style={s.commoLabel}>{c.label}</Text>
              </View>
            ))}
          </View>

          <View style={s.sep} />

          {/* ── Description ────────────────────────────────────────────── */}
          <Text style={s.sectionTitre}>Description</Text>
          <Text style={s.desc} numberOfLines={descOuverte ? undefined : 3}>
            {bien.description}
          </Text>
          <TouchableOpacity onPress={() => setDescOuverte((p) => !p)} activeOpacity={0.7}>
            <Text style={s.descLien}>
              {descOuverte ? "Voir moins" : "Lire la suite"}
              {"  "}
              <Ionicons name={descOuverte ? "chevron-up" : "chevron-down"} size={12} color={C.accent} />
            </Text>
          </TouchableOpacity>

          <View style={s.sep} />

          {/* ── Localisation ───────────────────────────────────────────── */}
          <Text style={s.sectionTitre}>Localisation</Text>
          <View style={s.mapPlaceholder}>
            {/* Grille façon carte */}
            {[0,1,2,3,4].map((row) => (
              <View key={row} style={s.mapRow}>
                {[0,1,2,3,4,5].map((col) => (
                  <View key={col} style={s.mapCell} />
                ))}
              </View>
            ))}
            {/* Pin central */}
            <View style={s.mapPin}>
              <View style={s.mapPinBubble}>
                <Ionicons name="location" size={22} color="#FFF" />
              </View>
              <View style={s.mapPinShadow} />
            </View>
            {/* Label */}
            <View style={s.mapLabel}>
              <Ionicons name="location-outline" size={12} color={C.mutedFg} />
              <Text style={s.mapLabelTxt}>{bien.ville}, {bien.pays}</Text>
            </View>
          </View>

          <View style={{ height: 110 }} />
        </View>
      </ScrollView>

      {/* ── Footer sticky ──────────────────────────────────────────────── */}
      <View style={s.footer}>
        <View>
          <Text style={s.prix}>{bien.prix} €<Text style={s.nuit}> / nuit</Text></Text>
          <View style={s.noteRowSmall}>
            <Ionicons name="star" size={11} color={C.gold} />
            <Text style={s.noteSmallTxt}>{bien.note} ({bien.avis} avis)</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[s.cta, !bien.disponible && s.ctaOff]}
          disabled={!bien.disponible}
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: "/reservation", params: { bienId: bien.id } })}
        >
          <Text style={s.ctaTxt}>{bien.disponible ? "Réserver" : "Indisponible"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Galerie
  galerie:     { width: W, height: 300, backgroundColor: C.muted },
  galerieImg:  { width: W, height: 300 },
  dots:        { position: "absolute", bottom: 14, alignSelf: "center", flexDirection: "row", gap: 6 },
  dot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActif:    { width: 18, backgroundColor: "#FFF" },
  backBtn:     { position: "absolute", top: 52, left: 16, width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  indispoBadge:{ position: "absolute", top: 52, right: 16, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  indispoTxt:  { color: "#FFF", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },

  // Fiche
  fiche: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, padding: 24, gap: 16 },

  nomRow:      { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  nom:         { flex: 1, fontSize: 22, fontWeight: "700", color: C.fg, letterSpacing: -0.4 },
  badge:       { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border },
  badgeAlt:    { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  badgeTxt:    { fontSize: 11, fontWeight: "600", color: C.fgSub },
  badgeTxtAlt: { color: "#1D4ED8" },

  villeRow:    { flexDirection: "row", alignItems: "center", gap: 5 },
  ville:       { fontSize: 13, color: C.mutedFg },

  noteRow:     { flexDirection: "row", alignItems: "center", gap: 4 },
  noteTxt:     { fontSize: 13, color: C.fgSub, marginLeft: 4 },

  sep:         { height: StyleSheet.hairlineWidth, backgroundColor: C.border },

  // Stats
  statsRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  statItem:    { alignItems: "center", gap: 6, flex: 1 },
  statIcon:    { width: 44, height: 44, borderRadius: 12, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  statVal:     { fontSize: 15, fontWeight: "700", color: C.fg },
  statLabel:   { fontSize: 11, color: C.mutedFg },
  statDivider: { width: StyleSheet.hairlineWidth, height: 40, backgroundColor: C.border },

  // Commodités
  sectionTitre: { fontSize: 15, fontWeight: "700", color: C.fg, letterSpacing: -0.2 },
  commoGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  commoItem:    { width: "30%", alignItems: "center", gap: 6, paddingVertical: 12, backgroundColor: C.muted, borderRadius: C.r, borderWidth: 1, borderColor: C.border },
  commoIcon:    { width: 36, height: 36, borderRadius: 10, backgroundColor: C.card, alignItems: "center", justifyContent: "center" },
  commoLabel:   { fontSize: 11, fontWeight: "500", color: C.fgSub, textAlign: "center" },

  // Description
  desc:        { fontSize: 14, color: C.fgSub, lineHeight: 22 },
  descLien:    { fontSize: 13, color: C.accent, fontWeight: "600", marginTop: 4 },

  // Map placeholder
  mapPlaceholder: { height: 180, borderRadius: 16, backgroundColor: "#E8F0E8", overflow: "hidden", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  mapRow:         { flexDirection: "row", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  mapCell:        { flex: 1, borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(0,0,0,0.07)" },
  mapPin:         { alignItems: "center" },
  mapPinBubble:   { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6 },
  mapPinShadow:   { width: 12, height: 6, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.15)", marginTop: 2 },
  mapLabel:       { position: "absolute", bottom: 12, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  mapLabelTxt:    { fontSize: 12, fontWeight: "600", color: C.fg },

  // Footer
  footer:       { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 32, backgroundColor: C.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
  prix:         { fontSize: 22, fontWeight: "700", color: C.fg },
  nuit:         { fontSize: 13, fontWeight: "400", color: C.mutedFg },
  noteRowSmall: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  noteSmallTxt: { fontSize: 11, color: C.mutedFg },
  cta:          { backgroundColor: C.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  ctaOff:       { backgroundColor: "#A1A1AA" },
  ctaTxt:       { color: C.primaryFg, fontSize: 15, fontWeight: "700" },
});
