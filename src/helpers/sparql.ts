import { BrtObject, BrtCluster } from "../reducer";
import { sortByGeoMetryAndName } from "../helpers/utils";
import * as wellKnown from "wellknown";
import * as utils from "./utils";
export interface SparqlResults {
  head: Head;
  results: {
    bindings: Binding[];
  };
}
export interface Head {
  vars: string[];
}
export interface Binding {
  [varname: string]: BindingValue;
}
export type BindingValue =
  | {
      type: "uri";
      value: string;
    }
  | {
      type: "literal";
      value: string;
      "xml:lang"?: string;
      datatype?: string;
    }
  | { type: "bnode"; value: string };

/**
 * Zet de sparql json resulaten om in een Resultaat.js array
 * @param results
 */
export async function queryResourcesDescriptions(iris: string[]) {
  let res = await queryTriply(getResourceDescriptionsQuery(iris));
  let returnObject: BrtObject[] = [];

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
    let name, type, geoJson, color, objectClass;

    //dit sorteert de resultaten op gemeomety en dan naam.
    //dus bijv Polygoon voor linestring
    sortByGeoMetryAndName(valueMap);

    let fO = valueMap[0];

    //Kijk eerst of het een brug of etc naam is.
    if (fO.brugnaam || fO.tunnelnaam || fO.sluisnaam || fO.knooppuntnaam) {
      if (fO.brugnaam) {
        name = fO.brugnaam.value;
      } else if (fO.tunnelnaam) {
        name = fO.tunnelnaam.value;
      } else if (fO.sluisnaam) {
        name = fO.sluisnaam.value;
      } else {
        name = fO.knooppuntnaam.value;
      }

      name = name.replace(/\|/g, "");
      //anders off naam eerst
    } else if (fO.offnaam) {
      name = fO.offnaam.value;
      //anders friese naam eerst
    } else if (fO.naamFries) {
      name = fO.naamFries.value;
      //anders naam nl eerst
    } else if (fO.naamNl) {
      name = fO.naamNl.value;
      //anders de gewone naam eerst
    } else if (fO.naam) {
      name = fO.naam.value;
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
        indexes.push({ index: index, type: value });
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
    returnObject.push({ url: key, name: name, type: type, geojson: geoJson, color: color, objectClass: objectClass });
  });

  return returnObject;
}

/**
 * Dit is een methode die het sparql endpoint van triply queriet.
 * @param query string met query
 * @returns {Promise<Response>}
 */
export async function queryTriply(query: string): Promise<SparqlResults> {
  const result = await fetch("https://api.labs.kadaster.nl/datasets/kadaster/brt/services/brt/sparql", {
    method: "POST",
    headers: {
      "Content-Type": "application/sparql-query",
      Accept: "application/sparql-results+json"
    },
    body: query
  });

  if (result.status > 300) {
    throw new Error("Request with response " + result.status);
  }

  //verwerk de query
  return JSON.parse(await result.text());
}

/**
 * Query die heel veel values in één keer ophaalt.
 */
export function getResourceDescriptionsQuery(resources: string[]) {
  return `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX brt: <http://brt.basisregistraties.overheid.nl/def/top10nl#>
    PREFIX geo: <http://www.opengis.net/ont/geosparql#>

    SELECT * WHERE {
        VALUES ?s {
           <${resources.join("> <")}>
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
`;
}

