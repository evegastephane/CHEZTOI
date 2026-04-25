package handlers

import (
	"backend/config"
	"backend/models"

	"github.com/gofiber/fiber/v3"
)

// ─── GET /api/revenus/proprietaire/:clerkId ───────────────────────────────────

func ListerRevenusProprietaire(c fiber.Ctx) error {
	clerkId := c.Params("clerkId")

	var revenus []models.Revenu
	if err := config.DB.
		Where("proprietaire_clerk_id = ?", clerkId).
		Order("created_at DESC").
		Find(&revenus).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erreur récupération"})
	}

	var totalRecu struct{ Total int }
	config.DB.Model(&models.Revenu{}).
		Where("proprietaire_clerk_id = ? AND type = 'LOCATION'", clerkId).
		Select("COALESCE(SUM(montant), 0) as total").
		Scan(&totalRecu)

	var totalRetraits struct{ Total int }
	config.DB.Model(&models.Revenu{}).
		Where("proprietaire_clerk_id = ? AND type = 'RETRAIT'", clerkId).
		Select("COALESCE(SUM(montant), 0) as total").
		Scan(&totalRetraits)

	return c.JSON(fiber.Map{
		"revenus":       revenus,
		"totalRecu":     totalRecu.Total,
		"totalRetraits": totalRetraits.Total,
		"solde":         totalRecu.Total - totalRetraits.Total,
	})
}

// ─── POST /api/revenus/retirer ────────────────────────────────────────────────

type RetirerRequest struct {
	ProprietaireClerkId string `json:"proprietaireClerkId"`
	Montant             int    `json:"montant"`
	Description         string `json:"description"`
}

func RetirerRevenu(c fiber.Ctx) error {
	var req RetirerRequest
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Corps invalide"})
	}
	if req.Montant <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Montant invalide"})
	}

	var totalRecu struct{ Total int }
	config.DB.Model(&models.Revenu{}).
		Where("proprietaire_clerk_id = ? AND type = 'LOCATION'", req.ProprietaireClerkId).
		Select("COALESCE(SUM(montant), 0) as total").
		Scan(&totalRecu)

	var totalRetraits struct{ Total int }
	config.DB.Model(&models.Revenu{}).
		Where("proprietaire_clerk_id = ? AND type = 'RETRAIT'", req.ProprietaireClerkId).
		Select("COALESCE(SUM(montant), 0) as total").
		Scan(&totalRetraits)

	solde := totalRecu.Total - totalRetraits.Total
	if req.Montant > solde {
		return c.Status(400).JSON(fiber.Map{"error": "Solde insuffisant", "solde": solde})
	}

	retrait := models.Revenu{
		ProprietaireClerkID: req.ProprietaireClerkId,
		Montant:             req.Montant,
		Type:                "RETRAIT",
		Description:         req.Description,
	}
	if err := config.DB.Create(&retrait).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erreur retrait"})
	}

	return c.Status(201).JSON(fiber.Map{
		"retrait": retrait,
		"solde":   solde - req.Montant,
	})
}