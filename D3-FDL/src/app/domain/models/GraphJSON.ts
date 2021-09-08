import { EdgeJSON } from './EdgeJSON';
import { NodeJSON } from './NodeJSON';
import { OptionsJSON } from './OptionsJSON';

export interface GraphJSON {
  options: OptionsJSON;
  nodes: NodeJSON[];
  edges: EdgeJSON[];
}
