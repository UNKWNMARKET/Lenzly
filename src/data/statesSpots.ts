import type { PhotoSpot } from './mockData'

// ─────────────────────────────────────────────────────────────────────────────
// US photography locations, organized by state.
//
// PHOTOS: The displayed image is resolved at runtime from Wikimedia Commons by
// the spot's name + city + state (see SmartSpotImage / wikimediaPhotos.ts).
// Wikimedia images are public-domain or Creative Commons — free to use and
// cache commercially. The `fallback` below (a category stock image under the
// Unsplash License) only shows if Wikimedia has no match.
//
// Each entry is a real, well-known, photogenic public location.
// ─────────────────────────────────────────────────────────────────────────────

// Compact authoring format: [name, city, category, lat, lng, description]
type Raw = [string, string, string, number, number, string]

// Category → free Unsplash License fallback image id (only used if Wikimedia
// returns nothing for the landmark name).
const FALLBACK: Record<string, string> = {
  'Nature':        '1469854523086-cc02fe5d8800',
  'Mountains':     '1454496522488-7a8e488e8606',
  'Beach':         '1507525428034-b723cf961d3e',
  'Waterfall':     '1432405972618-c60b0225b8f9',
  'Architecture':  '1486325212027-8081e485255e',
  'Skyline':       '1480714378408-67cf0d13bc1b',
  'Landmark':      '1501594907352-04cda38ebc29',
  'Bridge':        '1521295121783-8a321d551ad2',
  'Desert':        '1473580044384-7ba9967e16a0',
  'Lake':          '1439066615861-d1af74d74000',
  'Park':          '1502082553048-f009c37129b9',
  'Street Art':    '1499781350541-7783f6c6a0c8',
  'Lighthouse':    '1507525428034-b723cf961d3e',
  'Canyon':        '1473580044384-7ba9967e16a0',
  'Historic':      '1467269204594-9661b134dd2b',
}

const stock = (cat: string) => {
  const id = FALLBACK[cat] ?? FALLBACK['Nature']
  return `https://images.unsplash.com/photo-${id}?w=600&q=80&auto=format&fit=crop`
}

// Deterministic pseudo-random from a string seed (stable across renders/builds)
function seeded(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}

const TIPS_BY_CAT: Record<string, string[]> = {
  Nature: [
    'Shoot at golden hour for warm, directional light',
    'A polarizing filter cuts glare and deepens skies',
    'Look for foreground elements to add depth',
  ],
  Mountains: [
    'Blue hour before sunrise gives soft alpenglow',
    'Use a telephoto to compress distant ridgelines',
    'Pack layers — light changes fast at elevation',
  ],
  Beach: [
    'Low tide reveals reflective sand for mirror shots',
    'Sunrise/sunset on the coast yields the best color',
    'Protect gear from salt spray and blowing sand',
  ],
  Waterfall: [
    'A tripod + slow shutter (1/4s–2s) silkens the water',
    'Overcast days avoid harsh highlight blowout',
    'An ND filter lets you drag the shutter in daylight',
  ],
  Architecture: [
    'Shoot at blue hour to balance interior and sky light',
    'Keep verticals straight or correct in post',
    'Wide lenses (16–24mm) capture full façades',
  ],
  Skyline: [
    'Blue hour (20–30 min after sunset) is prime',
    'A tripod enables long exposures of moving light',
    'Find elevation or water for clean reflections',
  ],
  Landmark: [
    'Arrive early to beat crowds and harsh light',
    'Try both wide establishing and tight detail shots',
    'Golden hour wraps stonework in warm tone',
  ],
  Desert: [
    'Golden hour rakes light across dunes and rock',
    'Night skies here are exceptional for astro',
    'Carry extra water and sun protection',
  ],
  Canyon: [
    'Midday light reaches deep into narrow canyons',
    'Golden hour sets rim walls glowing',
    'Bracket exposures for high dynamic range',
  ],
}

function tipsFor(cat: string): string[] {
  return TIPS_BY_CAT[cat] ?? TIPS_BY_CAT.Nature
}

const BEST_TIME_BY_CAT: Record<string, string> = {
  Skyline: 'Blue Hour · 20 min after sunset',
  Architecture: 'Blue Hour · 7–8am',
  Beach: 'Sunrise / Sunset',
  Waterfall: 'Overcast / Golden Hour',
  Mountains: 'Sunrise · Alpenglow',
  Desert: 'Golden Hour · Astro at night',
  Canyon: 'Midday + Golden Hour',
}

