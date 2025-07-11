// firebase.js
import { initializeApp } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";


const firebaseConfig = {
     apiKey: "AIzaSyAbhLEdqnSLNbtzPXAiMT1mNkk5jx8rjrU",
    authDomain: "tasktrackerapp-e31cf.firebaseapp.com",
    projectId: "tasktrackerapp-e31cf",
    storageBucket: "tasktrackerapp-e31cf.firebasestorage.app",
    messagingSenderId: "849200903085",
    appId: "1:849200903085:web:b534b39334b7e5d1dc6724",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

// ✅ App Check
// initializeAppCheck(app, {
//   provider: new ReCaptchaV3Provider('reCAPTCHA-Enterprise-v3'),
//   isTokenAutoRefreshEnabled: true
// });
