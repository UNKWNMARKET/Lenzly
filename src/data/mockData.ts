export interface Photographer {
  id: string
  username: string
  name: string
  avatar: string
  bio: string
  specialty: string[]
  location: string
  city: string
  lat: number
  lng: number
  followers: number
  following: number
  posts: number
  hired: number
  rating: number
  verified: boolean
  pro: boolean
  secondShooter: boolean
  instagram: string
  portfolio: string
  coverPhoto: string
  photos: string[]
  available: boolean
  priceRange: string
}

export interface Post {
  id: string
  photographer: Photographer
  image: string
  location: string
  locationCoords: { lat: number; lng: number }
  caption: string
  tags: string[]
  likes: number
  comments: number
  liked: boolean
  bookmarked: boolean
  timestamp: Date
  category: string
}

export interface PhotoSpot {
  id: string
  name: string
  description: string
  image: string
  lat: number
  lng: number
  category: string
  rating: number
  photoCount: number
  bestTime: string
  city: string
  aiDiscovered: boolean
}

const BASE = 'https://images.unsplash.com/photo-'

const unsplash = (id: string, w = 800) =>
  `${BASE}${id}?w=${w}&q=80&auto=format&fit=crop`

export const photographers: Photographer[] = [
  {
    id: 'p1',
    username: 'lucasthomas',
    name: 'Lucas Thomas',
    avatar: unsplash('1506794778202-cad84cf45f1d', 200),
    bio: 'Capturing light, chasing golden hours. Based in NYC. Available for editorial & commercial work.',
    specialty: ['Portrait', 'Editorial', 'Fashion'],
    location: 'New York, NY',
    city: 'New York',
    lat: 40.7128,
    lng: -74.006,
    followers: 48200,
    following: 512,
    posts: 847,
    hired: 234,
    rating: 4.9,
    verified: true,
    pro: true,
    secondShooter: false,
    instagram: '@lucasthomas.lens',
    portfolio: 'lucasthomas.com',
    coverPhoto: unsplash('1469334031218-e382a71b716b', 800),
    photos: [
      unsplash('1531746020798-e6953c6e8e04', 400),
      unsplash('1529626455594-4ff0802cfb7e', 400),
      unsplash('1469334031218-e382a71b716b', 400),
      unsplash('1517841905240-472988babdf9', 400),
      unsplash('1524504388940-b1c1722653e8', 400),
      unsplash('1507003211169-0a1dd7228f2d', 400),
    ],
    available: true,
    priceRange: '$500–$2000/day',
  },
  {
    id: 'p2',
    username: 'aviabrams',
    name: 'Avi Abrams',
    avatar: unsplash('1500648767791-00dcc994a43e', 200),
    bio: 'Wedding & lifestyle photographer. I tell your story through light. Available nationwide.',
    specialty: ['Wedding', 'Lifestyle', 'Portrait'],
    location: 'Los Angeles, CA',
    city: 'Los Angeles',
    lat: 34.0522,
    lng: -118.2437,
    followers: 92100,
    following: 344,
    posts: 1204,
    hired: 412,
    rating: 5.0,
    verified: true,
    pro: true,
    secondShooter: true,
    instagram: '@aviabrams',
    portfolio: 'aviabrams.co',
    coverPhoto: unsplash('1519741497674-611481863552', 800),
    photos: [
      unsplash('1519741497674-611481863552', 400),
      unsplash('1520854221256-17451cc331bf', 400),
      unsplash('1537633552985-df8429e8048b', 400),
      unsplash('1494790108755-2616b612b786', 400),
      unsplash('1438761681033-6461ffad8d80', 400),
      unsplash('1500648767791-00dcc994a43e', 400),
    ],
    available: true,
    priceRange: '$1500–$5000/event',
  },
  {
    id: 'p3',
    username: 'nadia.lens',
    name: 'Nadia Reyes',
    avatar: unsplash('1494790108755-2616b612b786', 200),
    bio: 'Landscape & travel photographer. 47 countries and counting. NatGeo contributor.',
    specialty: ['Landscape', 'Travel', 'Nature'],
    location: 'Austin, TX',
    city: 'Austin',
    lat: 30.2672,
    lng: -97.7431,
    followers: 204000,
    following: 801,
    posts: 2103,
    hired: 156,
    rating: 4.8,
    verified: true,
    pro: true,
    secondShooter: false,
    instagram: '@nadia.lens',
    portfolio: 'nadiareyes.com',
    coverPhoto: unsplash('1506905925346-21bda4d32df4', 800),
    photos: [
      unsplash('1506905925346-21bda4d32df4', 400),
      unsplash('1441974231531-c6227db76b6e', 400),
      unsplash('1500534314209-a25ddb2bd429', 400),
      unsplash('1507525428034-b723cf961d3e', 400),
      unsplash('1469854523086-cc02fe5d8800', 400),
      unsplash('1454496522488-7a8e488e8606', 400),
    ],
    available: false,
    priceRange: '$800–$3000/day',
  },
  {
    id: 'p4',
    username: 'mikevaughn',
    name: 'Mike Vaughn',
    avatar: unsplash('1472099645785-5658abf4ff4e', 200),
    bio: 'Street & documentary photographer. Capturing authentic moments in cities.',
    specialty: ['Street', 'Documentary', 'Urban'],
    location: 'Chicago, IL',
    city: 'Chicago',
    lat: 41.8781,
    lng: -87.6298,
    followers: 31500,
    following: 920,
    posts: 634,
    hired: 88,
    rating: 4.7,
    verified: false,
    pro: true,
    secondShooter: true,
    instagram: '@mikevaughn.photo',
    portfolio: 'mikevaughn.io',
    coverPhoto: unsplash('1480714378408-67cf0d13bc1b', 800),
    photos: [
      unsplash('1480714378408-67cf0d13bc1b', 400),
      unsplash('1473116763249-2faaef81ccda', 400),
      unsplash('1486325212027-8081e485255e', 400),
      unsplash('1477959858617-67f85cf4f1df', 400),
      unsplash('1518655048521-f130df041f66', 400),
      unsplash('1470229722913-7c0e2dbbafd3', 400),
    ],
    available: true,
    priceRange: '$300–$1200/day',
  },
  {
    id: 'p5',
    username: 'sophiaclarke',
    name: 'Sophia Clarke',
    avatar: unsplash('1438761681033-6461ffad8d80', 200),
    bio: 'Commercial & brand photographer. I help businesses look stunning. Client list available.',
    specialty: ['Commercial', 'Brand', 'Product'],
    location: 'Miami, FL',
    city: 'Miami',
    lat: 25.7617,
    lng: -80.1918,
    followers: 67800,
    following: 412,
    posts: 923,
    hired: 389,
    rating: 4.9,
    verified: true,
    pro: true,
    secondShooter: false,
    instagram: '@sophiaclarke.studio',
    portfolio: 'sophiaclarke.co',
    coverPhoto: unsplash('1529626455594-4ff0802cfb7e', 800),
    photos: [
      unsplash('1529626455594-4ff0802cfb7e', 400),
      unsplash('1531746020798-e6953c6e8e04', 400),
      unsplash('1524504388940-b1c1722653e8', 400),
      unsplash('1469334031218-e382a71b716b', 400),
      unsplash('1517841905240-472988babdf9', 400),
      unsplash('1438761681033-6461ffad8d80', 400),
    ],
    available: true,
    priceRange: '$1000–$4000/day',
  },
  {
    id: 'p6',
    username: 'jreid.photo',
    name: 'Jordan Reid',
    avatar: unsplash('1463453091185-61582044d556', 200),
    bio: 'Concert & music photographer. Shot 200+ tours. Preferred shooter for major labels.',
    specialty: ['Concert', 'Music', 'Event'],
    location: 'Nashville, TN',
    city: 'Nashville',
    lat: 36.1627,
    lng: -86.7816,
    followers: 118000,
    following: 567,
    posts: 1876,
    hired: 521,
    rating: 4.8,
    verified: true,
    pro: true,
    secondShooter: false,
    instagram: '@jreid.photo',
    portfolio: 'jordanreid.com',
    coverPhoto: unsplash('1470229722913-7c0e2dbbafd3', 800),
    photos: [
      unsplash('1470229722913-7c0e2dbbafd3', 400),
      unsplash('1518655048521-f130df041f66', 400),
      unsplash('1486325212027-8081e485255e', 400),
      unsplash('1480714378408-67cf0d13bc1b', 400),
      unsplash('1506905925346-21bda4d32df4', 400),
      unsplash('1531746020798-e6953c6e8e04', 400),
    ],
    available: true,
    priceRange: '$600–$2500/event',
  },
]

