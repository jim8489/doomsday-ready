import uuid

from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.db.models import F, Q
from django.db.models.functions import Lower


class Movie(models.Model):
    """
    Represents an MCU movie or another movie in the rewatch collection.

    Prerequisites are represented through MovieDependency.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    title = models.CharField(
        max_length=255,
    )

    release_year = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1)],
    )

    runtime_minutes = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(300),
        ],
    )

    watched = models.BooleanField(
        default=False,
    )

    prerequisites = models.ManyToManyField(
        "self",
        through="MovieDependency",
        through_fields=(
            "dependent_movie",
            "prerequisite_movie",
        ),
        symmetrical=False,
        related_name="dependents",
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ("title", "id")

        constraints = [
            models.UniqueConstraint(
                Lower("title"),
                name="uq_movie_title_ci",
            ),
            models.CheckConstraint(
                condition=Q(release_year__gte=1),
                name="ck_movie_year_positive",
            ),
            models.CheckConstraint(
                condition=(
                    Q(runtime_minutes__gte=1)
                    & Q(runtime_minutes__lte=300)
                ),
                name="ck_movie_runtime_range",
            ),
        ]

    def __str__(self):
        return f"{self.title} ({self.release_year})"


class MovieDependency(models.Model):
    """
    Represents a directed prerequisite relationship.

    dependent_movie -> prerequisite_movie

    Example:
    The Avengers -> Iron Man
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    dependent_movie = models.ForeignKey(
        Movie,
        on_delete=models.CASCADE,
        related_name="dependency_edges",
        db_index=False,
    )

    prerequisite_movie = models.ForeignKey(
        Movie,
        on_delete=models.CASCADE,
        related_name="prerequisite_edges",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = (
            "dependent_movie_id",
            "prerequisite_movie_id",
        )

        constraints = [
            models.UniqueConstraint(
                fields=(
                    "dependent_movie",
                    "prerequisite_movie",
                ),
                name="uq_movie_dependency_pair",
            ),
            models.CheckConstraint(
                condition=~Q(
                    dependent_movie_id=F("prerequisite_movie_id")
                ),
                name="ck_movie_no_self_dependency",
            ),
        ]

    def __str__(self):
        return (
            f"{self.dependent_movie.title} "
            f"requires {self.prerequisite_movie.title}"
        )