/**
 * Libs
 */
import * as LeafletUtils from "./leaflet";
import React from "react";
import _ from "lodash";
import {  ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles.scss";
import * as Reducer from "./reducer";
import { getFromCoordinates } from "./helpers/searchByPoint";
import { search } from "./helpers/searchByText";

/**
 * UI
 */
// import Routes from './routes/Routes'
import {  Icon, Search } from "semantic-ui-react";
// import NavBar from "./components/NavBar";
import Loader from "./components/Loader";
import StartMessage from "./components/StartMessage";
import Results from "./components/Results";
import ResultsBar from "./components/ResultsBar";

/**
 * Assets
 */
// import './App.css';
// import KadasterImg from './assets/Logo-kadaster.png';
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

/**
 * Netwerk
 */
// import *  as Communicator from './network/Communicator';

/**
 * Model
 */
// import ResultatenHouder from './model/ResultatenHouder';
// import ClickedResultaat from "./model/ClickedResultaat";
// import { DefaultIcon, Icons } from "./components/Icons";
// import ContextMenu from "./components/ContextMenu";
// import ClusterObject from "./model/ClusterObject";



const App: React.FC = () => {
  const [state, dispatch] = React.useReducer(Reducer.reducer, Reducer.initialState);
  //Set state in window for debugging
  React.useEffect(() => {
    LeafletUtils.init({
      onZoomChange: zoom => {
        dispatch({ type: "zoomChange", value: zoom });
      },
      onContextSearch: ctx => {
        dispatch({ type: "context_search_start", value: ctx });
      }
    });
    return () => {};
  }, []);
  React.useEffect(() => {
    if (state.zoomLevel < 10 && !state.mapClustered) {
      dispatch({ type: "setMapClustered", value: true });
    } else if (state.zoomLevel >= 10 && state.mapClustered) {
      dispatch({ type: "setMapClustered", value: false });
    }
  });
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
  React.useEffect(() => {
    // if (LeafletUtils.updateMap) {
    LeafletUtils.updateMap({
      searchResults: state.searchResults,
      selectedObject: state.selectedCluster || state.selectedObject
    });
    // }
    return () => {};
  }, [state.searchResults]);

  React.useEffect(() => {
    LeafletUtils.toggleClustering(state.mapClustered);
    LeafletUtils.updateMap({
      searchResults: state.searchResults,
      selectedObject: state.selectedCluster || state.selectedObject
    });
  }, [state.mapClustered]);

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
      // let center = getCenterGeoJson(res.geojson);
      // let zoom = map.getZoom();
      //
      // //als de gebruiker ingezoomt is, zoom dan niet uit.
      // if (zoom < 10) {
      //   zoom = 10;
      // }
      //zet de view.
      // map.setView(center, zoom);
      //kijk nog even welke url je moet pushen.
      // if (this.state.results.getClickedCluster()) {
      //     props.history.push(`/result/${res.getNaam()}/${res.getNaam()}`);
      // } else {
      // props.history.push(`/result/${res.getNaam()}`);
      // }
    }
  };

  /**
   * Wanneer iemand op een resultaat klikt voer dan deze methode uit.
   **/

  /**
   * Wordt aangeroepen wanneer er iets wordt getype
   **/
  const onSearchChange = (_e: any, data: any) => {
    let text = data.value;
    LeafletUtils.closePopup();

    //als de text iets heeft
    if (text) {
      dispatch({ type: "typeSearch", value: text });
      doSearch(text, dispatch);

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
      // if (props.location.pathname === "/") {
      //   props.history.push("/result");
      // }
    } else {
      //als de zoekbar text leeg is
      // setSearchQuery("");
      // setIsFetching(false);
      //verwijder alle resultaten
      // this.state.results.clearAll();
      // let match2 = matchPath(props.location.pathname, {
      //   path: "/result/:id/:idd",
      //   exact: true,
      //   strict: true
      // });
      //ga terug naar het hoofdscherm
      // if (props.location.pathname === "/result") {
      //   props.history.goBack();
      // } else if (match2) {
      //   props.history.go(-3);
      // } else if (props.location.pathname !== "/") {
      //   props.history.go(-2);
      // }
    }

    //centreer de kaart weer.
    LeafletUtils.centerMap();
  };



  /**
   * Wanneer er op het kruisje in de search bar wordt geklikt.
   **/
  const handleDeleteClick = () => {
    onSearchChange({}, { value: "" });
  };

  // /**
  //  * Wanneer er op de terug knop wordt geklikt in de applicatie aka <-- terug.
  //  **/
  const onBack = () => {
    console.log("on back!");
  };
  // const handleOnBackButtonClick = () => {
  //   /**
  //    * Kijk of je op een resultaat scherm bent
  //    */
  //   let match = matchPath(props.location.pathname, {
  //     path: "/result/:id",
  //     exact: true,
  //     strict: true
  //   });
  //
  //   /**
  //    * Kijk of je bij een cluster res bent.
  //    */
  //   let match2 = matchPath(props.location.pathname, {
  //     path: "/result/:id/:idd",
  //     exact: true,
  //     strict: true
  //   });
  //
  //   if (props.location.pathname === "/result") {
  //     //Als je op de result screen bent ga dan terug naar het hoofdscherm
  //     // if (this.state.results.getClickedCluster()) {
  //     //     this.state.results.clearClickedCluster();
  //     // } else {
  //     //     handleDeleteClick();
  //     // }
  //   } else if (match) {
  //     //Als je op een geklikte resultaat scherm bent ga dan terug naar de result scherm
  //     // props.history.goBack();
  //
  //     // this.state.results.clearClickedResult();
  //     // this.state.results.clearClickedCluster();
  //   } else if (match2) {
  //     //ga eerst een pagina terug
  //     // props.history.goBack();
  //     // this.state.results.clearClickedResult();
  //   }
  // };

  /**
   * Met deze methode kan je de resultatenhouder van buitenaf aanroepen.
   * @param res
   * @param isRightClick
   */
  // const setResFromOutside = (res: any, isRightClick: boolean) => {
  //   setIsUpdating(false);
  //
  //   if (props.history.location.pathname !== "/") {
  //     if (isRightClick) {
  //       // this.state.results.setDoubleResults(res);
  //     } else {
  //       // this.state.results.setResults(res)
  //     }
  //   }
  // };

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
   */
  // const getZoekResultatenAantal = () => {
  //   let aantalZoekResultaten: number;
  //
  //   // if (this.state.results.getClickedResult()) {
  //   //
  //   // } else if (this.state.results.getClickedCluster()) {
  //   //     aantalZoekResultaten = this.state.results.getClickedCluster().getValues().length;
  //   // } else if (this.state.results.getRightClickedRes().length > 0) {
  //   //     aantalZoekResultaten = this.state.results.getRightClickedRes().length;
  //   // } else {
  //   //     aantalZoekResultaten = this.state.results.getResults().length;
  //   // }
  //   //
  //   // if (aantalZoekResultaten > 989) {
  //   //     aantalZoekResultaten = 900 + "+";
  //   // }
  //
  //   return aantalZoekResultaten;
  // };

  // let aantalZoekResultaten = getZoekResultatenAantal();

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
            icon={icon}
            onSearchChange={onSearchChange}
            open={false}
            onFocus={onFocus}
          />
        </div>
        <div className="resultsContainer">
          <ResultsBar loading={state.isFetching} onBack={state.searchQuery || state.searchResults.length ?onBack: undefined} numberSearchResults={state.searchResults.length} />
          <div className="loaderDiv">
            <Loader loading={state.isFetching} />
          </div>
          <div className="resultPartContainer">
            {!state.searchResults.length && !state.searchQuery && <StartMessage />}
            {state.searchResults.length && (
              <Results
                results={state.searchResults}
                onClickItem={onClickItem}
                onMouseEnterItem={(item) => {
                  
                  LeafletUtils.findMarkerByUrl(item.url)?.fire("mouseover")
                }}
                onMouseLeaveItem={(item) => {
                  LeafletUtils.findMarkerByUrl(item.url)?.fire("mouseout")
                }}
              />
            )}
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
 * Defined outside the functional component, as we want to debounce this
 * (otherwise, we'd create a new debounced function for every rerender)
 */
const doSearch = _.debounce((text: string, dispatch:React.Dispatch<Reducer.Action> ) => {
  /**
   * Roep de getMatch functie aan van de communicator
   **/
  dispatch({ type: "search_start", value: text });


  search(text, () => {
    dispatch({ type: "clustering" });
  })
    .then(res => {
      if (res !== undefined) {
        //It's undefined when a new search operation was started in the meantime
        //(e.g., when typing)
        dispatch({ type: "search_success", value: text,results: res.results });
      }
    })
    .catch((e) => {
      console.error(e)
      dispatch({ type: "search_error",value: text });
    });

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


export default App;
