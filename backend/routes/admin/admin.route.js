function _0x5ecb() {
  const _0x6e614d = [
    "23419tQktJF",
    "patch",
    "/performPasswordReset",
    "24cqJzqf",
    "post",
    "/validateAdminLogin",
    "retrieveAdminProfile",
    "modifyPassword",
    "18ceOqVA",
    "459398WmYvij",
    "multer",
    "4003390tlVfBe",
    "5810610QxTJjr",
    "2lMVKQy",
    "../../controllers/admin/admin.controller",
    "Router",
    "../../checkAccess",
    "338044jGxcCb",
    "registerAdmin",
    "1307832fUZWee",
    "modifyAdminProfile",
    "../../util/multer",
    "/modifyPassword",
    "get",
    "/registerAdmin",
    "/modifyAdminProfile",
    "validateAdminLogin",
    "5lwMBrG",
    "single",
    "4JfjJNb",
    "16ujuqOD",
    "express",
    "2061321egHySV",
    "performPasswordReset",
  ];
  _0x5ecb = function () {
    return _0x6e614d;
  };
  return _0x5ecb();
}
function _0x5c2c(_0x305edf, _0x1151e6) {
  const _0x5ecbd6 = _0x5ecb();
  return (
    (_0x5c2c = function (_0x5c2c62, _0x36ce0f) {
      _0x5c2c62 = _0x5c2c62 - 0x179;
      let _0x389110 = _0x5ecbd6[_0x5c2c62];
      return _0x389110;
    }),
    _0x5c2c(_0x305edf, _0x1151e6)
  );
}
const _0x111336 = _0x5c2c;
(function (_0x183571, _0xa2c831) {
  const _0x143d3b = _0x5c2c,
    _0x3dd39a = _0x183571();
  while (!![]) {
    try {
      const _0x224174 =
        (-parseInt(_0x143d3b(0x189)) / 0x1) * (-parseInt(_0x143d3b(0x18d)) / 0x2) +
        (-parseInt(_0x143d3b(0x17e)) / 0x3) * (-parseInt(_0x143d3b(0x17b)) / 0x4) +
        (parseInt(_0x143d3b(0x179)) / 0x5) * (-parseInt(_0x143d3b(0x193)) / 0x6) +
        (parseInt(_0x143d3b(0x191)) / 0x7) * (-parseInt(_0x143d3b(0x17c)) / 0x8) +
        (parseInt(_0x143d3b(0x188)) / 0x9) * (-parseInt(_0x143d3b(0x18b)) / 0xa) +
        (parseInt(_0x143d3b(0x180)) / 0xb) * (-parseInt(_0x143d3b(0x183)) / 0xc) +
        parseInt(_0x143d3b(0x18c)) / 0xd;
      if (_0x224174 === _0xa2c831) break;
      else _0x3dd39a["push"](_0x3dd39a["shift"]());
    } catch (_0x520948) {
      _0x3dd39a["push"](_0x3dd39a["shift"]());
    }
  }
})(_0x5ecb, 0x73b7f);
const express = require(_0x111336(0x17d)),
  route = express[_0x111336(0x18f)](),
  checkAccessWithSecretKey = require(_0x111336(0x190)),
  AdminController = require(_0x111336(0x18e)),
  multer = require(_0x111336(0x18a)),
  storage = require(_0x111336(0x195)),
  upload = multer({ storage: storage }),
  validateAdminToken = require("../../middleware/verifyAdminAuthToken.middleware");
route[_0x111336(0x184)](_0x111336(0x198), checkAccessWithSecretKey(), AdminController[_0x111336(0x192)]),
  route[_0x111336(0x184)](_0x111336(0x185), validateAdminToken, checkAccessWithSecretKey(), AdminController[_0x111336(0x19a)]),
  route[_0x111336(0x181)](_0x111336(0x199), checkAccessWithSecretKey(), validateAdminToken, upload[_0x111336(0x17a)]("image"), AdminController[_0x111336(0x194)]),
  route[_0x111336(0x197)]("/retrieveAdminProfile", checkAccessWithSecretKey(), validateAdminToken, AdminController[_0x111336(0x186)]),
  route[_0x111336(0x181)](_0x111336(0x196), checkAccessWithSecretKey(), validateAdminToken, AdminController[_0x111336(0x187)]),
  route["patch"](_0x111336(0x182), checkAccessWithSecretKey(), validateAdminToken, AdminController[_0x111336(0x17f)]),
  (module["exports"] = route);
