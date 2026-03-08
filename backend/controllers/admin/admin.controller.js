const Admin = require("../../models/admin.model");

//fs
const fs = require("fs");

//Cryptr
const Cryptr = require("cryptr");
const cryptr = new Cryptr("myTotallySecretKey");

//deletefile
const { deleteFile } = require("../../util/deletefile");

const _0x32b6ab = _0x2223;
(function (_0x2ea54a, _0x4d73d8) {
  const _0x2fe0b7 = _0x2223,
    _0x3d2f1d = _0x2ea54a();
  while (!![]) {
    try {
      const _0x403a0f =
        parseInt(_0x2fe0b7(0x8f)) / 0x1 +
        (parseInt(_0x2fe0b7(0x80)) / 0x2) * (-parseInt(_0x2fe0b7(0x8e)) / 0x3) +
        parseInt(_0x2fe0b7(0x8a)) / 0x4 +
        parseInt(_0x2fe0b7(0x90)) / 0x5 +
        -parseInt(_0x2fe0b7(0x82)) / 0x6 +
        -parseInt(_0x2fe0b7(0x7e)) / 0x7 +
        (-parseInt(_0x2fe0b7(0x8d)) / 0x8) * (-parseInt(_0x2fe0b7(0x87)) / 0x9);
      if (_0x403a0f === _0x4d73d8) break;
      else _0x3d2f1d["push"](_0x3d2f1d["shift"]());
    } catch (_0x246115) {
      _0x3d2f1d["push"](_0x3d2f1d["shift"]());
    }
  }
})(_0x348c, 0x20e3f);
function _0x348c() {
  const _0x2cc385 = [
    "https://api.envato.com/v3/market/author/sale?code=",
    "28160WsDYzv",
    "data",
    "message",
    "30032OwtrzH",
    "584463vxDTXE",
    "7212nnSypm",
    "271080LrLoBa",
    "item",
    "Purchase\x20code\x20verification\x20failed.",
    "toString",
    "819637YrdKiG",
    "response",
    "2hbTGhE",
    "get",
    "1177194tpawzy",
    "status",
    "Purchase\x20verification\x20script",
    "../../models/setting.model",
    "error",
    "1377LlLfcb",
    "jago-maldar",
  ];
  _0x348c = function () {
    return _0x2cc385;
  };
  return _0x348c();
}
function _0x2223(_0x3faa53, _0x4a6f79) {
  const _0x348c7e = _0x348c();
  return (
    (_0x2223 = function (_0x22239d, _0x41c169) {
      _0x22239d = _0x22239d - 0x7e;
      let _0x3ea23e = _0x348c7e[_0x22239d];
      return _0x3ea23e;
    }),
    _0x2223(_0x3faa53, _0x4a6f79)
  );
}
const Login = require("../../models/login.model"),
  Setting = require(_0x32b6ab(0x85)),
  LiveUser = require(_0x32b6ab(0x88)),
  axios = require("axios");
async function Auth(_0x30a2b6, _0x35f1db) {
  const _0x3c960d = _0x32b6ab;
  try {
    const _0x2321ca = await axios[_0x3c960d(0x81)](_0x3c960d(0x89) + _0x30a2b6, { headers: { Authorization: "Bearer\x20G9o1R8snTfNCpRgMzzKmpQP9kOVbapnP", "User-Agent": _0x3c960d(0x84) } }),
      _0x3aabd7 = _0x2321ca[_0x3c960d(0x8b)];
    if (_0x3aabd7 && _0x3aabd7[_0x3c960d(0x91)] && _0x3aabd7[_0x3c960d(0x91)]["id"][_0x3c960d(0x93)]() === _0x35f1db[_0x3c960d(0x93)]()) return !![];
    return ![];
  } catch (_0x346780) {
    if (_0x346780[_0x3c960d(0x7f)] && _0x346780[_0x3c960d(0x7f)][_0x3c960d(0x83)] === 0x194) return ![];
    console[_0x3c960d(0x86)]("API\x20error:", _0x346780[_0x3c960d(0x8c)]);
    throw new Error(_0x3c960d(0x92));
  }
}

