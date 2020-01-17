// import Resultaat from "../../model/Resultaat";
import * as wellKnown from "wellknown";
import * as utils from "./utils";
import {sortByGeoMetryAndName} from '../helpers/utils'
import {SparqlResults, Binding} from './sparql'
import {BrtObject} from '../reducer'
/**
 * Haalt dingen op aan de hand van de gegeven coordinaten.
 *
 * @param lat waar geklikt is
 * @param long waar geklikt is
 * @param top van de kaart frame
 * @param left van de kaart frame
 * @param bottom van de kaart frame
 * @param right van de kaart frame
 * @param setResFromOutside met deze methode kan je de resultaten van buiten de app zetten. Je moet wel "waiting" als string
 * terug geven.
 */
export async function getFromCoordinates(lat:number, long:number, top:number, left:number, bottom:number, right:number, onStartClustering: () => void) {
    //check of de gebruiker te ver is uitgezoomd. Zet dan je eigen coordinaten.
    if (right - left > 0.05 || top - bottom > 0.0300) {
        left = long - 0.025;
        right = long + 0.025;
        top = lat + 0.01500;
        bottom = lat - 0.01500;
    }

    //haal alle niet straten op.
    const nonstreets = await queryTriply(queryForCoordinatesNonStreets(top, left, bottom, right));

    //Zet deze om in een array met Resultaat.js
    const nonstreetsResults = await makeSearchScreenResults(nonstreets);

    //De straten worden in een kleinere straal opgehaald dus doe hier de berekeningen.
    let stop = lat - 0.0022804940130103546;//((top - bottom) / 2) * factor;
    let sbottom = lat + 0.0022804940130103546;//((top - bottom) / 2) * factor;
    let sright = long + 0.0033634901046750002;//((right - left) / 2) * factor;
    let sleft = long - 0.0033634901046750002;//((right - left) / 2) * factor;

    const streets = await queryTriply(queryForCoordinatesStreets(stop, sleft, sbottom, sright));


    //Zet deze om in een array met Resultaat.js
    const streetsResults = await makeSearchScreenResults(streets);

    onStartClustering();
    //voeg de resultaten samen en cluster de waterlopen en straten.
    return utils.clusterObjects( mergeResults(streetsResults, nonstreetsResults), undefined);
}

/**
 * Voeg resultaten samen door de uris met elkaar te vergelijken.
 * @param exact
 * @param regex

 */
function mergeResults<E extends BrtObject>(exact:E[], regex:E[]):E[] {
    exact.forEach(resexact => {
            regex = regex.filter(resregex => {
                return resexact.url !== resregex.url;
            });
        }
    );

    return exact.concat(regex);
}

/**
 * Zet de sparql json resulaten om in een Resultaat.js array
 * @param results
 * @returns {Promise<string|[]>}
 */
async function makeSearchScreenResults(results: SparqlResults) {
    const bindings = results.results.bindings;
    let returnObject:BrtObject[] = [];

    //maak de query
    let string = "";
    for (let i = 0; i < bindings.length; i++) {
        string += `<${bindings[i].sub.value}>`;
    }

    let res = await queryTriply(queryBetterForType(string));


    // De query zorgt ervoor dat meerdere keren hetzelfde object wordt terug gegeven. Hierdoor moet je ze bij elkaar rapen
    // De key voor de map is de linked data url
    let map = new Map<string, Binding[]>();

    for (let i = 0; i < res.results.bindings.length; i++) {
        let value = res.results.bindings[i].s.value;

        if (map.has(value)) {
            map.get(value).push(res.results.bindings[i]);
        } else {
            map.set(value, [res.results.bindings[i]]);
        }
    }

    /**
     * Voor elke object
     */
    map.forEach((valueMap, key, _map) => {
        let naam, type, geoJson, color, objectClass;

        //dit sorteert de resultaten op gemeomety en dan naam.
        //dus bijv Polygoon voor linestring
        sortByGeoMetryAndName(valueMap);

        let fO = valueMap[0];

        //Kijk eerst of het een brug of etc naam is.
        if (fO.brugnaam || fO.tunnelnaam || fO.sluisnaam || fO.knooppuntnaam) {
            if (fO.brugnaam) {
                naam = fO.brugnaam.value;
            } else if (fO.tunnelnaam) {
                naam = fO.tunnelnaam.value;
            } else if (fO.sluisnaam) {
                naam = fO.sluisnaam.value;
            } else {
                naam = fO.knooppuntnaam.value;
            }

            naam = naam.replace(/\|/g, "");
            //anders off naam eerst
        } else if (fO.offnaam) {
            naam = fO.offnaam.value;
            //anders friese naam eerst
        } else if (fO.naamFries) {
            naam = fO.naamFries.value;
            //anders naam nl eerst
        } else if (fO.naamNl) {
            naam = fO.naamNl.value;
            //anders de gewone naam eerst
        } else if (fO.naam) {
            naam = fO.naam.value;
        }

        //krijg de type
        if (fO.type !== undefined) {
            let indexes = [];

            //Raap eerst alle types bij elkaar
            //krijg dan de stipped url en dan de meest speciefieke type
            //Dus Sporthal komt voor Gebouw want Sporthal is specefieker.
            for (let j = 0; j < valueMap.length; j++) {
                let value = utils.stripUrlToType(valueMap[j].type.value);
                let index = utils.getIndexOfClasses(value);
                indexes.push({index: index, type: value});
            }

            //sorteer daarna op of welke het meest speciefiek is.
            indexes.sort((a, b) => {
                return a.index - b.index;
            });

            //pak de meest speciefieke als type
            let value = indexes[0].type;
            type = utils.seperateUpperCase(value);

            //De minst speciefieke wordt de object klasse.
            objectClass = utils.seperateUpperCase(indexes[indexes.length - 1].type);

            //pak een kleur op basis van het type.
            color = utils.getColor(indexes[indexes.length - 1].type);
        }

        //de wkt naar geojson
        if (fO.wktJson !== undefined) {
            let wktJson = fO.wktJson.value;
            geoJson = wellKnown.parse(wktJson);
        }

        //maak een Resultaat object en push deze naar de array.
        returnObject.push({url: key, name: naam, type:type, geojson:geoJson, color:color, objectClass:objectClass});
    });

    return returnObject;
}

