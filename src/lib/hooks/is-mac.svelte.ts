export const isMac = navigator.userAgent.includes('Mac');

/** `Ctrl` for windows or `⌘` for mac */
export const ctrlOrCmdKey = isMac ? '⌘' : 'Ctrl';

/** `Alt` for windows or `⌥` for mac */
export const altOrOptionKey = isMac ? '⌥' : 'Alt';
