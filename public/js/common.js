const SERVER_IP = your IP_address;
// const SERVER_IP = "localhost";
const baseUrl = `http://${SERVER_IP}:3000`;

fetch("components/navbar.html")
  .then((res) => res.text())
  .then((data) => {
    document.getElementById("navbar").innerHTML = data;

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("username");

        window.location.href = "login.html";
      });
    }
  });

fetch("components/footer.html")
  .then((res) => res.text())
  .then((data) => {
    document.getElementById("footer").innerHTML = data;
  });

const protectedPages = [
  "dashboard.html",

  "upload.html",

  "files.html",

  "account.html",
];

const currentPage = window.location.pathname.split("/").pop();

const username = localStorage.getItem("username");

if (protectedPages.includes(currentPage) && !username) {
  window.location.href = "login.html";
}
