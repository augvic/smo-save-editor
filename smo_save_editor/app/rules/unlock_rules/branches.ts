// The values the save stores for which kingdom of a pair was reached first.
// Constants, so a file inside the `unlock_rules` folder rather than a component.

export const FIRST_BRANCH = { none: 0, wooded: 1, lake: 2 } as const;
export const SECOND_BRANCH = { none: 0, seaside: 3, snow: 4 } as const;