export const photoSpots: PhotoSpot[] = [
  {
    id: 's1',
    name: 'Brooklyn Bridge at Dawn',
    description: 'Iconic view with Manhattan skyline. Best during golden hour. Arrive 30 min early.',
    image: unsplash('1477959858617-67f85cf4f1df', 600),
    lat: 40.7061,
    lng: -73.9969,
    category: 'Urban',
    rating: 4.9,
    photoCount: 8420,
    bestTime: 'Sunrise · 5:30–7am',
    city: 'New York',
    aiDiscovered: true,
  },
  {
    id: 's2',
    name: 'Griffith Observatory',
    description: 'City lights below, stars above. Perfect for cityscapes and night portraits.',
    image: unsplash('1480714378408-67cf0d13bc1b', 600),
    lat: 34.1184,
    lng: -118.3004,
    category: 'Landscape',
    rating: 4.8,
    photoCount: 12300,
    bestTime: 'Blue Hour · 7–8pm',
    city: 'Los Angeles',
    aiDiscovered: true,
  },
  {
    id: 's3',
    name: 'Antelope Canyon',
    description: 'AI-discovered light beam slot canyon. Premium light shafts daily.',
    image: unsplash('1469854523086-cc02fe5d8800', 600),
    lat: 36.8619,
    lng: -111.3743,
    category: 'Nature',
    rating: 5.0,
    photoCount: 31200,
    bestTime: 'Midday · 11am–1pm',
    city: 'Page, AZ',
    aiDiscovered: true,
  },
  {
    id: 's4',
    name: 'Millennium Park',
    description: 'Cloud Gate reflections. Great for architecture and street portraits.',
    image: unsplash('1486325212027-8081e485255e', 600),
    lat: 41.8826,
    lng: -87.6233,
    category: 'Urban',
    rating: 4.7,
    photoCount: 5600,
    bestTime: 'Overcast days · Any time',
    city: 'Chicago',
    aiDiscovered: false,
  },
  {
    id: 's5',
    name: 'Zion Angels Landing',
    description: 'Epic canyon views. Challenging hike, worth every step for the light.',
    image: unsplash('1506905925346-21bda4d32df4', 600),
    lat: 37.2690,
    lng: -112.9469,
    category: 'Nature',
    rating: 4.9,
    photoCount: 18900,
    bestTime: 'Sunrise · 6–8am',
    city: 'Springdale, UT',
    aiDiscovered: true,
  },
  {
    id: 's6',
    name: 'South Beach Sunrise',
    description: 'Art deco architecture with pastel morning light. Neon signs at night.',
    image: unsplash('1507525428034-b723cf961d3e', 600),
    lat: 25.7825,
    lng: -80.1302,
    category: 'Lifestyle',
    rating: 4.6,
    photoCount: 9100,
    bestTime: 'Sunrise & Golden Hour',
    city: 'Miami',
    aiDiscovered: false,
  },
]

