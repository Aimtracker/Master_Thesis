import { IdentifierType, NodeType } from '../enums/enums';
import { NodeValueJSON } from '../models/NodeValueJSON';
import { Location } from '../models/Location';

export class Node {
  id: string;
  name: string;
  loc: Location;
  discriminator: NodeType;
  parent: string;
  type: IdentifierType;

  static fromJson(json: NodeValueJSON): Node {
    const o = Object.create(Node.prototype);
    return Object.assign(o, json);
  }

  isMethodNode(n: Node): boolean {
    return n.discriminator === NodeType.METHOD;
  }

  isTagNode(n: Node): boolean {
    return n.discriminator === NodeType.TAG;
  }
}
