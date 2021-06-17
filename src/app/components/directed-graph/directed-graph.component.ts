import { Component, OnInit, ViewEncapsulation } from '@angular/core';

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

@Component({
  selector: 'app-directed-graph',
  templateUrl: './directed-graph.component.html',
  styleUrls: ['./directed-graph.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DirectedGraphComponent implements OnInit {

  nodes: Node[];

  private links: Edge[];

  graph: Graph;

  private margin = 50;
  private width = 1000 - (this.margin * 2);
  private height = 1000 - (this.margin * 2);

  private rectHeight = 25;
  private rectWidth = 150;

  private svg;
  private simulation;

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.prepareData();
  }

  private prepareData() {
    this.dataService.getDataJson('assets/test.vue/data.json').subscribe(gData => {
      let graph = Graph.fromJson((gData as GraphJSON));
      this.graph = graph;

      this.dataService.getVueCode('assets/test.vue/test.vue').subscribe(data => {
        graph.nodes.map(e => {
          if (e.discriminator == NodeType.TAG) {
            e.loc.codeString = getCodeString(data, e.loc.start, e.loc.end);
          }
        });

        console.log("Options", graph.options);
        console.log("Nodes", graph.nodes);
        console.log("Edges", graph.edges);



        this.nodes = graph.nodes;
        this.links = graph.edges;
        this.extractUIGraph(graph);
        this.createSvg();
      });
    });
  }

  //Only the Init-Node, Tag-Nodes and nodes they interact with should be visible in this graph
  private extractUIGraph(fullGraph: Graph) {
    let newGraph: Graph = new Graph();
    let newEdges = fullGraph.edges.filter(e => e.label == EdgeType.EVENT);
    //All nodes of Type TAG or INIT and the nodes that are targets of the event Edges.
    let newNodes = fullGraph.nodes.filter(e => (e.discriminator == NodeType.TAG || e.discriminator == NodeType.INIT) /*|| e.id == newEdges.find(el => el.target.id == e.id)*/);
    newGraph.edges = newEdges;
    newGraph.nodes = newNodes;
    newGraph.options = fullGraph.options;

    console.log("NG-Nodes", newGraph.nodes);
    console.log("NG-Edges", newGraph.edges);

    //this.nodes = newGraph.nodes;
    //this.links = newGraph.edges;
    //this.nodes = fullGraph.nodes;
    //this.links = fullGraph.edges;
  }


  private createSvg(): void {
    this.svg = d3.select('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append("g")
      .attr("transform", "translate(" + this.margin + "," + this.margin + ")");

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
      .on('click', (e, d) => { this.handleNodeMouseClick(e, d); });
    // .call(d3.drag()
    //   .on("start", (d) => dragstarted(d))
    //   .on("drag", (d) => dragged(d))
    //   .on("end", (d) => dragended(d)));

    let label = node.append("text")
      .text(function (d) { return d.id; })
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
      link
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

      rect
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; });

      label
        .attr("x", function (d) { return d.x + 75; })
        .attr("y", function (d) { return d.y + 15; });
    }
    // this.simulation.alphaTarget(0.3);
  }

  updateSvg(): void {

    let link = this.svg.select(".links")
      .selectAll(".link")
      .data(this.links, function (d) { return d.source.id + "-" + d.target.id; });
      console.log(link.data())
    link.exit().remove();
    link.enter()
      .append("g")
      .attr("class", "link")
      .append("line")
      .attr("marker-end", "url(#arrow)")
      .on('click', (e, d) => { this.handleEdgeMouseClick(e, d); });

    let node = this.svg.select(".nodes")
      .selectAll(".node")
      .data(this.nodes, function (d) { return d.id; });
    node.exit().remove();
    node.enter()
      .append("g")
      .attr("class", "node");

    let rect = node
      .append("rect")
      .attr("id", function (d) { return d.id; })
      .attr("width", this.rectWidth)
      .attr("height", this.rectHeight)
      .on('pointermove', (e) => { this.handleMouseMovement(e); })
      .on('click', (e, d) => { this.handleNodeMouseClick(e, d); });
    // .call(d3.drag()
    //   .on("start", (d) => dragstarted(d))
    //   .on("drag", (d) => dragged(d))
    //   .on("end", (d) => dragended(d)));

    let label = node.append("text")
      .text(function (d) { return d.id; })
      .style("text-anchor", "middle")
      .style("fill", "#555")
      .style("font-family", "Arial")
      .style("font-size", 12);


    node.append("title")
      .text(function (d) { return d.id; });

      this.simulation
      .nodes(this.nodes)
      .force("link")
      .links(this.links);
  }

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
      console.log("sel", d3.select(e.currentTarget).style("fill", "#ff0"));
      let nodesToShow = this.traverse(this.graph, targetNode);
      //Clicked node must be pushed, because it isn't included by the traverse method
      nodesToShow.push(d);
      let edgesToShow = this.filterEdges(nodesToShow, this.graph.edges);
      console.log("nodesToShow", nodesToShow);
      console.log("edgesToShow", edgesToShow);
      this.nodes = nodesToShow;
      this.links = edgesToShow;
      console.log("l", this.l(this.graph, targetNode));
      this.updateSvg();
    }
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

  // NOT MINE
  nodeTriggerableByEvent(graph: Graph, node: Node): boolean {
    const edges = graph.inEdges(node);
    return _.some((x) => x.label === EdgeType.EVENT, edges);
  }

  traverse(
    graph: Graph,
    node: Node,
    visited: Node[] = []
  ): Node[] {
    function alreadyVisited(id: Node): boolean {
      return _.find(_.isEqual(id), visited) !== undefined;
    }

    function inner(id: Node) {
      if (alreadyVisited(id)) return;
      visited.push(id);

      const reachable = graph
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
              if (x.target.isMethodNode() /*&& this.nodeTriggerableByEvent(graph, x.target)*/) {
                return false;
                //property chain or tag or reads relation
              } else return true;
          }
        })

        .map((x) => x.target);

      //  console.log(`traverse(${id.id}) -> ${reachable.map((x) => x.id)}`);
      reachable?.forEach(inner);
    }

    //inner is not allowed to travel event edges (and shouldn't be)
    //that's why events are traversed here
    const reachableFromNodeByAnyMeans = graph.outEdges(node);

    //if (node.name !== "created") return [];
    reachableFromNodeByAnyMeans.forEach((x) => inner(x.target));
    return Array.from(visited);
  }

  l(graph: Graph, node: Node): Node[] {
    const preorder = this.traverse(graph, node);
    return preorder.filter(element => element.isTagNode());

    //return _.filter(this.isTagNode, preorder);
  }
}
