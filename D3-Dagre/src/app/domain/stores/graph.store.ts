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

  linesToHighlight: string = "";
  testString: string = "empty";
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
}
