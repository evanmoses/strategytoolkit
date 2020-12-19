const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const methodOverride = require('method-override');
const basicAuth = require('express-basic-auth');
require('dotenv/config');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride('_method'));

const user = process.env.USER;
const pass = process.env.PASS;
function myAuthorizer(username, password) {
  const userMatches = basicAuth.safeCompare(username, user);
  const passwordMatches = basicAuth.safeCompare(password, pass);
  // eslint-disable-next-line no-bitwise
  return userMatches & passwordMatches;
}
app.use(basicAuth({ authorizer: myAuthorizer, challenge: true }));

mongoose.connect(process.env.LOCAL_DB, /* process.env.CLOUD_DB */ {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
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

app.get('/', (req, res) => {
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

app.get('/about', (req, res) => {
  res.render('about', {
    page_name: 'about',
  });
});

app.get('/addtool', (req, res) => {
  res.render('addtool', {
    page_name: 'addtool',
    libs: ['addtool'],
  });
});

app.get('/tool/:toolID', (req, res) => {
  const requestedTitle = req.params.toolID;
  // const requestedTitle = req.params.toolName;
  Tool.findOne({ _id: requestedTitle }, (err, tool) => {
    if (err || !tool) {
      res.send('Error: That page does not exist.');
    } else {
      res.render('tool', { page_name: 'tool', tool });
    }
  });
});

app.get('/edittool/:toolID', (req, res) => {
  const requestedTitle = req.params.toolID;
  Tool.findOne({ _id: requestedTitle }, (err, tool) => {
    if (err || !tool) {
      res.send('Error: That page does not exist.');
    } else {
      res.render('edittool', { page_name: 'edittool', libs: ['edittool'], tool });
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

app.post('/addtool', upload.array('images'), (req, res) => {
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
        data: fs.readFileSync(path.join(__dirname, 'uploads', req.files[i].filename)),
        contentType: req.files[i].mimetype,
        filepath: path.join('uploads', req.files[i].filename),
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

app.put('/edittool/:toolid/:imgid', (req, res) => {
  const imageID = req.params.imgid;
  const toolID = req.params.toolid;
  Tool.findOneAndUpdate({ _id: toolID },
    { $pull: { img: { _id: imageID } } }, { safe: true, new: false }, (err, obj) => {
      if (err) res.status(500);
      const thisIMG = obj.img.id(imageID);
      const imgPath = thisIMG.filepath;
      fs.unlink(imgPath, (error) => {
        if (error) {
          console.log(`failed to delete local image: ${error}`);
        } else {
          console.log('successfully deleted local image');
        }
      });
      res.redirect(`/edittool/${toolID}`);
    });
});

app.put('/edittool/:toolid', upload.array('images'), (req, res) => {
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
        data: fs.readFileSync(path.join(__dirname, 'uploads', req.files[i].filename)),
        contentType: req.files[i].mimetype,
        filepath: path.join('uploads', req.files[i].filename),
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

app.delete('/edittool/:toolid', (req, res) => {
  const toolID = req.params.toolid;
  Tool.findOneAndDelete({ _id: toolID }, (err, obj) => {
    if (err) res.status(500);
    const images = obj.img;
    images.forEach((img) => {
      const imgPath = img.filepath;
      fs.unlink(imgPath, (error) => {
        if (error) {
          console.log(`failed to delete local image: ${error}`);
        } else {
          console.log('successfully deleted local image');
        }
      });
    });
  });
  res.redirect('/');
});

let port = process.env.PORT;
if (port == null || port === '') {
  port = 3000;
}

app.listen(port, () => {
  console.log('server started successfully');
});
