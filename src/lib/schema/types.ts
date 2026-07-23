import type { PlaceTranslation } from "@/lib/seo";

export const REVIEW_THRESHOLD = 3;

export type SchemaPageType =
  | "home"
  | "country"
  | "city"
  | "attraction"
  | "trip";

export type SchemaOrgType =
  | "WebSite"
  | "Organization"
  | "WebPage"
  | "CollectionPage"
  | "BreadcrumbList"
  | "ListItem"
  | "ItemList"
  | "TouristDestination"
  | "Country"
  | "City"
  | "TouristAttraction"
  | "Place"
  | "Castle"
  | "Bridge"
  | "Waterfall"
  | "Museum"
  | "Park"
  | "NationalPark"
  | "Beach"
  | "Island"
  | "Mountain"
  | "Zoo"
  | "Aquarium"
  | "BotanicalGarden"
  | "SkiResort"
  | "BodyOfWater"
  | "LandmarksOrHistoricalBuildings"
  | "Church"
  | "FAQPage"
  | "Question"
  | "Answer"
  | "Review"
  | "AggregateRating"
  | "Rating"
  | "ImageObject"
  | "GeoCoordinates"
  | "PostalAddress"
  | "OpeningHoursSpecification"
  | "Trip"
  | "TouristTrip"
  | "SearchAction"
  | "EntryPoint"
  | "Person"
  | "ContactPoint"
  | "Brand";

export type SchemaTypeArray = SchemaOrgType[];

export interface JsonLdNode {
  "@type": SchemaOrgType | SchemaTypeArray;
  "@id"?: string;
  [key: string]: unknown;
}

export interface JsonLdGraph {
  "@context": "https://schema.org";
  "@graph": JsonLdNode[];
}

export interface AttractionEntity {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  type?: string;
  tags?: string[];
  lat?: number | null;
  lng?: number | null;
  image_url?: string | null;
  imageUrl?: string | null;
  openingHours?: string | string[];
  address?: string;
  seoKeywords?: string[];
  translations?: Record<
    string,
    Partial<PlaceTranslation> & {
      maps_query?: string;
      maps_url?: string;
    }
  >;
}

export interface ItineraryStop {
  name: string;
  description?: string;
  day?: number;
  lat?: number | null;
  lng?: number | null;
  entityUrl?: string;
  category?: string;
  type?: string;
  tags?: string[];
  imageUrl?: string;
}

export interface SchemaBreadcrumbItem {
  name: string;
  url: string;
}

export interface SchemaFaqItem {
  question: string;
  answer: string;
}

export interface SchemaReviewInput {
  authorName?: string | null;
  rating: number;
  title?: string | null;
  body?: string | null;
  date?: string | null;
}

export interface SchemaAggregateRatingInput {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

export interface SchemaImageInput {
  url: string;
  width?: number;
  height?: number;
  caption?: string;
  creator?: string | { name: string };
}

export interface SchemaMetadataInput {
  title: string;
  description: string;
  path: string;
  locale: string;
  image?: string;
  keywords?: string[];
  ogType?: "website" | "article";
  noIndex?: boolean;
}

export interface HomeSchemaData {
  locale: string;
  title?: string;
  description?: string;
}

export interface CountrySchemaData {
  locale: string;
  country: string;
  countrySlug: string;
  description: string;
  coverImage?: string;
  title?: string;
  cities: {
    name: string;
    slug: string;
    coverImage?: string;
    placeCount?: number;
  }[];
  breadcrumbs?: SchemaBreadcrumbItem[];
  faqs?: SchemaFaqItem[];
}

export interface CitySchemaData {
  locale: string;
  country: string;
  city: string;
  countrySlug: string;
  citySlug: string;
  description: string;
  title?: string;
  heroImage?: string;
  intro?: string;
  keywords?: string[];
  places: AttractionEntity[];
  breadcrumbs?: SchemaBreadcrumbItem[];
  faqs?: SchemaFaqItem[];
}

export interface AttractionSchemaData {
  locale: string;
  country: string;
  city: string;
  countrySlug: string;
  citySlug: string;
  placeSlug: string;
  place: AttractionEntity;
  description: string;
  title?: string;
  heroImage?: string;
  breadcrumbs?: SchemaBreadcrumbItem[];
  faqs?: SchemaFaqItem[];
  reviews?: SchemaReviewInput[];
  aggregateRating?: SchemaAggregateRatingInput;
}

export interface TripSchemaData {
  locale: string;
  country: string;
  countrySlug: string;
  title: string;
  description: string;
  heroImage?: string;
  totalDays?: number;
  stops: ItineraryStop[];
  breadcrumbs?: SchemaBreadcrumbItem[];
  faqs?: SchemaFaqItem[];
}

export type ViaPinsSchemaInput =
  | HomeSchemaData
  | CountrySchemaData
  | CitySchemaData
  | AttractionSchemaData
  | TripSchemaData;

export interface SchemaEngineResult {
  jsonLd: JsonLdGraph;
  canonicalUrl: string;
  webpageId: string;
  entityId: string;
}
