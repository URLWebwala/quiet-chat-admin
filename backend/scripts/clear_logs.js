const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function clearResolvedLogs() {
  await mongoose.connect(process.env.MongoDb_Connection_String);
  const RewardSystemLog = require('../models/rewardSystemLog.model');

  const count = await RewardSystemLog.countDocuments();
  console.log(`Found ${count} historical log(s) in RewardSystemLog.`);

  const res = await RewardSystemLog.deleteMany({ message: { $regex: /Cast to ObjectId failed/i } });
  console.log(`Deleted ${res.deletedCount} resolved CastError log(s).`);

  await mongoose.disconnect();
}

clearResolvedLogs().catch(console.error);
