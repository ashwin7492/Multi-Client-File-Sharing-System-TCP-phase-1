console.log("login js loaded");

const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async () => {
  console.log("clicked");
  const username = document.getElementById("username").value;

  const password = document.getElementById("password").value;

  const response = await fetch(
    `${baseUrl}/login`,

    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username,

        password,
      }),
    },
  );

  const result = await response.json();

  if (result.success) {
    alert("Login Successful");

    localStorage.setItem(
      "username",

      result.username,
    );

    localStorage.setItem("password", password);

    window.location.href = "dashboard.html";
  } else {
    alert(result.message);
  }
});
