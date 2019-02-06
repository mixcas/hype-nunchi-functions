const admin = require('firebase-admin')
const serviceAccount = require("../migrations/credentials.json");

const data = require("../migrations/migrated_3.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://hype-nunchi-love.firebaseio.com"
});


function moveDocument(key) {
  const document = data[key];

  if (typeof document === "object") {
    delete document['__collections__']

    admin.firestore()
      .collection('tracks')
      .doc(key)
      .set(document)
      .then((res) => {
        console.log("Document successfully written!");
      })
      .catch((error) => {
        console.error("Error writing document: ", error);
      });
  }
}

// moveDocument('-0JIyvHgc_E')

data && Object.keys(data).forEach(key => {
  setTimeout(function() {
    moveDocument(key)
  }, 5)
});
