/**
 * Deze file bevat alle methodes die door meerdere communicators gebruikt worden. bijv first letter capital
 *
 * Ook bevindt zich in deze file alle "leterlijke strings" dus bijv "Gemeente" die ik niet in de front end wou zetten.
 *
 * Hierdoor blijft de front end hopelijk stabiel terwijl je deze file alleen hoeft te veranderen wil je de functionalitiet veranderen.
 *
 * Hier zitten ook een aantal methodes in die door de front end worden aangeroepen.
 */
import { BrtCluster, BrtObject } from "../reducer";
import * as wellKnown from "wellknown";
// import Resultaat from "../model/Resultaat";
import * as turf from "@turf/turf";
// import ClusterObject from "../model/ClusterObject";
import { toastMax } from "../components/toastMethods";
import { SparqlResults, Binding } from "./sparql";

/**
 * Een file die alle classen van de brt bevat. Object klassen staan achter aan.
 */
let classes = [
  "Grasland",
  "BosGemengdBos",
  "Akkerland",
  "BosNaaldbos",
  "Dodenakker",
  "BosLoofbos",
  "Spoorbaanlichaam",
  "Heide",
  "BebouwdGebied",
  "Populieren",
  "Boomgaard",
  "Boomkwekerij",
  "Zand",
  "Duin",
  "Fruitkwekerij",
  "BasaltblokkenSteenglooiing",
  "BosGriend",
  "Braakliggend",
  "Aanlegsteiger_terrein",
  "DodenakkerMetBos",
  "BronWel",
  "GreppelDrogeSloot",
  "Waterloop",
  "MeerPlas",
  "Droogvallend",
  "Droogvallend_LAT",
  "Zee_waterdeel",
  "KasWarenhuis",
  "Tank",
  "Huizenblok",
  "KloosterAbdij",
  "Zwembad_gebouw",
  "Sporthal",
  "ParkeerdakParkeerdekParkeergarage",
  "Gemeentehuis",
  "Toren",
  "WindmolenKorenmolen",
  "Gemaal",
  "Kapel",
  "Uitzichttoren",
  "Pompstation",
  "Manege",
  "Fort",
  "Rune",
  "Transformatorstation_gebouw",
  "Tankstation",
  "Museum",
  "Kasteel",
  "School",
  "Waterradmolen",
  "Ziekenhuis",
  "Postkantoor",
  "Bunker",
  "Koeltoren",
  "Vuurtoren",
  "Watertoren",
  "WindmolenWatermolen",
  "Universiteit",
  "RadiotorenTelevisietoren",
  "Bezoekerscentrum",
  "PsychiatrischZiekenhuisPsychiatrischCentrum",
  "Gevangenis",
  "Elektriciteitscentrale",
  "Politiebureau",
  "Radarpost",
  "Schaapskooi",
  "Lichttoren",
  "Werf_gebouw",
  "Radartoren",
  "Dok",
  "Veiling",
  "Fabriek",
  "Peilmeetstation",
  "Windmolen",
  "Schoorsteen",
  "Crematorium",
  "Stadion",
  "Paleis",
  "Kunstijsbaan",
  "Telecommunicatietoren",
  "Klokkentoren",
  "Zendtoren",
  "Brandweerkazerne",
  "Stationsgebouw",
  "MarkantGebouw",
  "Reddingboothuisje",
  "KliniekInrichtingSanatorium",
  "Recreatiecentrum",
  "Verkeerstoren",
  "Koepel",
  "KerncentraleKernreactor",
  "StadskantoorHulpsecretarie",
  "Hotel",
  "Remise",
  "Kerk",
  "Brandtoren",
  "Luchtwachttoren",
  "Silo",
  "Moskee",
  "OverigReligieusGebouw",
  "Synagoge",
  "MilitairGebouw",
  "Windturbine",
  "Tol_gebouw",
  "Boortoren",
  "Observatorium",
  "Wegrestaurant",
  "Bomenrij",
  "Koedam",
  "HegHaag",
  "Aanlegsteiger_inrichtingselement",
  "Hekwerk",
  "Wegafsluiting",
  "Verkeersgeleider",
  "Stuw",
  "Muur",
  "Geluidswering",
  "StrekdamKribGolfbreker",
  "Hoogspanningsleiding",
  "Sluisdeur",
  "Schietbaan",
  "Kabelbaan",
  "Paalwerk",
  "Stormvloedkering",
  "Tol_inrichtingselement",
  "Boom",
  "Strandpaal",
  "Hoogspanningsmast",
  "Wegwijzer",
  "Grenspunt",
  "Kruis",
  "Pijler",
  "Kilometerraaibord",
  "Paal",
  "Zendmast",
  "Kilometerpaal",
  "Windmolentje",
  "Dukdalf",
  "Peilschaal",
  "Scheepvaartlicht",
  "Botenhelling",
  "KilometerpaalWater",
  "KogelvangerSchietbaan",
  "GedenktekenMonument",
  "KilometerpaalSpoorweg",
  "Radiotelescoop",
  "MarkantObject",
  "Seinmast",
  "GpsKernnetpunt",
  "Kilometerraaipaal",
  "Klokkenstoel",
  "Vlampijp",
  "Busstation",
  "Oliepompinstallatie",
  "Hunebed",
  "Uitzichtpunt",
  "Baak",
  "ZichtbaarWrak",
  "Golfmeetpaal",
  "Helikopterlandingsplatform",
  "Kraan",
  "Gaswinning_inrichtingselement",
  "Metrostation",
  "Treinstation",
  "Sneltramhalte",
  "Kaap",
  "Havenhoofd",
  "Vliedberg",
  "Kabelbaanmast",
  "Plaatsnaambord",
  "Calamiteitendoorgang",
  "Leiding",
  "Luchtvaartlicht",
  "Radiobaken",
  "RdPunt",
  "Weg",
  "Spoor",
  "Water",
  "Wijk",
  "Buurtschap",
  "Gehucht",
  "Deelkern",
  "Buurt",
  "Woonkern",
  "Industriekern",
  "Recreatiekern",
  "Stadsdeel",
  "TaludHoogteverschil",
  "SteileRandAardrand",
  "Wal",
  "Trein",
  "Metro",
  "Tram",
  "Sneltram",
  "Gemengd",
  "Werf_functioneelGebied",
  "Park",
  "Gebouwencomplex",
  "Haven_functioneelGebied",
  "Natuurgebied",
  "Landgoed",
  "Infiltratiegebied",
  "Verdedigingswerk",
  "Boswachterij",
  "Tennispark",
  "Bedrijventerrein",
  "Eendenkooi",
  "Woonwagencentrum",
  "Transformatorstation_functioneelGebied",
  "Zuiveringsinstallatie",
  "SportterreinSportcomplex",
  "Begraafplaats",
  "Wildwissel",
  "Jachthaven",
  "Stortplaats",
  "Bungalowpark",
  "CampingKampeerterrein",
  "Heemtuin",
  "Volkstuinen",
  "Vakantiepark",
  "Sluizencomplex",
  "Ijsbaan",
  "DierentuinSafaripark",
  "Zenderpark",
  "Circuit",
  "Viskwekerij_functioneelGebied",
  "Ziekenhuiscomplex",
  "Verzorgingsplaats",
  "Openluchtmuseum",
  "Crossbaan",
  "Openluchttheater",
  "Waterkering",
  "Mosselbank",
  "Milieustraat",
  "Kassengebied",
  "VliegveldLuchthaven",
  "BotanischeTuin",
  "Golfterrein",
  "Zonnepark",
  "Kartingbaan",
  "Caravanpark",
  "Visvijvercomplex",
  "Erebegraafplaats",
  "KazerneLegerplaats",
  "MilitairOefengebiedSchietterrein",
  "ZwembadComplex",
  "Gaswinning_functioneelGebied",
  "Zweefvliegveldterrein",
  "Renbaan",
  "Attractiepark",
  "Grafheuvel",
  "Windturbinepark",
  "Tuincentrum",
  "Zandwinning",
  "Recreatiegebied",
  "Skibaan",
  "Productie-installatie",
  "Groeve",
  "Campus",
  "Helikopterlandingsterrein",
  "Zoutwinning",
  "GebiedVoorRadioastronomie",
  "NationaalPark",
  "Grindwinning",
  "Slipschool",
  "Emplacement",
  "Mijn",
  "Oliewinning",
  "Plantsoen",
  "Arboretum",
  "GebiedMetHogeObjecten",
  "NatuurgebiedNatuurreservaat",
  "Veerverbinding",
  "Autosnelweg",
  "RegionaleWeg",
  "Hoofdweg",
  "LokaleWeg",
  "Straat",
  "ParkeerplaatsCarpool",
  "Parkeerplaats",
  "RolbaanPlatform",
  "StartbaanLandingsbaan",
  "ParkeerplaatsPR",
  "Polder",
  "StreekVeld",
  "Bosgebied",
  "GeulVaargeul",
  "Heidegebied",
  "HeuvelBerg",
  "BankOndieptePlaat",
  "ZeegatZeearm",
  "Eiland",
  "KaapHoek",
  "Duingebied",
  "Zee_geografischGebied",
  "Wad",
  "TerpWierde",
  "Watergebied",
  "Hoogtepunt",
  "Dieptepunt",
  "Peil",
  "PeilWinterpeil",
  "PeilZomerpeil",
  "Laagwaterlijn",
  "Hoogtelijn",
  "Dieptelijn",
  "Hoogwaterlijn",
  "Gemeente",
  "Provincie",
  "Land",
  "TerritorialeZee",
  "Waterschap",
  "Overig_terrein",
  "Overig_waterdeel",
  "Overig_gebouw",
  "Overig_inrichtingselement",
  "Overig_planTopografie",
  "Overig_functioneelGebied",
  "Overig_wegdeel",
  "Overig_geografischGebied",
  "Terrein",
  "Waterdeel",
  "Gebouw",
  "Inrichtingselement",
  "PlanTopografie",
  "Plaats",
  "Relief",
  "Spoorbaandeel",
  "FunctioneelGebied",
  "Wegdeel",
  "GeografischGebied",
  "Hoogte",
  "RegistratiefGebied"
];

