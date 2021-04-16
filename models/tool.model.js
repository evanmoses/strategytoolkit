const mongoose = require('mongoose');

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

module.exports = Tool;
