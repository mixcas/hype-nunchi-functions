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
    'hub.callback': 'http://us-central1-hype-nunchi-love.cloudfunctions.net/app/service/PubSubHubbub',
    'hub.topic': `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${topic.meta.channelId}`,
    'hub.verify': 'async',
    'hub.mode': mode,
  };

  return axios.post(baseUrl, {
    params,
  });
}

module.exports.subscribePubSubHubbub = subscribePubSubHubbub;