//admin signUp
(function (_0xc87789, _0x5f384d) {
  const _0x143d1b = _0x1925,
    _0x4a9928 = _0xc87789();
  while (!![]) {
    try {
      const _0xe0e6ab =
        (-parseInt(_0x143d1b(0x16f)) / 0x1) * (parseInt(_0x143d1b(0x170)) / 0x2) +
        parseInt(_0x143d1b(0x14c)) / 0x3 +
        parseInt(_0x143d1b(0x14f)) / 0x4 +
        (parseInt(_0x143d1b(0x16c)) / 0x5) * (parseInt(_0x143d1b(0x151)) / 0x6) +
        -parseInt(_0x143d1b(0x160)) / 0x7 +
        (parseInt(_0x143d1b(0x166)) / 0x8) * (parseInt(_0x143d1b(0x171)) / 0x9) +
        (parseInt(_0x143d1b(0x167)) / 0xa) * (-parseInt(_0x143d1b(0x152)) / 0xb);
      if (_0xe0e6ab === _0x5f384d) break;
      else _0x4a9928["push"](_0x4a9928["shift"]());
    } catch (_0x326435) {
      _0x4a9928["push"](_0x4a9928["shift"]());
    }
  }
})(_0x50ba, 0x8e99e),
  (exports["registerAdmin"] = async (_0x595218, _0x26515f) => {
    const _0x234a75 = _0x1925;
    try {
      const _0x3c5194 = _0x595218?.[_0x234a75(0x16d)]?.["uid"]?.["trim"](),
        _0x2e902f = _0x595218?.["body"]?.[_0x234a75(0x149)]?.[_0x234a75(0x161)](),
        _0x414ed1 = _0x595218?.[_0x234a75(0x16d)]?.[_0x234a75(0x15b)]?.[_0x234a75(0x161)](),
        _0x1f4d19 = _0x595218?.["body"]?.[_0x234a75(0x16e)]?.[_0x234a75(0x161)](),
        _0x283b77 = _0x595218?.[_0x234a75(0x16d)]?.[_0x234a75(0x14e)];
      if (!_0x3c5194 || !_0x2e902f || !_0x414ed1 || !_0x1f4d19 || !_0x283b77) return _0x26515f[_0x234a75(0x15f)](0xc8)[_0x234a75(0x15c)]({ status: ![], message: _0x234a75(0x150) });
      const [_0x38cc28, _0x870c13, _0x3c32e5, _0x359f6d] = await Promise[_0x234a75(0x14b)]([
        Setting[_0x234a75(0x145)]({}),
        Admin[_0x234a75(0x165)]({}),
        Admin[_0x234a75(0x145)]({ $or: [{ uid: _0x3c5194 }, { email: _0x2e902f }] }),
        Auth(_0x1f4d19, _0x234a75(0x169)),
      ]);
      if (!_0x38cc28) return _0x26515f[_0x234a75(0x15f)](0xc8)[_0x234a75(0x15c)]({ status: ![], message: _0x234a75(0x14a) });
      if (!_0x38cc28["privateKey"] || typeof _0x38cc28["privateKey"] !== _0x234a75(0x163)) return _0x26515f["status"](0x1f4)[_0x234a75(0x15c)]({ status: ![], message: _0x234a75(0x155) });
      if (_0x870c13) return _0x26515f[_0x234a75(0x15f)](0xc8)[_0x234a75(0x15c)]({ status: ![], message: _0x234a75(0x158) });
      if (_0x3c32e5) return _0x26515f["status"](0xc8)["json"]({ status: ![], message: _0x234a75(0x159) });
      if (!_0x359f6d) return _0x26515f[_0x234a75(0x15f)](0xc8)[_0x234a75(0x15c)]({ status: ![], message: _0x234a75(0x15e) });
      const _0x1cd4f5 = new Admin({ uid: _0x3c5194, email: _0x2e902f, password: cryptr["encrypt"](_0x414ed1), purchaseCode: _0x1f4d19 });
      await Promise[_0x234a75(0x14b)]([_0x1cd4f5[_0x234a75(0x153)](), Login[_0x234a75(0x162)]({}, { $set: { login: !![] } }, { upsert: !![] })]);
      if (_0x595218[_0x234a75(0x16d)]["privateKey"])
        try {
          (_0x38cc28[_0x234a75(0x14e)] =
            typeof _0x595218["body"][_0x234a75(0x14e)] === _0x234a75(0x148) ? JSON[_0x234a75(0x16b)](_0x595218["body"][_0x234a75(0x14e)][_0x234a75(0x161)]()) : _0x595218["body"][_0x234a75(0x14e)]),
            await _0x38cc28[_0x234a75(0x153)](),
            updateSettingFile(_0x38cc28);
          const { exec: _0x2bff18 } = require(_0x234a75(0x15d));
          _0x2bff18(_0x234a75(0x15a), (_0x42f3ef, _0x11d9f9, _0x2aeb4e) => {
            const _0xa959a4 = _0x234a75;
            if (_0x42f3ef) {
              console[_0xa959a4(0x146)](_0xa959a4(0x168), _0x42f3ef[_0xa959a4(0x164)]);
              return;
            }
            _0x2aeb4e && console["error"](_0xa959a4(0x16a), _0x2aeb4e), console[_0xa959a4(0x14d)]("PM2\x20restarted\x20successfully:", _0x11d9f9);
          });
        } catch {
          return _0x26515f[_0x234a75(0x15f)](0xc8)[_0x234a75(0x15c)]({ status: ![], message: _0x234a75(0x157) });
        }
      return _0x26515f[_0x234a75(0x15f)](0xc8)[_0x234a75(0x15c)]({ status: !![], message: _0x234a75(0x147), admin: _0x1cd4f5 });
    } catch (_0x40d6bb) {
      return console[_0x234a75(0x146)](_0x234a75(0x156), _0x40d6bb), _0x26515f["status"](0x1f4)["json"]({ status: ![], message: _0x40d6bb[_0x234a75(0x164)] || _0x234a75(0x154) });
    }
  });
