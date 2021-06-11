import { NodeValueJSON } from './NodeValueJSON';

export interface NodeJSON {
  v?: string | null;
  value?: NodeValueJSON | null;
  parent?: any | null;
}
