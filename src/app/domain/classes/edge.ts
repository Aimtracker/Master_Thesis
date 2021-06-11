import { EdgeType } from '../enums/enums';
import { EdgeJSON } from '../models/EdgeJSON';
import { Node } from './node';

export class Edge {
  source: Node;
  target: Node;
  label: EdgeType;

  static fromJson(json: EdgeJSON): Edge {
    const o = Object.create(Edge.prototype);
    json.v ? o.source = json.v : null;
    json.w ? o.target = json.w : null;
    json.value ? o.label = json.value as keyof typeof EdgeType : null;
    return o;
  }
}
