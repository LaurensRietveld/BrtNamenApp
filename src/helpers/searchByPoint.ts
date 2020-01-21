// import Resultaat from "../../model/Resultaat";

import * as utils from "./utils";
import {queryTriply, queryResourcesDescriptions} from './sparql'

import {BrtObject,ContextQuery} from '../reducer'
/**
 * Haalt dingen op aan de hand van de gegeven coordinaten.
 *
 * @param lat waar geklikt is
 * @param lng waar geklikt is
 * @param north van de kaart frame
 * @param east van de kaart frame
 * @param soutch van de kaart frame
 * @param west van de kaart frame
 * @param setResFromOutside met deze methode kan je de resultaten van buiten de app zetten. Je moet wel "waiting" als string
 * terug geven.
 */
 export async function getFromCoordinates(ctx:ContextQuery, onStartClustering: () => void) {
    let {lat,lng,north,east,south,west} = ctx;
    //check of de gebruiker te ver is uitgezoomd. Zet dan je eigen coordinaten.
    if (west - east > 0.05 || north - south > 0.0300) {
        east = lng - 0.025;
        west = lng + 0.025;
        north = lat + 0.01500;
        south = lat - 0.01500;
    }

    //haal alle niet straten op.
    const nonstreets = await queryTriply(queryForCoordinatesNonStreets(north, east, south, west));

    //Zet deze om in een array met Resultaat.js
    const nonstreetsResults = await queryResourcesDescriptions(nonstreets.results.bindings.map(b => b.sub.value));

    //De straten worden in een kleinere straal opgehaald dus doe hier de berekeningen.
    let stop = lat - 0.0022804940130103546;//((top - bottom) / 2) * factor;
    let sbottom = lat + 0.0022804940130103546;//((top - bottom) / 2) * factor;
    let sright = lng + 0.0033634901046750002;//((right - left) / 2) * factor;
    let sleft = lng - 0.0033634901046750002;//((right - left) / 2) * factor;

    const streets = await queryTriply(queryForCoordinatesStreets(stop, sleft, sbottom, sright));


    //Zet deze om in een array met Resultaat.js
    const streetsResults = await queryResourcesDescriptions(streets.results.bindings.map(b => b.sub.value));

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
 * Query die aan de hand van coordinaten niet straten ophaalt.
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
 * @param right
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
