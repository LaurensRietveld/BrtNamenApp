import * as React from "react";
import { State, BrtObject, BrtCluster } from "../reducer";
import { getVerboseDescription, VerboseDescription } from "../helpers/sparql";
import { getHexFromColor } from "../helpers/utils";
/**
 * Dit is het scherm dat het geklikte object laat zien.
 */
export interface Props {
  value: BrtObject | BrtCluster;
}
export const Result: React.FC<Props> = ({ value }) => {
  const [description, setDescription] = React.useState<VerboseDescription>(undefined);
  React.useEffect(() => {
    getVerboseDescription(value).then(result => {
      setDescription(result);
    });
  }, [value]);

  let tableNamen;
  let tableRest;

  if (description) {
    let headerName =
      description.names.naam ||
      description.names.tunnelNaam ||
      description.names.knoopPuntNaam ||
      description.names.burgNaam ||
      description.names.sluisNaam;
    const naam = headerName && <h1>{headerName}</h1>;

    const type = (
      <h3 style={{ color: value.color ? getHexFromColor(value.color, true) : undefined }}>
        {description.type.join(", ")}
      </h3>
    );
    const nameRows: { label: string; value: string }[] = [];
    // let naamNl;
    // let naamFries;
    // let naamOfficeel;
    // let brugnaam;
    // let sluisnaam;
    // let knooppuntnaam;
    // let tunnelnaam;
    if (description.names.naamFries) nameRows.push({ label: "Naam Fries:", value: description.names.naamFries });
    if (description.names.naamOfficieel)
      nameRows.push({ label: "Naam officieel:", value: description.names.naamOfficieel });
    if (description.names.naamNl) nameRows.push({ label: "Naam Nederlands:", value: description.names.naamNl });
    if (description.names.tunnelNaam) nameRows.push({ label: "Tunnel naam:", value: description.names.tunnelNaam });
    if (description.names.burgNaam) nameRows.push({ label: "Brug naam:", value: description.names.burgNaam });
    if (description.names.knoopPuntNaam)
      nameRows.push({ label: "Knooppunt naam:", value: description.names.sluisNaam });

    tableNamen = (
      <div>
        <table className="namenTable">
          <tbody>
            {nameRows.map(r => {
              <tr key={r.label + r.value}>
                <td>
                  <b>{r.label}</b>
                </td>
                <td>{r.value}</td>
              </tr>;
            })}
          </tbody>
        </table>
        <hr />
      </div>
    );

    tableRest = (
      <table className="attributeSectionObjectScreen">
        <tbody>
          {description.remaining.map(res => {
            return (
              <tr key={res.key + res.value}>
                <td>{res.key}</td>
                <td>
                  {res.value.startsWith("http://") ? (
                    <a href={res.value} target="_blank" rel="noreferrer noopener">
                      {res.value}
                    </a>
                  ) : (
                    res.value
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
    return (
      <div className="objectScreen">
        {naam}
        {type}
        {tableNamen}
        {tableRest}
      </div>
    );
  }
  return null;
};

export default Result;
