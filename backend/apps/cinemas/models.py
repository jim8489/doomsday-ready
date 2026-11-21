import uuid

from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.db.models import Q
from django.db.models.functions import Lower


class Cinema(models.Model):
    """
    Represents a cinema that offers opening-night seat bundles.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    name = models.CharField(
        max_length=200,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ("name", "id")

        constraints = [
            models.UniqueConstraint(
                Lower("name"),
                name="uq_cinema_name_ci",
            ),
        ]
    @property
    def bundle_sizes(self):
        return [
            bundle.size
            for bundle in self.bundles.all()
        ]

    def __str__(self):
        return self.name


class CinemaBundle(models.Model):
    """
    Represents one available opening-night seat bundle size.

    Example:
    Cinema: Star Cineplex
    Bundle sizes: 2, 5, 8
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    cinema = models.ForeignKey(
        Cinema,
        on_delete=models.CASCADE,
        related_name="bundles",
        db_index=False,
    )

    size = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(500),
        ],
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ("size", "id")

        constraints = [
            models.UniqueConstraint(
                fields=("cinema", "size"),
                name="uq_cinema_bundle_size",
            ),
            models.CheckConstraint(
                condition=(
                    Q(size__gte=1)
                    & Q(size__lte=500)
                ),
                name="ck_cinema_bundle_range",
            ),
        ]

    def __str__(self):
        return f"{self.cinema.name} - {self.size} seats"