/**
 * Hier kan je de index opvragen van een element in de array classes.
 * Dus speciefiekere object beschrijvingen hebben een lagere index.
 * @param className string
 * @returns {number}
 */
export function getIndexOfClasses(className: string): number {
  return classes.indexOf(className);
}

/**
 * Een functie die de front end gebruikt om recht geklikte resultaten te filteren. Deze kan je aanpassen.
 * Ik wou niet dat nederland en proviencies werden getoond.
 * @param res
 * @returns {boolean}
 */
export function isShownClickedResults(res: BrtObject): boolean {
  return res.type !== "Land" && res.type !== "Provincie";
}

/**
 * Dit is een functie die een kleur toewijst aan een klasse.
 * @param type
 * @returns {string|undefined}
 */
export function getColor(type: string): string {
  switch (type) {
    case "FunctioneelGebied":
      return "green";
    case "Gebouw":
      return "red";
    case "GeografischGebied":
      return "mediumaquamarine";
    case "Hoogte":
      return undefined;
    case "Inrichtingselement":
      return "purple";
    case "Plaats":
      return "turqoise";
    case "PlanTopografie":
      return undefined;
    case "RegistratiefGebied":
      return "yellow";
    case "Spoorbaandeel":
      return "purple";
    case "Terrein":
      return "mediumaquamarine";
    case "Relief":
      return undefined;
    case "Waterdeel":
      return "blue";
    case "Wegdeel":
      return "purple";
    default:
      return undefined;
  }
}

