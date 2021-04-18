const express = require('express');
const Tool = require('../models/tool.model.js');

const { bucketName, s3 } = require('../lib/imageUpload.js');

const router = express.Router();

router.get('/:toolID', (req, res) => {
  const { toolID } = req.params;

  Tool.findOne({ _id: toolID }, (err, tool) => {
    if (err || !tool) {
      res.send('Error: That page does not exist.');
    } else {
      const s3images = [];
      const toolImages = tool.img;
      if (toolImages === undefined || toolImages.length === 0) {
        res.render('tool', { page_name: 'tool', tool });
      } else {
        toolImages.forEach((img, index, array) => {
          const s3params = { Bucket: bucketName, Key: img.data.toString() };
          async function getImage() {
            const data = s3.getObject(s3params).promise();
            return data;
          }
          function encode(data) {
            const buf = Buffer.from(data);
            const base64 = buf.toString('base64');
            return base64;
          }
          getImage().then((s3img) => {
            s3images.push(encode(s3img.Body));
            if (s3images.length === array.length) {
              res.render('tool', { page_name: 'tool', tool, s3images });
            }
          });
        });
      }
    }
  });
});

module.exports = router;
