const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,

    unique: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,

    unique: true,
    trim: true,
  },

  password: { type: String, required: true },

  totalUploads: { type: Number, default: 0 },

  storageUsed: { type: Number, default: 0 },
});

module.exports = mongoose.model("User", userSchema);
