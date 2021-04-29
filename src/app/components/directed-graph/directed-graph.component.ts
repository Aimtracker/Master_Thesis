import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-directed-graph',
  templateUrl: './directed-graph.component.html',
  styleUrls: ['./directed-graph.component.css']
})
export class DirectedGraphComponent implements OnInit {

  private nodes = [
    { id: 1, name: "NodeA", type: "UI" },
    { id: 2, name: "NodeB", type: "Event" },
    { id: 3, name: "NodeC", type: "Event" },
    { id: 4, name: "NodeD", type: "UI" }
  ];

  private links = [
    { source: 1, target: 2 },
    { source: 1, target: 3 },
    { source: 4, target: 2 }
  ];

  private margin = 50;
  private width = 500 - (this.margin * 2);
  private height = 500 - (this.margin * 2);
  private svg;
  private simulation;

  constructor() { }

  ngOnInit(): void {
    this.createSvg();
  }

  private createSvg(): void {
    this.svg = d3.select('body')
      .append('svg')
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
      .selectAll("circle")
      .data(this.nodes)
      .enter().append("circle")
      .attr("r", 5);
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
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; });
    }
  }

  private drawBars(data: any[]): void {
    // Create the X-axis band scale
    const x = d3.scaleBand()
      .range([0, this.width])
      .domain(data.map(d => d.Framework))
      .padding(0.2);

    // Draw the X-axis on the DOM
    this.svg.append("g")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    // Create the Y-axis band scale
    const y = d3.scaleLinear()
      .domain([0, 200000])
      .range([this.height, 0]);

    // Draw the Y-axis on the DOM
    this.svg.append("g")
      .call(d3.axisLeft(y));

    // Create and fill the bars
    this.svg.selectAll("bars")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => x(d.Framework))
      .attr("y", d => y(d.Stars))
      .attr("width", x.bandwidth())
      .attr("height", (d) => this.height - y(d.Stars))
      .attr("fill", "#d04a35");
  }

}
