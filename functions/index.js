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
      // console.log('YOUTUBE', response.data);
      // console.log('SNIPPET', response.data.items[0].snippet);

      // console.log(docId);

      const data = response.data.items[0];

      // Gather important info
      // - id
      // - title
      // - description
      // - thumbnails
      // - customUrl

      const { id, snippet } = data;
      const { title, description, customUrl, thumbnails } = snippet;

      let meta = Object.assign({}, {
        type: 'youtube',
        channelId: id,
        title,
        description,
        customUrl,
        thumbnails,
      });

      // Set meta
      return snapshot.ref.update({
        meta,
        parsed: true,
        pubSubscribed: false,
      });
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
app.get('/service/PubSubHubbub', (request, response) => {
  if(request.query['hub.challenge'] !== undefined) {
    response.send(request.query['hub.challenge']);
  } else {
    response.send(401, 'missing hub.challenge');
  }
});

// POST: /service/PubSubHubbub
app.post('/service/PubSubHubbub', (request, response) => {
  // TODO: check request origin

  // Get Content-Type
  contentType = request.get('Content-Type')

  // Check if IS NOT Atom notification
  if (!contentType || contentType.indexOf('application/atom+xml') !== 0) {
    console.log('returning 400');
    return response.send(400);
  }

  // console.log('BODY', request);
  // console.log('RAW', request.rawBody);

  let data = {};

  // Start the parser
  data = parser.toJson(request.rawBody, {
    object: true,
  });

  console.log('PARSED DATA', typeof data);
  console.log('FEED', data.feed);
  console.log('ENTRY', data.feed.entry);

  if(Object.keys(data).length) {
    // ADDED
    if(data.feed !== undefined) {

      const id = data.feed.entry['yt:videoId'];
      const { title, link, author, published, updated } = data.feed.entry;

      const track = {
        ref: id,
        title,
        link: link.href,
        author,
        published,
        updated,
        provider: 'youtube',
        draft: true,
        private: false,
      };

      console.log('TRACK', track);

      admin.database().ref(`/tracks/${id}`).set(track);
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
