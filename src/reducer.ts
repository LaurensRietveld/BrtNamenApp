import React from "react";
import * as immer from "immer";
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

export interface State {
  searchQuery: string;
  isFetching: boolean; // Fetching results from API
  isClustering: boolean; //Clustering of objects
  searchResults: Array<BrtObject | BrtCluster>;
  selectedCluster: BrtCluster;
  selectedObject: BrtObject;
}
export const initialState: State = {
  searchQuery: "",
  isFetching: false,
  isClustering: false,
  searchResults: [],
  selectedCluster: undefined,
  selectedObject: undefined
};

export type Action =
  | { type: "typeSearch"; value: string }
  | { type: "search_start"; value: string }
  | { type: "search_success"; value: string; results: State["searchResults"] }
  | { type: "search_error"; value: string }
  | { type: "clustering_start" }
  | { type: "clustering_success"; results: State["searchResults"] }
  | { type: "clustering_error" }
  | { type: "reset" };

export const reducer: React.Reducer<State, Action> = immer.produce((state: State, action: Action) => {
  switch (action.type) {
    case "typeSearch":
      state.searchResults = [];
      state.selectedObject = undefined;
      state.selectedCluster = undefined;
      state.searchQuery = action.value;
      state.isFetching = !!action.value;
      return state;
    case "clustering_start":
      state.isFetching = false;
      state.isClustering = true;
      return state;
    case "clustering_error":
      state.isFetching = false;
      state.isClustering = false;
      return state;
    case "clustering_success":
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
    default:
      return state;
  }
});
