
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Film,
  X,
  Save,
  AlertCircle,
} from "lucide-react";

import type { Movie } from "../../../types/api";

const movieSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Movie title is required.")
    .max(255, "Title cannot exceed 255 characters."),

  release_year: z
    .number()
    .int("Release year must be a whole number.")
    .min(1, "Enter a valid release year.")
    .max(9999, "Enter a valid release year."),

  runtime_minutes: z
    .number()
    .int("Runtime must be a whole number.")
    .min(1, "Runtime must be at least 1 minute.")
    .max(300, "Runtime cannot exceed 300 minutes."),

  prerequisites: z
    .array(z.string().uuid("Invalid movie identifier.")),
});

export type MovieFormValues = z.infer<typeof movieSchema>;

interface MovieFormDialogProps {
  open: boolean;
  movies: Movie[];
  initialMovie: Movie | null;
  isSubmitting: boolean;
  serverError?: string;
  onClose: () => void;
  onSubmit: (values: MovieFormValues) => void;
}

const EMPTY_FORM: MovieFormValues = {
  title: "",
  release_year: new Date().getFullYear(),
  runtime_minutes: 120,
  prerequisites: [],
};

export function MovieFormDialog({
  open,
  movies,
  initialMovie,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
}: MovieFormDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (!open) return;

    reset(
      initialMovie
        ? {
            title: initialMovie.title,
            release_year: initialMovie.release_year,
            runtime_minutes: initialMovie.runtime_minutes,
            prerequisites: [...initialMovie.prerequisites],
          }
        : EMPTY_FORM,
    );
  }, [open, initialMovie, reset]);

  if (!open) return null;

  const eligibleMovies = movies.filter(
    (movie) => movie.id !== initialMovie?.id,
  );

  const submit: SubmitHandler<MovieFormValues> = (values) => {
    onSubmit(values);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-dialog-title"
        className="flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121218] shadow-2xl shadow-black/50"
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
              <Film size={19} />
            </div>

            <div>
              <h2
                id="movie-dialog-title"
                className="text-base font-bold text-white"
              >
                {initialMovie ? "Edit movie" : "Add a movie"}
              </h2>
              <p className="mt-1 text-[11px] text-zinc-500">
                Manage movie information and prerequisites.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(submit)}
          className="overflow-y-auto"
          noValidate
        >
          <div className="space-y-6 p-6">
            {serverError && (
              <div
                role="alert"
                className="flex gap-3 rounded-xl border border-red-400/15 bg-red-400/[0.05] p-4"
              >
                <AlertCircle
                  size={18}
                  className="shrink-0 text-red-400"
                />
                <p className="text-xs leading-5 text-red-300">
                  {serverError}
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="movie-title"
                className="mb-2 block text-xs font-semibold text-zinc-400"
              >
                Movie title
              </label>

              <input
                id="movie-title"
                type="text"
                maxLength={255}
                placeholder="e.g. Avengers: Infinity War"
                {...register("title")}
                className="w-full rounded-xl border border-white/10 bg-[#09090d] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-amber-400/50"
              />

              {errors.title && (
                <p className="mt-2 text-xs text-red-400">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="release-year"
                  className="mb-2 block text-xs font-semibold text-zinc-400"
                >
                  Release year
                </label>

                <input
                  id="release-year"
                  type="number"
                  min={1}
                  max={9999}
                  step={1}
                  {...register("release_year", {
                    valueAsNumber: true,
                  })}
                  className="w-full rounded-xl border border-white/10 bg-[#09090d] px-4 py-3.5 text-sm text-white outline-none focus:border-amber-400/50"
                />

                {errors.release_year && (
                  <p className="mt-2 text-xs text-red-400">
                    {errors.release_year.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="runtime"
                  className="mb-2 block text-xs font-semibold text-zinc-400"
                >
                  Runtime (minutes)
                </label>

                <input
                  id="runtime"
                  type="number"
                  min={1}
                  max={300}
                  step={1}
                  {...register("runtime_minutes", {
                    valueAsNumber: true,
                  })}
                  className="w-full rounded-xl border border-white/10 bg-[#09090d] px-4 py-3.5 text-sm text-white outline-none focus:border-amber-400/50"
                />

                {errors.runtime_minutes && (
                  <p className="mt-2 text-xs text-red-400">
                    {errors.runtime_minutes.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="mb-3">
                <label className="text-xs font-semibold text-zinc-300">
                  Watch these movies first
                </label>
                <p className="mt-1 text-[11px] text-zinc-600">
                  Select all direct prerequisites. Shared prerequisites
                  are handled automatically.
                </p>
              </div>

              {eligibleMovies.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-5 text-center">
                  <p className="text-xs text-zinc-500">
                    Add other movies to create prerequisite relationships.
                  </p>
                </div>
              ) : (
                <Controller
                  control={control}
                  name="prerequisites"
                  render={({ field }) => (
                    <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-white/[0.07] bg-[#09090d] p-3">
                      {eligibleMovies.map((movie) => {
                        const selected = field.value.includes(movie.id);

                        return (
                          <label
                            key={movie.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                              selected
                                ? "border-amber-400/20 bg-amber-400/[0.06]"
                                : "border-transparent hover:bg-white/[0.03]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) => {
                                field.onChange(
                                  event.target.checked
                                    ? [...field.value, movie.id]
                                    : field.value.filter(
                                        (id) => id !== movie.id,
                                      ),
                                );
                              }}
                              className="h-4 w-4 accent-amber-400"
                            />

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold text-zinc-200">
                                {movie.title}
                              </span>
                              <span className="mt-1 block text-[10px] text-zinc-600">
                                {movie.release_year} · {movie.runtime_minutes} min
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />

              )}

              {errors.prerequisites && (
                <p className="mt-2 text-xs text-red-400">
                  {errors.prerequisites.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-white/10 px-5 py-3 text-xs font-semibold text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-xs font-bold text-black transition hover:bg-amber-300 disabled:opacity-50"
            >
              <Save size={15} />
              {isSubmitting
                ? "Saving..."
                : initialMovie
                  ? "Save changes"
                  : "Create movie"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
