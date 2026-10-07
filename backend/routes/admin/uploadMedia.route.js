const express = require("express");
const route = express.Router();
const checkAccessWithSecretKey = require("../../checkAccess");
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

route.post(
  "/",
  checkAccessWithSecretKey(),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "photoGallery", maxCount: 20 },
    { name: "video", maxCount: 20 },
  ]),
  (req, res) => {
    try {
      let image = null;
      let photoGallery = [];
      let video = [];

      if (req.files) {
        if (req.files.image && req.files.image.length > 0) {
          image = req.files.image[0].path;
        }
        if (req.files.photoGallery) {
          photoGallery = req.files.photoGallery.map((f) => f.path);
        }
        if (req.files.video) {
          video = req.files.video.map((f) => f.path);
        }
      }

      return res.status(200).json({
        status: true,
        message: "Media uploaded successfully",
        data: { image, photoGallery, video },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ status: false, message: error.message || "Internal server error" });
    }
  }
);

module.exports = route;
