const generateUniqueId = require("../util/generateUniqueId");
const { mergeStringField } = require("./profileCompleteness");

// User function
const userFunction = async (user, data_) => {
  const data = data_.body;
  const file = data_.file;

  if (file) {
    user.image = file.path;
  } else if (data.image !== undefined && data.image !== null) {
    user.image = mergeStringField(user.image, data.image);
  }
  user.name = mergeStringField(user.name, data?.name);
  user.gender = data?.gender !== undefined ? mergeStringField(user.gender || "", data.gender) : user.gender;
  if (user.gender) user.gender = String(user.gender).toLowerCase().trim();
  user.age = data?.age || user.age;
  user.dob = mergeStringField(user.dob, data?.dob);
  user.email = data?.email?.trim() || user.email;
  user.selfIntro = data?.selfIntro?.trim() || user.selfIntro;
  user.countryFlagImage = data?.countryFlagImage || user.countryFlagImage;
  user.country = data?.country?.toLowerCase()?.trim() || user.country;
  user.ipAddress = data?.ipAddress || user.ipAddress;
  user.loginType = data?.loginType || user.loginType;
  user.identity = data?.identity || user.identity;
  user.fcmToken = data?.fcmToken || user.fcmToken;

  if (!user.uniqueId) {
    [user.uniqueId] = await Promise.all([generateUniqueId()]);
  }

  await user.save();
  return user;
};

module.exports = userFunction;
