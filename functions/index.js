// MODULES
var functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const express = require('express');
const FeedMe = require('feedme');
const axios = require('axios');

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
      return true;
    })
    .catch( error => {
      console.error(error);
    });
});

// EXPRESS
const app = express();

app.get('/service/PubSubHubbub', (request, response) => {
  if(request.query['hub.challenge'] !== undefined) {
    response.send(request.query['hub.challenge']);
  } else {
    response.send(401, 'missing hub.challenge');
  }
});

app.post('/service/PubSubHubbub', (request, response) => {
  console.log('PUBSUBHUBBUB');
  console.log('Content-Type', request.get('Content-Type'));
  console.log('content-type', request.get('content-type'));

  // Check if IS NOT Atom notification
  if (!contype || contype.indexOf('application/atom+xml') !== 0) {
    console.log('returning 400');
    return response.send(400);
  } else { // IS Atom notification

    // Start the parser
    const parser = new FeedMe(true);

    // Listen for `end` event on the parser
    parser.on('end', () => {
      // Console log parsed data
      console.log('ATOM', parser.done());
    });

    // Write boy into the parser
    parser.write(request.body);
  }
  response.send('');

});

exports.app = functions.https.onRequest(app);
