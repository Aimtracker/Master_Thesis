import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';

import * as d3 from 'd3';
import { DataService } from 'src/app/services/data.service';
import _ from "lodash/fp";
import { Edge } from 'src/app/domain/classes/edge';
import { Node } from 'src/app/domain/classes/node';
import { Graph } from 'src/app/domain/classes/graph';
import { EdgeType, NodeType } from 'src/app/domain/enums/enums';
import { getCodeString } from 'src/app/utils/utilities';
import { GraphJSON } from 'src/app/domain/models/GraphJSON';
import { GraphStore } from 'src/app/domain/stores/graph.store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-directed-graph',
  templateUrl: './directed-graph.component.html',
  styleUrls: ['./directed-graph.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DirectedGraphComponent implements OnInit, OnDestroy {

  private nodes: Node[];

  private links: Edge[];

  showCodeView: boolean = true;
  fullCodeString: string = "";
  linesToHighlight: string = "";
  pathToVueFile: string = 'assets/test.vue/test.vue';
  pathToJsonFile: string = 'assets/test.vue/data.json';


  // TODO: move that into state manager
  isPartialGraphView: boolean = false;
  isUIView: boolean = false;

  private margin = 50;
  private width = 1000 - (this.margin * 2);
  private height = 1000 - (this.margin * 2);

  private rectHeight = 25;
  private rectWidth = 150;

  private svg;
  private zoomContainer;
  private simulation;

  private ngUnsubscribe = new Subject();

  constructor(private graphStore: GraphStore, private dataService: DataService,) { }

  ngOnInit(): void {
    this.svg = d3.select('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .on('click', (e) => { this.resetSelection(); });
    this.zoomContainer = this.svg.call(d3.zoom().on("zoom", (e) => {
      this.zoomContainer.attr("transform", e.transform);
    })).append("g");
    this.prepareData();

    this.graphStore.state$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(state => {
        console.log("State:", state);
      });
    //TODO: Remove this
    this.graphStore.getTestString();
    this.graphStore.setTestString("newtestString");
  }


  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }



  private prepareData() {
    this.dataService.getDataJson(this.pathToJsonFile).subscribe(gData => {
      let graph = Graph.fromJson((gData as GraphJSON));
      this.graphStore.setGraph(graph);

      this.dataService.getVueCode(this.pathToVueFile).subscribe(data => {
        this.fullCodeString = data;
        graph.nodes.map(e => {
          if (e.discriminator == NodeType.TAG) {
            e.loc.codeString = getCodeString(data, e.loc.start, e.loc.end);
          }
        });

        console.log("Nodes", this.graphStore.state.graph.nodes);

        this.nodes = this.graphStore.state.graph.nodes;
        this.links = this.graphStore.state.graph.edges;

        this.renderSvg();
        this.graphStore.refreshCodeView();
      });
    });
  }

  /**
  * Extracts the Init-Node, Tag-Nodes and nodes they interact with.
  */
  extractUIGraph() {
    this.graphStore.setUIGraph();
    this.nodes = this.graphStore.state.uiGraph.nodes;
    this.links = this.graphStore.state.uiGraph.edges;
    this.renderSvg();
  }

  /**
    * (Re)renders the whole Graph. All the visual nodes and edges are deleted and then newly generated and rendered.
    */
  private renderSvg(): void {
    this.svg.select('g').selectAll('*').remove();


    this.simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id((d: any) => { return d.id; }))
      .force('charge', d3.forceManyBody().strength(-2000).distanceMin(100))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force("x", d3.forceX())
      .force("y", d3.forceY());

    // build the arrow.
    let arrow = this.zoomContainer.append("svg:defs").selectAll("marker")
      .data(["arrow", "arrow-in", "arrow-out", "arrow-marked"]) // Different link/path types can be defined here
      .enter().append("svg:marker")    // This section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", -1.5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .attr("class", (d) => d)
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

    let link = this.zoomContainer.append("g")
      .attr("class", "links")
      .selectAll(".line")
      .data(this.links)
      .enter()
      .append("g")
      .attr("class", "link")
      .append("line")
      .attr("marker-end", "url(#arrow)")
      .on('click', (e, d) => { e.stopPropagation(); this.handleEdgeMouseClick(e, d); });

    let node = this.zoomContainer.append("g")
      .attr("class", "nodes")
      .selectAll(".node")
      .data(this.nodes).enter()
      .append("g")
      .attr("class", "node");

    let rect = node
      .append("rect")
      .attr("id", function (d) { return d.id; })
      .attr("width", this.rectWidth)
      .attr("height", this.rectHeight)
      .on('pointermove', (e) => { this.handleMouseMovement(e); })
      .on('click', (e, d) => { e.stopPropagation(); this.handleNodeMouseClick(e, d); });
    // .call(d3.drag()
    //   .on("start", (d) => dragstarted(d))
    //   .on("drag", (d) => dragged(d))
    //   .on("end", (d) => dragended(d)));

    let label = node.append("text")
      .text(function (d) { return d.name; })
      .style("text-anchor", "middle")
      .style("fill", "#555")
      .style("font-family", "Arial")
      .style("font-size", 12);


    node.append("title")
      .text(function (d) { return d.id; });

    this.simulation
      .nodes(this.nodes)
      .on("tick", ticked);

    this.simulation.force("link")
      .links(this.links);

    function ticked() {
      d3.select('svg').select(".links")
        .selectAll(".link").selectAll("line")
        .attr("x1", function (d: any) { return d.source.x; })
        .attr("y1", function (d: any) { return d.source.y; })
        .attr("x2", function (d: any) { return d.target.x; })
        .attr("y2", function (d: any) { return d.target.y; });

      d3.select('svg').selectAll("rect")
        .attr("x", function (d: any) { return d.x; })
        .attr("y", function (d: any) { return d.y; });

      d3.select('svg').selectAll("text")
        .attr("x", function (d: any) { return d.x + 75; })
        .attr("y", function (d: any) { return d.y + 15; });
    }
    // this.simulation.alphaTarget(0.3);
  }

  /**
    * Handles mouse movement.
    */
  handleMouseMovement(e) {
    //console.log('Mm', e);
  }

  /**
  * Colors the selected node yellow and traverses the graph to find all nodes that are part of it's interaction.
  * All found nodes and edges are colored green. If isPartialGraphView is true, the graph will be rerendered with only
  * the found nodes and edges.
  * @param e is the event provided by d3.
  * @param d is the (logical) node that has been clicked on.
  */
  handleNodeMouseClick(e, d) {
    console.log('Mc e', e);
    console.log('Mc d', d);
    //d.fx = 300;
    //this.findNodeNeighbours(d);
    let targetNode = this.nodes.find(n => n.id == d.id);
    if (targetNode) {

      let nodesToShow = this.graphStore.traverse(targetNode);
      //Clicked node must be pushed, because it isn't included by the traverse method
      nodesToShow.push(d);
      let edgesToShow = this.filterEdges(nodesToShow, this.links);

      //if true, only the partial graph will be rendered
      if (this.isPartialGraphView) {
        this.nodes = nodesToShow;
        this.links = edgesToShow;
        console.log("l", this.graphStore.l(targetNode));
        this.renderSvg();
      }

      //color
      this.colorNodes(nodesToShow, "#0f0");
      this.colorEdges(edgesToShow, "#0f0");
      d3.selectAll("rect").filter((n: Node) => (n.id == (d.id))).style("fill", "#ff0");

      //highlight lines if given
      this.graphStore.highlightLinesInCode(d);
    }
  }

  /**
* Colors the selected edge yellow, the source node red and the target node green.
* @param e is the event provided by d3.
* @param d is the (logical) edge that has been clicked on.
*/
  handleEdgeMouseClick(e, d) {
    console.log('Mc e', e);
    console.log('Mc d', d);
    this.deselectAll();
    //select node HTMLElement that was clicked on and change fill color
    d3.select(e.currentTarget).style("stroke", "#ff0").attr("marker-end", "url(#arrow-marked)");
    //select source and color it red
    d3.selectAll("rect").filter((data: Node) => data.id == d.source.id).style("fill", "#f00");
    //select target and color it green
    d3.selectAll("rect").filter((data: Node) => data.id == d.target.id).style("fill", "#0f0");

  }

  /**
  * Colors the nodes in the nodesToColor array in a color specified by the color parameter.
  * @param nodesToColor is an array of nodes that should be colored.
  * @param color is a color string (e.g. #0f0) in which the nodes will be colored.
  */
  colorNodes(nodesToColor, color) {
    this.deselectAll();
    nodesToColor.forEach(element => {
      d3.selectAll("rect").filter((d: Node) => (d.id == (element.id))).style("fill", color);
    });
  }

  /**
  * Colors the edges in the edgesToColor array in a color specified by the color parameter.
  * @param edgesToColor is an array of edges that should be colored.
  * @param color is a color string (e.g. #0f0) in which the nodes will be colored.
  */
  colorEdges(edgesToColor, color) {
    edgesToColor.forEach(element => {
      let edgeDOM = d3.selectAll("line").filter((d: Edge) => (d == element));
      console.log("called baby", edgeDOM)
      edgeDOM.style("stroke", color).attr("marker-end", "url(#arrow-out)");
    });
  }



  toggleUIView() {
    if (this.isUIView) {
      this.resetGraph();
    } else {
      this.extractUIGraph();
    }
    this.isUIView = !this.isUIView;
  }

  toggleIsPartialGraphView() {
    this.isPartialGraphView = !this.isPartialGraphView;
  }

  /**
  * Finds neighbouring nodes and colors them and their edges either red (incoming) or green (outgoing).
  * @param clickedNode is the node which neighbours will be determined by the method.
  */
  // Desc:
  // findNodeNeighbours(clickedNode: Node) {
  //   this.deselectAll();
  //   let edges = this.links.filter((n: Edge) => (n.source == clickedNode || n.target == clickedNode));
  //   edges.forEach(element => {
  //     let edgeDOM = d3.selectAll("line").filter((d: Edge) => (d == element));

  //     //nodes that interact with clickedNode
  //     if (element.source != clickedNode) {
  //       //take elements source and find that node
  //       d3.selectAll("rect").filter((d: Node) => d.id == (element.source as Node).id).style("fill", "#f00");
  //       edgeDOM.style("stroke", "#f00").attr("marker-end", "url(#arrow-in)");
  //     }

  //     //nodes that clickedNode interacts with
  //     if (element.target != clickedNode) {
  //       //take elements target and find that node
  //       d3.selectAll("rect").filter((d: Node) => (d.id == (element.target as Node).id)).style("fill", "#0f0");
  //       edgeDOM.style("stroke", "#0f0").attr("marker-end", "url(#arrow-out)");
  //     }
  //   });
  // }

  deselectAll() {
    d3.selectAll("line").style("stroke", "").attr("marker-end", "url(#arrow)");
    d3.selectAll("rect").style("fill", "");
  }

  filterEdges(nodesToShow: Node[], allEdges: Edge[]): Edge[] {
    if (!nodesToShow && !allEdges) {
      return [];
    }
    return allEdges.filter(e => nodesToShow.find(n => e.source.id == n.id) != undefined && nodesToShow.find(n => e.target.id == n.id) != undefined);
  }


  resetSelection() {
    if (this.isPartialGraphView && !this.isUIView) {
      this.resetGraph();
    } else if (this.isPartialGraphView && this.isUIView) {
      this.extractUIGraph();
    } else {
      this.deselectAll();
    }
    this.graphStore.resetHighlightedLinesInCode();
  }

  resetGraph() {
    this.nodes = this.graphStore.state.graph.nodes;
    this.links = this.graphStore.state.graph.edges;
    this.renderSvg();
    this.graphStore.resetHighlightedLinesInCode();
  }

  toggleCodeView() {
    this.showCodeView = !this.showCodeView;
    this.graphStore.refreshCodeView();
  }
}
