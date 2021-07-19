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
  group: number;

  static fromJson(json: NodeValueJSON): Node {
    const o = Object.create(Node.prototype);
    return Object.assign(o, json);
  }

  isMethodNode(): boolean {
    return this.discriminator === NodeType.METHOD;
  }

  isTagNode(): boolean {
    return this.discriminator === NodeType.TAG;
  }

  isInitNode(): boolean {
    return this.discriminator === NodeType.INIT;
  }

  isDataNode(): boolean {
    return this.discriminator === NodeType.DATA;
  }
}
