/**
 * Libs
 */
import L from "leaflet";
import * as turf from "@turf/turf";
const inside = require("point-in-geopolygon");
import _ from "lodash";
import "leaflet.markercluster";
import * as GeoJson from "geojson";
import "react-toastify/dist/ReactToastify.css";
import "./styles.scss";
import * as Reducer from "./reducer";
import { getHexFromColor, objectOrClusterToGeojson, getAllObjectsOrClustersAsFeature } from "./helpers/utils";
import { DefaultIcon, Icons } from "./components/Icons";
/**
 * Assets
 */
// import './App.css';
// import KadasterImg from './assets/Logo-kadaster.png';
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

let map: L.Map;
let geoJsonLayer: L.GeoJSON;
let markerGroup: any;
let popup: L.Popup;

// export interface FeatureMouseProperties {
//   onMouseOut?: () => void
//   onMouseOver?: () => void
// }
export type FeatureProperties = Reducer.BrtCluster | Reducer.BrtObject;
export type BrtFeature = GeoJson.Feature<GeoJson.Geometry, FeatureProperties>;


export function init(opts: {
  onContextSearch: (context: {
    lat: number;
    lng: number;
    north: number;
    east: number;
    south: number;
    west: number;
  }) => void;
  onZoomChange: (zoomLevel: number) => void;
}) {
  //opties van de kaart
  map = L.map("map", {
    minZoom: 8,
    center: [52.20936, 5.2],
    zoom: 8,
    maxBounds: [
      [56, 10],
      [49, 0]
    ]
  });
  (window as any).map = map; //for debugging
  //zet de kaart tile layer aka de brt
  L.tileLayer(
    "https://geodata.nationaalgeoregister.nl/tiles/service/wmts/brtachtergrondkaart/EPSG:3857/{z}/{x}/{y}.png",
    {
      attribution:
        'Kaartgegevens &copy; <a href="https://www.kadaster.nl/" target="_blank" rel = "noreferrer noopener">Kadaster</a> | <a href="https://www.verbeterdekaart.nl" target="_blank" rel = "noreferrer noopener">Verbeter de kaart</a> '
    }
  ).addTo(map);

  //Wanneer je recht klikt op de kaart krijg dan alle locaties terug er om heen.
  map.on("contextmenu", e => {
    let latLong = (e as any).latlng;

    //close pop ups van de kaart
    map.closePopup();
    popup = undefined;

    /**
     * Kijk of de gebruiker op de ObjectScreen zit
     */
    // let match = matchPath(props.location.pathname, {
    //   path: "/result/:id",
    //   exact: true,
    //   strict: true
    // });

    // this.state.results.clearAll();

    /**
     * Als de gebruiker op een object screen zit ga dan terug.
     */
    // if (match) {
    //   props.history.goBack();
    // } else if (props.location.pathname !== "/result") {
    //   props.history.push(`/result`);
    // }
    // setIsFetching(true);
    // setSearchQuery("");

    /**
     * Krijg de bounds en geef deze ook door aan de communicator
     */
    let bounds = map.getBounds();
    opts.onContextSearch({
      lat: latLong.lat,
      lng: latLong.lng,
      north: bounds.getNorth(),
      east: bounds.getEast(),
      south: bounds.getSouth(),
      west: bounds.getWest()
    });
  });

  //disable the zoom
  map.doubleClickZoom.disable();

  //zet de geojson layer en de functies die worden aangeroepen.
  //On each feature elke geojson object
  //point to layer bij elke marker
  geoJsonLayer = L.geoJSON([] as any, {
    /**
     * Wordt aangeroepen elke keer als er een geojson object wordt getekend.
     **/
    onEachFeature: handleGeoJsonLayerDrawing,
    pointToLayer: addMarker as any,
    style: getStyle as any
  }).addTo(map);

  //de groep voor de markers
  markerGroup = (L as any).markerClusterGroup({
    showCoverageOnHover: false
  });
  map.addLayer(markerGroup);

  //dit is voor mobiele applicatie. Als er gesleept wordt sluit dan het context menu.
  map.on("dragstart", () => {
    // if (this.state.clickedOnLayeredMap) {
    //     this.setState({clickedOnLayeredMap: undefined});
    // }
  });
  map.on("zoomend" as any, () => {
    opts.onZoomChange(map.getZoom());
  });
  // map.on("zoomend" as any, controlZoom as any);
}

