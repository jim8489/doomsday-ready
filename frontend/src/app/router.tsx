import type { ReactNode } from "react";
import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import { DashboardLayout } from "../components/layout/DashboardLayout";

const MoviesPage = lazy(() =>
  import("../features/movies/pages/MoviesPage").then(
    (module) => ({ default: module.MoviesPage }),
  ),
);

const RewatchPage = lazy(() =>
  import("../features/rewatch/pages/RewatchPage").then(
    (module) => ({ default: module.RewatchPage }),
  ),
);

const BookingPage = lazy(() =>
  import("../features/booking/pages/BookingPage").then(
    (module) => ({ default: module.BookingPage }),
  ),
);

function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-400/20 border-t-amber-400" />
        <p className="mt-4 text-xs text-zinc-500">
          Loading your workspace...
        </p>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="py-24 text-center">
      <h2 className="text-3xl font-bold text-white">
        Page not found
      </h2>
      <p className="mt-3 text-sm text-zinc-500">
        The requested page does not exist.
      </p>
      <a
        href="/movies"
        className="mt-6 inline-block text-sm font-semibold text-amber-400"
      >
        Return to Movies
      </a>
    </div>
  );
}

function loadPage(element: ReactNode) {
  return (
    <Suspense fallback={<PageLoading />}>
      {element}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/movies" replace />,
      },
      {
        path: "movies",
        element: loadPage(<MoviesPage />),
      },
      {
        path: "rewatch",
        element: loadPage(<RewatchPage />),
      },
      {
        path: "booking",
        element: loadPage(<BookingPage />),
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
