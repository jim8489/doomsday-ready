
import type { ReactNode } from "react";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Edit3,
  Film,
  Plus,
  RefreshCw,
  Search,
  Circle,
} from "lucide-react";

import { PageHeader } from "../../../components/layout/PageHeader";

import {
  createMovie,
  getMovies,
  updateMovie,
} from "../api/movies";

import type { MovieWritePayload } from "../api/movies";
import { MovieFormDialog } from "../components/MovieFormDialog";
import type { MovieFormValues } from "../components/MovieFormDialog";

import { formatMinutes } from "../../../lib/format";
import type { Movie } from "../../../types/api";


type MovieFilter = "all" | "watched" | "unwatched";

interface SaveMovieVariables {
  id?: string;
  payload: MovieWritePayload;
}

interface WatchedVariables {
  id: string;
  watched: boolean;
}


export function MoviesPage() {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MovieFilter>("all");

  const moviesQuery = useQuery({
    queryKey: ["movies"],
    queryFn: getMovies,
  });

  const movies = moviesQuery.data ?? [];

  // Create or update a movie.
  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: SaveMovieVariables) => {
      return id
        ? updateMovie(id, payload)
        : createMovie(payload);
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["movies"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["rewatch-plan"],
        }),
      ]);

      setDialogOpen(false);
      setEditingMovie(null);
    },
  });

  // Update the watched status independently.
  const watchedMutation = useMutation({
    mutationFn: ({ id, watched }: WatchedVariables) => {
      return updateMovie(id, { watched });
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["movies"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["rewatch-plan"],
        }),
      ]);
    },
  });

  const movieMap = useMemo(() => {
    return new Map(
      movies.map((movie) => [movie.id, movie]),
    );
  }, [movies]);

  const filteredMovies = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return movies.filter((movie) => {
      const matchesSearch =
        movie.title.toLowerCase().includes(normalizedSearch) ||
        String(movie.release_year).includes(normalizedSearch);

      const matchesFilter =
        filter === "all" ||
        (filter === "watched" && movie.watched) ||
        (filter === "unwatched" && !movie.watched);

      return matchesSearch && matchesFilter;
    });
  }, [movies, search, filter]);

  const watchedCount = movies.filter(
    (movie) => movie.watched,
  ).length;

  const unwatchedCount = movies.length - watchedCount;

  const totalRuntime = movies.reduce(
    (total, movie) => total + movie.runtime_minutes,
    0,
  );

  function openCreateDialog() {
    saveMutation.reset();
    setEditingMovie(null);
    setDialogOpen(true);
  }

  function openEditDialog(movie: Movie) {
    saveMutation.reset();
    setEditingMovie(movie);
    setDialogOpen(true);
  }

  function closeDialog() {
    if (saveMutation.isPending) return;

    setDialogOpen(false);
    setEditingMovie(null);
    saveMutation.reset();
  }

  function handleSave(values: MovieFormValues) {
    saveMutation.mutate({
      id: editingMovie?.id,
      payload: values,
    });
  }

  function toggleWatched(movie: Movie) {
    watchedMutation.mutate({
      id: movie.id,
      watched: !movie.watched,
    });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Your movie universe"
        title="Movies"
        description="Build and manage your MCU collection. Add movies, organize their prerequisites, and track your progress toward opening night."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void moviesQuery.refetch()}
              disabled={moviesQuery.isFetching}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold text-zinc-300 transition hover:border-amber-400/30 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  moviesQuery.isFetching ? "animate-spin" : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateDialog}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-black transition hover:bg-amber-300"
            >
              <Plus size={16} />
              Add movie
            </button>
          </div>
        }
      />

      {/* Collection statistics */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Film size={18} />}
          label="Movies collected"
          value={movies.length}
        />

        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Movies watched"
          value={watchedCount}
        />

        <StatCard
          icon={<Circle size={18} />}
          label="Yet to watch"
          value={unwatchedCount}
        />

        <StatCard
          icon={<Clock3 size={18} />}
          label="Total collection runtime"
          value={formatMinutes(totalRuntime)}
        />
      </div>

      {/* Mutation feedback */}

      {watchedMutation.isError && (
        <div
          role="alert"
          className="mb-5 flex items-center gap-3 rounded-xl border border-red-400/15 bg-red-400/[0.05] p-4"
        >
          <AlertCircle size={18} className="text-red-400" />
          <p className="text-xs text-red-300">
            {watchedMutation.error.message}
          </p>

          <button
            type="button"
            onClick={() => watchedMutation.reset()}
            className="ml-auto text-xs text-zinc-500 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search and filtering */}

      <section className="mb-6 rounded-2xl border border-white/[0.07] bg-[#111116] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your movie collection..."
              aria-label="Search movies"
              className="w-full rounded-xl border border-white/[0.07] bg-[#09090d] py-3 pl-11 pr-4 text-xs text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-400/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all", "All movies"],
                ["watched", "Watched"],
                ["unwatched", "Unwatched"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-lg px-3 py-2.5 text-[11px] font-semibold transition ${
                  filter === value
                    ? "bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20"
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Collection heading */}

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">
            Your collection
          </h3>
          <p className="mt-1 text-xs text-zinc-600">
            Showing {filteredMovies.length} of {movies.length} movies
          </p>
        </div>

        <span className="rounded-full border border-white/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Live API data
        </span>
      </div>

      {/* Loading state */}

      {moviesQuery.isPending && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#111116] p-12 text-center text-sm text-zinc-500">
          Loading your movie collection...
        </div>
      )}

      {/* Error state */}

      {moviesQuery.isError && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-6">
          <p className="font-semibold text-red-300">
            Unable to load movies
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            {moviesQuery.error.message}
          </p>

          <button
            type="button"
            onClick={() => void moviesQuery.refetch()}
            className="mt-4 text-xs font-bold text-amber-400 hover:text-amber-300"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty states */}

      {!moviesQuery.isPending &&
        !moviesQuery.isError &&
        movies.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-16 text-center">
            <Film
              className="mx-auto mb-4 text-amber-400/70"
              size={34}
            />

            <h3 className="text-lg font-bold text-white">
              Your collection starts here
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Add your first movie to begin building your MCU
              rewatch collection.
            </p>

            <button
              type="button"
              onClick={openCreateDialog}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-bold text-black hover:bg-amber-300"
            >
              <Plus size={15} />
              Add your first movie
            </button>
          </div>
        )}

      {!moviesQuery.isPending &&
        !moviesQuery.isError &&
        movies.length > 0 &&
        filteredMovies.length === 0 && (
          <div className="rounded-2xl border border-white/[0.07] bg-[#111116] p-12 text-center">
            <Search
              className="mx-auto mb-3 text-zinc-600"
              size={25}
            />

            <p className="text-sm font-semibold text-zinc-300">
              No movies match your filters
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
              className="mt-3 text-xs font-semibold text-amber-400"
            >
              Clear filters
            </button>
          </div>
        )}

      {/* Movie cards */}

      {!moviesQuery.isPending &&
        !moviesQuery.isError &&
        filteredMovies.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMovies.map((movie) => {
              const prerequisiteTitles = movie.prerequisites
                .map((id) => movieMap.get(id)?.title)
                .filter((title): title is string => Boolean(title));

              return (
                <article
                  key={movie.id}
                  className="group rounded-2xl border border-white/[0.07] bg-[#111116] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-amber-400/20 hover:bg-[#15151b]"
                >
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/[0.09] text-amber-400">
                      <Film size={20} />
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        movie.watched
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-zinc-400/10 text-zinc-400"
                      }`}
                    >
                      {movie.watched ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <Circle size={12} />
                      )}

                      {movie.watched ? "Watched" : "Not watched"}
                    </span>
                  </div>

                  <h4 className="min-h-12 text-base font-bold leading-6 text-white">
                    {movie.title}
                  </h4>

                  <p className="mt-2 text-xs text-zinc-500">
                    {movie.release_year} ·{" "}
                    {formatMinutes(movie.runtime_minutes)}
                  </p>

                  <div className="mt-5 min-h-[66px] border-t border-white/[0.06] pt-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      Watch these first
                    </p>

                    {prerequisiteTitles.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {prerequisiteTitles.map((title) => (
                          <span
                            key={title}
                            className="rounded-md bg-white/[0.04] px-2 py-1 text-[10px] text-zinc-400"
                          >
                            {title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-600">
                        No prerequisites
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditDialog(movie)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2.5 text-[11px] font-semibold text-zinc-400 transition hover:border-amber-400/30 hover:text-white"
                    >
                      <Edit3 size={13} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleWatched(movie)}
                      disabled={watchedMutation.isPending}
                      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[11px] font-semibold transition disabled:opacity-50 ${
                        movie.watched
                          ? "bg-zinc-400/[0.08] text-zinc-400 hover:bg-zinc-400/[0.14]"
                          : "bg-amber-400/[0.09] text-amber-300 hover:bg-amber-400/[0.15]"
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      {movie.watched
                        ? "Mark unwatched"
                        : "Mark watched"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      <MovieFormDialog
        open={dialogOpen}
        movies={movies}
        initialMovie={editingMovie}
        isSubmitting={saveMutation.isPending}
        serverError={
          saveMutation.error instanceof Error
            ? saveMutation.error.message
            : undefined
        }
        onClose={closeDialog}
        onSubmit={handleSave}
      />
    </div>
  );
}


function StatCard({
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
      <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-amber-400">
        {icon}
      </div>

      <p className="text-2xl font-bold tracking-tight text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-500">
        {label}
      </p>
    </div>
  );
}
