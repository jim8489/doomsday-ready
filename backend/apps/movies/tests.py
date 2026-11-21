
from django.test import SimpleTestCase

from apps.movies.services.dependency_validation import (
    has_circular_dependency,
)


class CircularDependencyTests(SimpleTestCase):

    def test_empty_graph_has_no_cycle(self):
        self.assertFalse(
            has_circular_dependency({})
        )

    def test_valid_dependency_chain(self):
        dependencies = {
            "avengers": {"iron_man", "first_avenger"},
            "civil_war": {"avengers"},
            "infinity_war": {"civil_war"},
        }

        self.assertFalse(
            has_circular_dependency(dependencies)
        )

    def test_direct_cycle(self):
        dependencies = {
            "iron_man": {"avengers"},
            "avengers": {"iron_man"},
        }

        self.assertTrue(
            has_circular_dependency(dependencies)
        )

    def test_indirect_cycle(self):
        dependencies = {
            "iron_man": {"avengers"},
            "avengers": {"infinity_war"},
            "infinity_war": {"endgame"},
            "endgame": {"iron_man"},
        }

        self.assertTrue(
            has_circular_dependency(dependencies)
        )

    def test_self_dependency(self):
        dependencies = {
            "iron_man": {"iron_man"},
        }

        self.assertTrue(
            has_circular_dependency(dependencies)
        )

    def test_shared_prerequisite_is_not_a_cycle(self):
        dependencies = {
            "avengers": {"iron_man", "first_avenger"},
            "infinity_war": {"avengers", "ragnarok"},
            "endgame": {"infinity_war"},
        }

        self.assertFalse(
            has_circular_dependency(dependencies)
        )
from apps.movies.services.rewatch_order import (
    calculate_rewatch_order,
)


class RewatchOrderTests(SimpleTestCase):

    def setUp(self):
        self.dependencies = {
            "doomsday": {"endgame"},
            "endgame": {"infinity_war"},
            "infinity_war": {"civil_war", "ragnarok"},
            "civil_war": {"avengers"},
            "avengers": {"iron_man", "first_avenger"},
        }

        self.titles = {
            "doomsday": "Avengers: Doomsday",
            "endgame": "Avengers: Endgame",
            "infinity_war": "Avengers: Infinity War",
            "civil_war": "Captain America: Civil War",
            "avengers": "The Avengers",
            "iron_man": "Iron Man",
            "first_avenger": "Captain America: The First Avenger",
            "ragnarok": "Thor: Ragnarok",
        }

    def test_returns_all_prerequisites(self):
        result = calculate_rewatch_order(
            "doomsday",
            self.dependencies,
            self.titles,
        )

        self.assertEqual(len(result), 7)

        self.assertEqual(
            set(result),
            {
                "iron_man",
                "first_avenger",
                "avengers",
                "civil_war",
                "ragnarok",
                "infinity_war",
                "endgame",
            },
        )

    def test_target_is_excluded(self):
        result = calculate_rewatch_order(
            "doomsday",
            self.dependencies,
            self.titles,
        )

        self.assertNotIn("doomsday", result)

    def test_prerequisites_come_before_dependents(self):
        result = calculate_rewatch_order(
            "doomsday",
            self.dependencies,
            self.titles,
        )

        positions = {
            movie_id: index
            for index, movie_id in enumerate(result)
        }

        for dependent, prerequisites in self.dependencies.items():

            if dependent == "doomsday":
                continue

            for prerequisite in prerequisites:
                self.assertLess(
                    positions[prerequisite],
                    positions[dependent],
                )

    def test_empty_prerequisites(self):
        result = calculate_rewatch_order(
            "thor",
            {},
            {"thor": "Thor: Ragnarok"},
        )

        self.assertEqual(result, [])

    def test_shared_prerequisite_appears_once(self):
        dependencies = {
            "target": {"left", "right"},
            "left": {"foundation"},
            "right": {"foundation"},
        }

        titles = {
            "target": "Target",
            "left": "Left",
            "right": "Right",
            "foundation": "Foundation",
        }

        result = calculate_rewatch_order(
            "target",
            dependencies,
            titles,
        )

        self.assertEqual(
            result.count("foundation"),
            1,
        )

        self.assertEqual(len(result), 3)

    def test_order_is_deterministic(self):
        dependencies = {
            "target": {"zeta", "alpha"},
        }

        titles = {
            "target": "Target",
            "zeta": "Zeta",
            "alpha": "Alpha",
        }

        first = calculate_rewatch_order(
            "target",
            dependencies,
            titles,
        )

        second = calculate_rewatch_order(
            "target",
            dependencies,
            titles,
        )

        self.assertEqual(first, second)
        self.assertEqual(first, ["alpha", "zeta"])

    def test_cycle_involving_target_is_detected(self):
        dependencies = {
            "target": {"first"},
            "first": {"target"},
        }

        titles = {
            "target": "Target",
            "first": "First",
        }

        with self.assertRaises(ValueError):
            calculate_rewatch_order(
                "target",
                dependencies,
                titles,
            )

    def test_unknown_target_is_rejected(self):
        with self.assertRaises(KeyError):
            calculate_rewatch_order(
                "missing",
                {},
                {},
            )