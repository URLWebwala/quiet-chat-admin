const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function mergeDuplicateHosts(dryRun = true) {
  await mongoose.connect(process.env.MongoDb_Connection_String);
  const Host = require('../models/host.model');
  const ChatTopic = require('../models/chatTopic.model');
  const Chat = require('../models/chat.model');
  const FollowerFollowing = require('../models/followerFollowing.model');
  const History = require('../models/history.model');

  const fakeHosts = await Host.find({ isFake: true }).sort({ createdAt: -1, _id: 1 }).lean();
  console.log(`Total Fake Hosts: ${fakeHosts.length}`);

  const nameMap = {};
  fakeHosts.forEach(h => {
    const key = (h.name || '').trim().toLowerCase();
    if (!nameMap[key]) nameMap[key] = [];
    nameMap[key].push(h);
  });

  const duplicateGroups = Object.entries(nameMap).filter(([_, list]) => list.length > 1);
  console.log(`Duplicate Groups found: ${duplicateGroups.length}`);

  let totalTopicsMigrated = 0;
  let totalChatsMigrated = 0;
  let totalFollowersMigrated = 0;
  let totalHostsDeleted = 0;

  for (const [name, list] of duplicateGroups) {
    console.log(`\n========================================`);
    console.log(`Processing duplicate group: "${name}" (${list.length} records)`);

    // Choose primary: the one with createdAt timestamp, or with the most complete profile image/data
    const primary = list.find(h => h.createdAt && !h.image?.endsWith('female.png') && !h.image?.endsWith('male.png')) ||
                    list.find(h => h.createdAt) ||
                    list[0];

    const duplicates = list.filter(h => h._id.toString() !== primary._id.toString());

    console.log(`  -> PRIMARY: ID ${primary._id} | UniqueID: ${primary.uniqueId} | Image: ${primary.image} | CreatedAt: ${primary.createdAt}`);

    for (const dup of duplicates) {
      console.log(`  -> DUPLICATE TO MERGE: ID ${dup._id} | UniqueID: ${dup.uniqueId} | Image: ${dup.image}`);

      if (!dryRun) {
        // 1. Migrate ChatTopic
        // If a topic already exists for (user, primaryId), merge messageCount or delete duplicate topic
        const dupTopics = await ChatTopic.find({
          $or: [{ senderId: dup._id }, { receiverId: dup._id }]
        });

        for (const topic of dupTopics) {
          const otherUserId = topic.senderId.toString() === dup._id.toString() ? topic.receiverId : topic.senderId;
          const isSender = topic.senderId.toString() === dup._id.toString();

          // Check if primary already has a topic with otherUserId
          const existingPrimaryTopic = await ChatTopic.findOne({
            $or: [
              { senderId: primary._id, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: primary._id }
            ]
          });

          if (existingPrimaryTopic) {
            // Re-point chats from old topic to existing primary topic
            await Chat.updateMany({ chatTopicId: topic._id }, { $set: { chatTopicId: existingPrimaryTopic._id } });
            // Update messageCount
            await ChatTopic.updateOne(
              { _id: existingPrimaryTopic._id },
              { $inc: { messageCount: topic.messageCount || 0 } }
            );
            // Remove duplicate topic
            await ChatTopic.deleteOne({ _id: topic._id });
          } else {
            // Update topic to point to primary host
            if (isSender) {
              await ChatTopic.updateOne({ _id: topic._id }, { $set: { senderId: primary._id } });
            } else {
              await ChatTopic.updateOne({ _id: topic._id }, { $set: { receiverId: primary._id } });
            }
          }
          totalTopicsMigrated++;
        }

        // 2. Migrate Chats where senderId was duplicate host
        const chatRes = await Chat.updateMany({ senderId: dup._id }, { $set: { senderId: primary._id } });
        totalChatsMigrated += chatRes.modifiedCount || 0;

        // 3. Migrate FollowerFollowing
        const ffRes = await FollowerFollowing.updateMany({ followingId: dup._id }, { $set: { followingId: primary._id } });
        totalFollowersMigrated += ffRes.modifiedCount || 0;

        // 4. Migrate History
        await History.updateMany({ hostId: dup._id }, { $set: { hostId: primary._id } });

        // 5. Delete duplicate host record
        await Host.deleteOne({ _id: dup._id });
        totalHostsDeleted++;
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`SUMMARY:`);
  console.log(`DryRun Mode: ${dryRun}`);
  console.log(`Total Duplicate Hosts Deleted: ${dryRun ? duplicateGroups.reduce((acc, [_, l]) => acc + l.length - 1, 0) : totalHostsDeleted}`);
  console.log(`Total Topics Migrated: ${totalTopicsMigrated}`);
  console.log(`Total Chats Migrated: ${totalChatsMigrated}`);
  console.log(`Total Followers Migrated: ${totalFollowersMigrated}`);

  await mongoose.disconnect();
}

const isExecute = process.argv.includes('--execute');
mergeDuplicateHosts(!isExecute).catch(console.error);
