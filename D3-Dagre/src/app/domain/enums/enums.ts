export enum NodeType {
  TAG = "tag",
  DATA = "data",
  METHOD = "method",
  INIT = "init",
}

export enum IdentifierType {
  THIS = "this",
  NUMERIC_INDEX = "numeric-index",
  GENERIC_INDEX = "generic-index",
  NAME_IDENTIFIER = "name-identifier",
}

export enum EdgeType {
  SIMPLE = "simple",
  EVENT = "event",
  CALLS = "calls",
}
