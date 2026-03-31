/**
 * One-time: lowercase all CoinPlan.productId values to match App Store Connect (e.g. com.app.coin.10).
 * Run from backend folder: node scripts/normalizeCoinPlanProductIds.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const CoinPlan = require("../models/coinPlan.model");

async function main() {
  const uri = process.env.MongoDb_Connection_String;
  if (!uri) {
    console.error("Missing MongoDb_Connection_String in .env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const plans = await CoinPlan.find({
    productId: { $exists: true, $nin: [null, ""] },
  })
    .select("_id productId")
    .lean();

  let updated = 0;
  for (const p of plans) {
    const lower = String(p.productId).trim().toLowerCase();
    if (lower && lower !== p.productId) {
      await CoinPlan.updateOne({ _id: p._id }, { $set: { productId: lower } });
      updated++;
      console.log(`${p.productId} -> ${lower}`);
    }
  }
  console.log(`Done. Updated ${updated} of ${plans.length} plans with a productId.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
