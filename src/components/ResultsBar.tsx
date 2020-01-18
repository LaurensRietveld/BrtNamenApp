import React from "react";

/**
 * De bar met <-- terug en het aantal zoekresultaten.
 */
export interface Props {
  loading: boolean;
  numberSearchResults: number;
  onBack: () => void;
}
const NavBar: React.FC<Props> = props => {
  if (props.onBack) {
    return <BackButton {...props} />;
  } else {
    return <EmptyBar loading={props.loading} />;
  }
};

const EmptyBar: React.FC<Pick<Props, "loading">> = props => {
  let class_ = "nonLoadingButton";

  if (props.loading) {
    class_ = "loadingButton";
  }

  return (
    <div className={"backButton  " + class_}>
      <p>&nbsp;</p>
    </div>
  );
};

const BackButton: React.FC<Props> = props => {
  let class_ = "nonLoadingButton";

  if (props.loading) {
    class_ = "loadingButton";
  }

  return (
    <div className={"backButton cursorPointer " + class_} onClick={props.onBack}>
      <span>&larr; Terug</span>
      <span style={{ float: "right" }}>{props.numberSearchResults}</span>
    </div>
  );
};

export default NavBar;
