// TTL · Transactions — Philippine region/city data.
// Feeds the shipping address dropdowns via components/Common/LocationFields.jsx.
// Country > Region (state/province) > City data, loaded on demand because the dataset is large
let lib = null;
let loading = null;

export const loadLocations = () => {
    if (!loading) {
        loading = import('country-state-city').then((m) => {
            lib = m;
            return m;
        });
    }
    return loading;
};

const unique = (names) => [...new Set(names)].sort((a, b) => a.localeCompare(b));

export const getCountryNames = () =>
    lib ? unique(lib.Country.getAllCountries().map((c) => c.name)) : [];

const findCountry = (name) =>
    lib && name ? lib.Country.getAllCountries().find((c) => c.name === name) : null;

const findRegion = (countryName, regionName) => {
    const country = findCountry(countryName);
    if (!country || !regionName) return null;
    return lib.State.getStatesOfCountry(country.isoCode).find((s) => s.name === regionName) || null;
};

export const getRegionNames = (countryName) => {
    const country = findCountry(countryName);
    return country ? unique(lib.State.getStatesOfCountry(country.isoCode).map((s) => s.name)) : [];
};

// Cities of the chosen region. Countries without regions list their cities directly.
export const getCityNames = (countryName, regionName) => {
    const country = findCountry(countryName);
    if (!country) return [];
    if (getRegionNames(countryName).length === 0) {
        return unique(lib.City.getCitiesOfCountry(country.isoCode).map((c) => c.name));
    }
    const region = findRegion(countryName, regionName);
    return region
        ? unique(lib.City.getCitiesOfState(country.isoCode, region.isoCode).map((c) => c.name))
        : [];
};

// True once the data is loaded and the country has a list of regions to pick from
export const countryHasRegions = (countryName) => getRegionNames(countryName).length > 0;
