from django.urls import reverse

from rest_framework.test import APITestCase

from apps.movies.models import Movie, MovieDependency


class RewatchOrderAPITests(APITestCase):

    def setUp(self):

        self.iron_man = Movie.objects.create(
            title="Iron Man",
            release_year=2008,
            runtime_minutes=126,
            watched=True,
        )

        self.first_avenger = Movie.objects.create(
            title="Captain America: The First Avenger",
            release_year=2011,
            runtime_minutes=124,
            watched=True,
        )

        self.avengers = Movie.objects.create(
            title="The Avengers",
            release_year=2012,
            runtime_minutes=143,
            watched=False,
        )

        self.civil_war = Movie.objects.create(
            title="Captain America: Civil War",
            release_year=2016,
            runtime_minutes=147,
            watched=False,
        )

        self.ragnarok = Movie.objects.create(
            title="Thor: Ragnarok",
            release_year=2017,
            runtime_minutes=130,
            watched=True,
        )

        self.infinity_war = Movie.objects.create(
            title="Avengers: Infinity War",
            release_year=2018,
            runtime_minutes=149,
            watched=False,
        )

        self.endgame = Movie.objects.create(
            title="Avengers: Endgame",
            release_year=2019,
            runtime_minutes=181,
            watched=False,
        )

        self.doomsday = Movie.objects.create(
            title="Avengers: Doomsday",
            release_year=2026,
            runtime_minutes=165,
        )

        dependencies = [
            (self.avengers, self.iron_man),
            (self.avengers, self.first_avenger),
            (self.civil_war, self.avengers),
            (self.infinity_war, self.civil_war),
            (self.infinity_war, self.ragnarok),
            (self.endgame, self.infinity_war),
            (self.doomsday, self.endgame),
        ]

        MovieDependency.objects.bulk_create([
            MovieDependency(
                dependent_movie=dependent,
                prerequisite_movie=prerequisite,
            )
            for dependent, prerequisite in dependencies
        ])

    def test_rewatch_order_returns_all_prerequisites(self):

        url = reverse(
            "movie-rewatch-order",
            kwargs={"pk": self.doomsday.pk},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)

        self.assertEqual(response.data["total_movies"], 7)

        self.assertEqual(
            len(response.data["movies"]),
            7,
        )

        returned_ids = {
            movie["id"]
            for movie in response.data["movies"]
        }

        expected_ids = {
            str(self.iron_man.id),
            str(self.first_avenger.id),
            str(self.avengers.id),
            str(self.civil_war.id),
            str(self.ragnarok.id),
            str(self.infinity_war.id),
            str(self.endgame.id),
        }

        self.assertEqual(returned_ids, expected_ids)

        self.assertNotIn(
            str(self.doomsday.id),
            returned_ids,
        )

    def test_rewatch_statistics_are_correct(self):

        url = reverse(
            "movie-rewatch-order",
            kwargs={"pk": self.doomsday.pk},
        )

        response = self.client.get(url)

        self.assertEqual(response.data["watched_count"], 3)

        self.assertEqual(
            response.data["remaining_runtime_minutes"],
            620,
        )

    def test_movie_with_no_prerequisites_returns_empty_list(self):

        thor = Movie.objects.create(
            title="Thor: The Dark World",
            release_year=2013,
            runtime_minutes=112,
        )

        url = reverse(
            "movie-rewatch-order",
            kwargs={"pk": thor.pk},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["movies"], [])
        self.assertEqual(response.data["total_movies"], 0)
        self.assertEqual(response.data["watched_count"], 0)
        self.assertEqual(
            response.data["remaining_runtime_minutes"],
            0,
        )