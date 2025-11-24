
export function formatSRTTime(seconds: number): string {
  const date = new Date(0);
  date.setSeconds(Math.floor(seconds));
  date.setMilliseconds((seconds % 1) * 1000);
  const timeStr = date.toISOString().substr(11, 8);
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${timeStr},${ms}`;
}

export function generateSRT(segments: { start: number; end: number; text: string }[]): string {
  return segments
    .map((seg, index) => {
      return `${index + 1}\n${formatSRTTime(seg.start)} --> ${formatSRTTime(seg.end)}\n${seg.text}\n`;
    })
    .join('\n');
}
