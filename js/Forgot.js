// Forgot password logic (client-side)
const form = document.getElementById("forgotForm");
const emailInput = document.getElementById("email");
const submitBtn = document.getElementById("submitBtn");
const message = document.getElementById("message");

function setMessage(text, type) {
  message.textContent = text;
  message.className = "msg " + (type || "");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMessage("", "");

  const email = emailInput.value.trim();
  // basic client-side check
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    setMessage("Please enter your email", "error");
    emailInput.focus();
    return;
  }
  if (!re.test(email)) {
    setMessage("Please enter a valid email", "error");
    emailInput.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

  try {
    // adjust API endpoint to your backend
    const resp = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    // keep message generic to avoid account enumeration
    setMessage(
      "If an account exists for that email, reset instructions were sent.",
      "success"
    );
  } catch (err) {
    setMessage("Unable to send request. Please try again later.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Reset Link";
  }
});
