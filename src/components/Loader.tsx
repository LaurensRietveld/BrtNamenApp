import React from "react";
import { BarLoader } from "react-spinners";

/**
 * Het kleine laadbalkje aan de boven kant van het resultaten stukje, en boven de kaart
 */
const Loader = (props: { loading: boolean }) => (
  <BarLoader loading={props.loading} width={"100%"} color={"#6495ED"} height={4} />
);

export default Loader;