/**
 * Dit is een methode die het sparql endpoint van triply queriet.
 * @param query string met query
 * @returns {Promise<Response>}
 */
async function queryTriply(query:string):Promise<SparqlResults> {
    const result =  await fetch("https://api.labs.kadaster.nl/datasets/kadaster/brt/services/brt/sparql", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/sparql-query',
            'Accept': 'application/sparql-results+json'
        },
        body: query
    });

    if (result.status > 300) {
        throw new Error('Request with response '+ result.status)
    }

    //verwerk de query
    return JSON.parse(await result.text())

}

/**
 * Query die heel veel values in één keer ophaalt.
 * @param values
 * @returns {string}
 */
function queryBetterForType(values:string) {
    return `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX brt: <http://brt.basisregistraties.overheid.nl/def/top10nl#>
    PREFIX geo: <http://www.opengis.net/ont/geosparql#>

    SELECT * WHERE {
        VALUES ?s {
           ${values}
        }
        ?s a ?type

  Optional{?s brt:naam ?naam.}.
  Optional{?s brt:naamNL ?naamNl.}.
  Optional{?s brt:naamFries ?naamFries}.
  Optional{?s brt:knooppuntnaam ?knooppuntnaam.}.
  Optional{?s brt:sluisnaam ?sluisnaam.}.
  Optional{?s brt:tunnelnaam ?tunnelnaam}.
  Optional{?s brt:brugnaam ?brugnaam.}.
  Optional{?s brt:naamOfficieel ?offnaam.}.
  Optional{?s geo:hasGeometry/geo:asWKT ?wktJson}.
  }
`
}

/**
 * Query die aan de hand van coordinaten niet straten ophaalt.
 * @param top
 * @param left
 * @param bottom
 * @param righ
 * @returns {string}
 */
function queryForCoordinatesNonStreets(top:number, left:number, bottom:number, right:number) {
    return `PREFIX geo: <http://www.opengis.net/ont/geosparql#>
            PREFIX brt: <http://brt.basisregistraties.overheid.nl/def/top10nl#>

            select distinct ?sub{
            {
                ?sub brt:naam ?label;
                 geo:hasGeometry/geo:asWKT ?xShape.
              } UNION {
                ?sub brt:naamNL ?label;
                     geo:hasGeometry/geo:asWKT ?xShape.
              }UNION {
                ?sub brt:naamFries ?label;
                     geo:hasGeometry/geo:asWKT ?xShape.
              }UNION {
                ?sub brt:naamOfficieel ?label;
                     geo:hasGeometry/geo:asWKT ?xShape.
              }
                BIND(bif:st_geomfromtext("POLYGON ((${left} ${bottom}, ${left} ${top}, ${right} ${top}, ${right} ${bottom}))") as ?yShape).
                filter(bif:st_intersects(?xShape, ?yShape))
                filter not exists{
                    ?sub a brt:Wegdeel
                }
            }
            limit 300
            `
}

/**
 * Query die aan de hand van coordinaten straten ophaalt.
 * @param top
 * @param left
 * @param bottom
 * @param righ
 * @returns {string}
 */
function queryForCoordinatesStreets(top:number, left:number, bottom:number, right:number) {
    return `PREFIX geo: <http://www.opengis.net/ont/geosparql#>
            PREFIX brt: <http://brt.basisregistraties.overheid.nl/def/top10nl#>

            select distinct ?sub{
            {
                ?sub brt:naam ?label;
                 geo:hasGeometry/geo:asWKT ?xShape;
                     a brt:Wegdeel.
              } UNION {
                ?sub brt:naamNL ?label;
                     geo:hasGeometry/geo:asWKT ?xShape;
                     a brt:Wegdeel.
              }UNION {
                ?sub brt:naamFries ?label;
                     geo:hasGeometry/geo:asWKT ?xShape;
                     a brt:Wegdeel.
              }UNION {
                ?sub brt:naamOfficieel ?label;
                     geo:hasGeometry/geo:asWKT ?xShape;
                     a brt:Wegdeel.
              }
                BIND(bif:st_geomfromtext("POLYGON ((${left} ${bottom}, ${left} ${top}, ${right} ${top}, ${right} ${bottom}))") as ?yShape).
                filter(bif:st_intersects(?xShape, ?yShape))

            }
            limit 150
            `
}
