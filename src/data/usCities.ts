// Comprehensive list of US cities by state for location search & autocomplete.
// Covers all 50 states + DC with their largest / most-searched cities.

export type USCity = { city: string; state: string }

export const US_STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
}

const CITIES_BY_STATE: Record<string, string[]> = {
  AL: ['Birmingham', 'Montgomery', 'Huntsville', 'Mobile', 'Tuscaloosa', 'Hoover', 'Auburn', 'Dothan', 'Decatur', 'Gulf Shores'],
  AK: ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan', 'Wasilla', 'Kodiak', 'Seward', 'Homer', 'Palmer'],
  AZ: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale', 'Chandler', 'Glendale', 'Tempe', 'Gilbert', 'Flagstaff', 'Sedona', 'Yuma', 'Peoria'],
  AR: ['Little Rock', 'Fayetteville', 'Fort Smith', 'Springdale', 'Jonesboro', 'Hot Springs', 'Bentonville', 'Conway', 'Rogers', 'Eureka Springs'],
  CA: ['Los Angeles', 'San Diego', 'San Francisco', 'San Jose', 'Sacramento', 'Long Beach', 'Oakland', 'Fresno', 'Santa Monica', 'Pasadena', 'Anaheim', 'Berkeley', 'Malibu', 'Palm Springs', 'Napa', 'Santa Barbara', 'Beverly Hills', 'Newport Beach', 'Carmel', 'Lake Tahoe', 'Huntington Beach', 'Venice', 'Burbank', 'Glendale', 'Irvine', 'Santa Cruz'],
  CO: ['Denver', 'Colorado Springs', 'Aurora', 'Boulder', 'Fort Collins', 'Aspen', 'Vail', 'Breckenridge', 'Telluride', 'Durango', 'Pueblo', 'Estes Park'],
  CT: ['Hartford', 'New Haven', 'Stamford', 'Bridgeport', 'Norwalk', 'Greenwich', 'Mystic', 'New London', 'Danbury', 'Waterbury'],
  DE: ['Wilmington', 'Dover', 'Newark', 'Rehoboth Beach', 'Lewes', 'Middletown', 'Bear', 'Smyrna'],
  FL: ['Miami', 'Miami Beach', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'St. Petersburg', 'Key West', 'Sarasota', 'Naples', 'Tallahassee', 'St. Augustine', 'Daytona Beach', 'Clearwater', 'Pensacola', 'Gainesville', 'West Palm Beach', 'Boca Raton', 'Destin', 'Fort Myers', 'Coral Gables', 'Hollywood', 'Delray Beach', 'Panama City Beach'],
  GA: ['Atlanta', 'Savannah', 'Augusta', 'Columbus', 'Macon', 'Athens', 'Sandy Springs', 'Roswell', 'Marietta', 'Tybee Island', 'Alpharetta'],
  HI: ['Honolulu', 'Hilo', 'Kailua', 'Kapolei', 'Lahaina', 'Kaanapali', 'Waikiki', 'Kihei', 'Wailea', 'Princeville', 'Kona'],
  ID: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello', 'Coeur d\'Alene', 'Twin Falls', 'Sun Valley', 'Ketchum', 'Sandpoint'],
  IL: ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Springfield', 'Peoria', 'Elgin', 'Champaign', 'Evanston', 'Oak Park', 'Galena'],
  IN: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Bloomington', 'Fishers', 'Lafayette', 'Gary', 'Muncie'],
  IA: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Iowa City', 'Sioux City', 'Ames', 'Dubuque', 'Council Bluffs', 'Waterloo'],
  KS: ['Wichita', 'Overland Park', 'Kansas City', 'Topeka', 'Lawrence', 'Olathe', 'Manhattan', 'Salina', 'Dodge City'],
  KY: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington', 'Frankfort', 'Paducah', 'Richmond'],
  LA: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles', 'Metairie', 'Alexandria', 'Monroe'],
  ME: ['Portland', 'Bangor', 'Augusta', 'Bar Harbor', 'Kennebunkport', 'Camden', 'Acadia', 'Freeport', 'Ogunquit'],
  MD: ['Baltimore', 'Annapolis', 'Frederick', 'Rockville', 'Gaithersburg', 'Bethesda', 'Ocean City', 'Silver Spring', 'Columbia'],
  MA: ['Boston', 'Cambridge', 'Worcester', 'Springfield', 'Salem', 'Provincetown', 'Plymouth', 'Lowell', 'Newton', 'Nantucket', 'Martha\'s Vineyard', 'Lenox'],
  MI: ['Detroit', 'Grand Rapids', 'Ann Arbor', 'Lansing', 'Flint', 'Traverse City', 'Mackinac Island', 'Kalamazoo', 'Holland', 'Dearborn'],
  MN: ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth', 'Bloomington', 'Stillwater', 'St. Cloud', 'Mankato'],
  MS: ['Jackson', 'Gulfport', 'Biloxi', 'Hattiesburg', 'Tupelo', 'Oxford', 'Natchez', 'Vicksburg'],
  MO: ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Branson', 'Independence', 'Lee\'s Summit', 'St. Charles'],
  MT: ['Billings', 'Missoula', 'Bozeman', 'Great Falls', 'Helena', 'Whitefish', 'Kalispell', 'Big Sky', 'Glacier'],
  NE: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney', 'Fremont', 'North Platte'],
  NV: ['Las Vegas', 'Reno', 'Henderson', 'Carson City', 'Lake Tahoe', 'Sparks', 'Laughlin', 'Mesquite'],
  NH: ['Manchester', 'Nashua', 'Concord', 'Portsmouth', 'Dover', 'North Conway', 'Hanover', 'Keene'],
  NJ: ['Newark', 'Jersey City', 'Atlantic City', 'Princeton', 'Hoboken', 'Cape May', 'Trenton', 'Asbury Park', 'Montclair'],
  NM: ['Albuquerque', 'Santa Fe', 'Las Cruces', 'Roswell', 'Taos', 'Rio Rancho', 'Farmington'],
  NY: ['New York', 'Brooklyn', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'Manhattan', 'Queens', 'Bronx', 'Niagara Falls', 'Ithaca', 'Saratoga Springs', 'The Hamptons', 'Lake Placid', 'Long Island'],
  NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Asheville', 'Wilmington', 'Cary', 'Chapel Hill', 'Outer Banks'],
  ND: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo', 'Williston'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Canton', 'Youngstown'],
  OK: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Edmond', 'Lawton', 'Stillwater'],
  OR: ['Portland', 'Eugene', 'Salem', 'Bend', 'Hood River', 'Ashland', 'Cannon Beach', 'Astoria', 'Medford', 'Newport'],
  PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Harrisburg', 'Lancaster', 'Gettysburg', 'Hershey', 'Scranton', 'Bethlehem'],
  RI: ['Providence', 'Newport', 'Warwick', 'Cranston', 'Block Island', 'Pawtucket', 'Bristol'],
  SC: ['Charleston', 'Columbia', 'Myrtle Beach', 'Greenville', 'Hilton Head', 'Mount Pleasant', 'Beaufort', 'Spartanburg'],
  SD: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Deadwood', 'Pierre', 'Brookings', 'Mount Rushmore'],
  TN: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Gatlinburg', 'Pigeon Forge', 'Franklin', 'Murfreesboro'],
  TX: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Galveston', 'San Marcos', 'Waco', 'Lubbock', 'Frisco', 'McAllen', 'South Padre Island'],
  UT: ['Salt Lake City', 'Provo', 'Park City', 'St. George', 'Moab', 'Ogden', 'Sandy', 'Zion', 'Lehi'],
  VT: ['Burlington', 'Montpelier', 'Stowe', 'Manchester', 'Woodstock', 'Killington', 'Rutland', 'Brattleboro'],
  VA: ['Virginia Beach', 'Richmond', 'Norfolk', 'Alexandria', 'Arlington', 'Charlottesville', 'Williamsburg', 'Roanoke', 'Chesapeake', 'Fredericksburg'],
  WA: ['Seattle', 'Spokane', 'Tacoma', 'Bellevue', 'Olympia', 'Bellingham', 'Vancouver', 'Leavenworth', 'Walla Walla', 'Port Angeles'],
  WV: ['Charleston', 'Morgantown', 'Huntington', 'Wheeling', 'Harpers Ferry', 'Parkersburg', 'Lewisburg'],
  WI: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Door County', 'Appleton', 'Eau Claire', 'Lake Geneva'],
  WY: ['Cheyenne', 'Casper', 'Jackson', 'Laramie', 'Cody', 'Sheridan', 'Yellowstone', 'Grand Teton'],
  DC: ['Washington'],
}

// Flat list of every city as { city, state }
export const ALL_US_CITIES: USCity[] = Object.entries(CITIES_BY_STATE).flatMap(
  ([state, cities]) => cities.map(city => ({ city, state }))
)

// Quick lookup helper for autocomplete
export function searchUSCities(query: string, limit = 8): USCity[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const results: { item: USCity; score: number }[] = []
  for (const item of ALL_US_CITIES) {
    const cityLower = item.city.toLowerCase()
    const stateLower = item.state.toLowerCase()
    const stateName = (US_STATE_NAMES[item.state] ?? '').toLowerCase()
    const combo = `${cityLower} ${stateLower}`
    const comboName = `${cityLower} ${stateName}`

    let score = 0
    if (cityLower === q) score = 100
    else if (cityLower.startsWith(q)) score = 80
    else if (combo.startsWith(q) || comboName.startsWith(q)) score = 70
    else if (cityLower.includes(q)) score = 50
    else if (combo.includes(q) || comboName.includes(q)) score = 40
    else if (stateLower === q || stateName === q) score = 30

    if (score > 0) results.push({ item, score })
  }

  return results
    .sort((a, b) => b.score - a.score || a.item.city.localeCompare(b.item.city))
    .slice(0, limit)
    .map(r => r.item)
}
