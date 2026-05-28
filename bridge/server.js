const loggedInUsers = {};
const cors = require("cors");
const express = require("express");
const net = require("net");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: "temp/",
});

// GET ALL FILES
app.get("/files", (req, res) => {
  const client = net.createConnection({
    host: "localhost",
    port: 5000,
  });

  client.on("connect", () => {
    client.write("GET_FILES");
  });

  client.on("data", (data) => {
    const files = data.toString();
    res.send(files);
    client.end();
  });

  client.on("error", (err) => {
    console.log("TCP Error:", err.message);
    res.status(500).send("TCP Server Offline");
  });
});

// GET USER FILES
app.get("/myfiles/:username", (req, res) => {
  const username = req.params.username;

  const client = net.createConnection({
    host: "localhost",

    port: 5000,
  });

  client.on("connect", () => {
    client.write(`LOGIN:${username}:${loggedInUsers[username]}\n`);
  });

  client.on("data", (data) => {
    const message = data.toString();

    if (message.startsWith("LOGIN_SUCCESS")) {
      client.write("GET_USER_FILES\n");
    } else {
      res.send(message);

      client.end();
    }
  });

  client.on("error", (err) => {
    console.log(err.message);

    res.status(500).send("TCP Error");
  });
});

// DOWNLOAD ROUTE
app.get("/download/:fileName", (req, res) => {
  const fileName = req.params.fileName;

  const client = net.createConnection({
    host: "localhost",
    port: 5000,
  });

  let fileBuffer = Buffer.alloc(0);
  let headerReceived = false;

  client.on("connect", () => {
    client.write(`DOWNLOAD:${fileName}`);
  });

  client.on("data", (data) => {
    if (!headerReceived) {
      const separator = data.indexOf(10); // Find \n

      if (separator !== -1) {
        headerReceived = true;

        // Slice away the 'FILE_INFO:...' text header cleanly
        const binaryPart = data.slice(separator + 1);

        if (binaryPart.length > 0) {
          fileBuffer = Buffer.concat([fileBuffer, binaryPart]);
        }
      }
    } else {
      // Collect pure binary stream data directly
      fileBuffer = Buffer.concat([fileBuffer, data]);
    }
  });

  client.on("end", () => {
    // Dynamically look up extension to set the proper Content-Type
    const ext = path.extname(fileName).toLowerCase();
    let contentType = "application/octet-stream";

    if (ext === ".png") contentType = "image/png";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    if (ext === ".gif") contentType = "image/gif";
    if (ext === ".pdf") contentType = "application/pdf";
    if (ext === ".txt") contentType = "text/plain";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // Send raw completed buffer straight to client browser
    res.send(fileBuffer);
  });

  client.on("error", (err) => {
    console.log("Download Error:", err.message);
    if (!res.headersSent) {
      res.status(500).send("Download Failed");
    }
  });
});

// PREVIEW ROUTE
app.get("/view/:fileName", (req, res) => {
  const fileName = req.params.fileName;

  const client = net.createConnection({
    host: "localhost",

    port: 5000,
  });

  let fileBuffer = Buffer.alloc(0);

  let headerReceived = false;

  client.on("connect", () => {
    client.write(`DOWNLOAD:${fileName}`);
  });

  client.on("data", (data) => {
    if (!headerReceived) {
      const separator = data.indexOf(10);

      if (separator !== -1) {
        headerReceived = true;

        const binaryPart = data.slice(separator + 1);

        if (binaryPart.length > 0) {
          fileBuffer = Buffer.concat([fileBuffer, binaryPart]);
        }
      }
    } else {
      fileBuffer = Buffer.concat([fileBuffer, data]);
    }
  });

  client.on("end", () => {
    const ext = path.extname(fileName).toLowerCase();

    let contentType = "application/octet-stream";

    if (ext === ".png") contentType = "image/png";
    if (ext === ".jpg" || ext === ".jpeg" || ext === ".JPG")
      contentType = "image/jpeg";
    if (ext === ".gif") contentType = "image/gif";
    if (ext === ".pdf") contentType = "application/pdf";
    if (ext === ".mp4") contentType = "video/mp4";

    res.setHeader(
      "Content-Type",

      contentType,
    );
    res.send(fileBuffer);
  });

  client.on("error", (err) => {
    console.log(err.message);

    if (!res.headersSent) {
      res.status(500).send("Preview Failed");
    }
  });
});

