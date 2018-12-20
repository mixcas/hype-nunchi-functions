var functions = require('firebase-functions')
// MODULES
const admin = require('firebase-admin')
admin.initializeApp()

const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const parser = require('xml2json')
const bodyParser = require('body-parser')
const dateFns = require('date-fns')

// UTILITIES
const { fetchYoutubeChannel } = require('./lib/fetchYoutubeChannel.js')
const { subscribePubSubHubbub } = require('./subscribePubSubHubbub.js')
const { isMusicVideo, compactObject } =  require('./lib/utils')
const { isOldTrack, cleanOldTracks, getDifferenceTracks } =  require('./lib/charts')

// FUNCTIONS

/**
 * Reacts to onCreate in the /subscriptions collection
 *
 *  - Fetches youtube data
 *  - Updates document with fetched data
 *  - Set `parsed` as true
 */
exports.fetchSubscriptionInfo = functions.database.ref('/subscriptions/{docId}').onCreate((snapshot, context) => {
  const docId = context.params.docId
  const original = snapshot.val()

  let { url }  = original

  return fetchYoutubeChannel(url)
    .then( response => {
      // console.log('fetchYoutubeChannel')
      // console.log('YOUTUBE', response.data)
      // console.log('SNIPPET', response.data.items[0].snippet)
      // console.log('parsed', response.data)

      const data = response.data.items[0]

      // Gather important info
      // - id
      // - title
      // - description
      // - thumbnails
      // - customUrl

      const { id, snippet } = data
      const { title, description, customUrl, thumbnails } = snippet

      let meta = compactObject(Object.assign({}, {
        type: 'youtube',
        title,
        description,
        customUrl,
        thumbnails,
      }))

      // console.log('META', meta)

      // Set meta
      return snapshot.ref.update(compactObject({
        channelId: id,
        meta,
        parsed: true,
        pubSubscribed: false,
      }))
    })
    .then(() => {
      // Read the ref again
      return snapshot.ref.once('value')
    })
    .then( (updatedSnap, updatedContext) => {
      const topic  = updatedSnap.val()

      // Make the subscription to PubSubHubbub
      return subscribePubSubHubbub(topic)
    })
    .then( response => {
      // console.log('HUB RESPONSE', response)
      // console.log('HUB STATUS TEXT', response.statusText)
      // console.log('HUB STATUS', response.status)

      // Succesful subscription returns 202
      if(response.statusText === 'Accepted' && response.status === 202) {
        // console.log('UPDATING')
        // Update pubSubscribed
        return snapshot.ref.update({
          pubSubscribed: true,
        })
      }
      return false
    })
    .catch( error => {
      console.error(error)
    })
})

/**
 * Reacts to onUpdate in the status property in the /tracks collection
 *
 *  -
 */
exports.updateInChart = functions.database.ref('/tracks/{docId}').onUpdate((snapshot, context) => {
  const docId = context.params.docId
  const doc = snapshot.after.val()

  // if published
  if (doc.status === 'published') {
    // add to Latest chart
    return admin.database().ref(`/chart/latest/tracks/${docId}`).update(compactObject(doc))
  } else if (doc.status === 'unpublished') {
    // remove from Latest chart
    return admin.database().ref(`/chart/latest/tracks/${docId}`).remove()
  }

  return true

})

exports.cleanChart = functions.database.ref('/chart/latest/').onUpdate((snapshot, context) => {
  const documents = snapshot.after.val()
  const { updated, tracks } = documents

  if ((updated && dateFns.differenceInSeconds(new Date(), updated) < 30) || !Object.keys(documents).length) {
    return false
  }

  const cleanTracks = cleanOldTracks(tracks)

  console.log('TRACKS DIFFERENCE', getDifferenceTracks(tracks, cleanTracks))

  return admin.database().ref('/chart/latest').update({
    tracks: cleanTracks,
    updated: new Date(),

  })
})

// EXPRESS
const app = express()

app.use((request, response, next) => {
  console.log('A REQUEST FROM', request.url)
  console.log('A REQUEST', request)
  next()
})

// MORGAN
app.use(morgan('combined'))