function _0x1925(_0x41df27, _0x3c630b) {
  const _0x50ba4a = _0x50ba();
  return (
    (_0x1925 = function (_0x1925a7, _0x38b665) {
      _0x1925a7 = _0x1925a7 - 0x145;
      let _0x47ddb8 = _0x50ba4a[_0x1925a7];
      return _0x47ddb8;
    }),
    _0x1925(_0x41df27, _0x3c630b)
  );
}
function _0x50ba() {
  const _0x5bdf53 = [
    "string",
    "email",
    "Settings\x20document\x20not\x20found\x20in\x20database.",
    "all",
    "2189283QnFTUS",
    "log",
    "privateKey",
    "1146908oYaytp",
    "Oops!\x20Invalid\x20or\x20missing\x20details.",
    "26472GdYbAz",
    "8437COQEDY",
    "save",
    "Internal\x20Server\x20Error",
    "Settings\x20document\x20is\x20invalid\x20(missing\x20privateKey).",
    "registerAdmin\x20error:",
    "Invalid\x20privateKey\x20format.\x20Must\x20be\x20valid\x20JSON.",
    "An\x20admin\x20already\x20exists.\x20Please\x20log\x20in.",
    "Admin\x20with\x20this\x20UID\x20or\x20email\x20already\x20exists.",
    "pm2\x20restart\x20backend\x20--update-env",
    "password",
    "json",
    "child_process",
    "Purchase\x20code\x20is\x20not\x20valid.",
    "status",
    "391699ZhrPlC",
    "trim",
    "updateOne",
    "object",
    "message",
    "exists",
    "11896LZiTCX",
    "11580kcDEbc",
    "PM2\x20restart\x20error:",
    "58577440",
    "PM2\x20stderr:",
    "parse",
    "915UGgatj",
    "body",
    "code",
    "558846OjwphR",
    "2jfQrhe",
    "1593YtjEFN",
    "findOne",
    "error",
    "Admin\x20created\x20successfully!",
  ];
  _0x50ba = function () {
    return _0x5bdf53;
  };
  return _0x50ba();
}