// UPLOAD ROUTE
app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send("No File Uploaded");
  }

  const client = net.createConnection({
    host: "localhost",
    port: 5000,
  });

  const username = req.body.username;

  client.on("connect", () => {
    const stats = fs.statSync(file.path);
    client.write(`LOGIN:${username}:${loggedInUsers[username]}`);
  });

  client.on("data", (data) => {
    const message = data.toString();
    console.log("From TCP Server:", message);

    if (message.startsWith("LOGIN_SUCCESS")) {
      const stats = fs.statSync(file.path);
      // Added a trailing \n delimiter to make command parsing safe on server side
      client.write(`UPLOAD:${file.originalname}:${stats.size}\n`);
    }

    if (message === "READY_FOR_FILE") {
      const readStream = fs.createReadStream(file.path);

      // stream piping instead of custom data event listeners.
      // This automatically pushes raw binary chunks cleanly down the socket.
      readStream.pipe(client, { end: false });
    }

    if (message === "UPLOAD_SUCCESS") {
      res.send("Upload Complete");
      client.end();

      // Clean up the temp file stored by Multer on your Express server
      fs.unlinkSync(file.path);
    }
  });

  client.on("error", (err) => {
    console.log("Upload Error:", err.message);
    if (!res.headersSent) {
      res.status(500).send("TCP Upload Failed");
    }
  });
});

// LOGIN ROUTE
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const client = net.createConnection({
    host: "localhost",
    port: 5000,
  });

  client.on("connect", () => {
    client.write(`LOGIN:${username}:${password}`);
  });

  client.on("data", (data) => {
    const message = data.toString();
    console.log(message);

    if (message.startsWith("LOGIN_SUCCESS")) {
      loggedInUsers[username] = password;
      res.json({
        success: true,
        username,
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    client.end();
  });

  // SIGNUP ROUTE
  app.post("/signup", (req, res) => {
    const {
      username,

      email,

      password,
    } = req.body;

    const client = net.createConnection({
      host: "localhost",

      port: 5000,
    });

    client.on("connect", () => {
      client.write(`SIGNUP:${username}:${email}:${password}\n`);
    });

    client.on("data", (data) => {
      const message = data.toString();

      console.log(message);

      if (message === "SIGNUP_SUCCESS") {
        res.json({
          success: true,

          message: "Signup Successful",
        });
      } else if (message === "USER_ALREADY_EXISTS") {
        res.status(400).json({
          success: false,

          message: "User Already Exists",
        });
      } else {
        res.status(500).json({
          success: false,

          message: "Signup Failed",
        });
      }

      client.end();
    });

    client.on("error", (err) => {
      console.log(err.message);

      res.status(500).json({
        success: false,

        message: "TCP Server Error",
      });
    });
  });

  // DELETE ROUTE
  app.delete("/delete/:fileName/:username", (req, res) => {
    const fileName = req.params.fileName;

    const username = req.params.username;

    const client = net.createConnection({
      host: "localhost",

      port: 5000,
    });

    client.on("connect", () => {
      client.write(`LOGIN:${username}:${loggedInUsers[username]}\n`);
    });

    client.on("data", (data) => {
      const message = data.toString();

      if (message.startsWith("LOGIN_SUCCESS")) {
        client.write(`DELETE:${fileName}\n`);
      } else if (message === "DELETE_SUCCESS") {
        res.send("File Deleted");

        client.end();
      } else if (message === "UNAUTHORIZED") {
        res.status(403).send("Unauthorized");

        client.end();
      } else {
        res.status(404).send("File Not Found");

        client.end();
      }
    });

    client.on("error", (err) => {
      console.log(err.message);

      res.status(500).send("Delete Failed");
    });
  });

  client.on("error", (err) => {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: "TCP Server Error",
    });
  });
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Bridge Server Running On Port 3000");
});
