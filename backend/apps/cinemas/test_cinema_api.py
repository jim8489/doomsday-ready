from django.urls import reverse

from rest_framework.test import APITestCase

from apps.cinemas.models import Cinema, CinemaBundle


class CinemaAPITests(APITestCase):
    def setUp(self):
        self.cinema = Cinema.objects.create(name="Grand Cinema")
        CinemaBundle.objects.bulk_create(
            [
                CinemaBundle(cinema=self.cinema, size=4),
                CinemaBundle(cinema=self.cinema, size=6),
            ]
        )

    def booking_url(self, cinema, group_size=None):
        url = reverse("cinema-booking", kwargs={"pk": cinema.pk})
        if group_size is not None:
            return f"{url}?groupSize={group_size}"
        return url

    def test_create_cinema_with_bundle_sizes(self):
        response = self.client.post(
            reverse("cinema-list"),
            {"name": "City Multiplex", "bundle_sizes": [2, 5, 8]},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["bundle_sizes"], [2, 5, 8])

    def test_list_cinemas(self):
        response = self.client.get(reverse("cinema-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Grand Cinema")
        self.assertEqual(response.data[0]["bundle_sizes"], [4, 6])

    def test_cinema_names_are_unique_case_insensitively(self):
        response = self.client.post(
            reverse("cinema-list"),
            {"name": "grand cinema", "bundle_sizes": [2, 5]},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.data)

    def test_duplicate_bundle_sizes_are_rejected(self):
        response = self.client.post(
            reverse("cinema-list"),
            {"name": "Duplicate Bundles", "bundle_sizes": [2, 2]},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("bundle_sizes", response.data)

    def test_booking_uses_minimum_exact_bundle_count(self):
        cinema = Cinema.objects.create(name="City Multiplex")
        CinemaBundle.objects.bulk_create(
            [
                CinemaBundle(cinema=cinema, size=2),
                CinemaBundle(cinema=cinema, size=5),
            ]
        )

        response = self.client.get(self.booking_url(cinema, 11))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["possible"])
        self.assertEqual(response.data["total_bundles"], 4)
        self.assertEqual(
            response.data["bundles"],
            [
                {"size": 5, "count": 1},
                {"size": 2, "count": 3},
            ],
        )

    def test_booking_reports_no_exact_solution(self):
        response = self.client.get(self.booking_url(self.cinema, 7))

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["possible"])
        self.assertIsNone(response.data["total_bundles"])
        self.assertEqual(response.data["bundles"], [])

    def test_booking_requires_group_size(self):
        response = self.client.get(self.booking_url(self.cinema))

        self.assertEqual(response.status_code, 400)
        self.assertIn("groupSize", response.data)

    def test_booking_rejects_invalid_group_size(self):
        for group_size in (0, 10_001, "not-a-number"):
            with self.subTest(group_size=group_size):
                response = self.client.get(
                    self.booking_url(self.cinema, group_size)
                )
                self.assertEqual(response.status_code, 400)
