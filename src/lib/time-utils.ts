/**
 * 时间格式转换
 *
 * 短格式：20160727-123456
 * 标准格式：2016-07-27 12:34:56
 */

/**
 * 短格式转标准格式
 * @param compact 20160727-123456
 * @returns 2016-07-27 12:34:56
 */
export function parseCompactTime(compact: string): string {
  const match = compact.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid compact time format: ${compact}`);
  }

  const [, year, month, day, hour, minute, second] = match;
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * 标准格式转短格式
 * @param standard 2016-07-27 12:34:56
 * @returns 20160727-123456
 */
export function toCompactTime(standard: string): string {
  const match = standard.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid standard time format: ${standard}`);
  }

  const [, year, month, day, hour, minute, second] = match;
  return `${year}${month}${day}-${hour}${minute}${second}`;
}

/**
 * 短格式转input所需的格式
 * @param compact 20160727-123456
 * @returns { date: "2016-07-27", time: "12:34:56" }
 */
export function parseCompactTimeForInput(compact: string): { date: string; time: string } {
  const match = compact.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid compact time format: ${compact}`);
  }

  const [, year, month, day, hour, minute, second] = match;
  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}:${second}`
  };
}

/**
 * 短格式转人类可读格式（用于UI展示）
 * @param compact 20160727-123456
 * @returns "2016-07-27\n12:34:56"
 */
export function formatCompactTimeForDisplay(compact: string): string {
  const standard = parseCompactTime(compact);
  return standard.replace(" ", "\n");
}

/**
 * 验证短格式是否合法
 * @param compact 待验证的字符串
 * @returns 是否为合法的短格式
 */
export function isValidCompactTime(compact: string): boolean {
  return /^\d{8}-\d{6}$/.test(compact);
}