/**
 * Wordt door de front-end gebruikt om de layering te bepalen.
 * @param list de lijst die jezelf kan sorteren.
 */
export function sortByObjectClass(list: GeoJSON.Feature<GeoJSON.Geometry, BrtObject | BrtCluster>[]) {
  return list.sort((a, b) => {
    const objA = a.properties as BrtObject | BrtCluster;
    const objB = b.properties as BrtObject | BrtCluster;

    if (objA.type === "Provincie" || objB.type === "Provincie") {
      if (objA.type === "Provincie" && objB.type === "Provincie") {
        return 0;
      } else if (objA.type === "Provincie") {
        return -1;
      } else {
        return 1;
      }
    }

    if (objA.type === "Gemeente" || objB.type === "Gemeente") {
      if (objA.type === "Gemeente" && objB.type === "Gemeente") {
        return 0;
      } else if (objA.type === "Gemeente") {
        return -1;
      } else {
        return 1;
      }
    }

    if (objA.type === "Woonkern" || objB.type === "Woonkern") {
      if (objA.type === "Woonkern" && objB.type === "Woonkern") {
        return 0;
      } else if (objA.type === "Woonkern") {
        return -1;
      } else {
        return 1;
      }
    }

    if (objA.type === "Stadsdeel" || objB.type === "Stadsdeel") {
      if (objA.type === "Stadsdeel" && objB.type === "Stadsdeel") {
        return 0;
      } else if (objA.type === "Stadsdeel") {
        return -1;
      } else {
        return 1;
      }
    }

    if (objA.type === "Wijk" || objB.type === "Wijk") {
      if (objA.type === "Wijk" && objB.type === "Wijk") {
        return 0;
      } else if (objA.type === "Wijk") {
        return -1;
      } else {
        return 1;
      }
    }

    if (objA.type === "Buurt" || objB.type === "Buurt") {
      if (objA.type === "Buurt" && objB.type === "Buurt") {
        return 0;
      } else if (objA.type === "Buurt") {
        return -1;
      } else {
        return 1;
      }
    }

    if (objA.objectClass === "Gebouw" || objB.objectClass === "Gebouw") {
      if (objA.objectClass === "Gebouw" && objB.objectClass === "Gebouw") {
        return 0;
      } else if (objA.objectClass === "Gebouw") {
        return 1;
      } else {
        return -1;
      }
    }

    return 0;
  });
}

