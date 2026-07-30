/**
 * A curated starter set of REAL disc golf courses — Combobox's "Large list"
 * demo ( findings, course-correction round).
 *
 * Every entry names a real course at a real place, authored from general
 * disc-golf knowledge (iconic/well-known venues spread across US regions
 * plus a handful of international ones) — no synthetic/fabricated course
 * names. This is intentionally a starter set (a few dozen, not "thousands")
 * rather than padding the count with invented entries; a fuller,
 * externally-sourced list (e.g. a PDGA/UDisc course export) can replace the
 * `COURSES` array below as a drop-in later without touching the page that
 * consumes it — the shape (`name`/`location`) stays the same.
 */

export interface DiscGolfCourse {
	/** The course's real name. */
	name: string;
	/** "City, ST" for US courses, "City, Country" for international ones. */
	location: string;
}

export const COURSES: DiscGolfCourse[] = [
	{ name: 'Maple Hill', location: 'Leicester, MA' },
	{ name: 'DeLaveaga', location: 'Santa Cruz, CA' },
	{ name: 'Winthrop Gold', location: 'Rock Hill, SC' },
	{ name: 'Fox Run Golf Links', location: "Lee's Summit, MO" },
	{ name: 'Northwoods', location: 'East Peoria, IL' },
	{ name: 'Lake Eureka', location: 'Eureka, IL' },
	{ name: 'Krape Park', location: 'Freeport, IL' },
	{ name: 'Cahokia Mounds', location: 'Collinsville, IL' },
	{ name: 'Idlewild', location: 'Burlington, KY' },
	{ name: 'Toboggan', location: 'Emporia, KS' },
	{ name: 'Peter Pan Park', location: 'Emporia, KS' },
	{ name: 'Emporia Country Club', location: 'Emporia, KS' },
	{ name: 'Shawnee Mission Park', location: 'Shawnee, KS' },
	{ name: 'The Preserve at Jones Park', location: 'Pierson, FL' },
	{ name: 'Flip City', location: 'Ormond Beach, FL' },
	{ name: 'Chain of Lakes Park', location: 'Delray Beach, FL' },
	{ name: 'International Disc Golf Center (Old North)', location: 'Appling, GA' },
	{ name: 'Hornets Nest Park', location: 'Charlotte, NC' },
	{ name: 'Bryan Park (Blue)', location: 'Greensboro, NC' },
	{ name: 'Harpeth Hills', location: 'Nashville, TN' },
	{ name: "Warrior's Path State Park", location: 'Kingsport, TN' },
	{ name: 'Milo McIver State Park', location: 'Estacada, OR' },
	{ name: 'Blue Lake Park', location: 'Fairview, OR' },
	{ name: 'Pier Park', location: 'Portland, OR' },
	{ name: 'Alton Baker Park', location: 'Eugene, OR' },
	{ name: 'Blue Ribbon Pines', location: 'Montevideo, MN' },
	{ name: 'Elm Creek Park Reserve', location: 'Maple Grove, MN' },
	{ name: 'Bryant Lake Park', location: 'Eden Prairie, MN' },
	{ name: 'Hyland Hills', location: 'Bloomington, MN' },
	{ name: 'Highland Park', location: 'Saint Paul, MN' },
	{ name: 'Vista del Camino Park', location: 'Scottsdale, AZ' },
	{ name: 'Fountain Hills', location: 'Fountain Hills, AZ' },
	{ name: "Steady Ed's Memorial", location: 'La Mirada, CA' },
	{ name: 'Golden Gate Park', location: 'San Francisco, CA' },
	{ name: 'Elysian Park', location: 'Los Angeles, CA' },
	{ name: 'Hudson Mills Metropark', location: 'Dexter, MI' },
	{ name: 'Iron Hill Park', location: 'Newark, DE' },
	{ name: 'Fort Steuben Park', location: 'Steubenville, OH' },
	{ name: 'Highbanks Metro Park', location: 'Lewis Center, OH' },
	{ name: 'Pyramid Hill Sculpture Park', location: 'Hamilton, OH' },
	{ name: 'Zilker Park', location: 'Austin, TX' },
	{ name: 'Pecan Grove', location: 'San Marcos, TX' },
	{ name: 'Camp Eder', location: 'Fairfield, PA' },
	{ name: 'Nockamixon State Park', location: 'Quakertown, PA' },
	{ name: 'Rocky Point Park', location: 'Warwick, RI' },
	{ name: 'Waveny Park', location: 'New Canaan, CT' },
	{ name: 'E.P. "Tom" Sawyer State Park', location: 'Louisville, KY' },
	{ name: 'Earlywine Park', location: 'Oklahoma City, OK' },
	{ name: 'Bell Slough Wildlife Management Area', location: 'Mayflower, AR' },
	{ name: 'Kessler Mountain Regional Park', location: 'Fayetteville, AR' },
	{ name: 'Fountainhead Regional Park', location: 'Fairfax Station, VA' },
	{ name: 'Marymoor Park', location: 'Redmond, WA' },
	{ name: 'Lake Sammamish State Park', location: 'Issaquah, WA' },
	{ name: 'Järva DiscGolfPark', location: 'Stockholm, Sweden' },
	{ name: 'Alytus Disc Golf Course', location: 'Alytus, Lithuania' },
	{ name: 'Nokia Disc Golf Park', location: 'Nokia, Finland' },
	{ name: 'Beringen DiscGolfPark', location: 'Beringen, Belgium' },
	{ name: 'Kastaniengarten', location: 'Bremervörde, Germany' }
];

/** `name-location`, lowercased and hyphenated — a stable FormOption value. */
export function courseSlug(course: DiscGolfCourse): string {
	return `${course.name}-${course.location}`
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}
