from django.core.management import call_command
from django.test import TestCase

from apps.cinemas.models import Cinema
from apps.movies.models import Movie, MovieDependency
from apps.movies.services.rewatch_service import build_rewatch_plan


class DemoDataCommandTests(TestCase):
    def test_seed_creates_doomsday_graph_and_assessment_cinemas(self):
        call_command("seed_demo_data")

        target = Movie.objects.get(title="Avengers: Doomsday")
        plan = build_rewatch_plan(target)

        self.assertEqual(plan["total_movies"], 7)
        self.assertEqual(plan["watched_count"], 3)
        self.assertEqual(plan["remaining_runtime_minutes"], 620)
        self.assertNotIn(target, plan["movies"])

        self.assertEqual(Movie.objects.count(), 8)
        self.assertEqual(MovieDependency.objects.count(), 7)

        cinema_examples = {
            cinema.name: cinema.bundle_sizes
            for cinema in Cinema.objects.prefetch_related("bundles")
        }
        self.assertEqual(
            cinema_examples,
            {
                "Cinema Alpha": [1, 3, 4],
                "Cinema Beta": [2, 5],
                "Cinema Gamma": [6, 9, 20],
                "Grand Cinema": [4, 6],
            },
        )

    def test_seed_is_idempotent_and_preserves_existing_watched_state(self):
        call_command("seed_demo_data")
        iron_man = Movie.objects.get(title="Iron Man")
        iron_man.watched = False
        iron_man.save(update_fields=["watched", "updated_at"])

        call_command("seed_demo_data")

        self.assertEqual(Movie.objects.count(), 8)
        self.assertEqual(MovieDependency.objects.count(), 7)
        self.assertEqual(Cinema.objects.count(), 4)
        iron_man.refresh_from_db()
        self.assertFalse(iron_man.watched)
