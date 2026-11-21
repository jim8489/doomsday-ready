from apps.movies.models import Movie, MovieDependency

from .rewatch_order import calculate_rewatch_order


def build_rewatch_plan(target):
    """
    Build a complete rewatch plan for a target movie.

    Loads movie information and dependency edges in two queries,
    then delegates graph processing to the pure algorithm.
    """

    all_movies = list(
        Movie.objects.only(
            "id",
            "title",
            "release_year",
            "runtime_minutes",
            "watched",
        )
    )

    movies_by_id = {
        movie.id: movie
        for movie in all_movies
    }

    # Initialize an adjacency list for every movie.
    prerequisites_by_movie = {
        movie.id: set()
        for movie in all_movies
    }

    # Load all dependency edges without N+1 queries.
    dependencies = MovieDependency.objects.values_list(
        "dependent_movie_id",
        "prerequisite_movie_id",
    )

    for dependent_id, prerequisite_id in dependencies:
        prerequisites_by_movie[dependent_id].add(
            prerequisite_id
        )

    title_by_id = {
        movie.id: movie.title
        for movie in all_movies
    }

    ordered_ids = calculate_rewatch_order(
        target_id=target.id,
        prerequisites_by_movie=prerequisites_by_movie,
        title_by_id=title_by_id,
    )

    ordered_movies = [
        movies_by_id[movie_id]
        for movie_id in ordered_ids
    ]

    watched_count = sum(
        1 for movie in ordered_movies if movie.watched
    )

    remaining_runtime = sum(
        movie.runtime_minutes
        for movie in ordered_movies
        if not movie.watched
    )

    return {
        "target": movies_by_id[target.id],
        "movies": ordered_movies,
        "total_movies": len(ordered_movies),
        "watched_count": watched_count,
        "remaining_runtime_minutes": remaining_runtime,
    }