# PASTE-READY — Pass 1: city centroids for `SL-22` (238 schools)

**Copy everything below the line into your research agent. Nothing to set up, no bash to run first — the full list is inline.**

**Why this one is safe to run now:** `SL-22` (the map) is already RULED and LOCKED in `tabs/08-school-list.md` §5. The spec requires coordinates be *"geocoded once, offline, stored in `data/med-schools.json` — never a runtime geocoding call."* **The field was never created.** This is the only outstanding data pass that does not touch `§1`'s ban on shipped admissions numbers.

**When it returns:** paste the JSON back and it gets merged into `med-schools.json` as `lat` / `lng`, with the gazetteer and licence stamped into `meta`.

---

You are producing city-centroid coordinates for a static offline dataset used to place map pins.

**I need the CITY centroid, not the campus building.** The product spec is explicit: *"city centroid is sufficient; nobody needs the building."*

**Source:** a public gazetteer — GeoNames, the US Census Bureau Gazetteer, or an equivalent authority. **Name which one you used, and state its licence and any attribution requirement.** That attribution gets stored with the data.

**Rules:**

1. **Return the `id` exactly as given.** It is the merge key — a changed id breaks the merge silently.
2. **Disambiguate by state.** There is a Columbia in South Carolina and a Columbia in Missouri, an Aurora in Colorado and an Aurora in Illinois. **A wrong centroid puts a pin 800 miles out and nothing downstream will catch it.**
3. **Where the place is a township, borough, CDP, or unincorporated area**, say so in `note` and give the best available centroid.
4. **If you cannot resolve one, return `null` and say why. Do NOT fall back to the state centroid** — a pin floating in the middle of a state is worse than no pin at all, because it looks like real data.
5. **Four decimal places is plenty.** This places a dot on a zoomed-out map; more precision is false precision.
6. **Report every unresolved entry at the end**, with the reason.

**Return ONLY this JSON:**

```json
{
  "retrievedAt": "YYYY-MM-DD",
  "gazetteer": "",
  "licence": "",
  "attributionRequired": "",
  "places": [
    { "id": "", "city": "", "state": "", "lat": null, "lng": null, "confidence": "high | medium | low", "note": "" }
  ],
  "unresolved": []
}
```

**The 238 schools — `id` | city, state:**

