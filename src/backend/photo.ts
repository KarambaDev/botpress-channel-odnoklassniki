import * as sdk from 'botpress/sdk'
// import axios from 'axios'
// import FormData from 'form-data'
// import _ from 'lodash'
// import request from 'request'
// import fs from 'fs'
// import { Config } from '../config'
import { isValidURL, requestImageUploadURL, uploadImage } from './api'
// import { Responds } from './typings'

interface IOkUrlData {
  url: string,
  file_id: string
}
interface IResponse {
  data: IOkUrlData
}

export const handlePhoto = async (url: string, chat_id: string, botToken: string, logger: sdk.Logger) => {
  // console.log(`https://api.ok.ru/graph/me/messages/${chat_id}?access_token=${botToken}`, JSON.stringify(json))
  let imageUploadURLData: IOkUrlData
  // let imageStream: any
  if (isValidURL(url)) {
    requestImageUploadURL(botToken)
      .then((result) => {
        uploadImage(result.url, chat_id, botToken, logger)
      })
      .catch(error => console.log(error))


    // Promise.all([
    //   requestImageUploadURL(botToken),
    //   imageTransform(url)
    // ])
    //   .then(result => {
    //     imageUploadURLData = result[0]
    //     console.log('imageUploadURLData ', imageUploadURLData)
    //     imageStream = result[1]
    //     console.log('imageStream ', imageUploadURLData)
    //     uploadImage(imageStream, imageUploadURLData.url, chat_id, botToken, logger)
    //     //imageUploadURLData.url по этой ссылку будет доступно изображение, храним в базу
    //     // const readStream = fs.createReadStream('/home/elrond/bot/dev2/reformat.jpg');
    //     // const data = new FormData();
    //     // // bodyFormData.set('userName', 'Fred');
    //     // data.append('image', readStream);
    //     // axios({
    //     //   method: 'post',
    //     //   url: imageUploadURLData.url,
    //     //   data: data,
    //     //   headers: {
    //     //     ...data.getHeaders()
    //     //   }
    //     // })
    //     //   .then(function (response) {
    //     //     //handle success
    //     //     // sendImage()
    //     //     console.log(response);
    //     //   })
    //     //   .catch(function (response) {
    //     //     //handle error
    //     //     console.log(response);
    //     //   });
    //   })
    //   .catch(err => logger.error(`OK upload URL request or GM error: ${err} `))

    // const quest = event.state.user.active_quest
    // const quest_step = event.state.user.q_sub
  } else {
    logger.error(`Wrong client photo URL: ${url} `)
    // console.log('Wrong URL: ', url)
  }
}


// function imageTransform(url: string) {
//   return new Promise((resolve, reject) => {
//     const state = gm(request(url))
//       .resize('100', '100')
//       // .write('/home/elrond/bot/dev2/reformat.jpg', function (err) {
//       //     if (err) { reject(err) }
//       //     // else {
//       //     //   console.log('done')
//       //     // }
//       //   })
//       // .stream(function (err, stdout, stderr) {
//       //   var writeStream = fs.createWriteStream('/path/to/my/resized.jpg');
//       //   stdout.pipe(writeStream);
//       // });
//       .stream('png')
//     resolve(state)
//     reject(error => console.log('imageTransform error', error))
//   })
// }