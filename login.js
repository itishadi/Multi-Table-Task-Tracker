// import { auth, db } from './firebase.js';
// import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// window.login = async () => {
//   const email = document.getElementById('loginEmail').value;
//   const password = document.getElementById('loginPassword').value;
//   const button = document.querySelector("button");
//   button.disabled = true;

//   try {
//     const userCredential = await signInWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;

//     const docRef = doc(db, "verifications", user.uid);
//     const docSnap = await getDoc(docRef);

//     if (docSnap.exists()) {
//       const data = docSnap.data();
//       if (!data.verified) {
//         alert("Du måste verifiera ditt konto innan du kan logga in.");
//         button.disabled = false;
//         return;
//       }
//     } else {
//       alert("Verifieringsdata saknas. Kontakta support.");
//       button.disabled = false;
//       return;
//     }

//     // Inloggning tillåten
//     window.location.href = "index.html";
//   } catch (error) {
//     alert("Fel: " + error.message);
//     button.disabled = false;
//   }
// };

import { auth, db } from './firebase.js';
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.login = async () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const button = document.querySelector("button");
  button.disabled = true;

  try {
    await setPersistence(auth, browserSessionPersistence); // 🔐 Viktigt!

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const docRef = doc(db, "verifications", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (!data.verified) {
        alert("Du måste verifiera ditt konto innan du kan logga in.");
        button.disabled = false;
        return;
      }
    } else {
      alert("Verifieringsdata saknas. Kontakta support.");
      button.disabled = false;
      return;
    }

    window.location.href = "index.html";
  } catch (error) {
    alert("Fel: " + error.message);
    button.disabled = false;
  }
};
