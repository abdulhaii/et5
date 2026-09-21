import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getDatabase, ref, set, onValue,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import {
  getAuth, signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// ============================================================
// عدّل القيم التالية بمعلومات مشروعك في Firebase
// (Project settings > General > Your apps > SDK setup)
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyBLbonz2yP9fI0RyeWeGbawlVj69yOmmDE",
  authDomain: "aaaaaa-8e6bb.firebaseapp.com",
  databaseURL: "aaaaaa-8e6bb-default-rtdb.firebaseio.com",
  projectId: "aaaaaa-8e6bb",
  storageBucket: "aaaaaa-8e6bb.firebasestorage.app",
  messagingSenderId: "196879657565",
  appId: "1:196879657565:web:4441a61531286180a17bb4",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const timerRef = ref(db, "led_timer");

const dot = document.getElementById("dot");
const statusLine = document.getElementById("statusLine");

const fields = ["years", "months", "days", "hours", "minutes"].reduce(
  (acc, id) => ({ ...acc, [id]: document.getElementById(id) }),
  {}
);

// السماح بالأرقام فقط داخل كل صندوق
Object.values(fields).forEach((input) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^0-9]/g, "");
  });
});

signInAnonymously(auth).catch(() => {
  dot.className = "dot error";
  statusLine.textContent = "تعذّر الاتصال بقاعدة البيانات — تحقق من إعدادات Firebase";
});

// تحويل القيم إلى إجمالي عدد الثواني (تقريب: سنة = 365 يوم، شهر = 30 يوم)
function totalSeconds() {
  const y = Number(fields.years.value) || 0;
  const mo = Number(fields.months.value) || 0;
  const d = Number(fields.days.value) || 0;
  const h = Number(fields.hours.value) || 0;
  const mi = Number(fields.minutes.value) || 0;

  const totalDays = y * 365 + mo * 30 + d;
  const totalHours = totalDays * 24 + h;
  const totalMinutes = totalHours * 60 + mi;
  return totalMinutes * 60;
}

document.getElementById("confirmBtn").addEventListener("click", () => {
  const seconds = totalSeconds();
  if (seconds <= 0) {
    statusLine.textContent = "أدخل مدّة أكبر من صفر أولاً";
    return;
  }
  set(timerRef, {
    command: "start",
    duration_seconds: seconds,
    requested_at: Date.now(),
  });
});

document.getElementById("resetBtn").addEventListener("click", () => {
  Object.values(fields).forEach((input) => { input.value = "0"; });
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  set(timerRef, {
    command: "stop",
    requested_at: Date.now(),
  });
});

// عرض حالة المصباح لحظياً كما يبلّغ عنها ESP32
let tickHandle = null;

onValue(timerRef, (snapshot) => {
  const data = snapshot.val();
  if (tickHandle) { clearInterval(tickHandle); tickHandle = null; }

  if (!data) {
    dot.className = "dot";
    statusLine.textContent = "بانتظار أول أمر";
    return;
  }

  if (data.status === "running") {
    dot.className = "dot on";
    const endsAtMs = (data.started_at_epoch || 0) * 1000 + (data.duration_seconds || 0) * 1000;

    const render = () => {
      const remaining = Math.max(0, Math.round((endsAtMs - Date.now()) / 1000));
      statusLine.textContent = `المصباح مضاء — يتبقى ${formatDuration(remaining)}`;
      if (remaining <= 0 && tickHandle) { clearInterval(tickHandle); tickHandle = null; }
    };
    render();
    tickHandle = setInterval(render, 1000);
  } else if (data.status === "stopped") {
    dot.className = "dot";
    statusLine.textContent = "المصباح مطفأ";
  } else {
    dot.className = "dot";
    statusLine.textContent = "بانتظار أمر جديد";
  }
});

function formatDuration(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (h) parts.push(`${h}س`);
  if (m || h) parts.push(`${m}د`);
  parts.push(`${sec}ث`);
  return parts.join(" ");
}
