import { auth } from "./firebase/firebase-config.js";
import {
  updatePassword, reauthenticateWithCredential,
  EmailAuthProvider, deleteUser
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

window.openScreen = (id) => {
  document.getElementById("settings-main").style.display = "none";
  document.getElementById(id).style.display = "block";
};

window.goBack = () => {
  document.querySelectorAll(".sub-screen").forEach(s => s.style.display = "none");
  document.getElementById("settings-main").style.display = "block";
};

window.changePassword = async () => {
  const user = auth.currentUser;
  if (!user) return window.location.href = "auth.html";

  const cur = document.getElementById("currentPass").value;
  const np = document.getElementById("newPass").value;
  const cp = document.getElementById("confirmPass").value;

  if (np !== cp) return alert("Passwords do not match");

  const cred = EmailAuthProvider.credential(user.email, cur);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, np);

  alert("Password changed");
  goBack();
};

window.deleteAccount = async () => {
  const user = auth.currentUser;
  if (!user) return window.location.href = "auth.html";

  const pass = document.getElementById("deletePass").value;
  if (!pass) return alert("Enter password");

  const cred = EmailAuthProvider.credential(user.email, pass);
  await reauthenticateWithCredential(user, cred);
  await deleteUser(user);

  alert("Account deleted");
  window.location.href = "auth.html";
};