export const posts: Post[] = [
  {
    id: 'post1',
    photographer: photographers[0],
    image: unsplash('1531746020798-e6953c6e8e04', 800),
    location: 'Highline, New York',
    locationCoords: { lat: 40.7479, lng: -74.0048 },
    caption: 'The city never sleeps — neither does the light. Shot this during an unexpected fog roll at The Highline just before sunrise. Pure magic. 🌫️',
    tags: ['#portraitphotography', '#newyork', '#goldenhour', '#editorial'],
    likes: 4823,
    comments: 147,
    liked: false,
    bookmarked: false,
    timestamp: new Date(Date.now() - 2 * 3600000),
    category: 'Portrait',
  },
  {
    id: 'post2',
    photographer: photographers[2],
    image: unsplash('1506905925346-21bda4d32df4', 800),
    location: 'Rocky Mountain NP, CO',
    locationCoords: { lat: 40.3428, lng: -105.6836 },
    caption: 'Been coming to this exact spot for 3 years. This morning the clouds finally did what I\'d been waiting for. Sometimes patience is the best camera setting.',
    tags: ['#landscapephotography', '#rockymountains', '#natgeo', '#nature'],
    likes: 18420,
    comments: 834,
    liked: true,
    bookmarked: true,
    timestamp: new Date(Date.now() - 5 * 3600000),
    category: 'Landscape',
  },
  {
    id: 'post3',
    photographer: photographers[3],
    image: unsplash('1480714378408-67cf0d13bc1b', 800),
    location: 'Lower East Side, Chicago',
    locationCoords: { lat: 41.8827, lng: -87.6293 },
    caption: 'Rain-soaked streets and neon reflections — Chicago at 2am hits different.',
    tags: ['#streetphotography', '#chicago', '#nightphotography', '#urban'],
    likes: 6201,
    comments: 213,
    liked: false,
    bookmarked: false,
    timestamp: new Date(Date.now() - 12 * 3600000),
    category: 'Street',
  },
  {
    id: 'post4',
    photographer: photographers[1],
    image: unsplash('1519741497674-611481863552', 800),
    location: 'Malibu Beach, CA',
    locationCoords: { lat: 34.0259, lng: -118.7798 },
    caption: 'Alex & Jamie said "I do" with the Pacific as their witness. No edits needed when the light cooperates like this.',
    tags: ['#weddingphotography', '#malibu', '#beachwedding', '#love'],
    likes: 22100,
    comments: 1203,
    liked: false,
    bookmarked: true,
    timestamp: new Date(Date.now() - 24 * 3600000),
    category: 'Wedding',
  },
  {
    id: 'post5',
    photographer: photographers[5],
    image: unsplash('1470229722913-7c0e2dbbafd3', 800),
    location: 'Ryman Auditorium, Nashville',
    locationCoords: { lat: 36.1612, lng: -86.7783 },
    caption: 'Front row energy at the Mother Church of Country Music. There\'s nothing like shooting live music.',
    tags: ['#concertphotography', '#nashville', '#musicphotography', '#livemusic'],
    likes: 11300,
    comments: 445,
    liked: true,
    bookmarked: false,
    timestamp: new Date(Date.now() - 36 * 3600000),
    category: 'Concert',
  },
  {
    id: 'post6',
    photographer: photographers[4],
    image: unsplash('1529626455594-4ff0802cfb7e', 800),
    location: 'Wynwood Walls, Miami',
    locationCoords: { lat: 25.8003, lng: -80.1996 },
    caption: 'Brand shoot for @______ — can\'t say who yet but this collection is 🔥. Miami always delivers the backdrop.',
    tags: ['#commercialphotography', '#miamiphotographer', '#fashion', '#brand'],
    likes: 8740,
    comments: 321,
    liked: false,
    bookmarked: false,
    timestamp: new Date(Date.now() - 48 * 3600000),
    category: 'Commercial',
  },
]

