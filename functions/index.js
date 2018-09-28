// MODULES
var functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// UTILITIES
const { fetchYoutube } = require('./fetchYoutube.js');

// FUNCTIONS

/**
 * Reacts to onCreate in the /subscriptions collection
 *
 *  - Fetches youtube data
 *  - Updates document with fetched data
 *  - Set `parsed` as true
 */
exports.fetchSubscriptionInfo = functions.database.ref('/subscriptions/{id}').onCreate((snapshot, context) => {
  // Grab the current value of what was written to the Realtime Database.
  // You must return a Promise when performing asynchronous tasks inside a Functions such as
  // writing to the Firebase Realtime Database.
  // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
  // return snapshot.ref.parent.child('uppercase').set(uppercase);
  const original = snapshot.val();

  console.log(original);

  let url = original.url;

  return fetchYoutube(url)
    .then( response => {
      console.log('YOUTUBE', response.data);
      // Gather important info
      return response;
    });
});
