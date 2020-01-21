/**
 * Libs
 */
import * as LeafletUtils from "./leaflet";
import React from "react";
import _ from "lodash";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles.scss";
import * as Reducer from "./reducer";
import { getFromCoordinates } from "./helpers/searchByPoint";
import { search } from "./helpers/searchByText";

/**
 * UI
 */
// import Routes from './routes/Routes'
import { Icon, Search } from "semantic-ui-react";
// import NavBar from "./components/NavBar";
import Loader from "./components/Loader";
import StartMessage from "./components/StartMessage";
import Results from "./components/Results";
import Result from "./components/Result";
import ResultsBar from "./components/ResultsBar";

/**
 * Assets
 */
// import './App.css';
// import KadasterImg from './assets/Logo-kadaster.png';
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

let _debug: any = (window as any)._debug || {};
(window as any)._debug = _debug;
const App: React.FC = () => {
  const [state, dispatch] = React.useReducer(Reducer.reducer, Reducer.initialState);
  //Set state in window for debugging
  _debug.state = state;
  _debug.dispatch = dispatch;

  /**
   * Effect that runs on-mount only
   */
  React.useEffect(() => {
    LeafletUtils.init({
      onZoomChange: zoom => {
        dispatch({ type: "zoomChange", value: zoom });
      },
      onContextSearch: ctx => {
        dispatch({ type: "context_search_start", value: ctx });
      },
      onClick: el => {
        if ("values" in el) {
          dispatch({ type: "selectCluster", value: el });
        } else {
          dispatch({ type: "selectObject", value: el });
        }
      }
    });
    // //Set default query for debugging
    // setTimeout(() => {
    //   const text = "Bussum";
    //   dispatch({ type: "typeSearch", value: text });
    //   doSearch(text, dispatch);
    // }, 200);
    return () => {};
  }, []);

  /**
   * Trigger context query
   */
  React.useEffect(() => {
    if (state.contextQuery) {
      getFromCoordinates(state.contextQuery, () => {
        dispatch({ type: "clustering" });
        // dispatch({type: 'clustering_start'});
      })
        .then(res => {
          dispatch({ type: "context_search_success", results: res.results });
        })
        .catch(() => {
          dispatch({ type: "context_search_error" });
        });
    }
  }, [state.contextQuery]);

  /**
   * Update leaflet when search results or selection changes
   */
  React.useEffect(() => {
    if (state.selectedObject) {
      LeafletUtils.updateMap({
        selectedObject: state.selectedObject,
        updateZoom: true
      });
    } else {
      LeafletUtils.updateMap({
        searchResults: state.selectedCluster?.values || state.searchResults,
        updateZoom: true
      });
    }
    // }
    return () => {};
  }, [state.searchResults, state.selectedCluster, state.selectedObject]);

  /**
   * Update leaflet when clustering setting changes
   */
  React.useEffect(() => {
    LeafletUtils.toggleClustering(state.mapClustered);
    LeafletUtils.updateMap({
      searchResults: state.searchResults,
      selectedObject: state.selectedCluster || state.selectedObject,
      updateZoom: false
    });
  }, [state.mapClustered]);

  const onSearchChange = (_e: any, data: any) => {
    let text = data.value;
    LeafletUtils.closePopup();

    dispatch({ type: "typeSearch", value: text });
    doSearch(text, dispatch);

    //centreer de kaart weer.
    LeafletUtils.centerMap();
  };

  const handleSearchTextDeleteClick = () => {
    dispatch({ type: "reset" });
  };

  const onBack = () => {
    if (state.selectedObject) {
      dispatch({ type: "resetSelectedObject" });
    } else if (state.selectedCluster) {
      dispatch({ type: "resetSelectedCluster" });
    } else {
      dispatch({ type: "reset" });
    }
  };
  let numResults: number;
  if (state.selectedObject || state.isFetching) {
    //no result count to show
  } else if (state.selectedCluster) {
    numResults = state.selectedCluster.values.length;
  } else if (state.searchQuery || state.contextQuery) {
    numResults = state.searchResults.length;
  }
  return (
    <section className="App">
      <div className="brtInfo">
        {
          // <Link
          //   to="/"
          //   onClick={() => {
          //     handleDeleteClick();
          //   }}
          // >
          //   <div className="header"></div>
          // </Link>
        }
        <div className="searchBar">
          <Search
            input={{ fluid: true }}
            value={state.contextQuery ? "[ Kaartresultaten worden getoond ]" : state.searchQuery}
            noResultsMessage="Geen resultaat"
            icon={
              state.searchQuery || state.contextQuery ? (
                <Icon name="delete" link onClick={handleSearchTextDeleteClick} />
              ) : (
                <Icon name="search" />
              )
            }
            onSearchChange={onSearchChange}
            open={false}
          />
        </div>
        <div className="resultsContainer">
          {!!(state.searchQuery || state.searchResults.length) && (
            <ResultsBar loading={state.isFetching} onBack={onBack} numberSearchResults={numResults} />
          )}
          <div className="loaderDiv">
            <Loader loading={state.isFetching} />
          </div>
          <div className="resultPartContainer">
            <ResultsBody
              searchQuery={state.searchQuery}
              contextQuery={state.contextQuery}
              dispatch={dispatch}
              searchResults={state.searchResults}
              selectedObject={state.selectedObject}
              selectedCluster={state.selectedCluster}
            />
          </div>
        </div>
        <div className="footer">
          <a href="https://zakelijk.kadaster.nl/brt" target="_blank" rel="noreferrer noopener">
            Lees meer over de Basisregistratie Topografie (BRT)
          </a>
        </div>
      </div>
      <div className={state.isClustering ? "mapHolderLoading" : "mapHolder"} onContextMenu={e => e.preventDefault()}>
        <Loader loading={state.isClustering} />
        <div id="map" />
      </div>

      <ToastContainer />
    </section>
  );
};

