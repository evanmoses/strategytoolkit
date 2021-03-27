const aws = require('aws-sdk');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const multerS3 = require('multer-s3');
const methodOverride = require('method-override');
// const basicAuth = require('express-basic-auth');
require('dotenv').config();

const app = express();

const bucketName = 'strategy-toolkit-images';
const s3 = new aws.S3({ apiVersion: '2006-03-01', region: 'us-east-1' });

const router = express.Router();

app.use('/strategytoolkit', router);

app.set('view engine', 'ejs');

app.use('/strategytoolkit', express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride('_method'));

// const user = process.env.USER;
// const pass = process.env.PASS;
// function myAuthorizer(username, password) {
//   const userMatches = basicAuth.safeCompare(username, user);
//   const passwordMatches = basicAuth.safeCompare(password, pass);
//   // eslint-disable-next-line no-bitwise
//   return userMatches & passwordMatches;
// }
// app.use(basicAuth({ authorizer: myAuthorizer, challenge: true }));

// eslint-disable-next-line prefer-const
let mongoosePort = process.env.CLOUD_DB;
// mongoosePort = process.env.LOCAL_DB;
mongoose.connect(mongoosePort, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

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

const toolSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: {
      unique: true,
      collation: {
        locale: 'en',
        strength: 2,
      },
    },
  },
  tags: [{
    text: String,
    class: String,
  }],

  description: String,
  whenToUse: String,
  howToUse: String,
  howToSteps: [String],
  suggestedApplication: String,
  references: [String],
  img: [{
    data: Buffer,
    contentType: String,
    filepath: String,
  }],
});

const Tool = mongoose.model('Tool', toolSchema);

router.get('/', (req, res) => {
  Tool.find({}, (err, tools) => {
    if (!err) {
      res.render('home', {
        page_name: '',
        libs: ['home'],
        tools,
      });
    }
  });
});

router.get('/about', (req, res) => {
  res.render('about', {
    page_name: 'about',
  });
});

router.get('/addtool', (req, res) => {
  res.render('addtool', {
    page_name: 'addtool',
    libs: ['addtool'],
  });
});

router.get('/tool/:toolID', (req, res) => {
  const { toolID } = req.params;

  // const requestedTitle = req.params.toolName;
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

router.get('/edittool/:toolID', (req, res) => {
  const { toolID } = req.params;

  // const requestedTitle = req.params.toolName;
  Tool.findOne({ _id: toolID }, (err, tool) => {
    if (err || !tool) {
      res.send('Error: That page does not exist.');
    } else {
      const s3images = [];
      const toolImages = tool.img;
      if (toolImages === undefined || toolImages.length === 0) {
        res.render('edittool', { page_name: 'edittool', libs: ['edittool'], tool });
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
                page_name: 'edittool', libs: ['edittool'], tool, s3images,
              });
            }
          });
        });
      }
    }
  });
});

const tagMap = new Map();

tagMap.set('.infogather', 'Information Gathering');
tagMap.set('.analysis', 'Problem Analysis');
tagMap.set('.opportunity', 'Opportunity Analysis');
tagMap.set('.ideation', 'Ideation / Evaluation');
tagMap.set('.stratdev', 'Strategy Development');
tagMap.set('.busstrat', 'Business Strategy');
tagMap.set('.expstrat', 'Experience Strategy');
tagMap.set('.stratfore', 'Strategic Foresight');
tagMap.set('.coretool', 'Core Tool');
tagMap.set('.secondary', 'Secondary Tool');
tagMap.set('.collaboration', 'Client collaboration');

router.post('/addtool', upload.array('images'), (req, res) => {
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

router.put('/edittool/:toolid/:imgid', (req, res) => {
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

router.put('/edittool/:toolid', upload.array('images'), (req, res) => {
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

router.delete('/edittool/:toolid', (req, res) => {
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

let port = process.env.PORT;
// port = ''
if (port == null || port === '') {
  port = 5000;
}

app.listen(port, () => {
  console.log(`server started successfully on port ${port}`);
});
