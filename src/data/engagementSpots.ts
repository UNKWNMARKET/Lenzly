import type { PhotoSpot } from './mockData'

// ─────────────────────────────────────────────────────────────────────────────
// Engagement / proposal / couples photo locations, by state.
//
// These supplement the existing engagementSpotData (9/state) to bring every
// state to 15+. Each is a real, well-known, publicly accessible romantic
// venue — botanical gardens, scenic overlooks, waterfronts, historic estate
// gardens, conservatories, covered bridges, lakeside parks.
//
// PHOTOS: resolved at runtime from Wikimedia Commons by name + city + state
// (SmartSpotImage / wikimediaPhotos.ts) — public-domain / Creative Commons,
// copyright-safe. The `image` fallback below only shows if no match is found.
// ─────────────────────────────────────────────────────────────────────────────

// [name, city, lat, lng, description]
type Eng = [string, string, number, number, string]

const FALLBACK = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&auto=format&fit=crop' // generic garden/romantic

function seeded(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}

const TIPS = [
  'Golden hour wraps couples in warm, flattering light',
  'Look for archways, gates, or tree tunnels to frame the couple',
  'Wide shots show the setting; tight shots capture emotion',
  'Reflections in water or glass double the romance',
]

function expand(state: string, rows: Eng[]): PhotoSpot[] {
  return rows.map(([name, city, lat, lng, description]) => {
    const id = `eg2-${state.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
    const s = seeded(id)
    return {
      id,
      name,
      description,
      image: FALLBACK,
      lat,
      lng,
      category: 'Engagement',
      rating: +(4.4 + (s % 6) / 10).toFixed(1),
      photoCount: 1500 + (s % 18000),
      bestTime: 'Golden Hour · Spring–Fall',
      city,
      state,
      aiDiscovered: false,
      shootingTips: TIPS,
    } as PhotoSpot
  })
}

// ─── STATE DATA ──────────────────────────────────────────────────────────────

const AL: Eng[] = [
  ['Birmingham Botanical Gardens', 'Birmingham', 33.5180, -86.7900, 'Alabama’s largest living museum — 30 themed gardens including a Japanese garden, rose garden, and conservatory.'],
  ['Aldridge Gardens', 'Hoover', 33.4030, -86.8120, 'A 30-acre garden around a serene lake, famous for hydrangeas and a woodland boardwalk.'],
  ['Orr Park', 'Montevallo', 33.1010, -86.8650, 'Ancient cedar trees hand-carved into faces and creatures along a creekside path.'],
  ['Noccalula Falls Park', 'Gadsden', 34.0518, -86.0086, 'A 90-foot waterfall and botanical gardens with a covered bridge.'],
  ['Jasmine Hill Gardens', 'Wetumpka', 32.4900, -86.2100, '20 acres of gardens and Greek statuary known as "Alabama’s Little Corner of Greece".'],
  ['University of Alabama Quad', 'Tuscaloosa', 33.2140, -87.5460, 'A historic columned quad of oaks and antebellum architecture.'],
  ['Cathedral Caverns Entrance', 'Woodville', 34.5722, -86.2225, 'A dramatic 126-foot cave mouth framing couples in soft light.'],
  ['Battleship Memorial Park', 'Mobile', 30.6817, -88.0144, 'Bayfront sunsets beside the USS Alabama.'],
]

const AK: Eng[] = [
  ['Alaska Botanical Garden', 'Anchorage', 61.1640, -149.7430, 'A boreal-forest garden of wildflowers and perennials ringed by the Chugach.'],
  ['Reflections Lake', 'Palmer', 61.5400, -149.0300, 'A still lake mirroring the Chugach Mountains near the Knik River.'],
  ['Eklutna Lake', 'Chugiak', 61.4100, -149.1300, 'A turquoise glacier-fed lake in a mountain valley.'],
  ['Beluga Point', 'Anchorage', 61.0200, -149.6500, 'A rocky point over Turnagain Arm with mountain and water views.'],
  ['Earthquake Park', 'Anchorage', 61.1960, -149.9700, 'Coastal woods with Sleeping Lady and inlet views.'],
  ['Thunderbird Falls', 'Chugiak', 61.4500, -149.3500, 'A misty forest gorge and waterfall on a short trail.'],
  ['Glen Alps Overlook', 'Anchorage', 61.1000, -149.6800, 'A sweeping overlook of the city, inlet, and mountains.'],
  ['Independence Mine', 'Palmer', 61.7900, -149.2800, 'Historic mine buildings in an alpine valley at Hatcher Pass.'],
]

const AZ: Eng[] = [
  ['Desert Botanical Garden', 'Phoenix', 33.4619, -111.9441, '55 acres of Sonoran desert plants — saguaro forests glow at sunset.'],
  ['Boyce Thompson Arboretum', 'Superior', 33.2790, -111.1600, 'Arizona’s oldest and largest botanical garden beneath Picketpost Mountain.'],
  ['Tlaquepaque Arts Village', 'Sedona', 34.8580, -111.7620, 'A Spanish-colonial arts village of arched courtyards and fountains.'],
  ['Lost Dutchman State Park', 'Apache Junction', 33.4610, -111.4790, 'Saguaros and wildflowers below the Superstition Mountains.'],
  ['Sedona Airport Mesa', 'Sedona', 34.8480, -111.7900, 'A 360-degree red-rock overlook famous for sunsets.'],
  ['Riparian Preserve', 'Gilbert', 33.3640, -111.7350, 'Wetland ponds and cottonwoods reflecting desert light.'],
  ['Tohono Chul', 'Tucson', 32.3380, -110.9820, 'A desert garden of courtyards, art, and saguaro-lined paths.'],
  ['Watson Lake Dells', 'Prescott', 34.5921, -112.4232, 'Granite boulders rising from a still reservoir.'],
]

const AR: Eng[] = [
  ['Garvan Woodland Gardens', 'Hot Springs', 34.4666, -93.0260, 'Lakeside botanical gardens with the glass-and-timber Anthony Chapel.'],
  ['Thorncrown Chapel', 'Eureka Springs', 36.4080, -93.7560, 'A glass chapel of 425 windows tucked in the Ozark woods.'],
  ['Eureka Springs Historic District', 'Eureka Springs', 36.4010, -93.7380, 'Victorian mountain streets, gardens, and springs.'],
  ['Petit Jean Cedar Falls', 'Morrilton', 35.1180, -92.9370, 'A waterfall in a fern-lined box canyon.'],
  ['Bentonville Crystal Bridges', 'Bentonville', 36.3820, -94.2030, 'A museum of glass pavilions over wooded ravine ponds.'],
  ['Lake Catherine State Park', 'Hot Springs', 34.4400, -92.8700, 'A clear lake with a waterfall and pine-shaded shore.'],
  ['Mount Magazine Lodge', 'Paris', 35.1670, -93.6450, 'Cliff-edge views from Arkansas’s highest mountain.'],
  ['Wilson Park', 'Fayetteville', 36.0750, -94.1600, 'A castle fountain and rose-lined paths in the city.'],
]

const CA: Eng[] = [
  ['Huntington Botanical Gardens', 'San Marino', 34.1290, -118.1140, '120 acres of themed gardens including a Japanese garden and rose garden.'],
  ['Golden Gate Park Conservatory', 'San Francisco', 37.7720, -122.4600, 'A white Victorian glasshouse amid dahlias and lawns.'],
  ['Descanso Gardens', 'La Cañada Flintridge', 34.2010, -118.2120, 'A camellia forest, rose garden, and oak woodland.'],
  ['Palace of Fine Arts', 'San Francisco', 37.8020, -122.4480, 'A Roman-style rotunda and lagoon, a classic engagement backdrop.'],
  ['Filoli Estate', 'Woodside', 37.4690, -122.3120, 'A Georgian estate with 16 acres of formal English gardens.'],
  ['Japanese Friendship Garden', 'San Jose', 37.3300, -121.9000, 'Koi ponds, bridges, and maples in a serene garden.'],
  ['Carmel Beach', 'Carmel-by-the-Sea', 36.5550, -121.9290, 'White sand and cypress framing Pacific sunsets.'],
  ['Sunken City / Lands End', 'San Francisco', 37.7800, -122.5060, 'Cypress trails and bridge views over the Pacific cliffs.'],
]

const CO: Eng[] = [
  ['Denver Botanic Gardens', 'Denver', 39.7320, -104.9610, '24 acres of gardens including a Japanese garden and conservatory.'],
  ['Maroon Bells Lake', 'Aspen', 39.0708, -106.9890, 'Twin peaks mirrored in an alpine lake amid golden aspens.'],
  ['Garden of the Gods', 'Colorado Springs', 38.8784, -104.8694, 'Towering red sandstone against Pikes Peak.'],
  ['Sapphire Point Overlook', 'Dillon', 39.6100, -106.0600, 'A short trail to a sweeping view of Lake Dillon and peaks.'],
  ['Hudson Gardens', 'Littleton', 39.5900, -105.0100, 'Riverside gardens with arbors and a rose collection.'],
  ['Sprague Lake', 'Estes Park', 40.3210, -105.6100, 'An easy alpine lake with full Continental Divide reflections.'],
  ['Red Rocks Trading Post', 'Morrison', 39.6655, -105.2050, 'Red sandstone formations and city-light views.'],
  ['Crested Butte Wildflowers', 'Crested Butte', 38.8700, -106.9800, 'Meadows of summer wildflowers below the peaks.'],
]

const CT: Eng[] = [
  ['Elizabeth Park Rose Garden', 'Hartford', 41.7680, -72.7180, 'The oldest municipal rose garden in the US, with arched trellises.'],
  ['Harkness Memorial Park', 'Waterford', 41.3050, -72.1170, 'A Renaissance mansion and formal gardens on Long Island Sound.'],
  ['Gillette Castle', 'East Haddam', 41.4220, -72.4290, 'A medieval stone castle on a bluff above the Connecticut River.'],
  ['Wickham Park', 'Manchester', 41.7700, -72.5500, 'Themed gardens and an overlook of the Hartford skyline.'],
  ['Mystic Seaport', 'Mystic', 41.3640, -71.9660, 'A 19th-century coastal village with tall ships.'],
  ['Hill-Stead Museum', 'Farmington', 41.7200, -72.8300, 'A Colonial Revival estate with a sunken garden.'],
  ['Bluff Point', 'Groton', 41.3210, -72.0350, 'A coastal reserve with a quiet beach spit.'],
  ['Sleeping Giant Tower', 'Hamden', 41.4220, -72.9020, 'A stone tower with views over the Quinnipiac valley.'],
]

const DE: Eng[] = [
  ['Nemours Estate Gardens', 'Wilmington', 39.7700, -75.5840, 'The largest formal French gardens in North America.'],
  ['Winterthur Gardens', 'Wilmington', 39.8060, -75.5930, '60 acres of naturalistic gardens on a du Pont estate.'],
  ['Mt. Cuba Center', 'Hockessin', 39.7860, -75.6500, 'A native-plant garden of meadows and woodland paths.'],
  ['Cape Henlopen Dunes', 'Lewes', 38.7990, -75.0940, 'Atlantic dunes and a WWII tower at the bay’s mouth.'],
  ['Brandywine Park', 'Wilmington', 39.7700, -75.5500, 'Stone bridges and a riverside walk.'],
  ['Rehoboth Beach Boardwalk', 'Rehoboth Beach', 38.7210, -75.0760, 'A classic mile-long boardwalk on the Atlantic.'],
  ['Bellevue State Park', 'Wilmington', 39.7900, -75.5000, 'A formal garden and historic mansion grounds.'],
  ['Trap Pond Cypress', 'Laurel', 38.5260, -75.4810, 'The northernmost bald-cypress swamp, reflective and serene.'],
]

const FL: Eng[] = [
  ['Vizcaya Museum & Gardens', 'Miami', 25.7440, -80.2100, 'An Italian Renaissance villa with formal gardens on Biscayne Bay.'],
  ['Bok Tower Gardens', 'Lake Wales', 27.9370, -81.5780, 'A 205-foot marble singing tower amid landscaped gardens.'],
  ['Fairchild Tropical Garden', 'Coral Gables', 25.6770, -80.2730, '83 acres of palms, lakes, and tropical blooms.'],
  ['Marie Selby Gardens', 'Sarasota', 27.3270, -82.5470, 'Bayfront gardens of orchids and banyan trees.'],
  ['Eden Gardens State Park', 'Santa Rosa Beach', 30.3520, -86.1430, 'A moss-draped antebellum mansion and reflecting gardens.'],
  ['Washington Oaks Gardens', 'Palm Coast', 29.6350, -81.2120, 'Formal gardens beside a coquina-rock Atlantic beach.'],
  ['Naples Pier', 'Naples', 26.1310, -81.8090, 'A historic wooden pier over Gulf sunsets.'],
  ['Cummer Gardens', 'Jacksonville', 30.3180, -81.6900, 'Riverfront formal gardens with reflecting pools.'],
]

const GA: Eng[] = [
  ['Atlanta Botanical Garden', 'Atlanta', 33.7900, -84.3730, 'A canopy walk, orchid house, and seasonal sculpture amid the city.'],
  ['Forsyth Park', 'Savannah', 32.0560, -81.0960, 'A grand white fountain framed by mossy live oaks.'],
  ['Gibbs Gardens', 'Ball Ground', 34.3700, -84.2900, '220 acres of daffodils, Japanese gardens, and waterfalls.'],
  ['Wormsloe Avenue of Oaks', 'Savannah', 31.9600, -81.0600, 'A 1.5-mile tunnel of live oaks to tabby ruins.'],
  ['Callaway Gardens', 'Pine Mountain', 32.8500, -84.8200, 'Azaleas, a butterfly center, and lakeside chapel.'],
  ['Jekyll Island Driftwood Beach', 'Jekyll Island', 31.0890, -81.4120, 'Sun-bleached driftwood on a wild shore.'],
  ['Savannah Bonaventure', 'Savannah', 32.0470, -81.0530, 'Live-oak avenues and statuary by the river.'],
  ['Stone Mountain Park', 'Stone Mountain', 33.8053, -84.1455, 'A granite dome with gardens and a lake.'],
]

const HI: Eng[] = [
  ['Ho’omaluhia Botanical Garden', 'Kaneohe', 21.3870, -157.8100, 'A garden lake mirroring the jagged Ko’olau cliffs.'],
  ['Waimea Valley', 'Haleiwa', 21.6400, -158.0600, 'A botanical valley trail ending at a waterfall.'],
  ['Lanikai Beach', 'Kailua', 21.3930, -157.7150, 'Powder sand and twin islets in turquoise water.'],
  ['Allerton Garden', 'Koloa', 21.8900, -159.5100, 'A sculpted tropical garden of fountains and giant fig roots.'],
  ['Byodo-In Temple', 'Kaneohe', 21.4300, -157.8350, 'A red Japanese temple below the Ko’olau range.'],
  ['Kailua Beach', 'Kailua', 21.3920, -157.7390, 'A crescent of soft sand and clear water.'],
  ['Makapuu Lookout', 'Waimanalo', 21.3100, -157.6490, 'A clifftop ocean overlook with a lighthouse.'],
  ['Foster Botanical Garden', 'Honolulu', 21.3140, -157.8580, 'Century-old trees and orchids in the city.'],
]

const ID: Eng[] = [
  ['Idaho Botanical Garden', 'Boise', 43.6020, -116.1660, 'Themed gardens in the foothills near the historic penitentiary.'],
  ['Redfish Lake', 'Stanley', 44.1430, -114.9170, 'A clear lake mirroring the jagged Sawtooths.'],
  ['Shoshone Falls Overlook', 'Twin Falls', 42.5950, -114.4010, 'The 212-foot "Niagara of the West".'],
  ['Sun Valley Trail Creek', 'Sun Valley', 43.6970, -114.3520, 'Aspen groves and a covered footbridge below Bald Mountain.'],
  ['Coeur d’Alene Boardwalk', 'Coeur d’Alene', 47.6740, -116.7800, 'A floating boardwalk on a mountain lake.'],
  ['Lake Pend Oreille', 'Sandpoint', 48.1700, -116.3300, 'A vast lake ringed by the Selkirks.'],
  ['Mesa Falls', 'Ashton', 44.1880, -111.3320, 'A thundering waterfall with a viewing boardwalk.'],
  ['Payette Lake', 'McCall', 44.9100, -116.1000, 'A clear forested lake in a resort town.'],
]

const IL: Eng[] = [
  ['Chicago Botanic Garden', 'Glencoe', 42.1490, -87.7900, '27 gardens across nine islands with arched bridges.'],
  ['Cantigny Park', 'Wheaton', 41.8460, -88.1560, '500 acres of formal gardens and fountains.'],
  ['Garfield Park Conservatory', 'Chicago', 41.8860, -87.7170, 'One of the largest glasshouse conservatories in the US.'],
  ['Millennium Park / Cloud Gate', 'Chicago', 41.8827, -87.6233, 'The mirrored Bean reflecting the skyline.'],
  ['Lincoln Park Conservatory', 'Chicago', 41.9240, -87.6350, 'A Victorian glasshouse and lily ponds by the lake.'],
  ['Starved Rock', 'Oglesby', 41.3180, -89.0010, 'Sandstone canyons and seasonal waterfalls.'],
  ['Anderson Japanese Gardens', 'Rockford', 42.2900, -89.0700, 'Waterfalls, bridges, and koi in a celebrated garden.'],
  ['Chicago Riverwalk', 'Chicago', 41.8880, -87.6250, 'A waterfront promenade beneath the towers.'],
]

const IN: Eng[] = [
  ['Newfields Gardens', 'Indianapolis', 39.8260, -86.1860, '152 acres of gardens and art around the Lilly estate.'],
  ['Indiana Dunes', 'Chesterton', 41.6530, -87.0530, 'Dunes and Lake Michigan beaches.'],
  ['Holcomb Gardens', 'Indianapolis', 39.8400, -86.1700, 'A canal, columns, and gardens on a campus.'],
  ['Turkey Run Suspension Bridge', 'Marshall', 39.8870, -87.2070, 'A swinging bridge over Sugar Creek.'],
  ['Clifty Falls', 'Madison', 38.7700, -85.4200, 'Waterfalls in a canyon above the Ohio River.'],
  ['Brown County Overlook', 'Nashville', 39.1480, -86.2270, 'Layered autumn ridges from a tower.'],
  ['Wellfield Botanic Gardens', 'Elkhart', 41.6900, -85.9700, 'Themed water gardens and a stone amphitheater.'],
  ['Indianapolis Canal Walk', 'Indianapolis', 39.7740, -86.1660, 'A landscaped urban canal with bridges.'],
]

const IA: Eng[] = [
  ['Reiman Gardens', 'Ames', 42.0210, -93.6360, '17 acres of gardens and a butterfly wing.'],
  ['Bridges of Madison County', 'Winterset', 41.3370, -94.0130, 'Famous historic covered bridges.'],
  ['Greater Des Moines Botanical', 'Des Moines', 41.5900, -93.6100, 'A geodesic-dome conservatory on the river.'],
  ['Pikes Peak State Park', 'McGregor', 42.9930, -91.1620, 'A bluff overlook of the Mississippi.'],
  ['Ledges State Park', 'Boone', 42.0080, -93.8800, 'Sandstone canyon walls and creek crossings.'],
  ['Lake Okoboji', 'Arnolds Park', 43.3680, -95.1440, 'A blue glacial lake at sunset.'],
  ['Vander Veer Park', 'Davenport', 41.5400, -90.5700, 'A Victorian conservatory and rose garden.'],
  ['Backbone State Park', 'Dundee', 42.6160, -91.5560, 'A rocky ridge above the Maquoketa River.'],
]

const KS: Eng[] = [
  ['Botanica Wichita', 'Wichita', 37.7050, -97.3600, '30 acres of themed gardens along the Arkansas River.'],
  ['Overland Park Arboretum', 'Overland Park', 38.8700, -94.7100, '300 acres of gardens, woods, and a marsh boardwalk.'],
  ['Flint Hills Tallgrass Prairie', 'Strong City', 38.4310, -96.5580, 'Rolling prairie and a historic stone barn.'],
  ['Monument Rocks', 'Oakley', 38.7920, -100.7630, 'Chalk pillars on the open plains.'],
  ['Bartlett Arboretum', 'Belle Plaine', 37.3900, -97.2800, 'A historic arboretum of tulips and old trees.'],
  ['Lake Scott State Park', 'Scott City', 38.6770, -100.9080, 'A spring-fed lake in a wooded canyon.'],
  ['Ward-Meade Botanic Garden', 'Topeka', 39.0700, -95.7100, 'A Victorian mansion and gardens.'],
  ['Coronado Heights', 'Lindsborg', 38.6100, -97.7000, 'A sandstone castle on a hill with prairie views.'],
]

const KY: Eng[] = [
  ['Yew Dell Botanical Gardens', 'Crestwood', 38.3500, -85.4700, 'A stone castle folly and themed gardens.'],
  ['Kentucky Horse Park', 'Lexington', 38.1500, -84.5200, 'White-fenced bluegrass pastures and barns.'],
  ['Cumberland Falls', 'Corbin', 36.8380, -84.3420, 'A 68-foot waterfall famous for its moonbow.'],
  ['Bernheim Forest Canopy', 'Clermont', 37.9230, -85.6480, 'A canopy walkway and giant troll sculptures.'],
  ['Red River Gorge Sky Bridge', 'Slade', 37.8190, -83.6240, 'A natural arch you can walk across.'],
  ['Louisville Big Four Bridge', 'Louisville', 38.2640, -85.7400, 'A pedestrian bridge glowing over the Ohio.'],
  ['Whitehall Mansion', 'Lexington', 38.0300, -84.4200, 'An Italianate mansion with formal gardens.'],
  ['Natural Bridge', 'Slade', 37.7770, -83.6840, 'A massive sandstone arch reached by trail.'],
]

const LA: Eng[] = [
  ['Longue Vue House & Gardens', 'New Orleans', 29.9760, -90.1290, 'An estate with eight acres of fountains and formal gardens.'],
  ['City Park New Orleans', 'New Orleans', 29.9940, -90.0980, 'Ancient live oaks, lagoons, and a sculpture garden.'],
  ['Oak Alley Plantation', 'Vacherie', 30.0080, -90.7820, 'A canopy of 28 live oaks framing a mansion.'],
  ['Avery Island Jungle Gardens', 'Avery Island', 29.9000, -91.9000, 'Lush gardens and a bird sanctuary.'],
  ['Rip Van Winkle Gardens', 'New Iberia', 29.9700, -91.9200, 'Lakeside gardens around a historic home.'],
  ['Jackson Square', 'New Orleans', 29.9575, -90.0630, 'Mule carriages and cathedral spires.'],
  ['Rosedown Plantation Gardens', 'St. Francisville', 30.7900, -91.3700, 'Restored formal historic gardens.'],
  ['Lake Martin Cypress', 'Breaux Bridge', 30.2100, -91.9200, 'Moss-draped cypress and a bird rookery.'],
]

const ME: Eng[] = [
  ['Coastal Maine Botanical Gardens', 'Boothbay', 43.8800, -69.6300, 'The largest botanical garden in New England, with giant trolls.'],
  ['Portland Head Light', 'Cape Elizabeth', 43.6231, -70.2080, 'Maine’s iconic clifftop lighthouse.'],
  ['Acadia Jordan Pond', 'Bar Harbor', 44.3210, -68.2530, 'A glassy pond mirroring the rounded Bubbles.'],
  ['Camden Harbor', 'Camden', 44.2090, -69.0640, 'Schooners and steeples where mountains meet the sea.'],
  ['Thuya Garden', 'Northeast Harbor', 44.3000, -68.2900, 'A formal garden above a fjord-like harbor.'],
  ['Marshall Point Light', 'Port Clyde', 43.9170, -69.2600, 'The wooden-walkway lighthouse from Forrest Gump.'],
  ['Wild Gardens of Acadia', 'Bar Harbor', 44.3580, -68.2470, 'Native-plant gardens in Sieur de Monts.'],
  ['Bass Harbor Head Light', 'Tremont', 44.2220, -68.3370, 'A red-roofed lighthouse on pink granite.'],
]

const MD: Eng[] = [
  ['Brookside Gardens', 'Wheaton', 39.0490, -77.0500, '50 acres of display gardens and a conservatory.'],
  ['Ladew Topiary Gardens', 'Monkton', 39.5600, -76.5700, 'Whimsical topiary "rooms" across 22 acres.'],
  ['Annapolis Naval Academy', 'Annapolis', 38.9840, -76.4850, 'The domed chapel on the Severn River.'],
  ['Quiet Waters Park', 'Annapolis', 38.9300, -76.5000, 'Gardens and bridges over a tidal creek.'],
  ['Thomas Point Light', 'Annapolis', 38.8990, -76.4360, 'A screw-pile lighthouse in the bay.'],
  ['Cylburn Arboretum', 'Baltimore', 39.3500, -76.6600, 'A Victorian mansion and woodland gardens.'],
  ['Great Falls Maryland', 'Potomac', 38.9970, -77.2540, 'The Potomac roaring through a rocky gorge.'],
  ['Sotterley Plantation', 'Hollywood', 38.3700, -76.5300, 'A riverfront colonial estate and gardens.'],
]

const MA: Eng[] = [
  ['Boston Public Garden', 'Boston', 42.3540, -71.0700, 'America’s first botanical garden, with swan boats and a bridge.'],
  ['Arnold Arboretum', 'Boston', 42.2990, -71.1280, 'Harvard’s 281-acre tree collection, brilliant in fall.'],
  ['Acorn Street', 'Boston', 42.3580, -71.0690, 'The most-photographed cobblestone lane in America.'],
  ['Naumkeag', 'Stockbridge', 42.2900, -73.3200, 'A Gilded Age estate with the famous Blue Steps.'],
  ['Rockport Motif No. 1', 'Rockport', 42.6550, -70.6150, 'The famous red fishing shack on the harbor.'],
  ['Tower Hill Botanic Garden', 'Boylston', 42.3900, -71.7000, 'Hilltop gardens overlooking the Wachusett Reservoir.'],
  ['Heritage Gardens', 'Sandwich', 41.7500, -70.5000, '100 acres of gardens and a windmill on Cape Cod.'],
  ['Mount Auburn Cemetery', 'Cambridge', 42.3720, -71.1460, 'A historic garden cemetery of ponds and blossoms.'],
]

const MI: Eng[] = [
  ['Frederik Meijer Gardens', 'Grand Rapids', 42.9740, -85.5900, '158 acres of gardens and sculpture, including a tropical conservatory.'],
  ['Mackinac Island', 'Mackinac Island', 45.8490, -84.6180, 'A car-free Victorian island with the Grand Hotel.'],
  ['Belle Isle Conservatory', 'Detroit', 42.3400, -82.9800, 'A glass-domed conservatory on a river island.'],
  ['Sleeping Bear Dunes', 'Empire', 44.8810, -86.0580, 'Towering dunes over Lake Michigan.'],
  ['Dow Gardens', 'Midland', 43.6100, -84.2500, 'Gardens with a famous canopy walk and footbridges.'],
  ['Holland Tulip Fields', 'Holland', 42.7870, -86.1090, 'Tulip fields and a Dutch windmill in spring.'],
  ['Tahquamenon Falls', 'Paradise', 46.5750, -85.2530, 'A wide amber waterfall in the Upper Peninsula.'],
  ['Hidden Lake Gardens', 'Tipton', 42.0500, -84.0900, 'A rolling arboretum with a conservatory.'],
]

const MN: Eng[] = [
  ['Minneapolis Sculpture Garden', 'Minneapolis', 44.9690, -93.2890, 'The Spoonbridge and Cherry fountain amid art.'],
  ['Como Conservatory', 'St. Paul', 44.9820, -93.1500, 'A Victorian glasshouse and Japanese garden.'],
  ['Stone Arch Bridge', 'Minneapolis', 44.9810, -93.2560, 'A curved bridge over St. Anthony Falls and the skyline.'],
  ['Minnehaha Falls', 'Minneapolis', 44.9150, -93.2110, 'A 53-foot waterfall in a wooded park.'],
  ['Split Rock Lighthouse', 'Two Harbors', 47.2003, -91.3670, 'A clifftop lighthouse over Lake Superior.'],
  ['Munsinger Clemens Gardens', 'St. Cloud', 45.5500, -94.1500, 'Riverside formal gardens with fountains.'],
  ['Lake of the Isles', 'Minneapolis', 44.9560, -93.3070, 'A serene city lake ringed by paths.'],
  ['Eloise Butler Wildflower Garden', 'Minneapolis', 44.9800, -93.3200, 'The oldest public wildflower garden in the US.'],
]

const MS: Eng[] = [
  ['Mynelle Gardens', 'Jackson', 32.3400, -90.2400, 'Seven acres of gardens with bridges and ponds.'],
  ['Windsor Ruins', 'Port Gibson', 31.9300, -91.0500, 'Twenty-three towering Corinthian columns.'],
  ['Natchez Bluffs', 'Natchez', 31.5590, -91.4030, 'Antebellum mansions above the Mississippi.'],
  ['Gulf Islands Seashore', 'Ocean Springs', 30.3900, -88.7900, 'White-sand barrier-island beaches.'],
  ['Crosby Arboretum', 'Picayune', 30.5400, -89.6700, 'A pavilion over a pond in a pine savanna.'],
  ['Friendship Cemetery', 'Columbus', 33.4900, -88.4100, 'Live oaks and antebellum monuments.'],
  ['Natchez Trace Cypress Swamp', 'Canton', 32.7100, -89.9100, 'A boardwalk through a tupelo-cypress swamp.'],
  ['Tishomingo Swinging Bridge', 'Tishomingo', 34.6100, -88.1800, 'A footbridge over a mossy sandstone gorge.'],
]

const MO: Eng[] = [
  ['Missouri Botanical Garden', 'St. Louis', 38.6120, -90.2590, 'A 79-acre garden with the Climatron dome and a Japanese garden.'],
  ['Gateway Arch Grounds', 'St. Louis', 38.6247, -90.1848, 'The stainless arch and its riverfront reflecting pond.'],
  ['Powell Gardens', 'Kingsville', 38.8600, -94.2000, '970 acres of gardens and a chapel by a lake.'],
  ['Ha Ha Tonka Castle', 'Camdenton', 38.0700, -92.7700, 'Castle ruins above a spring-fed lake.'],
  ['Forest Park Art Hill', 'St. Louis', 38.6360, -90.2840, 'The grand art museum above a lagoon.'],
  ['Kansas City Country Club Plaza', 'Kansas City', 39.0440, -94.5900, 'Spanish-style towers and fountains.'],
  ['Loose Park Rose Garden', 'Kansas City', 39.0300, -94.5900, 'A historic rose garden in the city.'],
  ['Elephant Rocks', 'Belleview', 37.6540, -90.6880, 'Giant rounded granite boulders.'],
]

const MT: Eng[] = [
  ['Glacier Lake McDonald', 'West Glacier', 48.5800, -113.8800, 'Colored pebbles beneath crystal-clear glacial water.'],
  ['Glacier Many Glacier', 'Babb', 48.7970, -113.6580, 'Sharp peaks reflected in Swiftcurrent Lake.'],
  ['Flathead Lake', 'Polson', 47.8400, -114.1500, 'The largest natural lake in the West, with cherry orchards.'],
  ['Glacier St. Mary Lake', 'St. Mary', 48.6680, -113.4380, 'Wild Goose Island in a turquoise lake.'],
  ['Beartooth Pass', 'Red Lodge', 45.0000, -109.4000, 'Alpine lakes and tundra near 11,000 feet.'],
  ['Hyalite Reservoir', 'Bozeman', 45.4800, -110.9700, 'An alpine reservoir ringed by peaks.'],
  ['Big Sky Meadow', 'Big Sky', 45.2840, -111.4010, 'Wildflower meadows below Lone Peak.'],
  ['ZooMontana Gardens', 'Billings', 45.7100, -108.6300, 'Wooded botanical paths along a creek.'],
]

const NE: Eng[] = [
  ['Lauritzen Gardens', 'Omaha', 41.2200, -95.9200, 'A 100-acre botanical center and conservatory.'],
  ['Chimney Rock', 'Bayard', 41.7030, -103.3460, 'A 300-foot spire on the plains.'],
  ['Scotts Bluff', 'Gering', 41.8300, -103.7070, 'Towering bluffs over the North Platte.'],
  ['Sunken Gardens', 'Lincoln', 40.8000, -96.7000, 'A terraced flower garden with reflecting pools.'],
  ['Smith Falls', 'Valentine', 42.8900, -100.3000, 'Nebraska’s tallest waterfall on the Niobrara.'],
  ['Toadstool Geologic Park', 'Crawford', 42.8700, -103.5800, 'Badlands hoodoos in the grassland.'],
  ['Holmes Lake', 'Lincoln', 40.7800, -96.6400, 'A lake with a rose garden and walking paths.'],
  ['Indian Cave State Park', 'Shubert', 40.2600, -95.5600, 'Forested bluffs above the Missouri River.'],
]

const NV: Eng[] = [
  ['Springs Preserve Gardens', 'Las Vegas', 36.1700, -115.1900, 'Desert botanical gardens at the city’s birthplace.'],
  ['Valley of Fire', 'Overton', 36.4290, -114.5150, 'Brilliant red sandstone formations.'],
  ['Red Rock Canyon', 'Las Vegas', 36.1350, -115.4270, 'Red sandstone escarpments near the city.'],
  ['Lake Tahoe Sand Harbor', 'Incline Village', 39.2000, -119.9300, 'Granite boulders in crystal water.'],
  ['Ethel M Cactus Garden', 'Henderson', 36.0600, -115.0200, 'A lit desert cactus garden.'],
  ['Cathedral Gorge', 'Panaca', 37.8200, -114.4100, 'Cathedral-like clay spires.'],
  ['The Bellagio Conservatory', 'Las Vegas', 36.1130, -115.1760, 'An ornate seasonal indoor botanical display.'],
  ['Lamoille Canyon', 'Lamoille', 40.6400, -115.4000, 'A glacial canyon in the Ruby Mountains.'],
]

const NH: Eng[] = [
  ['Fuller Gardens', 'North Hampton', 42.9700, -70.8100, 'A 1920s estate rose garden near the coast.'],
  ['Lake Winnipesaukee', 'Meredith', 43.6200, -71.3000, 'A vast lake dotted with islands.'],
  ['Flume Gorge', 'Lincoln', 44.0970, -71.6810, 'A boardwalk through a granite chasm.'],
  ['Castle in the Clouds', 'Moultonborough', 43.7500, -71.3100, 'An Arts-and-Crafts mansion above the lake.'],
  ['Mount Washington Hotel', 'Bretton Woods', 44.2580, -71.4410, 'A grand white resort below the peaks.'],
  ['Diana’s Baths', 'Bartlett', 44.0760, -71.1800, 'A staircase of small waterfalls and pools.'],
  ['Saint-Gaudens Site', 'Cornish', 43.5000, -72.3700, 'A sculptor’s estate with formal gardens.'],
  ['Lake Chocorua', 'Tamworth', 43.8950, -71.2600, 'The classic peak mirrored in a lake.'],
]

const NJ: Eng[] = [
  ['Grounds for Sculpture', 'Hamilton', 40.2300, -74.6900, 'A 42-acre park of monumental sculptures and gardens.'],
  ['Cape May Victorian District', 'Cape May', 38.9350, -74.9250, 'Streets of brightly painted gingerbread houses.'],
  ['Leaming’s Run Gardens', 'Cape May Court House', 39.1100, -74.8200, '25 acres of annual gardens and a colonial farm.'],
  ['Sandy Hook Lighthouse', 'Highlands', 40.4640, -74.0010, 'The oldest working lighthouse in the US.'],
  ['Duke Farms', 'Hillsborough', 40.5600, -74.6200, '1,000 acres of meadows, lakes, and an orchid range.'],
  ['Liberty State Park', 'Jersey City', 40.7050, -74.0550, 'Statue of Liberty and Manhattan skyline views.'],
  ['Reeves-Reed Arboretum', 'Summit', 40.7200, -74.3500, 'A daffodil bowl and woodland gardens.'],
  ['Ocean Grove', 'Ocean Grove', 40.2120, -74.0070, 'A Victorian seaside town and auditorium.'],
]

const NM: Eng[] = [
  ['ABQ BioPark Botanic Garden', 'Albuquerque', 35.0970, -106.6800, 'Walled gardens and a Japanese garden by the river.'],
  ['Santa Fe Plaza', 'Santa Fe', 35.6870, -105.9380, 'Adobe architecture and golden light.'],
  ['White Sands', 'Alamogordo', 32.7790, -106.1710, 'Rippling white gypsum dunes at sunset.'],
  ['Loretto Chapel', 'Santa Fe', 35.6850, -105.9370, 'A Gothic chapel with a mysterious spiral staircase.'],
  ['Taos Pueblo', 'Taos', 36.4390, -105.5450, 'A 1,000-year-old adobe pueblo.'],
  ['Tent Rocks', 'Cochiti', 35.6600, -106.4100, 'Cone-shaped hoodoos and a slot canyon.'],
  ['Rio Grande Gorge Bridge', 'Taos', 36.4640, -105.7290, 'A high steel arch over the chasm.'],
  ['Sandia Peak', 'Albuquerque', 35.2080, -106.4490, 'A tramway to a watermelon-pink ridge.'],
]

const NY: Eng[] = [
  ['New York Botanical Garden', 'Bronx', 40.8620, -73.8800, '250 acres with a glasshouse conservatory and rose garden.'],
  ['Central Park Bow Bridge', 'New York', 40.7757, -73.9712, 'A cast-iron bridge over the lake framing the skyline.'],
  ['Brooklyn Botanic Garden', 'Brooklyn', 40.6680, -73.9630, 'A cherry esplanade and Japanese hill-and-pond garden.'],
  ['Untermyer Gardens', 'Yonkers', 40.9700, -73.8900, 'A walled Persian garden with columns over the Hudson.'],
  ['Brooklyn Bridge Park', 'Brooklyn', 40.7000, -73.9960, 'Skyline and bridge views from the waterfront.'],
  ['Old Westbury Gardens', 'Old Westbury', 40.7900, -73.5900, 'A Gilded Age estate with grand allées and a lake.'],
  ['Letchworth Gorge', 'Castile', 42.5870, -78.0510, 'The "Grand Canyon of the East" with waterfalls.'],
  ['Niagara Falls', 'Niagara Falls', 43.0962, -79.0377, 'The thundering falls, floodlit at night.'],
]

const NC: Eng[] = [
  ['Biltmore Estate Gardens', 'Asheville', 35.5400, -82.5510, 'Frederick Law Olmsted gardens at America’s largest home.'],
  ['Sarah P. Duke Gardens', 'Durham', 36.0010, -78.9300, '55 acres of terraces, ponds, and a Japanese garden.'],
  ['Blue Ridge Parkway Overlooks', 'Asheville', 35.5950, -82.4500, 'Layered ridge views ablaze in autumn.'],
  ['Airlie Gardens', 'Wilmington', 34.2200, -77.8200, 'Live oaks, a bottle chapel, and lake paths.'],
  ['Cape Hatteras Lighthouse', 'Buxton', 35.2510, -75.5290, 'The tallest brick lighthouse in America.'],
  ['Linville Falls', 'Linville Falls', 35.9540, -81.9280, 'A powerful waterfall in a rugged gorge.'],
  ['Wrightsville Beach', 'Wrightsville Beach', 34.2080, -77.7960, 'Soft sand and Atlantic sunrises.'],
  ['JC Raulston Arboretum', 'Raleigh', 35.7960, -78.7000, 'A diverse teaching garden with a long border.'],
]

const ND: Eng[] = [
  ['International Peace Garden', 'Dunseith', 48.9990, -100.0590, 'Formal gardens straddling the US–Canada border.'],
  ['TR Painted Canyon', 'Medora', 46.8900, -103.3800, 'A sweeping badlands overlook.'],
  ['Lake Sakakawea', 'Pick City', 47.5000, -101.4000, 'Big-sky sunsets over a vast reservoir.'],
  ['Chateau de Mores', 'Medora', 46.9100, -103.5300, 'An 1883 hunting chateau on a bluff.'],
  ['Fort Abraham Lincoln', 'Mandan', 46.7600, -100.8500, 'A reconstructed post and earthlodges on the river.'],
  ['Pembina Gorge', 'Walhalla', 48.9200, -97.8600, 'The most forested river valley in the state.'],
  ['Myra Museum Gardens', 'Grand Forks', 47.9400, -97.0700, 'Historic buildings and gardens by the Red River.'],
  ['Cross Ranch', 'Center', 47.2200, -101.0800, 'Cottonwood bottomlands along the Missouri.'],
]

const OH: Eng[] = [
  ['Franklin Park Conservatory', 'Columbus', 39.9580, -82.9560, 'A historic glasshouse with Chihuly glass and gardens.'],
  ['Cleveland Botanical Garden', 'Cleveland', 41.5100, -81.6100, 'A glasshouse biome and formal display gardens.'],
  ['Hocking Hills Old Man’s Cave', 'Logan', 39.4280, -82.5410, 'A gorge of caves, bridges, and waterfalls.'],
  ['Cox Arboretum', 'Dayton', 39.6500, -84.2400, 'A butterfly house and tree gardens.'],
  ['Stan Hywet Hall', 'Akron', 41.1100, -81.5300, 'A Tudor estate with grand formal gardens.'],
  ['Holden Arboretum Canopy', 'Kirtland', 41.6100, -81.3000, 'A canopy walk and emergent tower above the trees.'],
  ['Brandywine Falls', 'Peninsula', 41.2770, -81.5400, 'A 65-foot waterfall in the national park.'],
  ['Kingwood Center Gardens', 'Mansfield', 40.7700, -82.5500, 'A French Provincial mansion and gardens.'],
]

const OK: Eng[] = [
  ['Myriad Botanical Gardens', 'Oklahoma City', 35.4660, -97.5170, 'A downtown garden with the tubular Crystal Bridge conservatory.'],
  ['Tulsa Botanic Garden', 'Tulsa', 36.2500, -96.0700, 'Terraced gardens and a lake in the hills.'],
  ['Turner Falls', 'Davis', 34.4250, -97.1470, 'A 77-foot waterfall into a natural pool.'],
  ['Wichita Mountains', 'Lawton', 34.7280, -98.7100, 'Ancient granite peaks and bison.'],
  ['Philbrook Museum Gardens', 'Tulsa', 36.1300, -95.9600, 'An Italianate villa with formal gardens.'],
  ['Beavers Bend', 'Broken Bow', 34.1390, -94.6810, 'Pine forests and a clear river.'],
  ['Gloss Mountains', 'Fairview', 36.3400, -98.5600, 'Mesas glittering with selenite at sunset.'],
  ['Chickasaw Recreation Area', 'Sulphur', 34.5000, -96.9700, 'Mineral springs and small waterfalls.'],
]

const OR: Eng[] = [
  ['Portland Japanese Garden', 'Portland', 45.5190, -122.7080, 'An authentic Japanese garden with Mount Hood views.'],
  ['International Rose Test Garden', 'Portland', 45.5190, -122.7050, '10,000 rose bushes above the city and Mount Hood.'],
  ['Multnomah Falls', 'Bridal Veil', 45.5762, -122.1158, 'A 620-foot waterfall with an arched footbridge.'],
  ['Cannon Beach', 'Cannon Beach', 45.8847, -123.9680, 'Haystack Rock on a misty Pacific beach.'],
  ['Crater Lake Rim', 'Crater Lake', 42.9446, -122.1090, 'The deepest, bluest lake in the US.'],
  ['Cape Kiwanda', 'Pacific City', 45.2160, -123.9700, 'A sandstone headland over the surf.'],
  ['Shore Acres Gardens', 'Coos Bay', 43.3200, -124.3800, 'Cliffside formal gardens above the crashing ocean.'],
  ['Trillium Lake', 'Government Camp', 45.2440, -121.7270, 'Mount Hood mirrored in a still lake.'],
]

const PA: Eng[] = [
  ['Longwood Gardens', 'Kennett Square', 39.8700, -75.6740, 'Grand fountains and conservatories on a du Pont estate.'],
  ['Phipps Conservatory', 'Pittsburgh', 40.4390, -79.9480, 'A Victorian glasshouse of seasonal displays.'],
  ['Fallingwater', 'Mill Run', 39.9060, -79.4680, 'Wright’s house cantilevered over a waterfall.'],
  ['Pittsburgh Mount Washington', 'Pittsburgh', 40.4310, -80.0090, 'Three rivers and bridges from the overlook.'],
  ['Hershey Gardens', 'Hershey', 40.2870, -76.6500, '23 acres of gardens including a butterfly atrium.'],
  ['Ricketts Glen', 'Benton', 41.3300, -76.2700, '21 waterfalls along a gorge loop.'],
  ['Boathouse Row', 'Philadelphia', 39.9690, -75.1860, 'Rowing clubs outlined in lights on the river.'],
  ['Nemacolin / Ohiopyle Falls', 'Ohiopyle', 39.8690, -79.4920, 'A wide waterfall on the Youghiogheny.'],
]

const RI: Eng[] = [
  ['The Breakers', 'Newport', 41.4699, -71.2986, 'A Gilded Age Vanderbilt mansion on the cliffs.'],
  ['Newport Cliff Walk', 'Newport', 41.4790, -71.3000, 'A path between mansions and crashing surf.'],
  ['Blithewold Mansion & Gardens', 'Bristol', 41.6600, -71.2700, 'A 33-acre arboretum estate on Narragansett Bay.'],
  ['Roger Williams Park', 'Providence', 41.7900, -71.4180, 'Victorian gardens, lakes, and a domed museum.'],
  ['Beavertail Lighthouse', 'Jamestown', 41.4490, -71.3990, 'A lighthouse on wave-battered rocks.'],
  ['Block Island Mohegan Bluffs', 'Block Island', 41.1500, -71.5550, 'Clay cliffs above a hidden beach.'],
  ['Green Animals Topiary', 'Portsmouth', 41.6300, -71.2700, 'The oldest topiary garden in the US.'],
  ['Watch Hill', 'Westerly', 41.3050, -71.8580, 'A historic carousel and breezy bluff.'],
]

const SC: Eng[] = [
  ['Magnolia Plantation', 'Charleston', 32.8870, -80.0810, 'America’s oldest public garden with mossy oaks and a white bridge.'],
  ['Middleton Place', 'Charleston', 32.8000, -80.0900, 'The oldest landscaped gardens in the US, with terraced lakes.'],
  ['Angel Oak', 'Johns Island', 32.7180, -80.0810, 'A 400-year-old sprawling live oak.'],
  ['Brookgreen Gardens', 'Murrells Inlet', 33.5200, -79.0900, 'Sculpture gardens among live oaks and lowcountry rivers.'],
  ['Charleston Battery', 'Charleston', 32.7700, -79.9280, 'Antebellum mansions along a seawall promenade.'],
  ['Botany Bay', 'Edisto Island', 32.5400, -80.2500, 'A boneyard beach of weathered trees.'],
  ['Table Rock', 'Pickens', 35.0270, -82.6980, 'A granite dome mirrored in a reservoir.'],
  ['Hampton Park', 'Charleston', 32.7900, -79.9600, 'A city park of rose arbors and a lagoon.'],
]

const SD: Eng[] = [
  ['McCrory Gardens', 'Brookings', 44.3100, -96.7900, '25 acres of display gardens and an arboretum.'],
  ['Sylvan Lake', 'Custer', 43.8470, -103.5580, 'A lake encircled by granite boulders.'],
  ['Mount Rushmore', 'Keystone', 43.8791, -103.4591, 'Four presidents carved into granite.'],
  ['Spearfish Canyon', 'Spearfish', 44.3800, -103.8400, 'Limestone walls and waterfalls.'],
  ['Badlands Pinnacles', 'Interior', 43.8554, -102.3397, 'Striped spires glowing at sunset.'],
  ['Falls Park', 'Sioux Falls', 43.5560, -96.7210, 'Pink quartzite falls in the city center.'],
  ['Custer State Park', 'Custer', 43.7500, -103.4200, 'Granite spires and a roaming bison herd.'],
  ['Roughlock Falls', 'Lead', 44.3200, -103.8800, 'A wide tiered waterfall in a canyon.'],
]

const TN: Eng[] = [
  ['Cheekwood Estate & Gardens', 'Nashville', 36.0890, -86.8650, 'A 1930s mansion with 55 acres of gardens.'],
  ['Smokies Clingmans Dome', 'Gatlinburg', 35.5628, -83.4986, 'A spiral ramp to the highest park overlook.'],
  ['Memphis Botanic Garden', 'Memphis', 35.1200, -89.8600, '96 acres including a Japanese garden and rose garden.'],
  ['Roan Mountain Rhododendron', 'Roan Mountain', 36.1040, -82.1300, 'The world’s largest natural rhododendron garden.'],
  ['Nashville Parthenon', 'Nashville', 36.1490, -86.8130, 'A full-scale replica of the Athenian Parthenon.'],
  ['Fall Creek Falls', 'Spencer', 35.6620, -85.3550, 'A 256-foot waterfall in a deep gorge.'],
  ['Lookout Mountain Rock City', 'Lookout Mountain', 34.9720, -85.3500, 'Sandstone passages and a multi-state overlook.'],
  ['Reflection Riding Arboretum', 'Chattanooga', 35.0100, -85.3700, 'A scenic arboretum below Lookout Mountain.'],
]

const TX: Eng[] = [
  ['Dallas Arboretum', 'Dallas', 32.8240, -96.7170, '66 acres of gardens on White Rock Lake.'],
  ['Fort Worth Botanic Garden', 'Fort Worth', 32.7410, -97.3640, 'The oldest botanic garden in Texas, with a Japanese garden.'],
  ['San Antonio River Walk', 'San Antonio', 29.4250, -98.4860, 'Cypress-lined canals and arched bridges.'],
  ['Enchanted Rock', 'Fredericksburg', 30.5060, -98.8190, 'A pink-granite dome glowing at sunset.'],
  ['Hamilton Pool', 'Dripping Springs', 30.3420, -98.1270, 'A waterfall into a jade-green grotto.'],
  ['McKinney Falls', 'Austin', 30.1830, -97.7220, 'Limestone ledges and falls near the city.'],
  ['Tyler Rose Garden', 'Tyler', 32.3400, -95.3100, 'The largest rose garden in the US.'],
  ['Big Bend Chisos Basin', 'Big Bend', 29.2700, -103.3000, 'A mountain basin framing desert sunsets.'],
]

const UT: Eng[] = [
  ['Red Butte Garden', 'Salt Lake City', 40.7660, -111.8240, 'A botanical garden in the Wasatch foothills.'],
  ['Delicate Arch', 'Moab', 38.7436, -109.4993, 'The free-standing arch framing the La Sals at sunset.'],
  ['Thanksgiving Point Ashton Gardens', 'Lehi', 40.4300, -111.8900, '55 acres of gardens with a 50-foot waterfall.'],
  ['Bryce Canyon Sunrise Point', 'Bryce', 37.6260, -112.1670, 'An amphitheater of orange hoodoos.'],
  ['Zion Canyon Overlook', 'Springdale', 37.2130, -112.9430, 'A short trail to a sweeping canyon view.'],
  ['Bonneville Salt Flats', 'Wendover', 40.7600, -113.8500, 'A blinding-white plain to the horizon.'],
  ['Bear Lake', 'Garden City', 41.9600, -111.3900, 'The "Caribbean of the Rockies" turquoise lake.'],
  ['Park City Main Street', 'Park City', 40.6460, -111.4980, 'A historic town below ski slopes.'],
]

const VT: Eng[] = [
  ['Shelburne Farms', 'Shelburne', 44.4080, -73.2470, 'A lakeside estate of pastoral landscapes and a grand barn.'],
  ['Sleepy Hollow Farm', 'Woodstock', 43.6360, -72.4870, 'A storybook farmhouse and winding lane in autumn.'],
  ['Stowe Community Church', 'Stowe', 44.4650, -72.6870, 'A white steeple framed by fall foliage.'],
  ['Quechee Gorge', 'Quechee', 43.6390, -72.4070, 'Vermont’s deepest gorge from a bridge.'],
  ['Lake Willoughby', 'Westmore', 44.7300, -72.0500, 'A fjord-like lake between two peaks.'],
  ['Hildene Gardens', 'Manchester', 43.1500, -73.0700, 'A Lincoln-family mansion and formal gardens.'],
  ['Jenne Farm', 'Reading', 43.5300, -72.5500, 'An iconic red-barn farmstead in the hills.'],
  ['Mount Philo', 'Charlotte', 44.2800, -73.2200, 'A small summit over Lake Champlain farmland.'],
]

const VA: Eng[] = [
  ['Norfolk Botanical Garden', 'Norfolk', 36.9000, -76.2000, '175 acres of gardens on a lakeshore peninsula.'],
  ['Lewis Ginter Botanical Garden', 'Richmond', 37.6300, -77.4700, 'A domed conservatory and a classical garden.'],
  ['Skyline Drive Overlooks', 'Luray', 38.5000, -78.4500, 'Blue-layered mountain views in Shenandoah.'],
  ['Monticello', 'Charlottesville', 38.0080, -78.4530, 'Jefferson’s neoclassical mountaintop home.'],
  ['Maymont', 'Richmond', 37.5300, -77.4700, 'A Gilded Age estate with Italian and Japanese gardens.'],
  ['Colonial Williamsburg', 'Williamsburg', 37.2710, -76.7000, 'Restored 18th-century streets and gardens.'],
  ['Great Falls Park', 'McLean', 38.9970, -77.2540, 'The Potomac roaring through a gorge.'],
  ['Virginia Beach Boardwalk', 'Virginia Beach', 36.8520, -75.9780, 'A 3-mile oceanfront boardwalk.'],
]

const WA: Eng[] = [
  ['Washington Park Arboretum', 'Seattle', 47.6390, -122.2960, '230 acres including the Japanese Garden and Azalea Way.'],
  ['Mount Rainier Reflection Lakes', 'Ashford', 46.7700, -121.7300, 'The volcano mirrored in alpine lakes and meadows.'],
  ['Snoqualmie Falls', 'Snoqualmie', 47.5417, -121.8377, 'A 268-foot waterfall taller than Niagara.'],
  ['Seattle Kerry Park', 'Seattle', 47.6295, -122.3600, 'The classic skyline and Rainier overlook.'],
  ['Deception Pass Bridge', 'Oak Harbor', 48.4060, -122.6470, 'A high bridge over churning tidal waters.'],
  ['Bellevue Botanical Garden', 'Bellevue', 47.6100, -122.1700, '53 acres of display gardens and a suspension bridge.'],
  ['Ruby Beach', 'Forks', 47.7100, -124.4150, 'Sea stacks and driftwood on a wild coast.'],
  ['Diablo Lake', 'Newhalem', 48.7140, -121.1360, 'A turquoise glacial lake in the Cascades.'],
]

const WV: Eng[] = [
  ['New River Gorge Bridge', 'Fayetteville', 38.0700, -81.0760, 'A long steel arch over a forested gorge.'],
  ['Blackwater Falls', 'Davis', 39.1130, -79.4900, 'An amber 57-foot waterfall in a canyon.'],
  ['Core Arboretum', 'Morgantown', 39.6500, -79.9700, 'A wooded arboretum above the Monongahela.'],
  ['Glade Creek Grist Mill', 'Clifftop', 37.8200, -80.9300, 'A picturesque working mill beside a creek.'],
  ['Seneca Rocks', 'Seneca Rocks', 38.8350, -79.3730, 'A sheer quartzite fin above the valley.'],
  ['Coopers Rock', 'Morgantown', 39.6600, -79.7900, 'A clifftop overlook of the Cheat River gorge.'],
  ['Harpers Ferry', 'Harpers Ferry', 39.3260, -77.7290, 'A historic town at a river confluence.'],
  ['Sandstone Falls', 'Hinton', 37.7700, -80.8900, 'The widest waterfall on the New River.'],
]

const WI: Eng[] = [
  ['Olbrich Botanical Gardens', 'Madison', 43.0950, -89.3360, 'A Thai pavilion and gardens on Lake Monona.'],
  ['Boerner Botanical Gardens', 'Hales Corners', 42.9300, -88.0400, 'Formal gardens with a rose collection.'],
  ['Devils Lake', 'Baraboo', 43.4280, -89.7300, '500-foot quartzite bluffs over a clear lake.'],
  ['Cave Point County Park', 'Sturgeon Bay', 44.9200, -87.2700, 'Limestone cliffs and caves on Lake Michigan.'],
  ['Apostle Islands Sea Caves', 'Bayfield', 46.9300, -90.6600, 'Sea caves that freeze into ice in winter.'],
  ['Holy Hill Basilica', 'Hubertus', 43.2500, -88.2900, 'A twin-spired basilica above autumn forest.'],
  ['Lake Geneva Shore Path', 'Lake Geneva', 42.5910, -88.4330, 'A path past Gilded Age estates.'],
  ['Paine Art Center Gardens', 'Oshkosh', 44.0200, -88.5500, 'A Tudor estate with conservatory and gardens.'],
]

const WY: Eng[] = [
  ['Grand Teton Schwabacher Landing', 'Moose', 43.7900, -110.6800, 'The Tetons mirrored in a quiet river channel.'],
  ['Jenny Lake', 'Moose', 43.7600, -110.7200, 'A glassy lake at the foot of the peaks.'],
  ['Oxbow Bend', 'Moran', 43.8650, -110.5470, 'Mount Moran reflected in a calm river bend.'],
  ['Grand Prismatic Spring', 'Yellowstone', 44.5250, -110.8380, 'A rainbow-ringed hot spring.'],
  ['Mormon Row Barns', 'Moose', 43.7350, -110.6500, 'Historic barns beneath the Tetons.'],
  ['String Lake', 'Moose', 43.7900, -110.7300, 'A shallow turquoise lake between bigger lakes.'],
  ['Devils Tower', 'Devils Tower', 44.5902, -104.7146, 'An 867-foot monolith rising from the plains.'],
  ['Hot Springs State Park', 'Thermopolis', 43.6500, -108.2000, 'Travertine terraces and mineral springs.'],
]

// ─── REGISTRY + EXPORT ───────────────────────────────────────────────────────
const ENG_BY_STATE: Record<string, Eng[]> = {
  AL, AK, AZ, AR, CA, CO, CT, DE, FL, GA, HI,
  ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MI,
  MN, MS, MO, MT, NE, NV, NH, NJ, NM, NY, NC,
  ND, OH, OK, OR, PA, RI, SC, SD, TN, TX, UT,
  VT, VA, WA, WV, WI, WY,
}

export const engagementExtraSpots: PhotoSpot[] = Object.entries(ENG_BY_STATE)
  .flatMap(([state, rows]) => expand(state, rows))
