import * as sdk from 'botpress/sdk'
import axios from 'axios'
import _ from 'lodash'
import { Responds } from './typings'

export const subscribe = (whPath: string, botToken: string, botId: string): Promise<Responds> =>
  axios.post("https://api.ok.ru/graph/me/subscribe?access_token=" + botToken, { url: whPath.replace('BOT_ID', botId) })
    .then(response => {
      if (response.data.success) {
        return { message: "Listen Odnoclassniki on: " + whPath.replace('BOT_ID', botId), error: false }
      } else {
        return { message: "Odnoklassniki subscription not success: " + response.data, error: true }
      }
    })
    .catch((error) => {
      if (error.response) {
        // The request was made and the server responded with a status code that falls out of the range of 2xx
        return { message: 'error.response.data: ' + error.response.data, error: true }
      } else if (error.request) {
        // The request was made but no response was received `error.request` is an instance of XMLHttpRequest in the browser and an instance of http.ClientRequest in node.js
        return { message: 'error.request: ' + error.request, error: true }
      } else {
        // Something happened in setting up the request that triggered an Error
        return { message: 'Error: ' + error.message + '\nerror.config: ' + error.config, error: true }
      }
    });

export const unsubscribe = (whPath: string, botToken: string, botId: string): Promise<Responds> =>
  axios.post("https://api.ok.ru/graph/me/unsubscribe?access_token=" + botToken, { url: whPath.replace('BOT_ID', botId) })
    .then(response => {
      if (response.data.success) {
        return { message: "Listen Odnoclassniki on: " + whPath.replace('BOT_ID', botId), error: false }
      } else {
        return { message: "Odnoklassniki unsubscription not success: " + response.data, error: true }
      }
    })
    .catch((error) => {
      if (error.response) {
        // The request was made and the server responded with a status code that falls out of the range of 2xx
        return { message: 'error.response.data: ' + error.response.data, error: true }
      } else if (error.request) {
        // The request was made but no response was received `error.request` is an instance of XMLHttpRequest in the browser and an instance of http.ClientRequest in node.js
        return { message: 'error.request: ' + error.request, error: true }
      } else {
        // Something happened in setting up the request that triggered an Error
        return { message: 'Error: ' + error.message + '\nerror.config: ' + error.config, error: true }
      }
    });

export const sendTyping = async (chat_id: string, botToken: string) => {
  sendMessage(chat_id, {
    "recipient": { chat_id },         /* ID чата в формате chat:id */
    "sender_action": "typing_on"
  }, botToken)
}

export const sendTextMessage = async (event: sdk.IO.OutgoingEvent, botToken: string) => {
  const chat_id = event.threadId
  const text = event.payload.text
  sendMessage(chat_id, {
    "recipient": { chat_id },         /* ID чата в формате chat:id */
    "message": {                                           /* Содержание сообщения */
      text                                    /* Текст сообщения */
    }
  }, botToken)
}

export const sendCarousel = async (bp: typeof sdk, event: sdk.IO.OutgoingEvent, botToken: string) => {
  const chat_id = event.threadId
  const config = await bp.config.getBotpressConfig()
  console.log("carousel ", event, "\n");
  console.log("elements ", event.payload.elements, "\n")
  let attachments = []

  event.payload.elements && event.payload.elements.forEach(element => {
    const { title, picture, subtitle } = element
    console.log("buttons ", element.buttons, "\n");
    if (picture) {
      const pictureReplaced = picture.replace('http://localhost:3000', config.httpServer.externalUrl)
      attachments.push({
        "type": "IMAGE",
        "payload": {
          "url": pictureReplaced
        }
      })
    }
    let text = title + title && subtitle ? '\n' + subtitle : ''
    const buttons = _.compact(element.buttons.map(button => {
      if (button.type == 'postback') return [{
        "type": "CALLBACK",
        "text": button.title,
        "intent": "NEGATIVE", // DEFAULT|POSITIVE|NEGATIVE
        "payload": button.payload
      }]
      else if (button.type == 'open_url') return [{
        "type": "LINK",
        "text": button.title,
        "intent": "POSITIVE",
        "url": button.url || button.payload
      }]
      // else if (button.type == 'say_something') return [{  //TODO хз что такое say_something
      //   "type": "CALLBACK",
      //   "text": button.title,
      //   "intent": "DEFAULT",
      //   "payload": button.text || button.payload
      // }]
    }))
    attachments.push({
      "type": "INLINE_KEYBOARD",
      "payload": {
        "keyboard": {
          buttons
        }
      }
    })

    console.log("buttons ", buttons)
    sendMessage(chat_id, {
      "recipient": { chat_id },         /* ID чата в формате chat:id */
      "message": {
        text, /* Текст сообщения */
        attachments,
        // "privacyWarning": "SCREENSHOT|SCREENCAST",
        // "reply_to": mid /* id сообщения, ответом на которое является текущее сообщение */
      }
    }, botToken)
  })
}

const sendMessage = async (chat_id: string, json: object, botToken: string) => {
  console.log(`https://api.ok.ru/graph/me/messages/${chat_id}?access_token=${botToken}`, json)
  await axios.post(`https://api.ok.ru/graph/me/messages/${chat_id}?access_token=${botToken}`, json)
    .then(response => {
      if (!response.data.success) console.log("Odnoklassniki sendMessage not success", response.data)
      console.log("message sended to OK")
    })
    .catch((error) => {
      if (error.response) {
        // The request was made and the server responded with a status code that falls out of the range of 2xx
        console.log('error.response.data', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received `error.request` is an instance of XMLHttpRequest in the browser and an instance of http.ClientRequest in node.js
        console.log('error.request', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
      console.log('error.config', error.config);
    });
}