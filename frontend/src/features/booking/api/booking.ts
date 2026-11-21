
import { apiRequest } from "../../../lib/api-client";
import type { BookingQuote, Cinema } from "../../../types/api";

export async function getCinemas(): Promise<Cinema[]> {
  return apiRequest<Cinema[]>("/cinemas/");
}

export async function getBookingQuote(
  cinemaId: string,
  groupSize: number,
): Promise<BookingQuote> {
  if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 10_000) {
    throw new Error("Group size must be between 1 and 10,000.");
  }

  if (!cinemaId) {
    throw new Error("Please select a cinema.");
  }

  const params = new URLSearchParams({
    groupSize: String(groupSize),
  });

  return apiRequest<BookingQuote>(
    `/cinemas/${encodeURIComponent(cinemaId)}/booking/?${params.toString()}`,
  );
}

