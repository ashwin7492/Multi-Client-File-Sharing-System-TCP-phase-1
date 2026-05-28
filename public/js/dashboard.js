const totalFiles = document.getElementById("totalFiles");

const storageUsed = document.getElementById("storageUsed");

const recentFiles = document.getElementById("recentFiles");

const currentUser = document.getElementById("currentUser");

async function loadDashboard() {
  const response = await fetch(`${baseUrl}/files`);

  const files = await response.json();

  // TOTAL FILES

  totalFiles.innerText = files.length;

  // STORAGE

  let totalSize = 0;

  files.forEach((file) => {
    totalSize += file.fileSize;
  });

  if (totalSize <= 1000000) {
    storageUsed.innerText = (totalSize / 1024).toFixed(2) + " KB";
  } else {
    storageUsed.innerText = (totalSize / 1024 / 1024).toFixed(2) + " MB";
  }

  // CURRENT USER

  const username = localStorage.getItem("username");
  currentUser.innerText = username;

  // RECENT FILES

  recentFiles.innerHTML = "";

  files.slice(-4).forEach((file) => {
    let icon = "images/icons/default.png";

    if (file.fileType === ".pdf") {
      icon = "images/icons/pdf.png";
    } else if (file.fileType === ".txt") {
      icon = "images/icons/txt.png";
    } else if (
      file.fileType === ".jpg" ||
      file.fileType === ".jpeg" ||
      file.fileType === ".png" ||
      file.fileType === ".JPG"
    ) {
      icon = "images/icons/image.png";
    } else if (file.fileType === ".zip") {
      icon = "images/icons/zip.png";
    } else if (file.fileType === ".mp4") {
      icon = "images/icons/video.png";
    } else if (file.fileType === ".pptx") {
      icon = "images/icons/ppt.png";
    } else if (file.fileType === ".docx") {
      icon = "images/icons/doc.png";
    } else if (file.fileType === ".mp3") {
      icon = "images/icons/music.png";
    }

    let previewButton = "";

    if (
      file.fileType === ".png" ||
      file.fileType === ".jpg" ||
      file.fileType === ".jpeg" ||
      file.fileType === ".JPG" ||
      file.fileType === ".pdf" ||
      file.fileType === ".mp4"
    ) {
      previewButton = `

    <a

      href="${baseUrl}/view/${file.fileName}"

      target="_blank"

      class="btn btn-primary w-100 mb-2"

    >

      Preview

    </a>

  `;
    }

    const card = `

      <div class="col-lg-3 col-md-6">

        <div class="card bg-dark text-white border-0 shadow-lg h-100">

          <img
            src="${icon}"
            class="card-img-top p-4"
            alt="file"
          >

          <div class="card-body">

            <h5 class="card-title fw-bold">

              ${file.fileName}

            </h5>

            <p class="card-text text-secondary">

              Size:
              ${file.fileSize}
              bytes

              <br>

              Type:
              ${file.fileType}

            </p>

            ${previewButton}

            <button
              class="btn btn-light w-100"
            >

              Download

            </button>

          </div>

        </div>

      </div>

    `;

    recentFiles.innerHTML += card;
  });
}

loadDashboard();