export function closePopup() {
  if (map) map.closePopup();
  popup = undefined;
}
export function centerMap() {
  map.setView([52.20936, 5.2], 8);
}
export function updateMap(opts: {
  selectedObject?: Reducer.BrtCluster | Reducer.BrtObject;
  searchResults?: Reducer.State["searchResults"];
}) {
  // let results = state.searchResults;
  //haal eerst alle marker weg
  map.closePopup();
  popup = undefined;
  markerGroup.clearLayers();
  geoJsonLayer.clearLayers();
  // als er een geklikt resultaat is, render dan alleen deze
  if (opts.selectedObject) {
    geoJsonLayer.addData(objectOrClusterToGeojson(opts.selectedObject));
  } else if (opts.searchResults) {
    geoJsonLayer.addData(getAllObjectsOrClustersAsFeature(opts.searchResults) as any);
  }
}

export function toggleClustering(toggle: boolean) {
  if (toggle) {
    map.removeLayer(markerGroup);

    markerGroup = (L as any).markerClusterGroup({
      showCoverageOnHover: false
    });
    map.addLayer(markerGroup);
  } else {
    map.removeLayer(markerGroup);

    markerGroup = L.featureGroup().addTo(map);
  }
}

const addMarkerForNonPoint = (feature: BrtFeature, latlng: L.LatLng) => {
  //maak een marker aan
  let marker = L.marker(latlng);
  marker.feature = {
    type: "Feature",
    geometry: { type: "Point", coordinates: [latlng.lat, latlng.lng] },
    properties: feature.properties
  };
  //dit is de pop up en de html die tevoorschijn komt.
  marker.bindPopup(
    `<div class = "marker">
                  <b>${feature.properties.name}</b>
                  <br/>
                  <span class = "subTextMarker" style="color:${getHexFromColor(feature.properties.color, true)};">${
      feature.properties.type
    }</span><div>
          `,
    {
      autoPan: false,
      closeButton: false
    }
  );

  //methode die worden aangeroepen om de marker te openen
  let onHover = function(this: L.Marker) {
    this.openPopup();
    this.setIcon(Icons);
  }.bind(marker);

  //methode die wordt aangeroepen om de marker te sluiten
  let onHoverOff = function(this: L.Marker) {
    this.closePopup();
    this.setIcon(DefaultIcon);
  }.bind(marker);

  //wanneer je over de marker gaat laat de pop up zien
  marker.on("mouseover", onHover);

  //wanneer je er van af gaat laat het weg
  marker.on("mouseout", onHoverOff);
  // feature.properties._setOnHoverOff(onHoverOff);

  //wanneer je er op klikt ga naar die marker
  marker.on("click", () => {
    onClickItem(feature.properties);
  });

  return marker;
};

const getAllFeaturesFromLeaflet = () => {
  return geoJsonLayer.getLayers().map((l: any) => l.feature) as BrtFeature[];
};

export function findMarkerByUrl(url: string) {
  return markerGroup.getLayers().find((l: any) => {
    const feature: BrtFeature = l.feature;
    return feature.properties.url === url;
  });
}

/**
 * Krijg alle geojson objecten die in de resultatenhouder zit waar dit punt in zit.
 */
const getAllGeoJsonObjectContainingPoint = (lng: number, lat: number) => {
  return getAllFeaturesFromLeaflet().filter(res => {
    if (res.geometry.type !== "MultiPolygon" && res.geometry.type !== "Polygon") return false;
    let col = { type: "FeatureCollection", features: [res] };
    //filter, als er -1 uitkomt bevindt het punt zich niet in de polygoon.
    return inside.feature(col, [lng, lat]) !== -1;
  });

  // if (this.state.results.getClickedResult()) {
  //     res = [this.state.results.getClickedResult().getAsFeature()];
  // } else if (this.state.results.getClickedCluster()) {
  //     res = this.state.results.getClickedCluster().getValuesAsFeatures();
  // } else if (this.state.results.getRightClickedRes().length > 0) {
  //     res = this.state.results.getClickedAllObjectsAsFeature();
  // } else {
  //     res = this.state.results.getSearchedAllObjectsAsFeature();
  // }

  // //als het geen polygoon of multipolygoon is werkt het ook niet dus geen reden om deze mee te nemen.
  // res = res.filter((res: any) => {
  //   return res.geometry.type === "MultiPolygon" || res.geometry.type === "Polygon";
  // });
  //
  //
  // return res.filter((res: any) => {
  //   let col = { type: "FeatureCollection", features: [res] };
  //   return inside.feature(col, [lng, lat]) !== -1;
  // });
};

/**
 * Krijg de style voor een bepaalde feature
 * @param feature
 */
