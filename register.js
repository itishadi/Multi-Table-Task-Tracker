import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Initiera EmailJS
emailjs.init("aUPmcHFyvhrqNczD9"); // Replace with your actual public key

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendCodeEmail(email, code) {
  try {
    await emailjs.send("service_ttvl2kk", "template_sg7luon", {
      to_email: email,
      code: code
    });
  } catch (error) {
    alert("Fel vid e-post: " + (error.text || error.message || error));
  }
}

window.register = async () => {
   
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;

  if (password !== confirm) {
    alert("Lösenorden matchar inte.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const code = generateCode();

    await setDoc(doc(db, "verifications", user.uid), {
      code: code,
      verified: false,
      createdAt: new Date(),
      attempts: 0
    });

    await sendCodeEmail(email, code);
    window.location.href = "verify.html";
  } catch (error) {
    alert("Fel: " + error.message);
  }
};
