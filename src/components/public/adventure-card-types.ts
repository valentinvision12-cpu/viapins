export interface AdventureCardSummary {
  country: string;
  slug: string;
  /** @deprecated use CountryFlag component */
  flag?: string;
  subtitle: string;
  stopCount: number;
  totalDays: number;
  /** Hero or first-stop image URL; empty if none */
  coverImage: string;
}
