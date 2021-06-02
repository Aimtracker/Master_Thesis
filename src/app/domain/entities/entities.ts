export interface GraphJSON {
  options: OptionsJSON;
  nodes: NodeJSON[];
  edges: EdgeJSON[];
}

export class Graph {
  options?: Options | null;
  nodes?: Node[] | null;
  edges?: Edge[] | null;

  //Use normal constructor instead of fromJson
  static fromJson(json: GraphJSON): Graph {
    const o = Object.create(Graph.prototype);
    return Object.assign(o, json, {
      options: json.options ? Options.fromJson(json.options) : null,
      nodes: json.nodes ? json.nodes.map(nJson => Node.fromJson(nJson.value)) : null,
      edges: json.edges ? json.edges.map(eJson => Edge.fromJson(eJson)) : null
    });
  }
}

export interface OptionsJSON {
  directed?: boolean | null;
  multigraph?: boolean | null;
  compound?: boolean | null;
}

export class Options {
  directed: boolean;
  multigraph: boolean;
  compound: boolean;

  static fromJson(json: OptionsJSON): Options {
    const o = Object.create(Options.prototype);
    return Object.assign(o, json);
  }
}

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

export interface NodeJSON {
  v?: string | null;
  value?: Node | null;
  parent?: any | null;
}

export interface Location {
  start: LocationValue;
  end: LocationValue;
  codeString: string;
}

export interface LocationValue{
  line: number;
  column: number;
}

export interface NodeValueJSON {
  id?: string;
  name?: string;
  loc?: Location;
  discriminator?: NodeType;
  parent?: string;
  type?: IdentifierType;
}

export class Node {
  id: string;
  name: string;
  loc: Location;
  discriminator: NodeType;
  parent: string;
  type: IdentifierType;

  static fromJson(json: NodeValueJSON): Node {
    const o = Object.create(Node.prototype);
    return Object.assign(o, json);
  }
}


export enum EdgeType {
  SIMPLE = "simple",
  EVENT = "event",
  CALLS = "calls",
}

export interface EdgeJSON {
  v: string; //start
  w: string; //destination
  value: string;
}

export class Edge {
  source: Node | string;
  target: Node | string;
  label: EdgeType;

  static fromJson(json: EdgeJSON): Edge {
    const o = Object.create(Edge.prototype);
    json.v ? o.source = json.v : null;
    json.w ? o.target = json.w : null;
    json.value ? o.label = json.value as keyof typeof EdgeType : null;
    return o;
  }
}
