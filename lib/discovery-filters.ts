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

/** Shared All sentinel — pills show ALL */
export const ALL_OPTION: FilterOption = {
  value: "all",
  label: "All",
  code: "ALL",
};

const COUNTRY_OPTIONS: FilterOption[] = [
  { value: "afghanistan", label: "Afghanistan", code: "AF" },
  { value: "algeria", label: "Algeria", code: "DZ" },
  { value: "argentina", label: "Argentina", code: "AR" },
  { value: "australia", label: "Australia", code: "AU" },
  { value: "austria", label: "Austria", code: "AT" },
  { value: "bahrain", label: "Bahrain", code: "BH" },
  { value: "bangladesh", label: "Bangladesh", code: "BD" },
  { value: "belgium", label: "Belgium", code: "BE" },
  { value: "brazil", label: "Brazil", code: "BR" },
  { value: "canada", label: "Canada", code: "CA" },
  { value: "chile", label: "Chile", code: "CL" },
  { value: "china", label: "China", code: "CN" },
  { value: "colombia", label: "Colombia", code: "CO" },
  { value: "denmark", label: "Denmark", code: "DK" },
  { value: "egypt", label: "Egypt", code: "EG" },
  { value: "finland", label: "Finland", code: "FI" },
  { value: "france", label: "France", code: "FR" },
  { value: "germany", label: "Germany", code: "DE" },
  { value: "ghana", label: "Ghana", code: "GH" },
  { value: "greece", label: "Greece", code: "GR" },
  { value: "hong-kong", label: "Hong Kong", code: "HK" },
  { value: "india", label: "India", code: "IN" },
  { value: "indonesia", label: "Indonesia", code: "ID" },
  { value: "iraq", label: "Iraq", code: "IQ" },
  { value: "ireland", label: "Ireland", code: "IE" },
  { value: "italy", label: "Italy", code: "IT" },
  { value: "japan", label: "Japan", code: "JP" },
  { value: "jordan", label: "Jordan", code: "JO" },
  { value: "kenya", label: "Kenya", code: "KE" },
  { value: "kuwait", label: "Kuwait", code: "KW" },
  { value: "lebanon", label: "Lebanon", code: "LB" },
  { value: "libya", label: "Libya", code: "LY" },
  { value: "malaysia", label: "Malaysia", code: "MY" },
  { value: "mexico", label: "Mexico", code: "MX" },
  { value: "morocco", label: "Morocco", code: "MA" },
  { value: "netherlands", label: "Netherlands", code: "NL" },
  { value: "new-zealand", label: "New Zealand", code: "NZ" },
  { value: "nigeria", label: "Nigeria", code: "NG" },
  { value: "norway", label: "Norway", code: "NO" },
  { value: "oman", label: "Oman", code: "OM" },
  { value: "pakistan", label: "Pakistan", code: "PK" },
  { value: "philippines", label: "Philippines", code: "PH" },
  { value: "poland", label: "Poland", code: "PL" },
  { value: "portugal", label: "Portugal", code: "PT" },
  { value: "qatar", label: "Qatar", code: "QA" },
  { value: "romania", label: "Romania", code: "RO" },
  { value: "saudi-arabia", label: "Saudi Arabia", code: "SA" },
  { value: "singapore", label: "Singapore", code: "SG" },
  { value: "south-africa", label: "South Africa", code: "ZA" },
  { value: "south-korea", label: "South Korea", code: "KR" },
  { value: "spain", label: "Spain", code: "ES" },
  { value: "sri-lanka", label: "Sri Lanka", code: "LK" },
  { value: "sweden", label: "Sweden", code: "SE" },
  { value: "switzerland", label: "Switzerland", code: "CH" },
  { value: "taiwan", label: "Taiwan", code: "TW" },
  { value: "thailand", label: "Thailand", code: "TH" },
  { value: "tunisia", label: "Tunisia", code: "TN" },
  { value: "turkey", label: "Turkey", code: "TR" },
  { value: "uae", label: "United Arab Emirates", code: "AE" },
  { value: "ukraine", label: "Ukraine", code: "UA" },
  { value: "united-kingdom", label: "United Kingdom", code: "UK" },
  { value: "united-states", label: "United States", code: "US" },
  { value: "vietnam", label: "Vietnam", code: "VN" },
];

