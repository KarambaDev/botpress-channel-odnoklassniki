/**
 * Anything that you would like to make configurable to the bot owner would go in this file.
 * Botpress handles itself loading the configuration files.
 *
 * Bot configuration files will override Global configuration when available:
 * For example, `data/bots/MY_BOT/config/complete-module.json` will be used by MY_BOT, while `data/global/config/complete-module.json` will be used for all others
 */
export interface Config {
  /** The bot token received from the Telegram Botfather */
  botToken: string

  /** Enable or disable this channel for this bot */
  enabled: boolean
}
