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
