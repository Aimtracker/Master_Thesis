declare module 'line-column' {
  export default class LineColumnFinder {
    constructor(str: string, options?: any);
    fromIndex(index: number): Object | null;
    toIndex(line: number | Object, column: number): number;
    private buildLineToIndex(str): number[];
    private findLowerIndexInRangeArray(value: number, arr: number[]): number;
  }
}

