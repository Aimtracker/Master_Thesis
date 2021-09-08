import { IdentifierType, NodeType } from '../enums/enums';
import { Location } from './Location';

export interface NodeValueJSON {
  id?: string;
  name?: string;
  loc?: Location;
  discriminator?: NodeType;
  parent?: string;
  type?: IdentifierType;
}
