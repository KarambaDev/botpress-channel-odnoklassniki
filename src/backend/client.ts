import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { Config } from '../config'
import { Clients, Responds } from './typings'
import { subscribe, unsubscribe, sendTyping, sendTextMessage, sendCarousel } from './api'
// import { handlePhoto } from './api'

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

    return client.handleOutgoingEvent(bp, event, next)
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
    const result: Responds = await subscribe(this.whPath, this.config.botToken, this.botId)
    if (!result.error) {
      this.logger.info(result.message)
    } else {
      this.logger.error(result.message)
    }
  }

  async unsubscribe() {
    if (this.whPath) {
      const result: Responds = await unsubscribe(this.whPath, this.config.botToken, this.botId)
      if (!result.error) {
        this.logger.info(result.message)
      } else {
        this.logger.error(result.message)
      }
    }
  }

  async handleOutgoingEvent(bp: typeof sdk, event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
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
      // console.log("typing event");
      // await sendTyping(event, client, chatId)
    } else if (messageType === 'text') {
      // console.log("text ", event);
      await sendTextMessage(event, this.config.botToken)
    } else if (messageType === 'image') {
      console.log("sendImage ", event);
      // await sendImage(event, client, chatId)
    } else if (messageType === 'carousel') {
      await sendCarousel(bp, event, this.config.botToken, this.logger)
    } else {
      console.log(`Message type "${messageType}" not implemented yet `, event);
      // TODO We don't support sending files, location requests (and probably more) yet
      throw new Error(`Message type "${messageType}" not implemented yet`)
    }

    next(undefined, false)
  }

  // Parse incoming Messages from OK
  public async parseMessage(ctx: any) {
    console.log('Message recieved from OK:\n', ctx)
    const threadId = _.get(ctx, 'recipient.chat_id') || _.get(ctx, 'channel')
    const target = _.get(ctx, 'sender.user_id') || _.get(ctx, 'user')
    const OKtype = _.get(ctx, 'webhookType')
    const user = _.get(ctx, 'sender.name')
    // const mid = _.get(ctx, 'message.mid') || _.get(ctx, 'mid')
    const text = _.get(ctx, 'message.text')
    const attachments = _.get(ctx, 'message.attachments')
    // const preview = _.get(ctx, 'message.text') || _.get(ctx, 'payload')

    // let payload
    if (OKtype === 'MESSAGE_CREATED') {
      if (text) {
        // console.log('Message Type: text')
        const type = 'text'
        // payload = { type, text }
        // await this.sendEvent(threadId, type, payload, text, target)
        await this.sendEvent(threadId, type, { text, user }, text, target)
      }
      if (attachments) {
        // console.log('Message Type: object\n', attachments)
        // const filePath = await handlePhoto(attachments[0].payload.url, threadId, this.config.botToken, this.config.shareServer, this.logger)
        const type = 'image'
        // this.sendEvent(threadId, type, { src_photo: attachments[0].payload.url, filtered_photo: filePath }, text, target)
        this.sendEvent(threadId, type, { src_photo: attachments[0].payload.url, chat_id: threadId, botToken: this.config.botToken }, text, target)
      }
    }
    else if (OKtype === 'MESSAGE_CALLBACK') {
      // console.log('Message Type: postback')
      sendTyping(threadId, this.config.botToken) // Not work on OK side yet
      const type = 'postback'
      // payload = { type, payload: _.get(ctx, 'payload') }
      // await this.sendEvent(threadId, type, payload, text, target)
      await this.sendEvent(threadId, type, { payload: _.get(ctx, 'payload'), user }, text, target)
    }
    else {
      this.logger.error(`Unknown message type: ${OKtype}`)
    }
  }

  // Send Event into Botpress
  async sendEvent(threadId: string, type: string, payload: any, text?: string, target?: string) {
    const eventPayload = {
      type, // The type of the event, i.e. image, text, timeout, etc
      payload: { type, ...payload } //The channel-specific raw payload
    }
    const Event = this.bp.IO.Event({
      botId: this.botId, // * The id of the bot on which this event is relating to
      channel: 'odnoklassniki', // *
      direction: 'incoming', // Is it (in)coming from the user to the bot or (out)going from the bot to the user?
      // payload: { ...ctx, user_info: user, mid }, //The channel-specific raw payload
      preview: text, // A textual representation of the event
      threadId: threadId && threadId.toString(), // * The id of the thread this message is relating to (only on supported channels)
      target, // * Who will receive this message, usually a user id
      ...eventPayload
    })
    console.log("Event ", Event, "\n")
    await this.bp.events.sendEvent(Event)
  }
}
