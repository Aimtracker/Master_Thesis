import { GraphJSON } from '../models/GraphJSON';
import { Edge } from './edge';
import { Node } from './node'
import { Options } from './options';

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
