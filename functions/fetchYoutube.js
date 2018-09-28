// ENV VARS
require('dotenv').config()

// MODULES
const axios = require('axios');

// CONSTANTS
const baseUrl = 'https://www.googleapis.com/youtube/v3';
const regex = /((http|https):\/\/|)(www\.|)youtube\.com\/(channel\/|user\/)([a-zA-Z0-9\-]{1,})/;

/**
 * Returns a promise that checks the channel or user data
 * @param {string} url - the youtube url
 */
const fetchYoutube = (url) => {

  let params = {
    part: 'id,snippet',
    key: process.env.YOUTUBE_API_KEY,
  };

  let m; // regex matches

  if ((m = regex.exec(url)) !== null) {
    if(m[4] === 'channel/') {
      params['id'] = m[5];
    } else if(m[4] === 'user/') {
      params['forUsername'] = m[5];
    }
  }

  return axios(`${baseUrl}/channels`, {
    params,
  })
}

module.exports.fetchYoutube = fetchYoutube;

//fetchYoutube('https://www.youtube.com/channel/UCDIhSUQ7tY5yfSKJWeNaPUQ');
