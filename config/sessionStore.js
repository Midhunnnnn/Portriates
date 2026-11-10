const session = require('express-session');
const mongoose = require('mongoose');
const { connectDB } = require('./db');

const sessionSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    session: { type: mongoose.Schema.Types.Mixed, required: true },
    expires: { type: Date, required: true, index: { expires: 0 } }
  },
  {
    collection: 'sessions',
    versionKey: false
  }
);

const SessionModel = mongoose.models.Session || mongoose.model('Session', sessionSchema);

function getExpiryDate(sess) {
  if (sess && sess.cookie && sess.cookie.expires) {
    return new Date(sess.cookie.expires);
  }
  const maxAge = sess && sess.cookie && typeof sess.cookie.maxAge === 'number'
    ? sess.cookie.maxAge
    : 1000 * 60 * 60 * 24 * 7;
  return new Date(Date.now() + maxAge);
}

class MongoSessionStore extends session.Store {
  get(sid, callback) {
    connectDB()
      .then(() => SessionModel.findById(sid).lean())
      .then((doc) => {
        if (!doc) return callback(null, null);
        if (doc.expires && new Date(doc.expires) <= new Date()) {
          return SessionModel.deleteOne({ _id: sid })
            .then(() => callback(null, null))
            .catch(() => callback(null, null));
        }
        return callback(null, doc.session);
      })
      .catch((err) => callback(err));
  }

  set(sid, sess, callback = () => {}) {
    const expires = getExpiryDate(sess);
    connectDB()
      .then(() =>
        SessionModel.updateOne(
          { _id: sid },
          { $set: { session: sess, expires } },
          { upsert: true }
        )
      )
      .then(() => callback(null))
      .catch((err) => callback(err));
  }

  destroy(sid, callback = () => {}) {
    connectDB()
      .then(() => SessionModel.deleteOne({ _id: sid }))
      .then(() => callback(null))
      .catch((err) => callback(err));
  }

  touch(sid, sess, callback = () => {}) {
    const expires = getExpiryDate(sess);
    connectDB()
      .then(() => SessionModel.updateOne({ _id: sid }, { $set: { expires } }))
      .then(() => callback(null))
      .catch((err) => callback(err));
  }
}

module.exports = { MongoSessionStore, SessionModel };

