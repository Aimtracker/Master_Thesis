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
import { TestBed } from '@angular/core/testing';

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

  private nodeSize: number = 20.0;

  private svg;
  private zoomContainer;
  private simulation;

  private ngUnsubscribe = new Subject();

  scenarios = [
    {
      name: "test.vue",
      pathToVueFile: 'assets/test.vue/test.vue',
      pathToJsonFile: 'assets/test.vue/data.json'
    },
    {
      name: "daily-meal.vue",
      pathToVueFile: 'assets/daily-meal.vue/daily-meal.vue',
      pathToJsonFile: 'assets/daily-meal.vue/data.json'
    },
    {
      name: "test-add-sub-v2.vue",
      pathToVueFile: 'assets/test-add-sub-v2.vue/test-add-sub-v2.vue',
      pathToJsonFile: 'assets/test-add-sub-v2.vue/data.json'
    },
    {
      name: "test-add-sub-v3.vue",
      pathToVueFile: 'assets/test-add-sub-v3.vue/test-add-sub-v3.vue',
      pathToJsonFile: 'assets/test-add-sub-v3.vue/data.json'
    },
    {
      name: "test-add-sub.vue",
      pathToVueFile: 'assets/test-add-sub.vue/test-add-sub.vue',
      pathToJsonFile: 'assets/test-add-sub.vue/data.json'
    },
    {
      name: "test-computed.vue",
      pathToVueFile: 'assets/test-computed.vue/test-computed.vue',
      pathToJsonFile: 'assets/test-computed.vue/data.json'
    },
    {
      name: "test-lists.vue",
      pathToVueFile: 'assets/test-lists.vue/test-lists.vue',
      pathToJsonFile: 'assets/test-lists.vue/data.json'
    },
  ];

  forceProperties = {
    center: {
      x: 0.5,
      y: 0.5
    },
    charge: {
      enabled: true,
      strength: -600,
      distanceMin: 200,
      distanceMax: 20000
    },
    collide: {
      enabled: true,
      strength: .7,
      iterations: 10,
      radius: 70
    },
    forceX: {
      enabled: false,
      strength: .1,
      x: .5
    },
    forceY: {
      enabled: false,
      strength: .1,
      y: .5
    },
    link: {
      enabled: true,
      distance: 30,
      iterations: 1
    }
  };


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
  }


  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }



  prepareData() {
    this.dataService.getDataJson(this.pathToJsonFile).subscribe(gData => {
      let graph = Graph.fromJson((gData as GraphJSON));
      this.graphStore.setGraph(graph);
      //this.graphStore.something();
      this.dataService.getVueCode(this.pathToVueFile).subscribe(data => {
        this.fullCodeString = data;
        graph.nodes.map(e => {
          if (e.discriminator == NodeType.TAG) {
            e.loc.codeString = getCodeString(data, e.loc.start, e.loc.end);
          }
        });

        console.log("Nodes", this.graphStore.state.graph.nodes);
        console.log("Edge", this.graphStore.state.graph.edges);

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
  renderSvg(): void {
    this.svg.select('g').selectAll('*').remove();


    this.simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id((d: any) => { return d.id; })/*.strength((d:any) => {console.log("str", d.value);return d.value})*//*.distance((d:any) => {return d.value})*/)
      .force('charge', d3.forceManyBody().strength(-2000).distanceMin(100))
      .force("collide", d3.forceCollide())
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force("forceX", d3.forceX())
      .force("forceY", d3.forceY());

    // build the arrow.
    let arrow = this.zoomContainer.append("svg:defs").selectAll("marker")
      .data(["arrow", "arrow-in", "arrow-out", "arrow-marked"]) // Different link/path types can be defined here
      .enter().append("svg:marker")    // This section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
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
      .attr("class", (d) => {
        if (d.label == EdgeType.EVENT)
          return "thick";
        else if (d.label == EdgeType.SIMPLE)
          return "dotted";
      })
      .attr("marker-end", "url(#arrow)")
      .on('click', (e, d) => { e.stopPropagation(); this.handleEdgeMouseClick(e, d); });

    let node = this.zoomContainer.append("g")
      .attr("class", "nodes")
      .selectAll(".node")
      .data(this.nodes).enter()
      .append("g")
      .attr("class", "node");



    // let rect = node
    //   .append("rect")
    //   .attr("id", function (d) { return d.id; })
    //   .attr("width", this.rectWidth)
    //   .attr("height", this.rectHeight)
    //   .on('pointermove', (e) => { this.handleMouseMovement(e); })
    //   .on('click', (e, d) => { e.stopPropagation(); this.handleNodeMouseClick(e, d); });
    // .call(d3.drag()
    //   .on("start", (d) => dragstarted(d))
    //   .on("drag", (d) => dragged(d))
    //   .on("end", (d) => dragended(d)));

    let rect = node
      .append("rect")
      .attr("id", function (d) { return d.id; })
      .attr("y", -this.nodeSize)
      .attr("height", this.nodeSize * 2)
      .attr("rx", this.nodeSize)
      .attr("ry", this.nodeSize)
      .on('pointermove', (e) => { this.handleMouseMovement(e); })
      .on('click', (e, d) => { e.stopPropagation(); this.handleNodeMouseClick(e, d); })
      .on("dblclick", (e, d) => { e.stopPropagation(); this.handleNodeMouseDoubleClick(e, d); })
      .call(d3.drag()
        .on("drag", (e, d) => this.dragged(e, d)));


    // let label = node.append("text")
    //   .text(function (d) { return d.name; })
    //   .style("text-anchor", "middle")
    //   .style("fill", "#555")
    //   .style("font-family", "Arial")
    //   .style("font-size", 12);

    let label = node.append("text")
      .attr("class", (d) => { return d.loc ? "node-text node-text-top" : "node-text"; })
      .text(function (d) { return d.name; })
      .each((d, i, n) => {
        var textEl = d3.select(n[i]);
        var circleWidth = this.nodeSize * 2,
          textLength = textEl.node().getComputedTextLength(),
          textWidth = textLength + this.nodeSize;
        d.nodeSize = this.nodeSize;
        d.rectHeight = this.nodeSize * 2;
        if (circleWidth > textWidth) {
          d.isCircle = true;
          d.rectX = -this.nodeSize;
          d.rectWidth = circleWidth;
        } else {
          d.isCircle = false;
          d.rectX = -(textLength + this.nodeSize) / 2;
          d.rectWidth = textWidth;
          d.textLength = textLength;
        }
      });

    let posLabel = node.append("text")
      .attr("class", (d) => { return d.loc ? "node-text node-text-bottom" : "node-text"; })
      .text(function (d) {
        if (d.loc) {
          if (d.loc.start.line == d.loc.end.line) {
            return "h: " + d.loc.start.line;
          } else {
            return "h: " + d.loc.start.line + "-" + d.loc.end.line;
          }
        } else {
          return "";
        }
      })
      .each((d, i, n) => {
        if (d.loc) {
          var textEl = d3.select(n[i]);
          var circleWidth = this.nodeSize * 2,
            textLength = textEl.node().getComputedTextLength(),
            textWidth = textLength + this.nodeSize;
          if (textLength > d.textLength) {
            d.nodeSize = this.nodeSize;
            d.rectHeight = this.nodeSize * 2;
            if (circleWidth > textWidth) {
              d.isCircle = true;
              d.rectX = -this.nodeSize;
              d.rectWidth = circleWidth;
            } else {
              d.isCircle = false;
              d.rectX = -(textLength + this.nodeSize) / 2;
              d.rectWidth = textWidth;
              d.textLength = textLength;
            }
          }
        }
      });


    node.select("rect")
      .attr("x", function (d) { return d.rectX; })
      .attr("width", function (d) { return d.rectWidth; });

    node.append("title")
      .text(function (d) { return d.id; });

    this.simulation
      .nodes(this.nodes)
      .on("tick", this.ticked);
    //.alphaDecay(0);

    this.simulation.force("link")
      .links(this.links);

    //this.updateForces();
    // this.simulation.alphaTarget(0.3);
  }


  ticked() {

    d3.selectAll("rect").each((d: any) => {
      if (d.isCircle) {
        d.leftX = d.rightX = d.x;
      } else {
        d.leftX = d.x - d.textLength / 2 + d.nodeSize / 2;
        d.rightX = d.x + d.textLength / 2 - d.nodeSize / 2;
      }
    });

    //TODO: See if this interferes with the edge function
    // d3.select('svg').select(".links")
    //   .selectAll(".link").selectAll("line")
    //   .attr("x1", function (d: any) { return d.source.x; })
    //   .attr("y1", function (d: any) { return d.source.y; })
    //   .attr("x2", function (d: any) { return d.target.x; })
    //   .attr("y2", function (d: any) { return d.target.y; });

    // d3.select('svg').selectAll("rect")
    //   .attr("x", function (d: any) { return d.x; })
    //   .attr("y", function (d: any) { return d.y; });

    d3.select('svg').selectAll(".node")
      .attr("transform", function (d: any) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    // d3.select('svg').selectAll("text")
    //   .attr("x", function (d: any) { console.log("dx", d);return d.x; })
    //   .attr("y", function (d: any) { console.log("dy", d);return d.y + d.nodeSize; });
    d3.select('svg').selectAll("line").call(edge);

    // Sets the (x1, y1, x2, y2) line properties for graph edges.
    function edge(selection) {
      selection
        .each(function (d) {
          var sourceX, targetX, midX, dx, dy, angle;

          // This mess makes the arrows exactly perfect.
          if (d.source.rightX < d.target.leftX) {
            sourceX = d.source.rightX;
            targetX = d.target.leftX;
          } else if (d.target.rightX < d.source.leftX) {
            targetX = d.target.rightX;
            sourceX = d.source.leftX;
          } else if (d.target.isCircle) {
            targetX = sourceX = d.target.x;
          } else if (d.source.isCircle) {
            targetX = sourceX = d.source.x;
          } else {
            midX = (d.source.x + d.target.x) / 2;
            if (midX > d.target.rightX) {
              midX = d.target.rightX;
            } else if (midX > d.source.rightX) {
              midX = d.source.rightX;
            } else if (midX < d.target.leftX) {
              midX = d.target.leftX;
            } else if (midX < d.source.leftX) {
              midX = d.source.leftX;
            }
            targetX = sourceX = midX;
          }

          dx = targetX - sourceX;
          dy = d.target.y - d.source.y;
          angle = Math.atan2(dx, dy);
          var nodeSize = 20;

          // Compute the line endpoint such that the arrow
          // is touching the edge of the node rectangle perfectly.
          d.sourceX = sourceX + Math.sin(angle) * nodeSize;
          d.targetX = targetX - Math.sin(angle) * nodeSize;
          d.sourceY = d.source.y + Math.cos(angle) * nodeSize;
          d.targetY = d.target.y - Math.cos(angle) * nodeSize;
        })
        .attr("x1", function (d) { return d.sourceX; })
        .attr("y1", function (d) { return d.sourceY; })
        .attr("x2", function (d) { return d.targetX; })
        .attr("y2", function (d) { return d.targetY; });
    }
  }

  updateForces() {
    // get each force by name and update the properties
    this.simulation.force("center")
      .x(this.width * this.forceProperties.center.x)
      .y(this.height * this.forceProperties.center.y);
    this.simulation.force("charge")
      .strength(this.forceProperties.charge.enabled ? this.forceProperties.charge.strength : 0)
      .distanceMin(this.forceProperties.charge.distanceMin)
      .distanceMax(this.forceProperties.charge.distanceMax);
    this.simulation.force("collide")
      .strength(this.forceProperties.collide.enabled ? this.forceProperties.collide.strength : 0)
      .radius(this.forceProperties.collide.radius)
      .iterations(this.forceProperties.collide.iterations);
    this.simulation.force("forceX")
      .strength(this.forceProperties.forceX.enabled ? this.forceProperties.forceX.strength : 0)
      .x(this.width * this.forceProperties.forceX.x);
    this.simulation.force("forceY")
      .strength(this.forceProperties.forceY.enabled ? this.forceProperties.forceY.strength : 0)
      .y(this.height * this.forceProperties.forceY.y);
    this.simulation.force("link")
      .id(function (d) { return d.id; })
      .distance(this.forceProperties.link.distance)
      .iterations(this.forceProperties.link.iterations)
      .links(this.forceProperties.link.enabled ? this.links : []);

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    this.simulation.alpha(0.1).restart();
  }

  dragged(e, d) {
    console.log("DRAGGED");
    this.simulation.alpha(0.1).restart();
    d.fx = e.x;
    d.fy = e.y;
  }

  /**
    * Handles mouse movement.
    */
  handleMouseMovement(e) {
    //console.log('Mm', e);
  }

  handleNodeMouseDoubleClick(e, d) {
    this.simulation.alpha(0.1).restart();
    d.fx = null;
    d.fy = null;
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

  changeScenario(scenarioName){
    this.pathToVueFile = this.scenarios.find(e => e.name == scenarioName).pathToVueFile
    this.pathToJsonFile = this.scenarios.find(e => e.name == scenarioName).pathToJsonFile
    this.prepareData();
  }
}
