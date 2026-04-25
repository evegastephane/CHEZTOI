package routes

import (
	"backend/handlers"

	"github.com/gofiber/fiber/v3"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	// ── Biens ──────────────────────────────────────────────────────────────
	biens := api.Group("/biens")
	biens.Get("/", handlers.ListerBiens)
	biens.Get("/proprietaire/:clerkId", handlers.ListerBiensProprietaire)
	biens.Post("/", handlers.CreerBien)
	biens.Delete("/:id", handlers.SupprimerBien)

	// ── Paiements ──────────────────────────────────────────────────────────
	paiements := api.Group("/paiements")
	paiements.Post("/initier", handlers.InitierPaiement)
	paiements.Get("/:id/statut", handlers.StatutPaiement)

	// ── Revenus ────────────────────────────────────────────────────────────
	revenus := api.Group("/revenus")
	revenus.Get("/proprietaire/:clerkId", handlers.ListerRevenusProprietaire)
	revenus.Post("/retirer", handlers.RetirerRevenu)
}