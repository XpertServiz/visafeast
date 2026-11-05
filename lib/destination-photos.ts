// Destination photos for the country-page slideshows. From Pexels (free to use, credit given), saved on our own site; made by a script, see scripts/ notes.
// Each photo's photographer and Pexels page are shown under the photo and on the About page.
export interface Slide { src: string; alt: string; credit: string; creditUrl: string; photographerUrl: string }
export const DEST: Record<string, Slide[]> = {
  "GB": [
    {
      "src": "/photos/dest/gb-1.webp",
      "alt": "Tower Bridge in London",
      "credit": "AXP Photography",
      "creditUrl": "https://www.pexels.com/photo/tower-bridge-illuminated-at-twilight-in-london-30624873/",
      "photographerUrl": "https://www.pexels.com/@axp-photography-500641970"
    },
    {
      "src": "/photos/dest/gb-2.webp",
      "alt": "Big Ben and the Houses of Parliament, London",
      "credit": "Matheus Bertelli",
      "creditUrl": "https://www.pexels.com/photo/big-ben-and-westminster-palace-under-blue-sky-29253512/",
      "photographerUrl": "https://www.pexels.com/@bertellifotografia"
    },
    {
      "src": "/photos/dest/gb-3.webp",
      "alt": "Edinburgh Castle, Scotland",
      "credit": "Kurt  Dallas",
      "creditUrl": "https://www.pexels.com/photo/edinburgh-castle-illuminated-at-dusk-40321971/",
      "photographerUrl": "https://www.pexels.com/@kurt-dallas-2164957096"
    },
    {
      "src": "/photos/dest/gb-4.webp",
      "alt": "Historic university buildings in Oxford",
      "credit": "Ben Prater",
      "creditUrl": "https://www.pexels.com/photo/historic-oxford-university-building-and-students-40205532/",
      "photographerUrl": "https://www.pexels.com/@benprater"
    }
  ],
  "CA": [
    {
      "src": "/photos/dest/ca-1.webp",
      "alt": "Toronto skyline and the CN Tower",
      "credit": "Jeffrey Eisen",
      "creditUrl": "https://www.pexels.com/photo/city-skyline-across-body-of-water-13420120/",
      "photographerUrl": "https://www.pexels.com/@jeffrey-eisen-1257101"
    },
    {
      "src": "/photos/dest/ca-2.webp",
      "alt": "Lake Louise in Banff National Park",
      "credit": "Ryan Beirne",
      "creditUrl": "https://www.pexels.com/photo/lake-louise-brush-17709342/",
      "photographerUrl": "https://www.pexels.com/@peepsbeirne"
    },
    {
      "src": "/photos/dest/ca-3.webp",
      "alt": "Vancouver skyline",
      "credit": "Raghav Khera",
      "creditUrl": "https://www.pexels.com/photo/bridge-over-river-into-forest-city-and-mountain-in-background-11455843/",
      "photographerUrl": "https://www.pexels.com/@visualsbyrk04"
    },
    {
      "src": "/photos/dest/ca-4.webp",
      "alt": "Niagara Falls",
      "credit": "Ali   Soheil",
      "creditUrl": "https://www.pexels.com/photo/majestic-view-of-niagara-falls-from-canada-35119417/",
      "photographerUrl": "https://www.pexels.com/@ali-soheil-2154370577"
    }
  ],
  "US": [
    {
      "src": "/photos/dest/us-1.webp",
      "alt": "Manhattan skyline, New York",
      "credit": "Denil Dominic",
      "creditUrl": "https://www.pexels.com/photo/one-wtc-in-nyc-18388935/",
      "photographerUrl": "https://www.pexels.com/@denil"
    },
    {
      "src": "/photos/dest/us-2.webp",
      "alt": "Statue of Liberty, New York",
      "credit": "kenneth Mayeden",
      "creditUrl": "https://www.pexels.com/photo/the-statue-of-liberty-28133996/",
      "photographerUrl": "https://www.pexels.com/@kenneth-mayeden-1761442928"
    },
    {
      "src": "/photos/dest/us-3.webp",
      "alt": "Golden Gate Bridge, San Francisco",
      "credit": "Robert So",
      "creditUrl": "https://www.pexels.com/photo/golden-gate-bridge-under-the-blue-sky-12747677/",
      "photographerUrl": "https://www.pexels.com/@robertkso"
    },
    {
      "src": "/photos/dest/us-4.webp",
      "alt": "US Capitol, Washington DC",
      "credit": "ale.studio_17 .",
      "creditUrl": "https://www.pexels.com/photo/tourist-at-united-states-capitol-building-31305641/",
      "photographerUrl": "https://www.pexels.com/@ale-studio_17-1353562258"
    }
  ],
  "AU": [
    {
      "src": "/photos/dest/au-1.webp",
      "alt": "Sydney Opera House and harbour",
      "credit": "Khoi Pham",
      "creditUrl": "https://www.pexels.com/photo/sydney-opera-house-with-harbour-view-33378301/",
      "photographerUrl": "https://www.pexels.com/@khoi-pham-2154248309"
    },
    {
      "src": "/photos/dest/au-2.webp",
      "alt": "Melbourne skyline",
      "credit": "Peter Withiel",
      "creditUrl": "https://www.pexels.com/photo/melbourne-skyline-from-hawthorn-australia-38187104/",
      "photographerUrl": "https://www.pexels.com/@peter-withiel-564889179"
    },
    {
      "src": "/photos/dest/au-3.webp",
      "alt": "Great Barrier Reef, Queensland",
      "credit": "Eclipse Chasers",
      "creditUrl": "https://www.pexels.com/photo/bay-and-river-estuary-on-sea-coast-20613788/",
      "photographerUrl": "https://www.pexels.com/@eclipse-chasers-716719984"
    },
    {
      "src": "/photos/dest/au-4.webp",
      "alt": "Uluru, Northern Territory",
      "credit": "Gu Bra",
      "creditUrl": "https://www.pexels.com/photo/uluru-at-sunrise-in-the-australian-outback-35890005/",
      "photographerUrl": "https://www.pexels.com/@gu-bra-11680150"
    }
  ],
  "NZ": [
    {
      "src": "/photos/dest/nz-1.webp",
      "alt": "Milford Sound, New Zealand",
      "credit": "Richard Pan",
      "creditUrl": "https://www.pexels.com/photo/a-river-between-mountains-5946348/",
      "photographerUrl": "https://www.pexels.com/@richard-pan-5305182"
    },
    {
      "src": "/photos/dest/nz-2.webp",
      "alt": "Auckland skyline and Sky Tower",
      "credit": "Ollie Craig",
      "creditUrl": "https://www.pexels.com/photo/auckland-at-sunset-18201091/",
      "photographerUrl": "https://www.pexels.com/@olliecraig1"
    },
    {
      "src": "/photos/dest/nz-3.webp",
      "alt": "Queenstown and Lake Wakatipu",
      "credit": "Paula Davenport",
      "creditUrl": "https://www.pexels.com/photo/lake-in-mountains-25921112/",
      "photographerUrl": "https://www.pexels.com/@paula-davenport-1372509586"
    },
    {
      "src": "/photos/dest/nz-4.webp",
      "alt": "Lake Tekapo, New Zealand",
      "credit": "Bhima Danniswara",
      "creditUrl": "https://www.pexels.com/photo/charming-evening-view-of-church-at-lake-tekapo-38839020/",
      "photographerUrl": "https://www.pexels.com/@bhima-danniswara-225743"
    }
  ],
  "DE": [
    {
      "src": "/photos/dest/de-1.webp",
      "alt": "Brandenburg Gate, Berlin",
      "credit": "Claudia  Solano",
      "creditUrl": "https://www.pexels.com/photo/brandenburg-gate-in-berlin-iconic-landmark-37120347/",
      "photographerUrl": "https://www.pexels.com/@imagenesclau"
    },
    {
      "src": "/photos/dest/de-2.webp",
      "alt": "Neuschwanstein Castle, Bavaria",
      "credit": "Gildo Cancelli",
      "creditUrl": "https://www.pexels.com/photo/castle-near-forest-11348493/",
      "photographerUrl": "https://www.pexels.com/@mmg-cancelli"
    },
    {
      "src": "/photos/dest/de-3.webp",
      "alt": "Heidelberg old town",
      "credit": "Masood Aslami",
      "creditUrl": "https://www.pexels.com/photo/aerial-view-of-the-old-bridge-in-heidelberg-germany-19429279/",
      "photographerUrl": "https://www.pexels.com/@masoodaslami"
    },
    {
      "src": "/photos/dest/de-4.webp",
      "alt": "Marienplatz, Munich",
      "credit": "Ehsan Haque",
      "creditUrl": "https://www.pexels.com/photo/aerial-view-of-marienplatz-and-new-town-hall-in-munich-30944546/",
      "photographerUrl": "https://www.pexels.com/@itsehsanh"
    }
  ],
  "IT": [
    {
      "src": "/photos/dest/it-1.webp",
      "alt": "The Colosseum, Rome",
      "credit": "Görkem Özdemir",
      "creditUrl": "https://www.pexels.com/photo/the-colosseum-rome-italy-15562413/",
      "photographerUrl": "https://www.pexels.com/@gorkem-ozdemir-455899646"
    },
    {
      "src": "/photos/dest/it-2.webp",
      "alt": "A canal in Venice",
      "credit": "Vladimir Srajber",
      "creditUrl": "https://www.pexels.com/photo/gondolas-navigating-romantic-venice-canal-29487687/",
      "photographerUrl": "https://www.pexels.com/@vladimirsrajber"
    },
    {
      "src": "/photos/dest/it-3.webp",
      "alt": "Florence and its cathedral",
      "credit": "Raffaella Troiano",
      "creditUrl": "https://www.pexels.com/photo/stunning-aerial-view-of-florence-s-duomo-36580484/",
      "photographerUrl": "https://www.pexels.com/@raffaella-troiano-2160144035"
    },
    {
      "src": "/photos/dest/it-4.webp",
      "alt": "The Amalfi Coast, Italy",
      "credit": "Josh Withers",
      "creditUrl": "https://www.pexels.com/photo/aerial-view-of-the-amalfi-coast-campania-italy-26976122/",
      "photographerUrl": "https://www.pexels.com/@hellojoshwithers"
    }
  ],
  "GR": [
    {
      "src": "/photos/dest/gr-1.webp",
      "alt": "The Acropolis, Athens",
      "credit": "Diego F. Parra",
      "creditUrl": "https://www.pexels.com/photo/greek-ancient-temple-15238795/",
      "photographerUrl": "https://www.pexels.com/@diego-f-parra-33199"
    },
    {
      "src": "/photos/dest/gr-2.webp",
      "alt": "Oia, Santorini",
      "credit": "Diego F. Parra",
      "creditUrl": "https://www.pexels.com/photo/church-on-santorinin-in-greece-15532995/",
      "photographerUrl": "https://www.pexels.com/@diego-f-parra-33199"
    },
    {
      "src": "/photos/dest/gr-3.webp",
      "alt": "Athens city view",
      "credit": "Gergely Meszárcsek",
      "creditUrl": "https://www.pexels.com/photo/the-lycabettos-hill-in-athens-greece-5141280/",
      "photographerUrl": "https://www.pexels.com/@geriart"
    },
    {
      "src": "/photos/dest/gr-4.webp",
      "alt": "The White Tower, Thessaloniki",
      "credit": "K",
      "creditUrl": "https://www.pexels.com/photo/aerial-view-of-white-tower-in-thessaloniki-37845027/",
      "photographerUrl": "https://www.pexels.com/@kelly"
    }
  ],
  "AZ": [
    {
      "src": "/photos/dest/az-1.webp",
      "alt": "Flame Towers, Baku",
      "credit": "Zulfugar Karimov",
      "creditUrl": "https://www.pexels.com/photo/modern-architecture-in-baku-with-flame-towers-35418664/",
      "photographerUrl": "https://www.pexels.com/@zulfugarkarimov"
    },
    {
      "src": "/photos/dest/az-2.webp",
      "alt": "The old city of Baku",
      "credit": "Tahir Xəlfəquliyev",
      "creditUrl": "https://www.pexels.com/photo/historic-old-town-street-view-with-architecture-33395618/",
      "photographerUrl": "https://www.pexels.com/@tahir"
    },
    {
      "src": "/photos/dest/az-3.webp",
      "alt": "Baku Boulevard on the Caspian Sea",
      "credit": "Fakhri Baghirov",
      "creditUrl": "https://www.pexels.com/photo/boulevard-on-coast-in-baku-18225062/",
      "photographerUrl": "https://www.pexels.com/@fakhri98"
    },
    {
      "src": "/photos/dest/az-4.webp",
      "alt": "Heydar Aliyev Centre, Baku",
      "credit": "Gül Işık",
      "creditUrl": "https://www.pexels.com/photo/square-near-modern-building-18492592/",
      "photographerUrl": "https://www.pexels.com/@ekrulila"
    }
  ],
  "TH": [
    {
      "src": "/photos/dest/th-1.webp",
      "alt": "Wat Arun, Bangkok",
      "credit": "Tom Lorber",
      "creditUrl": "https://www.pexels.com/photo/detailed-architectural-view-of-wat-arun-bangkok-32024479/",
      "photographerUrl": "https://www.pexels.com/@tmlrbr"
    },
    {
      "src": "/photos/dest/th-2.webp",
      "alt": "The Grand Palace, Bangkok",
      "credit": "Maksim Romashkin",
      "creditUrl": "https://www.pexels.com/photo/grand-palace-in-bangkok-11105014/",
      "photographerUrl": "https://www.pexels.com/@maksim-romashkin"
    },
    {
      "src": "/photos/dest/th-3.webp",
      "alt": "A beach in Phuket",
      "credit": "Kirandeep Singh Walia",
      "creditUrl": "https://www.pexels.com/photo/boats-moored-on-sea-shore-18304882/",
      "photographerUrl": "https://www.pexels.com/@kirandeepsingh"
    },
    {
      "src": "/photos/dest/th-4.webp",
      "alt": "Doi Suthep temple, Chiang Mai",
      "credit": "Gije Cho",
      "creditUrl": "https://www.pexels.com/photo/golden-temple-building-7695084/",
      "photographerUrl": "https://www.pexels.com/@gije"
    }
  ],
  "SG": [
    {
      "src": "/photos/dest/sg-1.webp",
      "alt": "Marina Bay Sands, Singapore",
      "credit": "Soulful Pizza",
      "creditUrl": "https://www.pexels.com/photo/marina-bay-sands-3914755/",
      "photographerUrl": "https://www.pexels.com/@soulful-pizza-2080276"
    },
    {
      "src": "/photos/dest/sg-2.webp",
      "alt": "Gardens by the Bay, Singapore",
      "credit": "Arian Fernandez",
      "creditUrl": "https://www.pexels.com/photo/illuminated-supertree-grove-at-night-in-singapore-37009220/",
      "photographerUrl": "https://www.pexels.com/@troopper84"
    },
    {
      "src": "/photos/dest/sg-3.webp",
      "alt": "Singapore skyline",
      "credit": "Mark Baldovino",
      "creditUrl": "https://www.pexels.com/photo/marina-bay-illuminated-at-night-18662417/",
      "photographerUrl": "https://www.pexels.com/@odlab2"
    },
    {
      "src": "/photos/dest/sg-4.webp",
      "alt": "The Merlion, Singapore",
      "credit": "Timo Volz",
      "creditUrl": "https://www.pexels.com/photo/merlion-park-nightscape-with-marina-bay-sands-30570494/",
      "photographerUrl": "https://www.pexels.com/@timo-volz-837240"
    }
  ],
  "EU": [
    {
      "src": "/photos/dest/eu-1.webp",
      "alt": "The Eiffel Tower, Paris",
      "credit": "Efrem  Efre",
      "creditUrl": "https://www.pexels.com/photo/eiffel-tower-view-through-lush-greenery-in-paris-38523298/",
      "photographerUrl": "https://www.pexels.com/@efrem-efre-2786187"
    },
    {
      "src": "/photos/dest/eu-2.webp",
      "alt": "Sagrada Familia, Barcelona",
      "credit": "Manish Jain",
      "creditUrl": "https://www.pexels.com/photo/33911336/",
      "photographerUrl": "https://www.pexels.com/@manish-jain-1176829519"
    },
    {
      "src": "/photos/dest/eu-3.webp",
      "alt": "Old Town Square, Prague",
      "credit": "Olga Lioncat",
      "creditUrl": "https://www.pexels.com/photo/aged-colorful-buildings-on-square-7245300/",
      "photographerUrl": "https://www.pexels.com/@olgalioncat"
    },
    {
      "src": "/photos/dest/eu-4.webp",
      "alt": "Canal houses in Amsterdam",
      "credit": "Adrien Olichon",
      "creditUrl": "https://www.pexels.com/photo/old-amsterdam-city-houses-on-canal-4237160/",
      "photographerUrl": "https://www.pexels.com/@adrien-olichon-1257089"
    }
  ],
  "EU2": [
    {
      "src": "/photos/dest/eu2-1.webp",
      "alt": "A tram in Lisbon, Portugal",
      "credit": "Junior Diniz PHOTOGRAPHER IN LISBON",
      "creditUrl": "https://www.pexels.com/photo/iconic-yellow-trams-in-graffiti-laden-lisbon-street-33324057/",
      "photographerUrl": "https://www.pexels.com/@junior-diniz-photographer-in-lisbon-2051893"
    },
    {
      "src": "/photos/dest/eu2-2.webp",
      "alt": "Dublin, Ireland",
      "credit": "Jonathan Borba",
      "creditUrl": "https://www.pexels.com/photo/vibrant-temple-bar-street-in-dublin-ireland-33770010/",
      "photographerUrl": "https://www.pexels.com/@jonathanborba"
    },
    {
      "src": "/photos/dest/eu2-3.webp",
      "alt": "Cliffs of Moher, Ireland",
      "credit": "Adrien Olichon",
      "creditUrl": "https://www.pexels.com/photo/stunning-view-of-the-cliffs-of-moher-coastline-34244282/",
      "photographerUrl": "https://www.pexels.com/@adrien-olichon-1257089"
    },
    {
      "src": "/photos/dest/eu2-4.webp",
      "alt": "Rotterdam skyline, Netherlands",
      "credit": "Niels Lam",
      "creditUrl": "https://www.pexels.com/photo/erasmus-bridge-and-rotterdam-skyline-at-dusk-39922835/",
      "photographerUrl": "https://www.pexels.com/@niels-lam-2164567277"
    }
  ],
  "MY": [
    {
      "src": "/photos/dest/my-1.webp",
      "alt": "The Petronas Twin Towers, Kuala Lumpur",
      "credit": "Pixabay",
      "creditUrl": "https://www.pexels.com/photo/petronas-tower-malaysia-433942/",
      "photographerUrl": "https://www.pexels.com/@pixabay"
    },
    {
      "src": "/photos/dest/my-2.webp",
      "alt": "A beach in Langkawi, Malaysia",
      "credit": "Shakil Ahmed",
      "creditUrl": "https://www.pexels.com/photo/aerial-view-of-langkawi-s-lush-coastline-and-marinas-32399927/",
      "photographerUrl": "https://www.pexels.com/@sahmed007"
    },
    {
      "src": "/photos/dest/my-3.webp",
      "alt": "George Town, Penang",
      "credit": "ds rexy",
      "creditUrl": "https://www.pexels.com/photo/colonial-architecture-in-penang-street-view-38205922/",
      "photographerUrl": "https://www.pexels.com/@ds-rexy-2154705051"
    },
    {
      "src": "/photos/dest/my-4.webp",
      "alt": "Batu Caves, near Kuala Lumpur",
      "credit": "Anna Photosmaslom",
      "creditUrl": "https://www.pexels.com/photo/vibrant-batu-caves-temple-with-pigeons-in-kuala-lumpur-38321170/",
      "photographerUrl": "https://www.pexels.com/@anna-photosmaslom-2162548370"
    }
  ],
  "LK": [
    {
      "src": "/photos/dest/lk-1.webp",
      "alt": "Sigiriya rock fortress, Sri Lanka",
      "credit": "Andreas Schnabl",
      "creditUrl": "https://www.pexels.com/photo/forest-under-a-cloudy-sky-3869004/",
      "photographerUrl": "https://www.pexels.com/@andreas-schnabl-1775843"
    },
    {
      "src": "/photos/dest/lk-2.webp",
      "alt": "Galle Fort, Sri Lanka",
      "credit": "Charith Kodagoda",
      "creditUrl": "https://www.pexels.com/photo/buildings-by-a-sea-11116033/",
      "photographerUrl": "https://www.pexels.com/@charithk"
    },
    {
      "src": "/photos/dest/lk-3.webp",
      "alt": "Nine Arch Bridge, Ella, Sri Lanka",
      "credit": "Saleem Akthar",
      "creditUrl": "https://www.pexels.com/photo/people-walking-on-bridge-with-railroad-during-day-595196/",
      "photographerUrl": "https://www.pexels.com/@akthar"
    },
    {
      "src": "/photos/dest/lk-4.webp",
      "alt": "Kandy, Sri Lanka",
      "credit": "Thilina Alagiyawanna",
      "creditUrl": "https://www.pexels.com/photo/temple-of-the-tooth-relic-in-kandy-sri-lanka-40442107/",
      "photographerUrl": "https://www.pexels.com/@thilina-alagiyawanna-3266092"
    }
  ],
  "NL": [
    {
      "src": "/photos/dest/nl-1.webp",
      "alt": "Canal houses in Amsterdam",
      "credit": "Adrien Olichon",
      "creditUrl": "https://www.pexels.com/photo/old-amsterdam-city-houses-on-canal-4237160/",
      "photographerUrl": "https://www.pexels.com/@adrien-olichon-1257089"
    },
    {
      "src": "/photos/dest/nl-2.webp",
      "alt": "Tulip fields, Netherlands",
      "credit": "Vladislovas Sketerskis",
      "creditUrl": "https://www.pexels.com/photo/colorful-spring-bloom-in-scenic-garden-37515648/",
      "photographerUrl": "https://www.pexels.com/@vladislovas-sketerskis-2157863731"
    },
    {
      "src": "/photos/dest/nl-3.webp",
      "alt": "Windmills at Kinderdijk",
      "credit": "Dick Scholten",
      "creditUrl": "https://www.pexels.com/photo/scenic-view-of-historic-dutch-windmills-on-a-river-35400479/",
      "photographerUrl": "https://www.pexels.com/@dick-scholten-420532"
    },
    {
      "src": "/photos/dest/nl-4.webp",
      "alt": "Erasmus Bridge, Rotterdam",
      "credit": "Larry Vink",
      "creditUrl": "https://www.pexels.com/photo/a-city-skyline-at-night-11387333/",
      "photographerUrl": "https://www.pexels.com/@larryvink"
    }
  ],
  "FR": [
    {
      "src": "/photos/dest/fr-1.webp",
      "alt": "The Eiffel Tower, Paris",
      "credit": "Efrem  Efre",
      "creditUrl": "https://www.pexels.com/photo/eiffel-tower-view-through-lush-greenery-in-paris-38523298/",
      "photographerUrl": "https://www.pexels.com/@efrem-efre-2786187"
    },
    {
      "src": "/photos/dest/fr-2.webp",
      "alt": "The Louvre, Paris",
      "credit": "Efrem  Efre",
      "creditUrl": "https://www.pexels.com/photo/people-in-front-of-the-louvre-pyramid-paris-38548927/",
      "photographerUrl": "https://www.pexels.com/@efrem-efre-2786187"
    },
    {
      "src": "/photos/dest/fr-3.webp",
      "alt": "Mont-Saint-Michel, France",
      "credit": "Ryan Klaus",
      "creditUrl": "https://www.pexels.com/photo/majestic-view-of-mont-saint-michel-abbey-33904921/",
      "photographerUrl": "https://www.pexels.com/@ryank"
    },
    {
      "src": "/photos/dest/fr-4.webp",
      "alt": "Nice, French Riviera",
      "credit": "Huy Phan",
      "creditUrl": "https://www.pexels.com/photo/relaxed-urban-scene-on-promenade-des-anglais-28602939/",
      "photographerUrl": "https://www.pexels.com/@huy-phan-316220"
    }
  ],
  "PT": [
    {
      "src": "/photos/dest/pt-1.webp",
      "alt": "A tram in Lisbon",
      "credit": "Junior Diniz PHOTOGRAPHER IN LISBON",
      "creditUrl": "https://www.pexels.com/photo/iconic-yellow-trams-in-graffiti-laden-lisbon-street-33324057/",
      "photographerUrl": "https://www.pexels.com/@junior-diniz-photographer-in-lisbon-2051893"
    },
    {
      "src": "/photos/dest/pt-2.webp",
      "alt": "Porto and the Douro river",
      "credit": "Sonny Vermeer",
      "creditUrl": "https://www.pexels.com/photo/early-morning-view-from-the-douro-river-and-porto-portugal-17847439/",
      "photographerUrl": "https://www.pexels.com/@sonny-vermeer-505472791"
    },
    {
      "src": "/photos/dest/pt-3.webp",
      "alt": "Belem Tower, Lisbon",
      "credit": "Tiago Chaves",
      "creditUrl": "https://www.pexels.com/photo/belem-tower-in-lisbon-against-clear-blue-sky-40242475/",
      "photographerUrl": "https://www.pexels.com/@tiago-chaves-2154478168"
    },
    {
      "src": "/photos/dest/pt-4.webp",
      "alt": "Algarve coast, Portugal",
      "credit": "Valérie Schlott",
      "creditUrl": "https://www.pexels.com/photo/photo-of-beach-under-clear-sky-6553674/",
      "photographerUrl": "https://www.pexels.com/@valerie-schlott-20713245"
    }
  ],
  "AE": [
    {
      "src": "/photos/dest/ae-1.webp",
      "alt": "Burj Khalifa, Dubai",
      "credit": "Maria Charizani",
      "creditUrl": "https://www.pexels.com/photo/photo-of-city-during-night-time-5577693/",
      "photographerUrl": "https://www.pexels.com/@maria-charizani-3542905"
    },
    {
      "src": "/photos/dest/ae-2.webp",
      "alt": "Sheikh Zayed Grand Mosque, Abu Dhabi",
      "credit": "Swiss Atlas",
      "creditUrl": "https://www.pexels.com/photo/columns-of-sheikh-zayed-grand-mosque-16110501/",
      "photographerUrl": "https://www.pexels.com/@swiss-atlas-485481359"
    },
    {
      "src": "/photos/dest/ae-3.webp",
      "alt": "Dubai Marina",
      "credit": "AJ  Ahamad",
      "creditUrl": "https://www.pexels.com/photo/vibrant-dubai-marina-skyline-at-night-30554306/",
      "photographerUrl": "https://www.pexels.com/@aj-ahamad-767001191"
    },
    {
      "src": "/photos/dest/ae-4.webp",
      "alt": "Abu Dhabi skyline",
      "credit": "Kevin Villaruz",
      "creditUrl": "https://www.pexels.com/photo/aerial-view-of-city-buildings-7252277/",
      "photographerUrl": "https://www.pexels.com/@kevinvillaruz"
    }
  ]
};
