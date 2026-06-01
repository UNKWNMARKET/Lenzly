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

// ─── REGISTRY ────────────────────────────────────────────────────────────────
// Add new states here as they're authored. Each expands to full PhotoSpots.
const RAW_BY_STATE: Record<string, Raw[]> = {
  AL, AK, AZ, AR, CA, CO,
}

// FL extras merge into the existing Florida dataset elsewhere; exported separately.
export const floridaExtraSpots: PhotoSpot[] = expand('FL', FL_EXTRA)

// All authored state spots, flattened.
export const statesSpots: PhotoSpot[] = Object.entries(RAW_BY_STATE)
  .flatMap(([state, raws]) => expand(state, raws))

// Convenience: spots for a single state code.
export function spotsForState(state: string): PhotoSpot[] {
  const raws = RAW_BY_STATE[state]
  return raws ? expand(state, raws) : []
}
