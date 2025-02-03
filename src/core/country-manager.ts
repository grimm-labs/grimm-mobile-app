export type CountryData = {
  currency: string[];
  callingCode: string[];
  region: string;
  subregion: string;
  flag: string;
  name: {
    common: string;
    [key: string]: string;
  };
};

export type CountryItem = {
  code: string;
  name: string;
  flag: string;
  callingCode: string;
};

type CountriesJSON = { [key: string]: CountryData };

export class CountryManager {
  private countries: CountriesJSON;

  constructor(countries: CountriesJSON) {
    this.countries = countries;
  }

  getAllCountries(): CountryItem[] {
    return Object.entries(this.countries).map(([code, data]) => ({
      code,
      name: data.name.common,
      flag: data.flag,
      callingCode: data.callingCode[0] || '',
    }));
  }

  getCountryByCode(code: string): CountryData | null {
    return this.countries[code] || null;
  }

  searchCountryByName(
    name: string
  ): { code: string; name: string; flag: string; callingCode: string }[] {
    return Object.entries(this.countries)
      .filter(([_, data]) =>
        data.name.common.toLowerCase().includes(name.toLowerCase())
      )
      .map(([code, data]) => ({
        code,
        name: data.name.common,
        flag: data.flag,
        callingCode: data.callingCode[0] || '',
      }));
  }

  getCallingCodeByCountry(code: string): string | null {
    return this.countries[code]?.callingCode[0] || null;
  }

  getFlagByCountry(code: string): string | null {
    return this.countries[code]?.flag || null;
  }

  getCountriesByRegion(
    region: string
  ): { code: string; name: string; flag: string; callingCode: string }[] {
    return Object.entries(this.countries)
      .filter(([_, data]) => data.region.toLowerCase() === region.toLowerCase())
      .map(([code, data]) => ({
        code,
        name: data.name.common,
        flag: data.flag,
        callingCode: data.callingCode[0] || '',
      }));
  }
}
