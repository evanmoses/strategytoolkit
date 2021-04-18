const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const bucketName = 'strategy-toolkit-images';
const s3 = new aws.S3({ apiVersion: '2006-03-01', region: 'us-east-1' });

const storage = multerS3({
  acl: 'public-read',
  s3,
  bucket: bucketName,
  destination: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}`);
  },
});

const upload = multer({ storage });

module.exports = {
  bucketName, s3, storage, upload,
};
