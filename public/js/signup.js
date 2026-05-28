console.log("signup page loaded");
const signupBtn = document.getElementById("signupBtn");

const output = document.getElementById("output");

signupBtn.addEventListener("click", async () => {
  console.log("clicked");
  const username = document.getElementById("username").value;

  const email = document.getElementById("email").value;

  const password = document.getElementById("password").value;

  if (!username || !email || !password) {
    output.innerHTML = `
        <p class="text-danger">
          Fill All Fields
        </p>
      `;

    return;
  }

  const response = await fetch(
    `${baseUrl}/signup`,

    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username,

        email,

        password,
      }),
    },
  );

  const result = await response.json();

  if (result.success) {
    alert(result.message);

    window.location.href = "login.html";
  } else {
    alert(result.message);
  }

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1000);
});
