export interface ChangellyCurrency {
  name: string;
  ticker: string;
  fullName: string;
  enabled: boolean;
  fixRateEnabled: boolean;
  payinConfirmations: number;
  addressInstruction: string;
  extraIdName: string;
  image: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function parseChangellyResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      response.ok
        ? "Invalid response from Changelly proxy"
        : `Changelly proxy request failed (${response.status})`
    );
  }
}

export async function fetchChangelly(method: string, params: any = {}) {
  const response = await fetch(`${API_BASE}/api/changelly`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ method, params }),
  });

  const data = await parseChangellyResponse(response);

  if (!response.ok) {
    throw new Error(data?.error?.message || `Changelly proxy request failed (${response.status})`);
  }
  if (data.error) {
    throw new Error(data.error.message || "Changelly API error");
  }
  return data.result;
}

export interface ChangellyTransaction {
  id: string;
  status: string;
  amountTo: string;
  amountFrom: string;
  payinAddress: string;
  payinHash: string | null;
  payoutHash: string | null;
  payoutHashLink: string | null;
  currencyFrom: string;
  currencyTo: string;
}

export const changellyService = {
  getCurrencies: () => fetchChangelly("getCurrenciesFull"),
  getExchangeAmount: (from: string, to: string, amountFrom: string) => 
    fetchChangelly("getExchangeAmount", [{ from, to, amountFrom }]),
  createTransaction: (from: string, to: string, amountFrom: string, address: string) =>
    fetchChangelly("createTransaction", { from, to, amountFrom, address }),
  getStatus: (id: string) => fetchChangelly("getStatus", { id }) as Promise<string>,
  getTransactions: (params: { id: string }) =>
    fetchChangelly("getTransactions", params) as Promise<ChangellyTransaction[]>,
};
