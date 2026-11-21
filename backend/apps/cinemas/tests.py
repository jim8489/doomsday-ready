
from django.test import SimpleTestCase

from apps.cinemas.services.booking_optimizer import (
    calculate_booking_quote,
)


class BookingOptimizerTests(SimpleTestCase):

    def test_first_assessment_example(self):
        result = calculate_booking_quote(
            [1, 3, 4],
            6,
        )

        self.assertTrue(result["possible"])
        self.assertEqual(result["total_bundles"], 2)

        self.assertEqual(
            result["bundles"],
            [{"size": 3, "count": 2}],
        )

    def test_second_assessment_example(self):
        result = calculate_booking_quote(
            [2, 5],
            11,
        )

        self.assertTrue(result["possible"])
        self.assertEqual(result["total_bundles"], 4)

        self.assertEqual(
            {
                item["size"]: item["count"]
                for item in result["bundles"]
            },
            {
                5: 1,
                2: 3,
            },
        )

    def test_third_assessment_example(self):
        result = calculate_booking_quote(
            [6, 9, 20],
            44,
        )

        self.assertTrue(result["possible"])
        self.assertEqual(result["total_bundles"], 4)

        self.assertEqual(
            {
                item["size"]: item["count"]
                for item in result["bundles"]
            },
            {
                20: 1,
                9: 2,
                6: 1,
            },
        )

    def test_impossible_combination(self):
        result = calculate_booking_quote(
            [4, 6],
            7,
        )

        self.assertFalse(result["possible"])
        self.assertIsNone(result["total_bundles"])
        self.assertEqual(result["bundles"], [])

    def test_exact_single_bundle(self):
        result = calculate_booking_quote(
            [2, 5, 8],
            8,
        )

        self.assertEqual(result["total_bundles"], 1)
        self.assertEqual(
            result["bundles"],
            [{"size": 8, "count": 1}],
        )

    def test_bundle_larger_than_group(self):
        result = calculate_booking_quote(
            [5, 8],
            3,
        )

        self.assertFalse(result["possible"])

    def test_large_group_size(self):
        result = calculate_booking_quote(
            [1, 5],
            10_000,
        )

        self.assertTrue(result["possible"])
        self.assertEqual(result["total_bundles"], 2_000)
        self.assertEqual(
            result["bundles"],
            [{"size": 5, "count": 2_000}],
        )

    def test_invalid_group_size(self):
        for group_size in [0, -1, 10_001, 5.5, True]:
            with self.subTest(group_size=group_size):
                with self.assertRaises(ValueError):
                    calculate_booking_quote(
                        [2, 5],
                        group_size,
                    )

    def test_invalid_bundle_size(self):
        for sizes in [
            [],
            [0, 2],
            [501],
            [2, 2],
            list(range(1, 12)),
        ]:
            with self.subTest(bundle_sizes=sizes):
                with self.assertRaises(ValueError):
                    calculate_booking_quote(sizes, 10)
