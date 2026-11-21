from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.cinemas.models import Cinema, CinemaBundle
from apps.movies.models import Movie, MovieDependency
from apps.movies.services.dependency_validation import has_circular_dependency


# These values deliberately match the assessment's rewatch API example.
# Avengers: Doomsday is scheduled for 2026. Its 165-minute runtime is a
# pre-release listing and should be treated as provisional/editable demo data.
MOVIES = [
    {
        "title": "Iron Man",
        "release_year": 2008,
        "runtime_minutes": 126,
        "watched": True,
    },
    {
        "title": "Captain America: The First Avenger",
        "release_year": 2011,
        "runtime_minutes": 124,
        "watched": True,
    },
    {
        "title": "The Avengers",
        "release_year": 2012,
        "runtime_minutes": 143,
        "watched": False,
    },
    {
        "title": "Captain America: Civil War",
        "release_year": 2016,
        "runtime_minutes": 147,
        "watched": False,
    },
    {
        "title": "Thor: Ragnarok",
        "release_year": 2017,
        "runtime_minutes": 130,
        "watched": True,
    },
    {
        "title": "Avengers: Infinity War",
        "release_year": 2018,
        "runtime_minutes": 149,
        "watched": False,
    },
    {
        "title": "Avengers: Endgame",
        "release_year": 2019,
        "runtime_minutes": 181,
        "watched": False,
    },
    {
        "title": "Avengers: Doomsday",
        "release_year": 2026,
        "runtime_minutes": 165,
        "watched": False,
    },
]

# Relationship direction: dependent movie -> prerequisite movie.
# This is a simplified assessment/demo graph, not an official MCU watch order.
DEPENDENCIES = [
    ("The Avengers", "Iron Man"),
    ("The Avengers", "Captain America: The First Avenger"),
    ("Captain America: Civil War", "The Avengers"),
    ("Avengers: Infinity War", "Captain America: Civil War"),
    ("Avengers: Infinity War", "Thor: Ragnarok"),
    ("Avengers: Endgame", "Avengers: Infinity War"),
    ("Avengers: Doomsday", "Avengers: Endgame"),
]

# These four records make every numeric booking example directly testable
# from the Booking page after the demo data has been loaded.
CINEMAS = [
    {"name": "Cinema Alpha", "bundle_sizes": [1, 3, 4]},
    {"name": "Cinema Beta", "bundle_sizes": [2, 5]},
    {"name": "Cinema Gamma", "bundle_sizes": [6, 9, 20]},
    {"name": "Grand Cinema", "bundle_sizes": [4, 6]},
]


class Command(BaseCommand):
    help = (
        "Create the editable Avengers: Doomsday rewatch example and "
        "the cinema bundle examples. Existing records are not overwritten."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--if-empty",
            action="store_true",
            help=(
                "Seed movies only when the movie table is empty, and "
                "cinemas only when the cinema table is empty."
            ),
        )

    @transaction.atomic
    def handle(self, *args, **options):
        seed_movies = not options["if_empty"] or not Movie.objects.exists()
        seed_cinemas = not options["if_empty"] or not Cinema.objects.exists()

        if seed_movies:
            movies_by_title = {}
            created_movies = 0

            for movie_data in MOVIES:
                title = movie_data["title"]
                movie, created = Movie.objects.get_or_create(
                    title__iexact=title,
                    defaults=movie_data,
                )
                movies_by_title[title] = movie
                created_movies += int(created)

            # Validate the proposed additions against all existing edges
            # before writing any of the demo relationships.
            graph = {}
            for dependent_id, prerequisite_id in MovieDependency.objects.values_list(
                "dependent_movie_id", "prerequisite_movie_id"
            ):
                graph.setdefault(dependent_id, set()).add(prerequisite_id)

            for dependent_title, prerequisite_title in DEPENDENCIES:
                dependent = movies_by_title[dependent_title]
                prerequisite = movies_by_title[prerequisite_title]
                graph.setdefault(dependent.pk, set()).add(prerequisite.pk)

            if has_circular_dependency(graph):
                raise CommandError(
                    "The current movie graph already conflicts with the "
                    "demo relationships. No demo dependencies were added. "
                    "Review existing prerequisites before seeding again."
                )

            dependency_objects = [
                MovieDependency(
                    dependent_movie=movies_by_title[dependent_title],
                    prerequisite_movie=movies_by_title[prerequisite_title],
                )
                for dependent_title, prerequisite_title in DEPENDENCIES
            ]
            MovieDependency.objects.bulk_create(
                dependency_objects,
                ignore_conflicts=True,
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f"Movie demo data ready: {len(MOVIES)} titles "
                    f"({created_movies} newly created), "
                    f"{len(DEPENDENCIES)} sample prerequisite links ensured."
                )
            )
        else:
            self.stdout.write(
                "Movie table is not empty; --if-empty skipped movie demo data."
            )

        if seed_cinemas:
            created_cinemas = 0
            created_bundles = 0

            for cinema_data in CINEMAS:
                cinema, created = Cinema.objects.get_or_create(
                    name__iexact=cinema_data["name"],
                    defaults={"name": cinema_data["name"]},
                )
                created_cinemas += int(created)

                for size in cinema_data["bundle_sizes"]:
                    _, bundle_created = CinemaBundle.objects.get_or_create(
                        cinema=cinema,
                        size=size,
                    )
                    created_bundles += int(bundle_created)

            self.stdout.write(
                self.style.SUCCESS(
                    f"Cinema demo data ready: {len(CINEMAS)} examples "
                    f"({created_cinemas} newly created), "
                    f"{created_bundles} bundle records newly created."
                )
            )
        else:
            self.stdout.write(
                "Cinema table is not empty; --if-empty skipped cinema demo data."
            )
