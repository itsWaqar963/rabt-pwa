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
  { value: "abu-dhabi", label: "Abu Dhabi", code: "AUH" },
  { value: "cairo", label: "Cairo", code: "CAI" },
  { value: "chicago", label: "Chicago", code: "CHI" },
  { value: "doha", label: "Doha", code: "DOH" },
  { value: "dubai", label: "Dubai", code: "DXB" },
  { value: "houston", label: "Houston", code: "HOU" },
  { value: "istanbul", label: "Istanbul", code: "IST" },
  { value: "islamabad", label: "Islamabad", code: "ISB" },
  { value: "jeddah", label: "Jeddah", code: "JED" },
  { value: "karachi", label: "Karachi", code: "KHI" },
  { value: "kuala-lumpur", label: "Kuala Lumpur", code: "KUL" },
  { value: "lahore", label: "Lahore", code: "LHE" },
  { value: "london", label: "London", code: "LON" },
  { value: "manchester", label: "Manchester", code: "MAN" },
  { value: "new-york", label: "New York", code: "NYC" },
  { value: "riyadh", label: "Riyadh", code: "RUH" },
  { value: "singapore", label: "Singapore", code: "SIN" },
  { value: "sydney", label: "Sydney", code: "SYD" },
  { value: "toronto", label: "Toronto", code: "YYZ" },
  { value: "vancouver", label: "Vancouver", code: "YVR" },
];

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

const GENDER_OPTIONS: FilterOption[] = [
  { value: "any", label: "Any", code: "ANY" },
  { value: "men", label: "Men", code: "M" },
  { value: "women", label: "Women", code: "W" },
];

const AGE_OPTIONS: FilterOption[] = [
  { value: "any", label: "Any", code: "ANY" },
  { value: "18-24", label: "18–24", code: "18-24" },
  { value: "25-34", label: "25–34", code: "25-34" },
  { value: "35-44", label: "35–44", code: "35-44" },
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
