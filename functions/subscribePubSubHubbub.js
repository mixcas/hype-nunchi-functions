// MODULES
const axios = require('axios');

// CONSTANTS
// const baseUrl = 'https://push.superfeedr.com';
const baseUrl = 'https://pubsubhubbub.appspot.com/subscribe';

/**
 * Returns a promise that checks the channel or user data
 * @param {string} url - the youtube url
 */
const subscribePubSubHubbub = (topic, mode = 'subscribe') => {

  let params = {
    'hub.mode': mode,
    'hub.callback': 'http://us-central1-hype-nunchi-love.cloudfunctions.net/app/service/PubSubHubbub/' + topic.channelId,
    'hub.topic': 'https://www.youtube.com/xml/feeds/videos.xml?channel_id=' + topic.channelId,
    'hub.verify': 'async',
  };

  console.log('SUBSCRIBING', baseUrl)
  console.log('WITH PARAMS', params)

  return axios.post(baseUrl, null, {
    params,
    /*
    auth: {
      username: process.env.SUPERFEEDR_USERNAME,
      password: process.env.SUPERFEEDR_PASSWORD,
    }
    */
  })
  .catch( error => {
    const { response } = error;
    // console.error(error);
    console.error('Response', response);
  });
}

module.exports.subscribePubSubHubbub = subscribePubSubHubbub;