export const currentUser: Photographer = {
  id: 'me',
  username: 'yourname.lens',
  name: 'Your Name',
  avatar: unsplash('1524504388940-b1c1722653e8', 200),
  bio: 'Photographer · Your city. Building my portfolio one frame at a time.',
  specialty: ['Portrait', 'Lifestyle'],
  location: 'Your City',
  city: 'Your City',
  lat: 40.7128,
  lng: -74.006,
  followers: 1204,
  following: 387,
  posts: 48,
  hired: 12,
  rating: 4.6,
  verified: false,
  pro: false,
  secondShooter: true,
  instagram: '@yourname',
  portfolio: 'yourportfolio.com',
  coverPhoto: unsplash('1469334031218-e382a71b716b', 800),
  photos: [
    unsplash('1531746020798-e6953c6e8e04', 400),
    unsplash('1507525428034-b723cf961d3e', 400),
    unsplash('1441974231531-c6227db76b6e', 400),
    unsplash('1506905925346-21bda4d32df4', 400),
    unsplash('1480714378408-67cf0d13bc1b', 400),
    unsplash('1470229722913-7c0e2dbbafd3', 400),
    unsplash('1529626455594-4ff0802cfb7e', 400),
    unsplash('1519741497674-611481863552', 400),
    unsplash('1473116763249-2faaef81ccda', 400),
  ],
  available: true,
  priceRange: '$200–$800/day',
}

export const specialtyFilters = [
  'All', 'Portrait', 'Wedding', 'Landscape', 'Street', 'Commercial', 'Concert', 'Fashion'
]