const getStyle = (feature: { properties: Reducer.BrtObject | Reducer.BrtCluster }) => {
  if (feature.properties.color) {
    return {
      color: getHexFromColor(feature.properties.color)
    };
  }
};

/**
 * Krijg een hex van een kleur.
 * @param color
 * @param text bool of het tekst is of niet
 */

const onClickItem = (res: Reducer.BrtObject | Reducer.BrtCluster) => {
  //als het een cluster object is, laat dan dit clusterobject zien.
  if ("values" in res) {
    // this.state.results.setClickedCluster(res);
    // props.history.push(`/result/${res.getNaam()}`);
  } else {
    //maak een nieuwe clickedresultaat
    // let clickedRes = new ClickedResultaat(res);

    // this.setState({
    //     clickedOnLayeredMap: undefined
    // });

    //zet in de resultatenhouder de clickedresultaat.
    // this.state.results.setClickedResult(clickedRes);

    //krijg de center van de plek waar je naartoe wilt.
    let center = getCenterGeoJson(res.geojson);
    let zoom = map.getZoom();

    //als de gebruiker ingezoomt is, zoom dan niet uit.
    if (zoom < 10) {
      zoom = 10;
    }

    //zet de view.
    map.setView(center, zoom);

    //kijk nog even welke url je moet pushen.
    // if (this.state.results.getClickedCluster()) {
    //     props.history.push(`/result/${res.getNaam()}/${res.getNaam()}`);
    // } else {
    // props.history.push(`/result/${res.getNaam()}`);
    // }
  }
};

/**
 * Wordt aangeroepen elke keer als er een geojson object wordt getekend.
 **/
const handleGeoJsonLayerDrawing = (
  feature: GeoJson.Feature<GeoJson.Geometry, Reducer.BrtCluster | Reducer.BrtCluster>,
  layer: L.Layer
) => {

  if (feature.geometry.type === "Point") return

  //vindt eerst de center
  let latLong = getCenterGeoJson(feature);

  //op deze center voeg een marker toe
  markerGroup.addLayer(addMarkerForNonPoint(feature, latLong));

  //laat de pop up zien als je erover gaat
  layer.on("mouseover", e => {
    //krijg eerst alle geojson objecten die dit punt bevatten.
    let contains = getAllGeoJsonObjectContainingPoint((e as any).latlng.lng, (e as any).latlng.lat);
    //hierna maak de popup content aan met html
    let content = contains
      .map((res: any) => {
        return `<b>${res.properties.name}</b><br/>
                    <span class="subTextMarker" style="color:${getHexFromColor(res.properties.color, true)};" >${
          res.properties.type
        } </span>`;
      })
      .reverse()
      .join(`<br/>`);

    content = `<div class="popUpMouseOver">${content}<div>`;

    //als er geen dingen zijn die dit punt bevatten sluit dan de popup
    if (contains.length < 1) {
      map.closePopup();
      popup = undefined;
    } else if (!popup) {
      //als er nog geen popup open is open dan deze.
      popup = L.popup({
        autoPan: false,
        closeButton: false
      })
        .setLatLng((e as any).latlng)
        .setContent(content)
        .openOn(map);
    }
  });

  //dit is de functie die wordt aangeroepen als je over een object heen gaat met je muis.
  let mouseOverFunction: L.LeafletEventHandlerFn = e => {
    let contains = getAllGeoJsonObjectContainingPoint((e as any).latlng.lng, (e as any).latlng.lat);

    let content = contains
      .map(res => {
        return `<b>${res.properties.name}</b><br/>
                    <span class="subTextMarker" style="color:${getHexFromColor(res.properties.color, true)};" >${
          res.properties.type
        } </span>`;
      })
      .reverse()
      .join(`<br/>`);

    if (contains.length < 1) {
      map.closePopup();
      popup = undefined;
    } else if (popup) {
      popup.setLatLng((e as any).latlng);

      content = `<div class="popUpMouseOver">${content}<div>`;

      if (content !== popup.getContent()) {
        popup.setContent(content);
      }
    } else {
      popup = L.popup({
        autoPan: false,
        closeButton: false
      })
        .setLatLng((e as any).latlng)
        .setContent(content)
        .openOn(map);
    }
  };

  //Je kan ervoor kiezen om deze functionalitiet te throttelen.
  layer.on("mousemove", _.throttle(mouseOverFunction, 10));

  //sluit de pop up als je er van af gaat
  layer.on("mouseout", () => {
    map.closePopup();
    popup = undefined;
  });

  //als je er op klikt ga er dan naartoe
  layer.on("click", (e: any) => {
    //check of er meerdere lagen zijn
    let contains = getAllGeoJsonObjectContainingPoint(e.latlng.lng, e.latlng.lat);

    //als er maar één laag is
    if (contains.length < 2) {
      onClickItem(feature.properties as any);
    } else {
      //agrageer de opties en geef deze aan het context menu
      let options = contains.reverse().map(res => {
        let func = () => {
          onClickItem(res.properties);
        };

        return {
          head: res.properties.name,
          sub: res.properties.type,
          subColor: res.properties.color,
          onClick: func
        };
      });

      // this.setState({
      //     clickedOnLayeredMap: {x: e.originalEvent.pageX, y: e.originalEvent.pageY},
      //     objectsOverLayedOnMap: options
      // });
    }
  });
  // }
};

