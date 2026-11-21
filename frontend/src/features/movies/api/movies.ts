
import { apiRequest } from "../../../lib/api-client";
import type { Movie } from "../../../types/api";

export interface MovieWritePayload {
  title: string;
  release_year: number;
  runtime_minutes: number;
  prerequisites: string[];
}

export async function getMovies(): Promise<Movie[]> {
  return apiRequest<Movie[]>("/movies/");
}

export async function createMovie(
  payload: MovieWritePayload,
): Promise<Movie> {
  return apiRequest<Movie>("/movies/", {
    method: "POST",
    body: payload,
  });
}

export async function updateMovie(
  id: string,
  payload: Partial<MovieWritePayload> & { watched?: boolean },
): Promise<Movie> {
  return apiRequest<Movie>(`/movies/${id}/`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteMovie(id: string): Promise<void> {
  await apiRequest<void>(`/movies/${id}/`, {
    method: "DELETE",
  });
}
