const fileInput = document.getElementById("fileInput");

const fileDetails = document.getElementById("fileDetails");

const uploadBtn = document.getElementById("uploadBtn");

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];

  if (file) {
    fileDetails.innerHTML = `

        <div class="mt-3">

          <h5>

            ${file.name}

          </h5>

          <p class="text-secondary">

            Size:
            ${(file.size / 1024).toFixed(2)}
            KB

          </p>

        </div>

      `;
  }
});

uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];

  if (!file) {
    alert("Select A File");

    return;
  }

  const formData = new FormData();

  formData.append("file", file);

  const username = localStorage.getItem("username");

  formData.append("username", username);

  const response = await fetch(
    `${baseUrl}/upload`,

    {
      method: "POST",

      body: formData,
    },
  );

  const result = await response.text();

  alert(result);
});
