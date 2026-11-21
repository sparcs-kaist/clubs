import type {
  RentalPeriodPolicy,
  RentalStatus,
} from "@clubs/interface/api/rental/v2";

export interface ReservedStock {
  id: number;
  pickupDate: string;
  returnDate: string;
  quantity: number;
  status: string;
}

export function addRentalDays(date: string, days: number): string {
  const day = new Date(`${date}T00:00:00.000Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

export function regularReturnLimit(
  policy: RentalPeriodPolicy,
  pickupDate: string,
  nextOpenDates: readonly string[],
) {
  if (policy === "DAYS_14") return addRentalDays(pickupDate, 14);
  return nextOpenDates[1];
}

export function peakReservedQuantity(
  reservations: readonly ReservedStock[],
  from: string,
  to?: string,
) {
  const changes = new Map<string, number>();

  reservations.forEach(reservation => {
    const start = reservation.pickupDate < from ? from : reservation.pickupDate;
    const last = to ?? reservation.returnDate;
    const end = reservation.returnDate < last ? reservation.returnDate : last;
    if (start >= end) return;

    changes.set(start, (changes.get(start) ?? 0) + reservation.quantity);
    changes.set(end, (changes.get(end) ?? 0) - reservation.quantity);
  });

  let quantity = 0;
  let peak = 0;
  [...changes.keys()].sort().forEach(date => {
    quantity += changes.get(date) ?? 0;
    peak = Math.max(peak, quantity);
  });
  return peak;
}

export function physicalQuantity(
  total: number,
  reservations: readonly ReservedStock[],
) {
  return reservations.reduce(
    (quantity, reservation) =>
      reservation.status === "CHECKED_OUT"
        ? quantity - reservation.quantity
        : quantity,
    total,
  );
}

export function beforeSameDayReturns(
  total: number,
  reservations: readonly ReservedStock[],
  date: string,
  pickupId = Number.POSITIVE_INFINITY,
) {
  let available = total;
  reservations.forEach(reservation => {
    if (reservation.pickupDate > date) return;
    if (reservation.returnDate < date) return;
    if (reservation.pickupDate === date) {
      if (reservation.id >= pickupId) return;
    }
    available -= reservation.quantity;
  });
  return Math.max(available, 0);
}

export function checkoutQuantity(
  total: number,
  reservations: readonly ReservedStock[],
  pickup: ReservedStock,
) {
  let quantity = physicalQuantity(total, reservations);
  reservations.forEach(reservation => {
    if (reservation.status !== "RESERVED") return;
    if (reservation.pickupDate !== pickup.pickupDate) return;
    if (reservation.id >= pickup.id) return;
    quantity -= reservation.quantity;
  });
  return Math.max(quantity, 0);
}

export function hasSameDayReturn(
  reservations: readonly ReservedStock[],
  date: string,
) {
  return reservations.some(reservation => reservation.returnDate === date);
}

export function activeRentalStatus(status: RentalStatus) {
  return status === "RESERVED" || status === "CHECKED_OUT";
}
