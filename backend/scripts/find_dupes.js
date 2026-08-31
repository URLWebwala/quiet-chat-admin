const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkDuplicates() {
  await mongoose.connect(process.env.MongoDb_Connection_String);
  const Host = require('../models/host.model');
  const ChatTopic = require('../models/chatTopic.model');
  const Chat = require('../models/chat.model');

  const fakeHosts = await Host.find({ isFake: true }).select('_id name uniqueId createdAt date image gender isOnline isBlock').sort({ name: 1, createdAt: 1 }).lean();
  console.log('Total Fake Hosts:', fakeHosts.length);

  const nameMap = {};
  for (const h of fakeHosts) {
    const key = (h.name || '').trim().toLowerCase();
    if (!nameMap[key]) nameMap[key] = [];

    // Check how many topics this host has
    const topicsCount = await ChatTopic.countDocuments({ $or: [{ senderId: h._id }, { receiverId: h._id }] });
    const chatsCount = await Chat.countDocuments({ senderId: h._id });

    nameMap[key].push({
      ...h,
      topicsCount,
      chatsCount,
    });
  }

  const dupes = Object.entries(nameMap).filter(([k, list]) => list.length > 1);
  console.log('Total Duplicate Names:', dupes.length);

  for (const [name, list] of dupes) {
    console.log(`\n=== Host: ${name} (${list.length} duplicates) ===`);
    list.forEach((x, idx) => {
      console.log(`  [${idx + 1}] ID: ${x._id} | UniqueID: ${x.uniqueId} | Topics: ${x.topicsCount} | HostChats: ${x.chatsCount} | CreatedAt: ${x.createdAt} | Image: ${x.image}`);
    });
  }

  await mongoose.disconnect();
}

checkDuplicates().catch(console.error);
