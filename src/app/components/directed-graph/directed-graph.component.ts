import { Component, OnInit } from '@angular/core';
import { GraphJSON, Graph, Node, Edge } from "../../domain/entities/entities";
import * as d3 from 'd3';
import { DataService } from 'src/app/services/data.service';
import LineColumnFinder from 'line-column'
@Component({
  selector: 'app-directed-graph',
  templateUrl: './directed-graph.component.html',
  styleUrls: ['./directed-graph.component.css']
})
export class DirectedGraphComponent implements OnInit {

  private nodes: Node[];

  private links: Edge[];

  private margin = 50;
  private width = 500 - (this.margin * 2);
  private height = 500 - (this.margin * 2);
  private svg;
  private simulation;

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.getDataJson('assets/test.vue/data.json').subscribe(data => {
      let graph = Graph.fromJson((data as GraphJSON));
      console.log("Options", graph.options);
      console.log("Nodes", graph.nodes);
      console.log("Edges", graph.edges);
      this.nodes = graph.nodes;
      this.links = graph.edges;
      this.createSvg();
    });
    this.dataService.getVueCode('assets/test.vue/test.vue').subscribe(data => {
      let begin = new LineColumnFinder(data).toIndex(5,9);
      let end = new LineColumnFinder(data).toIndex(5,29);
      console.log("bruh",data.slice(begin, end))
    });
  }

  private createSvg(): void {
    this.svg = d3.select('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append("g")
      .attr("transform", "translate(" + this.margin + "," + this.margin + ")");

    this.simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id((d: any) => { return d.id; }))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(this.width / 2, this.height / 2));

    let link = this.svg.append("g")
      .attr("class", "links")
      .style("stroke", "#000")
      .selectAll("line")
      .data(this.links)
      .enter().append("line");

    let node = this.svg.append("g")
      .attr("class", "nodes")
      .selectAll("rect")
      .data(this.nodes)
      .enter().append("rect")
      .attr("width", 150)
      .attr("height", 25)
      .on('pointermove', (e) => { this.handleMouseMovement(e); })
      .on('click', (e) => { this.handleMouseClick(e); });
    // .call(d3.drag()
    //   .on("start", (d) => dragstarted(d))
    //   .on("drag", (d) => dragged(d))
    //   .on("end", (d) => dragended(d)));


    node.append("title")
      .text(function (d) { return d.name; });

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
    this.simulation.restart();
  }

  handleMouseMovement(e) {
    console.log('Mm', e);
  }

  handleMouseClick(e) {
    console.log('Mc', e);
  }
}
