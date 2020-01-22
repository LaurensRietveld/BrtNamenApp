import React from "react";
import * as immer from "immer";

export interface State {
  clickedLayer: {x: number, y: number, values: Array<SingleObject | GroupedObject>}
  contextQuery: ContextQuery;
  isClustering: boolean; //Clustering of objects
  isFetching: boolean; // Fetching results from API
  mapClustered: boolean;
  searchQuery: string;
  searchResults: Array<SingleObject | GroupedObject>;
  selectedCluster: GroupedObject;
  selectedObject: SingleObject;
  zoomLevel: number;
}
export const initialState: State = {
  clickedLayer: undefined,
  contextQuery: undefined,
  isClustering: false,
  isFetching: false,
  mapClustered: true,
  searchQuery: "",
  searchResults: [],
  selectedCluster: undefined,
  selectedObject: undefined,
  zoomLevel: 8, //default leaflet zoom level
};

export type Action =
  | { type: "clickLayer", value: {x: number, y:number, values:Array<SingleObject | GroupedObject> }}
  | { type: "closeClickedLayer" }
  | { type: "clustering" }
  | { type: "context_search_error" }
  | { type: "context_search_start"; value: ContextQuery }
  | { type: "context_search_success"; results: State["searchResults"] }
  | { type: "reset" }
  | { type: "resetSelectedCluster" }
  | { type: "resetSelectedObject" }
  | { type: "search_error"; value: string }
  | { type: "search_start"; value: string }
  | { type: "search_success"; value: string; results: State["searchResults"] }
  | { type: "selectCluster"; value: GroupedObject }
  | { type: "selectObject"; value: SingleObject }
  | { type: "setMapClustered"; value: boolean }
  | { type: "typeSearch"; value: string }
  | { type: "zoomChange"; value: number }

//Single element
export interface SingleObject {
  url: string;
  name: string;
  type: string;
  geojson: any;
  color: string;
  objectClass: string; //used for colors
}

//Grouped elements (by named and geolocation) using worker
export interface GroupedObject {
  url: string;
  name: string;
  type: string;
  geojson: any;
  color: string;
  objectClass: string; //used for colors
  values: SingleObject[];
}
export interface ContextQuery {
  lat: number;
  lng: number;
  north: number;
  east: number;
  south: number;
  west: number;
}
export const reducer: React.Reducer<State, Action> = immer.produce((state: State, action: Action) => {
  console.info("%c " + action.type, "color: #0095ff");
  switch (action.type) {
    case "typeSearch":
      state.searchResults = [];
      state.selectedObject = undefined;
      state.selectedCluster = undefined;
      state.searchQuery = action.value;
      state.isFetching = !!action.value;
      return state;
    case "search_start":
      state.searchResults = [];
      state.selectedObject = undefined;
      state.selectedCluster = undefined;
      state.isFetching = !!action.value;
      return state;
    case "search_error":
      state.isFetching = false;
      state.isClustering = false;
      return state;
    case "search_success":
      state.isFetching = false;
      state.isClustering = false;
      state.searchResults = action.results;
      return state;

    case "context_search_start":
      state.isFetching = true;
      state.isClustering = false;
      state.searchQuery = ""; //context search, so want search query empty
      state.contextQuery = action.value;
      state.searchResults = [];
      state.selectedObject = undefined;
      state.selectedCluster = undefined;
      return state;
    case "context_search_error":
      state.isFetching = false;
      state.isClustering = false;
      return state;
    case "context_search_success":
      state.isFetching = false;
      state.isClustering = false;
      state.searchResults = action.results;
      return state;
    case "reset":
      return initialState;
    case "setMapClustered":
      state.mapClustered = action.value;
      return state;
    case "selectCluster":
      state.selectedCluster = action.value;
      state.clickedLayer = undefined//might be selected from layer popup
      return state;
    case "selectObject":
      state.selectedObject = action.value;
      state.clickedLayer = undefined//might be selected from layer popup
      return state;
    case "resetSelectedCluster":
      state.selectedCluster = undefined;
      return state;
    case "resetSelectedObject":
      state.selectedObject = undefined;
      return state;
    case "clickLayer":
      state.clickedLayer = action.value;
      return state;
    case "closeClickedLayer":
      state.clickedLayer = undefined
      return state;
    case "zoomChange":
      state.zoomLevel = action.value;
      if (state.zoomLevel < 10 && !state.mapClustered) state.mapClustered = true;
      if (state.zoomLevel >= 10 && state.mapClustered) state.mapClustered = false;
      return state;
    default:
      return state;
  }
});
