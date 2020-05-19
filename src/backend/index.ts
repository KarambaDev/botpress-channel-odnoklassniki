import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import { Config } from '../config'
import {
  setupMiddleware,
  OdnoklassnikiClient
} from './client'
import { Clients } from './typings'

// Create or edit this file data/bots/<your_bot>/config/channel-odnoklassniki.json and
// enter your Odnoklassniki bot token and other env:

// Enable/Disable module globally: /out/bp/data/global/botpress.config.json

let router
const clients: Clients = {}

// This is called when server is started, usually to set up the database
const onServerStarted = async (bp: typeof sdk) => {
  // console.log("onServerStarted");
  await setupMiddleware(bp, clients)
}

// At this point, you would likely setup the API route of your module.
const onServerReady = async (bp: typeof sdk) => {
  // console.log("onServerReady");

  // Link to access this route: http://localhost:3000/api/v1/bots/BOT_ID/mod/channel-odnoklassniki
  router = bp.http.createRouterForBot('channel-odnoklassniki', {
    checkAuthentication: false,
    enableJsonBodyParser: true
  })

  router.use('/webhook', (req, res, next) => {
    const { botId } = req.params
    const client = clients[botId]
    try {
      client.parseMessage(req.body)
    }
    catch (e) {
      console.log('ROUTER ERROR\nbotId: ', botId, '\nclient: ', client, '\nclients: ', clients)
      console.log(e);
    }

    res.status(200).send({ message: "OK" })
  })
}

// Every time a bot is created (or enabled), this method will be called with the bot id
const onBotMount = async (bp: typeof sdk, botId: string) => {
  // console.log("onBotMount");
  const config = (await bp.config.getModuleConfigForBot('channel-odnoklassniki', botId, true)) as Config
  // console.log(config);
  if (config.enabled) {
    const bot = new OdnoklassnikiClient(bp, botId, config, router)
    await bot.initialize()

    clients[botId] = bot
  }
}

// This is called every time a bot is deleted (or disabled)
const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  const client = clients[botId]
  if (!client) {
    return
  }

  await client.unsubscribe()
  delete clients[botId]
}

// When anything is changed using the flow editor, this is called with the new flow, so you can rename nodes if you reference them
// const onFlowChanged = async (bp: typeof sdk, botId: string, flow: sdk.Flow) => { }

/**
 * This is where you would include your 'demo-bot' definitions.
 * You can copy the content of any existing bot and mark them as "templates", so you can create multiple bots from the same template.
 */
// const botTemplates: sdk.BotTemplate[] = [{ id: 'my_bot_demo', name: 'Bot Demo', desc: `Some description` }]

/**
 * Skills allows you to create custom logic and use them easily on the flow editor
 * Check this link for more information: https://botpress.com/docs/developers/create-module/#skill-creation
 */
// const skills: sdk.Skill[] = []

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  // onFlowChanged,
  // botTemplates,
  // skills,
  definition: {
    // This must match the name of your module's folder, and the name in package.json
    name: 'channel-odnoklassniki',
    /**
     * When menuIcon is set to `custom`, you need to provide an icon. It must be at that location: `/assets/icon.png`
     * Otherwise, use Material icons name: https://material.io/tools/icons/?style=baseline
     */
    menuIcon: 'flag',
    // This is the name of your module which will be displayed in the sidebar
    menuText: 'Odnoklassniki',
    // When set to `true`, the name and icon of your module won't be displayed in the sidebar
    noInterface: false,
    // The full name is used in other places, for example when displaying bot templates
    fullName: 'Odnoklassniki',
    // Not used anywhere, but should be a link to your website or module repository
    homepage: 'https://github.com/KarambaDev/channel-odnoklassniki'
  }
}

export default entryPoint
