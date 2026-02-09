const fileUpload = require("express-fileupload");
const path = require("path");

module.exports = function fileUploadMiddleware() {
  return fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true,
    safeFileNames: true,
    preserveExtension: 4,
    tempFileDir: path.join(__dirname, "../../tmp"),
  });
};
