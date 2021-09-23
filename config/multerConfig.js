const Multer = require('multer');
const Datauri = require('datauri');
const DatauriParser = require('datauri/parser');

const path = require('path');

const storage = Multer.memoryStorage();
const multerUploads = Multer({ storage }).single('file');

const dUri =  new DatauriParser();
const dataUri = req => dUri.format(path.extname(req.file.originalname).toString(), req.file.buffer);
exports.multerUploads = multerUploads;
exports.dataUri = dataUri;