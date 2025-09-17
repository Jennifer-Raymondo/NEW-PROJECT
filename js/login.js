// document.getElementById("loginForm").addEventListener("submit", function(e) {
//     e.preventDefault(); // stop page from refreshing

//     const username = document.getElementById("username").value.trim();
//     const password = document.getElementById("password").value.trim();
//     const role = document.getElementById("role").value;

//     // 🚀 For now: just redirect based on role (skip username/password check)
//     if (role === "manager") {
//         window.location.href = "manager-dashboard.html";
//     } else if (role === "attendant") {
//         window.location.href = "attendant-dashboard.html";
//     } else if (role === "customer") {
//         window.location.href = "customer-dashboard.html";
//     } else {
//         alert("Please select a role before logging in.");
//     }
// });








document.getElementById("loginBtn").addEventListener("click", function () {
  const role = document.getElementById("role").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!role || !username || !password) {
    alert("Please fill all fields and select your role.");
    return;
  }

  // Redirect based on role
  if (role === "manager") {
    window.location.href = "dashboard.html"; // if your manager file is named dashboard.html
  } else if (role === "attendant") {
    window.location.href = "attendent-dashboard.html"; // change to your real file name
  } else if (role === "customer") {
    window.location.href = "customer.html"; // change to your real file name
  }
});


document.getElementById("loginBtn").addEventListener("click", login);





