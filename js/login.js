document.getElementById("btnLogin").addEventListener("click", () => {
  const user = document.getElementById("user").value;
  const senha = document.getElementById("senha").value;

  if (user === "brecho" && senha === "look123") {
    localStorage.setItem("auth", "true");
    window.location.href = "admin.html";
  } else {
    document.getElementById("loginStatus").textContent = "Usuário ou senha incorretos!";
  }
});
