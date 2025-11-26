import { auth } from "./firebase/firebase-config.js";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

window.openScreen = function (id) {
    document.getElementById("settings-main").style.display = "none";
    document.getElementById(id).style.display = "block";
};

window.goBack = function () {
    document.querySelectorAll(".sub-screen").forEach(s => s.style.display = "none");
    document.getElementById("settings-main").style.display = "block";
};

window.changePassword = async function () {
    const user = auth.currentUser;

    let current = document.getElementById("currentPass").value;
    let newPass = document.getElementById("newPass").value;
    let confirm = document.getElementById("confirmPass").value;

    if (newPass !== confirm) {
        alert("New passwords do not match!");
        return;
    }

    try {
        const credential = EmailAuthProvider.credential(user.email, current);
        await reauthenticateWithCredential(user, credential);

        await updatePassword(user, newPass);

        alert("Password updated successfully!");
        goBack();

    } catch (error) {
        alert("Error: " + error.message);
    }
};

window.deleteAccount = async function () {
    const user = auth.currentUser;

    let pass = document.getElementById("deletePass").value;

    try {
        const credential = EmailAuthProvider.credential(user.email, pass);
        await reauthenticateWithCredential(user, credential);

        await deleteUser(user);

        alert("Account deleted!");
        window.location.href = "auth.html";
    } catch (error) {
        alert("Error: " + error.message);
    }
};
