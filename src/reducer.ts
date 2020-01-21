import React from "react";
import * as immer from "immer";

export interface State {
  searchQuery: string;
  contextQuery: ContextQuery;
  isFetching: boolean; // Fetching results from API
  isClustering: boolean; //Clustering of objects
  searchResults: Array<BrtObject | BrtCluster>;
  selectedCluster: BrtCluster;
  selectedObject: BrtObject;
  mapClustered: boolean;
  zoomLevel: number;
}
export const initialState: State = {
  searchQuery: "",
  isFetching: false,
  contextQuery: undefined,
  isClustering: false,
  searchResults: [],
  selectedCluster: undefined,
  selectedObject: undefined,
  mapClustered: true,
  zoomLevel: 8 //default leaflet zoom level
};

export type Action =
  | { type: "typeSearch"; value: string }
  | { type: "search_start"; value: string }
  | { type: "search_success"; value: string; results: State["searchResults"] }
  | { type: "search_error"; value: string }
  | { type: "context_search_start", value: ContextQuery }
  | { type: "context_search_success"; results: State["searchResults"] }
  | { type: "context_search_error" }
  | { type: "clustering" }
  | { type: "setMapClustered"; value: boolean }
  | { type: "zoomChange"; value: number }
  | { type: "selectCluster"; value: BrtCluster }
  | { type: "selectObject"; value: BrtObject }
  | { type: "resetSelectedCluster"; }
  | { type: "resetSelectedObject";  }
  // | { type: "clustering_success"; results: State["searchResults"] }
  // | { type: "clustering_error" }
  | { type: "reset" };

//Single element
export interface BrtObject {
  url: string;
  name: string;
  type: string;
  geojson: any;
  color: string;
  objectClass: string; //used for colors
}

//Grouped elements (by named and geolocation) using worker
export interface BrtCluster {
  url: string;
  name: string;
  type: string;
  geojson: any;
  color: string;
  objectClass: string; //used for colors
  values: BrtObject[];
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
      state.contextQuery = action.value
      state.searchResults = []
      state.selectedObject = null;
      state.selectedCluster = null
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
      return state;
    case "selectObject":
      state.selectedObject = action.value;
      return state;
    case "resetSelectedCluster":
      state.selectedCluster = null;
      return state;
    case "resetSelectedObject":
      state.selectedObject = null;
      return state;
    case "zoomChange":
      state.zoomLevel = action.value;
      if (state.zoomLevel < 10 && !state.mapClustered) state.mapClustered = true
      if (state.zoomLevel >= 10 && state.mapClustered) state.mapClustered = false
      return state;
    default:
      return state;
  }
});
