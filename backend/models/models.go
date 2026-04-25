package models

import (
	"time"

	"github.com/google/uuid"
)

// =====================
// UTILISATEUR
// =====================
type Utilisateur struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Nom          string    `gorm:"size:100;not null"`
	Email        string    `gorm:"size:150;unique"`
	Telephone    string    `gorm:"size:20;unique;not null"`
	PasswordHash string    `gorm:"not null"`
	Role         string    `gorm:"size:20;not null"`
	Statut       string    `gorm:"size:20;default:ACTIF"`
	CreatedAt    time.Time
}

// =====================
// BIEN
// =====================
type Bien struct {
	ID                  uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ProprietaireID      *uuid.UUID `gorm:"type:uuid"`
	ProprietaireClerkID string     `gorm:"size:128;index"`
	AgentID             *uuid.UUID `gorm:"type:uuid"`
	Titre               string     `gorm:"size:200;not null"`
	Description         string
	Prix                int     `gorm:"not null"`
	Superficie          float64
	NombreChambres      int     `gorm:"default:1"`
	Note                float64 `gorm:"default:0"`
	NombreAvis          int     `gorm:"default:0"`
	Ville               string  `gorm:"size:100;not null"`
	Pays                string  `gorm:"size:100"`
	Quartier            string  `gorm:"size:100"`
	Type                string  `gorm:"size:30"`
	Statut              string  `gorm:"size:20;default:DISPONIBLE"`
	Latitude            float64
	Longitude           float64
	ModeAutonome        bool    `gorm:"default:false"`
	CreatedAt           time.Time
	Photos              []Photo `gorm:"foreignKey:BienID"`
}

// =====================
// PHOTO
// =====================
type Photo struct {
	ID     uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	BienID uuid.UUID `gorm:"type:uuid;not null"`
	URL    string    `gorm:"not null"`
	Ordre  int       `gorm:"default:0"`
}

// =====================
// VISITE
// =====================
type Visite struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	BienID      uuid.UUID `gorm:"type:uuid;not null"`
	ClientID    uuid.UUID `gorm:"type:uuid;not null"`
	AgentID     uuid.UUID `gorm:"type:uuid;not null"`
	DateVisite  time.Time `gorm:"not null"`
	HeureVisite string    `gorm:"size:10;not null"`
	Frais       int       `gorm:"not null"`
	Statut      string    `gorm:"size:20;default:EN_ATTENTE"`
	CreatedAt   time.Time
}

// =====================
// PAIEMENT
// =====================
type Paiement struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ClientID  uuid.UUID `gorm:"type:uuid;not null"`
	BienID    uuid.UUID `gorm:"type:uuid;not null"`
	Montant   int       `gorm:"not null"`
	Type      string    `gorm:"size:30"`
	Statut    string    `gorm:"size:20;default:EN_ATTENTE"`
	Reference string    `gorm:"size:100;unique"`
	Moyen     string    `gorm:"size:30"`
	CreatedAt time.Time
}

// =====================
// CONTRAT
// =====================
type Contrat struct {
	ID             uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	BienID         uuid.UUID `gorm:"type:uuid;not null"`
	ClientID       uuid.UUID `gorm:"type:uuid;not null"`
	AgentID        uuid.UUID `gorm:"type:uuid;not null"`
	ProprietaireID uuid.UUID `gorm:"type:uuid;not null"`
	DateDebut      time.Time `gorm:"not null"`
	Loyer          int       `gorm:"not null"`
	Caution        int       `gorm:"not null"`
	FraisAgence    int       `gorm:"not null"`
	Statut         string    `gorm:"size:20;default:ACTIF"`
	CreatedAt      time.Time
}

// =====================
// MESSAGE
// =====================
type Message struct {
	ID             uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ExpediteurID   uuid.UUID `gorm:"type:uuid;not null"`
	DestinataireID uuid.UUID `gorm:"type:uuid;not null"`
	BienID         uuid.UUID `gorm:"type:uuid"`
	Contenu        string    `gorm:"not null"`
	Lu             bool      `gorm:"default:false"`
	CreatedAt      time.Time
}

// =====================
// NOTIFICATION
// =====================
type Notification struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UtilisateurID uuid.UUID `gorm:"type:uuid;not null"`
	Titre         string    `gorm:"size:200;not null"`
	Message       string    `gorm:"not null"`
	Type          string    `gorm:"size:30"`
	Lu            bool      `gorm:"default:false"`
	CreatedAt     time.Time
}

// =====================
// DOCUMENT KYC
// =====================
type DocumentKYC struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UtilisateurID uuid.UUID `gorm:"type:uuid;not null"`
	Type          string    `gorm:"size:30"`
	URL           string    `gorm:"not null"`
	Statut        string    `gorm:"size:20;default:EN_ATTENTE"`
	MotifRejet    string
	CreatedAt     time.Time
}

// =====================
// REVENU PROPRIETAIRE
// =====================
type Revenu struct {
	ID                  uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ProprietaireClerkID string     `gorm:"size:128;index;not null"`
	BienID              *uuid.UUID `gorm:"type:uuid"`
	Montant             int        `gorm:"not null"`
	Type                string     `gorm:"size:20;default:LOCATION"` // LOCATION | RETRAIT
	Description         string     `gorm:"size:200"`
	CreatedAt           time.Time
}
