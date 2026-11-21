
from django.urls import reverse

from rest_framework.test import APITestCase

from apps.cinemas.models import Cinema, CinemaBundle


class CinemaAPITests(APITestCase):

    def setUp(self):
        self.cinema = Cinema.objects.create(
            name="Star Cineplex",
        )

        CinemaBundle.objects.bulk_create([
            CinemaBundle(cinema=self.cinema, size=2),
            CinemaBundle(cinema=self.cinema, size=5),
        ])

    def test_create_cinema(self):
        response = self.client.post(
            reverse("cinema-list"),
            {
                "name": "Another Cinema",
                "bundle_sizes": [3, 6, 8],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.data["bundle_sizes"],
            [3, 6, 8],
        )

    def test_list_cinemas(self):
        response = self.client.get(
            reverse("cinema-list")
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_duplicate_bundle_sizes_are_rejected(self):
        response = self.client.post(
            reverse("cinema-list"),
            {
                "name": "Invalid Cinema",
                "bundle_sizes": [2, 2, 5],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_too_many_bundle_sizes_are_rejected(self):
        response = self.client.post(
            reverse("cinema-list"),
            {
                "name": "Invalid Cinema",
                "bundle_sizes": list(range(1, 12)),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_invalid_bundle_size_is_rejected(self):
        response = self.client.post(
            reverse("cinema-list"),
            {
                "name": "Invalid Cinema",
                "bundle_sizes": [2, 501],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_booking_quote(self):
        url = reverse(
            "cinema-booking",
            kwargs={"pk": self.cinema.pk},
        )

        response = self.client.get(
            url,
            {"groupSize": 11},
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["possible"])
        self.assertEqual(response.data["total_bundles"], 4)

    def test_impossible_booking(self):
    # Create a cinema with the assessment's impossible combination.
      cinema = Cinema.objects.create(
        name="Impossible Test Cinema",
    )

      CinemaBundle.objects.bulk_create([
        CinemaBundle(cinema=cinema, size=4),
        CinemaBundle(cinema=cinema, size=6),
    ])

      url = reverse(
        "cinema-booking",
        kwargs={"pk": cinema.pk},
    )

      response = self.client.get(
        url,
        {"groupSize": 7},
    )

      self.assertEqual(response.status_code, 200)
      self.assertFalse(response.data["possible"])
      self.assertIsNone(response.data["total_bundles"])
      self.assertEqual(response.data["bundles"], [])
    def test_missing_group_size(self):
        url = reverse(
            "cinema-booking",
            kwargs={"pk": self.cinema.pk},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, 400)

    def test_invalid_group_size(self):
        url = reverse(
            "cinema-booking",
            kwargs={"pk": self.cinema.pk},
        )

        response = self.client.get(
            url,
            {"groupSize": 10001},
        )

        self.assertEqual(response.status_code, 400)
