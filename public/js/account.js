const myUploads = document.getElementById("myUploads");
const uploadsCount = document.getElementById("uploadsCount");
const currentUser = document.getElementById("currentUser");
const storageUsed = document.getElementById("storageUsed");

async function loadMyFiles() {
  const username = localStorage.getItem("username");

  const response = await fetch(`${baseUrl}/myfiles/${username}`);

  const files = await response.json();
  uploadsCount.innerText = files.length;

  let totalSize = 0;

  files.forEach((file) => {
    totalSize += file.fileSize;
  });

  if (totalSize <= 1000000) {
    storageUsed.innerText = (totalSize / 1024).toFixed(2) + " KB";
  } else {
    storageUsed.innerText = (totalSize / 1024 / 1024).toFixed(2) + " MB";
  }

  currentUser.innerText = username;

  myUploads.innerHTML = "";

  files.forEach((file) => {
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
          >

          <div class="card-body">

            <h5 class="card-title fw-bold">

              ${file.fileName}

            </h5>

            <p class="text-secondary">

              ${file.fileType}

              <br>

              ${file.fileSize}
              bytes

              <br>
              
              uploaded on: ${new Date(file.uploadDate).toLocaleString()}
              
            </p>

            ${previewButton}

            <a

              href="${baseUrl}/download/${file.fileName}"

              class="btn btn-light w-100"

            >

              Download

            </a>

            <button

              class="btn btn-danger w-100 mt-2"

              onclick="deleteFile(
                '${file.fileName}'
              )"

            >

              Delete

            </button>

          </div>

        </div>

      </div>

    `;

    myUploads.innerHTML += card;
  });
}

async function deleteFile(fileName) {
  const username = localStorage.getItem("username");
  const confirmDelete = confirm(`Delete ${fileName}?`);

  if (!confirmDelete) {
    return;
  }

  const response = await fetch(
    `${baseUrl}/delete/${fileName}/${username}`,

    {
      method: "DELETE",
    },
  );

  const result = await response.text();

  alert(result);

  loadMyFiles();
}

loadMyFiles();