/** Major cities A–Z per country (users + extras for cascade demo) */
export const CITIES_BY_COUNTRY: Record<string, FilterOption[]> = {
  australia: [
    { value: "melbourne", label: "Melbourne", code: "MEL" },
    { value: "sydney", label: "Sydney", code: "SYD" },
  ],
  canada: [
    { value: "toronto", label: "Toronto", code: "YYZ" },
    { value: "vancouver", label: "Vancouver", code: "YVR" },
  ],
  egypt: [{ value: "cairo", label: "Cairo", code: "CAI" }],
  malaysia: [
    { value: "kuala-lumpur", label: "Kuala Lumpur", code: "KUL" },
  ],
  pakistan: [
    { value: "islamabad", label: "Islamabad", code: "ISB" },
    { value: "karachi", label: "Karachi", code: "KHI" },
    { value: "lahore", label: "Lahore", code: "LHE" },
  ],
  qatar: [{ value: "doha", label: "Doha", code: "DOH" }],
  "saudi-arabia": [
    { value: "jeddah", label: "Jeddah", code: "JED" },
    { value: "riyadh", label: "Riyadh", code: "RUH" },
  ],
  singapore: [{ value: "singapore", label: "Singapore", code: "SIN" }],
  turkey: [{ value: "istanbul", label: "Istanbul", code: "IST" }],
  uae: [
    { value: "abu-dhabi", label: "Abu Dhabi", code: "AUH" },
    { value: "dubai", label: "Dubai", code: "DXB" },
  ],
  "united-kingdom": [
    { value: "london", label: "London", code: "LON" },
    { value: "manchester", label: "Manchester", code: "MAN" },
  ],
  "united-states": [
    { value: "chicago", label: "Chicago", code: "CHI" },
    { value: "houston", label: "Houston", code: "HOU" },
    { value: "new-york", label: "New York", code: "NYC" },
  ],
};

const GENDER_OPTIONS: FilterOption[] = [
  ALL_OPTION,
  { value: "men", label: "Men", code: "M" },
  { value: "women", label: "Women", code: "W" },
];

const AGE_OPTIONS: FilterOption[] = [
  ALL_OPTION,
  { value: "18-24", label: "18–24", code: "18-24" },
  { value: "25-34", label: "25–34", code: "25-34" },
  { value: "35-44", label: "35–44", code: "35-44" },
];

function sortAlpha(options: FilterOption[]): FilterOption[] {
  return [...options].sort((a, b) => a.label.localeCompare(b.label));
}

function sortAllFirst(options: FilterOption[]): FilterOption[] {
  const all = options.filter((o) => o.value === "all");
  const rest = options
    .filter((o) => o.value !== "all")
    .sort((a, b) => a.label.localeCompare(b.label));
  return [...all, ...rest];
}

/** City wheel options for active country */
export function getCityOptions(country: string): FilterOption[] {
  if (country === "all") {
    const seen = new Map<string, FilterOption>();
    for (const cities of Object.values(CITIES_BY_COUNTRY)) {
      for (const city of cities) {
        if (!seen.has(city.value)) seen.set(city.value, city);
      }
    }
    return [ALL_OPTION, ...sortAlpha([...seen.values()])];
  }
  const cities = CITIES_BY_COUNTRY[country] ?? [];
  return [ALL_OPTION, ...sortAlpha(cities)];
}

const ALL_CITIES: FilterOption[] = (() => {
  const seen = new Map<string, FilterOption>();
  for (const cities of Object.values(CITIES_BY_COUNTRY)) {
    for (const city of cities) {
      if (!seen.has(city.value)) seen.set(city.value, city);
    }
  }
  return sortAlpha([...seen.values()]);
})();

export const FILTER_OPTIONS: Record<FilterKey, FilterOption[]> = {
  city: [ALL_OPTION, ...ALL_CITIES],
  country: sortAllFirst([ALL_OPTION, ...COUNTRY_OPTIONS]),
  gender: GENDER_OPTIONS,
  age: AGE_OPTIONS,
};

export const DEFAULT_FILTERS: DiscoveryFilters = {
  city: "all",
  country: "all",
  gender: "all",
  age: "all",
};

export const FILTER_KEYS: FilterKey[] = ["country", "city", "gender", "age"];

export function getFilterOption(
  key: FilterKey,
  value: string,
): FilterOption | undefined {
  if (key === "city") {
    if (value === "all") return ALL_OPTION;
    return ALL_CITIES.find((o) => o.value === value);
  }
  return FILTER_OPTIONS[key].find((o) => o.value === value);
}

export function getFilterCode(key: FilterKey, value: string): string {
  return getFilterOption(key, value)?.code ?? value;
}

export function getFilterLabel(key: FilterKey, value: string): string {
  return getFilterOption(key, value)?.label ?? value;
}

/** Apply filter change; reset city→all when country cascade invalidates it */
export function applyFilterChange(
  filters: DiscoveryFilters,
  key: FilterKey,
  value: string,
): DiscoveryFilters {
  const next: DiscoveryFilters = { ...filters, [key]: value };
  if (key === "country") {
    const cityOk = getCityOptions(value).some((o) => o.value === next.city);
    if (!cityOk) next.city = "all";
  }
  return next;
}

/** Meta location: city label, else country, else All */
export function getFilterMetaLabel(filters: DiscoveryFilters): string {
  if (filters.city !== "all") return getFilterLabel("city", filters.city);
  if (filters.country !== "all")
    return getFilterLabel("country", filters.country);
  return "All";
}
