require("dotenv").config();
const fs = require("fs");
const path = require("path");
const net = require("net");
const User = require("./models/user");
const File = require("./models/files");
const connectDB = require("./mongo");

connectDB();

const uploadStates = new Map();
const clients = new Map();
let clientCounter = 1;

const server = net.createServer((socket) => {
  const clientId = clientCounter++;
  clients.set(clientId, socket);
  console.log(`Client ${clientId} Connected`);
  socket.clientId = clientId;

  socket.on("data", async (data) => {
    // 1. CHUNK PROCESSING ROUTINE FOR FILE UPLOADS
    if (uploadStates.has(clientId)) {
      const uploadInfo = uploadStates.get(clientId);

      // CRITICAL FIX: Ensure we write raw binary buffers, NEVER strings
      fs.appendFileSync(uploadInfo.path, data);
      uploadInfo.received += data.length;

      console.log(`Receiving File: ${uploadInfo.received}/${uploadInfo.size}`);

      if (uploadInfo.received >= uploadInfo.size) {
        console.log("File Upload Complete");
        const fileType = path.extname(uploadInfo.path);

        await File.create({
          fileName: path.basename(uploadInfo.path),
          filePath: uploadInfo.path,
          fileSize: uploadInfo.size,
          uploadedBy: socket.user ? socket.user.username : "Anonymous",
          fileType,
        });
        socket.write("UPLOAD_SUCCESS");
        uploadStates.delete(clientId);
      }
      return;
    }

    // 2. TEXT COMMAND PROCESSING
    const message = data.toString();
    console.log(`Client ${clientId}:`, message);

    const separator = message.indexOf("\n");
    const cleanMessage =
      separator !== -1 ? message.slice(0, separator) : message;

    const parts = cleanMessage.split(":");
    const command = parts[0];

    // LOGIN
    if (command === "LOGIN") {
      const username = parts[1];
      const password = parts[2];
      const user = await User.findOne({ username, password });

      if (user) {
        socket.user = { username: user.username, email: user.email };
        socket.write(`LOGIN_SUCCESS:${user.username}`);
      } else {
        socket.write("LOGIN_FAILED");
      }
    }

    // SIGNUP
    else if (command === "SIGNUP") {
      const username = parts[1];
      const email = parts[2];
      const password = parts[3];

      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (existingUser) {
        socket.write("USER_ALREADY_EXISTS");
      } else {
        await User.create({ username, email, password });
        socket.write("SIGNUP_SUCCESS");
      }
    }

    // LIST CLIENTS
    else if (command === "CLIENTS") {
      socket.write(`TOTAL_CLIENTS:${clients.size}`);
    }

    // UPLOAD FILE REQUEST
    else if (command === "UPLOAD") {
      if (!socket.user) {
        socket.write("LOGIN_REQUIRED");
        return;
      }
      const fileName = parts[1];
      const fileSize = parseInt(parts[2]);
      const filePath = path.join(__dirname, "uploads", fileName);

      // Create uploads folder if it doesn't exist
      if (!fs.existsSync(path.join(__dirname, "uploads"))) {
        fs.mkdirSync(path.join(__dirname, "uploads"));
      }

      // If old partial files exist, wipe them out so appendFileSync starts fresh
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      uploadStates.set(clientId, {
        path: filePath,
        size: fileSize,
        received: 0,
      });

      socket.write("READY_FOR_FILE");
    }

    // DOWNLOAD REQUEST (FIXED NESTED LISTENER CORRUPTION)
    else if (command === "DOWNLOAD") {
      const fileName = parts[1];
      const filePath = path.join(__dirname, "uploads", fileName);

      if (!fs.existsSync(filePath)) {
        socket.write("FILE_NOT_FOUND");
        return;
      }

      const stats = fs.statSync(filePath);

      // Send the header, followed immediately by a custom delimiter sequence (e.g., \n---DATA---\n)
      // This allows the Express bridge to cleanly split data metadata from the binary stream.
      socket.write(`FILE_INFO:${fileName}:${stats.size}\n`);

      // Pipe file directly without requiring a fragile back-and-forth socket handshake
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(socket, { end: false });

      readStream.on("end", () => {
        // Gracefully finish connection when transfer finishes
        socket.end();
      });
    }

    //DELETE FILE
    else if (command === "DELETE") {
      if (!socket.user) {
        socket.write("LOGIN_REQUIRED");

        return;
      }

      const fileName = parts[1];

      const file = await File.findOne({
        fileName,
      });

      if (!file) {
        socket.write("FILE_NOT_FOUND");

        return;
      }

      if (file.uploadedBy !== socket.user.username) {
        socket.write("UNAUTHORIZED");
        return;
      }

      const filePath = path.join(
        __dirname,

        "uploads",

        fileName,
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await File.deleteOne({
        fileName,
      });

      socket.write("DELETE_SUCCESS");
    }

    // GET USER FILES
    else if (command === "GET_USER_FILES") {
      if (!socket.user) {
        socket.write("LOGIN_REQUIRED");

        return;
      }

      const files = await File.find({
        uploadedBy: socket.user.username,
      });

      socket.write(JSON.stringify(files));
    }

    // GET FILES
    else if (command === "GET_FILES") {
      const files = await File.find();
      socket.write(JSON.stringify(files));
    }

    // UNKNOWN
    else {
      socket.write("UNKNOWN_COMMAND");
    }
  });

  socket.on("close", () => {
    clients.delete(clientId);
    uploadStates.delete(clientId); // Clean up stale uploads
    console.log(`Client ${clientId} Disconnected`);
  });

  socket.on("error", (err) => {
    console.log(`Client ${clientId} Error:`, err.message);
  });
});

server.listen(5000, "0.0.0.0", () => {
  console.log("TCP Server Running On Port 5000");
});
