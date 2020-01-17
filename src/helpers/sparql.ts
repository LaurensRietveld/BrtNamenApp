export interface SparqlResults {
  head: Head,
  results: {
    bindings: Binding[]
  }
}
export interface Head {
  vars: string[]
}
export interface Binding {
  [varname:string]: BindingValue

}
export type BindingValue = {
  type: 'uri',
  value:string
} | {
  type: 'literal',
  value: string,
  "xml:lang"?:string,
  datatype?:string
} | {"type": "bnode", "value": string}