- `edward-via-college-of-osteopathic-medicine-auburn-campus` | Auburn, AL
- `university-of-alabama-at-birmingham-marnix-e-heersink-school-of-medicine` | Birmingham, AL
- `alabama-college-of-osteopathic-medicine` | Dothan, AL
- `university-of-south-alabama-frederick-p-whiddon-college-of-medicine` | Mobile, AL
- `alice-l-walton-school-of-medicine` | Bentonville, AR
- `arkansas-college-of-osteopathic-medicine` | Fort Smith, AR
- `university-of-arkansas-for-medical-sciences-college-of-medicine` | Little Rock, AR
- `new-york-institute-of-technology-college-of-osteopathic-medicine-at-arkansas-state` | State University, AR
- `arizona-college-of-osteopathic-medicine-of-midwestern-university` | Glendale, AZ
- `a-t-still-university-school-of-osteopathic-medicine-in-arizona` | Mesa, AZ
- `arizona-state-university-john-shufeldt-school-of-medicine-and-medical-engineering` | Phoenix, AZ
- `the-valley-college-of-osteopathic-medicine` | Phoenix, AZ
- `university-of-arizona-college-of-medicine-phoenix` | Phoenix, AZ
- `university-of-arizona-college-of-medicine-tucson` | Tucson, AZ
- `california-health-sciences-university-college-of-osteopathic-medicine` | Clovis, CA
- `california-university-of-science-and-medicine` | Colton, CA
- `university-of-california-davis-school-of-medicine` | Davis, CA
- `california-northstate-university-college-of-medicine` | Elk Grove, CA
- `university-of-california-irvine-school-of-medicine` | Irvine, CA
- `loma-linda-university-school-of-medicine` | Loma Linda, CA
- `charles-r-drew-university-of-medicine-and-science-college-of-medicine` | Los Angeles, CA
- `keck-school-of-medicine-of-the-university-of-southern-california` | Los Angeles, CA
- `university-of-california-los-angeles-david-geffen-school-of-medicine` | Los Angeles, CA
- `stanford-university-school-of-medicine` | Palo Alto, CA
- `kaiser-permanente-bernard-j-tyson-school-of-medicine` | Pasadena, CA
- `western-university-of-health-sciences-college-of-osteopathic-medicine-of-the-pacific` | Pomona, CA
- `university-of-california-riverside-school-of-medicine` | Riverside, CA
- `university-of-california-san-diego-school-of-medicine` | San Diego, CA
- `university-of-california-san-francisco-school-of-medicine` | San Francisco, CA
- `touro-university-california-college-of-osteopathic-medicine` | Vallejo, CA
- `university-of-colorado-school-of-medicine` | Denver, CO
- `university-of-northern-colorado-college-of-osteopathic-medicine` | Greeley, CO
- `rocky-vista-university-college-of-osteopathic-medicine` | Parker, CO
- `university-of-connecticut-school-of-medicine` | Farmington, CT
- `yale-school-of-medicine` | New Haven, CT
- `frank-h-netter-md-school-of-medicine-at-quinnipiac-university` | North Haven, CT
- `george-washington-university-school-of-medicine-and-health-sciences` | Washington, DC
- `georgetown-university-school-of-medicine` | Washington, DC
- `howard-university-college-of-medicine` | Washington, DC
- `charles-e-schmidt-college-of-medicine-at-florida-atlantic-university` | Boca Raton, FL
- `lake-erie-college-of-osteopathic-medicine-bradenton` | Bradenton, FL
- `nova-southeastern-university-dr-kiran-c-patel-college-of-osteopathic-medicine-clearwater` | Clearwater, FL
- `nova-southeastern-university-dr-kiran-c-patel-college-of-allopathic-medicine` | Fort Lauderdale, FL
- `nova-southeastern-university-dr-kiran-c-patel-college-of-osteopathic-medicine` | Fort Lauderdale, FL
- `university-of-florida-college-of-medicine` | Gainesville, FL
- `lake-erie-college-of-osteopathic-medicine-at-jacksonville-university` | Jacksonville, FL
- `burrell-college-of-osteopathic-medicine-florida` | Melbourne, FL
- `florida-international-university-herbert-wertheim-college-of-medicine` | Miami, FL
- `university-of-miami-leonard-m-miller-school-of-medicine` | Miami, FL
- `lincoln-memorial-university-debusk-college-of-osteopathic-medicine-at-orange-park` | Orange Park, FL
- `university-of-central-florida-college-of-medicine` | Orlando, FL
- `florida-state-university-college-of-medicine` | Tallahassee, FL
- `university-of-south-florida-health-morsani-college-of-medicine` | Tampa, FL
- `orlando-college-of-osteopathic-medicine` | Winter Garden, FL
- `university-of-georgia-school-of-medicine` | Athens, GA
- `emory-university-school-of-medicine` | Atlanta, GA
- `morehouse-school-of-medicine` | Atlanta, GA
- `medical-college-of-georgia-at-augusta-university` | Augusta, GA
- `mercer-university-school-of-medicine` | Macon, GA
- `philadelphia-college-of-osteopathic-medicine-south-georgia` | Moultrie, GA
- `philadelphia-college-of-osteopathic-medicine-georgia` | Suwanee, GA
- `university-of-hawaii-john-a-burns-school-of-medicine` | Honolulu, HI
- `des-moines-university-college-of-osteopathic-medicine` | Des Moines, IA
- `university-of-iowa-roy-j-and-lucille-a-carver-college-of-medicine` | Iowa City, IA
- `idaho-college-of-osteopathic-medicine` | Meridian, ID
- `illinois-college-of-osteopathic-medicine` | Chicago, IL
- `northwestern-university-feinberg-school-of-medicine` | Chicago, IL
- `rush-medical-college-of-rush-university-medical-center` | Chicago, IL
- `university-of-chicago-pritzker-school-of-medicine` | Chicago, IL
- `university-of-illinois-college-of-medicine` | Chicago, IL
- `chicago-college-of-osteopathic-medicine-of-midwestern-university` | Downers Grove, IL
- `loyola-university-chicago-stritch-school-of-medicine` | Maywood, IL
- `chicago-medical-school-at-rosalind-franklin-university` | North Chicago, IL
- `southern-illinois-university-school-of-medicine` | Springfield, IL
- `carle-illinois-college-of-medicine` | Urbana-Champaign, IL
- `indiana-university-school-of-medicine` | Indianapolis, IN
- `marian-university-tom-and-julie-wood-college-of-osteopathic-medicine` | Indianapolis, IN
- `university-of-kansas-school-of-medicine` | Kansas City, KS
- `kansas-college-of-osteopathic-medicine` | Wichita, KS
- `university-of-kentucky-college-of-medicine` | Lexington, KY
- `university-of-louisville-school-of-medicine` | Louisville, KY
- `university-of-pikeville-kentucky-college-of-osteopathic-medicine` | Pikeville, KY
- `edward-via-college-of-osteopathic-medicine-louisiana-campus` | Monroe, LA
- `louisiana-state-university-school-of-medicine-in-new-orleans` | New Orleans, LA
- `tulane-university-school-of-medicine` | New Orleans, LA
- `louisiana-state-university-school-of-medicine-in-shreveport` | Shreveport, LA
- `boston-university-aram-v-chobanian-edward-avedisian-school-of-medicine` | Boston, MA
- `harvard-medical-school` | Boston, MA
- `tufts-university-school-of-medicine` | Boston, MA
- `university-of-massachusetts-t-h-chan-school-of-medicine` | Worcester, MA
- `johns-hopkins-university-school-of-medicine` | Baltimore, MD
- `university-of-maryland-school-of-medicine` | Baltimore, MD
- `uniformed-services-university-of-the-health-sciences-f-edward-hebert-school-of-medicine` | Bethesda, MD
- `meritus-school-of-osteopathic-medicine` | Hagerstown, MD
- `university-of-new-england-college-of-osteopathic-medicine` | Biddeford, ME
- `university-of-michigan-medical-school` | Ann Arbor, MI
- `michigan-state-university-college-of-osteopathic-medicine-clinton-township` | Clinton Township, MI
- `michigan-state-university-college-of-osteopathic-medicine-detroit` | Detroit, MI
- `wayne-state-university-school-of-medicine` | Detroit, MI
- `michigan-state-university-college-of-human-medicine` | East Lansing, MI
- `michigan-state-university-college-of-osteopathic-medicine` | East Lansing, MI
- `western-michigan-university-homer-stryker-m-d-school-of-medicine` | Kalamazoo, MI
- `central-michigan-university-college-of-medicine` | Mount Pleasant, MI
- `oakland-university-william-beaumont-school-of-medicine` | Rochester, MI
- `university-of-minnesota-medical-school` | Minneapolis, MN
- `mayo-clinic-alix-school-of-medicine` | Rochester, MN
- `university-of-missouri-columbia-school-of-medicine` | Columbia, MO
- `kansas-city-university-college-of-osteopathic-medicine-joplin` | Joplin, MO
- `kansas-city-university-college-of-osteopathic-medicine` | Kansas City, MO
- `university-of-missouri-kansas-city-school-of-medicine` | Kansas City, MO
- `a-t-still-university-kirksville-college-of-osteopathic-medicine` | Kirksville, MO
- `saint-louis-university-school-of-medicine` | St. Louis, MO
- `washington-university-school-of-medicine-in-st-louis` | St. Louis, MO
- `william-carey-university-college-of-osteopathic-medicine` | Hattiesburg, MS
- `university-of-mississippi-school-of-medicine` | Jackson, MS
- `montana-college-of-osteopathic-medicine` | Billings, MT
- `touro-university-montana-college-of-osteopathic-medicine` | Great Falls, MT
- `unc-school-of-medicine` | Chapel Hill, NC
- `duke-university-school-of-medicine` | Durham, NC
- `methodist-university-cape-fear-valley-health-school-of-medicine` | Fayetteville, NC
- `brody-school-of-medicine-at-east-carolina-university` | Greenville, NC
- `campbell-university-jerry-m-wallace-school-of-osteopathic-medicine` | Lillington, NC
- `wake-forest-university-school-of-medicine` | Winston-Salem, NC
- `university-of-north-dakota-school-of-medicine-and-health-sciences` | Grand Forks, ND
- `creighton-university-school-of-medicine` | Omaha, NE
- `university-of-nebraska-college-of-medicine` | Omaha, NE
- `geisel-school-of-medicine-at-dartmouth` | Hanover, NH
- `cooper-medical-school-of-rowan-university` | Camden, NJ
- `rutgers-new-jersey-medical-school` | Newark, NJ
- `hackensack-meridian-school-of-medicine` | Nutley, NJ
- `rutgers-robert-wood-johnson-medical-school` | Piscataway, NJ
- `rowan-virtua-school-of-osteopathic-medicine-sewell-campus` | Sewell, NJ
- `rowan-virtua-school-of-osteopathic-medicine` | Stratford, NJ
- `university-of-new-mexico-school-of-medicine` | Albuquerque, NM
- `burrell-college-of-osteopathic-medicine` | Las Cruces, NM
- `touro-university-nevada-college-of-osteopathic-medicine` | Henderson, NV
- `kirk-kerkorian-school-of-medicine-at-unlv` | Las Vegas, NV
- `roseman-university-college-of-medicine` | Las Vegas, NV
- `university-of-nevada-reno-school-of-medicine` | Reno, NV
- `albany-medical-college` | Albany, NY
- `suny-downstate-health-sciences-university-college-of-medicine` | Brooklyn, NY
- `d-youville-university-college-of-osteopathic-medicine` | Buffalo, NY
- `jacobs-school-of-medicine-and-biomedical-sciences-at-the-university-at-buffalo` | Buffalo, NY
- `lake-erie-college-of-osteopathic-medicine-elmira` | Elmira, NY
- `donald-and-barbara-zucker-school-of-medicine-at-hofstra-northwell` | Hempstead, NY
- `touro-college-of-osteopathic-medicine-middletown` | Middletown, NY
- `new-york-university-grossman-long-island-school-of-medicine` | Mineola, NY
- `albert-einstein-college-of-medicine` | New York, NY
- `cuny-school-of-medicine` | New York, NY
- `columbia-university-vagelos-college-of-physicians-and-surgeons` | New York, NY
- `icahn-school-of-medicine-at-mount-sinai` | New York, NY
- `new-york-university-grossman-school-of-medicine` | New York, NY
- `touro-college-of-osteopathic-medicine` | New York, NY
- `weill-cornell-medicine` | New York, NY
- `new-york-institute-of-technology-college-of-osteopathic-medicine` | Old Westbury, NY
- `university-of-rochester-school-of-medicine-and-dentistry` | Rochester, NY
- `renaissance-school-of-medicine-at-stony-brook-university` | Stony Brook, NY
- `suny-upstate-medical-university-alan-and-marlene-norton-college-of-medicine` | Syracuse, NY
- `new-york-medical-college` | Valhalla, NY
- `ohio-university-heritage-college-of-osteopathic-medicine` | Athens, OH
- `university-of-cincinnati-college-of-medicine` | Cincinnati, OH
- `xavier-university-college-of-osteopathic-medicine` | Cincinnati, OH
- `case-western-reserve-university-school-of-medicine` | Cleveland, OH
- `ohio-state-university-college-of-medicine` | Columbus, OH
- `wright-state-university-boonshoft-school-of-medicine` | Dayton, OH
- `ohio-university-heritage-college-of-osteopathic-medicine-dublin` | Dublin, OH
- `northeast-ohio-medical-university` | Rootstown, OH
- `university-of-toledo-college-of-medicine-and-life-sciences` | Toledo, OH
- `ohio-university-heritage-college-of-osteopathic-medicine-cleveland` | Warrensville Heights, OH
- `university-of-oklahoma-college-of-medicine` | Oklahoma City, OK
- `oklahoma-state-university-center-for-health-sciences-college-of-osteopathic-medicine-tahlequah` | Tahlequah, OK
- `oklahoma-state-university-college-of-osteopathic-medicine` | Tulsa, OK
- `western-university-of-health-sciences-college-of-osteopathic-medicine-of-the-pacific-north` | Lebanon, OR
- `oregon-health-science-university-school-of-medicine` | Portland, OR
- `lake-erie-college-of-osteopathic-medicine` | Erie, PA
- `lake-erie-college-of-osteopathic-medicine-seton-hill` | Greensburg, PA
- `pennsylvania-state-university-college-of-medicine` | Hershey, PA
- `indiana-university-of-pennsylvania-college-of-osteopathic-medicine` | Indiana, PA
- `drexel-university-college-of-medicine` | Philadelphia, PA
- `lewis-katz-school-of-medicine-at-temple-university` | Philadelphia, PA
- `perelman-school-of-medicine-at-the-university-of-pennsylvania` | Philadelphia, PA
- `philadelphia-college-of-osteopathic-medicine` | Philadelphia, PA
- `sidney-kimmel-medical-college-at-thomas-jefferson-university` | Philadelphia, PA
- `duquesne-university-nasuti-college-of-osteopathic-medicine` | Pittsburgh, PA
- `university-of-pittsburgh-school-of-medicine` | Pittsburgh, PA
- `geisinger-commonwealth-school-of-medicine` | Scranton, PA
- `universidad-central-del-caribe-school-of-medicine` | Bayamon, PR
- `ponce-health-sciences-university-school-of-medicine` | Ponce, PR
- `san-juan-bautista-school-of-medicine` | San Juan, PR
- `university-of-puerto-rico-school-of-medicine` | San Juan, PR
- `the-warren-alpert-medical-school-of-brown-university` | Providence, RI
- `medical-university-of-south-carolina-college-of-medicine` | Charleston, SC
- `university-of-south-carolina-school-of-medicine-columbia` | Columbia, SC
- `university-of-south-carolina-school-of-medicine-greenville` | Greenville, SC
- `edward-via-college-of-osteopathic-medicine-carolinas-campus` | Spartanburg, SC
- `university-of-south-dakota-sanford-school-of-medicine` | Vermillion, SD
- `lincoln-memorial-university-debusk-college-of-osteopathic-medicine` | Harrogate, TN
- `east-tennessee-state-university-james-h-quillen-college-of-medicine` | Johnson City, TN
- `lincoln-memorial-university-debusk-college-of-osteopathic-medicine-knoxville` | Knoxville, TN
- `baptist-health-sciences-university-college-of-osteopathic-medicine` | Memphis, TN
- `university-of-tennessee-health-science-center-college-of-medicine` | Memphis, TN
- `meharry-medical-college` | Nashville, TN
- `thomas-f-frist-jr-college-of-medicine-at-belmont-university` | Nashville, TN
- `vanderbilt-university-school-of-medicine` | Nashville, TN
- `dell-medical-school-at-the-university-of-texas-at-austin` | Austin, TX
- `texas-a-m-university-school-of-medicine` | College Station, TX
- `sam-houston-state-university-college-of-osteopathic-medicine` | Conroe, TX
- `university-of-texas-southwestern-medical-school` | Dallas, TX
- `university-of-texas-rio-grande-valley-school-of-medicine` | Edinburg, TX
- `texas-tech-university-health-sciences-center-paul-l-foster-school-of-medicine` | El Paso, TX
- `texas-christian-university-burnett-school-of-medicine` | Fort Worth, TX
- `university-of-north-texas-health-science-center-texas-college-of-osteopathic-medicine` | Fort Worth, TX
- `university-of-texas-medical-branch-john-sealy-school-of-medicine` | Galveston, TX
- `baylor-college-of-medicine` | Houston, TX
- `mcgovern-medical-school-at-uthealth-houston` | Houston, TX
- `university-of-houston-tilman-j-fertitta-family-college-of-medicine` | Houston, TX
- `texas-tech-university-health-sciences-center-school-of-medicine` | Lubbock, TX
- `long-school-of-medicine-at-ut-health-san-antonio` | San Antonio, TX
- `university-of-the-incarnate-word-school-of-osteopathic-medicine` | San Antonio, TX
- `university-of-texas-at-tyler-school-of-medicine` | Tyler, TX
- `rocky-vista-university-college-of-osteopathic-medicine-southern-utah` | Ivins, UT
- `noorda-college-of-osteopathic-medicine` | Provo, UT
- `university-of-utah-spencer-fox-eccles-school-of-medicine` | Salt Lake City, UT
- `edward-via-college-of-osteopathic-medicine-virginia-campus` | Blacksburg, VA
- `university-of-virginia-school-of-medicine` | Charlottesville, VA
- `liberty-university-college-of-osteopathic-medicine` | Lynchburg, VA
- `eastern-virginia-medical-school-at-old-dominion-university` | Norfolk, VA
- `virginia-commonwealth-university-school-of-medicine` | Richmond, VA
- `virginia-tech-carilion-school-of-medicine` | Roanoke, VA
- `robert-larner-m-d-college-of-medicine-at-the-university-of-vermont` | Burlington, VT
- `university-of-washington-school-of-medicine` | Seattle, WA
- `elson-s-floyd-college-of-medicine-at-washington-state-university` | Spokane, WA
- `pacific-northwest-university-of-health-sciences-college-of-osteopathic-medicine` | Yakima, WA
- `university-of-wisconsin-school-of-medicine-and-public-health` | Madison, WI
- `medical-college-of-wisconsin` | Milwaukee, WI
- `marshall-university-joan-c-edwards-school-of-medicine` | Huntington, WV
- `west-virginia-school-of-osteopathic-medicine` | Lewisburg, WV
- `west-virginia-university-school-of-medicine` | Morgantown, WV

---

**Two entries are deliberately absent from this list** and must not be given coordinates: Sidney Kimmel — Delaware Regional Medical Campus, and Tufts — Maine Track. No directory publishes a city for either, and the spec ruled that **a city must never be inferred from the parent institution**. They render without a pin.
