from django.urls import reverse

from rest_framework.test import APITestCase

from apps.movies.models import Movie, MovieDependency


class MovieAPITests(APITestCase):
    def setUp(self):
        self.iron_man = Movie.objects.create(
            title="Iron Man",
            release_year=2008,
            runtime_minutes=126,
        )
        self.avengers = Movie.objects.create(
            title="The Avengers",
            release_year=2012,
            runtime_minutes=143,
        )
        self.civil_war = Movie.objects.create(
            title="Captain America: Civil War",
            release_year=2016,
            runtime_minutes=147,
        )

    def detail_url(self, movie):
        return reverse("movie-detail", kwargs={"pk": movie.pk})

    def test_create_movie_defaults_to_unwatched(self):
        response = self.client.post(
            reverse("movie-list"),
            {
                "title": "Doctor Strange",
                "release_year": 2016,
                "runtime_minutes": 115,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertFalse(response.data["watched"])

    def test_titles_are_unique_case_insensitively(self):
        response = self.client.post(
            reverse("movie-list"),
            {
                "title": "iron man",
                "release_year": 2008,
                "runtime_minutes": 126,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("title", response.data)

    def test_patch_can_update_watched_status(self):
        response = self.client.patch(
            self.detail_url(self.iron_man),
            {"watched": True},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["watched"])

    def test_patch_can_set_prerequisites(self):
        response = self.client.patch(
            self.detail_url(self.avengers),
            {"prerequisites": [str(self.iron_man.pk)]},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            MovieDependency.objects.filter(
                dependent_movie=self.avengers,
                prerequisite_movie=self.iron_man,
            ).exists()
        )

    def test_omitting_prerequisites_preserves_existing_edges(self):
        MovieDependency.objects.create(
            dependent_movie=self.avengers,
            prerequisite_movie=self.iron_man,
        )

        response = self.client.patch(
            self.detail_url(self.avengers),
            {"watched": True},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            MovieDependency.objects.filter(
                dependent_movie=self.avengers,
                prerequisite_movie=self.iron_man,
            ).exists()
        )

    def test_empty_prerequisite_list_removes_existing_edges(self):
        MovieDependency.objects.create(
            dependent_movie=self.avengers,
            prerequisite_movie=self.iron_man,
        )

        response = self.client.patch(
            self.detail_url(self.avengers),
            {"prerequisites": []},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(
            MovieDependency.objects.filter(
                dependent_movie=self.avengers,
            ).exists()
        )

    def test_direct_self_dependency_returns_409(self):
        response = self.client.patch(
            self.detail_url(self.iron_man),
            {"prerequisites": [str(self.iron_man.pk)]},
            format="json",
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["code"], "CIRCULAR_DEPENDENCY")
        self.assertFalse(
            MovieDependency.objects.filter(
                dependent_movie=self.iron_man,
            ).exists()
        )

    def test_indirect_cycle_returns_409_and_rolls_back(self):
        # The Avengers already requires Iron Man. Making Iron Man require
        # The Avengers would create a two-node cycle.
        MovieDependency.objects.create(
            dependent_movie=self.avengers,
            prerequisite_movie=self.iron_man,
        )

        response = self.client.patch(
            self.detail_url(self.iron_man),
            {"prerequisites": [str(self.avengers.pk)]},
            format="json",
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["code"], "CIRCULAR_DEPENDENCY")
        self.assertEqual(MovieDependency.objects.count(), 1)
        self.assertTrue(
            MovieDependency.objects.filter(
                dependent_movie=self.avengers,
                prerequisite_movie=self.iron_man,
            ).exists()
        )
        self.assertFalse(
            MovieDependency.objects.filter(
                dependent_movie=self.iron_man,
            ).exists()
        )

    def test_retrieve_movie_by_id(self):
        response = self.client.get(self.detail_url(self.iron_man))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["id"], str(self.iron_man.pk))
        self.assertEqual(response.data["title"], "Iron Man")

    def test_delete_movie_removes_dependency_edges(self):
        MovieDependency.objects.create(
            dependent_movie=self.avengers,
            prerequisite_movie=self.iron_man,
        )

        response = self.client.delete(self.detail_url(self.iron_man))

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Movie.objects.filter(pk=self.iron_man.pk).exists())
        self.assertFalse(
            MovieDependency.objects.filter(
                dependent_movie=self.avengers,
                prerequisite_movie=self.iron_man,
            ).exists()
        )
