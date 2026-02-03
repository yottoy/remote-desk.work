/**
 * State data for programmatic SEO pages
 * Each state includes unique facts, population data, and SEO-relevant information
 */

export interface StateInfo {
  slug: string;
  name: string;
  abbreviation: string;
  tier: 1 | 2 | 3; // Build priority
  fact: string;
  cities: string;
  population: string;
  remoteCulture: string;
  timeZone: string;
  taxInfo: string;
  keywords: string[];
  avgSearchVolume: {
    dataEntry: number;
    virtualAssistant: number;
    customerService: number;
    transcription: number;
    bookkeeping: number;
  };
}

export const STATES: Record<string, StateInfo> = {
  'texas': {
    slug: 'texas',
    name: 'Texas',
    abbreviation: 'TX',
    tier: 1,
    fact: 'As a state with no income tax, Texas remote workers keep more of their earnings compared to high-tax states like California or New York.',
    cities: 'Houston, Dallas, Austin, or smaller cities across the Lone Star State',
    population: '30 million (2nd largest US state)',
    remoteCulture: 'Texas has seen significant migration of remote workers, particularly in Austin\'s tech scene and Dallas\' business hub.',
    timeZone: 'Central Time Zone',
    taxInfo: 'No state income tax',
    keywords: ['no income tax', 'tech hub', 'Austin', 'Dallas', 'Houston', 'growing population'],
    avgSearchVolume: {
      dataEntry: 900,
      virtualAssistant: 600,
      customerService: 800,
      transcription: 300,
      bookkeeping: 350
    }
  },
  'california': {
    slug: 'california',
    name: 'California',
    abbreviation: 'CA',
    tier: 1,
    fact: 'With the largest population in the US (12% of Americans), California offers the highest absolute volume of remote work opportunities across all industries.',
    cities: 'Los Angeles, San Francisco, San Diego, or anywhere throughout the Golden State',
    population: '39 million (largest US state)',
    remoteCulture: 'California leads the nation in remote work adoption, with Silicon Valley companies pioneering work-from-anywhere policies.',
    timeZone: 'Pacific Time Zone',
    taxInfo: 'State income tax ranges from 1% to 13.3%',
    keywords: ['tech industry', 'Silicon Valley', 'largest population', 'worker protections', 'progressive policies'],
    avgSearchVolume: {
      dataEntry: 1200,
      virtualAssistant: 800,
      customerService: 1100,
      transcription: 450,
      bookkeeping: 550
    }
  },
  'florida': {
    slug: 'florida',
    name: 'Florida',
    abbreviation: 'FL',
    tier: 1,
    fact: 'Florida\'s lack of state income tax and rapid population growth (2.0% annually) make it an increasingly attractive destination for remote workers.',
    cities: 'Miami, Tampa, Orlando, Jacksonville, or the coastal communities throughout the Sunshine State',
    population: '22 million (3rd largest US state)',
    remoteCulture: 'Florida has become a top destination for remote workers seeking lower taxes, warm weather, and affordable living compared to northeastern states.',
    timeZone: 'Eastern Time Zone',
    taxInfo: 'No state income tax',
    keywords: ['no income tax', 'fastest growing', 'warm weather', 'coastal living', 'affordable'],
    avgSearchVolume: {
      dataEntry: 800,
      virtualAssistant: 500,
      customerService: 700,
      transcription: 280,
      bookkeeping: 320
    }
  },
  'new-york': {
    slug: 'new-york',
    name: 'New York',
    abbreviation: 'NY',
    tier: 1,
    fact: 'The NYC metropolitan area (8.4 million residents) has embraced remote work more than most major cities, with many companies maintaining permanent work-from-home policies.',
    cities: 'New York City, Buffalo, Rochester, Albany, or smaller communities throughout the Empire State',
    population: '19 million (4th largest US state)',
    remoteCulture: 'New York led the remote work revolution during 2020-2021, with Manhattan office occupancy still below pre-pandemic levels as companies embrace hybrid and remote models.',
    timeZone: 'Eastern Time Zone',
    taxInfo: 'State income tax ranges from 4% to 10.9%',
    keywords: ['NYC metro', 'financial services', 'media hub', 'diverse industries', 'high cost of living'],
    avgSearchVolume: {
      dataEntry: 750,
      virtualAssistant: 550,
      customerService: 650,
      transcription: 320,
      bookkeeping: 400
    }
  },
  'georgia': {
    slug: 'georgia',
    name: 'Georgia',
    abbreviation: 'GA',
    tier: 1,
    fact: 'Atlanta has emerged as a major tech hub and Fortune 500 headquarters location, creating strong demand for remote administrative and support roles.',
    cities: 'Atlanta, Savannah, Augusta, or growing communities throughout the Peach State',
    population: '11 million (8th largest US state)',
    remoteCulture: 'Georgia combines Southern affordability with big-city opportunities, making it attractive for remote workers seeking value and career growth.',
    timeZone: 'Eastern Time Zone',
    taxInfo: 'State income tax ranges from 1% to 5.75%',
    keywords: ['Atlanta hub', 'Fortune 500', 'affordable living', 'growing market', 'diverse economy'],
    avgSearchVolume: {
      dataEntry: 550,
      virtualAssistant: 350,
      customerService: 400,
      transcription: 200,
      bookkeeping: 200
    }
  },
  'north-carolina': {
    slug: 'north-carolina',
    name: 'North Carolina',
    abbreviation: 'NC',
    tier: 2,
    fact: 'The Research Triangle (Raleigh-Durham-Chapel Hill) is one of America\'s largest research parks, creating a educated workforce ideal for remote knowledge work.',
    cities: 'Raleigh, Charlotte, Durham, or the growing communities throughout the Tar Heel State',
    population: '10.7 million (9th largest US state)',
    remoteCulture: 'North Carolina has seen an influx of remote workers drawn by its combination of good weather, lower cost of living than the Northeast, and strong education system.',
    timeZone: 'Eastern Time Zone',
    taxInfo: 'Flat state income tax of 4.75%',
    keywords: ['Research Triangle', 'tech growth', 'affordable', 'educated workforce', 'quality of life'],
    avgSearchVolume: {
      dataEntry: 500,
      virtualAssistant: 300,
      customerService: 350,
      transcription: 180,
      bookkeeping: 180
    }
  },
  'pennsylvania': {
    slug: 'pennsylvania',
    name: 'Pennsylvania',
    abbreviation: 'PA',
    tier: 2,
    fact: 'Pennsylvania\'s central East Coast location and diverse economy (healthcare, education, finance) create steady demand for remote administrative positions.',
    cities: 'Philadelphia, Pittsburgh, Harrisburg, or communities throughout the Keystone State',
    population: '13 million (5th largest US state)',
    remoteCulture: 'Pennsylvania offers East Coast access without the extreme cost of living found in New York and New Jersey, attracting remote workers seeking affordability.',
    timeZone: 'Eastern Time Zone',
    taxInfo: 'Flat state income tax of 3.07%',
    keywords: ['Philadelphia metro', 'Pittsburgh tech', 'healthcare hub', 'affordable East Coast', 'diverse industries'],
    avgSearchVolume: {
      dataEntry: 450,
      virtualAssistant: 280,
      customerService: 320,
      transcription: 160,
      bookkeeping: 170
    }
  },
  'ohio': {
    slug: 'ohio',
    name: 'Ohio',
    abbreviation: 'OH',
    tier: 2,
    fact: 'Columbus ranks as one of America\'s best cities for remote workers, with affordable living costs and a growing tech sector.',
    cities: 'Columbus, Cleveland, Cincinnati, or communities throughout the Buckeye State',
    population: '11.8 million (7th largest US state)',
    remoteCulture: 'Ohio offers Midwest affordability combined with major metro amenities, making it increasingly popular with remote workers leaving coastal cities.',
    timeZone: 'Eastern Time Zone',
    taxInfo: 'State income tax ranges from 0% to 3.99%',
    keywords: ['Columbus growth', 'affordable living', 'central location', 'diverse economy', 'tech sector'],
    avgSearchVolume: {
      dataEntry: 420,
      virtualAssistant: 260,
      customerService: 300,
      transcription: 150,
      bookkeeping: 160
    }
  },
  'illinois': {
    slug: 'illinois',
    name: 'Illinois',
    abbreviation: 'IL',
    tier: 2,
    fact: 'Chicago\'s diverse economy (finance, healthcare, technology, logistics) creates abundant opportunities for remote administrative professionals.',
    cities: 'Chicago, Springfield, or communities throughout the Prairie State',
    population: '12.6 million (6th largest US state)',
    remoteCulture: 'Illinois benefits from Chicago\'s status as a major business hub, with many companies offering remote positions to tap into the metro area\'s skilled workforce.',
    timeZone: 'Central Time Zone',
    taxInfo: 'Flat state income tax of 4.95%',
    keywords: ['Chicago metro', 'finance hub', 'logistics center', 'diverse economy', 'Central time zone'],
    avgSearchVolume: {
      dataEntry: 400,
      virtualAssistant: 250,
      customerService: 280,
      transcription: 140,
      bookkeeping: 150
    }
  },
  'michigan': {
    slug: 'michigan',
    name: 'Michigan',
    abbreviation: 'MI',
    tier: 2,
    fact: 'Detroit leads the nation with 8% of jobs being fully remote, the highest rate among major US cities.',
    cities: 'Detroit, Grand Rapids, Ann Arbor, or communities throughout the Great Lakes State',
    population: '10 million (10th largest US state)',
    remoteCulture: 'Michigan has embraced remote work more than most states, with Detroit\'s economic transformation driving a remote-first culture.',
    timeZone: 'Eastern Time Zone',
    taxInfo: 'Flat state income tax of 4.25%',
    keywords: ['Detroit remote leader', 'affordable', 'Great Lakes', 'automotive industry', 'tech transformation'],
    avgSearchVolume: {
      dataEntry: 380,
      virtualAssistant: 240,
      customerService: 270,
      transcription: 130,
      bookkeeping: 140
    }
  },
  'arizona': {
    slug: 'arizona',
    name: 'Arizona',
    abbreviation: 'AZ',
    tier: 3,
    fact: 'Phoenix is one of America\'s fastest-growing metropolitan areas, attracting remote workers with year-round sunshine and affordable living.',
    cities: 'Phoenix, Tucson, Scottsdale, or growing communities throughout the Grand Canyon State',
    population: '7.4 million (14th largest US state)',
    remoteCulture: 'Arizona has become a Sun Belt destination for remote workers leaving California, offering lower costs and favorable business climate.',
    timeZone: 'Mountain Time Zone (no DST)',
    taxInfo: 'State income tax ranges from 2.55% to 4.5%',
    keywords: ['Phoenix growth', 'Sun Belt', 'affordable', 'warm weather', 'California exodus'],
    avgSearchVolume: {
      dataEntry: 350,
      virtualAssistant: 220,
      customerService: 250,
      transcription: 120,
      bookkeeping: 130
    }
  },
  'colorado': {
    slug: 'colorado',
    name: 'Colorado',
    abbreviation: 'CO',
    tier: 3,
    fact: 'Colorado boasts the nation\'s highest remote work rate at 37.34%, with Denver leading the work-from-anywhere movement.',
    cities: 'Denver, Colorado Springs, Boulder, or mountain communities throughout the Centennial State',
    population: '5.8 million (21st largest US state)',
    remoteCulture: 'Colorado pioneered remote work policies and maintains the highest concentration of remote workers in America, driven by quality-of-life priorities.',
    timeZone: 'Mountain Time Zone',
    taxInfo: 'Flat state income tax of 4.4%',
    keywords: ['highest remote rate', 'Denver tech', 'quality of life', 'outdoor lifestyle', 'educated workforce'],
    avgSearchVolume: {
      dataEntry: 330,
      virtualAssistant: 210,
      customerService: 240,
      transcription: 110,
      bookkeeping: 120
    }
  },
  'virginia': {
    slug: 'virginia',
    name: 'Virginia',
    abbreviation: 'VA',
    tier: 3,
    fact: 'Virginia\'s proximity to Washington D.C. and concentration of government contractors creates strong demand for remote administrative professionals with security clearances.',
    cities: 'Virginia Beach, Norfolk, Richmond, or communities throughout the Old Dominion',
    population: '8.6 million (12th largest US state)',
    remoteCulture: 'Virginia\'s tech corridor and government sector have embraced remote work, particularly for administrative and data-focused roles.',
    timeZone: 'Eastern Time Zone',
    taxInfo: 'State income tax ranges from 2% to 5.75%',
    keywords: ['DC proximity', 'government contractors', 'tech corridor', 'security clearances', 'diverse economy'],
    avgSearchVolume: {
      dataEntry: 320,
      virtualAssistant: 200,
      customerService: 230,
      transcription: 105,
      bookkeeping: 115
    }
  },
  'washington': {
    slug: 'washington',
    name: 'Washington',
    abbreviation: 'WA',
    tier: 3,
    fact: 'Seattle\'s concentration of tech giants (Amazon, Microsoft) has made Washington a leader in remote work policies and opportunities.',
    cities: 'Seattle, Spokane, Tacoma, or communities throughout the Evergreen State',
    population: '7.7 million (13th largest US state)',
    remoteCulture: 'Washington state leads the West Coast in remote work adoption, with Seattle companies pioneering permanent remote-first policies.',
    timeZone: 'Pacific Time Zone',
    taxInfo: 'No state income tax',
    keywords: ['Seattle tech', 'no income tax', 'Microsoft', 'Amazon', 'Pacific Northwest', 'remote pioneer'],
    avgSearchVolume: {
      dataEntry: 310,
      virtualAssistant: 195,
      customerService: 220,
      transcription: 100,
      bookkeeping: 110
    }
  },
  'tennessee': {
    slug: 'tennessee',
    name: 'Tennessee',
    abbreviation: 'TN',
    tier: 3,
    fact: 'Tennessee offers no state income tax and Nashville\'s booming economy, attracting remote workers seeking Southern affordability with urban amenities.',
    cities: 'Nashville, Memphis, Knoxville, or communities throughout the Volunteer State',
    population: '7 million (16th largest US state)',
    remoteCulture: 'Tennessee has seen significant remote worker migration, particularly to Nashville, driven by its combination of no income tax, affordable living, and cultural amenities.',
    timeZone: 'Central Time Zone',
    taxInfo: 'No state income tax (on earned income)',
    keywords: ['no income tax', 'Nashville growth', 'affordable', 'music city', 'Southern living'],
    avgSearchVolume: {
      dataEntry: 300,
      virtualAssistant: 190,
      customerService: 210,
      transcription: 95,
      bookkeeping: 105
    }
  }
};

// Helper arrays for easy iteration
export const TIER_1_STATES = Object.values(STATES).filter(s => s.tier === 1);
export const TIER_2_STATES = Object.values(STATES).filter(s => s.tier === 2);
export const TIER_3_STATES = Object.values(STATES).filter(s => s.tier === 3);
export const ALL_STATES = Object.values(STATES);
export const STATE_SLUGS = Object.keys(STATES);
