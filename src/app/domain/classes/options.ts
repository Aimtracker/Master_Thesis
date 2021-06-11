import { OptionsJSON } from '../models/OptionsJSON';

export class Options {
  directed: boolean;
  multigraph: boolean;
  compound: boolean;

  static fromJson(json: OptionsJSON): Options {
    const o = Object.create(Options.prototype);
    return Object.assign(o, json);
  }
}
