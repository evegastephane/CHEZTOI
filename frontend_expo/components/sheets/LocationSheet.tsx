import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SheetBase, { C } from "./SheetBase";

const VILLES = [
  { nom: "Dakar",      pays: "Sénégal"  },
  { nom: "Saly",       pays: "Sénégal"  },
  { nom: "Saint-Louis",pays: "Sénégal"  },
  { nom: "Abidjan",    pays: "Côte d'Ivoire" },
  { nom: "Casablanca", pays: "Maroc"    },
  { nom: "Marrakech",  pays: "Maroc"    },
  { nom: "Tunis",      pays: "Tunisie"  },
  { nom: "Alger",      pays: "Algérie"  },
  { nom: "Douala",     pays: "Cameroun" },
  { nom: "Libreville", pays: "Gabon"    },
  { nom: "Lomé",       pays: "Togo"     },
  { nom: "Accra",      pays: "Ghana"    },
  { nom: "Lagos",      pays: "Nigeria"  },
  { nom: "Bamako",     pays: "Mali"     },
];

type Props = {
  visible:  boolean;
  onClose:  () => void;
  onSelect: (lieu: string) => void;
};

export default function LocationSheet({ visible, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");

  const filtrees = VILLES.filter(
    (v) =>
      query.length === 0 ||
      v.nom.toLowerCase().includes(query.toLowerCase()) ||
      v.pays.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (ville: { nom: string; pays: string }) => {
    onSelect(`${ville.nom}, ${ville.pays}`);
    setQuery("");
    onClose();
  };

  return (
    <SheetBase visible={visible} onClose={onClose} titre="Choisir un lieu" hauteur={0.72}>
      {/* Input de recherche */}
      <View style={s.inputWrap}>
        <Ionicons name="search-outline" size={15} color={C.mutedFg} />
        <TextInput
          style={s.input}
          placeholder="Ville, quartier…"
          placeholderTextColor={C.mutedFg}
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCapitalize="words"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={15} color={C.mutedFg} />
          </TouchableOpacity>
        )}
      </View>

      {/* Liste des villes */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {filtrees.map((v) => (
          <TouchableOpacity
            key={v.nom}
            style={s.item}
            onPress={() => handleSelect(v)}
            activeOpacity={0.7}
          >
            <View style={s.iconWrap}>
              <Ionicons name="location-outline" size={16} color={C.mutedFg} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.itemNom}>{v.nom}</Text>
              <Text style={s.itemPays}>{v.pays}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={C.border} />
          </TouchableOpacity>
        ))}
        {filtrees.length === 0 && (
          <Text style={s.vide}>Aucune ville trouvée</Text>
        )}
      </ScrollView>
    </SheetBase>
  );
}

const s = StyleSheet.create({
  inputWrap: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: C.muted,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    C.r,
    paddingHorizontal: 12,
    paddingVertical:   10,
    gap:             8,
    marginBottom:    14,
  },
  input: {
    flex:     1,
    fontSize: 14,
    color:    C.fg,
    padding:  0,
  },
  item: {
    flexDirection:  "row",
    alignItems:     "center",
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
    gap: 12,
  },
  iconWrap: {
    width:           34,
    height:          34,
    borderRadius:    C.r,
    backgroundColor: C.muted,
    borderWidth:     1,
    borderColor:     C.border,
    alignItems:      "center",
    justifyContent:  "center",
  },
  itemNom:  { fontSize: 14, fontWeight: "600", color: C.fg },
  itemPays: { fontSize: 12, color: C.mutedFg, marginTop: 1 },
  vide:     { textAlign: "center", color: C.mutedFg, fontSize: 13, marginTop: 32 },
});