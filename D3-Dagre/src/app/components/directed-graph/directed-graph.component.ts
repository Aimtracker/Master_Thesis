import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';

import * as d3 from 'd3';
import dagreD3 from "dagre-d3";
import { DataService } from 'src/app/services/data.service';
import _ from "lodash/fp";
import { Edge } from 'src/app/domain/classes/edge';
import { Node } from 'src/app/domain/classes/node';
import { Graph } from 'src/app/domain/classes/graph';
import { EdgeType, NodeType } from 'src/app/domain/enums/enums';
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

  private g;
  private nodes: Node[];
  private links: Edge[];

  pathToJsonFile: string = 'assets/test.vue/data.json';

  private svg;

  private ngUnsubscribe = new Subject();

  constructor(private graphStore: GraphStore, private dataService: DataService,) { }

  ngOnInit(): void {
    this.graphStore.state$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(state => {
        console.log("State:", state);
      });
    this.prepareData();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }



  private prepareData() {
    this.dataService.getDataJson(this.pathToJsonFile).subscribe(gData => {
      let graph = Graph.fromJson((gData as GraphJSON));
      this.graphStore.setGraph(graph);

        console.log("Nodes", this.graphStore.state.graph.nodes);
        console.log("Edges", this.graphStore.state.graph.edges);

        this.nodes = this.graphStore.state.graph.nodes;
        this.links = this.graphStore.state.graph.edges;

        this.generateGraph();
    });
  }


  generateGraph() {

    // Create the input graph
    this.g = new dagreD3.graphlib.Graph({ compound: true })
      .setGraph({})
      .setDefaultEdgeLabel(function () { return {}; });

    //create groups
    this.g.setNode('group', { label: '', clusterLabelPos: 'top', style: 'fill: #d3d7e8' });
    this.g.setNode('top_group', { label: 'Tag Nodes', clusterLabelPos: 'top', style: 'fill: #ffd47f' });
    this.g.setNode('bottom_group', { label: 'Other Nodes', clusterLabelPos: 'top', style: 'fill: #5f9488' });
    this.g.setParent('top_group', 'group');
    this.g.setParent('bottom_group', 'group');

    //create nodes and assign nodes to group

    this.nodes.forEach((element) => {
      this.g.setNode(element.id, { labelType: "html", label: element.name + this.getLocString(element), value: element });

      //set group
      if (element.isTagNode()) {
        this.g.setParent(element.id, "top_group");
      } else if (!element.isInitNode()) {
        this.g.setParent(element.id, "bottom_group");
      }else{
        this.g.setParent(element.id, "group");
      }
    });

    //create edges
    this.links.forEach((element) => {
      this.g.setEdge(element.source, element.target, { class: this.getEdgeClass(element.label), value: element.label });
    });

    this.renderGraph();
  }

  shuffleNodes(){
    this.nodes = this.shuffle(this.nodes);
    this.generateGraph();
  }

  shuffleEdges(){
    this.links = this.shuffle(this.links);
    this.generateGraph();
  }

  shuffleAll(){
    this.shuffleNodes();
    this.shuffleEdges();
  }

  // function to shuffle the list...
  shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i -= 1) {
      j = Math.floor(Math.random() * i);
      x = a[i - 1];
      a[i - 1] = a[j];
      a[j] = x;
    }
    return a;
  }

  renderGraph() {
    this.g.graph().rankdir = "TB";
    this.g.graph().nodesep = 60;
    var render = new dagreD3.render();

    // Set up an SVG group so that we can translate the final graph.
    this.svg = d3.select("svg");
    var svgGroup = this.svg.append("g");

    // Run the renderer. This is what draws the final graph.
    render(d3.select("svg g"), this.g);

    // set svg height and width according to the graph size
    this.svg.attr("width", this.g.graph().width + 40);
    this.svg.attr("height", this.g.graph().height + 40);
  }

  getLocString(d: Node) {
    if (d.loc) {
      if (d.loc.start.line == d.loc.end.line) {
        return "<br>h: " + d.loc.start.line;
      } else {
        return "<br>h: " + d.loc.start.line + "-" + d.loc.end.line;
      }
    } else {
      return "";
    }
  }

  getEdgeClass(d: string) {
    console.log(d);
    if (d == EdgeType.EVENT)
      return "thick";
    else if (d == EdgeType.SIMPLE)
      return "dotted";
  }
}
