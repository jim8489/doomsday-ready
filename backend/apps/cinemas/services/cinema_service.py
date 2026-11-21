
from django.db import IntegrityError, transaction

from apps.cinemas.models import Cinema, CinemaBundle


class DuplicateCinemaNameError(Exception):
    """Raised when a cinema name already exists."""


def create_cinema(name, bundle_sizes):
    """
    Create a cinema and all its bundle sizes atomically.

    Bundle count and range validation are repeated here
    so the service remains safe when called outside the API.
    """

    name = name.strip()
    sizes = list(bundle_sizes)

    if not name:
        raise ValueError("Cinema name cannot be empty.")

    if not 1 <= len(sizes) <= 10:
        raise ValueError(
            "A cinema must have between 1 and 10 bundle sizes."
        )

    if any(
        type(size) is not int or not 1 <= size <= 500
        for size in sizes
    ):
        raise ValueError(
            "Bundle sizes must be integers between 1 and 500."
        )

    if len(sizes) != len(set(sizes)):
        raise ValueError("Duplicate bundle sizes are not allowed.")

    try:
        with transaction.atomic():
            cinema = Cinema.objects.create(name=name)

            CinemaBundle.objects.bulk_create([
                CinemaBundle(
                    cinema=cinema,
                    size=size,
                )
                for size in sizes
            ])

            return Cinema.objects.prefetch_related(
                "bundles"
            ).get(pk=cinema.pk)

    except IntegrityError as error:
        cause = error.__cause__
        diagnostic = getattr(cause, "diag", None)
        constraint = getattr(
            diagnostic,
            "constraint_name",
            None,
        )

        if constraint == "uq_cinema_name_ci":
            raise DuplicateCinemaNameError(
                "A cinema with this name already exists."
            ) from error

        raise
