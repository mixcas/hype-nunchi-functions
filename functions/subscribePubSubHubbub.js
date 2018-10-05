// MODULES
const axios = require('axios');

// CONSTANTS
const baseUrl = 'https://pubsubhubbub.appspot.com/subscribe';

/**
 * Returns a promise that checks the channel or user data
 * @param {string} url - the youtube url
 */
const subscribePubSubHubbub = (topic, mode = 'subscribe') => {


  let params = {
    'hub.mode': mode,
    'hub.callback': 'http://us-central1-hype-nunchi-love.cloudfunctions.net/app/service/PubSubHubbub',
    'hub.topic': 'https://www.youtube.com/xml/feeds/videos.xml?channel_id=' + topic.meta.channelId,
    'hub.verify': 'async',
  };

  // https://pubsubhubbub.appspot.com/subscribe?hub.mode=subscribe&hub.topic=https://www.youtube.com/xml/feeds/videos.xml?channel_id=UCweOkPb1wVVH0Q0Tlj4a5Pw&hub.callback=http://us-central1-hype-nunchi-love.cloudfunctions.net/app/service/PubSubHubbub&hub.verify=async
  //return axios.post(`${baseUrl}?hub.mode=${mode}&hub.topic=${params['hub.topic']}&hub.callback=${params['hub.callback']}&hub.verify=async`)
  return axios.post(baseUrl, null, { params })
  .catch( error => {
    const { response } = error;
    // console.error(error);
    console.error('Response', response);
  });
}

module.exports.subscribePubSubHubbub = subscribePubSubHubbub;
