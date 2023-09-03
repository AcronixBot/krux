import dateformat from "dateformat";

export enum LogLevel {
  WARN = "yellow",
  DEBUG = "blue",
  ERROR = "red",
  INFO = "green",
}

export type Styles = keyof typeof Logger.styles;
export type BGStyles = keyof typeof Logger.bgStyles;

export default class Logger {
  public static bgStyles = {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
  };

  public static styles = {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    grey: [90, 39],
  };

  private static coloriseText(
    text: string | number,
    color: Styles,
    bgColor?: BGStyles
  ) {
    //! example: red
    //*                 `<startcolor>       <text>        <endcolor>`
    //*                 `\u001b[31m     this is text     \u001b[39m`
    let strg = `\u001b[${this.styles[color][0]}m${text}\u001b[${this.styles[color][1]}m`;

    if (bgColor) {
      let bgStrgStart = "\u001b[" + this.bgStyles[bgColor][0] + "m";
      let bgStrgEnd = "\u001b[" + this.bgStyles[bgColor][1] + "m";

      return bgStrgStart + strg + bgStrgEnd;
    }

    return strg;
  }

  protected static createDateString() {
    let dd = dateformat(new Date(), "dd.mm.yyyy HH:MM.ss", false);
    return `[${dd}]`;
  }

  private static createPrefixString(prefix: string) {
    let spaceDistance = 10 - prefix.length;
    let spaceString = "";

    for (let i = 0; i <= spaceDistance; i++) {
      spaceString += " ";
    }

    return `${this.coloriseText(
      `[` + prefix.toUpperCase() + `]`,
      "white"
    )}${spaceString}:: `;
  }

  private static do(text: string | number, prefix: string, logLevel: LogLevel) {
    let color: Styles = "white";
    switch (logLevel) {
      case LogLevel.DEBUG: {
        color = "blue";
        break;
      }
      case LogLevel.ERROR: {
        color = "red";
        break;
      }

      case LogLevel.INFO: {
        color = "green";
        break;
      }
      case LogLevel.WARN: {
        color = "yellow";
        break;
      }
      default:
        color = "white";
    }
    console.log(
      `${this.createDateString()} ${this.createPrefixString(
        prefix
      )} ${this.coloriseText(text, color)}`
    );
  }

  public static info(text: string | number) {
    return this.do(text, "Info", LogLevel.INFO);
  }

  public static debug(text: string | number) {
    return this.do(text, "Info", LogLevel.DEBUG);
  }

  public static warn(text: string | number) {
    return this.do(text, "Info", LogLevel.WARN);
  }

  public static error(text: string | number) {
    return this.do(text, "Info", LogLevel.ERROR);
  }
}
