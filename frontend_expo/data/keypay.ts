const BASE = "https://keypay-api.masterkeycm.com";
const KEY  = process.env.EXPO_PUBLIC_KEYPAY_API_KEY  ?? "";
const SEC  = process.env.EXPO_PUBLIC_KEYPAY_API_SECRET ?? "";

const HEADERS = {
  "Content-Type": "application/json",
  "X-API-Key":    KEY,
  "X-API-Secret": SEC,
};

export type InitierParams = {
  montant:          number;
  telephone:        string;
  methodePaiement:  "OM_CM" | "MOMO_CM";
  referenceExterne: string;
  description:      string;
};

export type KeypayTransaction = {
  transactionId:  string;
  reference:      string;
  status:         string;
  statusMessage?: string;
};

export async function initierPaiement(p: InitierParams): Promise<KeypayTransaction> {
  const res = await fetch(`${BASE}/api/v1/payments/collect`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      amount:            p.montant,
      customerPhone:     p.telephone,
      paymentMethod:     p.methodePaiement,
      externalReference: p.referenceExterne,
      description:       p.description,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? data.error ?? "Erreur KeyPay");
  return data as KeypayTransaction;
}

export async function statutPaiement(reference: string): Promise<KeypayTransaction> {
  const res = await fetch(`${BASE}/api/v1/payments/${reference}`, { headers: HEADERS });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? data.error ?? "Erreur KeyPay");
  return data as KeypayTransaction;
}
