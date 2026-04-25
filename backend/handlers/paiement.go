package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/gofiber/fiber/v3"
)
const keypayURL = "https://keypay-api.masterkeycm.com"

type InitierPaiementReq struct {
	Amount            int    `json:"amount"`
	CustomerPhone     string `json:"customerPhone"`
	PaymentMethod     string `json:"paymentMethod"` // "OM_CM" ou "MOMO_CM"
	ExternalReference string `json:"externalReference"`
	Description       string `json:"description"`
	CallbackUrl       string `json:"callbackUrl"`
}

func keypayHeaders(req *http.Request) {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", os.Getenv("KEYPAY_API_KEY"))
	req.Header.Set("X-API-Secret", os.Getenv("KEYPAY_API_SECRET"))
}

func InitierPaiement(c fiber.Ctx) error {
	var req InitierPaiementReq
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Corps de requête invalide"})
	}
	if req.Amount <= 0 || req.CustomerPhone == "" || req.PaymentMethod == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Paramètres manquants"})
	}

	payload := map[string]interface{}{
		"amount":            req.Amount,
		"customerPhone":     req.CustomerPhone,
		"paymentMethod":     req.PaymentMethod,
		"externalReference": req.ExternalReference,
		"description":       req.Description,
		"callbackUrl":       req.CallbackUrl,
	}
	body, _ := json.Marshal(payload)

	httpReq, err := http.NewRequest("POST", keypayURL+"/api/v1/payments/collect", bytes.NewReader(body))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erreur interne"})
	}
	keypayHeaders(httpReq)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return c.Status(502).JSON(fiber.Map{"error": "Impossible de joindre KeyPay"})
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return c.Status(502).JSON(fiber.Map{"error": "Réponse invalide de KeyPay"})
	}
	return c.Status(resp.StatusCode).JSON(result)
}

func StatutPaiement(c fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(400).JSON(fiber.Map{"error": "ID manquant"})
	}

	httpReq, err := http.NewRequest("GET", fmt.Sprintf("%s/api/v1/payments/%s", keypayURL, id), nil)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erreur interne"})
	}
	keypayHeaders(httpReq)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return c.Status(502).JSON(fiber.Map{"error": "Impossible de joindre KeyPay"})
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return c.Status(502).JSON(fiber.Map{"error": "Réponse invalide de KeyPay"})
	}
	return c.Status(resp.StatusCode).JSON(result)
}