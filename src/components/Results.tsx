import React from "react";
import { State, BrtObject, BrtCluster } from "../reducer";
import { getHexFromColor } from "../helpers/utils";
export interface Props {
  results: State["searchResults"];
  onClickItem: (item: BrtObject | BrtCluster) => void;
  onMouseEnterItem: (item: BrtObject | BrtCluster) => void;
  onMouseLeaveItem: (item: BrtObject | BrtCluster) => void;
}
const Results: React.FC<Props> = props => {
  // let results;

  // //kijk eerst of er een cluster is of niet.
  // if(props.res.getClickedCluster()){
  //     results = this.props.res.getClickedCluster().getValues();
  // }else{
  //     results = this.props.res.getRightClickedRes().length > 0 ? this.props.res.getRightClickedRes() : this.props.res.getResults();
  // }

  //voor elk resultaat.
  let elements = props.results.map(res => {
    let pElementHoofd = <p className="hoofdText">&nbsp;</p>;
    let pElementSub = <p className="subText">&nbsp;</p>;

    if (res.name) {
      pElementHoofd = <p className="hoofdText">{res.name}</p>;
    }

    if (res.type) {
      let color;

      if (res.color) {
        color = { color: getHexFromColor(res.color, true) };
      }

      pElementSub = (
        <p className="subText" style={color}>
          {res.type ? res.type : String.fromCharCode(32)}
        </p>
      );
    }
    return (
      <li
        key={res.url + res.name}
        className="liResultScreen"
        onClick={() => {
          props.onClickItem(res);
        }}
        onMouseEnter={() => {
          props.onMouseEnterItem(res);
        }}
        onMouseLeave={() => {
          props.onMouseLeaveItem(res);
        }}
      >
        {pElementHoofd}
        {pElementSub}
      </li>
    );
  });

  return (
    <div className="homeScreen">
      <ul>{elements.length ? elements : undefined}</ul>
    </div>
  );
};

export default Results;
