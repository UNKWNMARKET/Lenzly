import { useState } from 'react'
import { ArrowLeft, Star, Phone, ExternalLink, MapPin, DollarSign, X, ChevronRight, Award, Heart } from 'lucide-react'
import { useLocation } from 'wouter'

// ─── Venue data ────────────────────────────────────────────────────────────────
// All ratings, prices, phone numbers, and website URLs sourced from:
//   WeddingWire (weddingwire.com) — Couples' Choice Awards methodology:
//   venues with a 4.0+ average score reviewed by verified couples.
//   The Knot (theknot.com) — Best of Weddings Awards.
//   Pricing sourced from venue official websites and public listing pages.
//   Phone numbers from official venue websites / Google Business listings.
//
// Photos: Wikimedia Commons CC-licensed images where available (attribution
// displayed on each card). Generic venue photos via Pexels (free commercial use).

type RatingSource = 'WeddingWire' | 'The Knot' | 'Zola'

type Venue = {
  id: string
  name: string
  city: string
  state: string
  address: string
  phone: string
  website: string      // official venue page
  listingUrl: string   // WeddingWire / Knot listing
  priceLabel: string   // e.g. "From $10,000"
  priceNote: string    // context / fine print
  rating: number
  reviewCount: number
  ratingSource: RatingSource
  ratingUrl: string
  capacity: string
  style: string        // Ballroom, Estate, Historic, etc.
  description: string
  imageUrl: string
  imageAttribution?: string   // required for Wikimedia CC images
  imageLicense?: string
  badge?: string       // e.g. "#1 in USA"
}

