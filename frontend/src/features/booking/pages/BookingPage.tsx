import type { FormEvent, ReactNode } from "react";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clapperboard,
  Film,
  Ticket,
  Users,
  XCircle,
} from "lucide-react";

import { PageHeader } from "../../../components/layout/PageHeader";

import {
  getBookingQuote,
  getCinemas,
} from "../api/booking";

import type {
  BookingQuote,
  Cinema,
} from "../../../types/api";


const QUICK_GROUP_SIZES = [2, 4, 6, 8, 10, 12];


export function BookingPage() {
  const [cinemaId, setCinemaId] = useState("");
  const [groupSize, setGroupSize] = useState("6");
  const [formError, setFormError] = useState<string | null>(null);

  const cinemasQuery = useQuery({
    queryKey: ["cinemas"],
    queryFn: getCinemas,
  });

  const bookingMutation = useMutation({
    mutationFn: ({
      cinemaId,
      groupSize,
    }: {
      cinemaId: string;
      groupSize: number;
    }) => getBookingQuote(cinemaId, groupSize),
  });

  const selectedCinema = cinemasQuery.data?.find(
    (cinema) => cinema.id === cinemaId,
  );

  const quote = bookingMutation.data;

  function resetQuote() {
    bookingMutation.reset();
    setFormError(null);
  }

  function handleBooking() {
    const parsedGroupSize = Number(groupSize);

    if (!cinemaId) {
      setFormError("Please select a cinema.");
      return;
    }

    if (
      !Number.isInteger(parsedGroupSize) ||
      parsedGroupSize < 1 ||
      parsedGroupSize > 10_000
    ) {
      setFormError(
        "Group size must be a whole number between 1 and 10,000.",
      );
      return;
    }

    setFormError(null);

    bookingMutation.mutate({
      cinemaId,
      groupSize: parsedGroupSize,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleBooking();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Opening night experience"
        title="Book your watch party"
        description="Bring everyone together. Find the minimum number of cinema bundles needed to seat your entire group, without paying for empty seats."
        action={
          <div className="hidden items-center gap-2 rounded-full border border-amber-400/15 bg-amber-400/[0.05] px-4 py-2.5 md:flex">
            <Ticket size={15} className="text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Exact seat allocation
            </span>
          </div>
        }
      />

      {/* Booking overview */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <OverviewCard
          icon={<Film size={18} />}
          label="Available cinemas"
          value={cinemasQuery.data?.length ?? "—"}
        />

        <OverviewCard
          icon={<Users size={18} />}
          label="Maximum group size"
          value="10,000"
        />

        <OverviewCard
          icon={<Ticket size={18} />}
          label="Booking approach"
          value="Exact seats"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_0.9fr]">

        {/* Left: Booking form */}

        <section className="rounded-2xl border border-white/[0.07] bg-[#111116] p-5 sm:p-7">

          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
              <Clapperboard size={21} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">
                Configure your watch party
              </h3>

              <p className="mt-1 text-xs text-zinc-500">
                Choose your cinema and invite your group.
              </p>
            </div>
          </div>

          {cinemasQuery.isPending && (
            <div className="py-8 text-center text-sm text-zinc-500">
              Loading available cinemas...
            </div>
          )}

          {cinemasQuery.isError && (
            <div className="rounded-xl border border-red-400/15 bg-red-400/[0.05] p-4">
              <p className="text-xs text-red-300">
                Unable to load cinemas: {cinemasQuery.error.message}
              </p>

              <button
                type="button"
                onClick={() => void cinemasQuery.refetch()}
                className="mt-3 text-xs font-semibold text-amber-400"
              >
                Try again
              </button>
            </div>
          )}

          {!cinemasQuery.isPending &&
            !cinemasQuery.isError &&
            cinemasQuery.data?.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                <Ticket
                  size={28}
                  className="mx-auto mb-3 text-zinc-600"
                />

                <p className="text-sm font-semibold text-zinc-300">
                  No cinemas available
                </p>

                <p className="mt-2 text-xs text-zinc-500">
                  Add a cinema through the API before creating a booking quote.
                </p>
              </div>
            )}

          {!cinemasQuery.isPending &&
            !cinemasQuery.isError &&
            (cinemasQuery.data?.length ?? 0) > 0 && (
              <form onSubmit={handleSubmit} className="space-y-7">

                {/* Cinema selection */}

                <div>
                  <label
                    htmlFor="cinema"
                    className="mb-2 block text-xs font-semibold text-zinc-400"
                  >
                    Select cinema
                  </label>

                  <select
                    id="cinema"
                    required
                    value={cinemaId}
                    onChange={(event) => {
                      setCinemaId(event.target.value);
                      resetQuote();
                    }}
                    className="w-full rounded-xl border border-white/10 bg-[#09090d] px-4 py-3.5 text-sm text-white outline-none transition focus:border-amber-400/50"
                  >
                    <option value="">
                      Choose your cinema...
                    </option>

                    {cinemasQuery.data?.map((cinema) => (
                      <option key={cinema.id} value={cinema.id}>
                        {cinema.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bundle preview */}

                {selectedCinema && (
                  <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.035] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-zinc-200">
                          {selectedCinema.name}
                        </p>

                        <p className="mt-1 text-[10px] text-zinc-500">
                          Available seat bundles
                        </p>
                      </div>

                      <Ticket
                        size={18}
                        className="text-amber-400"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedCinema.bundle_sizes.map((size) => (
                        <div
                          key={size}
                          className="rounded-lg border border-amber-400/15 bg-[#111116] px-3 py-2.5"
                        >
                          <p className="text-sm font-bold text-amber-300">
                            {size}
                          </p>

                          <p className="text-[9px] text-zinc-600">
                            seats
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Group size */}

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label
                      htmlFor="groupSize"
                      className="text-xs font-semibold text-zinc-400"
                    >
                      How many people are joining?
                    </label>

                    <span className="text-[10px] text-zinc-600">
                      1–10,000 people
                    </span>
                  </div>

                  <div className="relative">
                    <Users
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    />

                    <input
                      id="groupSize"
                      type="number"
                      min={1}
                      max={10000}
                      step={1}
                      required
                      value={groupSize}
                      onChange={(event) => {
                        setGroupSize(event.target.value);
                        resetQuote();
                      }}
                      className="w-full rounded-xl border border-white/10 bg-[#09090d] py-4 pl-12 pr-4 text-lg font-bold text-white outline-none transition focus:border-amber-400/50"
                    />
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      Quick selection
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {QUICK_GROUP_SIZES.map((size) => (
                        <button
                          type="button"
                          key={size}
                          onClick={() => {
                            setGroupSize(String(size));
                            resetQuote();
                          }}
                          className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                            groupSize === String(size)
                              ? "bg-amber-400 text-black"
                              : "border border-white/[0.07] bg-white/[0.025] text-zinc-400 hover:border-amber-400/30 hover:text-white"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form error */}

                {(formError || bookingMutation.isError) && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-red-400/15 bg-red-400/[0.05] p-4"
                  >
                    <AlertCircle
                      size={17}
                      className="mt-0.5 shrink-0 text-red-400"
                    />

<p className="text-xs leading-5 text-red-300">
  {formError ||
    bookingMutation.error?.message ||
    "An unexpected booking error occurred."}
</p>
                  </div>
                )}

                {/* Submit */}

                <button
                  type="submit"
                  disabled={bookingMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-4 text-xs font-bold text-black shadow-lg shadow-amber-500/[0.08] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bookingMutation.isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      Calculating optimal bundles...
                    </>
                  ) : (
                    <>
                      <Ticket size={16} />
                      Find optimal bundle combination
                      <ChevronRight size={15} />
                    </>
                  )}
                </button>

                <p className="flex items-center justify-center gap-2 text-center text-[10px] text-zinc-600">
                  <CircleHelp size={13} />
                  The system finds the minimum bundles with exactly your group size.
                </p>
              </form>
            )}
        </section>

        {/* Right: Booking results */}

        <section className="min-h-[440px] rounded-2xl border border-white/[0.07] bg-[#111116] p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
                Reservation planner
              </p>

              <h3 className="mt-2 text-lg font-bold text-white">
                Your allocation
              </h3>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400">
              <Ticket size={19} />
            </div>
          </div>

          {!quote && !bookingMutation.isPending &&
            !bookingMutation.isError && (
              <div className="flex min-h-[320px] flex-col items-center justify-center py-10 text-center">
                <div className="mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.025] text-zinc-600">
                  <Clapperboard size={32} />
                </div>

                <h4 className="text-sm font-bold text-zinc-300">
                  Ready to plan your opening night?
                </h4>

                <p className="mx-auto mt-2 max-w-xs text-xs leading-6 text-zinc-600">
                  Your optimal bundle combination will appear here once
                  you've configured your watch party.
                </p>
              </div>
            )}

          {bookingMutation.isPending && (
            <div
              aria-live="polite"
              className="flex min-h-[320px] flex-col items-center justify-center"
            >
              <div className="mb-5 h-10 w-10 animate-spin rounded-full border-2 border-amber-400/20 border-t-amber-400" />

              <p className="text-sm font-semibold text-white">
                Optimizing your booking
              </p>

              <p className="mt-2 text-xs text-zinc-500">
                Finding the minimum possible bundles...
              </p>
            </div>
          )}

          {quote && (
            <BookingResult
              quote={quote}
              cinema={selectedCinema}
            />
          )}
        </section>
      </div>

      {/* Booking explanation */}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard
          number="01"
          title="Choose a cinema"
          description="Each cinema offers its own available bundle sizes."
        />

        <InfoCard
          number="02"
          title="Set your group size"
          description="Tell us exactly how many people are joining."
        />

        <InfoCard
          number="03"
          title="Get the best allocation"
          description="Our optimization algorithm finds the fewest exact bundles."
        />
      </div>
    </div>
  );
}


function BookingResult({
  quote,
  cinema,
}: {
  quote: BookingQuote;
  cinema?: Cinema;
}) {
  if (!quote.possible) {
    return (
      <div className="mt-9">
        <div className="rounded-2xl border border-red-400/15 bg-red-400/[0.04] p-6">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-400/10 text-red-400">
            <XCircle size={25} />
          </div>

          <span className="rounded-full bg-red-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-300">
            Exact combination unavailable
          </span>

          <h4 className="mt-5 text-xl font-bold text-white">
            No exact booking possible
          </h4>

          <p className="mt-3 text-xs leading-6 text-zinc-500">
            {cinema?.name ?? "This cinema"} cannot accommodate
            exactly {quote.group_size} people with its available
            bundle sizes.
          </p>

          <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#09090d] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Requested group
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {quote.group_size} people
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-zinc-600">
          Try another cinema or a different group size.
        </p>
      </div>
    );
  }

  const allocatedSeats = quote.bundles.reduce(
    (total, bundle) => total + bundle.size * bundle.count,
    0,
  );

  return (
    <div className="mt-8">
      <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.045] p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-400" />

          <span className="text-xs font-bold text-emerald-300">
            Exact allocation found
          </span>
        </div>

        <p className="mt-3 text-[10px] text-zinc-500">
          {cinema?.name ?? "Selected cinema"}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-3xl font-bold text-white">
              {quote.total_bundles}
            </p>

            <p className="mt-1 text-[10px] text-zinc-500">
              Minimum bundles
            </p>
          </div>

          <div>
            <p className="text-3xl font-bold text-white">
              {allocatedSeats.toLocaleString()}
            </p>

            <p className="mt-1 text-[10px] text-zinc-500">
              Seats allocated
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Purchase breakdown
          </h4>

          <span className="text-[10px] text-zinc-600">
            {quote.bundles.length} bundle types
          </span>
        </div>

        <div className="space-y-3">
          {quote.bundles.map((bundle) => (
            <div
              key={bundle.size}
              className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300">
                    <Ticket size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white">
                      {bundle.size}-seat bundle
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-500">
                      {bundle.count} × {bundle.size} seats
                    </p>
                  </div>
                </div>

                <span className="text-lg font-bold text-amber-400">
                  ×{bundle.count}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                <span className="text-[10px] text-zinc-600">
                  Seats from this bundle type
                </span>

                <span className="text-xs font-semibold text-zinc-300">
                  {(bundle.size * bundle.count).toLocaleString()} seats
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/[0.07] bg-[#09090d] p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Requested group
          </span>

          <span className="text-xs font-bold text-white">
            {quote.group_size} seats
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Total allocated
          </span>

          <span className="text-xs font-bold text-emerald-300">
            {allocatedSeats} seats
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
          <span className="text-xs font-semibold text-zinc-300">
            Empty seats
          </span>

          <span className="text-sm font-bold text-emerald-400">
            {allocatedSeats - quote.group_size}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-2 text-[10px] leading-5 text-zinc-600">
        <CheckCircle2
          size={14}
          className="mt-0.5 shrink-0 text-emerald-400"
        />

        The minimum number of bundles that exactly accommodates
        your entire group has been calculated.
      </div>
    </div>
  );
}


function OverviewCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111116] p-5">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-amber-400">
        {icon}
      </div>

      <p className="text-xl font-bold text-white">{value}</p>

      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}


function InfoCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111116] p-5">
      <p className="text-[10px] font-bold tracking-wider text-amber-400">
        {number}
      </p>

      <h4 className="mt-3 text-sm font-bold text-zinc-200">
        {title}
      </h4>

      <p className="mt-2 text-xs leading-5 text-zinc-600">
        {description}
      </p>
    </div>
  );
}
