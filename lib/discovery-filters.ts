export type FilterKey = "city" | "country" | "gender" | "age";

export type FilterOption = {
  value: string;
  label: string;
  code: string;
};

export type DiscoveryFilters = Record<FilterKey, string>;

export const FILTER_TITLES: Record<FilterKey, string> = {
  city: "City",
  country: "Country",
  gender: "Gender",
  age: "Age Group",
};

const CITY_OPTIONS: FilterOption[] = [
  { value: "dubai", label: "Dubai", code: "DXB" },
  { value: "islamabad", label: "Islamabad", code: "ISB" },
  { value: "karachi", label: "Karachi", code: "KHI" },
  { value: "lahore", label: "Lahore", code: "LHE" },
  { value: "london", label: "London", code: "LON" },
  { value: "riyadh", label: "Riyadh", code: "RUH" },
];

const COUNTRY_OPTIONS: FilterOption[] = [
  { value: "australia", label: "Australia", code: "AU" },
  { value: "canada", label: "Canada", code: "CA" },
  { value: "germany", label: "Germany", code: "DE" },
  { value: "india", label: "India", code: "IN" },
  { value: "pakistan", label: "Pakistan", code: "PK" },
  { value: "qatar", label: "Qatar", code: "QA" },
  { value: "saudi-arabia", label: "Saudi Arabia", code: "SA" },
  { value: "singapore", label: "Singapore", code: "SG" },
  { value: "turkey", label: "Turkey", code: "TR" },
  { value: "uae", label: "UAE", code: "AE" },
  { value: "united-kingdom", label: "United Kingdom", code: "UK" },
  { value: "united-states", label: "United States", code: "US" },
];

const GENDER_OPTIONS: FilterOption[] = [
  { value: "any", label: "Any", code: "ANY" },
  { value: "men", label: "Men", code: "M" },
  { value: "women", label: "Women", code: "W" },
];

const AGE_OPTIONS: FilterOption[] = [
  { value: "any", label: "Any", code: "ANY" },
  { value: "18-24", label: "18-24", code: "18-24" },
  { value: "25-34", label: "25-34", code: "25-34" },
  { value: "35-44", label: "35-44", code: "35-44" },
];

function sortAlpha(options: FilterOption[]): FilterOption[] {
  return [...options].sort((a, b) => a.label.localeCompare(b.label));
}

function sortAnyFirst(options: FilterOption[]): FilterOption[] {
  const any = options.filter((o) => o.value === "any");
  const rest = options
    .filter((o) => o.value !== "any")
    .sort((a, b) => a.label.localeCompare(b.label));
  return [...any, ...rest];
}

export const FILTER_OPTIONS: Record<FilterKey, FilterOption[]> = {
  city: sortAlpha(CITY_OPTIONS),
  country: sortAlpha(COUNTRY_OPTIONS),
  gender: sortAnyFirst(GENDER_OPTIONS),
  age: sortAnyFirst(AGE_OPTIONS),
};

export const DEFAULT_FILTERS: DiscoveryFilters = {
  city: "lahore",
  country: "pakistan",
  gender: "any",
  age: "any",
};

export const FILTER_KEYS: FilterKey[] = ["city", "country", "gender", "age"];

export function getFilterOption(
  key: FilterKey,
  value: string,
): FilterOption | undefined {
  return FILTER_OPTIONS[key].find((o) => o.value === value);
}

export function getFilterCode(key: FilterKey, value: string): string {
  return getFilterOption(key, value)?.code ?? value;
}

export function getFilterLabel(key: FilterKey, value: string): string {
  return getFilterOption(key, value)?.label ?? value;
}
