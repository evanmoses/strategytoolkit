const express = require('express');
const Tool = require('../models/tool.model.js');

const { bucketName, s3, upload } = require('../lib/imageUpload.js');
const tagMap = require('../lib/tagMap.js');

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
        res.render('edittool', { page_name: 'edittool', libs: ['edittool-lib'], tool });
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
              res.render('edittool', {
                page_name: 'edittool', libs: ['edittool-lib'], tool, s3images,
              });
            }
          });
        });
      }
    }
  });
});

router.put('/:toolid/:imgid', (req, res) => {
  const imageID = req.params.imgid;
  const toolID = req.params.toolid;
  Tool.findOneAndUpdate({ _id: toolID },
    { $pull: { img: { _id: imageID } } }, { safe: true, new: false }, (err, obj) => {
      if (err) res.status(500);
      const thisIMG = obj.img.id(imageID);
      const imgPath = thisIMG.data.toString();
      const s3params = { Bucket: bucketName, Key: imgPath };
      s3.deleteObject(s3params, (error) => {
        if (error) {
          console.log(`failed to delete local image: ${error}`);
        } else {
          console.log('successfully deleted local image');
        }
      });
      res.redirect(`/edittool/${toolID}`);
    });
});

router.put('/:toolid', upload.array('images'), (req, res) => {
  const { files } = req;
  const toolID = req.params.toolid;

  const tagArray = [];
  const tag = req.body.tags;
  if (tag) {
    tag.forEach((tagClass) => {
      const cutTagClass = tagClass.substring(1);
      const tagText = tagMap.get(tagClass);
      const tagItem = { text: tagText, class: cutTagClass };
      tagArray.push(tagItem);
    });
  }

  const images = [];
  if (files) {
    Tool.findById(toolID, (err, obj) => {
      if (err) res.status(500);
      const existingimages = obj.img;
      existingimages.forEach((img) => {
        images.push(img);
      });
    });
    for (let i = 0; i < files.length; i += 1) {
      const image = {
        data: req.files[i].key,
        contentType: req.files[i].mimetype,
      };
      images.push(image);
    }
  }

  const resources = [];
  for (let i = 0; i <= 3; i += 1) {
    const rezzies = `resources${i.toString()}`;
    Object.keys(req.body).forEach((key) => {
      if (rezzies.includes(key)) {
        if (req.body[key] !== '') {
          resources.push(req.body[key]);
        }
      }
    });
  }

  const steps = [];
  for (let i = 0; i <= 7; i += 1) {
    const steppies = `step${i.toString()}`;
    Object.keys(req.body).forEach((key) => {
      if (steppies.includes(key)) {
        if (req.body[key] !== '') {
          steps.push(req.body[key]);
        }
      }
    });
  }

  if (files) {
    // eslint-disable-next-line consistent-return
    Tool.findById(toolID, (err, tool) => {
      if (err) res.status(500);
      if (!tool) {
        // eslint-disable-next-line no-alert
        res.redirect('/addtool');
      } else {
        /* eslint-disable no-param-reassign */
        tool.title = req.body.toolTitle;
        tool.tags = tagArray;
        tool.description = req.body.description;
        tool.whenToUse = req.body.when;
        tool.howToUse = req.body.how;
        tool.howToSteps = steps;
        tool.suggestedApplication = req.body.suggestedApp;
        tool.references = resources;
        tool.img = images;
        /* eslint-enable no-param-reassign */
        tool.save((error, toolStored) => {
          if (error) res.status(500);
          // eslint-disable-next-line no-console
          console.log(toolStored);
        });
        setTimeout(() => {
          res.redirect('/');
        }, 500);
      }
    });
  }
});

router.delete('/:toolid', (req, res) => {
  const toolID = req.params.toolid;
  Tool.findOneAndDelete({ _id: toolID }, (err, obj) => {
    if (err) res.status(500);
    const images = obj.img;
    images.forEach((img) => {
      const imgPath = img.data.toString();
      const s3params = { Bucket: bucketName, Key: imgPath };
      s3.deleteObject(s3params, (error) => {
        if (error) {
          console.log(`failed to delete local image: ${error}`);
        } else {
          console.log('successfully deleted local image');
        }
      });
    });
  });
  setTimeout(() => {
    res.redirect('/');
  }, 500);
});

module.exports = router;
