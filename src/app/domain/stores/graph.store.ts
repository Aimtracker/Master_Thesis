import { Injectable } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { Edge } from '../classes/edge';
import { Node } from '../classes/node';
import { Graph } from '../classes/graph';
import { EdgeType, NodeType } from '../enums/enums';
import { Store } from './store';
import _ from "lodash/fp";

export class GraphStoreState {
  graph: Graph = null;
  uiGraph: Graph = null;
  testString: string = "empty";
}

@Injectable({
  providedIn: 'root'
})
export class GraphStore extends Store<GraphStoreState>{
  constructor(private dataService: DataService) {
    super(new GraphStoreState());
  }

  getTestString(): string {
    return this.state.testString;
  }

  setTestString(value: string): void {
    this.setState({
      ...this.state,
      testString: value
    });
  }

  setGraph(inGraph: Graph) {
    this.setState({
      ...this.state,
      graph: inGraph
    });
  }

  setUIGraph() {
    let newGraph: Graph = new Graph();
    //let newEdges = fullGraph.edges.filter(e => e.label == EdgeType.EVENT);
    //All nodes of Type TAG or INIT and the nodes that are targets of the event Edges.
    let filteredNodes = this.state.graph.nodes.filter(e => (e.discriminator == NodeType.TAG || e.discriminator == NodeType.INIT) /*|| e.id == newEdges.find(el => el.target.id == e.id)*/);
    console.log(filteredNodes);
    let newEdges: Edge[] = [];
    filteredNodes.forEach(element => {
      let traversedNodes = this.l(element);
      newEdges = newEdges.concat(this.generateUIEdges(element, traversedNodes));
    });
    newGraph.options = this.state.graph.options;
    newGraph.edges = newEdges;
    newGraph.nodes = filteredNodes;

    this.setState({
      ...this.state,
      uiGraph: newGraph
    });
  }

  generateUIEdges(n: Node, nodes: Node[]): Edge[] {
    let newEdges: Edge[] = [];
    nodes.forEach((element) => {
      let tmpEdge = new Edge();
      tmpEdge.source = n;
      tmpEdge.target = element;
      tmpEdge.label = EdgeType.SIMPLE;
      newEdges.push(tmpEdge);
    });
    return newEdges;
  }



  traverse(
    node: Node,
    visited: Node[] = []
  ): Node[] {
    //copy needs to be made here because in the inner function "this.state.graph" can't be called
    let graphCopy = this.state.graph;
    function alreadyVisited(id: Node): boolean {
      return _.find(_.isEqual(id), visited) !== undefined;
    }

    function inner(id: Node) {
      if (alreadyVisited(id)) return;
      visited.push(id);

      const reachable = graphCopy
        .outEdges(id)
        .filter((x) => {
          //from Paper
          //"Note that updating the answer does not trigger $scope.check answer(), since this function needs explicit triggering via Check,"
          //is problematic, what if function is called from somewhere? that's why we need call relation

          //NOTE possible without calls (need to also check  if source and sink are both methods and let through)
          switch (x.label) {
            case EdgeType.EVENT:
              return false;
            case EdgeType.CALLS:
              return true;
            case EdgeType.SIMPLE:
              //current is not a method, but sink is and it's triggerable by event
              if (x.target.isMethodNode() /*&& nodeTriggerableByEvent(graphCopy, x.target)*/) {
                return false;
                //property chain or tag or reads relation
              } else return true;
          }
        })

        .map((x) => x.target);

      //  console.log(`traverse(${id.id}) -> ${reachable.map((x) => x.id)}`);
      reachable?.forEach(inner);
    }

    function nodeTriggerableByEvent(graph: Graph, node: Node): boolean {
      const edges = graph.inEdges(node);
      return _.some((x) => x.label === EdgeType.EVENT, edges);
    }

    //inner is not allowed to travel event edges (and shouldn't be)
    //that's why events are traversed here
    const reachableFromNodeByAnyMeans = graphCopy.outEdges(node);

    //if (node.name !== "created") return [];
    reachableFromNodeByAnyMeans.forEach((x) => inner(x.target));
    return Array.from(visited);
  }

  l(node: Node): Node[] {
    const preorder = this.traverse(node);
    return preorder.filter(element => element.isTagNode() || element.isInitNode());

    //return _.filter(this.isTagNode, preorder);
  }

}
