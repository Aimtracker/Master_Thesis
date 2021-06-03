import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { GraphJSON, Graph, Node, Edge, NodeType, LocationValue, EdgeType } from "../../domain/entities/entities";
import * as d3 from 'd3';
import { DataService } from 'src/app/services/data.service';
import LineColumnFinder from 'line-column';
@Component({
  selector: 'app-directed-graph',
  templateUrl: './directed-graph.component.html',
  styleUrls: ['./directed-graph.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DirectedGraphComponent implements OnInit {

  nodes: Node[];

  private links: Edge[];

  private margin = 50;
  private width = 1000 - (this.margin * 2);
  private height = 1000 - (this.margin * 2);
  private svg;
  private simulation;

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.prepareData();
  }

  private prepareData() {
    this.dataService.getDataJson('assets/test.vue/data.json').subscribe(gData => {
      let graph = Graph.fromJson((gData as GraphJSON));

      this.dataService.getVueCode('assets/test.vue/test.vue').subscribe(data => {
        graph.nodes.map(e => {
          if (e.discriminator == NodeType.TAG) {
            e.loc.codeString = this.getCodeString(data, e.loc.start, e.loc.end);
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
    let newNodes = fullGraph.nodes.filter(e => (e.discriminator == NodeType.TAG || e.discriminator == NodeType.INIT) || e.id == newEdges.find(el => el.target == e.id)?.target);
    newGraph.edges = newEdges;
    newGraph.nodes = newNodes;
    newGraph.options = fullGraph.options;

    console.log("NG-Nodes", newGraph.nodes);
    console.log("NG-Edges", newGraph.edges);

    //this.nodes = newGraph.nodes;
    //this.links = newGraph.edges;
  }

  //TODO: Column index is increased by 1 to fix wrong Location from JSON. Is JSON really incorrect?
  private getCodeString(data, start: LocationValue, end: LocationValue): string {
    let from = new LineColumnFinder(data).toIndex(start.line, start.column + 1);
    let to = new LineColumnFinder(data).toIndex(end.line, end.column + 1);
    return data.slice(from, to);
  }

  private createSvg(): void {
    this.svg = d3.select('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append("g")
      .attr("transform", "translate(" + this.margin + "," + this.margin + ")");

    this.simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id((d: any) => { return d.id; }))
      .force('charge', d3.forceManyBody().strength(-5000).distanceMin(100))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force("x", d3.forceX())
      .force("y", d3.forceY());

    // build the arrow.
    let arrow = this.svg.append("svg:defs").selectAll("marker")
      .data(["arrow", "arrow-in", "arrow-out"])      // Different link/path types can be defined here
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
      .selectAll("line")
      .data(this.links)
      .enter().append("line")
      .attr("marker-end", "url(#arrow)")
      .on('click', (e, d) => { this.handleEdgeMouseClick(e, d); });

    let node = this.svg.append("g")
      .attr("class", "nodes")
      .selectAll("rect")
      .data(this.nodes)
      .enter().append("rect")
      .attr("width", 150)
      .attr("height", 25)
      .on('pointermove', (e) => { this.handleMouseMovement(e); })
      .on('click', (e, d) => { this.handleNodeMouseClick(e, d); });
    // .call(d3.drag()
    //   .on("start", (d) => dragstarted(d))
    //   .on("drag", (d) => dragged(d))
    //   .on("end", (d) => dragended(d)));


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

      node
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; });
    }
    // this.simulation.alphaTarget(0.3);
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
    this.findNodeNeighbours(d);
    let targetNode = this.nodes.find(n => n.id == d.id);
    if (targetNode) {
      //select node HTMLElement that was clicked on and change fill color
      console.log("sel", d3.select(e.currentTarget).style("fill", "#ff0"));
    }
  }

  //e = event, d = (logical) edge that has been clicked on
  handleEdgeMouseClick(e, d) {
    console.log('Mc e', e);
    console.log('Mc d', d);

    //select node HTMLElement that was clicked on and change fill color
    console.log("sel", d3.select(e.currentTarget).style("stroke", "#ff0"));

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
}