/**
 * De functie die de kaart aanroept elke keer als deze een marker wilt toevoegen.
 **/
const addMarker = (feature: GeoJson.Feature, latlng: L.LatLng):void => {
  //maak een marker aan
  let marker = L.marker(latlng);

   marker.feature = {
     type: "Feature",
     geometry: { type: "Point", coordinates: [latlng.lat, latlng.lng] },
     properties: feature.properties
   };
  markerGroup.addLayer(marker);

  //dit is de pop up en de html die tevoorschijn komt.
  marker.bindPopup(
    `<div class = "marker">
                      <b>${feature.properties.name} </b>
                      <br/>
                      <span class = "subTextMarker" style="color:${getHexFromColor(feature.properties.color, true)};">${
      feature.properties.type
    }</span><div>
              `,
    {
      autoPan: false,
      closeButton: false
    }
  );

  //methode die worden aangeroepen om de marker te openen
  let onHover = function(this: L.Marker) {
    this.openPopup();
    this.setIcon(Icons);
  }.bind(marker);

  //methode die wordt aangeroepen om de marker te sluiten
  let onHoverOff = function(this: L.Marker) {
    this.closePopup();
    this.setIcon(DefaultIcon);
  }.bind(marker);

  //wanneer je over de marker gaat laat de pop up zien
  marker.on("mouseover", onHover);
  // //geef deze ook aan de feature zodat wanneer je over de resultaten lijst gaat het ook op de kaart te zien is.
  // feature.properties.onHover = onHover;

  //wanneer je er van af gaat laat het weg
  marker.on("mouseout", onHoverOff);
  // feature.properties.onHoverOff = onHoverOff;

  //wanneer je er op klikt ga naar die marker
  marker.on("click", () => {
    onClickItem(feature.properties as any);
  });
};

/**
 * Deze methode kan worden aangeroepen om het context menu te laten verdrwijnen.
 */
const resetClickedOnLayeredMap = () => {
  // this.setState({
  //     clickedOnLayeredMap: undefined
  // });
};

/**
 * Wanneer iemand op een resultaat klikt voer dan deze methode uit.
 **/

/**
 * Initeert de kaart.
 **/

const getCenterGeoJson = (geojson: any): L.LatLng => {
  //kijk eerst naar de center
  let centroid = turf.center(geojson);

  //maak er een geojson en feature van.
  let geoJsonFeature = geojson.geometry ? geojson : { type: "Feature", geometry: geojson };
  geojson = geojson.geometry ? geojson.geometry : geojson;

  //Multipolygon werkt niet met turf.booleanContains.
  if (geojson.type !== "MultiPolygon") {
    //als deze niet in het geojson object ligt, gebruik dan de centroid
    if (!turf.booleanContains(geoJsonFeature, centroid)) {
      centroid = turf.centroid(geoJsonFeature);
    }

    //anders gebruik point on feature
    if (!turf.booleanContains(geojson, centroid)) {
      centroid = turf.pointOnFeature(geojson);
    }
  } else {
    //gebruik inside voor multipolygon om te controlleren.
    let lon = centroid.geometry.coordinates[0];
    let lat = centroid.geometry.coordinates[1];
    let col = { type: "FeatureCollection", features: [geoJsonFeature] };
    let isInside = inside.feature(col, [lon, lat]) !== -1;

    if (!isInside) {
      centroid = turf.centroid(geojson);
    }

    lon = centroid.geometry.coordinates[0];
    lat = centroid.geometry.coordinates[1];
    col = { type: "FeatureCollection", features: [geoJsonFeature] };
    isInside = inside.feature(col, [lon, lat]) !== -1;

    if (!isInside) {
      centroid = turf.pointOnFeature(geojson);
    }
  }

  //krijg de lat en long
  let lon = centroid.geometry.coordinates[0];
  let lat = centroid.geometry.coordinates[1];

  return L.latLng(lat, lon);
};
