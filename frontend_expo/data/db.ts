export type Bien = {
  id:          string;
  nom:         string;
  ville:       string;
  pays:        string;
  type:        "Location" | "Résidence";
  prix:        number;
  chambres:    number;
  surface:     number;
  note:        number;
  avis:        number;
  description: string;
  couleur:     string;
  image:       string;
  disponible:  boolean;
};

const IMG = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;

export const BIENS_DB: Bien[] = [
  // ── Douala ─────────────────────────────────────────────────────────────────
  {
    id:"d1", nom:"Villa Bonamoussadi", ville:"Douala", pays:"Cameroun", type:"Résidence",
    prix:45, chambres:3, surface:120, note:4.7, avis:23,
    description:"Belle villa dans le quartier calme de Bonamoussadi, avec jardin privatif et parking.",
    couleur:"#3B82F6", disponible:true,
    image: IMG("1600596542815-ffad4c1539a9"),
  },
  {
    id:"d2", nom:"Appartement Akwa", ville:"Douala", pays:"Cameroun", type:"Location",
    prix:30, chambres:2, surface:75, note:4.5, avis:14,
    description:"Appartement moderne au cœur du quartier Akwa, à deux pas des commerces.",
    couleur:"#10B981", disponible:true,
    image: IMG("1522708323590-d24dbb6b0267"),
  },
  {
    id:"d3", nom:"Studio Bali", ville:"Douala", pays:"Cameroun", type:"Location",
    prix:20, chambres:1, surface:40, note:4.3, avis:8,
    description:"Studio confortable avec toutes les commodités pour un séjour optimal.",
    couleur:"#F59E0B", disponible:true,
    image: IMG("1502672260266-1c1ef2d93688"),
  },
  {
    id:"d4", nom:"Maison Makepe", ville:"Douala", pays:"Cameroun", type:"Résidence",
    prix:60, chambres:4, surface:180, note:4.9, avis:31,
    description:"Grande maison familiale à Makepe avec piscine et espace barbecue.",
    couleur:"#8B5CF6", disponible:false,
    image: IMG("1564013799919-ab600027ffc6"),
  },
  {
    id:"d5", nom:"Résidence Kotto", ville:"Douala", pays:"Cameroun", type:"Résidence",
    prix:35, chambres:2, surface:90, note:4.6, avis:19,
    description:"Résidence sécurisée avec gardien 24h/24 et salle de sport.",
    couleur:"#EF4444", disponible:true,
    image: IMG("1512917774080-9991f1c4c750"),
  },
  {
    id:"d6", nom:"Duplex Bonapriso", ville:"Douala", pays:"Cameroun", type:"Location",
    prix:55, chambres:3, surface:130, note:4.8, avis:26,
    description:"Luxueux duplex dans le quartier prisé de Bonapriso.",
    couleur:"#06B6D4", disponible:true,
    image: IMG("1583608205776-bfd35f0d9f83"),
  },

  // ── Yaoundé ────────────────────────────────────────────────────────────────
  {
    id:"y1", nom:"Appartement Bastos", ville:"Yaoundé", pays:"Cameroun", type:"Location",
    prix:40, chambres:2, surface:80, note:4.8, avis:27,
    description:"Appartement haut de gamme dans le quartier diplomatique de Bastos.",
    couleur:"#3B82F6", disponible:true,
    image: IMG("1545324418-cc1a3fa10c00"),
  },
  {
    id:"y2", nom:"Villa Omnisport", ville:"Yaoundé", pays:"Cameroun", type:"Résidence",
    prix:55, chambres:3, surface:140, note:4.6, avis:15,
    description:"Villa spacieuse à quelques minutes du stade omnisport.",
    couleur:"#10B981", disponible:true,
    image: IMG("1568605114967-8130f3a36994"),
  },
  {
    id:"y3", nom:"Studio Mvan", ville:"Yaoundé", pays:"Cameroun", type:"Location",
    prix:18, chambres:1, surface:35, note:4.2, avis:9,
    description:"Studio économique et fonctionnel, idéal pour un court séjour.",
    couleur:"#F97316", disponible:true,
    image: IMG("1540518614846-7eded433c457"),
  },
  {
    id:"y4", nom:"Penthouse Centre", ville:"Yaoundé", pays:"Cameroun", type:"Résidence",
    prix:80, chambres:4, surface:200, note:4.9, avis:38,
    description:"Penthouse avec terrasse panoramique au centre-ville de Yaoundé.",
    couleur:"#8B5CF6", disponible:true,
    image: IMG("1614621746489-d85f81dce23b"),
  },

  // ── Dakar ──────────────────────────────────────────────────────────────────
  {
    id:"dk1", nom:"Villa Azur", ville:"Dakar", pays:"Sénégal", type:"Location",
    prix:85, chambres:4, surface:200, note:4.8, avis:42,
    description:"Villa de prestige avec vue imprenable sur l'Atlantique.",
    couleur:"#3B82F6", disponible:true,
    image: IMG("1613977257363-707ba9348227"),
  },
  {
    id:"dk2", nom:"Appartement Plateau", ville:"Dakar", pays:"Sénégal", type:"Location",
    prix:50, chambres:2, surface:90, note:4.6, avis:28,
    description:"Appartement moderne en plein cœur du Plateau dakarois.",
    couleur:"#10B981", disponible:true,
    image: IMG("1578683010236-d716f9a3f461"),
  },
  {
    id:"dk3", nom:"Résidence Almadies", ville:"Dakar", pays:"Sénégal", type:"Résidence",
    prix:120, chambres:5, surface:300, note:4.9, avis:56,
    description:"Résidence de prestige dans le quartier des Almadies, accès plage privée.",
    couleur:"#8B5CF6", disponible:true,
    image: IMG("1605276374104-dee2a0ed3cd6"),
  },
  {
    id:"dk4", nom:"Studio Mermoz", ville:"Dakar", pays:"Sénégal", type:"Location",
    prix:35, chambres:1, surface:50, note:4.4, avis:17,
    description:"Studio lumineux dans le quartier résidentiel de Mermoz.",
    couleur:"#EF4444", disponible:false,
    image: IMG("1554995207-c18c203602cb"),
  },

  // ── Abidjan ────────────────────────────────────────────────────────────────
  {
    id:"ab1", nom:"Appartement Plateau", ville:"Abidjan", pays:"Côte d'Ivoire", type:"Location",
    prix:60, chambres:2, surface:85, note:4.9, avis:33,
    description:"Superbe appartement au cœur du Plateau, proche de toutes commodités.",
    couleur:"#F59E0B", disponible:true,
    image: IMG("1493809842364-78817add7ffb"),
  },
  {
    id:"ab2", nom:"Villa Cocody", ville:"Abidjan", pays:"Côte d'Ivoire", type:"Résidence",
    prix:90, chambres:4, surface:220, note:4.7, avis:21,
    description:"Villa avec jardin tropical et piscine dans le quartier résidentiel de Cocody.",
    couleur:"#EF4444", disponible:true,
    image: IMG("1560448204-e02f11c3d0e2"),
  },
  {
    id:"ab3", nom:"Studio Marcory", ville:"Abidjan", pays:"Côte d'Ivoire", type:"Location",
    prix:25, chambres:1, surface:45, note:4.3, avis:11,
    description:"Studio pratique et bien situé à Marcory, idéal pour professionnels.",
    couleur:"#3B82F6", disponible:false,
    image: IMG("1536376072261-38c75010e6c9"),
  },
  {
    id:"ab4", nom:"Duplex Deux Plateaux", ville:"Abidjan", pays:"Côte d'Ivoire", type:"Résidence",
    prix:75, chambres:3, surface:150, note:4.8, avis:29,
    description:"Duplex moderne aux Deux Plateaux avec vue dégagée.",
    couleur:"#06B6D4", disponible:true,
    image: IMG("1567767292278-a0f0291b5b9e"),
  },

  // ── Casablanca ─────────────────────────────────────────────────────────────
  {
    id:"ca1", nom:"Appartement Maarif", ville:"Casablanca", pays:"Maroc", type:"Location",
    prix:70, chambres:3, surface:110, note:4.7, avis:38,
    description:"Bel appartement rénové dans le très prisé quartier Maarif.",
    couleur:"#10B981", disponible:true,
    image: IMG("1551882547-ff40c4a49af3"),
  },
  {
    id:"ca2", nom:"Villa Anfa", ville:"Casablanca", pays:"Maroc", type:"Résidence",
    prix:145, chambres:5, surface:350, note:4.9, avis:64,
    description:"Villa exceptionnelle dans le quartier résidentiel d'Anfa avec piscine et tennis.",
    couleur:"#8B5CF6", disponible:true,
    image: IMG("1580587771525-78b9dba3b914"),
  },
  {
    id:"ca3", nom:"Studio Guynemer", ville:"Casablanca", pays:"Maroc", type:"Location",
    prix:40, chambres:1, surface:48, note:4.5, avis:20,
    description:"Studio élégant dans le centre-ville, parfait pour les voyageurs d'affaires.",
    couleur:"#F59E0B", disponible:true,
    image: IMG("1553444836-bc6c8d340d56"),
  },

  // ── Marrakech ──────────────────────────────────────────────────────────────
  {
    id:"mk1", nom:"Riad Médina", ville:"Marrakech", pays:"Maroc", type:"Résidence",
    prix:100, chambres:4, surface:180, note:4.8, avis:47,
    description:"Authentique riad avec patio et fontaine au cœur de la médina historique.",
    couleur:"#F59E0B", disponible:true,
    image: IMG("1539037116277-4db20889f2d4"),
  },
  {
    id:"mk2", nom:"Appartement Guéliz", ville:"Marrakech", pays:"Maroc", type:"Location",
    prix:55, chambres:2, surface:80, note:4.5, avis:22,
    description:"Appartement moderne dans le quartier vivant de Guéliz.",
    couleur:"#EF4444", disponible:true,
    image: IMG("1561501900-3701fa6a0864"),
  },
  {
    id:"mk3", nom:"Villa Palmeraie", ville:"Marrakech", pays:"Maroc", type:"Résidence",
    prix:200, chambres:6, surface:500, note:4.9, avis:83,
    description:"Villa de standing dans la Palmeraie avec piscine chauffée et personnel inclus.",
    couleur:"#3B82F6", disponible:true,
    image: IMG("1599809275671-b5942cabc7a2"),
  },
];

export function getBiensByVille(ville: string): Bien[] {
  return BIENS_DB.filter((b) => b.ville.toLowerCase() === ville.toLowerCase());
}

export function getBienById(id: string): Bien | undefined {
  return BIENS_DB.find((b) => b.id === id);
}

export const VILLES_UNIQUES = [...new Set(BIENS_DB.map((b) => b.ville))];
