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
  | { type: "context_search_clustering" }
  | { type: "setMapClustered"; value: boolean }
  | { type: "zoomChange"; value: number }
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
    case "typeSearch":
      state.searchResults = [];

      state.selectedObject = undefined;
      state.selectedCluster = undefined;
      state.searchQuery = action.value;
      state.isFetching = !!action.value;
      return state;
    case "context_search_start":
      state.isFetching = true;
      state.isClustering = false;
      state.searchQuery = ""; //context search, so want search query empty
      state.contextQuery = action.value
      return state;
    case "context_search_start":
      state.isClustering = true;
      state.isFetching = false;
      break;
    case "context_search_error":
      state.isFetching = false;
      state.isClustering = false;
      return state;
    case "context_search_success":
      state.isFetching = false;
      state.isClustering = false;
      state.searchResults = action.results;
      return state;

    case "search_start":
      state.searchResults = [];
      state.selectedObject = undefined;
      state.selectedCluster = undefined;
      state.searchQuery = action.value;
      state.isFetching = !!action.value;
      return state;
    case "reset":
      return initialState;
    case "setMapClustered":
      state.mapClustered = action.value;
      return state;
    case "zoomChange":
      state.zoomLevel = action.value;
      return state;
    default:
      return state;
  }
});