export interface VerboseDescription {
  names: {
    naam: string;
    naamOfficieel: string;
    naamNl: string;
    naamFries: string;
    burgNaam: string;
    tunnelNaam: string;
    sluisNaam: string;
    knoopPuntNaam: string;
  };
  type: string[];
  remaining: { key: string; value: string }[];
}
export async function getVerboseDescription(obj: BrtObject | BrtCluster): Promise<VerboseDescription> {
  /**
   * Haal alle attributen van
   */

  let res = await queryTriply(`
      PREFIX brt: <http://brt.basisregistraties.overheid.nl/def/top10nl#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

      SELECT * WHERE {
        <${obj.url}> ?prd ?obj.
      }`);

  let nodes = res.results.bindings;

  let naam: string;
  let naamNl: string;
  let naamFries: string;
  let naamOfficieel: string;
  let burgNaam: string;
  let tunnelNaam: string;
  let knoopPuntNaam: string;
  let sluisNaam: string;
  let types: string[] = [];
  let overigeAttributen: { key: string; value: string }[] = [];

  /**
   * Ga langs elk attribuut en voeg deze toe aan het correcte attribuut
   */
  for (let i = 0; i < nodes.length; i++) {
    let key = utils.stripUrlToType(nodes[i].prd.value);
    let value = nodes[i].obj.value;

    if (key === "naam") {
      naam = value;
    } else if (key === "brugnaam") {
      value = value.replace(/\|/g, "");
      burgNaam = value;
    } else if (key === "tunnelnaam") {
      value = value.replace(/\|/g, "");
      tunnelNaam = value;
    } else if (key === "sluisnaam") {
      value = value.replace(/\|/g, "");
      sluisNaam = value;
    } else if (key === "knooppuntnaam") {
      value = value.replace(/\|/g, "");
      knoopPuntNaam = value;
    } else if (key === "naamNL") {
      naamNl = value;
    } else if (key === "naamFries") {
      naamFries = value;
    } else if (key === "type") {
      types.push(utils.stripUrlToType(value));
    } else if (key === "naamOfficieel") {
      naamOfficieel = value.replace(/\|/g, "");

      //labels moeten er niet in want dat wou jasper niet.
    } else if (key !== "label") {
      let formattedKey;

      //vervang een aantal attributen handmatig.
      if (key === "isBAGnaam") {
        formattedKey = "BAG-naam";
      } else if (key === "isBAGwoonplaats") {
        formattedKey = "BAG-woonplaats";
      } else if (key === "aantalinwoners") {
        formattedKey = "Aantal inwoners";
      } else {
        //andere automatisch
        formattedKey = utils.seperateUpperCase(key);
      }

      //als deze attributen er in zitten haal deze naar boven.
      if (
        key === "soortnaam" ||
        key === "isBAGwoonplaats" ||
        key === "bebouwdeKom" ||
        key === "aantalinwoners" ||
        key === "getijdeinvloed" ||
        key === "hoofdafwatering" ||
        key === "isBAGnaam" ||
        key === "elektrificatie" ||
        key === "gescheidenRijbaan"
      ) {
        //behalve deze twee zorg ervoor dat de 1 of 0 wordt vervangen met ja of nee
        if (key !== "aantalinwoners" && key !== "soortnaam") {
          value = utils.veranderNaarJaNee(value);
        }

        overigeAttributen.unshift({ key: formattedKey, value: value });
      } else {
        overigeAttributen.push({ key: formattedKey, value: value });
      }
    }
  }

  //Raap eerst alle types bij elkaar
  //krijg dan de stipped url en dan de meest speciefieke type
  //Dus Sporthal komt voor Gebouw want Sporthal is specefieker.
  let indexes = [];
  for (let i = 0; i < types.length; i++) {
    let index = utils.getIndexOfClasses(types[i]);
    let value = utils.seperateUpperCase(types[i]);
    indexes.push({ index: index, type: value });
  }

  //krijg de meest relevante type. Dit kon ik ook eigenlijk uit de res halen. Je kan er ook voor kiezen om alle types te
  //tonen.
  indexes.sort((a, b) => {
    return a.index - b.index;
  });

  if (obj.geojson.type !== "Point") {
    let area = utils.calculateArea(utils.objectOrClusterToGeojson(obj));
    overigeAttributen.push({ key: "oppervlakte", value: area });
  }

  return {
    names: {
      naam,
      naamOfficieel,
      naamNl,
      naamFries,
      burgNaam,
      tunnelNaam,
      sluisNaam,
      knoopPuntNaam
    },
    type: [indexes[0].type],
    remaining: overigeAttributen
  };
}
