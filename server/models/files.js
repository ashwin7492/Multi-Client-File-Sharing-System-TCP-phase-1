const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  fileName: { type: String, required: true, trim: true },

  filePath: { type: String, required: true },

  fileSize: { type: Number, required: true },

  uploadedBy: { type: String, required: true },

  fileType: { type: String, default: "unknown" },

  uploadDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("File", fileSchema);
