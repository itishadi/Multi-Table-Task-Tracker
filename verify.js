import { auth, db } from './firebase.js';
import { doc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Initiera EmailJS
emailjs.init("aUPmcHFyvhrqNczD9"); // Replace with your actual public key

// Vänta tills användaren är inloggad
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Ingen användare är inloggad.");
    window.location.href = "register.html";
  }
});

window.verifyCode = async () => {
  const codeInput = document.getElementById('verifyCode').value.trim();
  const user = auth.currentUser;
  const feedback = document.getElementById('feedback');
  const spinner = document.getElementById('verifySpinner');

  feedback.textContent = "";
  spinner.style.display = "block";

  if (!user) {
    spinner.style.display = "none";
    feedback.textContent = "Ingen användare är inloggad.";
    return;
  }

  try {
    const docRef = doc(db, "verifications", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const codeCreatedAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      const now = new Date();
      const minutesPassed = (now - codeCreatedAt) / 60000;

      if (minutesPassed > 10) {
        feedback.textContent = "⏰ Koden har gått ut. Klicka på länken för att få en ny.";
        return;
      }

      if (data.attempts >= 5) {
        feedback.textContent = "🚫 För många felaktiga försök. Begär en ny kod.";
        return;
      }

      if (data.code === codeInput) {
        await updateDoc(docRef, { verified: true });
        feedback.textContent = "✅ Verifiering lyckades! Du omdirigeras...";
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
      } else {
        await updateDoc(docRef, { attempts: increment(1) });
        feedback.textContent = `❌ Fel kod. Försök igen. (${data.attempts + 1}/5)`;
      }
    } else {
      feedback.textContent = "⚠️ Verifieringsdata saknas. Kontakta support.";
    }
  } catch (error) {
    feedback.textContent = "🚫 Ett fel uppstod: " + error.message;
  } finally {
    spinner.style.display = "none";
  }
};

window.resendCode = async () => {
  const user = auth.currentUser;
  const resendLink = document.getElementById("resendLink");
  const resendText = document.getElementById("resendText");
  const spinner = document.getElementById("verifySpinner");

  if (!user) {
    alert("Ingen användare är inloggad.");
    return;
  }

  spinner.style.display = "block";
  resendLink.style.pointerEvents = "none";
  resendLink.style.color = "gray";

  let seconds = 30;
  resendText.innerHTML = `⏳ Vänta ${seconds} sekunder innan du kan skicka igen...`;

  const countdown = setInterval(() => {
    seconds--;
    resendText.innerHTML = `⏳ Vänta ${seconds} sekunder innan du kan skicka igen...`;
    if (seconds <= 0) {
      clearInterval(countdown);
      resendText.innerHTML = `Fick du inget mejl? <a href="#" id="resendLink" onclick="resendCode()">Skicka koden igen</a>`;
    }
  }, 1000);

  try {
    const docRef = doc(db, "verifications", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const code = data.code;

      await emailjs.send("service_ttvl2kk", "template_sg7luon", {
        to_email: user.email,
        code: code
      });

      alert("Verifieringskoden har skickats igen.");
    } else {
      alert("Verifieringsdata saknas.");
    }
  } catch (error) {
    alert("Fel vid utskick: " + error.message);
  } finally {
    spinner.style.display = "none";
  }
};
