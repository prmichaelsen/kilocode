/**
 * Inserts multiple groups of elements at specified indices in an array
 * @param original Array to insert into, split by lines
 * @param insertGroups Array of groups to insert, each with an index and elements to insert.
 *                     If index is -1, the elements will be appended to the end of the array.
 * @returns New array with all insertions applied
 */
export interface InsertGroup {
    index: number;
    elements: string[];
}
export declare function insertGroups(original: string[], insertGroups: InsertGroup[]): string[];
//# sourceMappingURL=insert-groups.d.ts.map