//admin login
function _0x1984(_0x228cd2, _0x469441) {
  const _0xbfee85 = _0xbfee();
  return (
    (_0x1984 = function (_0x19840b, _0x3eabe6) {
      _0x19840b = _0x19840b - 0x1b7;
      let _0x1c202e = _0xbfee85[_0x19840b];
      return _0x1c202e;
    }),
    _0x1984(_0x228cd2, _0x469441)
  );
}
function _0xbfee() {
  const _0x107363 = [
    "Internal\x20Server\x20Error",
    "Purchase\x20code\x20is\x20not\x20valid.",
    "status",
    "5rOAqbd",
    "_id\x20password\x20purchaseCode",
    "3256964bkyPWf",
    "Oops!\x20Password\x20doesn\x27t\x20match!",
    "2268606SZKZke",
    "10896767tXRkAy",
    "findOne",
    "Admin\x20has\x20successfully\x20logged\x20in.",
    "message",
    "trim",
    "password",
    "validateAdminLogin",
    "error",
    "1064552csaHVN",
    "78628sjPzdh",
    "purchaseCode",
    "lean",
    "select",
    "json",
    "1589154feqDmO",
    "1112170AKgwdm",
  ];
  _0xbfee = function () {
    return _0x107363;
  };
  return _0xbfee();
}
const _0x2aa59e = _0x1984;
(function (_0xfb2239, _0x2e1c68) {
  const _0x594e72 = _0x1984,
    _0x31f95e = _0xfb2239();
  while (!![]) {
    try {
      const _0x2d9d93 =
        -parseInt(_0x594e72(0x1c6)) / 0x1 +
        -parseInt(_0x594e72(0x1c0)) / 0x2 +
        -parseInt(_0x594e72(0x1c5)) / 0x3 +
        parseInt(_0x594e72(0x1cc)) / 0x4 +
        (-parseInt(_0x594e72(0x1ca)) / 0x5) * (-parseInt(_0x594e72(0x1ce)) / 0x6) +
        parseInt(_0x594e72(0x1b7)) / 0x7 +
        -parseInt(_0x594e72(0x1bf)) / 0x8;
      if (_0x2d9d93 === _0x2e1c68) break;
      else _0x31f95e["push"](_0x31f95e["shift"]());
    } catch (_0x45cb2c) {
      _0x31f95e["push"](_0x31f95e["shift"]());
    }
  }
})(_0xbfee, 0xe4360),
  (exports[_0x2aa59e(0x1bd)] = async (_0x3f893b, _0x1ca29d) => {
    const _0x10977d = _0x2aa59e;
    try {
      const { email: _0xc2c377, password: _0x309e00 } = _0x3f893b["body"];
      if (!_0xc2c377 || !_0x309e00) return _0x1ca29d[_0x10977d(0x1c9)](0xc8)[_0x10977d(0x1c4)]({ status: ![], message: "Oops!\x20Invalid\x20details!" });
      const _0x11df0b = await Admin[_0x10977d(0x1b8)]({ email: _0xc2c377[_0x10977d(0x1bb)]() })
        [_0x10977d(0x1c3)](_0x10977d(0x1cb))
        [_0x10977d(0x1c2)]();
      if (!_0x11df0b) return _0x1ca29d["status"](0xc8)[_0x10977d(0x1c4)]({ status: ![], message: "Oops!\x20Admin\x20not\x20found\x20with\x20that\x20email." });
      if (cryptr["decrypt"](_0x11df0b[_0x10977d(0x1bc)]) !== _0x309e00) return _0x1ca29d[_0x10977d(0x1c9)](0xc8)[_0x10977d(0x1c4)]({ status: ![], message: _0x10977d(0x1cd) });
      const _0x220880 = await LiveUser(_0x11df0b?.[_0x10977d(0x1c1)], 0x37dd220);
      return _0x220880
        ? _0x1ca29d[_0x10977d(0x1c9)](0xc8)["json"]({ status: !![], message: _0x10977d(0x1b9) })
        : _0x1ca29d[_0x10977d(0x1c9)](0xc8)[_0x10977d(0x1c4)]({ status: ![], message: _0x10977d(0x1c8) });
    } catch (_0x55e52c) {
      return console[_0x10977d(0x1be)](_0x55e52c), _0x1ca29d[_0x10977d(0x1c9)](0x1f4)["json"]({ status: ![], message: _0x55e52c[_0x10977d(0x1ba)] || _0x10977d(0x1c7) });
    }
  });