/**
 * Verander elk eerste letter naar een hoofdletter
 * @param text
 */
export function firstLetterCapital(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map(s => {
      if (!s.startsWith("ij")) {
        return s.charAt(0).toUpperCase() + s.substring(1);
      } else {
        return s.charAt(0).toUpperCase() + s.charAt(1).toUpperCase() + s.substring(2);
      }
    })
    .join(" ");
}

/**
 * Haalt alles voor de # weg
 * @param url
 * @returns {*|void|string}
 */
export function stripUrlToType(url: string): string {
  return url.replace(/.*#/, "");
}

/**
 * Seperate de string gebasseerd op uppercase.
 * @param string
 * @returns {string}
 */
export function seperateUpperCase(value: string): string {
  //haal ook underscores weg

  const splitted = value.replace("_", " ").split(/(?=[A-Z])/);
  splitted.forEach((_res, index, arr) => {
    if (index !== 0) {
      arr[index] = arr[index].charAt(0).toLowerCase() + arr[index].slice(1);
    }
  });

  return splitted.join(" ");
}

/**
 * Verandert een 1 of true naar ja. anders nee
 * @param string
 * @returns {string}
 */
export function veranderNaarJaNee(string: string): "ja" | "nee" {
  if (string === "1" || string === "true") {
    return "ja";
  }
  return "nee";
}

/**
 * Sorteert op naam en dan geometry
 * Vooral gemaakt voor straten.
 * @param values
 * @param searchString
 */
export function sortByGeoMetryAndName(values: Binding[], searchString?: string): Binding[] {
  if (searchString) {
    searchString = searchString.toUpperCase();
  }

  return values.sort((a, b) => {
    //kijk eerst of de gezochte string zich bevindt in de naam
    if (a.name && b.name && searchString) {
      let naama = a.name.value.toUpperCase();
      let naamb = b.name.value.toUpperCase();

      if (naama.includes(searchString) && !naamb.includes(searchString)) {
        return -1;
      } else if (!naama.includes(searchString) && naamb.includes(searchString)) {
        return 1;
      }
    }

    //sorteer op geometry
    let aGeo = a.wktJson.value;
    let bGeo = b.wktJson.value;

    if (aGeo.startsWith("GEOMETRYCOLLECTION") || bGeo.startsWith("GEOMETRYCOLLECTION")) {
      if (aGeo.startsWith("GEOMETRYCOLLECTION")) {
        return -1;
      } else {
        return 1;
      }
    } else if (aGeo.startsWith("MULTIPOLYGON") || bGeo.startsWith("MULTIPOLYGON")) {
      if (aGeo.startsWith("MULTIPOLYGON")) {
        return -1;
      } else {
        return 1;
      }
    } else if (aGeo.startsWith("MULTILINESTRING") || bGeo.startsWith("MULTILINESTRING")) {
      if (aGeo.startsWith("MULTILINESTRING")) {
        return -1;
      } else {
        return 1;
      }
    } else if (aGeo.startsWith("MULTIPOINT") || bGeo.startsWith("MULTIPOINT")) {
      if (aGeo.startsWith("MULTIPOINT")) {
        return -1;
      } else {
        return 1;
      }
    } else if (aGeo.startsWith("POLYGON") || bGeo.startsWith("POLYGON")) {
      if (aGeo.startsWith("POLYGON")) {
        return -1;
      } else {
        return 1;
      }
    } else if (aGeo.startsWith("LINESTRING") || bGeo.startsWith("LINESTRING")) {
      if (aGeo.startsWith("LINESTRING")) {
        return -1;
      } else {
        return 1;
      }
    }

    return 0;
  });
}

let worker: Worker;
let latestString: string;

/**
 * Methode om Resultaat objecten te clusteren.
 * @param res het resultaten lijstje.
 * @param text de text waarmee gezocht is
 * @param setMethod de methode om de resultaten te zettten.

 */
export async function clusterObjects(res: BrtObject[], text: string, isMax?: boolean) {
  //kijk eerst of de webbrowser een webworker heeft. Anders doe het in de ui thread.
  if (window.Worker) {
    //laatste string waarop is gezocht.
    latestString = text;
    //als er nog geen webworker is maak er dan eentje aan.
    if (!worker) {
      worker = require("./cluster.worker")();
    }
    //post de res objecten naar de worker.
    worker.postMessage({ res: res, text: text, isMax: isMax });
    return new Promise<{ results: Array<BrtObject | BrtCluster>; exact: boolean }>((resolve, reject) => {
      //als de werker klaar is moet je het weer omzetten naar Javascript classen.
      worker.onmessage = (workerResponse: {
        data: {
          objectsNotInClusters: BrtObject[];
          text: string;
          isMax: boolean;
          clusters: BrtCluster[];
        };
      }) => {
        try {
          const data = workerResponse.data;

          let originalquery = data.text;
          let isMax = data.isMax;

          //als de gebruiker niets nieuws heeft opgezocht.
          if (originalquery === latestString) {
            let results = [...data.objectsNotInClusters, ...data.clusters] as Array<BrtObject | BrtCluster>;

            if (text !== undefined) {
              //sorteer het nog even zodat exacte resultaten naar voren komen.
              results = bringExactNameToFront(text, results);
            }

            if (isMax) {
              toastMax();
            }
            resolve({ results, exact: text !== undefined });
            //zet de res van buiten.
            // setMethod(res, text === undefined);
          }
        } catch (e) {
          reject(e);
        }
      };
    });
  } else {
    throw new Error("Webworker nog supported");
  }
}

/**
 * Haal alle namen die precies overeen komen met de search string naar voren.
 * @param string
 * @param res

 */
export function bringExactNameToFront(
  string: string,
  res: Array<BrtObject | BrtCluster>
): Array<BrtObject | BrtCluster> {
  let j = 0;
  string = string.toUpperCase();

  for (let i = 0; i < res.length; i++) {
    if (string === res[i].name.toUpperCase()) {
      let x = res[j];
      res[j] = res[i];
      res[i] = x;

      j++;
    }
  }

  return res;
}

/**
 * Maak een lijst van Resultaat.js objecten uit een sparql query response.
 * @param res
 * @param latestString
 * @returns {[]}
 */
export function processSearchScreenResults(res: SparqlResults, latestString: string): BrtObject[] {
  let returnObject: BrtObject[] = [];
  const bindings = res.results.bindings;

  //Het kan zo zijn dat hetzelfde object met dezelfde uri meerdere keren kan voorkomen in de res. Hierom wordt er eerst,
  //geclusterd op basis van uri.
  let map = new Map<string, Binding[]>();
  for (let i = 0; i < bindings.length; i++) {
    let value = bindings[i].s.value;

    if (map.has(value)) {
      map.get(value).push(bindings[i]);
    } else {
      map.set(value, [bindings[i]]);
    }
  }

  /**
   * Voor elke uri maak dan een Resultaat.js object.
   */
  map.forEach((valueMap, key) => {
    let naam, type, geoJson, color, objectClass;

    //Het kan zo zijn dat een object meerdere namen heeft. Haal de naam die het meest overeenkomt.
    //Een object kan ook merdere wkt's hebben bijv linestring of polygoon. Deze methode haalt de gene met grootste wkt ook naar voren.
    sortByGeoMetryAndName(valueMap, latestString);

    let fO = valueMap[0];

    //hier gebeuren drie dingen.
    //Check eerste of de naam exact overeenkomt met de gezochte string.
    //check daarna of de naam de naam de gezochte string bevat.
    //check Anders pak gewoon een naam.

    //check of de string exact overeenkomt.
    if (
      (fO.brugnaam && fO.brugnaam.value.toUpperCase() === latestString.toUpperCase()) ||
      (fO.tunnelnaam && fO.tunnelnaam.value.toUpperCase() === latestString.toUpperCase()) ||
      (fO.sluisnaam && fO.sluisnaam.value.toUpperCase() === latestString.toUpperCase()) ||
      (fO.knooppuntnaam && fO.knooppuntnaam.value.toUpperCase() === latestString.toUpperCase())
    ) {
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
    } else if (fO.offnaam && fO.offnaam.value.toUpperCase() === latestString.toUpperCase()) {
      naam = fO.offnaam.value;
    } else if (fO.naamFries && fO.naamFries.value.toUpperCase() === latestString.toUpperCase()) {
      naam = fO.naamFries.value;
    } else if (fO.naamNl && fO.naamNl.value.toUpperCase() === latestString.toUpperCase()) {
      naam = fO.naamNl.value;
    } else if (fO.naam && fO.naam.value.toUpperCase() === latestString.toUpperCase()) {
      naam = fO.naam.value;
      //check hierna of de namen de gezochte string bevatten.
    } else if (
      (fO.brugnaam && fO.brugnaam.value.toUpperCase().includes(latestString.toUpperCase())) ||
      (fO.tunnelnaam && fO.tunnelnaam.value.toUpperCase().includes(latestString.toUpperCase())) ||
      (fO.sluisnaam && fO.sluisnaam.value.toUpperCase().includes(latestString.toUpperCase())) ||
      (fO.knooppuntnaam && fO.knooppuntnaam.value.toUpperCase().includes(latestString.toUpperCase()))
    ) {
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
    } else if (fO.offnaam && fO.offnaam.value.toUpperCase().includes(latestString.toUpperCase())) {
      naam = fO.offnaam.value;
    } else if (fO.naamFries && fO.naamFries.value.toUpperCase().includes(latestString.toUpperCase())) {
      naam = fO.naamFries.value;
    } else if (fO.naamNl && fO.naamNl.value.toUpperCase().includes(latestString.toUpperCase())) {
      naam = fO.naamNl.value;
    } else if (fO.naam && fO.naam.value.toUpperCase().includes(latestString.toUpperCase())) {
      naam = fO.naam.value;
    } else {
      //anders pak gewoon een naam
      if (fO.naam) {
        naam = fO.naam.value;
      } else if (fO.naamNl) {
        naam = fO.naamNl.value;
      } else if (fO.naamFries) {
        naam = fO.naamFries.value;
      }
    }

    //krijg de type
    if (fO.type !== undefined) {
      let indexes = [];

      //Raap eerst alle types bij elkaar
      //krijg dan de stipped url en dan de meest speciefieke type
      //Dus Sporthal komt voor Gebouw want Sporthal is specefieker.
      for (let j = 0; j < valueMap.length; j++) {
        let value = stripUrlToType(valueMap[j].type.value);
        let index = getIndexOfClasses(value);
        indexes.push({ index: index, type: value });
      }

      //sorteer daarna op of welke het meest speciefiek is.
      indexes.sort((a, b) => {
        return a.index - b.index;
      });

      //pak de meest speciefieke als type
      let value = indexes[0].type;
      type = seperateUpperCase(value);

      //De minst speciefieke wordt de object klasse.
      objectClass = seperateUpperCase(indexes[indexes.length - 1].type);

      //pak een kleur op basis van het type.
      color = getColor(indexes[indexes.length - 1].type);
    }

    //de wkt naar geojson
    if (fO.wktJson !== undefined) {
      let wktJson = fO.wktJson.value;
      geoJson = wellKnown.parse(wktJson);
    }

    //maak een Resultaat object en push deze naar de array.
    // let resultaatObj = new Resultaat(key, naam, type, geoJson, color, objectClass);
    returnObject.push({ url: key, name: naam, type: type, geojson: geoJson, color: color, objectClass: objectClass });
  });

  return returnObject;
}

/**
 * Krijgt alle overige attributen van het geklikt object.
 * @param res de response van de uitgevoerde quert
 * @param clickedRes het geklikt lege resultaat.
 */
export function processGetAllAttributes(res: SparqlResults, clickedRes: any) {
  let bindings = res.results.bindings;

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
  for (let i = 0; i < bindings.length; i++) {
    let key = stripUrlToType(bindings[i].prd.value);
    let value = bindings[i].obj.value;

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
      types.push(stripUrlToType(value));
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
        formattedKey = seperateUpperCase(key);
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
          value = veranderNaarJaNee(value);
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
    let index = getIndexOfClasses(types[i]);
    let value = seperateUpperCase(types[i]);
    indexes.push({ index: index, type: value });
  }

  //krijg de meest relevante type. Dit kon ik ook eigenlijk uit de res halen. Je kan er ook voor kiezen om alle types te
  //tonen.
  indexes.sort((a, b) => {
    return a.index - b.index;
  });

  if (clickedRes.getRes().getGeoJson().type !== "Point") {
    let area = calculateArea(clickedRes.getAsFeature());
    overigeAttributen.push({ key: "oppervlakte", value: area });
  }

  /**
   * Laad de attributen in de clicked res
   */
  clickedRes.loadInAttributes(
    naam,
    naamOfficieel,
    naamNl,
    naamFries,
    [indexes[0].type],
    overigeAttributen,
    burgNaam,
    tunnelNaam,
    sluisNaam,
    knoopPuntNaam
  );
}

/**
 * Berekend de oppervalkte in m2.
 * @param feature
 * @returns {string}
 */
function calculateArea(feature: any): string {
  let area = Math.round(turf.area(feature));
  return area.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " m2";
}

export function getHexFromColor(color: string, text?: boolean): string {
  if (color === "turqoise") {
    if (text) {
      return "#15a49f";
    } else {
      return "#3DCCC7";
    }
  } else if (color === "purple") {
    return "#7A306C";
  } else if (color === "green") {
    return "#489E17";
  } else if (color === "red") {
    return "#BA1200";
  } else if (color === "pink") {
    return "#FFD9CE";
  } else if (color === "blue") {
    return "#1B2CFF";
  } else if (color === "orange") {
    return "#FAA916";
  } else if (color === "yellow") {
    if (text) {
      return "#FAA916";
    } else {
      return "#F0F66E";
    }
  } else if (color === "mediumaquamarine") {
    return "#66CDAA";
  } else {
    if (text) {
      return "#000";
    } else {
      return undefined;
    }
  }
}

export function objectOrClusterToGeojson(
  val: BrtObject | BrtCluster
): GeoJSON.Feature<GeoJSON.Geometry, BrtObject | BrtCluster> {
  return {
    type: "Feature",
    properties: val,
    geometry: val.geojson
  };
}

export function getAllObjectsOrClustersAsFeature(values: Array<BrtObject | BrtCluster>): GeoJSON.Feature[] {
  let geojson: GeoJSON.Feature<GeoJSON.Geometry, BrtObject | BrtCluster>[] = [];

  for (const val of values) {
    if ("values" in val) {
      geojson.push(objectOrClusterToGeojson(val));
    } else if (val.geojson && isShownClickedResults(val)) {
      geojson.push(objectOrClusterToGeojson(val));
      // geojson.push(res.getAsFeature());
    }
  }

  return sortByObjectClass(geojson);
}