interface Props {
  searchQuery: string;
  searchResults: Reducer.State["searchResults"];
  dispatch: React.Dispatch<Reducer.Action>;
  selectedObject: Reducer.BrtObject;
  selectedCluster: Reducer.BrtCluster;
  contextQuery: Reducer.State["contextQuery"];
}
const ResultsBody: React.FC<Props> = props => {
  if (!props.searchResults.length && !props.searchQuery && !props.contextQuery) {
    return <StartMessage />;
  }
  if (props.selectedObject) {
    return <Result value={props.selectedObject} />;
  }
  if (props.selectedCluster) {
    return (
      <Results
        results={props.selectedCluster.values}
        onClickItem={(res: Reducer.BrtObject | Reducer.BrtCluster) => {
          //als het een cluster object is, laat dan dit clusterobject zien.
          if ("values" in res) {
            props.dispatch({ type: "selectCluster", value: res });
          } else {
            props.dispatch({ type: "selectObject", value: res });
          }
        }}
        onMouseEnterItem={item => {
          LeafletUtils.findMarkerByUrl(item.url)?.fire("mouseover");
        }}
        onMouseLeaveItem={item => {
          LeafletUtils.findMarkerByUrl(item.url)?.fire("mouseout");
        }}
      />
    );
  }
  if (props.searchResults.length) {
    return (
      <Results
        results={props.searchResults}
        onClickItem={(res: Reducer.BrtObject | Reducer.BrtCluster) => {
          //als het een cluster object is, laat dan dit clusterobject zien.
          if ("values" in res) {
            props.dispatch({ type: "selectCluster", value: res });
          } else {
            props.dispatch({ type: "selectObject", value: res });
          }
        }}
        onMouseEnterItem={item => {
          LeafletUtils.findMarkerByUrl(item.url)?.fire("mouseover");
        }}
        onMouseLeaveItem={item => {
          LeafletUtils.findMarkerByUrl(item.url)?.fire("mouseout");
        }}
      />
    );
  }
  return null;
};

/**
 * Defined outside the functional component, as we want to debounce this
 * (otherwise, we'd create a new debounced function for every rerender)
 */
const doSearch = _.debounce((text: string, dispatch: React.Dispatch<Reducer.Action>) => {
  dispatch({ type: "search_start", value: text });

  search(text, () => {
    dispatch({ type: "clustering" });
  })
    .then(res => {
      if (res !== undefined) {
        //It's undefined when a new search operation was started in the meantime
        //(e.g., when typing)
        dispatch({ type: "search_success", value: text, results: res.results });
      }
    })
    .catch(e => {
      console.error(e);
      dispatch({ type: "search_error", value: text });
    });
}, 500);

export default App;