function expand(state: string, raws: Raw[]): PhotoSpot[] {
  return raws.map(([name, city, category, lat, lng, description]) => {
    const id = `${state.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
    const s = seeded(id)
    const rating = +(4.4 + (s % 6) / 10).toFixed(1)          // 4.4–4.9
    const photoCount = 1200 + (s % 40000)
    return {
      id,
      name,
      description,
      image: stock(category),
      lat,
      lng,
      category,
      rating,
      photoCount,
      bestTime: BEST_TIME_BY_CAT[category] ?? 'Golden Hour · 5–7pm',
      city,
      state,
      aiDiscovered: true,
      shootingTips: tipsFor(category),
    } as PhotoSpot
  })
}

// ─── STATE DATA ──────────────────────────────────────────────────────────────
// Each array holds well-known photogenic public locations for that state.

const AL: Raw[] = [
  ['Gulf State Park Pier', 'Gulf Shores', 'Beach', 30.2546, -87.6661, 'One of the longest piers on the Gulf of Mexico, stretching 1,540 feet over white-sand beaches — a favorite for sunrise long exposures and pelican silhouettes.'],
  ['Cheaha State Park', 'Delta', 'Mountains', 33.4856, -85.8094, "Alabama's highest point at Cheaha Mountain (2,407 ft), with the stone Bunker Tower and sweeping Talladega National Forest overlooks."],
  ['Vulcan Park', 'Birmingham', 'Landmark', 33.4860, -86.7944, 'The largest cast-iron statue in the world towers over Birmingham, offering a sweeping skyline view from its observation tower at golden hour.'],
  ['Noccalula Falls', 'Gadsden', 'Waterfall', 34.0518, -86.0086, 'A 90-foot waterfall plunging into a wooded gorge, with a pioneer village and botanical gardens framing the cascade.'],
  ['Bellingrath Gardens', 'Theodore', 'Park', 30.5407, -88.2350, '65 acres of formal gardens along the Fowl River, brilliant with azaleas in spring and millions of lights in winter.'],
  ['USS Alabama', 'Mobile', 'Historic', 30.6817, -88.0144, 'A WWII battleship memorial moored in Mobile Bay — dramatic deck lines and gun turrets against bay sunsets.'],
  ['Dauphin Island', 'Dauphin Island', 'Beach', 30.2502, -88.1078, 'A barrier island with sea-oat dunes, the historic Fort Gaines, and one of the best birding shorelines on the Gulf.'],
  ['Little River Canyon Falls', 'Fort Payne', 'Canyon', 34.3934, -85.6225, 'One of the deepest canyons east of the Mississippi, carved atop Lookout Mountain with a powerful namesake waterfall.'],
  ['Cathedral Caverns', 'Woodville', 'Nature', 34.5722, -86.2225, 'A show cave with a 126-foot-wide entrance and towering stalagmites, including the famous Goliath column.'],
  ['Orange Beach', 'Orange Beach', 'Beach', 30.2716, -87.5733, 'Sugar-white sand and turquoise Gulf water — prime for beach minimalism and warm coastal sunsets.'],
]

const AK: Raw[] = [
  ['Denali', 'Denali Park', 'Mountains', 63.0692, -151.0070, 'North America’s tallest peak at 20,310 ft, often mirrored in Wonder Lake — a bucket-list alpenglow subject.'],
  ['Mendenhall Glacier', 'Juneau', 'Nature', 58.4376, -134.5460, 'A 13-mile glacier with an ice-blue face and Nugget Falls roaring beside it, reachable on foot from Juneau.'],
  ['Portage Glacier', 'Whittier', 'Nature', 60.7783, -148.8392, 'A glacier-fed lake with floating icebergs ringed by sharp peaks along the Seward Highway.'],
  ['Kenai Fjords', 'Seward', 'Nature', 59.9167, -149.6500, 'Tidewater glaciers calving into the sea, with orcas, puffins, and sheer fjord walls.'],
  ['Northern Lights at Cleary Summit', 'Fairbanks', 'Nature', 65.0200, -147.4900, 'A prime aurora-viewing pullout north of Fairbanks under dark, high-latitude skies.'],
  ['Matanuska Glacier', 'Sutton', 'Nature', 61.7700, -147.7500, 'A 27-mile valley glacier accessible by foot, with sculpted blue ice and meltwater pools.'],
  ['Hatcher Pass', 'Palmer', 'Mountains', 61.7747, -149.2972, 'Alpine tundra, the historic Independence Mine, and golden autumn slopes in the Talkeetna Mountains.'],
  ['Exit Glacier', 'Seward', 'Nature', 60.1880, -149.6300, 'The most accessible glacier in Kenai Fjords, with trails right up to its receding face.'],
  ['Turnagain Arm', 'Girdwood', 'Nature', 60.9500, -149.1700, 'A tidal fjord south of Anchorage famous for bore tides, beluga whales, and reflective mudflats.'],
  ['Mt. Roberts', 'Juneau', 'Mountains', 58.2900, -134.3900, 'A tramway-accessed ridge above Juneau with views over Gastineau Channel and the coastal range.'],
]

const AZ: Raw[] = [
  ['Grand Canyon South Rim', 'Grand Canyon Village', 'Canyon', 36.0544, -112.1401, 'The most iconic canyon on Earth — mile-deep, layered rock walls glowing at sunrise and sunset from Mather and Yavapai points.'],
  ['Antelope Canyon', 'Page', 'Canyon', 36.8619, -111.3743, 'A slot canyon of sculpted sandstone where midday light beams pierce the narrow passages.'],
  ['Horseshoe Bend', 'Page', 'Canyon', 36.8791, -111.5104, 'A dramatic 270-degree bend of the Colorado River 1,000 feet below a sandstone rim.'],
  ['Monument Valley', 'Oljato', 'Desert', 36.9980, -110.0985, 'Towering sandstone buttes rising from the desert floor — the archetypal American West landscape.'],
  ['Sedona Cathedral Rock', 'Sedona', 'Mountains', 34.8197, -111.7935, 'Red-rock spires reflected in Oak Creek, glowing crimson at sunset.'],
  ['The Wave', 'Coyote Buttes', 'Desert', 36.9959, -112.0061, 'Undulating, striped Navajo sandstone — a permit-only natural sculpture of swirling rock.'],
  ['Saguaro National Park', 'Tucson', 'Desert', 32.2967, -111.1666, 'Forests of giant saguaro cacti silhouetted against fiery Sonoran Desert sunsets.'],
  ['Havasu Falls', 'Supai', 'Waterfall', 36.2552, -112.6981, 'Turquoise travertine falls cascading into blue-green pools deep in the Grand Canyon.'],
  ['Lower Antelope Canyon', 'Page', 'Canyon', 36.8616, -111.3743, 'A narrower, ladder-descended slot canyon with swirling walls and softer reflected light.'],
  ['Watson Lake', 'Prescott', 'Lake', 34.5921, -112.4232, 'Granite Dells boulders rising from a still reservoir — surreal at sunrise reflections.'],
  ['Tucson Mission San Xavier', 'Tucson', 'Architecture', 32.1070, -111.0090, 'A gleaming white 18th-century Spanish mission, "the White Dove of the Desert".'],
  ['Chiricahua National Monument', 'Willcox', 'Nature', 32.0086, -109.3563, 'A "wonderland of rocks" — balanced hoodoos and pinnacles in the sky islands.'],
  ['Petrified Forest', 'Holbrook', 'Desert', 34.9100, -109.8068, 'Painted Desert badlands and ancient fossilized logs glowing in low-angle light.'],
  ['Camelback Mountain', 'Phoenix', 'Mountains', 33.5147, -111.9633, 'A camel-shaped landmark towering over Phoenix with panoramic valley sunrises.'],
  ['Tonto Natural Bridge', 'Pine', 'Nature', 34.3211, -111.4547, 'The largest natural travertine bridge in the world, arching over a fern-lined creek.'],
]

const AR: Raw[] = [
  ['Hawksbill Crag', 'Jasper', 'Mountains', 35.8889, -93.4561, 'A dramatic beak-shaped rock outcrop overhanging the Buffalo River wilderness — an Ozarks classic.'],
  ['Buffalo National River', 'Ponca', 'Nature', 36.0250, -93.3700, 'America’s first national river, with limestone bluffs reflected in clear emerald water.'],
  ['Garvan Woodland Gardens', 'Hot Springs', 'Park', 34.4666, -93.0260, 'Lakeside botanical gardens with a striking Anthony Chapel of glass and timber in the trees.'],
  ['Hot Springs National Park', 'Hot Springs', 'Historic', 34.5133, -93.0537, 'Historic Bathhouse Row and steaming thermal springs in the heart of a mountain town.'],
  ['Whitaker Point', 'Jasper', 'Mountains', 35.8889, -93.4561, 'Sweeping Ozark valley overlooks from the most-photographed crag in Arkansas.'],
  ['Cossatot River', 'Wickes', 'Nature', 34.3900, -94.2200, 'The "skull crusher" — whitewater rapids carving through rugged forested mountains.'],
  ['Pinnacle Mountain', 'Little Rock', 'Mountains', 34.8380, -92.5230, 'A cone-shaped peak overlooking the Arkansas River valley near the capital.'],
  ['Mount Magazine', 'Paris', 'Mountains', 35.1672, -93.6450, "Arkansas’s highest point with sweeping Petit Jean River valley vistas."],
  ['Petit Jean State Park', 'Morrilton', 'Waterfall', 35.1175, -92.9360, 'Cedar Falls plunges 95 feet into a box canyon in Arkansas’s first state park.'],
  ['Blanchard Springs Caverns', 'Fifty-Six', 'Nature', 35.9600, -92.1700, 'A "living" cave with flowing formations and an underground stream beneath the Ozarks.'],
]

const CA: Raw[] = [
  ['Golden Gate Bridge', 'San Francisco', 'Bridge', 37.8199, -122.4783, 'The world’s most photographed bridge — fog-wrapped Art Deco towers glowing International Orange from Battery Spencer and Baker Beach.'],
  ['Yosemite Tunnel View', 'Yosemite Valley', 'Mountains', 37.7156, -119.6770, 'The classic vista of El Capitan, Bridalveil Fall, and Half Dome framing the glacial valley.'],
  ['Bixby Creek Bridge', 'Big Sur', 'Bridge', 36.3714, -121.9015, 'An iconic concrete arch spanning a coastal canyon on Highway 1 above the Pacific.'],
  ['Half Dome', 'Yosemite Valley', 'Mountains', 37.7459, -119.5332, 'A sheer granite dome rising 4,700 feet above the valley, glowing at sunset from Glacier Point.'],
  ['Lake Tahoe Emerald Bay', 'South Lake Tahoe', 'Lake', 38.9540, -120.1050, 'A glacial bay of impossibly clear water with the stone Vikingsholm castle on its shore.'],
  ['Death Valley Zabriskie Point', 'Death Valley', 'Desert', 36.4200, -116.8110, 'Eroded golden badlands rippling toward the salt flats — a sunrise photographer’s dream.'],
  ['Joshua Tree', 'Joshua Tree', 'Desert', 33.8734, -115.9010, 'Twisted Joshua trees and monzogranite boulders under brilliant dark skies.'],
  ['McWay Falls', 'Big Sur', 'Waterfall', 36.1577, -121.6716, 'An 80-foot waterfall dropping directly onto a turquoise cove beach.'],
  ['Hollywood Sign', 'Los Angeles', 'Landmark', 34.1341, -118.3215, 'The world-famous hillside letters above LA, best framed from Lake Hollywood Park.'],
  ['Mono Lake Tufa', 'Lee Vining', 'Lake', 37.9400, -119.0270, 'Otherworldly limestone tufa towers rising from a saline lake under the Sierra.'],
  ['Pfeiffer Beach', 'Big Sur', 'Beach', 36.2380, -121.8160, 'Purple-tinted sand and the Keyhole Arch that catches sunset light beams in winter.'],
  ['Salvation Mountain', 'Niland', 'Street Art', 33.2543, -115.4720, 'A hand-built, paint-soaked desert art hill of folk-art color and devotion.'],
  ['Lombard Street', 'San Francisco', 'Street Art', 37.8021, -122.4187, 'The famously crooked, flower-lined switchback street descending Russian Hill.'],
  ['Bodie Ghost Town', 'Bridgeport', 'Historic', 38.2121, -119.0127, 'A preserved gold-rush ghost town in "arrested decay" high in the eastern Sierra.'],
  ['Sequoia General Sherman', 'Three Rivers', 'Nature', 36.5816, -118.7517, 'The largest tree on Earth by volume, towering in a grove of ancient giant sequoias.'],
  ['Pismo Beach Pier', 'Pismo Beach', 'Beach', 35.1400, -120.6450, 'A classic wooden pier over central-coast surf, glowing at sunset.'],
  ['Lassen Volcanic', 'Mineral', 'Mountains', 40.4977, -121.4207, 'Steaming hydrothermal basins and an alpine volcano reflected in Manzanita Lake.'],
  ['Point Reyes Lighthouse', 'Inverness', 'Lighthouse', 38.0000, -123.0200, 'A windswept 1870 lighthouse on dramatic Pacific headlands, often fog-shrouded.'],
  ['Alabama Hills', 'Lone Pine', 'Desert', 36.6060, -118.1170, 'Rounded boulders and arches framing Mt. Whitney and the eastern Sierra.'],
  ['Crystal Cove', 'Newport Beach', 'Beach', 33.5700, -117.8300, 'Tide pools, historic cottages, and golden bluffs along the Orange County coast.'],
]

const CO: Raw[] = [
  ['Maroon Bells', 'Aspen', 'Mountains', 39.0708, -106.9890, 'The most-photographed peaks in North America — twin maroon summits mirrored in Maroon Lake amid golden aspens.'],
  ['Garden of the Gods', 'Colorado Springs', 'Nature', 38.8784, -104.8694, 'Towering red sandstone fins against Pikes Peak, glowing at sunrise.'],
  ['Hanging Lake', 'Glenwood Springs', 'Waterfall', 39.6010, -107.1920, 'A travertine lake of turquoise water fed by waterfalls in Glenwood Canyon.'],
  ['Great Sand Dunes', 'Mosca', 'Desert', 37.7916, -105.5943, 'The tallest dunes in North America against the Sangre de Cristo peaks.'],
  ['Rocky Mountain Bear Lake', 'Estes Park', 'Lake', 40.3130, -105.6450, 'An alpine lake ringed by peaks, brilliant with reflections and fall color.'],
  ['Hanging Flume / Black Canyon', 'Montrose', 'Canyon', 38.5754, -107.7416, 'Sheer 2,000-foot walls of the Black Canyon of the Gunnison, narrow and dramatic.'],
  ['Telluride', 'Telluride', 'Mountains', 37.9375, -107.8123, 'A box canyon town beneath Bridal Veil Falls and snow-capped San Juan peaks.'],
  ['Dream Lake', 'Estes Park', 'Lake', 40.3090, -105.6580, 'A glassy alpine lake framing Hallett Peak — a classic Rockies sunrise shot.'],
  ['Independence Pass', 'Aspen', 'Mountains', 39.1080, -106.5630, 'A 12,095-foot Continental Divide pass with tundra vistas and switchbacks.'],
  ['Crystal Mill', 'Marble', 'Historic', 39.0560, -107.1730, 'A weathered 1893 wooden powerhouse perched over a rushing mountain stream.'],
  ['Mesa Verde', 'Mesa Verde', 'Historic', 37.2309, -108.4618, 'Ancestral Puebloan cliff dwellings tucked into canyon alcoves.'],
  ['Hanging Bridge Royal Gorge', 'Cañon City', 'Bridge', 38.4783, -105.3253, 'One of the highest suspension bridges in the US, spanning the Arkansas River gorge.'],
  ['Ice Lake Basin', 'Silverton', 'Lake', 37.8090, -107.7600, 'A startlingly turquoise alpine basin ringed by 13,000-foot peaks.'],
  ['Hoosier Pass', 'Breckenridge', 'Mountains', 39.3610, -106.0620, 'A high Continental Divide pass with sweeping tundra and peak views.'],
  ['Denver Union Station', 'Denver', 'Architecture', 39.7530, -105.0010, 'A beautifully restored Beaux-Arts rail station glowing under its iconic neon sign.'],
]

const FL_EXTRA: Raw[] = [
  ['Devil’s Den', 'Williston', 'Nature', 29.4350, -82.4760, 'A prehistoric underground spring inside a dry cave, with a beam of light over crystal-clear water.'],
  ['Bahia Honda State Park', 'Big Pine Key', 'Beach', 24.6552, -81.2780, 'Turquoise water and the old Flagler railway bridge in the Lower Keys.'],
  ['Dry Tortugas Fort Jefferson', 'Key West', 'Historic', 24.6286, -82.8732, 'A massive 19th-century coastal fort on a remote island ringed by clear Gulf water.'],
  ['Rainbow Springs', 'Dunnellon', 'Nature', 29.1020, -82.4350, 'Crystal headsprings and man-made waterfalls in a lush old Florida park.'],
  ['Big Cypress Bend Boardwalk', 'Copeland', 'Nature', 25.9300, -81.3300, 'Ancient bald cypress and wading birds along an Everglades boardwalk.'],
]

const CT: Raw[] = [
  ['Gillette Castle', 'East Haddam', 'Architecture', 41.4220, -72.4290, 'A medieval-style fieldstone castle on a bluff above the Connecticut River, built by actor William Gillette.'],
  ['Mystic Seaport', 'Mystic', 'Historic', 41.3640, -71.9660, 'A recreated 19th-century coastal village with tall ships and a working shipyard.'],
  ['Lighthouse Point Park', 'New Haven', 'Lighthouse', 41.2490, -72.9030, 'An 1840 lighthouse and antique carousel on Long Island Sound.'],
  ['Kent Falls', 'Kent', 'Waterfall', 41.7660, -73.4170, 'A series of cascades dropping 250 feet through a wooded state park.'],
  ['Yale University', 'New Haven', 'Architecture', 41.3163, -72.9223, 'Collegiate Gothic towers, Sterling Library, and the translucent-marble Beinecke.'],
  ['Harkness Memorial', 'Waterford', 'Park', 41.3050, -72.1170, 'A Renaissance-style mansion and formal gardens on Long Island Sound.'],
  ['Bluff Point', 'Groton', 'Beach', 41.3210, -72.0350, 'A coastal reserve of forest, marsh, and a quiet beach spit.'],
  ['Wadsworth Falls', 'Middletown', 'Waterfall', 41.5340, -72.7160, 'A wide, powerful waterfall in a leafy state park.'],
  ['Hammonasset Beach', 'Madison', 'Beach', 41.2640, -72.5460, "Connecticut's longest shoreline park, prime for sunrise over the Sound."],
  ['Talcott Mountain', 'Simsbury', 'Mountains', 41.8290, -72.8240, 'Heublein Tower atop a ridge with sweeping Farmington Valley views.'],
]

const DE: Raw[] = [
  ['Cape Henlopen', 'Lewes', 'Beach', 38.7990, -75.0940, 'Dunes, a WWII observation tower, and wide Atlantic beaches at the bay’s mouth.'],
  ['Fort Delaware', 'Delaware City', 'Historic', 39.5870, -75.5680, 'A Civil War-era island fortress reached by ferry across the Delaware River.'],
  ['Bombay Hook', 'Smyrna', 'Nature', 39.2610, -75.4670, 'A vast tidal marsh refuge, one of the East Coast’s top birding and sunrise spots.'],
  ['Rehoboth Beach Boardwalk', 'Rehoboth Beach', 'Beach', 38.7210, -75.0760, 'A classic mile-long boardwalk and beach town on the Atlantic.'],
  ['Winterthur', 'Wilmington', 'Park', 39.8060, -75.5930, 'A du Pont estate with 60 acres of naturalistic gardens.'],
  ['Nemours Estate', 'Wilmington', 'Architecture', 39.7700, -75.5840, 'A French neoclassical mansion with the largest formal French gardens in North America.'],
  ['Indian River Inlet Bridge', 'Bethany Beach', 'Bridge', 38.6100, -75.0670, 'A sleek cable-stayed bridge glowing in blue LED light over the inlet.'],
  ['Brandywine Creek', 'Wilmington', 'Nature', 39.8000, -75.5780, 'Rolling meadows and stone walls along a scenic creek valley.'],
  ['Auburn Heights', 'Yorklyn', 'Historic', 39.8050, -75.6720, 'A Victorian mansion and antique steam-car collection in the Red Clay Valley.'],
  ['Fenwick Island Lighthouse', 'Fenwick Island', 'Lighthouse', 38.4600, -75.0490, 'An 1859 lighthouse marking the Maryland–Delaware line.'],
]

const GA: Raw[] = [
  ['Savannah Forsyth Park', 'Savannah', 'Park', 32.0560, -81.0960, 'A grand white fountain framed by Spanish-moss-draped live oaks in the historic district.'],
  ['Providence Canyon', 'Lumpkin', 'Canyon', 32.0700, -84.9120, "Georgia's 'Little Grand Canyon' — colorful eroded gullies of pink, orange, and white clay."],
  ['Tallulah Gorge', 'Tallulah Falls', 'Canyon', 34.7390, -83.3920, 'A 1,000-foot gorge with a suspension bridge over waterfalls.'],
  ['Amicalola Falls', 'Dawsonville', 'Waterfall', 34.5590, -84.2480, 'The tallest cascading waterfall in the Southeast at 729 feet.'],
  ['Jekyll Island Driftwood Beach', 'Jekyll Island', 'Beach', 31.0890, -81.4120, 'A surreal shoreline of weathered, sun-bleached driftwood and fallen oaks.'],
  ['Cumberland Island', 'St. Marys', 'Beach', 30.8330, -81.4360, 'Wild beaches, feral horses, and the ruins of Dungeness mansion.'],
  ['Stone Mountain', 'Stone Mountain', 'Nature', 33.8053, -84.1455, 'The largest exposed granite dome in the world, with sweeping summit views.'],
  ['Atlanta Ponce City Market', 'Atlanta', 'Architecture', 33.7720, -84.3650, 'A restored Sears building with a rooftop and skyline views over the BeltLine.'],
  ['Okefenokee Swamp', 'Folkston', 'Nature', 30.7660, -82.1370, 'A vast blackwater swamp of cypress, lily pads, and mirror reflections.'],
  ['Brasstown Bald', 'Hiawassee', 'Mountains', 34.8740, -83.8110, "Georgia's highest peak with 360-degree Blue Ridge panoramas."],
]

const HI: Raw[] = [
  ['Waimea Canyon', 'Waimea', 'Canyon', 22.0700, -159.6610, "The 'Grand Canyon of the Pacific' — red, green, and ochre cliffs plunging 3,000 feet on Kauai."],
  ['Na Pali Coast', 'Hanalei', 'Beach', 22.1780, -159.6440, 'Emerald sea cliffs rising sheer from the turquoise Pacific on Kauai’s wild north shore.'],
  ['Haleakala Summit', 'Kula', 'Mountains', 20.7097, -156.2533, 'A 10,000-foot volcanic crater above the clouds, world-famous for sunrise.'],
  ['Road to Hana', 'Hana', 'Nature', 20.7580, -155.9900, 'A winding coastal road past waterfalls, bamboo forests, and black-sand beaches.'],
  ['Diamond Head', 'Honolulu', 'Mountains', 21.2620, -157.8050, 'A volcanic tuff cone above Waikiki with iconic crater and coastline views.'],
  ['Waikiki Beach', 'Honolulu', 'Beach', 21.2769, -157.8268, 'The famous crescent of sand backed by Diamond Head and Pacific sunsets.'],
  ['Kilauea Volcano', 'Volcano', 'Nature', 19.4210, -155.2870, 'An active volcano with glowing lava lakes and steaming craters on the Big Island.'],
  ['Lanikai Beach', 'Kailua', 'Beach', 21.3930, -157.7150, 'Powder-soft sand and twin Mokulua islets in brilliant turquoise water.'],
  ['Waimoku Falls', 'Hana', 'Waterfall', 20.6650, -156.0440, 'A 400-foot waterfall at the end of a bamboo-forest trail in Haleakala.'],
  ['Mauna Kea', 'Hilo', 'Mountains', 19.8207, -155.4681, 'A 13,800-foot summit above the clouds — one of Earth’s premier stargazing sites.'],
]

const ID: Raw[] = [
  ['Shoshone Falls', 'Twin Falls', 'Waterfall', 42.5950, -114.4010, "The 'Niagara of the West' — 212 feet tall, even higher than Niagara, over the Snake River."],
  ['Sawtooth Mountains', 'Stanley', 'Mountains', 44.1670, -114.9290, 'Jagged granite peaks reflected in alpine lakes, glowing at sunrise.'],
  ['Craters of the Moon', 'Arco', 'Nature', 43.4160, -113.5170, 'A surreal black volcanic landscape of lava flows and cinder cones.'],
  ['Mesa Falls', 'Ashton', 'Waterfall', 44.1880, -111.3320, 'A powerful 114-foot waterfall plunging through a forested canyon.'],
  ['Redfish Lake', 'Stanley', 'Lake', 44.1430, -114.9170, 'A clear blue lake mirroring the Sawtooth peaks.'],
  ['Bruneau Dunes', 'Mountain Home', 'Desert', 42.8950, -115.7060, 'The tallest single-structured sand dune in North America (470 ft) beside desert lakes.'],
  ['Perrine Bridge', 'Twin Falls', 'Bridge', 42.5990, -114.4640, 'A high steel arch over the Snake River canyon, famous for BASE jumping.'],
  ['Lake Coeur d’Alene', 'Coeur d’Alene', 'Lake', 47.6090, -116.7770, 'A scenic mountain lake with forested shores and a long floating boardwalk.'],
  ['Hells Canyon', 'Riggins', 'Canyon', 45.2420, -116.7020, 'The deepest river gorge in North America, deeper than the Grand Canyon.'],
  ['City of Rocks', 'Almo', 'Desert', 42.0760, -113.7130, 'Towering granite spires and pinnacles dotting a high desert basin.'],
]

const IL: Raw[] = [
  ['Cloud Gate (The Bean)', 'Chicago', 'Street Art', 41.8827, -87.6233, 'A mirror-polished stainless sculpture reflecting the Chicago skyline in Millennium Park.'],
  ['Chicago Riverwalk', 'Chicago', 'Skyline', 41.8880, -87.6250, 'A waterfront promenade beneath the city’s bridges and gleaming towers.'],
  ['Starved Rock', 'Oglesby', 'Canyon', 41.3180, -89.0010, 'Sandstone canyons and seasonal waterfalls along the Illinois River.'],
  ['Garfield Park Conservatory', 'Chicago', 'Architecture', 41.8860, -87.7170, 'One of the largest glasshouse conservatories in the US, lush year-round.'],
  ['Navy Pier', 'Chicago', 'Skyline', 41.8916, -87.6079, 'A lakefront pier with a Ferris wheel and skyline views over Lake Michigan.'],
  ['Cahokia Mounds', 'Collinsville', 'Historic', 38.6550, -90.0620, 'The largest pre-Columbian earthwork in the Americas, a UNESCO site.'],
  ['Chicago Lakefront', 'Chicago', 'Skyline', 41.8500, -87.6100, 'Sweeping skyline views from the Adler Planetarium and North Avenue Beach.'],
  ['Matthiessen State Park', 'Oglesby', 'Waterfall', 41.3070, -89.0040, 'Canyons, bluffs, and waterfalls in a quieter neighbor to Starved Rock.'],
  ['Chicago Theatre', 'Chicago', 'Landmark', 41.8853, -87.6275, 'The iconic 1921 marquee and vertical sign on State Street.'],
  ['Pere Marquette', 'Grafton', 'Nature', 38.9700, -90.5470, 'Bluffs above the confluence of the Illinois and Mississippi rivers.'],
]

const IN: Raw[] = [
  ['Indiana Dunes', 'Chesterton', 'Beach', 41.6530, -87.0530, 'Towering sand dunes and Lake Michigan beaches with the Chicago skyline on the horizon.'],
  ['Clifty Falls', 'Madison', 'Waterfall', 38.7700, -85.4200, 'A cluster of waterfalls in a rugged canyon above the Ohio River.'],
  ['Indianapolis Canal Walk', 'Indianapolis', 'Architecture', 39.7740, -86.1660, 'A landscaped urban canal lined with monuments and walkways.'],
  ['Turkey Run', 'Marshall', 'Nature', 39.8870, -87.2070, 'Deep sandstone gorges, hemlock groves, and ladder trails along Sugar Creek.'],
  ['Brown County', 'Nashville', 'Nature', 39.1480, -86.2270, "Indiana's 'Little Smokies' ablaze with autumn color from ridge overlooks."],
  ['Soldiers & Sailors Monument', 'Indianapolis', 'Landmark', 39.7686, -86.1580, 'A 284-foot neoclassical monument at the heart of downtown.'],
  ['Tippecanoe Battlefield', 'Battle Ground', 'Historic', 40.5060, -86.8420, 'A wooded memorial park marking the 1811 battle.'],
  ['Marengo Cave', 'Marengo', 'Nature', 38.3680, -86.3430, 'A national-landmark show cave with dramatic dripstone formations.'],
  ['Falls of the Ohio', 'Clarksville', 'Nature', 38.2780, -85.7600, 'Exposed Devonian fossil beds along the Ohio River.'],
  ['West Baden Springs', 'West Baden Springs', 'Architecture', 38.5680, -86.6160, 'A historic domed atrium hotel once called the "Eighth Wonder of the World".'],
]

const IA: Raw[] = [
  ['Maquoketa Caves', 'Maquoketa', 'Nature', 42.1110, -90.7720, 'A trail winding through more caves than any other Iowa park, with natural bridges.'],
  ['Pikes Peak State Park', 'McGregor', 'Nature', 42.9930, -91.1620, 'High bluffs above the Mississippi River with sweeping valley overlooks.'],
  ['Bridges of Madison County', 'Winterset', 'Bridge', 41.3370, -94.0130, 'The famous covered bridges immortalized in film and novel.'],
  ['Iowa State Capitol', 'Des Moines', 'Architecture', 41.5910, -93.6030, 'A gleaming 23-karat gold dome crowning the riverfront capitol.'],
  ['Backbone State Park', 'Dundee', 'Nature', 42.6160, -91.5560, "Iowa's first state park, with a rocky ridge and the Maquoketa River."],
  ['Effigy Mounds', 'Harpers Ferry', 'Historic', 43.0900, -91.1850, 'Ancient animal-shaped earthworks on bluffs above the Mississippi.'],
  ['Lake Okoboji', 'Arnolds Park', 'Lake', 43.3680, -95.1440, 'A blue glacial lake and vintage lakeside amusement park.'],
  ['Grotto of the Redemption', 'West Bend', 'Architecture', 42.9650, -94.0420, 'An elaborate folk-art shrine encrusted with gems and minerals.'],
  ['Loess Hills', 'Council Bluffs', 'Nature', 41.4000, -95.8000, 'Rare wind-deposited hills found in only one other place on Earth.'],
  ['Ledges State Park', 'Boone', 'Canyon', 42.0080, -93.8800, 'Sandstone canyon walls and creek crossings in central Iowa.'],
]

const KS: Raw[] = [
  ['Monument Rocks', 'Oakley', 'Nature', 38.7920, -100.7630, 'Chalk pillars rising 70 feet from the prairie — the first National Natural Landmark.'],
  ['Castle Rock', 'Quinter', 'Nature', 38.8700, -100.0820, 'A solitary chalk spire and badlands eroding from the High Plains.'],
  ['Flint Hills', 'Cottonwood Falls', 'Nature', 38.3690, -96.5410, 'The largest remaining tallgrass prairie, golden at sunset.'],
  ['Kansas Cosmosphere', 'Hutchinson', 'Architecture', 38.0420, -97.9290, 'A space museum with historic rockets and a striking modern interior.'],
  ['Tallgrass Prairie Preserve', 'Strong City', 'Nature', 38.4310, -96.5580, 'Rolling prairie, a historic stone barn, and roaming bison.'],
  ['Kansas State Capitol', 'Topeka', 'Architecture', 39.0480, -95.6780, 'A French Renaissance dome with John Brown murals inside.'],
  ['Mushroom Rock', 'Brookville', 'Nature', 38.7240, -97.9230, 'Bizarre mushroom-shaped sandstone formations on the prairie.'],
  ['Big Brutus', 'West Mineral', 'Landmark', 37.3340, -94.8650, 'A 16-story electric coal shovel, one of the largest in the world.'],
  ['Lake Scott', 'Scott City', 'Lake', 38.6770, -100.9080, 'A spring-fed canyon lake with bluffs and historic ruins.'],
  ['Wichita Keeper of the Plains', 'Wichita', 'Landmark', 37.6890, -97.3380, 'A 44-foot steel sculpture at the river confluence, ringed by fire at dusk.'],
]

const KY: Raw[] = [
  ['Red River Gorge', 'Slade', 'Canyon', 37.8190, -83.6240, 'A sandstone wonderland of natural arches, cliffs, and the famous Sky Bridge.'],
  ['Mammoth Cave', 'Mammoth Cave', 'Nature', 37.1869, -86.1006, 'The longest known cave system on Earth, with vast underground chambers.'],
  ['Cumberland Falls', 'Corbin', 'Waterfall', 36.8380, -84.3420, 'A 68-foot "Niagara of the South" famous for its rare moonbow.'],
  ['Natural Bridge', 'Slade', 'Nature', 37.7770, -83.6840, 'A massive sandstone arch reached by trail or sky lift.'],
  ['Churchill Downs', 'Louisville', 'Landmark', 38.2030, -85.7700, 'The twin-spired home of the Kentucky Derby.'],
  ['Kentucky Horse Country', 'Lexington', 'Nature', 38.1300, -84.7400, 'Rolling bluegrass pastures, white fences, and historic horse farms.'],
  ['Big South Fork', 'Stearns', 'Canyon', 36.6500, -84.6900, 'Sandstone gorges, arches, and the Cumberland River’s wild upper reaches.'],
  ['Bernheim Forest', 'Clermont', 'Park', 37.9230, -85.6480, 'An arboretum with giant troll sculptures and a canopy walkway.'],
  ['Louisville Waterfront', 'Louisville', 'Skyline', 38.2640, -85.7430, 'The Big Four pedestrian bridge and skyline over the Ohio River.'],
  ['Pine Mountain', 'Pineville', 'Mountains', 36.7400, -83.7100, 'Ridgeline overlooks ablaze with rhododendron and autumn color.'],
]

const LA: Raw[] = [
  ['French Quarter', 'New Orleans', 'Architecture', 29.9580, -90.0650, 'Wrought-iron balconies, pastel façades, and gas lamps in America’s most atmospheric quarter.'],
  ['Oak Alley Plantation', 'Vacherie', 'Historic', 30.0080, -90.7820, 'A quarter-mile canopy of 28 live oaks framing an antebellum mansion.'],
  ['St. Louis Cathedral', 'New Orleans', 'Architecture', 29.9580, -90.0630, 'The triple-spired cathedral over Jackson Square, glowing at blue hour.'],
  ['Atchafalaya Basin', 'Henderson', 'Nature', 30.3000, -91.7500, 'The largest river swamp in the US — cypress, Spanish moss, and mirror water.'],
  ['Avery Island', 'Avery Island', 'Nature', 29.9000, -91.9000, 'Lush jungle gardens, a bird sanctuary, and the Tabasco home.'],
  ['City Park New Orleans', 'New Orleans', 'Park', 29.9940, -90.0980, 'Ancient live oaks and lagoons in one of the oldest urban parks in America.'],
  ['Kisatchie National Forest', 'Provencal', 'Nature', 31.4700, -93.0400, "Louisiana's only national forest, with sandstone bluffs and longleaf pine."],
  ['Crescent City Connection', 'New Orleans', 'Bridge', 29.9320, -90.0610, 'Twin cantilever bridges arcing over the Mississippi at sunset.'],
  ['Jean Lafitte Preserve', 'Marrero', 'Nature', 29.7800, -90.1100, 'A bayou boardwalk through alligator-filled wetlands.'],
  ['Tunica Hills', 'St. Francisville', 'Nature', 30.9700, -91.5300, 'Rare loess ravines, waterfalls, and forested bluffs near the Mississippi.'],
]

const ME: Raw[] = [
  ['Portland Head Light', 'Cape Elizabeth', 'Lighthouse', 43.6231, -70.2080, 'Maine’s most iconic lighthouse, perched on rocky cliffs since 1791.'],
  ['Acadia Cadillac Mountain', 'Bar Harbor', 'Mountains', 44.3530, -68.2250, 'The first place to see sunrise in the US, with granite summit panoramas.'],
  ['Bass Harbor Head Light', 'Tremont', 'Lighthouse', 44.2220, -68.3370, 'A red-roofed lighthouse on pink granite ledges in Acadia.'],
  ['Thunder Hole', 'Bar Harbor', 'Beach', 44.3190, -68.1900, 'A rocky inlet where waves boom and spray erupts on the Acadia coast.'],
  ['Jordan Pond', 'Bar Harbor', 'Lake', 44.3210, -68.2530, 'A glassy pond mirroring the rounded "Bubbles" mountains.'],
  ['Old Orchard Beach', 'Old Orchard Beach', 'Beach', 43.5150, -70.3770, 'A classic pier and seven miles of sand on Saco Bay.'],
  ['Pemaquid Point Light', 'Bristol', 'Lighthouse', 43.8370, -69.5050, 'A lighthouse atop dramatic striated rock ledges.'],
  ['Camden Hills', 'Camden', 'Mountains', 44.2300, -69.0500, 'Mount Battie overlooks a harbor of schooners and islands.'],
  ['Quoddy Head', 'Lubec', 'Lighthouse', 44.8150, -66.9500, 'The candy-striped easternmost lighthouse in the US.'],
  ['Marshall Point Light', 'Port Clyde', 'Lighthouse', 43.9170, -69.2600, 'The wooden-walkway lighthouse made famous by Forrest Gump.'],
]

const MD: Raw[] = [
  ['Thomas Point Light', 'Annapolis', 'Lighthouse', 38.8990, -76.4360, 'A screw-pile lighthouse standing in the Chesapeake Bay, Maryland’s most famous.'],
  ['Inner Harbor', 'Baltimore', 'Skyline', 39.2850, -76.6100, 'A bustling waterfront of historic ships and a glowing city skyline.'],
  ['Assateague Island', 'Berlin', 'Beach', 38.0630, -75.2120, 'Wild beaches roamed by free wild ponies along the Atlantic.'],
  ['Great Falls Potomac', 'Potomac', 'Waterfall', 38.9970, -77.2540, 'The Potomac River cascading through a rocky gorge near DC.'],
  ['Antietam', 'Sharpsburg', 'Historic', 39.4760, -77.7440, 'A Civil War battlefield with stone bridges and rolling fields.'],
  ['Ocean City Boardwalk', 'Ocean City', 'Beach', 38.3370, -75.0840, 'A 3-mile boardwalk and Atlantic beach resort.'],
  ['Annapolis Naval Academy', 'Annapolis', 'Architecture', 38.9840, -76.4850, 'The domed chapel and Beaux-Arts campus on the Severn River.'],
  ['Swallow Falls', 'Oakland', 'Waterfall', 39.4990, -79.4200, 'Maryland’s highest free-falling waterfall amid old-growth hemlock.'],
  ['Calvert Cliffs', 'Lusby', 'Beach', 38.3850, -76.4350, 'Fossil-rich cliffs above a Chesapeake Bay beach.'],
  ['Harpers Ferry View', 'Knoxville', 'Nature', 39.3260, -77.7290, 'Maryland Heights overlook above the river confluence.'],
]

const MA: Raw[] = [
  ['Acadia of the East / Cape Cod Light', 'Truro', 'Lighthouse', 42.0390, -70.0680, 'Cape Cod’s oldest lighthouse on windswept Atlantic dunes.'],
  ['Boston Public Garden', 'Boston', 'Park', 42.3540, -71.0700, 'America’s first public botanical garden, with swan boats and a lagoon bridge.'],
  ['Acorn Street', 'Boston', 'Street Art', 42.3580, -71.0690, 'The most photographed cobblestone street in America, in Beacon Hill.'],
  ['Nubble Light / Rockport', 'Rockport', 'Lighthouse', 42.6550, -70.6150, 'Motif No. 1, the iconic red fishing shack on the harbor.'],
  ['Provincetown', 'Provincetown', 'Beach', 42.0580, -70.1780, 'Dunes, the Pilgrim Monument, and the tip of Cape Cod.'],
  ['Martha’s Vineyard', 'Aquinnah', 'Beach', 41.3480, -70.8360, 'The colorful Gay Head clay cliffs and a brick lighthouse.'],
  ['Mount Greylock', 'Adams', 'Mountains', 42.6370, -73.1660, 'The highest peak in Massachusetts with a war-memorial tower.'],
  ['Bash Bish Falls', 'Mount Washington', 'Waterfall', 42.1170, -73.4940, 'The state’s highest single-drop waterfall in a dramatic gorge.'],
  ['Boston Skyline / Esplanade', 'Boston', 'Skyline', 42.3560, -71.0730, 'The Charles River reflecting the Back Bay skyline at dusk.'],
  ['Salem', 'Salem', 'Historic', 42.5190, -70.8960, 'Witch-trial history, the House of Seven Gables, and waterfront wharves.'],
]

const MI: Raw[] = [
  ['Pictured Rocks', 'Munising', 'Beach', 46.5600, -86.3500, 'Multicolored sandstone cliffs rising straight from Lake Superior’s turquoise water.'],
  ['Mackinac Bridge', 'Mackinaw City', 'Bridge', 45.8170, -84.7280, 'A five-mile suspension bridge linking Michigan’s two peninsulas.'],
  ['Sleeping Bear Dunes', 'Empire', 'Beach', 44.8810, -86.0580, 'Towering dunes plunging 450 feet to Lake Michigan’s blue waters.'],
  ['Tahquamenon Falls', 'Paradise', 'Waterfall', 46.5750, -85.2530, 'A wide amber waterfall, one of the largest east of the Mississippi.'],
  ['Mackinac Island', 'Mackinac Island', 'Historic', 45.8490, -84.6180, 'A car-free Victorian island with the Grand Hotel and lakeside arch rock.'],
  ['Detroit Riverwalk', 'Detroit', 'Skyline', 42.3290, -83.0410, 'A renewed waterfront with skyline and Windsor views.'],
  ['Holland State Park', 'Holland', 'Lighthouse', 42.7740, -86.2130, 'The red "Big Red" lighthouse on a Lake Michigan channel.'],
  ['Porcupine Mountains', 'Ontonagon', 'Mountains', 46.8200, -89.7400, 'The Lake of the Clouds overlook in an old-growth wilderness.'],
  ['Kitch-iti-kipi', 'Manistique', 'Nature', 46.0040, -86.3800, 'A crystal-clear spring where you watch fish through emerald water.'],
  ['Grand Haven Pier', 'Grand Haven', 'Lighthouse', 43.0570, -86.2480, 'Twin red lighthouses along a catwalk pier at sunset.'],
]

const MN: Raw[] = [
  ['Split Rock Lighthouse', 'Two Harbors', 'Lighthouse', 47.2003, -91.3670, 'A 1910 lighthouse atop a 130-foot cliff over Lake Superior — Minnesota’s icon.'],
  ['Minnehaha Falls', 'Minneapolis', 'Waterfall', 44.9150, -93.2110, 'A 53-foot urban waterfall in a wooded city park.'],
  ['Gooseberry Falls', 'Two Harbors', 'Waterfall', 47.1390, -91.4710, 'A series of waterfalls tumbling toward Lake Superior on the North Shore.'],
  ['Boundary Waters', 'Ely', 'Lake', 47.9500, -91.5000, 'A million-acre wilderness of interconnected lakes and canoe routes.'],
  ['Stone Arch Bridge', 'Minneapolis', 'Bridge', 44.9810, -93.2560, 'A historic curved rail bridge over St. Anthony Falls and the skyline.'],
  ['Palisade Head', 'Silver Bay', 'Mountains', 47.3210, -91.2100, 'Sheer rhyolite cliffs above Lake Superior with sweeping views.'],
  ['Itasca State Park', 'Park Rapids', 'Nature', 47.2070, -95.2080, 'The headwaters of the Mississippi River amid old-growth pines.'],
  ['High Falls Grand Portage', 'Grand Portage', 'Waterfall', 47.9990, -89.7000, 'The tallest waterfall in Minnesota on the Pigeon River.'],
  ['Lake of the Isles', 'Minneapolis', 'Lake', 44.9560, -93.3070, 'A serene city lake ringed by mansions and walking paths.'],
  ['Mystery Cave', 'Preston', 'Nature', 43.6300, -92.2600, 'Minnesota’s longest cave with underground pools and formations.'],
]

const MS: Raw[] = [
  ['Windsor Ruins', 'Port Gibson', 'Historic', 31.9300, -91.0500, 'Twenty-three towering Corinthian columns, all that remain of an antebellum mansion.'],
  ['Biloxi Lighthouse', 'Biloxi', 'Lighthouse', 30.3920, -88.9030, 'A cast-iron 1848 lighthouse in the median of a coastal highway.'],
  ['Natchez Bluffs', 'Natchez', 'Historic', 31.5590, -91.4030, 'Antebellum mansions on bluffs above the Mississippi River.'],
  ['Gulf Islands Seashore', 'Ocean Springs', 'Beach', 30.3900, -88.7900, 'White-sand barrier-island beaches on the Gulf of Mexico.'],
  ['Tishomingo State Park', 'Tishomingo', 'Nature', 34.6100, -88.1800, 'Mossy sandstone outcrops and a swinging bridge in the Appalachian foothills.'],
  ['Natchez Trace Parkway', 'Tupelo', 'Nature', 34.2580, -88.7780, 'A historic forested parkway with cypress swamps and the Sunken Trace.'],
  ['Vicksburg Battlefield', 'Vicksburg', 'Historic', 32.3530, -90.8500, 'A sprawling Civil War park of monuments above the river.'],
  ['Clark Creek', 'Woodville', 'Waterfall', 31.0800, -91.5200, 'A network of waterfalls hidden in loess ravines near the river.'],
  ['Ship Island', 'Gulfport', 'Beach', 30.2130, -88.9200, 'A remote barrier island with Fort Massachusetts and clear Gulf water.'],
  ['Friendship Cemetery', 'Columbus', 'Historic', 33.4900, -88.4100, 'Live oaks and antebellum monuments where Memorial Day was born.'],
]

const MO: Raw[] = [
  ['Gateway Arch', 'St. Louis', 'Landmark', 38.6247, -90.1848, 'The 630-foot stainless-steel arch on the Mississippi, the tallest monument in the US.'],
  ['Ha Ha Tonka', 'Camdenton', 'Historic', 38.0700, -92.7700, 'Castle ruins on a bluff above a spring-fed lake in the Ozarks.'],
  ['Elephant Rocks', 'Belleview', 'Nature', 37.6540, -90.6880, 'Giant rounded granite boulders standing end to end like elephants.'],
  ['Johnson’s Shut-Ins', 'Middlebrook', 'Nature', 37.5400, -90.8500, 'Volcanic rock chutes and natural water slides on the Black River.'],
  ['Forest Park', 'St. Louis', 'Park', 38.6360, -90.2840, 'A grand urban park with the art museum atop Art Hill.'],
  ['Grand Falls', 'Joplin', 'Waterfall', 37.0200, -94.5300, 'The largest continuously flowing waterfall in Missouri.'],
  ['Onondaga Cave', 'Leasburg', 'Nature', 38.0600, -91.2300, 'A show cave with active formations and an underground river.'],
  ['Kansas City Fountains', 'Kansas City', 'Architecture', 39.0440, -94.5900, 'The City of Fountains and the Spanish-style Country Club Plaza.'],
  ['Taum Sauk Mountain', 'Ironton', 'Mountains', 37.5720, -90.7280, 'The highest point in Missouri, near Mina Sauk Falls.'],
  ['Katy Trail', 'Rocheport', 'Nature', 38.9800, -92.5600, 'A rail-trail along the Missouri River beneath limestone bluffs.'],
]

const MT: Raw[] = [
  ['Glacier St. Mary Lake', 'St. Mary', 'Lake', 48.6680, -113.4380, 'Wild Goose Island in a turquoise glacial lake ringed by sharp peaks — a Glacier classic.'],
  ['Going-to-the-Sun Road', 'West Glacier', 'Mountains', 48.7500, -113.7800, 'A breathtaking alpine highway over Logan Pass in Glacier National Park.'],
  ['Hidden Lake', 'West Glacier', 'Lake', 48.6950, -113.7180, 'An alpine lake below Bearhat Mountain, reached from Logan Pass.'],
  ['Lake McDonald', 'West Glacier', 'Lake', 48.5800, -113.8800, 'Famous multicolored pebbles beneath crystal-clear glacial water.'],
  ['Beartooth Highway', 'Red Lodge', 'Mountains', 45.0000, -109.4000, 'A switchbacking road to 10,947 feet past alpine lakes and tundra.'],
  ['Bigfork / Flathead Lake', 'Bigfork', 'Lake', 47.9100, -114.0700, 'The largest natural freshwater lake in the West, with cherry orchards.'],
  ['Garnet Ghost Town', 'Drummond', 'Historic', 46.8200, -113.3300, 'Montana’s best-preserved gold-mining ghost town.'],
  ['Quake Lake', 'West Yellowstone', 'Lake', 44.8300, -111.4200, 'A lake formed by a 1959 earthquake, with ghostly standing dead trees.'],
  ['Bighorn Canyon', 'Fort Smith', 'Canyon', 45.0900, -108.1700, 'Sheer red canyon walls above a deep blue reservoir.'],
  ['Pictograph Cave', 'Billings', 'Historic', 45.7300, -108.4100, 'Ancient rock paintings in sandstone caves on the plains.'],
]

const NE: Raw[] = [
  ['Chimney Rock', 'Bayard', 'Nature', 41.7030, -103.3460, 'A 300-foot spire that guided Oregon Trail pioneers across the plains.'],
  ['Scotts Bluff', 'Gering', 'Nature', 41.8300, -103.7070, 'Towering bluffs and a wagon-trail summit road over the North Platte.'],
  ['Toadstool Geologic Park', 'Crawford', 'Nature', 42.8700, -103.5800, 'Badlands hoodoos and toadstool rock formations in the Oglala grassland.'],
  ['Carhenge', 'Alliance', 'Street Art', 42.1420, -102.8580, 'A replica of Stonehenge built from vintage gray-painted automobiles.'],
  ['Sandhills', 'Valentine', 'Nature', 42.3000, -100.5500, 'The largest sand dune formation in the Western Hemisphere, grass-covered and rolling.'],
  ['Smith Falls', 'Valentine', 'Waterfall', 42.8900, -100.3000, "Nebraska's tallest waterfall on the Niobrara River."],
  ['Ashfall Fossil Beds', 'Royal', 'Historic', 42.4250, -98.1580, 'Complete fossil skeletons preserved in volcanic ash.'],
  ['Indian Cave', 'Shubert', 'Nature', 40.2600, -95.5600, 'Forested bluffs and a sandstone cave above the Missouri River.'],
  ['Lake McConaughy', 'Ogallala', 'Lake', 41.2500, -101.7000, 'A vast reservoir with white-sand beaches under big skies.'],
  ['Nebraska State Capitol', 'Lincoln', 'Architecture', 40.8080, -96.6990, 'A soaring 400-foot Art Deco tower crowned by "The Sower".'],
]

const NV: Raw[] = [
  ['Fire Wave', 'Overton', 'Desert', 36.4710, -114.5170, 'Striped red-and-white sandstone undulating like frozen waves in Valley of Fire.'],
  ['Valley of Fire', 'Overton', 'Desert', 36.4290, -114.5150, 'Brilliant red Aztec sandstone formations and ancient petroglyphs.'],
  ['Red Rock Canyon', 'Las Vegas', 'Desert', 36.1350, -115.4270, 'Towering red sandstone escarpments minutes from the Strip.'],
  ['Lake Tahoe (NV)', 'Incline Village', 'Lake', 39.2400, -119.9400, 'Sand Harbor’s clear water and granite boulders on the lake’s east shore.'],
  ['Las Vegas Strip', 'Las Vegas', 'Skyline', 36.1147, -115.1728, 'The neon-soaked boulevard of mega-resorts, dazzling at night.'],
  ['Great Basin / Wheeler Peak', 'Baker', 'Mountains', 38.9850, -114.3130, 'Ancient bristlecone pines and dark-sky stargazing below a 13,000-foot peak.'],
  ['Cathedral Gorge', 'Panaca', 'Canyon', 37.8200, -114.4100, 'Slot canyons and cathedral-like spires of soft bentonite clay.'],
  ['Hoover Dam', 'Boulder City', 'Architecture', 36.0160, -114.7370, 'An Art Deco engineering marvel arcing across the Colorado River canyon.'],
  ['Bonneville Salt / Black Rock', 'Gerlach', 'Desert', 40.7500, -119.2000, 'A vast white playa, surreal and empty to the horizon.'],
  ['Lamoille Canyon', 'Lamoille', 'Mountains', 40.6400, -115.4000, 'The "Yosemite of Nevada" — glacial canyon in the Ruby Mountains.'],
]

const NH: Raw[] = [
  ['Mount Washington', 'Sargents Purchase', 'Mountains', 44.2705, -71.3033, 'The Northeast’s highest peak, famed for extreme weather and cog-railway summit views.'],
  ['Flume Gorge', 'Lincoln', 'Canyon', 44.0970, -71.6810, 'A narrow granite gorge with a boardwalk beside a rushing stream.'],
  ['Diana’s Baths', 'Bartlett', 'Waterfall', 44.0760, -71.1800, 'A staircase of small waterfalls and pools in the White Mountains.'],
  ['Cannon Mountain', 'Franconia', 'Mountains', 44.1570, -71.6990, 'Aerial-tram summit views over Franconia Notch.'],
  ['Lake Winnipesaukee', 'Meredith', 'Lake', 43.6200, -71.3000, 'New Hampshire’s largest lake, dotted with islands and mountains.'],
  ['Kancamagus Highway', 'Lincoln', 'Nature', 44.0000, -71.4000, 'A 34-mile scenic byway ablaze with autumn color.'],
  ['Portsmouth Harbor', 'New Castle', 'Lighthouse', 43.0710, -70.7080, 'A historic lighthouse at the mouth of the Piscataqua River.'],
  ['Sabbaday Falls', 'Waterville Valley', 'Waterfall', 43.9900, -71.3900, 'A multi-tiered waterfall through a carved flume.'],
  ['Mount Monadnock', 'Jaffrey', 'Mountains', 42.8610, -72.1080, 'One of the most-climbed mountains in the world, with bald-rock summit views.'],
  ['Castle in the Clouds', 'Moultonborough', 'Architecture', 43.7500, -71.3100, 'An Arts-and-Crafts mansion on a ridge above Lake Winnipesaukee.'],
]

const NJ: Raw[] = [
  ['Cape May Lighthouse', 'Cape May', 'Lighthouse', 38.9330, -74.9600, 'An 1859 lighthouse over Victorian Cape May and Atlantic dunes.'],
  ['Atlantic City Boardwalk', 'Atlantic City', 'Skyline', 39.3540, -74.4290, 'The world’s first boardwalk, lined with casinos and ocean views.'],
  ['Great Falls Paterson', 'Paterson', 'Waterfall', 40.9160, -74.1810, 'A 77-foot urban waterfall that powered America’s first planned industrial city.'],
  ['Liberty State Park', 'Jersey City', 'Skyline', 40.7050, -74.0550, 'Statue of Liberty and Manhattan skyline views across the harbor.'],
  ['Sandy Hook', 'Highlands', 'Beach', 40.4350, -73.9900, 'A barrier spit with the oldest working lighthouse in the US and NYC skyline views.'],
  ['Lucy the Elephant', 'Margate City', 'Landmark', 39.3210, -74.5110, 'A six-story elephant-shaped building from 1881 on the shore.'],
  ['Delaware Water Gap', 'Hardwick', 'Mountains', 41.0900, -75.1300, 'A dramatic river gap cut through the Kittatinny Ridge.'],
  ['Ocean Grove', 'Ocean Grove', 'Historic', 40.2120, -74.0070, 'Victorian "tent city" and a grand auditorium by the sea.'],
  ['Buttermilk Falls NJ', 'Layton', 'Waterfall', 41.1900, -74.8700, 'The tallest waterfall in New Jersey, cascading in tiers.'],
  ['Grounds for Sculpture', 'Hamilton', 'Street Art', 40.2300, -74.6900, 'A 42-acre park of monumental contemporary sculptures.'],
]

const NM: Raw[] = [
  ['White Sands', 'Alamogordo', 'Desert', 32.7790, -106.1710, 'Rippling dunes of pure white gypsum sand glowing pink at sunset.'],
  ['Bisti Badlands', 'Farmington', 'Desert', 36.2600, -108.0000, 'Surreal hoodoos and petrified-wood formations in a remote badland.'],
  ['Carlsbad Caverns', 'Carlsbad', 'Nature', 32.1480, -104.5570, 'A vast underground chamber of dripstone, and a famous bat exodus at dusk.'],
  ['Taos Pueblo', 'Taos', 'Architecture', 36.4390, -105.5450, 'A 1,000-year-old multistoried adobe pueblo, still inhabited.'],
  ['Tent Rocks', 'Cochiti', 'Canyon', 35.6600, -106.4100, 'Cone-shaped tent rock hoodoos and a slot-canyon slot trail.'],
  ['Santa Fe Plaza', 'Santa Fe', 'Architecture', 35.6870, -105.9380, 'Adobe architecture, the historic Palace of the Governors, and golden light.'],
  ['Rio Grande Gorge Bridge', 'Taos', 'Bridge', 36.4640, -105.7290, 'A steel arch 565 feet above the Rio Grande, the West’s great chasm.'],
  ['Shiprock', 'Shiprock', 'Desert', 36.6870, -108.8360, 'A 1,500-foot volcanic monolith sacred to the Navajo, rising from the desert.'],
  ['Sandia Peak', 'Albuquerque', 'Mountains', 35.2080, -106.4490, 'A tramway to a 10,378-foot ridge glowing watermelon-pink at sunset.'],
  ['Valles Caldera', 'Jemez Springs', 'Nature', 35.8900, -106.5300, 'A vast grassy volcanic caldera roamed by elk.'],
]

const NY: Raw[] = [
  ['Niagara Falls', 'Niagara Falls', 'Waterfall', 43.0962, -79.0377, 'The thundering Horseshoe and American falls, mist-wrapped and floodlit at night.'],
  ['Brooklyn Bridge', 'New York', 'Bridge', 40.7061, -73.9969, 'The 1883 Gothic-arched suspension bridge over the East River with skyline views.'],
  ['Central Park Bow Bridge', 'New York', 'Park', 40.7757, -73.9712, 'A cast-iron bridge over the lake framing Manhattan’s skyline.'],
  ['Top of the Rock', 'New York', 'Skyline', 40.7593, -73.9794, 'The classic Empire State Building and Central Park panorama.'],
  ['Watkins Glen', 'Watkins Glen', 'Waterfall', 42.3760, -76.8720, 'Nineteen waterfalls along a gorge trail of stone bridges and tunnels.'],
  ['Letchworth Gorge', 'Castile', 'Canyon', 42.5870, -78.0510, 'The "Grand Canyon of the East" with three major waterfalls and a rail trestle.'],
  ['Times Square', 'New York', 'Skyline', 40.7580, -73.9855, 'The dazzling neon crossroads of the world.'],
  ['Lake Placid', 'Lake Placid', 'Mountains', 44.2790, -73.9790, 'Adirondack High Peaks reflected in a mirror lake.'],
  ['Montauk Point Light', 'Montauk', 'Lighthouse', 41.0710, -71.8570, 'New York’s oldest lighthouse on the easternmost tip of Long Island.'],
  ['Flatiron Building', 'New York', 'Architecture', 40.7411, -73.9897, 'The iconic 1902 wedge-shaped skyscraper at a Manhattan crossroads.'],
  ['Kaaterskill Falls', 'Haines Falls', 'Waterfall', 42.1960, -74.0600, 'A 260-foot two-tier waterfall in the Catskills, painted by the Hudson River School.'],
  ['Storm King', 'New Windsor', 'Street Art', 41.4250, -74.0570, 'A 500-acre open-air museum of monumental landscape sculpture.'],
]

const NC: Raw[] = [
  ['Cape Hatteras Light', 'Buxton', 'Lighthouse', 35.2510, -75.5290, 'The tallest brick lighthouse in America, spiral-striped on the Outer Banks.'],
  ['Blue Ridge Parkway', 'Asheville', 'Mountains', 35.5950, -82.4500, 'America’s favorite scenic drive, ablaze with autumn color and ridge overlooks.'],
  ['Linville Falls', 'Linville Falls', 'Waterfall', 35.9540, -81.9280, 'A powerful multi-tier waterfall in the rugged Linville Gorge.'],
  ['Biltmore Estate', 'Asheville', 'Architecture', 35.5400, -82.5510, 'America’s largest home, a 250-room French Renaissance château.'],
  ['Chimney Rock', 'Chimney Rock', 'Mountains', 35.4320, -82.2440, 'A granite monolith with an American flag and Hickory Nut Gorge views.'],
  ['Cape Lookout', 'Harkers Island', 'Lighthouse', 34.6230, -76.5240, 'A diamond-patterned lighthouse on a wild barrier island.'],
  ['Grandfather Mountain', 'Linville', 'Mountains', 36.0950, -81.8310, 'A mile-high swinging bridge over a rocky alpine summit.'],
  ['Whitewater Falls', 'Sapphire', 'Waterfall', 35.0290, -83.0150, 'The highest waterfall east of the Rockies, plunging 411 feet.'],
  ['Wright Brothers Memorial', 'Kill Devil Hills', 'Historic', 36.0140, -75.6680, 'A granite monument on the dune where powered flight began.'],
  ['Max Patch', 'Hot Springs', 'Mountains', 35.8000, -82.9600, 'A grassy bald with 360-degree Appalachian sunset views.'],
]

const ND: Raw[] = [
  ['Theodore Roosevelt NP', 'Medora', 'Nature', 46.9790, -103.5390, 'Colorful painted badlands roamed by bison and wild horses.'],
  ['Painted Canyon', 'Medora', 'Canyon', 46.8900, -103.3800, 'A sweeping badlands overlook of banded buttes and ravines.'],
  ['Enchanted Highway', 'Regent', 'Street Art', 46.4200, -102.5500, 'A 32-mile road lined with giant scrap-metal sculptures.'],
  ['North Dakota Capitol', 'Bismarck', 'Architecture', 46.8200, -100.7800, 'A 19-story Art Deco "Skyscraper on the Prairie".'],
  ['Lake Sakakawea', 'Pick City', 'Lake', 47.5000, -101.4000, 'One of the largest man-made lakes in the US, with big-sky sunsets.'],
  ['Sullys Hill', 'Fort Totten', 'Nature', 47.9800, -98.9600, 'A wooded preserve and bison range above Devils Lake.'],
  ['Pembina Gorge', 'Walhalla', 'Canyon', 48.9200, -97.8600, 'The deepest river valley in North Dakota, forested and remote.'],
  ['White Butte', 'Amidon', 'Nature', 46.3850, -103.3000, 'The highest point in North Dakota, rising from the badlands.'],
  ['Fort Mandan', 'Washburn', 'Historic', 47.2900, -101.0900, 'A reconstruction of Lewis and Clark’s 1804 winter fort.'],
  ['International Peace Garden', 'Dunseith', 'Park', 48.9990, -100.0590, 'A formal garden straddling the US–Canada border.'],
]

const OH: Raw[] = [
  ['Hocking Hills', 'Logan', 'Canyon', 39.4280, -82.5410, 'Old Man’s Cave gorge, recessed caves, and waterfalls in hemlock-shaded sandstone.'],
  ['Cuyahoga Valley Brandywine', 'Peninsula', 'Waterfall', 41.2770, -81.5400, 'A 65-foot waterfall in Ohio’s only national park.'],
  ['Cleveland Skyline', 'Cleveland', 'Skyline', 41.4990, -81.6940, 'The Rock Hall and waterfront towers over Lake Erie.'],
  ['Marblehead Lighthouse', 'Marblehead', 'Lighthouse', 41.5360, -82.7120, 'The oldest continuously operating lighthouse on the Great Lakes.'],
  ['Cedar Point', 'Sandusky', 'Landmark', 41.4820, -82.6830, 'A roller-coaster skyline on a Lake Erie peninsula.'],
  ['Ash Cave', 'South Bloomingville', 'Canyon', 39.3970, -82.5460, 'A vast horseshoe-shaped recess cave with a slender waterfall.'],
  ['Lake Erie Islands', 'Put-in-Bay', 'Lake', 41.6520, -82.8170, 'Perry’s Victory monument and island harbors on Lake Erie.'],
  ['Serpent Mound', 'Peebles', 'Historic', 39.0250, -83.4300, 'A 1,348-foot prehistoric effigy mound coiled along a ridge.'],
  ['Conkles Hollow', 'Rockbridge', 'Canyon', 39.4500, -82.5700, 'One of the deepest gorges in Ohio with sheer cliff rims.'],
  ['Columbus Skyline', 'Columbus', 'Skyline', 39.9610, -83.0000, 'The Scioto Mile and bridges reflecting the downtown towers.'],
]

const OK: Raw[] = [
  ['Wichita Mountains', 'Lawton', 'Mountains', 34.7280, -98.7100, 'Ancient granite peaks and free-roaming bison on the southern plains.'],
  ['Turner Falls', 'Davis', 'Waterfall', 34.4250, -97.1470, 'A 77-foot waterfall into a natural swimming pool in the Arbuckle Mountains.'],
  ['Gloss Mountains', 'Fairview', 'Mountains', 36.3400, -98.5600, 'Flat-topped mesas glittering with selenite crystal in red-rock country.'],
  ['Great Salt Plains', 'Jet', 'Desert', 36.7500, -98.2000, 'A vast white salt flat where you can dig hourglass selenite crystals.'],
  ['Beavers Bend', 'Broken Bow', 'Nature', 34.1390, -94.6810, 'Pine forests and a clear river beneath the Ouachita Mountains.'],
  ['Tulsa Art Deco', 'Tulsa', 'Architecture', 36.1540, -95.9920, 'One of America’s richest collections of Art Deco towers.'],
  ['Black Mesa', 'Kenton', 'Nature', 36.9300, -102.9700, 'The highest point in Oklahoma in a remote panhandle landscape.'],
  ['Robbers Cave', 'Wilburton', 'Nature', 34.9900, -95.3300, 'Sandstone bluffs and a cave once used by outlaws.'],
  ['Oklahoma City Memorial', 'Oklahoma City', 'Landmark', 35.4730, -97.5070, 'The Field of Empty Chairs and reflecting pool, moving at dusk.'],
  ['Natural Falls', 'West Siloam Springs', 'Waterfall', 36.1700, -94.6700, 'A 77-foot waterfall in a lush green grotto.'],
]

const OR: Raw[] = [
  ['Crater Lake', 'Crater Lake', 'Lake', 42.9446, -122.1090, 'The deepest lake in the US — impossibly blue water filling a collapsed volcano.'],
  ['Multnomah Falls', 'Bridal Veil', 'Waterfall', 45.5762, -122.1158, 'A 620-foot two-tier waterfall with an arched footbridge, Oregon’s most famous.'],
  ['Cannon Beach Haystack Rock', 'Cannon Beach', 'Beach', 45.8847, -123.9680, 'A 235-foot sea stack rising from a misty Pacific beach.'],
  ['Thor’s Well', 'Yachats', 'Beach', 44.2780, -124.1130, 'A coastal "sinkhole" that swallows and erupts seawater at high tide.'],
  ['Painted Hills', 'Mitchell', 'Desert', 44.6610, -120.2740, 'Banded red, gold, and black hills glowing at golden hour.'],
  ['Mount Hood / Trillium Lake', 'Government Camp', 'Mountains', 45.2440, -121.7270, 'Oregon’s tallest peak mirrored in a still alpine lake.'],
  ['Columbia River Gorge', 'Hood River', 'Canyon', 45.7000, -121.5000, 'A dramatic river canyon strung with waterfalls and basalt cliffs.'],
  ['Smith Rock', 'Terrebonne', 'Mountains', 44.3680, -121.1390, 'Sheer volcanic tuff cliffs above a river bend, birthplace of US sport climbing.'],
  ['Toketee Falls', 'Idleyld Park', 'Waterfall', 43.2660, -122.4230, 'A waterfall framed by towering columnar basalt.'],
  ['Proxy Falls', 'McKenzie Bridge', 'Waterfall', 44.1620, -121.9200, 'A delicate veil cascading over moss-covered lava rock.'],
]

const PA: Raw[] = [
  ['Fallingwater', 'Mill Run', 'Architecture', 39.9060, -79.4680, 'Frank Lloyd Wright’s masterpiece cantilevered over a waterfall.'],
  ['Philadelphia Skyline / Art Museum', 'Philadelphia', 'Architecture', 39.9656, -75.1810, 'The "Rocky Steps" and Greek-revival museum framing the skyline.'],
  ['Pine Creek Gorge', 'Wellsboro', 'Canyon', 41.6900, -77.4500, 'The "Grand Canyon of Pennsylvania", 1,000 feet deep and forested.'],
  ['Ricketts Glen', 'Benton', 'Waterfall', 41.3300, -76.2700, 'A trail past 21 named waterfalls in an old-growth gorge.'],
  ['Pittsburgh Skyline', 'Pittsburgh', 'Skyline', 40.4400, -80.0090, 'The Mount Washington overlook of three rivers and golden bridges.'],
  ['Gettysburg', 'Gettysburg', 'Historic', 39.8090, -77.2350, 'Rolling battlefields, monuments, and Little Round Top at dawn.'],
  ['Longwood Gardens', 'Kennett Square', 'Park', 39.8700, -75.6740, 'Grand fountains and conservatories on a former du Pont estate.'],
  ['Ohiopyle Falls', 'Ohiopyle', 'Waterfall', 39.8690, -79.4920, 'A wide waterfall on the Youghiogheny River in the Laurel Highlands.'],
  ['Hawk Falls / Hickory Run', 'White Haven', 'Waterfall', 41.0300, -75.6700, 'A waterfall and a field of boulders left by glaciers.'],
  ['Kinzua Bridge Skywalk', 'Mount Jewett', 'Bridge', 41.7610, -78.5880, 'A partially collapsed rail viaduct turned glass-floored skywalk.'],
]

const RI: Raw[] = [
  ['The Breakers', 'Newport', 'Architecture', 41.4699, -71.2986, 'A Gilded Age Vanderbilt mansion on the cliffs above the Atlantic.'],
  ['Cliff Walk', 'Newport', 'Beach', 41.4790, -71.3000, 'A 3.5-mile path between Gilded Age mansions and crashing surf.'],
  ['Beavertail Lighthouse', 'Jamestown', 'Lighthouse', 41.4490, -71.3990, 'A rugged-rock lighthouse at the mouth of Narragansett Bay.'],
  ['Block Island', 'Block Island', 'Beach', 41.1680, -71.5580, 'The Mohegan Bluffs and Southeast Light on dramatic clay cliffs.'],
  ['WaterFire Providence', 'Providence', 'Skyline', 41.8260, -71.4090, 'Bonfires on the river at the heart of the capital at night.'],
  ['Newport Harbor', 'Newport', 'Skyline', 41.4870, -71.3160, 'Sailing yachts and church steeples in a classic New England harbor.'],
  ['Sachuest Point', 'Middletown', 'Beach', 41.4790, -71.2440, 'A coastal wildlife refuge of rocky shore and surf.'],
  ['Roger Williams Park', 'Providence', 'Park', 41.7900, -71.4180, 'Victorian gardens, lakes, and a domed museum.'],
  ['Point Judith Light', 'Narragansett', 'Lighthouse', 41.3610, -71.4810, 'A working lighthouse marking a storied stretch of coast.'],
  ['Watch Hill', 'Westerly', 'Beach', 41.3050, -71.8580, 'A historic carousel and breezy bluff over the ocean.'],
]

const SC: Raw[] = [
  ['Angel Oak', 'Johns Island', 'Nature', 32.7180, -80.0810, 'A sprawling live oak estimated at 400+ years, its limbs touching the ground.'],
  ['Charleston Rainbow Row', 'Charleston', 'Architecture', 32.7760, -79.9270, 'A row of pastel Georgian houses along the historic waterfront.'],
  ['Boneyard Beach', 'Bulls Island', 'Beach', 32.8800, -79.6300, 'A surreal beach of sun-bleached, salt-killed oak skeletons.'],
  ['Caesars Head', 'Cleveland', 'Mountains', 35.1080, -82.6320, 'A granite overlook of the Blue Ridge escarpment and Table Rock.'],
  ['Magnolia Plantation', 'Charleston', 'Park', 32.8870, -80.0810, 'America’s oldest public garden, with mossy oaks and reflective ponds.'],
  ['Myrtle Beach', 'Myrtle Beach', 'Beach', 33.6890, -78.8860, 'A bustling boardwalk and SkyWheel along the Grand Strand.'],
  ['Hunting Island Light', 'Hunting Island', 'Lighthouse', 32.3760, -80.4380, 'A climbable lighthouse on a wild maritime-forest beach.'],
  ['Table Rock', 'Pickens', 'Mountains', 35.0270, -82.6980, 'A massive granite dome reflected in a mountain reservoir.'],
  ['Congaree National Park', 'Hopkins', 'Nature', 33.7930, -80.7820, 'The largest old-growth bottomland forest, with towering cypress.'],
  ['Ravenel Bridge', 'Charleston', 'Bridge', 32.8040, -79.9080, 'A sweeping cable-stayed bridge over the Cooper River.'],
]

const SD: Raw[] = [
  ['Mount Rushmore', 'Keystone', 'Landmark', 43.8791, -103.4591, 'Four presidents carved 60 feet tall into a granite mountain face.'],
  ['Badlands National Park', 'Interior', 'Nature', 43.8554, -102.3397, 'Striped, eroded spires and buttes glowing at sunrise and sunset.'],
  ['Custer State Park', 'Custer', 'Nature', 43.7500, -103.4200, 'Granite spires, the Needles Highway, and a roaming bison herd.'],
  ['Crazy Horse Memorial', 'Crazy Horse', 'Landmark', 43.8360, -103.6230, 'The world’s largest mountain carving in progress.'],
  ['Sylvan Lake', 'Custer', 'Lake', 43.8470, -103.5580, 'A still lake encircled by granite boulders in the Black Hills.'],
  ['Spearfish Canyon', 'Spearfish', 'Canyon', 44.3800, -103.8400, 'Limestone walls and waterfalls along a forested canyon drive.'],
  ['Wind Cave', 'Hot Springs', 'Nature', 43.5570, -103.4780, 'One of the world’s longest caves, with rare boxwork formations.'],
  ['Needles Highway', 'Custer', 'Mountains', 43.8200, -103.5000, 'A road threading granite needles and one-lane tunnels.'],
  ['Falls Park', 'Sioux Falls', 'Waterfall', 43.5560, -96.7210, 'Pink quartzite falls of the Big Sioux River in the city center.'],
  ['Palisades State Park', 'Garretson', 'Nature', 43.6900, -96.5300, 'Sheer quartzite cliffs along Split Rock Creek.'],
]

const TN: Raw[] = [
  ['Great Smoky Mountains', 'Gatlinburg', 'Mountains', 35.6532, -83.5070, 'Mist-layered ridgelines, the most-visited national park, glowing at sunrise from Clingmans Dome.'],
  ['Roan Mountain', 'Roan Mountain', 'Mountains', 36.1040, -82.1300, 'Grassy balds and the world’s largest natural rhododendron garden.'],
  ['Fall Creek Falls', 'Spencer', 'Waterfall', 35.6620, -85.3550, 'One of the highest waterfalls in the eastern US at 256 feet.'],
  ['Nashville Skyline', 'Nashville', 'Skyline', 36.1620, -86.7740, 'The pedestrian bridge and "Batman" tower over the Cumberland River.'],
  ['Ruby Falls', 'Chattanooga', 'Waterfall', 35.0180, -85.3390, 'A 145-foot underground waterfall deep inside Lookout Mountain.'],
  ['Rock City', 'Lookout Mountain', 'Nature', 34.9720, -85.3500, 'Sandstone passages and a "see seven states" overlook.'],
  ['Cummins Falls', 'Cookeville', 'Waterfall', 36.2470, -85.5660, 'A wide swimming-hole waterfall in a river gorge.'],
  ['Foster Falls', 'Sequatchie', 'Waterfall', 35.1800, -85.6700, 'A 60-foot waterfall plunging into a plunge pool on the Cumberland Plateau.'],
  ['Memphis Beale Street', 'Memphis', 'Skyline', 35.1390, -90.0510, 'Neon blues clubs and the Mississippi riverfront.'],
  ['Burgess Falls', 'Sparta', 'Waterfall', 36.0420, -85.5900, 'A series of cascades dropping into a deep gorge.'],
]

const TX: Raw[] = [
  ['Big Bend', 'Big Bend', 'Desert', 29.1275, -103.2425, 'Vast desert, the Chisos Mountains, and the Rio Grande canyons under dark skies.'],
  ['San Antonio River Walk', 'San Antonio', 'Architecture', 29.4250, -98.4860, 'A cypress-lined canal of arched bridges and lantern light below street level.'],
  ['The Alamo', 'San Antonio', 'Historic', 29.4259, -98.4861, 'The 18th-century mission and shrine of Texas independence.'],
  ['Enchanted Rock', 'Fredericksburg', 'Mountains', 30.5060, -98.8190, 'A massive pink-granite dome glowing at sunset in the Hill Country.'],
  ['Hamilton Pool', 'Dripping Springs', 'Nature', 30.3420, -98.1270, 'A collapsed grotto with a waterfall into a jade-green pool.'],
  ['Palo Duro Canyon', 'Canyon', 'Canyon', 34.9370, -101.6600, 'The second-largest canyon in the US, banded red and orange.'],
  ['Gulf Coast Galveston', 'Galveston', 'Beach', 29.3010, -94.7980, 'Historic piers and beaches along the Gulf of Mexico.'],
  ['Big Bend Santa Elena', 'Terlingua', 'Canyon', 29.1660, -103.6100, 'Sheer 1,500-foot canyon walls split by the Rio Grande.'],
  ['Austin Skyline / Congress Bats', 'Austin', 'Skyline', 30.2640, -97.7450, 'The skyline and 1.5 million bats streaming from Congress Avenue Bridge at dusk.'],
  ['Caddo Lake', 'Uncertain', 'Lake', 32.7100, -94.1000, 'A maze of bayous and cypress draped in Spanish moss.'],
  ['Marfa', 'Marfa', 'Desert', 30.3090, -104.0210, 'High-desert art town with the Prada Marfa installation and mystery lights.'],
  ['Guadalupe Peak', 'Salt Flat', 'Mountains', 31.8910, -104.8600, 'The highest point in Texas, rising from the Chihuahuan Desert.'],
]

const UT: Raw[] = [
  ['Delicate Arch', 'Moab', 'Desert', 38.7436, -109.4993, 'The free-standing arch icon of Utah, framing the La Sal Mountains at sunset.'],
  ['Mesa Arch', 'Moab', 'Desert', 38.3886, -109.8680, 'A cliff-edge arch that glows fiery orange-red at sunrise in Canyonlands.'],
  ['Bryce Canyon', 'Bryce', 'Canyon', 37.5930, -112.1871, 'An amphitheater of thousands of orange hoodoo spires, surreal at sunrise.'],
  ['Zion Narrows', 'Springdale', 'Canyon', 37.2850, -112.9480, 'A river hike between 1,000-foot sandstone walls.'],
  ['Angels Landing', 'Springdale', 'Mountains', 37.2690, -112.9470, 'A knife-edge ridge with chains to a dizzying canyon overlook.'],
  ['Horseshoe Bend region / Reflection Canyon', 'Escalante', 'Canyon', 37.2700, -110.9000, 'Serpentine river canyons carved in red rock.'],
  ['Monument Valley (UT)', 'Mexican Hat', 'Desert', 37.0040, -110.0150, 'Mitten buttes and the Forrest Gump highway stretching to the horizon.'],
  ['The Wave / Coyote Buttes', 'Kanab', 'Desert', 37.0000, -112.0000, 'Swirling striped sandstone in a remote permit-only basin.'],
  ['Great Salt Lake Spiral Jetty', 'Corinne', 'Lake', 41.4380, -112.6690, 'Robert Smithson’s earthwork coiling into a pink salt lake.'],
  ['Dead Horse Point', 'Moab', 'Canyon', 38.4830, -109.7400, 'A gooseneck of the Colorado River 2,000 feet below a mesa rim.'],
  ['Cathedral Valley', 'Torrey', 'Desert', 38.4000, -111.4000, 'Monolithic sandstone temples in remote Capitol Reef.'],
  ['Bonneville Salt Flats', 'Wendover', 'Desert', 40.7600, -113.8500, 'A blinding-white salt plain stretching to the mountains.'],
]

const VT: Raw[] = [
  ['Sleepy Hollow Farm', 'Woodstock', 'Nature', 43.6360, -72.4870, 'A storybook farmhouse and winding lane, the most-photographed scene in Vermont autumn.'],
  ['Stowe / Mount Mansfield', 'Stowe', 'Mountains', 44.5440, -72.8140, "Vermont's highest peak above a classic church-steeple village."],
  ['Quechee Gorge', 'Quechee', 'Canyon', 43.6390, -72.4070, "Vermont's deepest gorge, 165 feet down to the Ottauquechee River."],
  ['Moss Glen Falls', 'Stowe', 'Waterfall', 44.5300, -72.7600, 'A graceful waterfall in a narrow forested gorge.'],
  ['Jenne Farm', 'Reading', 'Nature', 43.5300, -72.5500, 'An iconic red-barn farmstead amid rolling autumn hills.'],
  ['Smugglers Notch', 'Cambridge', 'Mountains', 44.5560, -72.7900, 'A narrow mountain pass between towering cliffs and boulders.'],
  ['Lake Willoughby', 'Westmore', 'Lake', 44.7300, -72.0500, 'A fjord-like glacial lake between two steep mountains.'],
  ['Church Street Burlington', 'Burlington', 'Skyline', 44.4790, -73.2120, 'A brick pedestrian marketplace near Lake Champlain sunsets.'],
  ['Texas Falls', 'Hancock', 'Waterfall', 43.9500, -72.8600, 'A series of cascades through sculpted rock in the Green Mountains.'],
  ['Hildene', 'Manchester', 'Architecture', 43.1500, -73.0700, 'Lincoln family Georgian mansion with formal gardens and mountain views.'],
]

const VA: Raw[] = [
  ['Skyline Drive', 'Luray', 'Mountains', 38.5000, -78.4500, 'A 105-mile ridge-top drive through Shenandoah with blue-layered mountain overlooks.'],
  ['McAfee Knob', 'Catawba', 'Mountains', 37.3920, -80.0370, 'The most-photographed overlook on the Appalachian Trail, a jutting rock ledge.'],
  ['Great Falls VA', 'McLean', 'Waterfall', 38.9970, -77.2540, 'The Potomac River roaring through a rocky gorge near DC.'],
  ['Colonial Williamsburg', 'Williamsburg', 'Historic', 37.2710, -76.7000, 'A restored 18th-century town of brick buildings and costumed life.'],
  ['Natural Bridge', 'Natural Bridge', 'Nature', 37.6280, -79.5430, 'A 215-foot limestone arch once surveyed by George Washington.'],
  ['Virginia Beach Boardwalk', 'Virginia Beach', 'Beach', 36.8520, -75.9780, 'A 3-mile oceanfront boardwalk and King Neptune statue.'],
  ['Shenandoah Dark Hollow Falls', 'Syria', 'Waterfall', 38.5200, -78.4300, 'A cascading waterfall over greenstone in the national park.'],
  ['Chincoteague', 'Chincoteague', 'Beach', 37.9330, -75.3580, 'Wild ponies and a candy-striped lighthouse on the Eastern Shore.'],
  ['Monticello', 'Charlottesville', 'Architecture', 38.0080, -78.4530, 'Thomas Jefferson’s neoclassical mountaintop home.'],
  ['Crabtree Falls', 'Montebello', 'Waterfall', 37.8500, -79.0800, 'The highest cascading waterfall east of the Mississippi.'],
]

const WA: Raw[] = [
  ['Mount Rainier / Reflection Lakes', 'Ashford', 'Mountains', 46.7700, -121.7300, 'A 14,411-foot glaciated volcano mirrored in alpine lakes and wildflower meadows.'],
  ['Snoqualmie Falls', 'Snoqualmie', 'Waterfall', 47.5417, -121.8377, 'A 268-foot waterfall taller than Niagara, often mist-wrapped.'],
  ['Space Needle / Seattle', 'Seattle', 'Skyline', 47.6205, -122.3493, 'The skyline and Space Needle framed by Mount Rainier at sunset.'],
  ['Diablo Lake', 'Newhalem', 'Lake', 48.7140, -121.1360, 'A startlingly turquoise glacial lake in the North Cascades.'],
  ['Ruby Beach', 'Forks', 'Beach', 47.7100, -124.4150, 'Sea stacks and driftwood on a wild Olympic coast beach.'],
  ['Palouse Falls', 'LaCrosse', 'Waterfall', 46.6640, -118.2240, 'A 200-foot waterfall plunging into a desert canyon, Washington’s state waterfall.'],
  ['Hoh Rain Forest', 'Forks', 'Nature', 47.8600, -123.9350, 'Moss-draped old-growth in one of the wettest places in the US.'],
  ['Deception Pass Bridge', 'Oak Harbor', 'Bridge', 48.4060, -122.6470, 'A dramatic bridge over churning tidal waters between islands.'],
  ['Mount St. Helens', 'Toutle', 'Mountains', 46.1910, -122.1950, 'The blown-out crater of the 1980 eruption amid recovering forest.'],
  ['Cape Flattery', 'Neah Bay', 'Beach', 48.3840, -124.7130, 'The northwesternmost point of the contiguous US, with sea caves and cliffs.'],
]

const WV: Raw[] = [
  ['New River Gorge Bridge', 'Fayetteville', 'Bridge', 38.0700, -81.0760, 'One of the longest steel arch bridges in the world, soaring over a forested gorge.'],
  ['Blackwater Falls', 'Davis', 'Waterfall', 39.1130, -79.4900, 'An amber-tinted 57-foot waterfall in a rhododendron canyon.'],
  ['Seneca Rocks', 'Seneca Rocks', 'Mountains', 38.8350, -79.3730, 'A sheer 900-foot quartzite fin rising above the valley.'],
  ['Glade Creek Grist Mill', 'Clifftop', 'Historic', 37.8200, -80.9300, 'A picturesque working mill beside a creek in Babcock State Park.'],
  ['Dolly Sods', 'Hopeville', 'Nature', 39.0300, -79.3300, 'A high windswept plateau of bogs, heath, and one-sided spruce.'],
  ['Harpers Ferry', 'Harpers Ferry', 'Historic', 39.3260, -77.7290, 'A historic town at the dramatic confluence of two rivers.'],
  ['Cooper’s Rock', 'Morgantown', 'Canyon', 39.6600, -79.7900, 'A clifftop overlook of the Cheat River gorge.'],
  ['Sandstone Falls', 'Hinton', 'Waterfall', 37.7700, -80.8900, 'The largest waterfall on the New River, spanning the channel.'],
  ['Spruce Knob', 'Riverton', 'Mountains', 38.6990, -79.5320, 'The highest point in West Virginia with a stone observation tower.'],
  ['Grandview', 'Beaver', 'Canyon', 37.8300, -81.0600, 'A sweeping overlook of a horseshoe bend in the New River Gorge.'],
]

const WI: Raw[] = [
  ['Apostle Islands Sea Caves', 'Bayfield', 'Beach', 46.9300, -90.6600, 'Lake Superior sea caves that freeze into ice cathedrals in winter.'],
  ['Wisconsin Dells', 'Wisconsin Dells', 'Canyon', 43.6270, -89.7710, 'Sandstone gorges and cliffs along the Wisconsin River.'],
  ['Devil’s Lake', 'Baraboo', 'Lake', 43.4280, -89.7300, 'A clear lake ringed by 500-foot quartzite bluffs.'],
  ['Cave Point', 'Sturgeon Bay', 'Beach', 44.9200, -87.2700, 'Limestone cliffs and underwater caves on the Door County shore.'],
  ['Milwaukee Art Museum', 'Milwaukee', 'Architecture', 43.0400, -87.8970, 'Calatrava’s winged "Burke Brise Soleil" on the Lake Michigan shore.'],
  ['Lake Geneva', 'Lake Geneva', 'Lake', 42.5910, -88.4330, 'A historic resort lake ringed by Gilded Age estates.'],
  ['Pewits Nest', 'Baraboo', 'Canyon', 43.4600, -89.7900, 'A hidden slot gorge with waterfalls and pools.'],
  ['Door County Lighthouses', 'Baileys Harbor', 'Lighthouse', 45.0600, -87.1200, 'The Cana Island Light on a rocky causeway in Lake Michigan.'],
  ['Pattison State Park', 'Superior', 'Waterfall', 46.5300, -91.8500, 'Big Manitou Falls, the highest waterfall in Wisconsin.'],
  ['Holy Hill', 'Hubertus', 'Architecture', 43.2500, -88.2900, 'A twin-spired basilica on a glacial hill above autumn forest.'],
]

const WY: Raw[] = [
  ['Grand Teton / Schwabacher', 'Moose', 'Mountains', 43.7900, -110.6800, 'The jagged Teton range mirrored in a quiet Snake River channel at sunrise.'],
  ['Grand Prismatic Spring', 'Yellowstone', 'Nature', 44.5250, -110.8380, 'A vast rainbow-ringed hot spring, the largest in the US.'],
  ['Old Faithful', 'Yellowstone', 'Nature', 44.4605, -110.8281, 'The world’s most famous geyser, erupting on a near-clockwork schedule.'],
  ['Mormon Row / T.A. Moulton Barn', 'Moose', 'Historic', 43.7350, -110.6500, 'The most-photographed barn in America beneath the Tetons.'],
  ['Lower Yellowstone Falls', 'Yellowstone', 'Waterfall', 44.7180, -110.4960, 'A 308-foot waterfall in the colorful Grand Canyon of the Yellowstone.'],
  ['Jenny Lake', 'Moose', 'Lake', 43.7600, -110.7200, 'A glassy lake at the foot of the Tetons with Hidden Falls.'],
  ['Devils Tower', 'Devils Tower', 'Nature', 44.5902, -104.7146, 'A 867-foot volcanic monolith rising from the plains, the first national monument.'],
  ['Mammoth Hot Springs', 'Yellowstone', 'Nature', 44.9700, -110.7000, 'Terraced travertine pools cascading like a frozen waterfall.'],
  ['Snake River Overlook', 'Moose', 'Mountains', 43.7400, -110.6300, 'Ansel Adams’ famous vista of the river bending below the Tetons.'],
  ['Hot Springs / Thermopolis', 'Thermopolis', 'Nature', 43.6500, -108.2000, 'The world’s largest mineral hot spring with travertine terraces.'],
]

// ─── REGISTRY ────────────────────────────────────────────────────────────────
// All authored states. Each expands to full PhotoSpots via the generator.
const RAW_BY_STATE: Record<string, Raw[]> = {
  AL, AK, AZ, AR, CA, CO,
  CT, DE, GA, HI, ID, IL, IN, IA,
  KS, KY, LA, ME, MD, MA, MI,
  MN, MS, MO, MT, NE, NV, NH,
  NJ, NM, NY, NC, ND, OH, OK,
  OR, PA, RI, SC, SD, TN, TX, UT,
  VT, VA, WA, WV, WI, WY,
}

// Supplemental rows that deepen each state toward 30 spots. Defined in
// RAW_EXTRA below and merged per state. Dedupes by name within a state.
function mergedRaws(state: string): Raw[] {
  const base = RAW_BY_STATE[state] ?? []
  const extra = RAW_EXTRA[state] ?? []
  const seen = new Set(base.map(r => r[0].toLowerCase()))
  return [...base, ...extra.filter(r => !seen.has(r[0].toLowerCase()))]
}

const ALL_STATE_CODES = Object.keys(RAW_BY_STATE)

// ─── SUPPLEMENTAL SPOTS (deepening toward 30/state) ──────────────────────────
const RAW_EXTRA: Record<string, Raw[]> = {
  AL: [
    ['DeSoto Falls', 'Mentone', 'Waterfall', 34.5800, -85.6200, 'A 104-foot waterfall plunging into a deep gorge atop Lookout Mountain.'],
    ['Gulf Shores Beach', 'Gulf Shores', 'Beach', 30.2460, -87.7010, 'Miles of sugar-white sand and emerald Gulf water on the Alabama coast.'],
    ['Birmingham Museum / Railroad Park', 'Birmingham', 'Skyline', 33.5060, -86.8090, 'A green urban park reflecting the downtown skyline.'],
    ['Wheeler Wildlife Refuge', 'Decatur', 'Nature', 34.5400, -86.9700, 'Wintering sandhill cranes and wetlands along the Tennessee River.'],
    ['Rickwood Caverns', 'Warrior', 'Nature', 33.8800, -86.8600, 'A 260-million-year-old limestone cave with an underground pool.'],
    ['Fort Morgan', 'Gulf Shores', 'Historic', 30.2280, -88.0240, 'A star-shaped 19th-century fort guarding Mobile Bay.'],
    ['Mobile Bay Causeway', 'Spanish Fort', 'Nature', 30.6500, -87.9300, 'Marshland sunsets and the bay skyline along the causeway.'],
    ['High Falls Park', 'Geraldine', 'Waterfall', 34.3600, -85.9000, 'A wide rocky waterfall with a natural bridge above it.'],
    ['Oak Mountain State Park', 'Pelham', 'Nature', 33.3300, -86.7600, "Alabama's largest state park with lakes, ridges, and waterfalls."],
    ['Stephens Gap Cave', 'Woodville', 'Nature', 34.6200, -86.3000, 'A famous cave pit where a light beam falls onto a waterfall.'],
    ['Montgomery Riverfront', 'Montgomery', 'Skyline', 32.3790, -86.3080, 'The Alabama River and capital skyline at golden hour.'],
    ['Cheaha Bald Rock', 'Delta', 'Mountains', 33.4900, -85.8100, 'A boardwalk to a cliff edge with sweeping forest views.'],
    ['Dismals Canyon', 'Phil Campbell', 'Canyon', 34.3200, -87.7700, 'A sandstone gorge famous for glowing bioluminescent "dismalites".'],
    ['Point Mallard', 'Decatur', 'Nature', 34.5700, -86.9500, 'Riverside park and wetlands on the Tennessee River.'],
    ['Fort Toulouse', 'Wetumpka', 'Historic', 32.5050, -86.2530, 'A reconstructed colonial fort at the river confluence.'],
    ['Wetumpka Crater', 'Wetumpka', 'Nature', 32.5300, -86.2000, 'The rim of an ancient meteor impact crater.'],
    ['Bon Secour Refuge', 'Gulf Shores', 'Beach', 30.2400, -87.8200, 'Protected dunes and nesting sea-turtle beaches.'],
    ['Sipsey Wilderness', 'Double Springs', 'Waterfall', 34.3300, -87.4000, '"Land of a Thousand Waterfalls" in Bankhead Forest.'],
    ['Tannehill Ironworks', 'McCalla', 'Historic', 33.2400, -87.0700, 'Civil War-era furnace ruins in a wooded park.'],
    ['Gulf State Park Lake', 'Gulf Shores', 'Lake', 30.2700, -87.6400, 'Coastal lakes and trails behind the dune line.'],
  ],
  AK: [
    ['Tracy Arm Fjord', 'Juneau', 'Nature', 57.8300, -133.5800, 'A narrow fjord of sheer cliffs, waterfalls, and twin Sawyer glaciers.'],
    ['Worthington Glacier', 'Valdez', 'Nature', 61.1700, -145.7500, 'A roadside glacier you can walk right up to near Thompson Pass.'],
    ['Byron Glacier', 'Girdwood', 'Nature', 60.7700, -148.8400, 'A short trail to an ice field and avalanche slopes.'],
    ['Anchorage Coastal Trail', 'Anchorage', 'Nature', 61.2100, -149.9100, 'A bayside trail with Sleeping Lady mountain and beluga views.'],
    ['Valdez Harbor', 'Valdez', 'Mountains', 61.1300, -146.3500, 'A fishing harbor ringed by snow-capped peaks and waterfalls.'],
    ['Seward Resurrection Bay', 'Seward', 'Nature', 60.1200, -149.4400, 'A deep fjord harbor framed by mountains and glaciers.'],
    ['Eklutna Lake', 'Chugiak', 'Lake', 61.4100, -149.1300, 'A glacier-fed turquoise lake in the Chugach Mountains.'],
    ['Reflections Lake', 'Palmer', 'Lake', 61.5400, -149.0300, 'Still water mirroring the Chugach near the Knik River.'],
    ['Thunderbird Falls', 'Chugiak', 'Waterfall', 61.4500, -149.3500, 'A short forest trail to a misty gorge waterfall.'],
    ['Knik Glacier', 'Palmer', 'Nature', 61.4200, -148.4000, 'A vast glacier calving icebergs into a meltwater lake.'],
    ['Nome / Bering Coast', 'Nome', 'Beach', 64.5000, -165.4000, 'Gold-rush beaches and tundra on the Bering Sea.'],
    ['Katmai Brooks Falls', 'King Salmon', 'Waterfall', 58.5600, -155.7800, 'Brown bears catching leaping salmon at a famous waterfall.'],
    ['Wrangell-St. Elias', 'Copper Center', 'Mountains', 61.7100, -142.9900, 'The largest national park, with massive peaks and glaciers.'],
    ['Homer Spit', 'Homer', 'Beach', 59.6000, -151.4200, 'A long gravel spit into Kachemak Bay below glaciers.'],
    ['Chena Hot Springs', 'Fairbanks', 'Nature', 65.0500, -146.0500, 'Steaming springs and an aurora-viewing resort.'],
    ['Savage River', 'Denali Park', 'Mountains', 63.7400, -149.3000, 'Tundra valley walk with Denali-range views.'],
    ['Kennecott Mines', 'McCarthy', 'Historic', 61.4800, -142.8800, 'Red ghost-town mill buildings beneath the Root Glacier.'],
    ['Bird Creek', 'Anchorage', 'Nature', 60.9700, -149.4800, 'Turnagain Arm fishing and bore-tide viewing.'],
    ['Flattop Mountain', 'Anchorage', 'Mountains', 61.1000, -149.6800, 'The most-climbed peak in Alaska, overlooking the city.'],
    ['Skagway', 'Skagway', 'Historic', 59.4600, -135.3100, 'A preserved gold-rush town and the White Pass railway.'],
  ],
  AZ: [
    ['Cathedral Rock Trail', 'Sedona', 'Mountains', 34.8200, -111.7900, 'A steep scramble to a saddle between red-rock spires.'],
    ['Devil’s Bridge', 'Sedona', 'Desert', 34.9020, -111.8150, 'The largest natural sandstone arch in the Sedona area.'],
    ['Lake Powell', 'Page', 'Lake', 36.9370, -111.4840, 'Sapphire water winding through red-rock canyons.'],
    ['Bell Rock', 'Sedona', 'Mountains', 34.8000, -111.7660, 'A bell-shaped red butte glowing at sunset.'],
    ['Meteor Crater', 'Winslow', 'Desert', 35.0270, -111.0220, 'A nearly mile-wide impact crater in the high desert.'],
    ['Tucson Saguaro East', 'Tucson', 'Desert', 32.1800, -110.7300, 'Dense saguaro forest against the Rincon Mountains.'],
    ['Grand Canyon Desert View', 'Grand Canyon', 'Canyon', 36.0440, -111.8260, 'The historic Watchtower and an eastern canyon panorama.'],
    ['Slide Rock', 'Sedona', 'Nature', 34.9430, -111.7530, 'A natural sandstone water slide in Oak Creek Canyon.'],
    ['Vermilion Cliffs', 'Marble Canyon', 'Desert', 36.8000, -111.6000, 'Towering red cliffs and condor country.'],
    ['Antelope Point', 'Page', 'Lake', 36.9300, -111.4400, 'Sweeping Lake Powell vistas and slot-canyon access.'],
    ['Sabino Canyon', 'Tucson', 'Desert', 32.3100, -110.8200, 'A desert canyon with creek pools below the Catalinas.'],
    ['Montezuma Castle', 'Camp Verde', 'Historic', 34.6110, -111.8350, 'A cliff dwelling tucked into a limestone alcove.'],
    ['Jerome', 'Jerome', 'Historic', 34.7490, -112.1130, 'A hillside mining town clinging to Cleopatra Hill.'],
    ['Oak Creek Canyon', 'Sedona', 'Canyon', 34.9900, -111.7400, 'A switchbacking canyon drive between red walls and pines.'],
    ['Lake Havasu / London Bridge', 'Lake Havasu City', 'Bridge', 34.4670, -114.3490, 'The relocated London Bridge over a desert lake.'],
    ['Picacho Peak', 'Picacho', 'Mountains', 32.6450, -111.4000, 'A sharp desert peak blanketed with spring wildflowers.'],
    ['Walnut Canyon', 'Flagstaff', 'Canyon', 35.1700, -111.5100, 'Cliff dwellings along a forested limestone canyon.'],
    ['Coal Mine Canyon', 'Tuba City', 'Canyon', 36.0500, -111.0500, 'Eroded pink-and-white hoodoos on the Navajo Nation.'],
    ['Sunset Crater', 'Flagstaff', 'Desert', 35.3640, -111.5030, 'A black cinder volcano amid ponderosa pines.'],
    ['Tonto Bridge Pine Creek', 'Pine', 'Nature', 34.3200, -111.4500, 'Fern grottos beneath the world’s largest travertine bridge.'],
  ],
  AR: [
    ['Petit Jean Cedar Falls', 'Morrilton', 'Waterfall', 35.1180, -92.9370, 'A 95-foot waterfall in a fern-lined box canyon.'],
    ['Buffalo River Steel Creek', 'Ponca', 'Nature', 36.0300, -93.3500, 'Towering bluffs above a clear emerald river bend.'],
    ['Devil’s Den', 'West Fork', 'Nature', 35.7800, -94.2400, 'Sandstone crevices and a CCC-built dam in the Boston Mountains.'],
    ['Eden Falls', 'Ponca', 'Waterfall', 35.9900, -93.4400, 'A multi-tier waterfall ending at Lost Valley.'],
    ['Mount Magazine Cameron Bluff', 'Paris', 'Mountains', 35.1670, -93.6450, 'Cliff-edge overlooks from Arkansas’s highest mountain.'],
    ['Crater of Diamonds', 'Murfreesboro', 'Nature', 34.0330, -93.6720, 'The only public diamond-search site in the world.'],
    ['Lake Ouachita', 'Mountain Pine', 'Lake', 34.5700, -93.2000, 'One of the cleanest lakes in the US, dotted with islands.'],
    ['Thorncrown Chapel', 'Eureka Springs', 'Architecture', 36.4080, -93.7560, 'A glass chapel of 425 windows tucked in the Ozark woods.'],
    ['Eureka Springs', 'Eureka Springs', 'Historic', 36.4010, -93.7380, 'A Victorian mountain town of winding streets and springs.'],
    ['Hawksbill Crag Sunset', 'Jasper', 'Mountains', 35.8890, -93.4561, 'Golden-hour light on the iconic overhanging crag.'],
    ['Pinnacle Mountain Summit', 'Little Rock', 'Mountains', 34.8380, -92.5230, 'A rocky cone with Arkansas River valley views.'],
    ['Cossatot Falls', 'Wickes', 'Nature', 34.3900, -94.2200, 'A staircase of whitewater ledges through hardwood forest.'],
    ['Glory Hole Falls', 'Fallsville', 'Waterfall', 35.7400, -93.3700, 'A waterfall pouring through a hole in a rock ceiling.'],
    ['Mystic Caverns', 'Harrison', 'Nature', 36.1300, -93.0700, 'Twin show caves with a towering crystal dome.'],
    ['Blanchard Springs', 'Fifty-Six', 'Waterfall', 35.9600, -92.1700, 'A spring gushing from a bluff into clear pools.'],
    ['Sam’s Throne', 'Mount Judea', 'Mountains', 35.8500, -93.0700, 'A famous climbing bluff with sweeping valley views.'],
    ['Kings River Falls', 'Boston', 'Waterfall', 36.0400, -93.6300, 'A wide ledge waterfall on a clear Ozark river.'],
    ['Lake Dardanelle', 'Russellville', 'Lake', 35.2700, -93.1700, 'A broad reservoir below Mount Nebo’s bluffs.'],
    ['Mount Nebo', 'Dardanelle', 'Mountains', 35.2200, -93.2400, 'Bench overlooks of the Arkansas River valley.'],
    ['White River Bluffs', 'Calico Rock', 'Nature', 36.1200, -92.1400, 'Limestone bluffs above a misty river town.'],
  ],
  CA: [
    ['Big Sur McWay Overlook', 'Big Sur', 'Beach', 36.1580, -121.6720, 'The classic turquoise cove and waterfall from the highway pullout.'],
    ['Lake Tahoe Sand Harbor', 'Incline Village', 'Lake', 39.2000, -119.9300, 'Clear water over granite boulders on the lake’s east shore.'],
    ['Glass Beach', 'Fort Bragg', 'Beach', 39.4500, -123.8100, 'A shoreline of sea-tumbled colored glass pebbles.'],
    ['Lake Tahoe Emerald Bay Overlook', 'South Lake Tahoe', 'Lake', 38.9540, -120.1100, 'The island-dotted bay from the highway viewpoint.'],
    ['Antelope Valley Poppies', 'Lancaster', 'Nature', 34.7200, -118.3900, 'Hillsides ablaze with orange poppies each spring.'],
    ['Golden Gate Baker Beach', 'San Francisco', 'Beach', 37.7935, -122.4840, 'The bridge framed by surf and rocky shore.'],
    ['Mount Shasta', 'Mount Shasta', 'Mountains', 41.4090, -122.1940, 'A massive solitary volcano reflected in alpine lakes.'],
    ['Burney Falls', 'Burney', 'Waterfall', 41.0120, -121.6520, 'A 129-foot spring-fed waterfall, "the eighth wonder".'],
    ['Lassen Bumpass Hell', 'Mineral', 'Nature', 40.4540, -121.4000, 'Boiling mud pots and steaming fumaroles on a boardwalk.'],
    ['Channel Islands', 'Ventura', 'Beach', 34.0070, -119.7790, 'Sea caves and wild coastline on remote islands.'],
  ],
  CO: [
    ['Hanging Lake Trail', 'Glenwood Springs', 'Waterfall', 39.6010, -107.1920, 'Travertine pools and waterfalls reached by a steep climb.'],
    ['Pikes Peak Summit', 'Cascade', 'Mountains', 38.8409, -105.0442, "America's Mountain, a 14er reachable by cog railway."],
    ['Trail Ridge Road', 'Estes Park', 'Mountains', 40.3930, -105.6830, 'The highest continuous paved road in the US, above treeline.'],
    ['Red Rocks Amphitheatre', 'Morrison', 'Architecture', 39.6655, -105.2050, 'A natural sandstone amphitheater with city-light views.'],
    ['Hanging Lake Maroon Bells Sunrise', 'Aspen', 'Mountains', 39.0708, -106.9890, 'First light on the twin peaks mirrored in the lake.'],
    ['Royal Gorge', 'Cañon City', 'Canyon', 38.4783, -105.3253, 'A 1,000-foot granite gorge spanned by a high bridge.'],
    ['Garden of the Gods Balanced Rock', 'Colorado Springs', 'Nature', 38.8700, -104.8870, 'A precariously balanced red sandstone boulder.'],
    ['Hanging Bridge Glenwood Canyon', 'Glenwood Springs', 'Canyon', 39.5700, -107.2200, 'Sheer walls along the Colorado River corridor.'],
    ['San Juan Skyway Million Dollar Hwy', 'Ouray', 'Mountains', 38.0230, -107.6710, 'A cliff-hugging road through the rugged San Juans.'],
    ['Great Sand Dunes Medano Creek', 'Mosca', 'Desert', 37.7320, -105.5120, 'A seasonal creek at the foot of the towering dunes.'],
    ['Hanging Lake Hanging Flume', 'Uravan', 'Canyon', 38.3500, -108.7300, 'A historic wooden flume clinging to a canyon wall.'],
    ['Mount Sneffels', 'Ouray', 'Mountains', 38.0040, -107.7920, 'A jagged 14er above golden aspen groves.'],
    ['Paint Mines', 'Calhan', 'Desert', 39.0300, -104.2400, 'Colorful eroded clay hoodoos on the eastern plains.'],
    ['Crested Butte Wildflowers', 'Crested Butte', 'Mountains', 38.8700, -106.9800, "The wildflower capital of Colorado in July."],
    ['Bishop Castle', 'Rye', 'Architecture', 38.0900, -105.0300, 'A hand-built stone castle with iron towers in the forest.'],
  ],
  CT: [
    ['Mystic Drawbridge', 'Mystic', 'Bridge', 41.3540, -71.9660, 'A 1922 bascule bridge over the Mystic River downtown.'],
    ['Sleeping Giant', 'Hamden', 'Mountains', 41.4220, -72.9020, 'A stone tower atop a ridge shaped like a reclining giant.'],
    ['Southford Falls', 'Southbury', 'Waterfall', 41.4700, -73.2300, 'A covered bridge and cascades in a quiet state park.'],
    ['Mystic Seaport Ships', 'Mystic', 'Historic', 41.3640, -71.9650, 'Tall ships and the Charles W. Morgan whaler.'],
    ['Hammonasset Sunrise', 'Madison', 'Beach', 41.2640, -72.5460, 'Long Island Sound sunrises over a two-mile beach.'],
    ['East Rock Park', 'New Haven', 'Skyline', 41.3300, -72.9100, 'A trap-rock cliff overlooking the city and harbor.'],
    ['Devil’s Hopyard', 'East Haddam', 'Waterfall', 41.4860, -72.3430, 'Chapman Falls and potholes in a wooded gorge.'],
    ['Mark Twain House', 'Hartford', 'Architecture', 41.7670, -72.7010, 'A Victorian Gothic mansion where Twain wrote his classics.'],
    ['Gillette Castle Terrace', 'East Haddam', 'Architecture', 41.4220, -72.4280, 'River views from the stone castle’s terraces.'],
    ['Stratford Point Light', 'Stratford', 'Lighthouse', 41.1510, -73.1030, 'A candy-striped lighthouse at the Housatonic’s mouth.'],
    ['Kent Falls Cascade', 'Kent', 'Waterfall', 41.7660, -73.4170, 'A 250-foot series of cascades beside a trail.'],
    ['Mystic Aquarium Coast', 'Mystic', 'Beach', 41.3700, -71.9700, 'Rocky coastal coves near the historic seaport.'],
    ['Bear Mountain CT', 'Salisbury', 'Mountains', 42.0500, -73.4300, "Connecticut's highest peak with a stone summit cairn."],
    ['Bushnell Park', 'Hartford', 'Park', 41.7650, -72.6810, 'A historic carousel and arch beneath the gold-domed capitol.'],
    ['Enders Falls', 'Granby', 'Waterfall', 41.9500, -72.8400, 'A series of five waterfalls in a hemlock glen.'],
  ],
  DE: [
    ['Cape Henlopen Tower', 'Lewes', 'Historic', 38.7740, -75.0900, 'A WWII observation tower above the dunes.'],
    ['Rehoboth Beach Sunrise', 'Rehoboth Beach', 'Beach', 38.7210, -75.0760, 'Atlantic sunrises over the boardwalk.'],
    ['Bombay Hook Sunrise', 'Smyrna', 'Nature', 39.2610, -75.4670, 'Golden-hour light over a vast tidal marsh.'],
    ['Wilmington Riverfront', 'Wilmington', 'Skyline', 39.7320, -75.5500, 'A revived riverwalk along the Christina River.'],
    ['Brandywine Park', 'Wilmington', 'Park', 39.7700, -75.5500, 'Stone bridges and a riverside walk in the city.'],
    ['Lewes Beach', 'Lewes', 'Beach', 38.7820, -75.1390, 'Calm bay beaches at the Delaware Breakwater.'],
    ['Trap Pond Cypress', 'Laurel', 'Nature', 38.5260, -75.4810, 'The northernmost natural stand of bald cypress.'],
    ['Hagley Museum', 'Wilmington', 'Historic', 39.7660, -75.5930, 'The original du Pont powder mills along the Brandywine.'],
    ['Indian River Inlet Night', 'Bethany Beach', 'Bridge', 38.6100, -75.0670, 'The blue-lit cable bridge over the inlet at night.'],
    ['Delaware Seashore', 'Rehoboth Beach', 'Beach', 38.6600, -75.0700, 'Dunes and surf between the bay and the ocean.'],
    ['Killens Pond', 'Felton', 'Lake', 39.0300, -75.5400, 'A wooded mill pond with reflective still water.'],
    ['Fort Delaware Pea Patch', 'Delaware City', 'Historic', 39.5870, -75.5680, 'A moated island fortress in the river.'],
    ['White Clay Creek', 'Newark', 'Nature', 39.7200, -75.7600, 'Rolling meadows and a clear creek valley.'],
    ['Cape May–Lewes Ferry', 'Lewes', 'Nature', 38.7950, -75.1180, 'Bay crossings with sweeping water horizons.'],
    ['Auburn Heights Steam', 'Yorklyn', 'Historic', 39.8050, -75.6720, 'A Victorian estate and steam-car collection.'],
  ],
  GA: [
    ['Savannah Bonaventure', 'Savannah', 'Historic', 32.0470, -81.0530, 'Live-oak avenues and statuary in a famous riverside cemetery.'],
    ['Tybee Island Light', 'Tybee Island', 'Lighthouse', 32.0210, -80.8450, 'A black-and-white striped lighthouse on the coast.'],
    ['Anna Ruby Falls', 'Helen', 'Waterfall', 34.7600, -83.7100, 'Twin waterfalls meeting at the base in the mountains.'],
    ['Cloudland Canyon', 'Rising Fawn', 'Canyon', 34.8340, -85.4820, 'Deep sandstone gorges and waterfalls on Lookout Mountain.'],
    ['Toccoa Falls', 'Toccoa', 'Waterfall', 34.5930, -83.3590, 'A 186-foot waterfall taller than Niagara on a college campus.'],
    ['Helen Alpine Village', 'Helen', 'Architecture', 34.7010, -83.7250, 'A Bavarian-themed mountain town on the Chattahoochee.'],
    ['Tallulah Gorge Bridge', 'Tallulah Falls', 'Canyon', 34.7390, -83.3920, 'A suspension bridge swaying over a deep gorge.'],
    ['Savannah River Street', 'Savannah', 'Skyline', 32.0810, -81.0900, 'Cobblestone wharves and ships along the river.'],
    ['Radium Springs', 'Albany', 'Nature', 31.5200, -84.1400, 'A blue-green spring and historic casino ruins.'],
    ['Vogel State Park', 'Blairsville', 'Lake', 34.7660, -83.9270, 'A mountain lake below Blood Mountain’s autumn slopes.'],
    ['Sweetwater Creek', 'Lithia Springs', 'Nature', 33.7500, -84.6200, 'Mill ruins along a rushing creek near Atlanta.'],
    ['Amicalola Reflection Pool', 'Dawsonville', 'Waterfall', 34.5590, -84.2480, 'The base pool of the Southeast’s tallest waterfall.'],
    ['Atlanta Skyline Piedmont', 'Atlanta', 'Skyline', 33.7860, -84.3730, 'Midtown towers from Piedmont Park’s lake.'],
    ['Black Rock Mountain', 'Mountain City', 'Mountains', 34.9050, -83.4120, "Georgia's highest state park with Blue Ridge vistas."],
    ['Driftwood Beach Sunrise', 'Jekyll Island', 'Beach', 31.0890, -81.4120, 'Sunrise behind the skeletal driftwood trees.'],
  ],
  HI: [
    ['Pipeline Banzai', 'Haleiwa', 'Beach', 21.6650, -158.0530, 'The famous North Shore surf break with monster barrels in winter.'],
    ['Hanauma Bay', 'Honolulu', 'Beach', 21.2690, -157.6940, 'A curved volcanic bay and snorkeling reef.'],
    ['Wailua Falls', 'Lihue', 'Waterfall', 22.0360, -159.3780, 'A double waterfall plunging 80 feet on Kauai.'],
    ['Kalalau Lookout', 'Waimea', 'Mountains', 22.1530, -159.6320, 'A clifftop view into the Na Pali valley.'],
    ['Makapuu Lighthouse', 'Waimanalo', 'Lighthouse', 21.3100, -157.6490, 'A clifftop trail to a red-roofed lighthouse and ocean views.'],
    ['Akaka Falls', 'Honomu', 'Waterfall', 19.8540, -155.1510, 'A 442-foot waterfall in a Big Island rainforest.'],
    ['Papakolea Green Sand', 'Naalehu', 'Beach', 18.9360, -155.6470, 'A rare olivine green-sand beach near the southern tip.'],
    ['Punaluu Black Sand', 'Naalehu', 'Beach', 19.1360, -155.5040, 'Jet-black volcanic sand where sea turtles bask.'],
    ['Iao Needle', 'Wailuku', 'Mountains', 20.8810, -156.5440, 'A 1,200-foot green spire in a lush Maui valley.'],
    ['Nakalele Blowhole', 'Wailuku', 'Beach', 21.0290, -156.5870, 'A coastal geyser erupting through lava rock.'],
    ['Kee Beach', 'Hanalei', 'Beach', 22.2200, -159.5820, 'A reef-protected beach at the start of the Na Pali coast.'],
    ['Manoa Falls', 'Honolulu', 'Waterfall', 21.3330, -157.8000, 'A 150-foot waterfall in a bamboo rainforest.'],
    ['Halona Blowhole', 'Honolulu', 'Beach', 21.2820, -157.6780, 'A blowhole and hidden cove on Oahu’s east coast.'],
    ['Rainbow Falls', 'Hilo', 'Waterfall', 19.7190, -155.1110, 'An 80-foot waterfall that casts morning rainbows.'],
    ['Mauna Loa', 'Volcano', 'Mountains', 19.4790, -155.6030, 'The largest active volcano on Earth, vast and barren.'],
  ],
  ID: [
    ['Sawtooth Stanley Lake', 'Stanley', 'Lake', 44.2480, -115.0490, 'McGown Peak mirrored in a calm alpine lake.'],
    ['Mesa Falls Upper', 'Ashton', 'Waterfall', 44.1880, -111.3320, 'A thundering 114-foot waterfall with a viewing boardwalk.'],
    ['Sun Valley', 'Sun Valley', 'Mountains', 43.6970, -114.3520, 'Bald Mountain ski slopes above a historic resort town.'],
    ['Snake River Canyon', 'Twin Falls', 'Canyon', 42.5990, -114.4640, 'A deep basalt gorge spanned by the Perrine Bridge.'],
    ['Sawtooth Alice Lake', 'Stanley', 'Lake', 43.9300, -114.9700, 'A turquoise basin lake beneath jagged peaks.'],
    ['Coeur d’Alene Boardwalk', 'Coeur d’Alene', 'Lake', 47.6740, -116.7800, 'The world’s longest floating boardwalk on a mountain lake.'],
    ['Bruneau Overlook', 'Mountain Home', 'Desert', 42.8950, -115.7060, 'A towering dune above desert lakes.'],
    ['Sawtooth Sawtooth Lake', 'Stanley', 'Lake', 44.0300, -115.0200, 'The largest alpine lake in the range below Mount Regan.'],
    ['Shoshone Falls Overlook', 'Twin Falls', 'Waterfall', 42.5950, -114.4010, 'The "Niagara of the West" from a canyon-rim deck.'],
    ['Craters of the Moon Cones', 'Arco', 'Nature', 43.4160, -113.5170, 'Black cinder cones and lava tubes in a stark moonscape.'],
    ['Hells Canyon Overlook', 'Riggins', 'Canyon', 45.2420, -116.7020, 'North America’s deepest gorge from a rim viewpoint.'],
    ['Payette Lake', 'McCall', 'Lake', 44.9100, -116.1000, 'A clear forested lake in a mountain resort town.'],
    ['Salmon River', 'Riggins', 'Nature', 45.4200, -116.3200, '"The River of No Return" through a rugged canyon.'],
    ['Lake Pend Oreille', 'Sandpoint', 'Lake', 48.1700, -116.3300, 'Idaho’s largest lake ringed by the Selkirk Mountains.'],
    ['City of Rocks Spires', 'Almo', 'Desert', 42.0760, -113.7130, 'Granite pinnacles glowing at sunset on the Oregon Trail.'],
    ['Thousand Springs', 'Hagerman', 'Waterfall', 42.7300, -114.8400, 'Springs cascading from a canyon wall into the Snake River.'],
    ['Sawtooth Redfish Overlook', 'Stanley', 'Lake', 44.1430, -114.9170, 'A panoramic deck above Redfish Lake and the peaks.'],
    ['Balanced Rock', 'Buhl', 'Nature', 42.5300, -114.8900, 'A 48-foot rock balanced on a tiny pedestal.'],
    ['Boise River Greenbelt', 'Boise', 'Skyline', 43.6150, -116.2020, 'A tree-lined river path through the capital.'],
    ['Henrys Lake', 'Island Park', 'Lake', 44.6300, -111.4000, 'A still mountain lake near the Yellowstone border.'],
  ],
  IL: [
    ['Chicago Skyline Lakefront', 'Chicago', 'Skyline', 41.8800, -87.6100, 'The downtown towers from the lakefront trail at dawn.'],
    ['Buckingham Fountain', 'Chicago', 'Architecture', 41.8758, -87.6189, 'A grand Beaux-Arts fountain framing the skyline.'],
    ['Starved Rock Canyons', 'Oglesby', 'Waterfall', 41.3180, -89.0010, 'Frozen waterfalls and sandstone canyons in winter.'],
    ['Wrigley Field', 'Chicago', 'Landmark', 41.9484, -87.6553, 'The ivy-walled 1914 ballpark and its iconic marquee.'],
    ['Chicago Riverwalk Bridges', 'Chicago', 'Architecture', 41.8880, -87.6280, 'Movable bridges over the river beneath the towers.'],
    ['Garden of the Gods IL', 'Herod', 'Nature', 37.6000, -88.3800, 'Sandstone bluffs over the Shawnee National Forest.'],
    ['Lincoln Home', 'Springfield', 'Historic', 39.7980, -89.6500, 'Lincoln’s preserved 1844 home in a historic district.'],
    ['Cahokia Monks Mound', 'Collinsville', 'Historic', 38.6610, -90.0620, 'The largest earthen mound in the Americas.'],
    ['Lake Michigan North Ave', 'Chicago', 'Beach', 41.9110, -87.6270, 'A city beach with skyline backdrop.'],
    ['Matthiessen Dells', 'Oglesby', 'Waterfall', 41.3070, -89.0040, 'Canyon waterfalls and a giant’s bathtub.'],
    ['Adler Planetarium View', 'Chicago', 'Skyline', 41.8663, -87.6070, 'The definitive skyline view across the harbor.'],
    ['Shawnee Little Grand Canyon', 'Pomona', 'Canyon', 37.6700, -89.4000, 'A box canyon with bluffs and seasonal falls.'],
    ['Rockford Anderson Gardens', 'Rockford', 'Park', 42.2500, -89.0700, 'A serene Japanese garden with bridges and koi.'],
    ['Chicago Chinatown Gate', 'Chicago', 'Landmark', 41.8520, -87.6320, 'An ornate paifang gate and riverside pagodas.'],
    ['Fox River', 'St. Charles', 'Nature', 41.9140, -88.3090, 'A riverfront town with bridges and parks.'],
  ],
  IN: [
    ['Indiana Dunes Skyline', 'Chesterton', 'Beach', 41.6530, -87.0530, 'Chicago’s skyline across the lake from the dunes.'],
    ['Clifty Falls Big Clifty', 'Madison', 'Waterfall', 38.7700, -85.4200, 'A 60-foot waterfall over a fossil-rich canyon.'],
    ['Indianapolis Skyline', 'Indianapolis', 'Skyline', 39.7680, -86.1580, 'Monument Circle and downtown towers at dusk.'],
    ['Turkey Run Suspension', 'Marshall', 'Nature', 39.8870, -87.2070, 'A swinging bridge over Sugar Creek’s gorge.'],
    ['Brown County Vista', 'Nashville', 'Mountains', 39.1480, -86.2270, 'Layered autumn ridges from an overlook tower.'],
    ['Marengo Cave Crystal', 'Marengo', 'Nature', 38.3680, -86.3430, 'Glittering dripstone in a national-landmark cave.'],
    ['Indiana Dunes Mount Baldy', 'Michigan City', 'Beach', 41.7000, -86.8200, 'A massive "living" wandering dune.'],
    ['Cataract Falls', 'Cloverdale', 'Waterfall', 39.4300, -86.8000, 'The largest waterfall by volume in Indiana.'],
    ['Holcomb Gardens', 'Indianapolis', 'Park', 39.8400, -86.1700, 'A canal, columns, and gardens on a university campus.'],
    ['Shades State Park', 'Waveland', 'Canyon', 39.9400, -87.0700, 'Quiet sandstone ravines and creek crossings.'],
    ['West Baden Dome', 'West Baden Springs', 'Architecture', 38.5680, -86.6160, 'A vast free-spanning atrium dome from 1902.'],
    ['Falls of the Ohio Fossils', 'Clarksville', 'Nature', 38.2780, -85.7600, 'Exposed 390-million-year-old fossil beds.'],
    ['Bridges of Parke County', 'Rockville', 'Bridge', 39.7600, -87.2300, 'The covered-bridge capital with 31 historic spans.'],
    ['Hoosier Hill', 'Bethel', 'Nature', 40.0000, -84.8500, 'The highest point in Indiana amid farm fields.'],
    ['Fort Wayne Rivers', 'Fort Wayne', 'Skyline', 41.0800, -85.1400, 'Three rivers meeting beneath the downtown skyline.'],
  ],
  IA: [
    ['Maquoketa Natural Bridge', 'Maquoketa', 'Nature', 42.1110, -90.7720, 'A natural limestone arch above a cave trail.'],
    ['Pikes Peak Iowa Overlook', 'McGregor', 'Nature', 42.9930, -91.1620, 'A bluff view of the Mississippi from 500 feet up.'],
    ['Roseman Covered Bridge', 'Winterset', 'Bridge', 41.3000, -94.0700, 'The famous covered bridge from the novel and film.'],
    ['Iowa Capitol Dome', 'Des Moines', 'Architecture', 41.5910, -93.6030, 'A 23-karat gold dome over the river city.'],
    ['Backbone Ridge', 'Dundee', 'Nature', 42.6160, -91.5560, 'A narrow rocky ridge above the Maquoketa River.'],
    ['Effigy Mounds Bluff', 'Harpers Ferry', 'Historic', 43.0900, -91.1850, 'Bear-shaped mounds on Mississippi bluffs.'],
    ['Lake Okoboji Sunset', 'Arnolds Park', 'Lake', 43.3680, -95.1440, 'Sunsets over a blue glacial lake.'],
    ['Grotto of the Redemption Detail', 'West Bend', 'Architecture', 42.9650, -94.0420, 'A folk-art shrine of gems and minerals.'],
    ['Loess Hills Scenic Byway', 'Council Bluffs', 'Nature', 41.4000, -95.8000, 'Rare windblown hills found in only two places on Earth.'],
    ['Ledges Canyon', 'Boone', 'Canyon', 42.0080, -93.8800, 'Sandstone walls and stepping-stone creek crossings.'],
    ['Decorah Ice Cave', 'Decorah', 'Nature', 43.3100, -91.7900, 'A cave that holds ice into summer.'],
    ['High Trestle Trail Bridge', 'Madrid', 'Bridge', 41.8800, -93.8200, 'A half-mile trail bridge with blue-lit art frames at night.'],
    ['Maquoketa Caves Dancehall', 'Maquoketa', 'Nature', 42.1100, -90.7700, 'The largest cave in the park, lit for walking.'],
    ['Bridges Holliwell', 'Winterset', 'Bridge', 41.3100, -93.9700, 'The longest of the Madison County covered bridges.'],
    ['Stone State Park', 'Sioux City', 'Nature', 42.5500, -96.4700, 'Loess-hill prairie overlooks of three states.'],
  ],
  KS: [
    ['Monument Rocks Sunset', 'Oakley', 'Nature', 38.7920, -100.7630, 'Chalk pillars glowing gold on the open plains.'],
    ['Konza Prairie', 'Manhattan', 'Nature', 39.1000, -96.6100, 'Rolling tallgrass prairie in the Flint Hills.'],
    ['Castle Rock Badlands', 'Quinter', 'Nature', 38.8700, -100.0820, 'A chalk spire and eroding badlands.'],
    ['Wichita Riverwalk', 'Wichita', 'Skyline', 37.6870, -97.3380, 'The Keeper of the Plains and rivers at dusk.'],
    ['Cottonwood Falls Courthouse', 'Cottonwood Falls', 'Architecture', 38.3690, -96.5410, 'The oldest active courthouse in Kansas on a prairie main street.'],
    ['Mushroom Rock Detail', 'Brookville', 'Nature', 38.7240, -97.9230, 'Surreal sandstone mushrooms on the prairie.'],
    ['Lake Scott Canyon', 'Scott City', 'Lake', 38.6770, -100.9080, 'A spring-fed lake hidden in a wooded canyon.'],
    ['Tallgrass Prairie Barn', 'Strong City', 'Nature', 38.4310, -96.5580, 'A historic stone barn amid roaming bison.'],
    ['Pillsbury Crossing', 'Manhattan', 'Waterfall', 39.1300, -96.4700, 'A wide low-water ford and waterfall ledge.'],
    ['Big Brutus Detail', 'West Mineral', 'Landmark', 37.3340, -94.8650, 'A 16-story coal shovel against the sky.'],
    ['Elk City Rocks', 'Independence', 'Nature', 37.2900, -95.7700, 'Sandstone rock formations above a lake.'],
    ['Flint Hills Scenic Byway', 'Cassoday', 'Nature', 38.0400, -96.6400, 'Endless prairie horizons along a scenic route.'],
    ['Rock City', 'Minneapolis', 'Nature', 39.1100, -97.7300, 'A field of 200 giant spherical sandstone boulders.'],
    ['Clinton Lake', 'Lawrence', 'Lake', 38.9100, -95.3500, 'A reservoir ringed by wooded hills and trails.'],
    ['Coronado Heights', 'Lindsborg', 'Mountains', 38.6100, -97.7000, 'A sandstone castle on a hill with prairie views.'],
  ],
  KY: [
    ['Red River Gorge Sky Bridge', 'Slade', 'Nature', 37.8190, -83.6240, 'A natural arch you can walk across with valley views.'],
    ['Cumberland Falls Moonbow', 'Corbin', 'Waterfall', 36.8380, -84.3420, 'The only predictable moonbow in the Western Hemisphere.'],
    ['Mammoth Cave Frozen Niagara', 'Mammoth Cave', 'Nature', 37.1869, -86.1006, 'A towering flowstone formation deep underground.'],
    ['Louisville Big Four Bridge', 'Louisville', 'Bridge', 38.2640, -85.7400, 'A pedestrian bridge glowing in color over the Ohio.'],
    ['Natural Bridge Skylift', 'Slade', 'Nature', 37.7770, -83.6840, 'A massive arch reached by trail or sky lift.'],
    ['Cumberland Gap', 'Middlesboro', 'Mountains', 36.6000, -83.6900, 'The historic mountain pass overlook of three states.'],
    ['Kentucky Horse Farms', 'Lexington', 'Nature', 38.1300, -84.7400, 'White-fenced bluegrass pastures at golden hour.'],
    ['Bernheim Canopy', 'Clermont', 'Park', 37.9230, -85.6480, 'A treetop walkway and giant forest trolls.'],
    ['Cumberland Falls Eagle Falls', 'Corbin', 'Waterfall', 36.8330, -84.3500, 'A side waterfall facing the main cascade.'],
    ['Pine Mountain Overlook', 'Pineville', 'Mountains', 36.7400, -83.7100, 'Ridgeline views ablaze with rhododendron.'],
    ['Mammoth Cave River', 'Mammoth Cave', 'Nature', 37.1800, -86.1200, 'The Green River winding through forested bluffs.'],
    ['Buffalo Trace', 'Frankfort', 'Historic', 38.2200, -84.8700, 'A historic riverside bourbon distillery.'],
    ['Cave Run Lake', 'Morehead', 'Lake', 38.1300, -83.5300, 'A forested reservoir in the Daniel Boone forest.'],
    ['Yahoo Falls', 'Whitley City', 'Waterfall', 36.7600, -84.5500, "Kentucky's tallest waterfall at 113 feet."],
    ['Louisville Waterfront Park', 'Louisville', 'Skyline', 38.2640, -85.7430, 'Green lawns framing the river and skyline.'],
  ],
  LA: [
    ['French Quarter Royal Street', 'New Orleans', 'Architecture', 29.9570, -90.0660, 'Lace-iron galleries and antique shops at golden hour.'],
    ['Oak Alley Canopy', 'Vacherie', 'Historic', 30.0080, -90.7820, 'The legendary tunnel of 300-year-old oaks.'],
    ['Jackson Square', 'New Orleans', 'Architecture', 29.9575, -90.0630, 'Artists, mule carriages, and the cathedral spires.'],
    ['Honey Island Swamp', 'Slidell', 'Nature', 30.2700, -89.6800, 'A pristine cypress swamp full of wildlife.'],
    ['Avery Island Gardens', 'Avery Island', 'Nature', 29.9000, -91.9000, 'Jungle gardens, egret rookery, and live oaks.'],
    ['New Orleans Streetcar', 'New Orleans', 'Historic', 29.9340, -90.0840, 'The St. Charles line beneath oak-lined avenues.'],
    ['Lake Martin Rookery', 'Breaux Bridge', 'Nature', 30.2100, -91.9200, 'Cypress draped in moss and nesting wading birds.'],
    ['Bogue Chitto', 'Franklinton', 'Nature', 30.8000, -90.0400, 'White sandbars along a clear winding river.'],
    ['Fontainebleau', 'Mandeville', 'Beach', 30.3400, -90.0300, 'Sugar pines and a beach on Lake Pontchartrain.'],
    ['Poverty Point', 'Pioneer', 'Historic', 32.6360, -91.4060, 'Ancient earthwork ridges, a UNESCO World Heritage site.'],
    ['Cane River', 'Natchitoches', 'Historic', 31.7600, -93.0900, 'A historic riverfront district of brick storefronts.'],
    ['Caddo Lake Cypress', 'Mooringsport', 'Lake', 32.7100, -94.0300, 'A maze of bayous and moss-hung cypress.'],
    ['Grand Isle', 'Grand Isle', 'Beach', 29.2300, -89.9900, 'Louisiana’s only inhabited barrier island beach.'],
    ['Longfellow-Evangeline', 'St. Martinville', 'Historic', 30.1300, -91.8300, 'An Acadian homestead under spreading oaks.'],
    ['Sabine Refuge', 'Hackberry', 'Nature', 29.8800, -93.4200, 'Coastal marsh boardwalks full of alligators.'],
  ],
  ME: [
    ['Acadia Otter Cliffs', 'Bar Harbor', 'Beach', 44.3110, -68.1900, 'Pink granite cliffs dropping into the Atlantic.'],
    ['Portland Head Sunset', 'Cape Elizabeth', 'Lighthouse', 43.6231, -70.2080, 'Maine’s iconic lighthouse glowing at golden hour.'],
    ['Acadia Sand Beach', 'Bar Harbor', 'Beach', 44.3290, -68.1830, 'A rare sand beach tucked between granite headlands.'],
    ['Schoodic Point', 'Winter Harbor', 'Beach', 44.3370, -68.0600, 'Crashing surf on pink granite ledges in quiet Acadia.'],
    ['Acadia Eagle Lake', 'Bar Harbor', 'Lake', 44.3650, -68.2400, 'A glassy lake reflecting Cadillac Mountain.'],
    ['Portland Old Port', 'Portland', 'Historic', 43.6570, -70.2480, 'Cobblestone streets and brick wharves on Casco Bay.'],
    ['West Quoddy Light', 'Lubec', 'Lighthouse', 44.8150, -66.9500, 'The candy-striped easternmost point in the US.'],
    ['Acadia Bubble Rock', 'Bar Harbor', 'Mountains', 44.3200, -68.2500, 'A glacial erratic balanced above Jordan Pond.'],
    ['Rockland Breakwater Light', 'Rockland', 'Lighthouse', 44.1040, -69.0770, 'A lighthouse at the end of a mile-long granite jetty.'],
    ['Moosehead Lake', 'Greenville', 'Lake', 45.5800, -69.6500, 'The largest lake in Maine below Mount Kineo’s cliff.'],
    ['Nubble Light', 'York', 'Lighthouse', 43.1650, -70.5910, 'A picture-perfect island lighthouse near a rocky cape.'],
    ['Baxter Katahdin', 'Millinocket', 'Mountains', 45.9040, -68.9210, 'Maine’s highest peak and the end of the Appalachian Trail.'],
    ['Bar Harbor Sandbar', 'Bar Harbor', 'Beach', 44.3920, -68.2000, 'A gravel bar to Bar Island walkable at low tide.'],
    ['Camden Harbor', 'Camden', 'Skyline', 44.2090, -69.0640, 'Schooners and steeples where mountains meet the sea.'],
    ['Gulf Hagas', 'Brownville', 'Canyon', 45.4800, -69.3000, 'The "Grand Canyon of Maine" with slate gorge waterfalls.'],
  ],
  MD: [
    ['Thomas Point Sunset', 'Annapolis', 'Lighthouse', 38.8990, -76.4360, 'The screw-pile lighthouse glowing over the bay.'],
    ['Baltimore Inner Harbor Night', 'Baltimore', 'Skyline', 39.2850, -76.6100, 'Illuminated towers reflected in the harbor.'],
    ['Assateague Ponies', 'Berlin', 'Beach', 38.0630, -75.2120, 'Wild horses grazing on Atlantic dunes.'],
    ['Great Falls MD Overlook', 'Potomac', 'Waterfall', 38.9970, -77.2520, 'Boardwalk views of the Potomac’s rocky rapids.'],
    ['Annapolis Naval Chapel', 'Annapolis', 'Architecture', 38.9840, -76.4850, 'A green-domed chapel on the Severn River campus.'],
    ['Swallow Falls Muddy Creek', 'Oakland', 'Waterfall', 39.4990, -79.4200, 'Maryland’s tallest free-falling waterfall.'],
    ['Calvert Cliffs Fossils', 'Lusby', 'Beach', 38.3850, -76.4350, 'A fossil-strewn beach below crumbling cliffs.'],
    ['Ocean City Sunrise', 'Ocean City', 'Beach', 38.3370, -75.0840, 'Sunrise over the Atlantic and the boardwalk.'],
    ['Cunningham Falls', 'Thurmont', 'Waterfall', 39.6200, -77.4500, 'A 78-foot cascading waterfall in the Catoctins.'],
    ['Antietam Burnside Bridge', 'Sharpsburg', 'Bridge', 39.4550, -77.7330, 'A historic stone bridge on a Civil War field.'],
    ['Harpers Ferry Maryland Heights', 'Knoxville', 'Mountains', 39.3260, -77.7290, 'A cliff view over the river confluence.'],
    ['Sugarloaf Mountain', 'Dickerson', 'Mountains', 39.2600, -77.3900, 'A solitary monadnock with valley overlooks.'],
    ['Chesapeake Bay Bridge', 'Annapolis', 'Bridge', 38.9930, -76.3800, 'A 4.3-mile dual-span bridge over the bay.'],
    ['Rocks State Park', 'Jarrettsville', 'Nature', 39.6300, -76.4200, 'The King and Queen Seat rock outcrop above a creek.'],
    ['Fort McHenry', 'Baltimore', 'Historic', 39.2630, -76.5800, 'The star fort that inspired the national anthem.'],
  ],
  MA: [
    ['Boston Acorn Street', 'Boston', 'Street Art', 42.3580, -71.0690, 'The most photographed cobblestone lane in America.'],
    ['Cape Cod Nauset Light', 'Eastham', 'Lighthouse', 41.8590, -69.9510, 'A red-and-white lighthouse above Atlantic dunes.'],
    ['Boston Public Garden Bridge', 'Boston', 'Park', 42.3540, -71.0700, 'Swan boats beneath a tiny suspension bridge.'],
    ['Rockport Motif No. 1', 'Rockport', 'Lighthouse', 42.6550, -70.6150, 'The famous red fishing shack on the harbor.'],
    ['Provincetown Dunes', 'Provincetown', 'Beach', 42.0580, -70.1780, 'Rolling dunes at the tip of Cape Cod.'],
    ['Marthas Vineyard Aquinnah', 'Aquinnah', 'Beach', 41.3480, -70.8360, 'Colorful clay cliffs and a brick lighthouse.'],
    ['Mount Greylock Tower', 'Adams', 'Mountains', 42.6370, -73.1660, 'A war-memorial tower atop the highest point in the state.'],
    ['Boston Skyline Charles', 'Boston', 'Skyline', 42.3560, -71.0730, 'The Back Bay skyline mirrored in the river.'],
    ['Salem Witch House', 'Salem', 'Historic', 42.5210, -70.8980, 'A 1675 gabled house tied to the witch trials.'],
    ['Quabbin Reservoir', 'Belchertown', 'Lake', 42.3300, -72.3300, 'A vast forested reservoir with island views.'],
    ['Bash Bish Falls MA', 'Mount Washington', 'Waterfall', 42.1170, -73.4940, 'The state’s highest waterfall splitting around a boulder.'],
    ['Cape Cod Highland Light', 'Truro', 'Lighthouse', 42.0390, -70.0680, 'Cape Cod’s oldest lighthouse on windswept bluffs.'],
    ['Nantucket Brant Point', 'Nantucket', 'Lighthouse', 41.2900, -70.0900, 'A short white lighthouse greeting ferries.'],
    ['Boston Zakim Bridge', 'Boston', 'Bridge', 42.3690, -71.0680, 'A sleek cable-stayed bridge over the Charles.'],
    ['Walden Pond', 'Concord', 'Lake', 42.4380, -71.3360, 'The serene pond made famous by Thoreau.'],
  ],
  MI: [
    ['Pictured Rocks Chapel', 'Munising', 'Beach', 46.5500, -86.4400, 'Multicolored cliffs and Chapel Rock arch over Lake Superior.'],
    ['Mackinac Bridge Night', 'Mackinaw City', 'Bridge', 45.8170, -84.7280, 'The five-mile suspension bridge lit at night.'],
    ['Sleeping Bear Overlook', 'Empire', 'Beach', 44.8810, -86.0580, 'A 450-foot dune plunging to the lake.'],
    ['Tahquamenon Upper Falls', 'Paradise', 'Waterfall', 46.5750, -85.2530, 'A 50-foot-wide root-beer-colored waterfall.'],
    ['Mackinac Island Arch Rock', 'Mackinac Island', 'Nature', 45.8580, -84.6000, 'A natural limestone arch above the blue strait.'],
    ['Detroit Skyline Belle Isle', 'Detroit', 'Skyline', 42.3380, -82.9800, 'The skyline from an island park on the river.'],
    ['Big Sable Light', 'Ludington', 'Lighthouse', 44.0560, -86.5140, 'A tall black-and-white tower amid dunes.'],
    ['Porcupine Lake of Clouds', 'Ontonagon', 'Lake', 46.8200, -89.7400, 'A famous overlook of a lake in old-growth wilderness.'],
    ['Kitch-iti-kipi Spring', 'Manistique', 'Nature', 46.0040, -86.3800, 'A crystal spring viewed through a glass-bottom raft.'],
    ['Grand Haven Pier Light', 'Grand Haven', 'Lighthouse', 43.0570, -86.2480, 'Twin red lighthouses on a catwalk pier.'],
    ['Pictured Rocks Miners Castle', 'Munising', 'Beach', 46.4900, -86.5300, 'A castle-shaped sandstone formation over turquoise water.'],
    ['Holland Tulip Time', 'Holland', 'Nature', 42.7870, -86.1090, 'Fields of tulips and a Dutch windmill in spring.'],
    ['Marquette Presque Isle', 'Marquette', 'Beach', 46.5800, -87.3800, 'Black rock cliffs and clear water on Superior.'],
    ['Tunnel of Trees', 'Harbor Springs', 'Nature', 45.5400, -85.0000, 'A canopy road hugging the Lake Michigan shore.'],
    ['Bond Falls', 'Paulding', 'Waterfall', 46.4100, -89.1300, 'A wide multi-tier waterfall over dark rock.'],
  ],
  MN: [
    ['Split Rock Sunrise', 'Two Harbors', 'Lighthouse', 47.2003, -91.3670, 'The clifftop lighthouse glowing at dawn over Superior.'],
    ['Gooseberry Middle Falls', 'Two Harbors', 'Waterfall', 47.1390, -91.4710, 'Multi-tier falls steps from the North Shore highway.'],
    ['Minneapolis Skyline Stone Arch', 'Minneapolis', 'Skyline', 44.9810, -93.2560, 'The skyline and St. Anthony Falls from the rail bridge.'],
    ['Boundary Waters Canoe', 'Ely', 'Lake', 47.9500, -91.5000, 'Mirror lakes and pine islands in a vast wilderness.'],
    ['High Falls Tettegouche', 'Silver Bay', 'Waterfall', 47.3400, -91.1900, 'The highest waterfall entirely in Minnesota.'],
    ['Palisade Head Cliffs', 'Silver Bay', 'Mountains', 47.3210, -91.2100, 'Sheer rhyolite cliffs above Lake Superior.'],
    ['Itasca Headwaters', 'Park Rapids', 'Nature', 47.2070, -95.2080, 'Step across the start of the Mississippi River.'],
    ['Minnehaha Falls City', 'Minneapolis', 'Waterfall', 44.9150, -93.2110, 'A 53-foot waterfall in a wooded urban gorge.'],
    ['Lake Superior Agate Beach', 'Grand Marais', 'Beach', 47.7500, -90.3300, 'A cobble beach and harbor lighthouse.'],
    ['Voyageurs Kabetogama', 'International Falls', 'Lake', 48.4400, -93.0000, 'A water-based park of interconnected northern lakes.'],
    ['Gooseberry Lower Falls', 'Two Harbors', 'Waterfall', 47.1430, -91.4670, 'Cascades tumbling toward Lake Superior.'],
    ['Interstate Glacial Potholes', 'Taylors Falls', 'Canyon', 45.4000, -92.6500, 'Basalt cliffs and deep glacial potholes on the St. Croix.'],
    ['Niagara Cave', 'Harmony', 'Nature', 43.5300, -92.0700, 'An underground waterfall in a deep cave.'],
    ['Lake Pepin', 'Lake City', 'Lake', 44.4400, -92.2700, 'A wide bluff-lined stretch of the Mississippi.'],
    ['Oberg Mountain', 'Tofte', 'Mountains', 47.6500, -90.7500, 'Overlooks of fall color and Superior from a loop trail.'],
  ],
  MS: [
    ['Natchez Longwood', 'Natchez', 'Architecture', 31.5400, -91.3800, 'An unfinished octagonal antebellum mansion.'],
    ['Biloxi Beach', 'Biloxi', 'Beach', 30.3900, -88.8900, 'White sand and the cast-iron lighthouse on the Gulf.'],
    ['Natchez Trace Cypress Swamp', 'Canton', 'Nature', 32.7100, -89.9100, 'A boardwalk through a tupelo-cypress swamp.'],
    ['Vicksburg Memorial Arch', 'Vicksburg', 'Historic', 32.3530, -90.8500, 'Monuments along a bluff-top battlefield drive.'],
    ['Ship Island Fort', 'Gulfport', 'Beach', 30.2130, -88.9200, 'A barrier-island fort ringed by clear Gulf water.'],
    ['Tishomingo Swinging Bridge', 'Tishomingo', 'Nature', 34.6100, -88.1800, 'A footbridge over a mossy sandstone gorge.'],
    ['Clark Creek Falls', 'Woodville', 'Waterfall', 31.0800, -91.5200, 'Dozens of waterfalls hidden in steep loess ravines.'],
    ['Dunn’s Falls', 'Enterprise', 'Waterfall', 32.1300, -88.7400, 'A 65-foot waterfall beside a historic gristmill.'],
    ['Gulf Islands Davis Bayou', 'Ocean Springs', 'Nature', 30.3900, -88.7900, 'Salt-marsh boardwalks and live oaks.'],
    ['Windsor Columns', 'Port Gibson', 'Historic', 31.9300, -91.0500, 'Towering ruins of a vanished mansion.'],
    ['Tupelo Buffalo Park', 'Tupelo', 'Nature', 34.2580, -88.7780, 'Rolling pasture and the Natchez Trace.'],
    ['Bay St. Louis', 'Bay St. Louis', 'Beach', 30.3100, -89.3300, 'A historic harbor town with a long pier.'],
    ['Petrified Forest MS', 'Flora', 'Nature', 32.5500, -90.3100, 'Ancient fossilized logs on a nature trail.'],
    ['Red Bluff', 'Morgantown', 'Canyon', 31.4800, -89.9500, 'Mississippi’s "Little Grand Canyon" of red clay.'],
    ['Friendship Cemetery Oaks', 'Columbus', 'Historic', 33.4900, -88.4100, 'Live oaks and Victorian monuments.'],
  ],
  MO: [
    ['Gateway Arch Reflection', 'St. Louis', 'Landmark', 38.6247, -90.1848, 'The stainless arch mirrored in the riverfront pond.'],
    ['Ha Ha Tonka Castle', 'Camdenton', 'Historic', 38.0700, -92.7700, 'Stone castle ruins above a turquoise spring lake.'],
    ['Elephant Rocks Detail', 'Belleview', 'Nature', 37.6540, -90.6880, 'Billion-year-old granite boulders in a row.'],
    ['Johnsons Shut-Ins Chutes', 'Middlebrook', 'Nature', 37.5400, -90.8500, 'Volcanic rock chutes and natural water slides.'],
    ['Forest Park Art Hill', 'St. Louis', 'Park', 38.6360, -90.2840, 'The grand art museum atop a lagoon-fronted hill.'],
    ['Big Spring', 'Van Buren', 'Nature', 36.9500, -90.9900, 'One of the largest springs in the US, deep blue.'],
    ['Kansas City Plaza', 'Kansas City', 'Architecture', 39.0440, -94.5900, 'Spanish-style towers and fountains lit at night.'],
    ['Grand Falls Joplin', 'Joplin', 'Waterfall', 37.0200, -94.5300, "Missouri's largest continuously flowing waterfall."],
    ['Taum Sauk Mina Sauk', 'Ironton', 'Waterfall', 37.5720, -90.7280, 'A waterfall below Missouri’s highest point.'],
    ['Onondaga Cave Lily', 'Leasburg', 'Nature', 38.0600, -91.2300, 'Active formations and an underground river.'],
    ['Katy Trail Bluffs', 'Rocheport', 'Nature', 38.9800, -92.5600, 'A rail-trail tunnel beneath river bluffs.'],
    ['Lake of the Ozarks', 'Osage Beach', 'Lake', 38.1300, -92.6600, 'A sprawling reservoir of forested coves.'],
    ['Klondike Park', 'Augusta', 'Nature', 38.5800, -90.8800, 'A white-sand quarry lake and Missouri River bluffs.'],
    ['Pickle Springs', 'Farmington', 'Canyon', 37.7900, -90.3000, 'Sandstone canyons, hoodoos, and a waterfall.'],
    ['Branson Table Rock', 'Branson', 'Lake', 36.6000, -93.3100, 'A clear Ozark lake below a dam and showboat.'],
  ],
  MT: [
    ['Glacier Avalanche Lake', 'West Glacier', 'Lake', 48.6770, -113.8200, 'A glacier-fed lake ringed by waterfalls.'],
    ['Glacier Many Glacier', 'Babb', 'Mountains', 48.7970, -113.6580, 'Sharp peaks reflected in Swiftcurrent Lake.'],
    ['Glacier Grinnell Glacier', 'Babb', 'Lake', 48.7560, -113.7250, 'A turquoise glacier lake at trail’s end.'],
    ['Glacier Two Medicine', 'East Glacier Park', 'Lake', 48.4900, -113.3700, 'A quiet lake below Sinopah Mountain.'],
    ['Beartooth Pass Vista', 'Red Lodge', 'Mountains', 45.0000, -109.4000, 'Tundra and alpine lakes near 11,000 feet.'],
    ['Flathead Lake Wild Horse', 'Polson', 'Lake', 47.8400, -114.1500, 'Island bison range in the West’s largest natural lake.'],
    ['Gates of the Mountains', 'Helena', 'Canyon', 46.8300, -111.9000, 'Towering limestone cliffs along the Missouri River.'],
    ['Bighorn Canyon Devil Canyon', 'Fort Smith', 'Canyon', 45.0900, -108.1700, 'A 1,000-foot overlook of a blue reservoir.'],
    ['Garnet Ghost Town Street', 'Drummond', 'Historic', 46.8200, -113.3300, 'Weathered cabins in a preserved mining town.'],
    ['Quake Lake Slide', 'West Yellowstone', 'Lake', 44.8300, -111.4200, 'Ghostly drowned trees from a 1959 earthquake.'],
    ['Hyalite Reservoir', 'Bozeman', 'Lake', 45.4800, -110.9700, 'An alpine reservoir ringed by peaks and waterfalls.'],
    ['Lake McDonald Pebbles', 'West Glacier', 'Lake', 48.5800, -113.8800, 'Famous colored stones beneath clear water.'],
    ['Makoshika Badlands', 'Glendive', 'Nature', 47.0800, -104.6800, "Montana's largest state park of eroded badlands."],
    ['Our Lady of the Rockies', 'Butte', 'Landmark', 45.9900, -112.4600, 'A 90-foot statue glowing on the Continental Divide.'],
    ['St. Mary Falls', 'St. Mary', 'Waterfall', 48.6700, -113.5700, 'A turquoise waterfall on the Going-to-the-Sun trail.'],
  ],
  NE: [
    ['Scotts Bluff Summit', 'Gering', 'Nature', 41.8300, -103.7070, 'A summit road over Oregon Trail bluffs.'],
    ['Chimney Rock Sunset', 'Bayard', 'Nature', 41.7030, -103.3460, 'The iconic spire glowing on the plains.'],
    ['Toadstool Hoodoos', 'Crawford', 'Nature', 42.8700, -103.5800, 'Mushroom rock formations in grassland badlands.'],
    ['Carhenge Detail', 'Alliance', 'Street Art', 42.1420, -102.8580, 'A Stonehenge replica of gray vintage cars.'],
    ['Smith Falls Niobrara', 'Valentine', 'Waterfall', 42.8900, -100.3000, "Nebraska's tallest waterfall on a canoeing river."],
    ['Sandhills Cranes', 'Kearney', 'Nature', 40.7000, -99.0800, 'Half a million sandhill cranes on the Platte each spring.'],
    ['Ashfall Fossil Beds Detail', 'Royal', 'Historic', 42.4250, -98.1580, 'Whole skeletons preserved in volcanic ash.'],
    ['Lake McConaughy Beach', 'Ogallala', 'Lake', 41.2500, -101.7000, 'White-sand beaches on a vast reservoir.'],
    ['Nebraska Capitol Sower', 'Lincoln', 'Architecture', 40.8080, -96.6990, 'A 400-foot Art Deco tower over the plains.'],
    ['Indian Cave Bluffs', 'Shubert', 'Nature', 40.2600, -95.5600, 'Forested Missouri River bluffs and a sandstone cave.'],
    ['Niobrara Scenic River', 'Valentine', 'Nature', 42.7900, -100.0000, 'A spring-fed river past waterfalls and bluffs.'],
    ['Fort Robinson', 'Crawford', 'Historic', 42.6700, -103.4700, 'A historic frontier fort below buttes.'],
    ['Pioneers Park', 'Lincoln', 'Park', 40.7800, -96.7600, 'Prairie, bison, and elk in a city park.'],
    ['Platte River State Park', 'Louisville', 'Nature', 41.0100, -96.2400, 'A timber tower above the wooded Platte valley.'],
    ['Agate Fossil Beds', 'Harrison', 'Nature', 42.4200, -103.7500, 'Grassland buttes rich with Miocene fossils.'],
  ],
  NV: [
    ['Valley of Fire Arch', 'Overton', 'Desert', 36.4290, -114.5150, 'A delicate sandstone arch in fiery red rock.'],
    ['Red Rock Scenic Loop', 'Las Vegas', 'Desert', 36.1350, -115.4270, 'A 13-mile drive past towering red escarpments.'],
    ['Sand Harbor Tahoe', 'Incline Village', 'Lake', 39.2000, -119.9300, 'Granite boulders in crystal-clear water.'],
    ['Las Vegas Neon Museum', 'Las Vegas', 'Street Art', 36.1780, -115.1390, 'A boneyard of vintage glowing casino signs.'],
    ['Cathedral Gorge Spires', 'Panaca', 'Canyon', 37.8200, -114.4100, 'Cathedral-like clay spires and slot canyons.'],
    ['Great Basin Bristlecones', 'Baker', 'Mountains', 38.9850, -114.3130, 'Ancient twisted pines below Wheeler Peak.'],
    ['Fly Geyser', 'Gerlach', 'Nature', 40.8600, -119.3300, 'A surreal multicolored geyser on the high desert.'],
    ['Lake Mead Overlook', 'Boulder City', 'Lake', 36.1300, -114.4400, 'A vast blue reservoir behind Hoover Dam.'],
    ['Lamoille Canyon Ruby', 'Lamoille', 'Mountains', 40.6400, -115.4000, 'A glacial canyon in the "Nevada Alps".'],
    ['Valley of Fire Fire Wave', 'Overton', 'Desert', 36.4710, -114.5170, 'Striped sandstone rippling like frozen waves.'],
    ['Spooner Lake', 'Carson City', 'Lake', 39.1100, -119.9100, 'An aspen-ringed lake above Tahoe.'],
    ['Hoover Dam Bridge', 'Boulder City', 'Bridge', 36.0160, -114.7400, 'The high arch bridge over Black Canyon.'],
    ['Berlin-Ichthyosaur', 'Austin', 'Historic', 38.8800, -117.5800, 'A ghost town with giant marine-reptile fossils.'],
    ['Tahoe Cave Rock', 'Glenbrook', 'Lake', 39.0500, -119.9500, 'A massive rock promontory over the east shore.'],
    ['Mount Charleston', 'Las Vegas', 'Mountains', 36.2700, -115.6900, 'Pine forests and snow an hour from the Strip.'],
  ],
  NH: [
    ['Mount Washington Cog', 'Sargents Purchase', 'Mountains', 44.2705, -71.3033, 'The historic cog railway climbing the Northeast’s highest peak.'],
    ['Franconia Notch', 'Lincoln', 'Mountains', 44.1500, -71.6800, 'A dramatic mountain pass with cliffs and lakes.'],
    ['Flume Gorge Boardwalk', 'Lincoln', 'Canyon', 44.0970, -71.6810, 'A boardwalk through a mossy granite chasm.'],
    ['Kancamagus Autumn', 'Lincoln', 'Nature', 44.0000, -71.4000, 'A scenic byway ablaze with fall color.'],
    ['Lake Winnipesaukee Islands', 'Meredith', 'Lake', 43.6200, -71.3000, 'A vast lake dotted with 250 islands.'],
    ['Mount Monadnock Summit', 'Jaffrey', 'Mountains', 42.8610, -72.1080, 'Bald-rock summit views in every direction.'],
    ['Diana’s Baths Cascades', 'Bartlett', 'Waterfall', 44.0760, -71.1800, 'A staircase of pools and small falls.'],
    ['Cannon Mountain Tram', 'Franconia', 'Mountains', 44.1570, -71.6990, 'An aerial tram to a notch overlook.'],
    ['Mount Chocorua', 'Tamworth', 'Mountains', 43.9550, -71.2700, 'A rocky peak mirrored in a still lake.'],
    ['Portsmouth Strawbery Banke', 'Portsmouth', 'Historic', 43.0760, -70.7540, 'A preserved colonial waterfront neighborhood.'],
    ['Sabbaday Falls Flume', 'Waterville Valley', 'Waterfall', 43.9900, -71.3900, 'A multi-tier waterfall through a carved chute.'],
    ['Lake Sunapee', 'Sunapee', 'Lake', 43.3900, -72.0500, 'A clear lake below Mount Sunapee.'],
    ['Castle in the Clouds View', 'Moultonborough', 'Architecture', 43.7500, -71.3100, 'An estate overlooking Lake Winnipesaukee.'],
    ['Crawford Notch', 'Hart’s Location', 'Mountains', 44.2200, -71.4100, 'A deep glacial notch with waterfalls and a railway trestle.'],
    ['Echo Lake Franconia', 'Franconia', 'Lake', 44.1700, -71.6900, 'A small lake reflecting Cannon Mountain.'],
  ],
}

// ─── EXPORTS (must come after RAW_BY_STATE and RAW_EXTRA) ─────────────────────
// FL extras merge into the existing Florida dataset; exported separately.
export const floridaExtraSpots: PhotoSpot[] = expand('FL', [...FL_EXTRA, ...(RAW_EXTRA['FL'] ?? [])])

// All authored per-state spots, flattened (base + supplemental).
export const statesSpots: PhotoSpot[] = ALL_STATE_CODES
  .flatMap(state => expand(state, mergedRaws(state)))

// Convenience: spots for a single state code.
export function spotsForState(state: string): PhotoSpot[] {
  return expand(state, mergedRaws(state))
}
