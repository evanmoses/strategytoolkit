const express = require('express');
const Tool = require('../models/tool.model.js');

const { upload } = require('../lib/imageUpload.js');
const tagMap = require('../lib/tagMap.js');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('addtool', {
    page_name: 'addtool',
    libs: ['../addtool'],
  });
});

router.post('/', upload.array('images'), (req, res) => {
  const { files } = req;

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
    Tool.findOne({ title: req.body.toolTitle }, (err, tool) => {
      if (err) res.status(500);
      if (tool) {
        // eslint-disable-next-line no-alert
        res.send('Error: A tool with that name already exists. Please go back and create a new tool with a unique name.');
      } else {
        const newTool = new Tool({
          title: req.body.toolTitle,
          tags: tagArray,
          description: req.body.description,
          whenToUse: req.body.when,
          howToUse: req.body.how,
          howToSteps: steps,
          suggestedApplication: req.body.suggestedApp,
          references: resources,
          img: images,
        });
        newTool.save((error, toolStored) => {
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

module.exports = router;
