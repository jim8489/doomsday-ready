
from django.db import IntegrityError, connection, transaction

from apps.movies.models import Movie, MovieDependency

from .dependency_validation import has_circular_dependency


class CircularDependencyError(Exception):
    """Raised when a movie update introduces a dependency cycle."""


class DuplicateMovieTitleError(Exception):
    """Raised when a case-insensitive duplicate title is created."""


UNSET = object()

# All dependency mutations acquire the same transaction-level lock.
# This prevents concurrent dependency updates from introducing cycles.
LOCK_NAMESPACE = 1_146_045_517
LOCK_ID = 1


def _acquire_dependency_lock():
    if connection.vendor != "postgresql":
        raise RuntimeError(
            "Dependency mutations require PostgreSQL advisory locks."
        )

    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT pg_advisory_xact_lock(%s, %s)",
            [LOCK_NAMESPACE, LOCK_ID],
        )


def _get_dependency_graph():
    """
    Load the complete dependency graph from PostgreSQL.
    """

    graph = {}

    edges = MovieDependency.objects.values_list(
        "dependent_movie_id",
        "prerequisite_movie_id",
    )

    for dependent_id, prerequisite_id in edges:
        graph.setdefault(dependent_id, set()).add(
            prerequisite_id
        )

    return graph


def _replace_prerequisites(movie, prerequisites):
    """
    Validate and replace a movie's prerequisite relationships.

    Must be called inside a transaction after acquiring the
    dependency graph advisory lock.
    """

    prerequisite_ids = {
        prerequisite.pk
        for prerequisite in prerequisites
    }

    graph = _get_dependency_graph()

    # Evaluate the complete proposed graph before writing edges.
    graph[movie.pk] = prerequisite_ids

    if has_circular_dependency(graph):
        raise CircularDependencyError(
            "This prerequisite would create a circular dependency."
        )

    # Replace the old relationships atomically.
    MovieDependency.objects.filter(
        dependent_movie=movie
    ).delete()

    MovieDependency.objects.bulk_create(
        [
            MovieDependency(
                dependent_movie=movie,
                prerequisite_movie_id=prerequisite_id,
            )
            for prerequisite_id in prerequisite_ids
        ]
    )


def _get_constraint_name(error):
    cause = error.__cause__
    diagnostic = getattr(cause, "diag", None)

    return getattr(diagnostic, "constraint_name", None)


def _handle_integrity_error(error):
    if _get_constraint_name(error) == "uq_movie_title_ci":
        raise DuplicateMovieTitleError(
            "A movie with this title already exists."
        ) from error

    raise error


def create_movie(validated_data):
    """
    Create a movie and its optional prerequisite relationships.
    """

    data = dict(validated_data)
    prerequisites = data.pop("prerequisites", [])

    try:
        with transaction.atomic():

            movie = Movie.objects.create(**data)

            if prerequisites:
                _acquire_dependency_lock()
                _replace_prerequisites(movie, prerequisites)

            return movie

    except IntegrityError as error:
        _handle_integrity_error(error)


def update_movie(movie, validated_data):
    """
    Update movie fields and optionally replace prerequisites.

    If prerequisites are omitted, existing relationships remain
    unchanged. An empty prerequisite list removes all relationships.
    """

    data = dict(validated_data)
    prerequisites = data.pop("prerequisites", UNSET)

    try:
        with transaction.atomic():

            locked_movie = Movie.objects.select_for_update().get(
                pk=movie.pk
            )

            if prerequisites is not UNSET:
                _acquire_dependency_lock()

                _replace_prerequisites(
                    locked_movie,
                    prerequisites,
                )

            for field, value in data.items():
                setattr(locked_movie, field, value)

            if data:
                locked_movie.save(
                    update_fields=[
                        *data.keys(),
                        "updated_at",
                    ]
                )

            return locked_movie

    except IntegrityError as error:
        _handle_integrity_error(error)
