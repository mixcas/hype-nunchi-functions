// ENV VARS
require('dotenv').config()

// MODULES
const axios = require('axios')

// CONSTANTS
const baseUrl = 'https://www.googleapis.com/youtube/v3'
const regex = /((http|https):\/\/|)(www\.|)youtube\.com\/(channel\/|user\/)([a-zA-Z0-9\-\_]{1,})/

/**
 * Returns a promise that checks the channel or user data
 * @param {string} url - the youtube url
 */
const fetchYoutubeChannel = (url) => {

  let params = {
    part: 'id,snippet',
    key: process.env.YOUTUBE_API_KEY,
  }

  let m // regex matches

  if ((m = regex.exec(url)) !== null) {
    console.log('M', m)
    if(m[4] === 'channel/') {
      params['id'] = m[5]
    } else if(m[4] === 'user/') {
      params['forUsername'] = m[5]
    }
  }

  console.log('PARAMS',params)

  return axios(`${baseUrl}/channels`, {
    params,
  })
}

module.exports.fetchYoutubeChannel = fetchYoutubeChannel

//fetchYoutube('https://www.youtube.com/channel/UCDIhSUQ7tY5yfSKJWeNaPUQ');
