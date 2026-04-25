package handlers

import (
	"backend/config"
	"backend/models"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

// ─── DTOs ─────────────────────────────────────────────────────────────────────

type CreerBienDTO struct {
	ProprietaireClerkID string   `json:"proprietaireClerkId"`
	Titre               string   `json:"titre"`
	Description         string   `json:"description"`
	Prix                int      `json:"prix"`
	Superficie          float64  `json:"superficie"`
	NombreChambres      int      `json:"nombreChambres"`
	Ville               string   `json:"ville"`
	Pays                string   `json:"pays"`
	Type                string   `json:"type"`
	PhotosBase64        []string `json:"photosBase64"`
}

// ─── GET /api/biens ───────────────────────────────────────────────────────────

func ListerBiens(c fiber.Ctx) error {
	var biens []models.Bien
	query := config.DB.Preload("Photos")

	if ville := c.Query("ville"); ville != "" {
		query = query.Where("ville ILIKE ?", "%"+ville+"%")
	}
	if statut := c.Query("statut"); statut != "" {
		query = query.Where("statut = ?", statut)
	} else {
		query = query.Where("statut = ?", "DISPONIBLE")
	}

	if err := query.Order("created_at DESC").Find(&biens).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erreur récupération des biens"})
	}
	return c.JSON(biens)
}

// ─── GET /api/biens/proprietaire/:clerkId ─────────────────────────────────────

func ListerBiensProprietaire(c fiber.Ctx) error {
	clerkID := c.Params("clerkId")
	var biens []models.Bien
	if err := config.DB.Preload("Photos").
		Where("proprietaire_clerk_id = ?", clerkID).
		Order("created_at DESC").
		Find(&biens).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erreur récupération"})
	}
	return c.JSON(biens)
}

// ─── POST /api/biens ──────────────────────────────────────────────────────────

func CreerBien(c fiber.Ctx) error {
	var dto CreerBienDTO
	if err := c.Bind().JSON(&dto); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Données invalides"})
	}
	if dto.Titre == "" || dto.Ville == "" || dto.Prix <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Titre, ville et prix sont requis"})
	}

	bien := models.Bien{
		ID:                  uuid.New(),
		ProprietaireClerkID: dto.ProprietaireClerkID,
		Titre:               dto.Titre,
		Description:         dto.Description,
		Prix:                dto.Prix,
		Superficie:          dto.Superficie,
		NombreChambres:      dto.NombreChambres,
		Ville:               dto.Ville,
		Pays:                dto.Pays,
		Type:                dto.Type,
		Statut:              "DISPONIBLE",
		CreatedAt:           time.Now(),
	}

	if err := config.DB.Create(&bien).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erreur création bien"})
	}

	// ── Sauvegarde des photos ──────────────────────────────────────────────
	uploadDir := fmt.Sprintf("./uploads/biens/%s", bien.ID)
	if err := os.MkdirAll(uploadDir, 0755); err == nil {
		for i, b64 := range dto.PhotosBase64 {
			// Supprimer le préfixe data URL si présent (data:image/jpeg;base64,...)
			if idx := strings.Index(b64, ","); idx != -1 {
				b64 = b64[idx+1:]
			}
			data, err := base64.StdEncoding.DecodeString(b64)
			if err != nil {
				continue
			}
			filename := fmt.Sprintf("photo_%d.jpg", i+1)
			path := filepath.Join(uploadDir, filename)
			if err := os.WriteFile(path, data, 0644); err != nil {
				continue
			}
			photo := models.Photo{
				ID:     uuid.New(),
				BienID: bien.ID,
				URL:    fmt.Sprintf("/uploads/biens/%s/%s", bien.ID, filename),
				Ordre:  i,
			}
			config.DB.Create(&photo)
		}
	}

	// Recharger avec les photos
	config.DB.Preload("Photos").First(&bien, "id = ?", bien.ID)
	return c.Status(201).JSON(bien)
}

// ─── DELETE /api/biens/:id ────────────────────────────────────────────────────

func SupprimerBien(c fiber.Ctx) error {
	id := c.Params("id")

	config.DB.Where("bien_id = ?", id).Delete(&models.Photo{})
	if err := config.DB.Delete(&models.Bien{}, "id = ?", id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erreur suppression"})
	}
	os.RemoveAll(fmt.Sprintf("./uploads/biens/%s", id))
	return c.JSON(fiber.Map{"message": "Bien supprimé"})
}