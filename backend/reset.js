const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/videoCall').then(async () => {
  await mongoose.connection.collection('hosts').updateMany({}, { $set: { isExpert: false } });
  console.log('Reset complete');
  process.exit(0);
});
