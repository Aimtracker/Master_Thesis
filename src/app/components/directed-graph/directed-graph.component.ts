import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';

import * as d3 from 'd3';
import { DataService } from 'src/app/services/data.service';
import LineColumnFinder from 'line-column';
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
import { HighlightService } from 'src/app/services/highlight.service';

@Component({
  selector: 'app-directed-graph',
  templateUrl: './directed-graph.component.html',
  styleUrls: ['./directed-graph.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DirectedGraphComponent implements OnInit, OnDestroy {

  private nodes: Node[];

  private links: Edge[];

  fullCodeString:string = "";


  // TODO: move that into state manager
  isPartialGraphView: boolean = false;
  isUIView: boolean = false;

  private margin = 50;
  private width = 1000 - (this.margin * 2);
  private height = 1000 - (this.margin * 2);

  private rectHeight = 25;
  private rectWidth = 150;

  private svg;
  private simulation;

  private ngUnsubscribe = new Subject();

  constructor(private graphStore: GraphStore, private dataService: DataService, private highlightService: HighlightService) { }

  ngOnInit(): void {
    this.svg = d3.select('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .on('click', (e) => { this.resetSelection(); })
      .append("g")
      .attr("transform", "translate(" + this.margin + "," + this.margin + ")")
      ;
    this.prepareData();

    this.graphStore.state$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(state => {
        console.log("State:", state);
      });
    this.graphStore.getTestString();
    this.graphStore.setTestString("newtestString");
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }



  private prepareData() {
    this.dataService.getDataJson('assets/test.vue/data.json').subscribe(gData => {
      let graph = Graph.fromJson((gData as GraphJSON));
      this.graphStore.setGraph(graph);

      this.dataService.getVueCode('assets/test.vue/test.vue').subscribe(data => {
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
        console.log(this.highlightService.highlight(this.fullCodeString));
      });
    });
  }

  //Only the Init-Node, Tag-Nodes and nodes they interact with should be visible in this graph
  extractUIGraph() {
    this.graphStore.setUIGraph();
    this.nodes = this.graphStore.state.uiGraph.nodes;
    this.links = this.graphStore.state.uiGraph.edges;
    this.renderSvg();
  }


  private renderSvg(): void {
    this.graphStore.test();
    this.svg.selectAll('*').remove();


    this.simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id((d: any) => { return d.id; }))
      .force('charge', d3.forceManyBody().strength(-2000).distanceMin(100))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force("x", d3.forceX())
      .force("y", d3.forceY());

    // build the arrow.
    let arrow = this.svg.append("svg:defs").selectAll("marker")
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

    let link = this.svg.append("g")
      .attr("class", "links")
      .selectAll(".line")
      .data(this.links)
      .enter()
      .append("g")
      .attr("class", "link")
      .append("line")
      .attr("marker-end", "url(#arrow)")
      .on('click', (e, d) => { this.handleEdgeMouseClick(e, d); });

    let node = this.svg.append("g")
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

  // updateSvg(): void {

  //   let link = this.svg.select(".links")
  //     .selectAll(".link")
  //     .data(this.links, function (d) { return d.source.id + "-" + d.target.id; });
  //   console.log(link.data());
  //   link.exit().remove();
  //   link.enter()
  //     .append("g")
  //     .attr("class", "link")
  //     .append("line")
  //     .attr("marker-end", "url(#arrow)")
  //     .on('click', (e, d) => { this.handleEdgeMouseClick(e, d); });
  //   let newLinks = this.svg.select(".links")
  //     .selectAll(".link").selectAll("line");

  //   let node = this.svg.select(".nodes")
  //     .selectAll(".node")
  //     .data(this.nodes, function (d) { return d.id; });
  //   node.exit().remove();
  //   let newNode = node.enter()
  //     .append("g")
  //     .attr("class", "node");

  //   let rect = newNode
  //     .append("rect")
  //     .attr("id", function (d) { return d.id; })
  //     .attr("width", this.rectWidth)
  //     .attr("height", this.rectHeight)
  //     .on('pointermove', (e) => { this.handleMouseMovement(e); })
  //     .on('click', (e, d) => { this.handleNodeMouseClick(e, d); });
  //   // .call(d3.drag()
  //   //   .on("start", (d) => dragstarted(d))
  //   //   .on("drag", (d) => dragged(d))
  //   //   .on("end", (d) => dragended(d)));

  //   let label = newNode.append("text")
  //     .text(function (d) { return d.id; })
  //     .style("text-anchor", "middle")
  //     .style("fill", "#555")
  //     .style("font-family", "Arial")
  //     .style("font-size", 12);


  //   newNode.append("title")
  //     .text(function (d) { return d.id; });

  //   this.simulation
  //     .nodes(this.nodes);
  //   this.simulation.force("link")
  //     .links(this.links);
  //   //this.simulation.on("tick", ticked);
  //   this.simulation.alphaTarget(0.0).restart();
  // }

  handleMouseMovement(e) {
    //console.log('Mm', e);
  }

  //e = event, d = (logical) node that has been clicked on
  handleNodeMouseClick(e, d) {
    console.log('Mc e', e);
    console.log('Mc d', d);
    //d.fx = 300;
    //find the target (logical) node. d is a reference to it and can directly manipulate it.
    //this.findNodeNeighbours(d);
    let targetNode = this.nodes.find(n => n.id == d.id);
    if (targetNode) {
      //select node HTMLElement that was clicked on and change fill color

      let nodesToShow = this.graphStore.traverse(targetNode);
      //Clicked node must be pushed, because it isn't included by the traverse method
      nodesToShow.push(d);
      let edgesToShow = this.filterEdges(nodesToShow, this.graphStore.state.graph.edges);

      //if true, only the partial graph will be rendered
      if (this.isPartialGraphView) {
        this.nodes = nodesToShow;
        this.links = edgesToShow;
        console.log("l", this.graphStore.l(targetNode));
        this.renderSvg();
      }

      //color
      this.colorNodes(nodesToShow);
      this.colorEdges(edgesToShow);
      d3.selectAll("rect").filter((n: Node) => (n.id == (d.id))).style("fill", "#ff0");
    }
  }

  colorNodes(nodesToColor) {
    this.deselectAll();
    nodesToColor.forEach(element => {
      d3.selectAll("rect").filter((d: Node) => (d.id == (element.id))).style("fill", "#0f0");
    });
  }

  colorEdges(edgesToColor) {
    edgesToColor.forEach(element => {
      let edgeDOM = d3.selectAll("line").filter((d: Edge) => (d == element));
      edgeDOM.style("stroke", "#0f0").attr("marker-end", "url(#arrow-out)");
    });
  }

  //e = event, d = (logical) edge that has been clicked on
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

  toggleIsPartialGraphView() {
    this.isPartialGraphView = !this.isPartialGraphView;
  }

  findNodeNeighbours(clickedNode: Node) {
    this.deselectAll();
    let edges = this.links.filter((n: Edge) => (n.source == clickedNode || n.target == clickedNode));
    edges.forEach(element => {
      let edgeDOM = d3.selectAll("line").filter((d: Edge) => (d == element));

      //nodes that interact with clickedNode
      if (element.source != clickedNode) {
        //take elements source and find that node
        d3.selectAll("rect").filter((d: Node) => d.id == (element.source as Node).id).style("fill", "#f00");
        edgeDOM.style("stroke", "#f00").attr("marker-end", "url(#arrow-in)");
      }

      //nodes that clickedNode interacts with
      if (element.target != clickedNode) {
        //take elements target and find that node
        d3.selectAll("rect").filter((d: Node) => (d.id == (element.target as Node).id)).style("fill", "#0f0");
        edgeDOM.style("stroke", "#0f0").attr("marker-end", "url(#arrow-out)");
      }
    });
  }

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
    if (this.isPartialGraphView) {
      this.nodes = this.graphStore.state.graph.nodes;
      this.links = this.graphStore.state.graph.edges;
      this.renderSvg();
    } else {
      this.deselectAll();
    }
  }
}
