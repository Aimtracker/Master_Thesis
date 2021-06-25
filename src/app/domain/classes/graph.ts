import { GraphJSON } from '../models/GraphJSON';
import { Edge } from './edge';
import { Node } from './node';
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

  outEdges(node: string | Node): Edge[] {
    const nodeId = this.nodeID(node);
    let outgoingEdges = this.edges.filter((e: Edge) => (e.source.id == nodeId));
    return outgoingEdges;
    // const nodeId = this.nodeID(node);
    // const outEdges = this.outEdges(nodeId);
    // if (!outEdges) return [];
    // return _.flatMap((x) => lift(this.edge(x.v, x.w)), outEdges);
  }

  /**
   * Returns the incoming edges to the given node
   * @param node node id string or node
   */
  inEdges(node: string | Node): Edge[] {
    const nodeId = this.nodeID(node);
    let incomingEdges = this.edges.filter((e: Edge) => (e.target.id == nodeId));
    return incomingEdges;
    // const nodeId = this.nodeID(node);
    // const inEdgesEdges = this.inEdges(nodeId);
    // if (!inEdgesEdges) return [];
    // return _.flatMap((x) => lift(this.edge(x.v, x.w)), inEdgesEdges);
  }

  private nodeID(nodeOrId: string | Node): string {
    return typeof nodeOrId === "string" ? nodeOrId : nodeOrId.id;
  }

  getEdges() {
    return this.edges;
  }
}
