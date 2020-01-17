/**
 * Libs
 */
import L from "leaflet";
import React from "react";
import * as turf from "@turf/turf";
const inside = require("point-in-geopolygon");
import _ from "lodash";
import "leaflet.markercluster";
import * as GeoJson from "geojson";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles.scss";
import * as Reducer from './reducer'
import {getFromCoordinates} from './helpers/searchByPoint'
import {getHexFromColor} from './helpers/utils'

/**
 * UI
 */
// import Routes from './routes/Routes'
import { Dropdown, Icon, Search } from "semantic-ui-react";
// import NavBar from "./components/NavBar";
import Loader from "./components/Loader";
import StartMessage from "./components/StartMessage";
import Results from "./components/Results";

/**
 * Assets
 */
// import './App.css';
// import KadasterImg from './assets/Logo-kadaster.png';
// import 'leaflet.markercluster/dist/MarkerCluster.css';
// import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

/**
 * Netwerk
 */
// import *  as Communicator from './network/Communicator';
import { Link, matchPath, withRouter, RouteChildrenProps } from "react-router-dom";

/**
 * Model
 */
// import ResultatenHouder from './model/ResultatenHouder';
// import ClickedResultaat from "./model/ClickedResultaat";
import { DefaultIcon, Icons } from "./components/Icons";
// import ContextMenu from "./components/ContextMenu";
// import ClusterObject from "./model/ClusterObject";

interface Props extends RouteChildrenProps {}

