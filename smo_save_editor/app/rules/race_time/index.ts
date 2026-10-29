// Race times in the save are whole hundredths of a second; 359999 (59:59.99) is what the game writes for "no record".

export class RaceTime {
  /** The value the game stores when there is no record. */
  static readonly NONE = 359999;

  /** 6150 -> "1:01.50" */
  static format(hundredths: number): string {
    const total = Math.max(0, Math.round(hundredths));
    const minutes = Math.floor(total / 6000);
    const seconds = Math.floor((total % 6000) / 100);
    const cents = total % 100;
    return `${minutes}:${String(seconds).padStart(2, "0")}.${String(cents).padStart(2, "0")}`;
  }

  /** "1:01.50", "61.5" or "61" -> hundredths; undefined if the text is not a time. */
  static parse(text: string): number | undefined {
    const match = /^\s*(?:(\d+):)?(\d+)(?:\.(\d{1,2}))?\s*$/.exec(text);
    if (!match) return undefined;
    const minutes = Number(match[1] ?? 0);
    const seconds = Number(match[2]);
    const cents = match[3] === undefined ? 0 : Number(match[3].padEnd(2, "0"));
    return (minutes * 60 + seconds) * 100 + cents;
  }
}
