// TTL · Transactions + U1-B · Validation — region/city fields.
// Reusable Formik-connected selects fed by Utils/locations.js; used by the shipping address form.
import { useEffect, useState } from 'react';
import { getIn } from 'formik';
import { Autocomplete, TextField } from '@mui/material';
import {
    countryHasRegions,
    getCityNames,
    getCountryNames,
    getRegionNames,
    loadLocations,
} from '../../Utils/locations';

// Country > Region > City dropdowns. Picking a higher level clears the ones below it.
// formik is the form's useFormik() result with country, region and city values.
export default function LocationFields({ formik, rowClassName = 'checkout-row' }) {
    const [ready, setReady] = useState(false);

    // Reveal a field's error once it was blurred, or after any submit attempt
    const showError = (name) =>
        formik.submitCount > 0 || getIn(formik.touched, name) === true;
    const errorText = (name) => (showError(name) ? getIn(formik.errors, name) : undefined);

    useEffect(() => {
        let active = true;
        loadLocations().then(() => active && setReady(true));
        return () => {
            active = false;
        };
    }, []);

    const { country, region, city } = formik.values;
    const regions = ready ? getRegionNames(country) : [];
    const cities = ready ? getCityNames(country, region) : [];
    const needsRegion = ready && countryHasRegions(country);

    const pick = (changes) => formik.setValues({ ...formik.values, ...changes }, false);

    // Autocomplete passes its own htmlInput.onBlur, so chain ours onto it rather
    // than replacing it, otherwise the popup's blur handling breaks.
    const input =
        (name, label, extra = {}) =>
        (params) => {
            const htmlInput = params.slotProps?.htmlInput || {};
            return (
                <TextField
                    {...params}
                    label={label}
                    slotProps={{
                        ...params.slotProps,
                        htmlInput: {
                            ...htmlInput,
                            onBlur: (event) => {
                                htmlInput.onBlur?.(event);
                                formik.setFieldTouched(name, true);
                            },
                        },
                    }}
                    error={Boolean(errorText(name))}
                    helperText={errorText(name)}
                    {...extra}
                />
            );
        };

    return (
        <>
            <Autocomplete
                options={ready ? getCountryNames() : []}
                loading={!ready}
                value={country || null}
                onChange={(_, value) => pick({ country: value || '', region: '', city: '' })}
                autoHighlight
                renderInput={input('country', 'Country')}
            />
            <div className={rowClassName}>
                <Autocomplete
                    options={regions}
                    value={region || null}
                    disabled={!country || (ready && !needsRegion)}
                    onChange={(_, value) => pick({ region: value || '', city: '' })}
                    autoHighlight
                    renderInput={input('region', 'Region / Province')}
                />
                {cities.length > 0 || (needsRegion && !region) ? (
                    <Autocomplete
                        options={cities}
                        value={city || null}
                        disabled={!country || (needsRegion && !region)}
                        onChange={(_, value) => pick({ city: value || '' })}
                        autoHighlight
                        renderInput={input('city', 'City')}
                    />
                ) : (
                    // No city list for this place: let the person type it
                    <TextField
                        label="City"
                        name="city"
                        value={city}
                        disabled={!country}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={Boolean(errorText('city'))}
                        helperText={errorText('city')}
                    />
                )}
            </div>
        </>
    );
}
