const cloudinary = require("cloudinary").v2;

exports.sendUploadToGCS = (req, res, next) => {
  if (!req.files) {
    return next();
  }

  const file = req.files.file;
  const file_name = new Date().getTime().toString() + "_" + file.name;
  cloudinary.uploader
    .upload(file.tempFilePath, { public_id: file_name, resource_type: "raw" })
    .then((result) => {
      req.files.gcsUrl = result.secure_url;
      req.files.public_file_name = file_name;
      next();
    })
    .catch((error) =>
      res
        .status(400)
        .json({
          messge: "someting went wrong while processing your request",
          error: error,
        })
    );
};
