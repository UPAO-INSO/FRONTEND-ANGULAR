export interface Pensionista {
  id: number;
  name: string;
  phone: string | null;
  customerId: number | null;
  customerName: string | null;
  planCredits: number;
  planPricePerMeal: number;
  planTotalPaid: number;
  creditsRemaining: number;
  creditsUsed: number;
  startDate: string;
  active: boolean;
  notes: string | null;
}

export interface PensionistaConsumo {
  id: number;
  date: string;
  priceApplied: number;
  separacionId: number | null;
}

export interface CreatePensionistaRequest {
  customerId: number;
  planCredits: number;
  planPricePerMeal: number;
  notes?: string | null;
}