const VENUES: Venue[] = [
  {
    id: 'clarks-landing',
    name: 'Clarks Landing Yacht Club',
    city: 'Point Pleasant Beach',
    state: 'NJ',
    address: '847 Arnold Ave, Point Pleasant Beach, NJ 08742',
    phone: '(732) 899-5559',
    website: 'https://clarkslandingweddings.com',
    listingUrl: 'https://www.weddingwire.com/biz/clarks-landing-yacht-club-point-pleasant-point-pleasant-beach/bc90bac843cda682.html',
    priceLabel: 'Starting at $2,500',
    priceNote: 'Ceremony fee; reception packages vary. All-inclusive one-wedding-at-a-time venue.',
    rating: 4.98,
    reviewCount: 451,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/clarks-landing-yacht-club-point-pleasant-point-pleasant-beach/bc90bac843cda682.html',
    capacity: 'Up to 300 guests',
    style: 'Waterfront Yacht Club',
    description: 'Ranked #1 wedding venue in the entire USA by Hello Millions (analysis of 12,000+ venues on The Knot). An exclusive all-inclusive waterfront venue on the Jersey Shore — hosts only one wedding per day, ensuring your celebration is the only one on property.',
    imageUrl: 'https://images.pexels.com/photos/1034187/pexels-photo-1034187.jpeg?auto=compress&cs=tinysrgb&w=800',
    badge: '#1 in USA',
  },
  {
    id: 'park-chateau',
    name: 'Park Chateau Estate & Gardens',
    city: 'East Brunswick',
    state: 'NJ',
    address: '678 Cranbury Rd, East Brunswick, NJ 08816',
    phone: '(732) 238-4200',
    website: 'https://parkchateau.com',
    listingUrl: 'https://www.weddingwire.com/biz/park-chateau-estate-gardens-east-brunswick/2408530a77f67ef1.html',
    priceLabel: '$31,000 – $70,000',
    priceNote: 'Set venue fee based on date and package; accommodates 100–375 guests. Midway between Manhattan and Philadelphia.',
    rating: 4.9,
    reviewCount: 209,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/biz/park-chateau-estate-gardens-east-brunswick/2408530a77f67ef1.html',
    capacity: '100–375 guests',
    style: 'French Château Estate',
    description: 'A magnificent 15-acre French château estate with manicured gardens, a grand ballroom, and a private chapel. Over 30 years of catering excellence. Consistently ranked among New Jersey\'s finest wedding venues with three distinct event spaces: Gardens, Ballroom, and Chapel.',
    imageUrl: 'https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=800',
    badge: 'Couples\' Choice',
  },
  {
    id: 'meadow-brook',
    name: 'Meadow Brook Hall',
    city: 'Rochester',
    state: 'MI',
    address: '350 Estate Dr, Rochester, MI 48309',
    phone: '(248) 364-6200',
    website: 'https://meadowbrookhall.org/venue/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/meadow-brook-hall-rochester/1fb71e18fa9bfa62.html',
    priceLabel: '$20,000 – $43,000',
    priceNote: '$20K Sundays & off-season (Dec–Apr); $43K prime Fri–Sat May–Nov. Includes exclusive estate use.',
    rating: 4.7,
    reviewCount: 104,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/biz/meadow-brook-hall-rochester/1fb71e18fa9bfa62.html',
    capacity: 'Up to 350 guests',
    style: 'Tudor Revival Historic Mansion',
    description: 'A stunning 88,000 sq ft Tudor Revival mansion on the campus of Oakland University. Named one of the Top Wedding Venues by The Knot 2025 Best of Weddings. The estate features spectacular gardens, grand interiors, and in-house catering that draws couples from across the Midwest.',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Meadowbrook_Hall.JPG',
    imageAttribution: 'Wikimedia Commons',
    imageLicense: 'CC BY-SA 3.0',
  },
  {
    id: 'biltmore-estate',
    name: 'Biltmore Estate',
    city: 'Asheville',
    state: 'NC',
    address: '1 Lodge Street, Asheville, NC 28803',
    phone: '(800) 211-9804',
    website: 'https://www.biltmore.com/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/biltmore-estate-asheville/b3d3fe126178b89e.html',
    priceLabel: 'From $10,000',
    priceNote: 'Garden weddings from $10K; Lioncrest Estate from $15K. Includes open bar, dinner, wedding cake, and a two-night stay.',
    rating: 4.6,
    reviewCount: 84,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/biltmore-estate-asheville/b3d3fe126178b89e.html',
    capacity: 'Elopements to 600 guests',
    style: 'Historic Gilded Age Estate',
    description: 'America\'s largest privately owned home — a 8,000-acre National Historic Landmark. Eight distinct wedding venues surrounded by the Blue Ridge Mountains. Couples enjoy exclusive access, Michelin-starred catering, and a two-night stay at The Inn on Biltmore Estate. An iconic once-in-a-lifetime setting.',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Biltmore_Estate_-_front_facade.JPG',
    imageAttribution: 'Wikimedia Commons / Daderot',
    imageLicense: 'Public Domain',
    badge: 'Historic Landmark',
  },
  {
    id: 'vibiana',
    name: 'Vibiana',
    city: 'Los Angeles',
    state: 'CA',
    address: '214 S Main St, Los Angeles, CA 90012',
    phone: '(213) 626-1507',
    website: 'https://www.vibiana.com/events/weddings',
    listingUrl: 'https://www.weddingwire.com/biz/vibiana-los-angeles/e07ad38508e25688.html',
    priceLabel: 'From $51,328',
    priceNote: 'Based on food & beverage minimum; final pricing depends on guest count, menu, and event duration.',
    rating: 4.7,
    reviewCount: 17,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/vibiana-los-angeles/e07ad38508e25688.html',
    capacity: 'Up to 500 guests',
    style: 'Historic Cathedral',
    description: 'A breathtaking 1876 cathedral-turned-event-venue in the heart of Downtown Los Angeles. Operated by award-winning Chef Neal Fraser since 2012. The stunning Romanesque architecture, outdoor evergreen garden, and chef-driven culinary program make Vibiana one of LA\'s most sought-after wedding venues.',
    imageUrl: 'https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=800',
    badge: 'WeddingWire Award Winner',
  },
  {
    id: 'oheka-castle',
    name: 'OHEKA CASTLE',
    city: 'Huntington',
    state: 'NY',
    address: '135 West Gate Dr, Huntington, NY 11743',
    phone: '(631) 659-1402',
    website: 'https://www.oheka.com/weddings.htm',
    listingUrl: 'https://www.weddingwire.com/biz/oheka-castle-huntington/5b6fb73a9bd291a2.html',
    priceLabel: 'From $78,952',
    priceNote: 'Starting price for 50 guests. Saturday weddings require a minimum of 200 guests. Total budgets typically $200K–$385K.',
    rating: 4.6,
    reviewCount: 69,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/biz/oheka-castle-huntington/5b6fb73a9bd291a2.html',
    capacity: '50–300 guests',
    style: 'Gold Coast Castle Estate',
    description: 'Voted #1 Most Unforgettable Wedding Venue by WE TV. The second largest private residence ever built in the US, modeled after the great châteaux of France. Set on 443 manicured acres on Long Island\'s historic Gold Coast. A bucket-list venue for couples who want pure grandeur.',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Oheka_Castle_0818b.JPG',
    imageAttribution: 'Wikimedia Commons / Postdlf',
    imageLicense: 'CC BY-SA 3.0',
    badge: '#1 Most Unforgettable',
  },
  {
    id: 'plaza-hotel',
    name: 'The Plaza Hotel',
    city: 'New York',
    state: 'NY',
    address: '768 5th Ave, New York, NY 10019',
    phone: '(212) 759-3000',
    website: 'https://www.theplazany.com/meetings-and-celebrations/',
    listingUrl: 'https://www.weddingwire.com/biz/the-plaza-new-york-new-york/f81336673961f322.html',
    priceLabel: 'From $167,000',
    priceNote: 'Minimum food & beverage spend $105K–$137.5K plus $15K room rental fee. Requires 200+ guests for peak pricing at $525/person.',
    rating: 4.3,
    reviewCount: 6,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/biz/the-plaza-new-york-new-york/f81336673961f322.html',
    capacity: 'Up to 500 guests',
    style: 'Iconic NYC Luxury Hotel',
    description: 'One of the most iconic wedding venues in the world. The Grand Ballroom at The Plaza — adorned with gilded ceilings and Baccarat crystal chandeliers — has hosted royalty, celebrities, and legendary weddings since 1907. Located at Fifth Avenue and Central Park South in the heart of Manhattan.',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Plaza_Hotel_April_2008.JPG',
    imageAttribution: 'Wikimedia Commons / Manfred Werner',
    imageLicense: 'CC BY-SA 3.0',
    badge: 'NYC Icon',
  },
  {
    id: 'rosewood-mansion',
    name: 'Rosewood Mansion on Turtle Creek',
    city: 'Dallas',
    state: 'TX',
    address: '2821 Turtle Creek Blvd, Dallas, TX 75219',
    phone: '(214) 559-2100',
    website: 'https://www.rosewoodhotels.com/en/mansion-on-turtle-creek-dallas/events/weddings',
    listingUrl: 'https://www.weddingwire.com/biz/rosewood-mansion-on-turtle-creek-dallas/223a8382ef34f8d1.html',
    priceLabel: '~$1,000 per guest',
    priceNote: 'Indoor weddings ~$1,000/guest; outdoor tented events ~$2,500/guest. Food & beverage packages from $10,000.',
    rating: 4.1,
    reviewCount: 13,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/rosewood-mansion-on-turtle-creek-dallas/223a8382ef34f8d1.html',
    capacity: 'Up to 300 guests',
    style: 'Luxury Boutique Hotel',
    description: 'Dallas\'s most prestigious boutique hotel nestled in a private enclave of Uptown. A landmark of understated luxury since 1925, the Mansion\'s ballroom and manicured grounds provide an intimate backdrop for up to 300 guests. Known for world-class culinary excellence and impeccable butler-style service.',
    imageUrl: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'sunstone-villa',
    name: 'Sunstone Villa',
    city: 'Santa Ynez',
    state: 'CA',
    address: '125 N Refugio Rd, Santa Ynez, CA 93460',
    phone: '(805) 688-9463',
    website: 'https://sunstonevilla.com/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/sunstone-winery-villa-santa-ynez/12fc3fd98106e9b1.html',
    priceLabel: 'From $80,000',
    priceNote: 'Intimate 50-guest weddings from $80K+; 100-guest full villa buyout from $185K+. Includes three-night villa stay.',
    rating: 4.8,
    reviewCount: 52,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/biz/sunstone-winery-villa-santa-ynez/12fc3fd98106e9b1.html',
    capacity: 'Up to 150 guests',
    style: 'Provençal Wine Country Villa',
    description: 'A European limestone villa rising from 55 acres of Santa Barbara wine country. Built from stones reclaimed from French châteaux, with wood beams from a 19th-century Avignon lavender factory. Sweeping views of the Santa Ynez Mountains, private vineyard, and exclusive overnight accommodations create a Tuscany-like escape without leaving California.',
    imageUrl: 'https://images.pexels.com/photos/1123773/pexels-photo-1123773.jpeg?auto=compress&cs=tinysrgb&w=800',
    badge: 'Wine Country Gem',
  },
  {
    id: 'ravenswood-mansion',
    name: 'Ravenswood Mansion',
    city: 'Brentwood',
    state: 'TN',
    address: '1825 Wilson Pike, Brentwood, TN 37027',
    phone: '(615) 946-0389',
    website: 'https://www.ravenswoodmansion.com/weddings',
    listingUrl: 'https://www.weddingwire.com/biz/ravenswood-mansion-brentwood/bce4f9e05579c1af.html',
    priceLabel: 'From $2,500',
    priceNote: 'Starting price for 50 guests. The 400-acre property can host up to 300 guests with tenting.',
    rating: 4.9,
    reviewCount: 47,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/biz/ravenswood-mansion-brentwood/bce4f9e05579c1af.html',
    capacity: 'Up to 300 guests',
    style: 'Antebellum Mansion',
    description: 'A stately 1825 Antebellum mansion set on 400 acres just 20 minutes from downtown Nashville. Endless rolling views, historic Southern architecture, and a serene park-like setting make Ravenswood one of Middle Tennessee\'s most beloved wedding venues.',
    imageUrl: 'https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg?auto=compress&cs=tinysrgb&w=800',
    badge: 'Couples\' Choice',
  },
  {
    id: 'prospect-house',
    name: 'Prospect House',
    city: 'Dripping Springs',
    state: 'TX',
    address: '1601 Crumley Ranch Rd, Dripping Springs, TX 78620',
    phone: '(512) 987-5285',
    website: 'https://www.prospecthousetx.com/weddings',
    listingUrl: 'https://www.weddingwire.com/biz/prospect-house-dripping-springs/1e158e77f592852a.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Over 7,000 sq ft of indoor/outdoor space. Main Hall seats up to 220 with a DJ, 180 with a band. Contact for current packages.',
    rating: 4.9,
    reviewCount: 37,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/prospect-house-dripping-springs/1e158e77f592852a.html',
    capacity: 'Up to 220 guests',
    style: 'Modern Hill Country',
    description: 'A sleek, modern wedding venue just 20 miles from downtown Austin in the Texas Hill Country. Striking clean-lined architecture, floor-to-ceiling windows, and sweeping Hill Country views — a favorite for couples who want contemporary elegance over rustic barn.',
    imageUrl: 'https://images.pexels.com/photos/265947/pexels-photo-265947.jpeg?auto=compress&cs=tinysrgb&w=800',
    badge: 'Couples\' Choice',
  },

  // ─── FLORIDA ──────────────────────────────────────────────────────────────
  {
    id: 'the-addison',
    name: 'The Addison',
    city: 'Boca Raton',
    state: 'FL',
    address: '2 E Camino Real, Boca Raton, FL 33432',
    phone: '(561) 372-0568',
    website: 'https://theaddisonofbocaraton.com/event/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/the-addison-boca-raton/249345723a501bc4.html',
    priceLabel: 'Avg. ~$10,000',
    priceNote: 'À la carte pricing; final cost varies by guest count and menu. Built in 1925 by architect Addison Mizner.',
    rating: 4.9,
    reviewCount: 394,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/the-addison-boca-raton/249345723a501bc4.html',
    capacity: 'Up to 400 guests',
    style: 'Historic Mediterranean',
    description: 'A 1925 Addison Mizner landmark in the heart of Boca Raton. The Courtyard\'s century-old banyan trees and cascading fountain create one of South Florida\'s most photographed wedding settings, paired with award-winning cuisine and impeccable service.',
    imageUrl: 'https://images.pexels.com/photos/169190/pexels-photo-169190.jpeg?auto=compress&cs=tinysrgb&w=800',
    badge: 'Couples\' Choice',
  },
  {
    id: 'bella-collina',
    name: 'The Club at Bella Collina',
    city: 'Montverde',
    state: 'FL',
    address: '15920 County Rd 455, Montverde, FL 34756',
    phone: '(407) 469-4911',
    website: 'https://www.bellacollina.com/weddings-events/weddings',
    listingUrl: 'https://www.weddingwire.com/biz/the-club-at-bella-collina-montverde/6c79957bcc853052.html',
    priceLabel: '$35,000 – $70,000',
    priceNote: 'Typical full-wedding spend. Intimate (<50 guest) and summer-season packages available — contact for details.',
    rating: 4.8,
    reviewCount: 232,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/the-club-at-bella-collina-montverde/6c79957bcc853052.html',
    capacity: 'Up to 170 guests',
    style: 'Tuscan Lakeside Estate',
    description: 'An Italian-countryside-inspired estate on 1,900 acres of rolling hills and glittering lakes outside Orlando. Bella Collina\'s grand clubhouse, terraces, and lakeside ceremony sites deliver a transportive Tuscan wedding without leaving Florida.',
    imageUrl: 'https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg?auto=compress&cs=tinysrgb&w=800',
    badge: 'Couples\' Choice',
  },
  {
    id: 'casa-feliz',
    name: 'Casa Feliz',
    city: 'Winter Park',
    state: 'FL',
    address: '656 N Park Ave, Winter Park, FL 32789',
    phone: '(407) 628-0230',
    website: 'http://www.casafelizvenue.com/',
    listingUrl: 'https://www.weddingwire.com/biz/casa-feliz-winter-park/1cab39ba9cac921f.html',
    priceLabel: '$1,600 – $2,975',
    priceNote: 'Rental fee plus tax for ceremony + reception (4 hours of event time). Accommodates up to 120 guests with valet parking.',
    rating: 4.9,
    reviewCount: 129,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/casa-feliz-winter-park/1cab39ba9cac921f.html',
    capacity: 'Up to 120 guests',
    style: 'Historic Spanish Farmhouse',
    description: 'A lovingly restored 1933 Andalusian-style farmhouse museum in the heart of Winter Park. Warm courtyards, terracotta details, and intimate indoor-outdoor spaces make Casa Feliz a beloved — and remarkably affordable — boutique wedding venue near Orlando.',
    imageUrl: 'https://images.pexels.com/photos/2253879/pexels-photo-2253879.jpeg?auto=compress&cs=tinysrgb&w=800',
    badge: 'Couples\' Choice',
  },
  {
    id: 'cruz-building',
    name: 'The Cruz Building',
    city: 'Coconut Grove',
    state: 'FL',
    address: '3157 Commodore Plaza, Coconut Grove, FL 33133',
    phone: '(305) 508-9500',
    website: 'https://cruzbuildings.com/',
    listingUrl: 'https://www.weddingwire.com/biz/the-cruz-building-miami/b125e3887793cacd.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Pricing depends on which of the three floors you rent. Up to 250 seated guests across floors 1 and 2.',
    rating: 4.7,
    reviewCount: 72,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/the-cruz-building-miami/b125e3887793cacd.html',
    capacity: 'Up to 250 guests',
    style: 'European Mansion',
    description: 'A glamorous three-story mansion-style venue in Coconut Grove, Miami. Atrium ceilings, stained-glass windows, marble staircases, gas lanterns, and crystal chandeliers give The Cruz Building an old-world European elegance unlike anywhere else in South Florida.',
    imageUrl: 'https://images.pexels.com/photos/265856/pexels-photo-265856.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'historic-dubsdread',
    name: 'Historic Dubsdread',
    city: 'Orlando',
    state: 'FL',
    address: '549 W Par St, Orlando, FL 32804',
    phone: '(407) 650-9558',
    website: 'https://eventsbydubsdread.com/',
    listingUrl: 'https://www.weddingwire.com/biz/historic-dubsdread/4024035c640d050b.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'All-inclusive packages through Events by Dubsdread catering. Contact for current per-guest pricing.',
    rating: 5.0,
    reviewCount: 189,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/historic-dubsdread/4024035c640d050b.html',
    capacity: 'Up to 250 guests',
    style: 'Historic Ballroom',
    description: 'A 1924 Old Florida ballroom set on a historic golf course in Orlando\'s College Park. Original stone fireplace, hardwood pine floors, and open wood-beam ceilings give it rustic sophistication — and a rare perfect 5.0 rating from couples.',
    imageUrl: 'https://images.pexels.com/photos/2291462/pexels-photo-2291462.jpeg?auto=compress&cs=tinysrgb&w=800',
    badge: 'Perfect 5.0 Rating',
  },
  {
    id: 'the-vinoy',
    name: 'The Vinoy Resort & Golf Club',
    city: 'St. Petersburg',
    state: 'FL',
    address: '501 5th Ave NE, St. Petersburg, FL 33701',
    phone: '(727) 894-1000',
    website: 'https://thevinoy.com/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/the-vinoy-resort-golf-club-autograph-collection/580e559e5fcb6d86.html',
    priceLabel: 'From $1,700',
    priceNote: 'Pricing scales with guest count and package — historic waterfront resort, Marriott Autograph Collection.',
    rating: 4.8,
    reviewCount: 71,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/the-vinoy-resort-golf-club-autograph-collection/580e559e5fcb6d86.html',
    capacity: 'Up to 400 guests',
    style: 'Historic Waterfront Resort',
    description: 'A landmark 1925 Mediterranean Revival resort on the St. Petersburg waterfront. Recently restored to its full glamour as a Marriott Autograph Collection property, The Vinoy offers grand ballrooms, palm-lined terraces, and sweeping views of Tampa Bay.',
    imageUrl: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'powel-crosley',
    name: 'Powel Crosley Estate',
    city: 'Sarasota',
    state: 'FL',
    address: '8374 N Tamiami Trail, Sarasota, FL 34243',
    phone: '(941) 722-3244',
    website: 'https://www.bradentongulfislands.com/venues/powel-crosley/',
    listingUrl: 'https://www.weddingwire.com/biz/crosley-estate-sarasota/e862bd5375b121c0.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Dates released by booking calendar / inquiry. Waterfront Mediterranean Revival mansion; hosts up to 800 guests.',
    rating: 4.8,
    reviewCount: 139,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/crosley-estate-sarasota/e862bd5375b121c0.html',
    capacity: 'Up to 800 guests',
    style: 'Waterfront Mediterranean Estate',
    description: 'A stately 1929 Mediterranean Revival mansion sitting directly on Sarasota Bay. The Powel Crosley Estate pairs Old-Florida grandeur with sunset water views, making it one of the Gulf Coast\'s most coveted — and spacious — wedding venues.',
    imageUrl: 'https://images.pexels.com/photos/1488315/pexels-photo-1488315.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'the-ringling',
    name: 'The Ringling (Ca\' d\'Zan)',
    city: 'Sarasota',
    state: 'FL',
    address: '5401 Bay Shore Rd, Sarasota, FL 34243',
    phone: '(941) 358-2715',
    website: 'https://www.ringling.org/about-ringling/venue-rentals/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/john-and-mable-ringling-museum-of-art-sarasota/4831115a083bdd44.html',
    priceLabel: 'From $20,000',
    priceNote: 'Courtyard rental from $20K (up to 125 guests); Ca\' d\'Zan terrace $26.4K–$34.8K. Micro-weddings from $2,000.',
    rating: 4.3,
    reviewCount: 22,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/john-and-mable-ringling-museum-of-art-sarasota/4831115a083bdd44.html',
    capacity: 'Up to 400 guests',
    style: 'Gilded-Age Bayfront Estate',
    description: 'A 66-acre bayfront estate home to the opulent Ca\' d\'Zan mansion and the Museum of Art\'s grand courtyard. Built by circus magnate John Ringling, this Venetian-Gothic landmark offers some of Florida\'s most dramatic and historic wedding backdrops.',
    imageUrl: 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'marie-selby',
    name: 'Marie Selby Botanical Gardens',
    city: 'Sarasota',
    state: 'FL',
    address: '1534 Mound St, Sarasota, FL 34236',
    phone: '(941) 366-5731',
    website: 'https://selby.org/dsc/visit-downtown-sarasota-campus/contact-us-weddings-private-events-functions/',
    listingUrl: 'https://www.weddingwire.com/biz/marie-selby-botanical-gardens-sarasota/dc0cc3e279baa55b.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Waterfront garden rental on Sarasota Bay. Contact the events team for current rates and available dates.',
    rating: 4.7,
    reviewCount: 58,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/marie-selby-botanical-gardens-sarasota/dc0cc3e279baa55b.html',
    capacity: 'Up to 200 guests',
    style: 'Bayfront Botanical Garden',
    description: 'A lush 15-acre botanical garden on the shores of Sarasota Bay. Towering banyans, orchid displays, and a breathtaking bayfront backdrop make Selby Gardens a dream for couples wanting a tropical, garden-forward celebration.',
    imageUrl: 'https://images.pexels.com/photos/1408221/pexels-photo-1408221.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'bok-tower',
    name: 'Bok Tower Gardens (Pinewood Estate)',
    city: 'Lake Wales',
    state: 'FL',
    address: '1151 Tower Blvd, Lake Wales, FL 33853',
    phone: '(863) 676-1408',
    website: 'https://boktowergardens.org/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/bok-tower-gardens-lake-wales/a8e6b177aa97662b.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Weddings at the 1930s Pinewood Estate mansion within the gardens. Contact the events coordinator for rates.',
    rating: 4.8,
    reviewCount: 28,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/bok-tower-gardens-lake-wales/a8e6b177aa97662b.html',
    capacity: 'Up to 150 guests',
    style: 'Historic Garden Estate',
    description: 'A 1930s Mediterranean mansion (Pinewood Estate) nestled within the National Historic Landmark Bok Tower Gardens. Storied architecture, citrus groves, and the iconic Singing Tower make this Central Florida hilltop a uniquely romantic setting.',
    imageUrl: 'https://images.pexels.com/photos/1707829/pexels-photo-1707829.jpeg?auto=compress&cs=tinysrgb&w=800',
  },

  // ─── TEXAS ────────────────────────────────────────────────────────────────
  {
    id: 'the-allan-house',
    name: 'The Allan House',
    city: 'Austin',
    state: 'TX',
    address: '1104 San Antonio St, Austin, TX 78701',
    phone: '(512) 478-8653',
    website: 'https://allanhouse.com/',
    listingUrl: 'https://www.weddingwire.com/biz/the-allan-house-austin/6e6f60ff304370ab.html',
    priceLabel: '$1,800 – $6,200',
    priceNote: 'Rental fee for ceremony + reception (8 hours of event time); varies by season and day of week.',
    rating: 4.8,
    reviewCount: 74,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/the-allan-house-austin/6e6f60ff304370ab.html',
    capacity: 'Up to 200 guests',
    style: 'Historic Victorian Mansion',
    description: 'An 1883 Victorian mansion in the heart of downtown Austin, blending original architecture with charming gardens and elegant function rooms. The Allan House\'s courtyard is a beloved setting for ceremonies and receptions just blocks from the Capitol.',
    imageUrl: 'https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'pecan-springs-ranch',
    name: 'Pecan Springs Ranch',
    city: 'Austin',
    state: 'TX',
    address: '10601 Derecho Dr, Austin, TX 78737',
    phone: '(512) 632-1046',
    website: 'https://pecanspringsranch.com/',
    listingUrl: 'https://www.weddingwire.com/biz/pecan-springs-ranch-austin/58002d3a9fa11693.html',
    priceLabel: 'Inquire for pricing',
    priceNote: '17-acre Hill Country property 10 minutes from downtown Austin. Contact for current packages and dates.',
    rating: 5.0,
    reviewCount: 74,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/pecan-springs-ranch-austin/58002d3a9fa11693.html',
    capacity: 'Up to 250 guests',
    style: 'Hill Country Ranch',
    description: 'A 17-acre Hill Country retreat just 10 minutes from downtown Austin. Pecan and oak trees, fresh springs, lush green grounds year-round (and two resident donkeys) earn Pecan Springs Ranch a rare perfect 5.0 from couples.',
    imageUrl: 'https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg?auto=compress&cs=tinysrgb&w=800',
    badge: 'Perfect 5.0 Rating',
  },
  {
    id: 'bell-tower-34th',
    name: 'The Bell Tower on 34th',
    city: 'Houston',
    state: 'TX',
    address: '901 W 34th St, Houston, TX 77018',
    phone: '(713) 868-2355',
    website: 'https://thebelltoweron34th.com/',
    listingUrl: 'https://www.weddingwire.com/biz/the-bell-tower-on-34th-houston/797599b71062b6f4.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'All-inclusive: venue, award-winning catering, bar, coordination, valet, and security handled in-house.',
    rating: 4.8,
    reviewCount: 185,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/the-bell-tower-on-34th-houston/797599b71062b6f4.html',
    capacity: 'Up to 1,000 guests',
    style: 'Grand Estate Venue',
    description: 'One of Houston\'s most established and elaborate wedding venues, known for orchestrating large celebrations with calm precision. Soaring architecture, manicured grounds, and fully in-house catering and coordination make it a turnkey luxury choice.',
    imageUrl: 'https://images.pexels.com/photos/265947/pexels-photo-265947.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'the-astorian',
    name: 'The Astorian',
    city: 'Houston',
    state: 'TX',
    address: '2500 Summer St, Houston, TX 77007',
    phone: '(832) 460-6695',
    website: 'https://astorianevents.com/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/the-astorian-houston/d79e1c295daca29a.html',
    priceLabel: 'Inquire for pricing',
    priceNote: '1920s-themed banquet hall with rooftop views of downtown Houston. Pet-friendly. Contact for packages.',
    rating: 4.9,
    reviewCount: 42,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/the-astorian-houston/d79e1c295daca29a.html',
    capacity: 'Up to 300 guests',
    style: 'Art Deco Ballroom',
    description: 'A radiant 1920s-themed banquet hall in Houston\'s Sawyer Yards, complete with a rooftop terrace overlooking the downtown skyline. The Astorian pairs Gatsby-era glamour with modern amenities for a striking city wedding.',
    imageUrl: 'https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'brennans-houston',
    name: 'Brennan\'s of Houston',
    city: 'Houston',
    state: 'TX',
    address: '3300 Smith St, Houston, TX 77006',
    phone: '(713) 522-9711',
    website: 'https://www.brennanshouston.com/',
    listingUrl: 'https://www.weddingwire.com/biz/brennans-of-houston-houston/c9e896b498016ead.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Restaurant wedding venue with intimate courtyards and dining rooms. Renowned Texas-Creole cuisine. Contact for menus.',
    rating: 4.9,
    reviewCount: 22,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/brennans-of-houston-houston/c9e896b498016ead.html',
    capacity: 'Up to 200 guests',
    style: 'Historic Restaurant',
    description: 'For over four decades, Brennan\'s has been a Houston icon of genuine Southern hospitality and Texas-Creole cuisine. Intimate courtyards, a wine room, and elegant dining spaces make it a favorite for couples who put the food first.',
    imageUrl: 'https://images.pexels.com/photos/169190/pexels-photo-169190.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'hotel-emma',
    name: 'Hotel Emma',
    city: 'San Antonio',
    state: 'TX',
    address: '136 E Grayson St, San Antonio, TX 78215',
    phone: '(210) 448-8300',
    website: 'https://thehotelemma.com/venues/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/hotel-emma-san-antonio/809eca0e10a518ab.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Luxury boutique hotel at the Pearl on the River Walk; in-house catering, bar, cake, lighting and setup. Contact for packages.',
    rating: 4.8,
    reviewCount: 6,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/hotel-emma-san-antonio/809eca0e10a518ab.html',
    capacity: 'Up to 250 guests',
    style: 'Boutique Historic Hotel',
    description: 'A converted 19th-century brewhouse turned luxury boutique hotel at the Pearl on San Antonio\'s River Walk. Hotel Emma keeps its charming industrial details — exposed brick, soaring ceilings — for one of Texas\'s most stylish urban weddings.',
    imageUrl: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'the-olana',
    name: 'The Olana',
    city: 'Hickory Creek',
    state: 'TX',
    address: '3700 Olana Way, Hickory Creek, TX 75065',
    phone: '(972) 317-7464',
    website: 'https://waltersweddingestates.com/venue/the-olana/',
    listingUrl: 'https://www.weddingwire.com/biz/the-olana/8a3a84622083f129.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'A Walters Wedding Estates property; a 40-acre estate north of Dallas. Contact for all-inclusive package pricing.',
    rating: 4.4,
    reviewCount: 89,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/the-olana-dallas/8a3a84622083f129.html',
    capacity: 'Up to 400 guests',
    style: 'Grand Mansion Estate',
    description: 'A palatial mansion set on a 40-acre estate with a private lake north of Dallas. Sweeping staircases, a grand ballroom, and manicured lakeside grounds give The Olana a fairy-tale, European-palace feel.',
    imageUrl: 'https://images.pexels.com/photos/1488315/pexels-photo-1488315.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'marie-gabrielle',
    name: 'Marie Gabrielle Restaurant & Gardens',
    city: 'Dallas',
    state: 'TX',
    address: '1116 N Riverfront Blvd, Dallas, TX 75207',
    phone: '(214) 965-1412',
    website: 'https://www.marie-gabrielle.com/weddings-and-celebrations/',
    listingUrl: 'https://www.weddingwire.com/biz/marie-gabrielle-restaurant-and-gardens-dallas/9f52fdae5d297b0f.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Full-service indoor/outdoor garden venue with in-house catering. Contact for current per-guest pricing.',
    rating: 4.7,
    reviewCount: 30,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/marie-gabrielle-restaurant-and-gardens-dallas/9f52fdae5d297b0f.html',
    capacity: 'Up to 400 guests',
    style: 'Garden Restaurant',
    description: 'A lush garden oasis in Dallas\'s Design District, with meticulously manicured grounds, mature oaks, and a serene reflecting pond. Marie Gabrielle pairs a breathtaking outdoor setting with acclaimed full-service cuisine.',
    imageUrl: 'https://images.pexels.com/photos/1408221/pexels-photo-1408221.jpeg?auto=compress&cs=tinysrgb&w=800',
  },

  // ─── CALIFORNIA ───────────────────────────────────────────────────────────
  {
    id: 'auberge-du-soleil',
    name: 'Auberge du Soleil',
    city: 'Rutherford',
    state: 'CA',
    address: '180 Rutherford Hill Rd, Rutherford, CA 94573',
    phone: '(707) 963-1211',
    website: 'https://auberge.com/auberge-du-soleil/events/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/auberge-du-soleil-rutherford/f56444817fdf9f7a.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Michelin-starred luxury resort on a 33-acre olive grove. Contact for food & beverage minimums and site fees.',
    rating: 4.9,
    reviewCount: 36,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/auberge-du-soleil-rutherford/f56444817fdf9f7a.html',
    capacity: 'Up to 220 guests',
    style: 'Luxury Wine Country Resort',
    description: 'Napa Valley\'s most iconic luxury resort, perched on a sunlit 33-acre olive grove on the slopes of Rutherford Hill. A Michelin-starred culinary program, breathtaking valley views, and refined Mediterranean architecture make Auberge du Soleil a bucket-list wine country wedding.',
    imageUrl: 'https://images.pexels.com/photos/1123773/pexels-photo-1123773.jpeg?auto=compress&cs=tinysrgb&w=800',
    badge: 'Wine Country Icon',
  },
  {
    id: 'the-ebell-la',
    name: 'The Ebell of Los Angeles',
    city: 'Los Angeles',
    state: 'CA',
    address: '741 S Lucerne Blvd, Los Angeles, CA 90005',
    phone: '(323) 931-1277',
    website: 'https://ebellevents.com/',
    listingUrl: 'https://www.weddingwire.com/biz/the-ebell-of-los-angeles-los-angeles/ce0e102025d0a19c.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Historic 1927 landmark with grand ballroom, theatre, and courtyards. Contact for packages and dates.',
    rating: 5.0,
    reviewCount: 68,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/the-ebell-of-los-angeles-los-angeles/ce0e102025d0a19c.html',
    capacity: 'Up to 1,000 guests',
    style: 'Historic Landmark',
    description: 'A magnificent 1927 Italian Renaissance landmark in the heart of Los Angeles. Soaring ballrooms, a grand theatre, and Spanish-tiled courtyards give The Ebell timeless old-Hollywood glamour — and a perfect 5.0 rating from couples.',
    imageUrl: 'https://images.pexels.com/photos/265856/pexels-photo-265856.jpeg?auto=compress&cs=tinysrgb&w=800',
    badge: 'Perfect 5.0 Rating',
  },
  {
    id: 'bel-air-bay-club',
    name: 'Bel-Air Bay Club',
    city: 'Pacific Palisades',
    state: 'CA',
    address: '16801 Pacific Coast Hwy, Pacific Palisades, CA 90272',
    phone: '(310) 230-4700',
    website: 'https://www.belairbayclub.com/weddings',
    listingUrl: 'https://www.weddingwire.com/biz/bel-air-bay-club-pacific-palisades/5c831215eab689b1.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Clifftop oceanfront club between Santa Monica and Malibu. Contact for packages and food & beverage minimums.',
    rating: 4.9,
    reviewCount: 77,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/bel-air-bay-club-pacific-palisades/5c831215eab689b1.html',
    capacity: 'Up to 300 guests',
    style: 'Oceanfront Club',
    description: 'A storied 1920s clifftop club overlooking the Pacific between Santa Monica and Malibu. Terraced lawns, ocean-view ceremony sites, and Mediterranean architecture make Bel-Air Bay Club one of the most coveted coastal wedding venues in LA.',
    imageUrl: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'calamigos-ranch',
    name: 'Calamigos Ranch',
    city: 'Malibu',
    state: 'CA',
    address: '327 Latigo Canyon Rd, Malibu, CA 90265',
    phone: '(818) 889-6280',
    website: 'https://www.calamigosevents.com/weddings',
    listingUrl: 'https://www.weddingwire.com/biz/calamigos-ranch-in-malibu-malibu/414b87d9dfe3ac75.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Multiple ceremony sites across a 200-acre canyon ranch with in-house catering. Contact for package pricing.',
    rating: 4.3,
    reviewCount: 181,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/calamigos-ranch-in-malibu-malibu/414b87d9dfe3ac75.html',
    capacity: 'Up to 500 guests',
    style: 'Canyon Ranch',
    description: 'A lush 200-acre ranch tucked in the Santa Monica Mountains above Malibu. Waterfalls, oak groves, lakeside lawns, and multiple distinct ceremony settings make Calamigos one of Southern California\'s most beloved indoor-outdoor wedding destinations.',
    imageUrl: 'https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'pelican-hill',
    name: 'The Resort at Pelican Hill',
    city: 'Newport Coast',
    state: 'CA',
    address: '22701 Pelican Hill Rd S, Newport Coast, CA 92657',
    phone: '(949) 467-6817',
    website: 'https://pelicanhill.com/meetings/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/the-resort-at-pelican-hill-newport-coast/dce486f4f4c3c852.html',
    priceLabel: 'From ~$86,700',
    priceNote: 'Minimum event spend ~$86,738 (incl. service & tax): F&B minimum from $50K + site fee from $15K.',
    rating: 4.4,
    reviewCount: 8,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/the-resort-at-pelican-hill-newport-coast/dce486f4f4c3c852.html',
    capacity: 'Up to 400 guests',
    style: 'Oceanfront Italian Resort',
    description: 'A AAA Five-Diamond oceanfront resort inspired by the villas of Andrea Palladio, set above three miles of Newport Coast coastline. Italian architecture, a circular colonnade ceremony site, and sweeping Pacific views define this ultra-luxury wedding venue.',
    imageUrl: 'https://images.pexels.com/photos/2291462/pexels-photo-2291462.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'hotel-del-coronado',
    name: 'Hotel del Coronado',
    city: 'Coronado',
    state: 'CA',
    address: '1500 Orange Ave, Coronado, CA 92118',
    phone: '(619) 435-6611',
    website: 'https://www.hoteldel.com/gather/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/hotel-del-coronado-coronado/f1e6b3d84d603c1d.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'National Historic Landmark beach resort on 28 oceanfront acres. Contact for beachfront and ballroom packages.',
    rating: 4.2,
    reviewCount: 32,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/hotel-del-coronado-coronado/f1e6b3d84d603c1d.html',
    capacity: 'Up to 600 guests',
    style: 'Historic Beach Resort',
    description: 'San Diego\'s crown jewel — a Victorian beachfront landmark since 1888, commanding 28 oceanfront acres on Coronado Island. Iconic red turrets, white-sand beach ceremonies, and a century of romance make "The Del" an unmistakable California wedding.',
    imageUrl: 'https://images.pexels.com/photos/1488315/pexels-photo-1488315.jpeg?auto=compress&cs=tinysrgb&w=800',
    badge: 'Historic Landmark',
  },
  {
    id: 'nestldown',
    name: 'Nestldown',
    city: 'Los Gatos',
    state: 'CA',
    address: '22420 Old Santa Cruz Hwy, Los Gatos, CA 95033',
    phone: '(408) 353-5311',
    website: 'https://www.nestldown.com/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/nestldown-los-gatos/971a46a7049ac752.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Private redwood estate minutes from Silicon Valley. Contact for available dates and package pricing.',
    rating: 4.3,
    reviewCount: 65,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/nestldown-los-gatos/971a46a7049ac752.html',
    capacity: 'Up to 250 guests',
    style: 'Redwood Forest Estate',
    description: 'An enchanting private estate nestled in the redwoods above Los Gatos, just minutes from Silicon Valley. Towering trees, landscaped gardens, a charming chapel, and even a miniature steam train make Nestldown a storybook forest wedding setting.',
    imageUrl: 'https://images.pexels.com/photos/1707829/pexels-photo-1707829.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'kohl-mansion',
    name: 'Kohl Mansion',
    city: 'Burlingame',
    state: 'CA',
    address: '2750 Adeline Dr, Burlingame, CA 94010',
    phone: '(650) 762-1134',
    website: 'https://kohlmansion.com/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/kohl-mansion-burlingame/ab233302a812c781.html',
    priceLabel: 'Inquire for pricing',
    priceNote: '1914 National Historic Landmark mansion on the Peninsula. Contact for rental rates and catering options.',
    rating: 4.3,
    reviewCount: 14,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/kohl-mansion-burlingame/ab233302a812c781.html',
    capacity: 'Up to 240 guests',
    style: 'Historic Tudor Mansion',
    description: 'A stately 1914 Brick Tudor mansion — "The Oaks" — set on 40 wooded acres on the San Francisco Peninsula. A National Historic Landmark, Kohl Mansion offers grand interiors, a great lawn, and old-world elegance midway between SF and Silicon Valley.',
    imageUrl: 'https://images.pexels.com/photos/169190/pexels-photo-169190.jpeg?auto=compress&cs=tinysrgb&w=800',
  },

  // ─── NEW YORK ─────────────────────────────────────────────────────────────
  {
    id: 'the-garrison',
    name: 'The Garrison',
    city: 'Garrison',
    state: 'NY',
    address: '2015 US-9, Garrison, NY 10524',
    phone: '(845) 424-3604',
    website: 'https://thegarrison.com/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/the-garrison-garrison/e7fd5a4a3ecae17b.html',
    priceLabel: 'Inquire for pricing',
    priceNote: '300-acre Hudson Highlands estate an hour north of Manhattan, with on-site inn lodging. Contact for packages.',
    rating: 4.9,
    reviewCount: 186,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/the-garrison-garrison/e7fd5a4a3ecae17b.html',
    capacity: 'Up to 200 guests',
    style: 'Hudson Valley Estate',
    description: 'A strikingly modern venue set on 300 acres in the Hudson Highlands, an hour north of Manhattan. Floor-to-ceiling windows frame dramatic mountain-and-river views, with seasonal farm-to-table cuisine and an on-site inn for the wedding party.',
    imageUrl: 'https://images.pexels.com/photos/1707829/pexels-photo-1707829.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'liberty-warehouse',
    name: 'Liberty Warehouse',
    city: 'Brooklyn',
    state: 'NY',
    address: '260 Conover St, Brooklyn, NY 11231',
    phone: '(347) 987-3121',
    website: 'https://thelibertywarehouse.com/',
    listingUrl: 'https://www.weddingwire.com/biz/liberty-warehouse-brooklyn/22b69743eb297e40.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Waterfront pre-Civil War warehouse on Pier 41 with Statue of Liberty views and on-site catering. Contact for packages.',
    rating: 4.9,
    reviewCount: 98,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/liberty-warehouse-brooklyn/22b69743eb297e40.html',
    capacity: 'Up to 400 guests',
    style: 'Waterfront Warehouse',
    description: 'A beautifully restored 1850s warehouse on Pier 41 in Red Hook, Brooklyn, with sweeping harbor views of the Statue of Liberty. Exposed brick, soaring windows, and a waterfront lawn make it one of NYC\'s most atmospheric industrial-chic venues.',
    imageUrl: 'https://images.pexels.com/photos/265947/pexels-photo-265947.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'gotham-hall',
    name: 'Gotham Hall',
    city: 'New York',
    state: 'NY',
    address: '1356 Broadway, New York, NY 10018',
    phone: '(212) 244-4300',
    website: 'https://www.gothamhallevents.com/',
    listingUrl: 'https://www.weddingwire.com/biz/gotham-hall-new-york/ec0e71e07052440c.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'A landmark former bank with a 70-ft stained-glass domed ceiling in Midtown Manhattan. Contact for packages.',
    rating: 4.8,
    reviewCount: 19,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/gotham-hall-new-york/ec0e71e07052440c.html',
    capacity: 'Up to 450 guests',
    style: 'Grand Banking Hall',
    description: 'A breathtaking 1924 former bank in Midtown Manhattan, crowned by a 70-foot stained-glass domed ceiling. Gotham Hall\'s soaring Beaux-Arts grandeur and a single column-free ballroom create one of New York City\'s most dramatic wedding settings.',
    imageUrl: 'https://images.pexels.com/photos/265856/pexels-photo-265856.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'tribeca-rooftop',
    name: 'Tribeca Rooftop',
    city: 'New York',
    state: 'NY',
    address: '2 Desbrosses St, New York, NY 10013',
    phone: '(212) 625-2600',
    website: 'https://tribecarooftopnyc.com/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/tribeca-rooftop-new-york/436de9cdd705a37a.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Penthouse venue with a wraparound terrace and skylit ballroom; up to 325 seated. Contact for packages.',
    rating: 4.9,
    reviewCount: 61,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/tribeca-rooftop-new-york/436de9cdd705a37a.html',
    capacity: 'Up to 325 guests',
    style: 'Rooftop Penthouse',
    description: 'A premier penthouse venue in Lower Manhattan with a wraparound rooftop terrace for cocktails and a skylit ballroom for dinner and dancing. Panoramic skyline and Hudson River views make Tribeca Rooftop a quintessential NYC celebration.',
    imageUrl: 'https://images.pexels.com/photos/2291462/pexels-photo-2291462.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'the-foundry',
    name: 'The Foundry',
    city: 'Long Island City',
    state: 'NY',
    address: '42-38 9th St, Long Island City, NY 11101',
    phone: '(718) 786-7776',
    website: 'https://www.thefoundry.info/',
    listingUrl: 'https://www.weddingwire.com/biz/the-foundry-long-island-city/88ae16823e2327b0.html',
    priceLabel: '$14,500 – $30,000',
    priceNote: 'Raw industrial space with courtyard, rooftop terrace, and greenhouse; up to 180 guests. Bring your own caterer.',
    rating: 4.6,
    reviewCount: 83,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/the-foundry-long-island-city/88ae16823e2327b0.html',
    capacity: 'Up to 180 guests',
    style: 'Industrial Loft',
    description: 'A meticulously restored 19th-century industrial building in Long Island City. Exposed brick, skylights, indoor balconies, a lush courtyard, a greenhouse, and a rooftop with Manhattan skyline views give The Foundry rare romantic-industrial character.',
    imageUrl: 'https://images.pexels.com/photos/169190/pexels-photo-169190.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'tarrytown-house',
    name: 'Tarrytown House Estate',
    city: 'Tarrytown',
    state: 'NY',
    address: '49 E Sunnyside Ln, Tarrytown, NY 10591',
    phone: '(914) 591-8200',
    website: 'https://www.tarrytownweddingvenue.com/',
    listingUrl: 'https://www.weddingwire.com/biz/tarrytown-house-estate/e97d6e6a29c0fac4.html',
    priceLabel: 'From $2,750',
    priceNote: 'Rental fee for ceremony + reception (6 hours). 19th-century Hudson River estate in Westchester County.',
    rating: 4.7,
    reviewCount: 51,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/tarrytown-house-estate/e97d6e6a29c0fac4.html',
    capacity: 'Up to 320 guests',
    style: 'Historic Hudson Estate',
    description: 'A pair of 19th-century mansions on a 26-acre Hudson River estate in Westchester, just minutes from Manhattan. Period architecture, manicured grounds, and river views give Tarrytown House Estate storybook old-money charm.',
    imageUrl: 'https://images.pexels.com/photos/1488315/pexels-photo-1488315.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '501-union',
    name: '501 Union',
    city: 'Brooklyn',
    state: 'NY',
    address: '501 Union St, Brooklyn, NY 11231',
    phone: '(718) 637-1953',
    website: 'https://www.501union.com/',
    listingUrl: 'https://www.weddingwire.com/biz/501-union-brooklyn/cd8a244f4c843ae7.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'A 1916 former car-restoration shop in Gowanus with three distinct spaces. Catering by Union Square Events.',
    rating: 4.7,
    reviewCount: 68,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/501-union-brooklyn/cd8a244f4c843ae7.html',
    capacity: 'Up to 200 guests',
    style: 'Industrial Chic',
    description: 'A stylishly reimagined 1916 building in Gowanus, Brooklyn, with a covered atrium, cocktail lounge, and light-filled reception hall. 501 Union\'s blend of vintage industrial bones and modern polish makes it a top Brooklyn wedding pick.',
    imageUrl: 'https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'garden-city-hotel',
    name: 'The Garden City Hotel',
    city: 'Garden City',
    state: 'NY',
    address: '45 Seventh St, Garden City, NY 11530',
    phone: '(877) 549-0400',
    website: 'https://www.gardencityhotel.com/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/the-garden-city-hotel-garden-city/6a58290cbb606bf8.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Long Island icon since 1874 with a newly renovated Grand Ballroom. Contact for packages and dates.',
    rating: 4.8,
    reviewCount: 29,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/the-garden-city-hotel-garden-city/6a58290cbb606bf8.html',
    capacity: 'Up to 400 guests',
    style: 'Historic Luxury Hotel',
    description: 'Long Island\'s icon of hospitality since 1874, recently celebrating 150 years with a multimillion-dollar renovation of its Grand Ballroom. Multiple elegant event spaces and full-service luxury make The Garden City Hotel a Nassau County favorite.',
    imageUrl: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
  },

  // ─── GEORGIA ──────────────────────────────────────────────────────────────
  {
    id: 'swan-house-ahc',
    name: 'Swan House at Atlanta History Center',
    city: 'Atlanta',
    state: 'GA',
    address: '130 W Paces Ferry Rd NW, Atlanta, GA 30305',
    phone: '(404) 814-4090',
    website: 'https://www.atlantahistorycenter.com/private-events/events-at-swan-house-gardens/',
    listingUrl: 'https://www.weddingwire.com/biz/atlanta-history-center-atlanta/3e792dec188bb8bf.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Ceremonies on the private lawn of the 1928 Swan House mansion with cascading fountains. Contact for packages.',
    rating: 4.8,
    reviewCount: 24,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/atlanta-history-center-atlanta/3e792dec188bb8bf.html',
    capacity: 'Up to 300 guests',
    style: 'Historic Mansion & Gardens',
    description: 'Atlanta\'s most iconic wedding backdrop — the 1928 Swan House mansion at the Atlanta History Center, with its majestic cascading fountains and Boxwood Garden. A timeless, classic Buckhead setting on 33 acres of manicured grounds.',
    imageUrl: 'https://images.pexels.com/photos/1488315/pexels-photo-1488315.jpeg?auto=compress&cs=tinysrgb&w=800',
    badge: 'Atlanta Icon',
  },
  {
    id: 'carl-house',
    name: 'Carl House',
    city: 'Auburn',
    state: 'GA',
    address: '1740 Atlanta Hwy, Auburn, GA 30011',
    phone: '(770) 868-4128',
    website: 'https://carlhouse.com/weddings/',
    listingUrl: 'https://www.weddingwire.com/biz/carl-house-auburn/f4ceffe77ff20025.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'All-inclusive full-service venue with in-house florist and coordination. Up to 250 guests. Contact for packages.',
    rating: 4.8,
    reviewCount: 198,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/carl-house-auburn/f4ceffe77ff20025.html',
    capacity: 'Up to 250 guests',
    style: 'Historic Southern Mansion',
    description: 'A beautifully restored 1903 Southern mansion northeast of Atlanta, complete with a curved grand staircase, wraparound porches, a gazebo, and lush ceremony lawns. Carl House pairs vintage charm with full-service, in-house wedding planning.',
    imageUrl: 'https://images.pexels.com/photos/2253879/pexels-photo-2253879.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'ashton-gardens-atl',
    name: 'Ashton Gardens Atlanta',
    city: 'Sugar Hill',
    state: 'GA',
    address: '260 Peachtree Industrial Blvd, Sugar Hill, GA 30518',
    phone: '(404) 885-8503',
    website: 'https://ashtongardens.com/wedding-venue-in-atlanta-ga/',
    listingUrl: 'https://www.weddingwire.com/biz/ashton-gardens-atlanta-by-walters-wedding-estates/c57b5cde08104f05.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'All-inclusive signature glass chapel + ballroom. A Walters Wedding Estates property. Up to 300 guests.',
    rating: 4.7,
    reviewCount: 387,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/ashton-gardens-atlanta-by-walters-wedding-estates/c57b5cde08104f05.html',
    capacity: 'Up to 300 guests',
    style: 'Glass Chapel & Ballroom',
    description: 'Atlanta\'s premier all-inclusive venue, anchored by a signature glass chapel bathed in natural light and a ballroom with floor-to-ceiling windows and crystal chandeliers. Lush greenery and turnkey planning make Ashton Gardens effortlessly elegant.',
    imageUrl: 'https://images.pexels.com/photos/1408221/pexels-photo-1408221.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'the-estate-atl',
    name: 'The Estate',
    city: 'Atlanta',
    state: 'GA',
    address: '3109 Piedmont Rd NE, Atlanta, GA 30305',
    phone: '(404) 869-8858',
    website: 'https://estateatlanta.com/wedding/',
    listingUrl: 'https://www.weddingwire.com/biz/the-estate-atlanta/e213ac2819974d5b.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'A full-service historic mansion in Buckhead managed by Legendary Events. Contact for package pricing.',
    rating: 4.7,
    reviewCount: 17,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/the-estate-atlanta/e213ac2819974d5b.html',
    capacity: 'Up to 400 guests',
    style: 'Historic Mansion',
    description: 'A secluded, stately mansion tucked in the heart of Atlanta\'s Buckhead. Grand columns, a sweeping staircase, and manicured grounds give The Estate Southern grandeur, with full-service planning by acclaimed Legendary Events.',
    imageUrl: 'https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'summerour-studio',
    name: 'Summerour Studio',
    city: 'Atlanta',
    state: 'GA',
    address: '409 Bishop St NW, Atlanta, GA 30318',
    phone: '(404) 962-8708',
    website: 'https://novareevents.com/venues/summerour-studio/',
    listingUrl: 'https://www.weddingwire.com/biz/summerour-studio-atlanta/c790188624690bfc.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Refurbished Westside warehouse with floor-to-ceiling windows and a skyline-view terrace. Contact for packages.',
    rating: 4.9,
    reviewCount: 41,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/summerour-studio-atlanta/c790188624690bfc.html',
    capacity: 'Up to 300 guests',
    style: 'Industrial Loft',
    description: 'An expansive refurbished warehouse on Atlanta\'s buzzing Westside, with two stories of floor-to-ceiling windows and a rooftop terrace overlooking the skyline. Summerour pairs airy industrial character with modern polish.',
    imageUrl: 'https://images.pexels.com/photos/265856/pexels-photo-265856.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'biltmore-ballrooms',
    name: 'The Biltmore Ballrooms',
    city: 'Atlanta',
    state: 'GA',
    address: '817 W Peachtree St NW, Atlanta, GA 30308',
    phone: '(404) 962-8700',
    website: 'https://novareevents.com/venues/the-biltmore-ballrooms/',
    listingUrl: 'https://www.weddingwire.com/biz/the-biltmore-ballrooms-atlanta/fa850fc09c469be8.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Two ornate 1924 ballrooms — The Georgian and The Imperial — in Midtown Atlanta. Contact for packages.',
    rating: 4.8,
    reviewCount: 60,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/the-biltmore-ballrooms-atlanta/fa850fc09c469be8.html',
    capacity: 'Up to 500 guests',
    style: 'Historic Ballrooms',
    description: 'Two opulent ballrooms inside the landmark 1924 Biltmore Hotel in Midtown Atlanta, designed by the firm behind New York\'s Waldorf-Astoria. Soaring ceilings, ornate plasterwork, and old-world glamour make these among the city\'s grandest venues.',
    imageUrl: 'https://images.pexels.com/photos/265947/pexels-photo-265947.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'foxhall-resort',
    name: 'Foxhall Resort',
    city: 'Douglasville',
    state: 'GA',
    address: '8000 Capps Ferry Rd, Douglasville, GA 30135',
    phone: '(770) 489-4380',
    website: 'https://www.foxhallresortweddings.com/',
    listingUrl: 'https://www.weddingwire.com/biz/foxhall-resort-douglasville/c027df18727969e8.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'A sprawling resort 25 minutes from Atlanta with a lodge venue and infinity-edge ceremony lawn. Contact for packages.',
    rating: 4.4,
    reviewCount: 102,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/foxhall-resort-douglasville/c027df18727969e8.html',
    capacity: 'Up to 250 guests',
    style: 'Resort & Sporting Club',
    description: 'A 1,100-acre sporting resort framed by Georgia pines and sweeping panoramas, just 25 minutes from Atlanta. The Legacy Lookout lodge — with vaulted beamed ceilings — and an infinity-edge ceremony lawn make Foxhall feel like a grand mountain escape.',
    imageUrl: 'https://images.pexels.com/photos/1707829/pexels-photo-1707829.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'flint-hill',
    name: 'Flint Hill',
    city: 'Norcross',
    state: 'GA',
    address: '539 S Peachtree St, Norcross, GA 30071',
    phone: '(866) 966-3009',
    website: 'https://www.wedgewoodweddings.com/flinthill',
    listingUrl: 'https://www.weddingwire.com/biz/flint-hill-norcross/d96272d4e8916a6a.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'A Wedgewood Weddings property; historic Norcross mansion with all-inclusive packages. Contact for pricing.',
    rating: 4.6,
    reviewCount: 197,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/flint-hill-norcross/d96272d4e8916a6a.html',
    capacity: 'Up to 300 guests',
    style: 'Historic Mansion',
    description: 'A graceful historic mansion in Norcross blending Southern charm with modern elegance. With manicured gardens, a columned veranda, and all-inclusive Wedgewood Weddings packages, Flint Hill is a stress-free favorite just outside Atlanta.',
    imageUrl: 'https://images.pexels.com/photos/169190/pexels-photo-169190.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'wheeler-house',
    name: 'The Wheeler House',
    city: 'Ball Ground',
    state: 'GA',
    address: '510 Gilmer Ferry Rd, Ball Ground, GA 30107',
    phone: '(770) 402-1686',
    website: 'https://www.thewheelerhouse.net/',
    listingUrl: 'https://www.weddingwire.com/biz/the-wheeler-house-ball-ground/a21b330cfa6b9cc2.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'All-inclusive North Georgia venue with indoor & outdoor spaces and on-site cottages. Contact for packages.',
    rating: 4.8,
    reviewCount: 187,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/the-wheeler-house-ball-ground/a21b330cfa6b9cc2.html',
    capacity: 'Up to 250 guests',
    style: 'Historic Country Estate',
    description: 'A charming historic estate in the North Georgia countryside near the Blue Ridge foothills. The Wheeler House offers indoor and open-air ceremony settings, on-site cottage lodging, and warm all-inclusive service an hour north of Atlanta.',
    imageUrl: 'https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'little-river-farms',
    name: 'Little River Farms',
    city: 'Milton',
    state: 'GA',
    address: '14505 Batesville Rd, Milton, GA 30004',
    phone: '(770) 973-0108',
    website: 'https://www.littleriverfarmsweddings.com/',
    listingUrl: 'https://www.weddingwire.com/biz/little-river-farms-alpharetta/832b535e8450c276.html',
    priceLabel: 'Inquire for pricing',
    priceNote: 'Family-owned 80-acre farm with multiple ceremony sites, a lake, and the Wildflower Barn. Up to 250 guests.',
    rating: 4.9,
    reviewCount: 79,
    ratingSource: 'WeddingWire',
    ratingUrl: 'https://www.weddingwire.com/reviews/little-river-farms-alpharetta/832b535e8450c276.html',
    capacity: 'Up to 250 guests',
    style: 'Farm & Barn',
    description: 'A family-owned 80-acre farm in Milton, less than 30 minutes from downtown Atlanta. Rolling pastures, a lake, a gazebo, and the rustic-chic Wildflower Barn offer multiple picture-perfect ceremony and reception settings.',
    imageUrl: 'https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
]

// ─── Star display ─────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const partial = rating - full
  return (
    <div className="flex items-center gap-[2px]">
      {[0, 1, 2, 3, 4].map(i => {
        const fill = i < full ? 1 : i === full && partial >= 0.5 ? 0.5 : 0
        return (
          <span key={i} className="relative w-3 h-3">
            <Star size={12} className="absolute inset-0 text-white/10" fill="currentColor" />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={12} className="text-gold" fill="currentColor" />
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}

// ─── Venue detail sheet ───────────────────────────────────────────────────────
function VenueSheet({ venue, onClose }: { venue: Venue; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onTouchEnd={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 max-h-[92dvh] bg-lenz-bg rounded-t-[28px] flex flex-col overflow-hidden animate-slide-up">
        {/* Hero image */}
        <div className="relative w-full h-52 shrink-0">
          <img
            src={venue.imageUrl}
            alt={venue.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-lenz-bg via-black/20 to-transparent" />
          {venue.badge && (
            <div className="absolute top-4 left-4 bg-gold/90 text-lenz-bg text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase">
              {venue.badge}
            </div>
          )}
          {venue.imageAttribution && (
            <p className="absolute bottom-2 right-2 text-[9px] text-white/30">
              Photo: {venue.imageAttribution} · {venue.imageLicense}
            </p>
          )}
          <button
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
            onTouchEnd={onClose} onClick={onClose}
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto overscroll-contain pb-10">
          <div className="px-5 pt-4">
            {/* Name + location */}
            <h2 className="text-xl font-bold text-white leading-tight">{venue.name}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin size={12} className="text-gold/80 shrink-0" />
              <p className="text-white/45 text-[13px]">{venue.city}, {venue.state}</p>
            </div>

            {/* Rating row */}
            <div className="flex items-center gap-2 mt-3">
              <Stars rating={venue.rating} />
              <span className="text-gold font-bold text-[13px]">{venue.rating.toFixed(2)}</span>
              <span className="text-white/35 text-xs">({venue.reviewCount.toLocaleString()} reviews)</span>
              <a
                href={venue.ratingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50"
              >
                <span>via {venue.ratingSource}</span>
                <ExternalLink size={9} />
              </a>
            </div>

            {/* Price */}
            <div className="mt-4 bg-lenz-card rounded-2xl p-4 border border-lenz-border">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={14} className="text-gold/70" />
                <span className="text-white font-semibold text-[15px]">{venue.priceLabel}</span>
              </div>
              <p className="text-white/35 text-xs leading-relaxed">{venue.priceNote}</p>
            </div>

            {/* Capacity + style tags */}
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="bg-white/6 border border-lenz-border text-white/50 text-[11px] px-3 py-1 rounded-full">{venue.style}</span>
              <span className="bg-white/6 border border-lenz-border text-white/50 text-[11px] px-3 py-1 rounded-full">{venue.capacity}</span>
            </div>

            {/* Description */}
            <p className="text-white/55 text-[13px] leading-relaxed mt-4">{venue.description}</p>

            {/* Address */}
            <div className="mt-4 flex items-start gap-2">
              <MapPin size={13} className="text-white/30 mt-0.5 shrink-0" />
              <p className="text-white/35 text-xs">{venue.address}</p>
            </div>

            {/* Action buttons */}
            <div className="mt-5 space-y-3">
              {/* Call */}
              <a
                href={`tel:${venue.phone}`}
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-gold text-lenz-bg font-bold text-[15px] active:opacity-80 transition-opacity"
              >
                <Phone size={17} strokeWidth={2.5} />
                <span>Call {venue.phone}</span>
              </a>

              {/* Visit website */}
              <a
                href={venue.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-white/8 border border-lenz-border text-white font-semibold text-[15px] active:opacity-80"
              >
                <ExternalLink size={16} />
                <span>Visit Venue Website</span>
              </a>

              {/* View ratings */}
              <a
                href={venue.listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white/35 text-[13px] active:opacity-70"
              >
                <Award size={13} />
                <span>See all reviews on {venue.ratingSource}</span>
                <ExternalLink size={11} />
              </a>
            </div>

            {/* Legal disclaimer */}
            <p className="mt-6 text-[10px] text-white/18 leading-relaxed text-center">
              Ratings sourced from {venue.ratingSource}. Prices are publicly listed estimates and may change — contact the venue for a current quote. Phone numbers listed are the venue's publicly registered business number.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Venue card ───────────────────────────────────────────────────────────────
function VenueCard({ venue, onTap }: { venue: Venue; onTap: () => void }) {
  return (
    <button
      className="w-full text-left active:scale-[0.98] transition-transform duration-150"
      onClick={onTap}
    >
      <div className="mx-4 mb-4 rounded-3xl overflow-hidden bg-lenz-card border border-lenz-border">
        {/* Image */}
        <div className="relative w-full h-48">
          <img
            src={venue.imageUrl}
            alt={venue.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {venue.badge && (
            <div className="absolute top-3 left-3 bg-gold text-lenz-bg text-[9px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase">
              {venue.badge}
            </div>
          )}
          {venue.imageAttribution && (
            <p className="absolute bottom-1 right-2 text-[8px] text-white/25">
              {venue.imageAttribution} · {venue.imageLicense}
            </p>
          )}
          <div className="absolute bottom-3 left-3">
            <p className="text-white font-bold text-[15px] leading-tight drop-shadow">{venue.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="text-gold/80" />
              <p className="text-white/70 text-[11px]">{venue.city}, {venue.state}</p>
            </div>
          </div>
        </div>

        {/* Info row */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <Stars rating={venue.rating} />
              <span className="text-gold font-bold text-[12px]">{venue.rating.toFixed(2)}</span>
              <span className="text-white/30 text-[11px]">({venue.reviewCount})</span>
              <span className="text-white/20 text-[10px] ml-0.5">· {venue.ratingSource}</span>
            </div>
            {/* Price */}
            <p className="text-white/50 text-[12px] mt-1">{venue.priceLabel}</p>
          </div>
          <ChevronRight size={16} className="text-white/25 shrink-0" />
        </div>
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Weddings() {
  const [, navigate] = useLocation()
  const [selected, setSelected] = useState<Venue | null>(null)
  const [stateFilter, setStateFilter] = useState<string>('All')

  // States that currently have at least one verified venue, sorted by venue count
  const statesWithVenues = Array.from(new Set(VENUES.map(v => v.state)))
    .sort((a, b) =>
      VENUES.filter(v => v.state === b).length - VENUES.filter(v => v.state === a).length ||
      a.localeCompare(b)
    )

  const filtered = stateFilter === 'All'
    ? VENUES
    : VENUES.filter(v => v.state === stateFilter)

  return (
    <div className="min-h-[100dvh] bg-lenz-bg safe-top">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark px-4 pt-4 pb-3 safe-top">
        <div className="flex items-center gap-3">
          <button onTouchEnd={() => navigate('/')} onClick={() => navigate('/')} className="p-2 -ml-1">
            <ArrowLeft size={22} className="text-white/70" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-wide text-white">Wedding Venues</h1>
            <p className="text-[11px] text-white/30 -mt-0.5">Ratings from WeddingWire · The Knot · Zola</p>
          </div>
          <Heart size={18} className="text-gold/60" fill="currentColor" />
        </div>

        {/* State picker */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setStateFilter('All')}
            className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
              stateFilter === 'All'
                ? 'bg-gold text-lenz-bg'
                : 'bg-white/6 border border-lenz-border text-white/40'
            }`}
          >
            All States
          </button>
          {statesWithVenues.map(st => (
            <button
              key={st}
              onClick={() => setStateFilter(st)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                stateFilter === st
                  ? 'bg-gold text-lenz-bg'
                  : 'bg-white/6 border border-lenz-border text-white/40'
              }`}
            >
              {st} · {VENUES.filter(v => v.state === st).length}
            </button>
          ))}
        </div>
      </header>

      {/* Hero banner */}
      <div className="mx-4 mt-4 mb-5 rounded-3xl overflow-hidden relative h-36">
        <img
          src="https://images.pexels.com/photos/2291462/pexels-photo-2291462.jpeg?auto=compress&cs=tinysrgb&w=800"
          alt="Wedding venue"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-5">
          <p className="text-[10px] font-bold tracking-[0.25em] text-gold uppercase mb-1">Curated Collection</p>
          <h2 className="text-white font-bold text-[20px] leading-tight">America's Finest</h2>
          <h2 className="text-white font-bold text-[20px] leading-tight">Wedding Venues</h2>
          <p className="text-white/40 text-[11px] mt-1.5">{VENUES.length} venues · Verified ratings & prices</p>
        </div>
        <p className="absolute bottom-2 right-3 text-[8px] text-white/20">Photo: Pexels (free commercial use)</p>
      </div>

      {/* Sort label */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase">
          {filtered.length} {filtered.length === 1 ? 'venue' : 'venues'}
          {stateFilter !== 'All' ? ` in ${stateFilter}` : ''} · By rating
        </p>
        <p className="text-[10px] text-white/20">Tap for details</p>
      </div>

      {/* Venue list */}
      <div className="pb-28">
        {filtered
          .slice()
          .sort((a, b) => b.rating - a.rating)
          .map(venue => (
            <VenueCard key={venue.id} venue={venue} onTap={() => setSelected(venue)} />
          ))}

        {/* More states coming */}
        <div className="mx-4 mt-1 mb-3 p-4 rounded-2xl bg-gold/5 border border-gold/15 text-center">
          <p className="text-[12px] font-semibold text-gold/90">More venues & states coming soon</p>
          <p className="text-[10px] text-white/30 mt-1 leading-relaxed">
            We're expanding to top-rated venues in all 50 states. Every venue is hand-verified — real ratings, real prices, and a phone number we've confirmed before it goes live.
          </p>
        </div>

        {/* Data sources footer */}
        <div className="mx-4 mt-2 mb-4 p-4 rounded-2xl bg-white/3 border border-lenz-border/50">
          <p className="text-[10px] text-white/25 leading-relaxed text-center">
            Ratings sourced from{' '}
            <a href="https://www.weddingwire.com" target="_blank" rel="noopener noreferrer" className="text-white/40 underline">WeddingWire</a>
            {' '}and{' '}
            <a href="https://www.theknot.com" target="_blank" rel="noopener noreferrer" className="text-white/40 underline">The Knot</a>
            {' '}— publicly available review platforms. Prices are publicly listed estimates. Wikimedia Commons photos used under CC / Public Domain licenses with attribution. Pexels photos free for commercial use under the Pexels License. Phone numbers are publicly registered business numbers.
          </p>
        </div>
      </div>

      {/* Venue detail sheet */}
      {selected && <VenueSheet venue={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