const App: React.FC<Props> = props => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isFetching, setIsFetching] = React.useState(false);
  const [updating, setIsUpdating] = React.useState(false);

  const [state, dispatch] = React.useReducer(Reducer.reducer, Reducer.initialState);
  // results: new ResultatenHouder(),
  // currentSelected: Communicator.getOptions()[0].value,
  // clickedOnLayeredMap: undefined,
  // objectsOverLayedOnMap: []
  React.useEffect(() => {
    mapInit();
    props.history.push("/");
    // this.state.results.subscribe(this);
    return () => {};
  }, []);

  let map: L.Map;
  let geoJsonLayer: L.GeoJSON;
  let markerGroup: any;
  let popup: L.Popup;
  let isClusteredMarkerGroup: boolean;
  const mapInit = () => {
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
    console.log(map);

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
      let match = matchPath(props.location.pathname, {
        path: "/result/:id",
        exact: true,
        strict: true
      });

      // this.state.results.clearAll();

      /**
       * Als de gebruiker op een object screen zit ga dan terug.
       */
      if (match) {
        props.history.goBack();
      } else if (props.location.pathname !== "/result") {
        props.history.push(`/result`);
      }
      setIsFetching(true);
      setSearchQuery("");

      /**
       * Krijg de bounds en geef deze ook door aan de communicator
       */
      let bounds = map.getBounds();
      getFromCoordinates(latLong.lat, latLong.lng, bounds.getNorth(), bounds.getWest(), bounds.getSouth(), bounds.getEast(), () => {
        dispatch({type: 'clustering_start'});
      }).then(res => {
        dispatch({type: 'clustering_success', results:res.results})
      }).catch(() => {
dispatch({type: 'clustering_error'})
      })
      // Communicator.getFromCoordinates( this.setResFromOutside).then(res => {

      //     }else if (res !== undefined && res !== "error") {

      //     }
      // });
    });

    //disable the zoom
    map.doubleClickZoom.disable();

    //zet de geojson layer en de functies die worden aangeroepen.
    //On each feature elke geojson object
    //point to layer bij elke marker
    geoJsonLayer = L.geoJSON([] as any, {
      onEachFeature: (feature: GeoJson.Feature, layer: L.Layer) => {
        //de punt wordt al afgehandeld door addMarker
        if (feature.geometry.type !== "Point") {
          //vindt eerst de center
          let latLong = getCenterGeoJson(feature);

          //op deze center voeg een marker toe
          // this.addMarker(feature, latLong).addTo(this.markerGroup);
          markerGroup.addLayer(makeMarker(feature, latLong));

          //laat de pop up zien als je erover gaat
          layer.on("mouseover", e => {
            //krijg eerst alle geojson objecten die dit punt bevatten.
            let contains = getAllGeoJsonObjectContainingPoint((e as any).latlng.lng, (e as any).latlng.lat);

            //hierna maak de popup content aan met html
            let content = contains
              .map((res: any) => {
                return `<b>${res.properties.getNaam()}</b><br/>
                          <span class="subTextMarker" style="color:${getHexFromColor(
                            res.properties.getColor(),
                            true
                          )};" >${res.properties.getType()} </span>`;
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
          let mouseOverFunction = (e: any) => {
            let contains = getAllGeoJsonObjectContainingPoint(e.latlng.lng, e.latlng.lat);

            let content = contains
              .map((res: any) => {
                return `<b>${res.properties.getNaam()}</b><br/>
                          <span class="subTextMarker" style="color:${getHexFromColor(
                            res.properties.getColor(),
                            true
                          )};" >${res.properties.getType()} </span>`;
              })
              .reverse()
              .join(`<br/>`);

            if (contains.length < 1) {
              map.closePopup();
              popup = undefined;
            } else if (popup) {
              popup.setLatLng(e.latlng);

              content = `<div class="popUpMouseOver">${content}<div>`;

              if (content !== popup.getContent()) {
                popup.setContent(content);
              }
            } else {
              popup = L.popup({
                autoPan: false,
                closeButton: false
              })
                .setLatLng(e.latlng)
                .setContent(content)
                .openOn(map);
            }
          };

          //Je kan ervoor kiezen om deze functionalitiet te throttelen.
          layer.on("mousemove", _.throttle(mouseOverFunction, 0));

          //sluit de pop up als je er van af gaat
          layer.on("mouseout", e => {
            map.closePopup();
            popup = undefined;
          });

          //als je er op klikt ga er dan naartoe
          layer.on("click", (e: any) => {
            //check of er meerdere lagen zijn
            let contains = getAllGeoJsonObjectContainingPoint(e.latlng.lng, e.latlng.lat);

            //als er maar één laag is
            if (contains.length < 2) {
              onClickItem(feature.properties);
            } else {
              //agrageer de opties en geef deze aan het context menu
              let options = contains.reverse().map((res: any) => {
                let func = () => {
                  onClickItem(res.properties);
                };

                return {
                  head: res.properties.getNaam(),
                  sub: res.properties.getType(),
                  subColor: res.properties.getColor(),
                  onClick: func
                };
              });

              // this.setState({
              //     clickedOnLayeredMap: {x: e.originalEvent.pageX, y: e.originalEvent.pageY},
              //     objectsOverLayedOnMap: options
              // });
            }
          });
        }
      },
      pointToLayer: addMarker,
      style: getStyle
    }).addTo(map);

    //de groep voor de markers
    isClusteredMarkerGroup = true;
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

    map.on("zoomend" as any, controlZoom as any);

    //versiebeheer
    console.info("version 1.2.1");
  };

  const makeMarker = (feature: GeoJson.Feature, latlng: L.LatLng) => {
    //maake en marker aan
    let marker = L.marker(latlng);

    //dit is de pop up en de html die tevoorschijn komt.
    marker.bindPopup(
      `<div class = "marker">
                  <b>${feature.properties.getNaam()}</b>
                  <br/>
                  <span class = "subTextMarker" style="color:${getHexFromColor(
                    feature.properties.getColor(),
                    true
                  )};">${feature.properties.getType()}</span><div>
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
    //geef deze ook aan de feature zodat wanneer je over de resultaten lijst gaat het ook op de kaart te zien is.
    feature.properties._setOnHover(onHover);

    //wanneer je er van af gaat laat het weg
    marker.on("mouseout", onHoverOff);
    feature.properties._setOnHoverOff(onHoverOff);

    //wanneer je er op klikt ga naar die marker
    marker.on("click", () => {
      onClickItem(feature.properties);
    });

    return marker;
  };
  /**
   * Krijg alle geojson objecten die in de resultatenhouder zit waar dit punt in zit.
   * @param lng
   * @param lat
   * @returns {*[]}
   */
  const getAllGeoJsonObjectContainingPoint = (lng: number, lat: number) => {
    let res: any[] = [];

    // if (this.state.results.getClickedResult()) {
    //     res = [this.state.results.getClickedResult().getAsFeature()];
    // } else if (this.state.results.getClickedCluster()) {
    //     res = this.state.results.getClickedCluster().getValuesAsFeatures();
    // } else if (this.state.results.getRightClickedRes().length > 0) {
    //     res = this.state.results.getClickedAllObjectsAsFeature();
    // } else {
    //     res = this.state.results.getSearchedAllObjectsAsFeature();
    // }

    //als het geen polygoon of multipolygoon is werkt het ook niet dus geen reden om deze mee te nemen.
    res = res.filter((res: any) => {
      return res.geometry.type === "MultiPolygon" || res.geometry.type === "Polygon";
    });

    //filter, als er -1 uitkomt bevindt het punt zich niet in de polygoon.
    return res.filter((res: any) => {
      let col = { type: "FeatureCollection", features: [res] };
      return inside.feature(col, [lng, lat]) !== -1;
    });
  };

  const controlZoom = (a: any, b: any, c: any) => {
    let zoom = map.getZoom();

    if (zoom < 10 && !isClusteredMarkerGroup) {
      isClusteredMarkerGroup = true;

      map.removeLayer(markerGroup);

      markerGroup = (L as any).markerClusterGroup({
        showCoverageOnHover: false
      });
      map.addLayer(markerGroup);

      update();
    } else if (zoom >= 10 && isClusteredMarkerGroup) {
      isClusteredMarkerGroup = false;

      map.removeLayer(markerGroup);

      markerGroup = L.featureGroup().addTo(map);

      update();
    }
  };

  /**
   * Krijg de style voor een bepaalde feature
   * @param feature
   * @returns {{color: (string|*)}}
   */
  const getStyle = (feature: any) => {
    if (feature.properties.getColor()) {
      return {
        color: getHexFromColor(feature.properties.getColor())
      };
    }
  };

  /**
   * Krijg een hex van een kleur.
   * @param color
   * @param text bool of het tekst is of niet
   * @returns {string|undefined}
   */

  const onClickItem = (res: any) => {
    //als het een cluster object is, laat dan dit clusterobject zien.
    // if (res instanceof ClusterObject) {
    if (res instanceof Error) {
      //DUMMY
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
      let center = getCenterGeoJson(res.getGeoJson());
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
      props.history.push(`/result/${res.getNaam()}`);
      // }
    }
  };
  /**
   * De functie die de kaart aanroept elke keer als deze een marker wilt toevoegen.
   **/
  const addMarker = (feature: GeoJson.Feature, latlng: L.LatLng) => {
    //maake en marker aan
    let marker = L.marker(latlng);
    markerGroup.addLayer(marker);

    //dit is de pop up en de html die tevoorschijn komt.
    marker.bindPopup(
      `<div class = "marker">
                      <b>${feature.properties.getNaam()}</b>
                      <br/>
                      <span class = "subTextMarker" style="color:${getHexFromColor(
                        feature.properties.getColor(),
                        true
                      )};">${feature.properties.getType()}</span><div>
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
    //geef deze ook aan de feature zodat wanneer je over de resultaten lijst gaat het ook op de kaart te zien is.
    feature.properties._setOnHover(onHover);

    //wanneer je er van af gaat laat het weg
    marker.on("mouseout", onHoverOff);
    feature.properties._setOnHoverOff(onHoverOff);

    //wanneer je er op klikt ga naar die marker
    marker.on("click", () => {
      onClickItem(feature.properties);
    });
    return marker;
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
   * Wordt aangeroepen wanneer er iets wordt getype
   **/
  const onSearchChange = (e: any, data: any) => {
    let text = data.value;
    console.log("on search change, data", data, map);
    if (map) map.closePopup();
    popup = undefined;

    //als de text iets heeft
    if (text) {
      dispatch({type: 'typeSearch', value: text})
      doSearch(text)

      //zet dan eerst de state

      // //haal vorige resultaten weg
      // this.state.results.clearClickedResult();
      // this.state.results.clearDoubleResults();
      // this.state.results.clearClickedCluster();
      //
      // //debounce zodat het pas wordt uitgevoerd wanneer de gebuiker stopt met typen.
      // if (!this.debounceDoSearch) {
      //     this.debounceDoSearch = _.debounce(this.doSearch, 500);
      // }

      //roep de methode aan die de zoek functie aanroept
      // this.debounceDoSearch(text);

      //Als je op het hoofscherm bent ga dan naar de result screen
      if (props.location.pathname === "/") {
        props.history.push("/result");
      }
    } else {
      //als de zoekbar text leeg is
      setSearchQuery("");
      setIsFetching(false);

      //verwijder alle resultaten
      // this.state.results.clearAll();

      let match2 = matchPath(props.location.pathname, {
        path: "/result/:id/:idd",
        exact: true,
        strict: true
      });

      //ga terug naar het hoofdscherm
      if (props.location.pathname === "/result") {
        props.history.goBack();
      } else if (match2) {
        props.history.go(-3);
      } else if (props.location.pathname !== "/") {
        props.history.go(-2);
      }
    }

    //centreer de kaart weer.
    if (map) {
      map.setView([52.20936, 5.2], 8);
    }
  };

  /**
   * Roept de communicator aan en haalt de resultaten op.
   **/
  const doSearch = _.debounce((text: string) => {
    /**
     * Roep de getMatch functie aan van de communicator
     **/
     dispatch({type:'search_start', value: text})
     // Promise.resolve().then((res: string) =>{
     //   if (res === "waiting") {
     //     dispatch({type:'clustering', value: text})
     //   }
     // })
    // Communicator.getMatch(text.trim(), this.state.currentSelected, this.setResFromOutside).then(res => {
    //     //als je een error terug krijgt, dan betekent dat je wel een antwoord hebt maar dat het niet werkt.
    //
    //     //als er waiting terug komt wacht dan.
    //     if(res === "waiting"){
    //         this.setState({
    //             updateIng : true,
    //             isFetching: false
    //         })
    //         //anders laat niets zien.
    //     }else if (res === "error") {
    //         this.setState({
    //             isFetching: false
    //         })
    //
    //         //als je undefined terug krijgt betekent het dat het een oude search query is.
    //         //Dus als het niet undefined is, betekent dat het het huidige search query is.
    //     } else if (res !== undefined) {
    //
    //         this.setState({
    //             isFetching: false
    //         });
    //         this.state.results.setResults(res);
    //     }
    // });
  }, 500);

  /**
   * Wanneer er op het kruisje in de search bar wordt geklikt.
   **/
  const handleDeleteClick = () => {
    onSearchChange({}, { value: "" });
  };

  /**
   * Wanneer er op de terug knop wordt geklikt in de applicatie aka <-- terug.
   **/
  const handleOnBackButtonClick = () => {
    /**
     * Kijk of je op een resultaat scherm bent
     */
    let match = matchPath(props.location.pathname, {
      path: "/result/:id",
      exact: true,
      strict: true
    });

    /**
     * Kijk of je bij een cluster res bent.
     */
    let match2 = matchPath(props.location.pathname, {
      path: "/result/:id/:idd",
      exact: true,
      strict: true
    });

    if (props.location.pathname === "/result") {
      //Als je op de result screen bent ga dan terug naar het hoofdscherm
      // if (this.state.results.getClickedCluster()) {
      //     this.state.results.clearClickedCluster();
      // } else {
      //     handleDeleteClick();
      // }
    } else if (match) {
      //Als je op een geklikte resultaat scherm bent ga dan terug naar de result scherm
      props.history.goBack();

      // this.state.results.clearClickedResult();
      // this.state.results.clearClickedCluster();
    } else if (match2) {
      //ga eerst een pagina terug
      props.history.goBack();
      // this.state.results.clearClickedResult();
    }
  };

  /**
   * Deze methode wordt aangeropen elke keer als de resultaten houder wordt geupdate.
   */
  const update = () => {
    // let results = this.state.results;
    //
    // this.setState({
    //     results: results
    // });
    //
    // /**
    //  * Soms wordt de update functie iets te vaak angereoepen dus debounce het.
    //  * Ik weet niet meer waarom maarja.
    //  */
    // if (!this.updateMapDebounce) {
    //     this.updateMapDebounce = _.debounce(this.updateMap, 200);
    // }
    //
    // this.updateMapDebounce(results);
  };

  /**
   * Met deze methode kan je de resultatenhouder van buitenaf aanroepen.
   * @param res
   * @param isRightClick
   */
  const setResFromOutside = (res: any, isRightClick: boolean) => {
    setIsUpdating(false);

    if (props.history.location.pathname !== "/") {
      if (isRightClick) {
        // this.state.results.setDoubleResults(res);
      } else {
        // this.state.results.setResults(res)
      }
    }
  };

  /**
   * Update de kaart.
   **/
  const updateMap = () => {
    // let results = this.state.results;

    //haal eerst alle marker weg
    map.closePopup();
    popup = undefined;
    markerGroup.clearLayers();
    geoJsonLayer.clearLayers();

    //als er een geklikt resultaat is, render dan alleen deze
    // if (this.state.results.getClickedResult()) {
    //     let feature = this.state.results.getClickedResult().getAsFeature();
    //     geoJsonLayer.addData(feature);
    // } else if (this.state.results.getClickedCluster()) {
    //     let feature = this.state.results.getClickedCluster().getValuesAsFeatures();
    //     geoJsonLayer.addData(feature);
    // } else if (this.state.results.getRightClickedRes().length > 0) {
    //     let geoJsonResults = results.getClickedAllObjectsAsFeature();
    //     geoJsonLayer.addData(geoJsonResults);
    // } else {
    //     //anders render alle opgehaalde resultaten.
    //     if (this.state.searchQuery) {
    //         let geoJsonResults = results.getSearchedAllObjectsAsFeature();
    //         geoJsonLayer.addData(geoJsonResults);
    //     }
    // }
  };

  /**
   * Wordt aangeroepen wanneer iemand op de zoekbalk klikt.
   */
  const onFocus = () => {
    // let match2 = matchPath(props.location.pathname, {
    //     path: "/result/:id/:idd",
    //     exact: true,
    //     strict: true
    // });
    //
    // let match = matchPath(props.location.pathname, {
    //     path: "/result/:id",
    //     exact: true,
    //     strict: true
    // });
    //
    // if (this.state.results.getRightClickedRes().length > 0) {
    //     this.handleDeleteClick();
    // } else if (match2) {
    //     this.state.results.clearClickedResult();
    //     this.state.results.clearClickedCluster();
    //     props.history.go(-2);
    // } else if (match && this.state.results.getClickedCluster()) {
    //     this.handleOnBackButtonClick();
    // } else if (this.state.results.getClickedResult()) {
    //     this.handleOnBackButtonClick();
    // }
  };

  /**
   * Krijg het aantal zoekresultaten
   * @returns {string}
   */
  const getZoekResultatenAantal = () => {
    let aantalZoekResultaten: number;

    // if (this.state.results.getClickedResult()) {
    //
    // } else if (this.state.results.getClickedCluster()) {
    //     aantalZoekResultaten = this.state.results.getClickedCluster().getValues().length;
    // } else if (this.state.results.getRightClickedRes().length > 0) {
    //     aantalZoekResultaten = this.state.results.getRightClickedRes().length;
    // } else {
    //     aantalZoekResultaten = this.state.results.getResults().length;
    // }
    //
    // if (aantalZoekResultaten > 989) {
    //     aantalZoekResultaten = 900 + "+";
    // }

    return aantalZoekResultaten;
  };

  let aantalZoekResultaten = getZoekResultatenAantal();

  let gearIcon;

  // //dit is de tandwiel links onder in..
  // const options = Communicator.getOptions();
  // if (options.length > 1) {
  //     gearIcon = (<Dropdown
  //         className="cogIcon"
  //         icon='cog'
  //         upward={true}
  //     >
  //         <Dropdown.Menu>
  //             <Dropdown.Header
  //                 content="Selecteer end-point"
  //             />
  //             <Dropdown.Divider
  //             />
  //             {options.map((option) => (
  //                 <Dropdown.Item
  //                     className="dropDownItem"
  //                     key={option.value} {...option}
  //                     active={this.state.currentSelected === option.value}
  //                     onClick={this.dropDownSelector}
  //                 />
  //             ))}
  //         </Dropdown.Menu>
  //     </Dropdown>);
  // }

  let icon;
  let className;

  // if (searchQuery || this.state.results.getRightClickedRes().length > 0) {
  //     icon = <Icon name='delete' link onClick={handleDeleteClick}/>;
  // } else {
  icon = <Icon name="search" />;
  // }

  if (!state.isClustering) {
    className = "mapHolder";
  } else {
    className = "mapHolderLoading";
  }
  return (
    <section className="App">
      <div className="brtInfo">
        <Link
          to="/"
          onClick={() => {
            handleDeleteClick();
          }}
        >
          <div className="header"></div>
        </Link>
        <div className="searchBar">
          <Search
            input={{ fluid: true }}
            value={
              // this.state.results.getRightClickedRes().length > 1 ? "[ Kaartresultaten worden getoond ]" : this.state.searchQuery
              searchQuery
            }
            noResultsMessage="Geen resultaat"
            icon={icon}
            onSearchChange={onSearchChange}
            open={false}
            onFocus={onFocus}
          />
        </div>
        <div className="resultsContainer">
          {
            //  <NavBar
            //     loading={this.state.isFetching}
            //     onBack={this.handleOnBackButtonClick}
            //     aantalZoekResultaten={aantalZoekResultaten}
            // />
          }
          <div className="loaderDiv">
            <Loader loading={state.isFetching} />
          </div>
          <div className="resultPartContainer">
            {
              !state.searchResults.length && !state.searchQuery && <StartMessage/>
            }
            { state.searchResults.length && <Results results={state.searchResults} onClickItem={onClickItem} onMouseEnterItem={() => {console.log('on mouse enter')}} onMouseLeaveItem={() => {console.log('on mouse leave')}}/>}
            {
              // <Routes
              //     res={this.state.results}
              //     clickedResult={this.state.results.getClickedResult()}
              //     onClickItem={onClickItem}
              //     getHexFromColor={getHexFromColor}
              // />
            }
          </div>
        </div>
        <div className="footer">
          {gearIcon}
          <a href="https://zakelijk.kadaster.nl/brt" target="_blank" rel="noreferrer noopener">
            Lees meer over de Basisregistratie Topografie (BRT)
          </a>
        </div>
      </div>
      <div className={className} onContextMenu={e => e.preventDefault()}>
        <Loader loading={state.isClustering} />
        <div id="map" />
      </div>
      {
        // <ContextMenu
        //     coordinates={this.state.clickedOnLayeredMap}
        //     resetCoordinates={this.resetClickedOnLayeredMap}
        //     objectsOverLayedOnMap={this.state.objectsOverLayedOnMap}
        //     getHexFromColor={getHexFromColor}
        // />
      }

      <ToastContainer />
    </section>
  );
};

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
export default withRouter(App);
