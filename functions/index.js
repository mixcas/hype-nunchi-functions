// MODULES
var functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const express = require('express');

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

      console.log(docId);

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
      console.log(response);
      console.log(response.data);
      return response;
    })
    .catch( error => {
      console.error(error);
    });
});

// EXPRESS
const app = express();

app.get('/service/PubSubHubbub', (request, response) => {
  console.log(request);
  response.send('hola bb');
});

exports.app = functions.https.onRequest(app);