// RAW BODY PARSER
app.use(bodyParser.raw({
  inflate: true,
  limit: '100kb',
  type: 'application/atom+xml',
}))

const whitelist = ['http://local.hype.nunchi.love', 'http://hype.nunchi.love']
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      return callback(null, true)
    } else {
      return callback(new Error('Not allowed by CORS'))
    }
  }
}

// GET: /service/PubSubHubbub
app.get('/service/PubSubHubbub/:channelId', (request, response) => {
  // console.log('GET /service/PubSubHubbub/:channelId', request.params)

  if(request.query['hub.challenge'] !== undefined) {
    response.send(request.query['hub.challenge'])
  } else {
    response.send(401, 'missing hub.challenge')
  }
})

// POST: /service/PubSubHubbub
app.post('/service/PubSubHubbub/:channelId', (request, response) => {
  // console.log('POST /service/PubSubHubbub/:channelId', request.params)
  // TODO: check request origin

  // get channelId from the request
  const { channelId } = request.params

  // Get Content-Type
  contentType = request.get('Content-Type')

  // Check if IS NOT Atom notification
  if (!contentType || contentType.indexOf('application/atom+xml') !== 0 || channelId === undefined) {
    // console.log('returning 400')
    return response.send(400)
  }

  // console.log('BODY', request)
  // console.log('RAW', request.rawBody)

  let data = {}

  // Start the parser
  data = parser.toJson(request.rawBody, {
    object: true,
  })

  // console.log('PARSED DATA', data)

  if(Object.keys(data).length) {
    // ADDED
    if(data.feed !== undefined && data.feed.entry !== undefined) {
      // console.log('FEED', data.feed)
      // console.log('ENTRY', data.feed.entry)

      // Get video ID
      const id = data.feed.entry['yt:videoId']

      // Get meta data
      let { title, link, author, published, updated } = data.feed.entry

      // link can be an array of objects
      if(link[0] !== undefined) {
        link = link[0]
      }

      const status = isMusicVideo(title) ? 'published' : 'unpublished'

      const track = {
        ref: id,
        title,
        link: link.href,
        author,
        published,
        updated,
        provider: 'youtube',
        hidden: false,
        status,
      }

      // console.log('TRACK', compactObject(track))

      admin.database().ref(`/tracks/${id}`).set(compactObject(track))
    }

    // REMOVED
    if(data['at:deleted-entry'] !== undefined) {

      const ref = data['at:deleted-entry'].ref

      const id = ref.split(':')[2]

      admin.database().ref(`/tracks/${id}`).remove()
    }
  }

  return response.send('')

})

app.get('/service/PubSubHubbub/subscribe/all', (request, response) => {

  // Get all subscriptions
  admin.database().ref('/subscriptions').once('value')
    .then( (snapshot) => {

      const documents = snapshot.val()

      if (Object.keys(documents).length > 0) {
        const promises = Object.keys(documents).map( key => {
          const topic = documents[key]

          return subscribePubSubHubbub(topic)
        })

        return Promise.all(promises)
      }

      return 'error'
    })
    .then( res => {
      // console.log('RES', res)
      if (res === 'error') {
        return response.send('error')
      } else {
        return response.send('subscribed')
      }
    })
    .catch( error => {
      console.log(error)
    })
})

app.post('/service/PubSubHubbub/subscribe/:topicId', cors(corsOptions), (request, response) => {

  // get channelId from the request
  const { topicId } = request.params

  if(topicId === undefined) {
    // console.log('returning 401')
    return response.send(401, 'missing topicId')
  }

  const topic = {
    channelId: topicId,
  }

  subscribePubSubHubbub(topic)
    .then( res => {
      // console.log('RES', res)
      // Succesful subscription returns 202
      if(res.statusText === 'Accepted' && res.status === 202) {
        console.log('SUBSCRIBED')
      }

      return response.send('subscribed')
    })
    .catch( error => {
      console.error(error)
    })
})

app.post('/webhook/fetchViews', (request, response) => {
  console.log('Fetching Views')
  return response.send('fetched views')
})


exports.app = functions.https.onRequest(app)
