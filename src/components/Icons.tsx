import L from "leaflet";
const MarkerGold = require("../assets/GoldMarker.png");
const MarkerShadow = require("../assets/marker-shadow.png");

/**
 * Dit is de goude leaflet icoon
 */
export const Icons = new L.Icon.Default({
    iconUrl: MarkerGold,
    iconRetinaUrl : MarkerGold,
    imagePath: " ",
    shadowUrl : MarkerShadow});

/**
 * Dit is de default leaflet icoon
 */
export const DefaultIcon = new L.Icon.Default();
