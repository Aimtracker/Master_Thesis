import { Injectable } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { Edge } from '../classes/edge';
import { Node } from '../classes/node';
import { Graph } from '../classes/graph';
import { EdgeType, NodeType } from '../enums/enums';
import { Store } from './store';
import _ from "lodash/fp";
import { HighlightService } from 'src/app/services/highlight.service';

export class GraphStoreState {
  graph: Graph = null;
  uiGraph: Graph = null;

  pathToVueFile: string = "assets/test.vue/test.vue"
  pathToJsonFile: string = "assets/test.vue/data.json"
  linesToHighlight: string = "";
}

@Injectable({
  providedIn: 'root'
})
export class GraphStore extends Store<GraphStoreState>{
  constructor(private dataService: DataService, private highlightService: HighlightService) {
    super(new GraphStoreState());
  }


  setGraph(inGraph: Graph) {
    this.setState({
      ...this.state,
      graph: inGraph
    });
  }

  /**
  * Extracts the UIGraph that contains only nodes of type TAG and INIT.
  * It filters the nodes that should be part of the UIGraph and then filters with which TAG or INIT nodes they interact.
  * Then edges are generated between them so form the UIGraph. The UIGraph is set at the end.
  */
  setUIGraph() {
    let newGraph: Graph = new Graph();
    //let newEdges = fullGraph.edges.filter(e => e.label == EdgeType.EVENT);
    //All nodes of Type TAG or INIT and the nodes that are targets of the event Edges.
    let filteredNodes = this.state.graph.nodes.filter(e => (e.discriminator == NodeType.TAG || e.discriminator == NodeType.INIT) /*|| e.id == newEdges.find(el => el.target.id == e.id)*/);
    console.log(filteredNodes);
    let newEdges: Edge[] = [];
    filteredNodes.forEach(element => {
      let traversedNodes = this.l(element);
      console.log("L", traversedNodes)
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

  setScenario(pathToJsonFile, pathToVueFile){
    this.setState({
      ...this.state,
      pathToJsonFile: pathToJsonFile,
      pathToVueFile: pathToVueFile
    });
  }

  /**
  * Generates edges between n and nodes, where n is the source and every element
  * of nodes is the target.
  * @param n is the node that interacts with other nodes.
  * @param nodes are the nodes that n interacts with.
  */
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



  /**
  * Traverses the graph and finds every node that n interacts with plus the nodes they interact with and so on.
  * An array of all nodes where interactions are possible based from node is returned.
  * @param node is the node from which the method starts to traverse.
  * @param visited are all the nodes that were already visited.
  * @returns An array of all nodes where interactions are possible based from node.
  */
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

  /**
  * Traverses the graph and returns which TAG or INIT nodes node interacts with.
  * @param node is the node from which the method starts to traverse.
  * @returns an array of nodes with TAG or INIT nodes node interacts with.
  */
  l(node: Node): Node[] {
    const preorder = this.traverse(node);
    return preorder.filter(element => element.isTagNode() || element.isInitNode());

    //return _.filter(this.isTagNode, preorder);
  }

  /**
  * Highlights lines of code in the code-view-component based on the given node.
  * If the node does not contain a loc object inside of it, nothing will be highlighted
  * and/or already highlighted lines will be un-highlighted.
  * @param node is a node that contains the lines that should be highlighted.
  */
  highlightLinesInCode(node: Node) {
    let nodeLoc = node.loc;
    if (nodeLoc) {
      let from = nodeLoc.start.line;
      let to = nodeLoc.end.line;
      this.setState({
        ...this.state,
        linesToHighlight: from + "-" + to
      });
      this.refreshCodeView();
    } else {
      this.resetHighlightedLinesInCode();
    }
  }

  /**
  * Resets all the highlighted lines in the code-view-component.
  */
  resetHighlightedLinesInCode() {
    this.setState({
      ...this.state,
      linesToHighlight: ""
    });
    this.refreshCodeView();
  }

  /**
  * Rerenders the code-view-component.
  */
  refreshCodeView() {
    setTimeout(() => {
      //Give Angular a fraction of a second to properly show the elements, then refresh prismjs
      this.highlightService.highlightAll();
    }, 10);
  }

  // something(){
  //   let tmpGraph = this.state.graph;
  //   tmpGraph.nodes.forEach(element => {
  //     if(element.isTagNode()){
  //       element.group = 1;
  //     }else{
  //       element.group = 2;
  //     }
  //   });

  //   tmpGraph.edges.forEach(element => {
  //     if(element.source.type == element.target.type){
  //       element.value = 10;
  //     }else{
  //       element.value = 1000;
  //     }
  //   });

  //   this.setState({
  //     ...this.state,
  //     graph: tmpGraph
  //   })
  // }

}
