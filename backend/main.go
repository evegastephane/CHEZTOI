package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/static"
	"github.com/joho/godotenv"

	"backend/config"
	"backend/models"
	"backend/routes"
)

func main() {
	// Charger .env
	if err := godotenv.Load(); err != nil {
		log.Fatal("❌ Erreur chargement .env")
	}

	// Connecter la base de données
	config.ConnectDB()

	// Auto-migration des tables
	config.DB.AutoMigrate(
		&models.Utilisateur{},
		&models.Bien{},
		&models.Photo{},
		&models.Visite{},
		&models.Paiement{},
		&models.Contrat{},
		&models.Message{},
		&models.Notification{},
		&models.DocumentKYC{},
		&models.Revenu{},
	)
	log.Println("✅ Tables migrées !")

	// Initialiser Fiber
	app := fiber.New(fiber.Config{
		AppName: "CheZToi API v1",
	})

	// Dossier uploads
	os.MkdirAll("./uploads/biens", 0755)

	// Middlewares
	app.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Content-Type", "Authorization"},
	}))
	app.Use(logger.New())

	// Fichiers statiques (photos uploadées)
	app.Get("/uploads/*", static.New("./uploads"))

	// Route de test
	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "CheZToi API fonctionne ✅",
		})
	})

	// Routes métier
	routes.SetupRoutes(app)

	// Démarrer
	port := os.Getenv("PORT")
	log.Printf("🚀 Serveur démarré sur le port %s", port)
	log.Fatal(app.Listen(":" + port))
}
