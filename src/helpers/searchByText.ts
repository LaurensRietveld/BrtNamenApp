import * as utils from "./utils";
import {queryResourcesDescriptions} from './sparql'
let latestString:string;

export async function search(text:string, onStartClustering: () => void) {
    //update eerst de laatst ingetype string
    latestString = text;

    let res = await queryElastic(text)

    //als de gebruiker iets nieuws heeft ingetypt geef dan undefined terug.
    if (latestString !== text) {
        return undefined;
    } else if (res.status > 300) {
        throw new Error(`Error querying elasticsearch: ${res.status} ${res.statusText}`)
    }


    const jsonResponse:ElasticResults = JSON.parse(await res.text());

    const descriptions = await queryResourcesDescriptions(jsonResponse.hits.hits.map(r => r._id))
    onStartClustering();
    return utils.clusterObjects(descriptions, text);

}


interface ElasticResults {
  hits: {
    hits: ElasticResult[]
  }
}
interface ElasticResult {
  _id: string,
  _score: number
  _source: {}
}


function queryElastic(searchString: string) {
    const query = JSON.stringify({
        "query": {
            "dis_max": {
                "queries": [
                    {
                        "fuzzy": {
                            "http://brt basisregistraties overheid nl/def/top10nl#naam": searchString
                        }
                    },
                    {
                        "fuzzy": {
                            "http://brt.basisregistraties.overheid.nl/def/top10nl#naamNL": searchString
                        }
                    },
                    {
                        "fuzzy": {
                            "http://brt.basisregistraties.overheid.nl/def/top10nl#naamOfficieel": searchString
                        }
                    },
                    {
                        "fuzzy": {
                            "http://brt.basisregistraties.overheid.nl/def/top10nl#naamFries": searchString
                        }
                    },
                    {
                        "fuzzy": {
                            "http://brt.basisregistraties.overheid.nl/def/top10nl#sluisnaam": searchString
                        }
                    },
                    {
                        "fuzzy": {
                            "http://brt.basisregistraties.overheid.nl/def/top10nl#knooppuntnaam": searchString
                        }
                    },
                    {
                        "fuzzy": {
                            "http://brt.basisregistraties.overheid.nl/def/top10nl#brugnaam": searchString
                        }
                    },
                    {
                        "fuzzy": {
                            "http://brt.basisregistraties.overheid.nl/def/top10nl#tunnelnaam": searchString
                        }
                    }
                ]
            }
        },
        "size": 4000
    });

    return fetch(`https://api.labs.kadaster.nl/datasets/kadaster/brt/services/search/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: query
    });
}
