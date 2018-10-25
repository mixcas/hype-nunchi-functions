// MODULES
var functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const express = require('express');
const parser = require('xml2json');
const bodyParser = require('body-parser');


// UTILITIES
const { fetchYoutube } = require('./fetchYoutube.js');
const { subscribePubSubHubbub } = require('./subscribePubSubHubbub.js');
const { compactObject } =  require('./lib/utils')

// FUNCTIONS

/**
 * Reacts to onCreate in the /subscriptions collection
 *
 *  - Fetches youtube data
 *  - Updates document with fetched data
 *  - Set `parsed` as true
 */
exports.fetchSubscriptionInfo = functions.database.ref('/subscriptions/{docId}').onCreate((snapshot, context) => {
  const docId = context.params.docId;
  const original = snapshot.val();

  let { url }  = original;

  return fetchYoutube(url)
    .then( response => {
      console.log('fetchYoutube')
      console.log('YOUTUBE', response.data);
      console.log('SNIPPET', response.data.items[0].snippet);

      console.log('parsed', response.data);

      const data = response.data.items[0];

      // Gather important info
      // - id
      // - title
      // - description
      // - thumbnails
      // - customUrl

      const { id, snippet } = data;
      const { title, description, customUrl, thumbnails } = snippet;

      let meta = compactObject(Object.assign({}, {
        type: 'youtube',
        title,
        description,
        customUrl,
        thumbnails,
      }));

      console.log('META', meta)

      // Set meta
      return snapshot.ref.update(compactObject({
        channelId: id,
        meta,
        parsed: true,
        pubSubscribed: false,
      }));
    })
    .then(() => {
      // Read the ref again
      return snapshot.ref.once('value');
    })
    .then( (updatedSnap, updatedContext) => {
      const topic  = updatedSnap.val();

      // Make the subscription to PubSubHubbub
      return subscribePubSubHubbub(topic);
    })
    .then( response => {
      console.log('SUPERFEEDR RESPONSE', response)
      console.log('SUPERFEEDR STATUS TEXT', response.statusText)
      console.log('SUPERFEEDR STATUS', response.status)

      // Succesful subscription returns 202
      if(response.statusText === 'Accepted' && response.status === 202) {
        console.log('UPDATING');
        // Update pubSubscribed
        return snapshot.ref.update({
          pubSubscribed: true,
        });
      }
      return false;
    })
    .catch( error => {
      console.error(error);
    });
});

/**
 * TODO:
 * - trigger `track` on create to parse againsta channel regex filter and set `draft:false`
 */

// EXPRESS
const app = express();

app.use(bodyParser.raw({
  inflate: true,
  limit: '100kb',
  type: 'application/atom+xml',
}));

// GET: /service/PubSubHubbub
app.get('/service/PubSubHubbub/:channelId', (request, response) => {
  console.log('GET /service/PubSubHubbub/:channelId', request.params)

  if(request.query['hub.challenge'] !== undefined) {
    response.send(request.query['hub.challenge']);
  } else {
    response.send(401, 'missing hub.challenge');
  }
});

// POST: /service/PubSubHubbub
app.post('/service/PubSubHubbub/:channelId', (request, response) => {
  console.log('POST /service/PubSubHubbub/:channelId', request.params)
  // TODO: check request origin

  // get channelId from the request
  const { channelId } = request.params

  // Get Content-Type
  contentType = request.get('Content-Type')

  // Check if IS NOT Atom notification
  if (!contentType || contentType.indexOf('application/atom+xml') !== 0 || channelId === undefined) {
    console.log('returning 400');
    return response.send(400);
  }

  // console.log('BODY', request);
  console.log('RAW', request.rawBody);

  let data = {};

  // Start the parser
  data = parser.toJson(request.rawBody, {
    object: true,
  });

  console.log('PARSED DATA', data);
  console.log('FEED', data.feed);
  console.log('ENTRY', data.feed.entry);

  if(Object.keys(data).length) {
    // ADDED
    if(data.feed !== undefined && data.feed.entry !== undefined) {

      // Get video ID
      const id = data.feed.entry['yt:videoId'];

      // Get meta data
      let { title, link, author, published, updated } = data.feed.entry;

      // link can be an array of objects
      if(link[0] !== undefined) {
        link = link[0]
      }

      const filter = /MV|M\V|M\/V|Music Video/g

      const status = filter.test(title) ? 'published' : 'unpublished';

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
      };

      console.log('TRACK', compactObject(track));

      admin.database().ref(`/tracks/${id}`).set(compactObject(track));
    }

    // REMOVED
    if(data['at:deleted-entry'] !== undefined) {

      const ref = data['at:deleted-entry'].ref;

      const id = ref.split(':')[2];

      admin.database().ref(`/tracks/${id}`).remove();
    }
  }

  return response.send('');

});

exports.app = functions.https.onRequest(app);
