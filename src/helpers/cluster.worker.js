//haal de turf lib op
importScripts('https://cdn.jsdelivr.net/npm/@turf/turf@5/turf.min.js');

self.onmessage = e=>{
    let res = e.data.res;

    //dit is de code om Resultaat.js objecten te clusteren.
    let map = new Map();

    //cluster eerst op basis van name en class.
    for (let i = res.length - 1; i >= 0; i--) {
        let name = res[i].type === "Waterloop" ? res[i].name + res[i].type : res[i].name + res[i].objectClass;

        if (res[i].type === "Waterloop" || res[i].objectClass === "Wegdeel") {
            if (map.has(name)) {
                map.get(name).push(res[i]);
            } else {
                map.set(name, [res[i]]);
            }

            res.splice(i, 1);
        }
    }

    let clusterMap = new Map();

    //hierna cluster op basis van locatie. Kijk of de objecten wel aanliggend zijn.
    map.forEach((value, key, map) => {
        let mapCounter = 0;

        //terwijl er nog objecten zijn die nog niet een naaste object hebben gevonden.
        while (value.length > 0) {
            //pak de eerste
            let eerste = value.shift();
            let cluster = [eerste];

            //zet deze in de cluster.
            clusterMap.set(eerste.name + mapCounter, cluster);
            mapCounter++;

            //kijk of er objecten zijn in het lijstje met overgebleven objecten die naast het huidige cluster object
            //liggen
            for (let i = 0; i < cluster.length; i++) {
                for (let j = value.length - 1; j >= 0; j--) {
                   // if (!cluster[i].geojson || !value[j].geojson) continue;
                    // eslint-disable-next-line no-undef
                    let inter = turf.lineIntersect(cluster[i].geojson, value[j].geojson);

                    //als het er naast ligt
                    if (inter.features.length > 0) {
                        //voeg het toe aan het cluster lijstje
                        cluster.push(value[j]);
                        //haal het uit de originele lijst.
                        value.splice(j, 1);
                    }
                }
            }
        }
    });

    //voor elke cluster
    let clusters = [];
    let objectsNotInClusters = [];
    clusterMap.forEach(value => {
        let first = value[0];
        let geoJSON = [];

        //voeg de geojson van alle objecten samen
        value.forEach(res => {
            let geo;

            //als het geen polygoon is, doe er een buffer omheen zodat het wel een polygoon wordt.
            if (res.geojson.type !== "Polygon") {
                // eslint-disable-next-line no-undef
                geo = turf.buffer(res.geojson, 0.001).geometry;
            } else {
                geo = res.geojson;
            }

            //maak er features van anders werkt union niet.
            geoJSON.push({
                    type: 'Feature',
                    geometry: geo
                }
            )
        });

        // eslint-disable-next-line no-undef
        geoJSON = turf.union(...geoJSON).geometry;
        // if (value.length === 1) {
        //   //cluster of length 1
        //   objectsNotInClusters.push({
        //       name: first.name,
        //       type: first.type,
        //       url: first.url,
        //       geojson: geoJSON,
        //       color: first.color,
        //       objectClass: first.objectClass
        //   })
        // } else {

          clusters.push({
            name: first.name,
            url: first.url,
            type: first.type,
            geojson: geoJSON,
            values: value,
            color: first.color,
            objectClass: first.objectClass
          });
        // }
    });

    let returnobject = {
        objectsNotInClusters: res,
        clusters: clusters,
        text : e.data.text,
        isMax : e.data.isMax,
    };
    self.postMessage(returnobject);
};
