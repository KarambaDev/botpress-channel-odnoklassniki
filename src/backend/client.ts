import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { Config } from '../config'
import { Clients } from './typings'
import { subscribe, unsubscribe, sendTextMessage, sendCarousel } from './api'

const outgoingTypes = ['text', 'typing', 'image', 'login_prompt', 'carousel']

export async function setupMiddleware(bp: typeof sdk, clients: Clients) {
  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = odnoklassniki.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: 'odnoklassniki.sendMessages',
    order: 100
  })

  async function outgoingHandler(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'odnoklassniki') {
      return next()
    }

    const client: OdnoklassnikiClient = clients[event.botId]
    if (!client) {
      return next()
    }

    return client.handleOutgoingEvent(event, next)
  }
}

export class OdnoklassnikiClient {
  private whPath: string
  private logger: sdk.Logger

  constructor(private bp: typeof sdk, private botId: string, private config: Config, private router) {
    this.logger = this.bp.logger.forBot(this.botId)
  }

  async initialize() {
    if (!this.config.botToken) {
      return this.logger.error(
        `[${this.botId}] The bot token and the signing secret must be configured to use this channel.`
      )
    }
    this.whPath = (await this.router.getPublicPath()) + '/webhook'
    await subscribe(this.whPath, this.config.botToken, this.botId)
  }

  async unsubscribe() {
    if (this.whPath) {
      unsubscribe(this.whPath, this.config.botToken, this.botId)
    }
  }

  async handleOutgoingEvent(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    const messageType = event.type === 'default' ? 'text' : event.type
    // const chatId = event.threadId || event.target

    if (!_.includes(outgoingTypes, messageType)) {
      return next(new Error('Unsupported event type: ' + event.type))
    }

    // const incomingEventId = event.incomingEventId
    // const events = await this.bp.events.findEvents({ incomingEventId, direction: 'incoming' })
    // console.log("incomingEventId ", incomingEventId, "\n", events[0], "\n", events[0].event, "\n", events[0].event.payload.mid, "\n")
    // const mid = events[0].event.payload.mid

    if (messageType === 'typing') {
      console.log("typing event");
      // await sendTyping(event, client, chatId)
    } else if (messageType === 'text') {
      console.log("text ", event);
      await sendTextMessage(event, this.config.botToken)
    } else if (messageType === 'image') {
      console.log("image ", event);
      // await sendImage(event, client, chatId)
    } else if (messageType === 'carousel') {
      await sendCarousel(event, this.config.botToken)
    } else {
      console.log(`Message type "${messageType}" not implemented yet `, event);
      // TODO We don't support sending files, location requests (and probably more) yet
      throw new Error(`Message type "${messageType}" not implemented yet`)
    }

    next(undefined, false)
  }

  public async sendEvent(ctx: any) {
    const threadId = _.get(ctx, 'recipient.chat_id') || _.get(ctx, 'channel')
    const target = _.get(ctx, 'sender.user_id') || _.get(ctx, 'user')
    const OKtype = _.get(ctx, 'webhookType')
    // const user = _.get(ctx, 'sender.name')
    // const mid = _.get(ctx, 'message.mid') || _.get(ctx, 'mid')
    const preview = _.get(ctx, 'message.text')
    // const preview = _.get(ctx, 'message.text') || _.get(ctx, 'payload')

    let payload
    switch (OKtype) {
      case 'MESSAGE_CREATED':
        payload = {
          type: 'text', // The type of the event, i.e. image, text, timeout, etc
          payload: { type: 'text', text: _.get(ctx, 'message.text') } //The channel-specific raw payload
        }
        break
      case 'MESSAGE_CALLBACK':
        payload = {
          type: 'postback', // The type of the event, i.e. image, text, timeout, etc
          payload: { type: 'postback', payload: _.get(ctx, 'payload') } //The channel-specific raw payload
        }
        break
      default:
        this.logger.error(`Unknown message type: ${OKtype}`)
    }

    const Event = this.bp.IO.Event({
      botId: this.botId, // * The id of the bot on which this event is relating to
      channel: 'odnoklassniki', // *
      direction: 'incoming', // Is it (in)coming from the user to the bot or (out)going from the bot to the user?
      // payload: { ...ctx, user_info: user, mid }, //The channel-specific raw payload
      preview, // A textual representation of the event
      threadId: threadId && threadId.toString(), // * The id of the thread this message is relating to (only on supported channels)
      target: target && target.toString(), // * Who will receive this message, usually a user id
      ...payload
    })
    console.log("Event ", Event, "\n")
    await this.bp.events.sendEvent(Event)
  }
}