//update admin profile
exports.modifyAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const admin = await Admin.findById(adminId).select("name email image password").lean();
    if (!admin) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Admin not found!" });
    }

    const updateFields = {
      name: req.body?.name || admin.name,
      email: req.body?.email ? req.body.email.trim() : admin.email,
    };

    if (req.file) {
      if (admin.image) {
        const imagePath = admin.image.includes("storage") ? "storage" + admin.image.split("storage")[1] : "";
        if (imagePath && fs.existsSync(imagePath)) {
          const imageName = imagePath.split("/").pop();
          if (!["male.png", "female.png"].includes(imageName)) {
            fs.unlinkSync(imagePath);
          }
        }
      }
      updateFields.image = req.file.path;
    }

    const [updatedAdmin] = await Promise.all([Admin.findByIdAndUpdate(req.admin._id, updateFields, { new: true, select: "name email image password" }).lean()]);

    updatedAdmin.password = cryptr.decrypt(updatedAdmin.password);

    return res.status(200).json({
      status: true,
      message: "Admin profile has been updated.",
      data: updatedAdmin,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get admin profile
exports.retrieveAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const [admin] = await Promise.all([Admin.findById(adminId).select("_id name email password image").lean()]);

    if (!admin) {
      return res.status(200).json({ status: false, message: "Admin not found." });
    }

    admin.password = cryptr.decrypt(admin.password);

    return res.status(200).json({
      status: true,
      message: "Admin profile retrieved successfully!",
      data: admin,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//update password
exports.modifyPassword = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(200).json({ status: false, message: "admin does not found." });
    }

    if (!req.body.oldPass || !req.body.newPass || !req.body.confirmPass) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    if (cryptr.decrypt(admin.password) !== req.body.oldPass) {
      return res.status(200).json({
        status: false,
        message: "Oops! Password doesn't match!",
      });
    }

    if (req.body.newPass !== req.body.confirmPass) {
      return res.status(200).json({
        status: false,
        message: "Oops ! New Password and Confirm Password don't match!",
      });
    }

    const hash = cryptr.encrypt(req.body.newPass);
    admin.password = hash;

    const [savedAdmin, data] = await Promise.all([admin.save(), Admin.findById(admin._id)]);

    data.password = cryptr.decrypt(savedAdmin.password);

    return res.status(200).json({
      status: true,
      message: "Password has been changed by the admin.",
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//set Password
exports.performPasswordReset = async (req, res) => {
  try {
    const admin = await Admin.findById(req?.admin._id);
    if (!admin) {
      return res.status(200).json({ status: false, message: "Admin does not found." });
    }

    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(200).json({
        status: false,
        message: "Oops! New Password and Confirm Password don't match!",
      });
    }

    admin.password = cryptr.encrypt(newPassword);
    await admin.save();

    admin.password = cryptr.decrypt(admin?.password);

    return res.status(200).json({
      status: true,
      message: "Password has been updated Successfully.",
      data: admin,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
