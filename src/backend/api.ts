import * as sdk from 'botpress/sdk'
import axios from 'axios'
import _ from 'lodash'
import { Responds } from './typings'

export const isValidURL = (string: string) => {
  var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
  return (res !== null)
}

export const subscribe = (whPath: string, botToken: string, botId: string): Promise<Responds> =>
  axios.post("https://api.ok.ru/graph/me/subscribe?access_token=" + botToken, { url: whPath.replace('BOT_ID', botId) })
    .then(response => {
      if (response.data.success) {
        // console.log({ message: "Listen Odnoclassniki on: " + whPath.replace('BOT_ID', botId), error: false })
        return { message: "Listen Odnoclassniki on: " + whPath.replace('BOT_ID', botId), error: false }
      } else {
        // console.log({ message: "Odnoklassniki subscription not success: " + response.data, error: true })
        return { message: "Odnoklassniki subscription not success: " + response.data, error: true }
      }
    })
    .catch((error) => {
      if (error.response) {
        // The request was made and the server responded with a status code that falls out of the range of 2xx
        // console.log({ message: 'error.response.data: ' + error.response.data, error: true });
        return { message: 'error.response.data: ' + error.response.data, error: true }
      } else if (error.request) {
        // The request was made but no response was received `error.request` is an instance of XMLHttpRequest in the browser and an instance of http.ClientRequest in node.js
        // console.log({ message: 'error.request: ' + error.request, error: true });
        return { message: 'error.request: ' + error.request, error: true }
      } else {
        // Something happened in setting up the request that triggered an Error
        // console.log({ message: 'Error: ' + error.message + '\nerror.config: ' + error.config, error: true });
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

export const sendCarousel = async (bp: typeof sdk, event: sdk.IO.OutgoingEvent, botToken: string, logger: sdk.Logger) => {
  if (event.payload.elements) {
    const elements = event.payload.elements
    const chat_id = event.threadId
    const config = await bp.config.getBotpressConfig()
    console.log("carousel ", JSON.stringify(event));
    // console.log("elements ", event.payload.elements, "\n")
    const { title, picture, subtitle } = elements[0]
    const attachments = []
    const buttons = []
    const text = title + (title && subtitle ? '\n' + subtitle : '')
    if (text === '') { console.log("Odnoklassniki required that answer should have any text message with carousel") }
    if (picture) {
      const pictureReplaced = picture.replace('http://localhost:3000', config.httpServer.externalUrl)
      attachments.push({
        "type": "IMAGE",
        "payload": {
          "url": pictureReplaced
        }
      })
    }
    elements.forEach(element => {
      // const { title, picture, subtitle } = element
      // console.log("title ", title, "subtitle ", subtitle, "buttons ", element.buttons, "\n");
      // text = title + (title && subtitle ? '\n' + subtitle : '')
      const row = []
      element.buttons.forEach(button => {
        if (button.type == 'postback') row.push({
          "type": "CALLBACK",
          "text": button.title,
          "intent": "NEGATIVE", // DEFAULT|POSITIVE|NEGATIVE
          "payload": button.payload
        })
        else if (button.type == 'open_url') row.push({
          "type": "LINK",
          "text": button.title,
          "intent": "POSITIVE",
          "url": button.url || button.payload
        })
        else {
          logger.error('unsupported Odnoklassniki button type: ' + JSON.stringify(button))
        }
        // else if (button.type == 'say_something') return {  //TODO OK не поддерживает say_something, можно отправлять как postback, с payload: {say_something: $text} и сконвертировать на входе в обычный message
        //   "type": "CALLBACK",
        //   "text": button.title,
        //   "intent": "DEFAULT",
        //   "payload": button.text || button.payload
        // }
      })
      console.log('row: ', row)
      row.length > 0 && buttons.push(row)
    })
    console.log('buttons:', buttons)
    if (buttons.length > 0) {
      attachments.push({
        "type": "INLINE_KEYBOARD",
        "payload": {
          "keyboard": {
            buttons: _.compact(buttons)
          }
        }
      })
    }

    const json = {
      "recipient": { chat_id },         /* ID чата в формате chat:id */
      "message": {
        text, /* Текст сообщения */
        attachments,
        // "privacyWarning": "SCREENSHOT|SCREENCAST",
        // "reply_to": mid /* id сообщения, ответом на которое является текущее сообщение */
      }
    }
    // console.log("carousel json ", json)
    if (attachments.length > 0) {
      sendMessage(chat_id, json, botToken)
    }
  }

}

const sendMessage = async (chat_id: string, json: object, botToken: string) => {
  console.log(`https://api.ok.ru/graph/me/messages/${chat_id}?access_token=${botToken}`, JSON.stringify(json))
  return await axios.post(`https://api.ok.ru/graph/me/messages/${chat_id}?access_token=${botToken}`, json)
    .then(response => {
      if (!response.data.success) console.log("Odnoklassniki sendMessage not success", response.data)
      // console.log("message sended to OK")
      return response.data
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
    })
}

export const handlePhoto = async (photoUrl: string, chat_id: string, botToken: string, shareServer: string, logger: sdk.Logger) => {
  // const config = Config
  const json = {
    photoUrl,
    chat_id,
    botToken,
  }
  // console.log('handlePhoto json: ', json)
  // axios.post(`http://localhost:3001/odnoklassniki/filterPhoto`, json)
  return axios.post(`${shareServer}/odnoklassniki/filterPhoto`, json)
    .then(data => {
      if (data.data) {
        // console.log('photos data ', data.data)
        const photos = data.data.filteredPhotos
        const filePath = data.data.saveFileName
        if (Array.isArray(photos)) {
          photos.forEach(photo => {
            sendMessage(chat_id, photo, botToken)
              .then((response) => {
                console.log('sendImage response: ', response)
              })
          });
        }
        return filePath
      }
    })
    .catch((error) => logger.error('share server connection error: ', error))
}
