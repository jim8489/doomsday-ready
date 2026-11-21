
export interface Movie {
    id: string;
    title: string;
    release_year: number;
    runtime_minutes: number;
    watched: boolean;
    prerequisites: string[];
    created_at: string;
    updated_at: string;
  }
  
  export interface RewatchMovie {
    id: string;
    title: string;
    release_year: number;
    runtime_minutes: number;
    watched: boolean;
  }
  
  export interface RewatchPlan {
    target: RewatchMovie;
    movies: RewatchMovie[];
    total_movies: number;
    watched_count: number;
    remaining_runtime_minutes: number;
  }
  
  export interface Cinema {
    id: string;
    name: string;
    bundle_sizes: number[];
    created_at: string;
    updated_at: string;
  }
  
  export interface BundleAllocation {
    size: number;
    count: number;
  }
  
  export interface BookingQuote {
    possible: boolean;
    group_size: number;
    total_bundles: number | null;
    bundles: BundleAllocation[];
  }
  
  export interface ApiErrorPayload {
    code?: string;
    detail?: string;
    [key: string]: unknown;
  }
  