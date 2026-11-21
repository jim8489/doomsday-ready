
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  Clock3,
  Clapperboard,
  RefreshCw,

} from "lucide-react";

import { PageHeader } from "../../../components/layout/PageHeader";
import { apiRequest } from "../../../lib/api-client";
import { formatMinutes } from "../../../lib/format";
import type { Movie, RewatchPlan } from "../../../types/api";

export function RewatchPage() {
  const [targetId, setTargetId] = useState("");

  const moviesQuery = useQuery({
    queryKey: ["movies"],
    queryFn: () => apiRequest<Movie[]>("/movies/"),
  });

  const planQuery = useQuery({
    queryKey: ["rewatch-plan", targetId],
    queryFn: () =>
      apiRequest<RewatchPlan>(
        `/movies/${targetId}/rewatch-order/`,
      ),
    enabled: Boolean(targetId),
      staleTime: 0,
    refetchOnMount: "always",
  });

  const plan = planQuery.data;

  const progress = plan && plan.total_movies > 0
    ? Math.round(
        (plan.watched_count / plan.total_movies) * 100,
      )
    : 0;

  return (
    <div>
      <PageHeader
      action={
        <button
          type="button"
          onClick={() => void planQuery.refetch()}
          disabled={!targetId || planQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold text-zinc-300 hover:border-amber-400/30 hover:text-white disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={planQuery.isFetching ? "animate-spin" : ""}
          />
          Refresh plan
        </button>
      }
        eyebrow="Your personal watch journey"
        title="Rewatch Plan"
        description="Choose a target movie. We'll calculate every prerequisite and put your watch journey in the correct order."
      />

      <section className="mb-7 rounded-2xl border border-white/[0.07] bg-[#111116] p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
            <Clapperboard size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Choose your destination
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Select the movie you're preparing to watch.
            </p>
          </div>
        </div>

        <select
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
          disabled={moviesQuery.isPending || !moviesQuery.data?.length}
          className="w-full rounded-xl border border-white/10 bg-[#09090d] px-4 py-3.5 text-sm text-white outline-none transition focus:border-amber-400/50 disabled:opacity-50"
        >
          <option value="">Select a target movie...</option>
          {moviesQuery.data?.map((movie) => (
            <option key={movie.id} value={movie.id}>
              {movie.title} ({movie.release_year})
            </option>
          ))}
        </select>

        {moviesQuery.isError && (
          <p className="mt-3 text-xs text-red-300">
            {moviesQuery.error.message}
          </p>
        )}

        {moviesQuery.data?.length === 0 && (
          <p className="mt-3 text-xs text-zinc-500">
            Add movies to your collection before creating a rewatch plan.
          </p>
        )}
      </section>

      {planQuery.isFetching && (
        <p className="py-12 text-center text-sm text-zinc-500">
          Calculating your rewatch order...
        </p>
      )}

      {planQuery.isError && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-300">
          {planQuery.error.message}
        </div>
      )}

      {plan && (
        <div className="space-y-6">

<section className="rounded-2xl border border-amber-400/15 bg-gradient-to-br from-amber-400/[0.09] to-[#111116] p-5 sm:p-7">
  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
    Your destination
  </p>

  <h3 className="mt-2 text-2xl font-bold text-white">
    {plan.target.title}
  </h3>

  <div className="mt-4 flex flex-wrap items-center gap-2">
    <span
      className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
        plan.target.watched
          ? "bg-emerald-400/10 text-emerald-300"
          : "bg-zinc-400/10 text-zinc-400"
      }`}
    >
      {plan.target.watched
        ? "Target already watched"
        : "Target not watched"}
    </span>

    <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-zinc-400">
      {plan.total_movies} prerequisites
    </span>
  </div>

  <p className="mt-3 text-xs text-zinc-500">
    Track your prerequisite progress before watching this movie.
  </p>
</section>


          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard
  label="Total prerequisites"
  value={plan.total_movies}
/>

<SummaryCard
  label="Prerequisites watched"
  value={plan.watched_count}
/>

<SummaryCard
  label="Remaining runtime"
  value={formatMinutes(plan.remaining_runtime_minutes)}
/>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-[#111116] p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Your progress
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                {plan.watched_count} of {plan.total_movies} prerequisites watched
                </p>
              </div>
              <span className="text-lg font-bold text-amber-400">
                {progress}%
              </span>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-7 space-y-3">
              {plan.movies.map((movie, index) => (
                <div
                  key={movie.id}
                  className="flex items-center gap-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-xs font-bold text-zinc-500">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-zinc-200">
                      {movie.title}
                    </h4>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {movie.release_year} · {formatMinutes(movie.runtime_minutes)}
                    </p>
                  </div>

                  {movie.watched ? (
                    <CheckCircle2
                      size={19}
                      className="shrink-0 text-emerald-400"
                    />
                  ) : (
                    <Circle
                      size={19}
                      className="shrink-0 text-zinc-600"
                    />
                  )}
                </div>
              ))}

              {plan.movies.length === 0 && (
                <p className="py-8 text-center text-sm text-zinc-500">
                  No prerequisites required. You're ready for this movie.
                </p>
              )}
            </div>

            {plan.total_movies > 0 && (
              <div className="mt-5 flex items-center gap-2 text-xs text-zinc-500">
                <Clock3 size={14} className="text-amber-400" />
                {formatMinutes(plan.remaining_runtime_minutes)} of unwatched content remaining
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111116] p-5">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}
