```javascript
import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    onValue
} from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";


// ======================================
// Firebase Configuration
// ======================================

const firebaseConfig = {
    apiKey: "ضع نفس API KEY القديمة هنا",

    authDomain: "ضع نفس AUTH DOMAIN القديمة هنا",

    databaseURL: "ضع نفس DATABASE URL القديمة هنا",

    projectId: "ضع نفس PROJECT ID القديمة هنا",

    storageBucket: "ضع نفس STORAGE BUCKET القديمة هنا",

    messagingSenderId: "ضع نفس MESSAGING SENDER ID القديمة هنا",

    appId: "ضع نفس APP ID القديمة هنا"
};


// ======================================
// Firebase
// ======================================

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

const ledRef = ref(db, "led");


// ======================================
// عناصر الصفحة
// ======================================

const yearsInput = document.getElementById("years");
const monthsInput = document.getElementById("months");
const daysInput = document.getElementById("days");
const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");

const confirmBtn = document.getElementById("confirmBtn");
const resetBtn = document.getElementById("resetBtn");
const cancelBtn = document.getElementById("cancelBtn");

const ledStatus = document.getElementById("ledStatus");
const remaining = document.getElementById("remaining");


// ======================================
// متغير العداد
// ======================================

let countdownInterval = null;


// ======================================
// تحويل الإدخال إلى رقم
// ======================================

function getNumber(input) {

    const value = Number(input.value);

    if (!Number.isFinite(value) || value < 0) {
        return 0;
    }

    return Math.floor(value);
}


// ======================================
// إيقاف العداد
// ======================================

function stopCountdown() {

    if (countdownInterval !== null) {

        clearInterval(countdownInterval);

        countdownInterval = null;
    }
}


// ======================================
// زر التأكيد
// ======================================

confirmBtn.addEventListener("click", async () => {

    const years = getNumber(yearsInput);
    const months = getNumber(monthsInput);
    const days = getNumber(daysInput);
    const hours = getNumber(hoursInput);
    const minutes = getNumber(minutesInput);


    // السنة = 365 يوم
    // الشهر = 30 يوم

    const totalMinutes =
        (years * 365 * 24 * 60) +
        (months * 30 * 24 * 60) +
        (days * 24 * 60) +
        (hours * 60) +
        minutes;


    console.log("المدة بالدقائق:", totalMinutes);


    if (totalMinutes <= 0) {

        alert("يجب إدخال مدة أكبر من صفر");

        return;
    }


    const startTime = Date.now();

    const endTime =
        startTime + (totalMinutes * 60 * 1000);


    try {

        console.log("إرسال البيانات إلى Firebase...");

        await set(ledRef, {

            active: true,

            startTime: startTime,

            endTime: endTime,

            commandId: Date.now()

        });


        console.log("تم إرسال البيانات بنجاح");


    } catch (error) {

        console.error("Firebase Error:", error);

        alert(
            "حدث خطأ أثناء الاتصال بقاعدة البيانات:\n\n" +
            error.code +
            "\n\n" +
            error.message
        );
    }

});


// ======================================
// زر التصحيح
// ======================================

resetBtn.addEventListener("click", () => {

    yearsInput.value = 0;
    monthsInput.value = 0;
    daysInput.value = 0;
    hoursInput.value = 0;
    minutesInput.value = 0;

});


// ======================================
// زر الإلغاء
// ======================================

cancelBtn.addEventListener("click", async () => {

    try {

        await set(ledRef, {

            active: false,

            startTime: 0,

            endTime: 0,

            commandId: Date.now()

        });

        console.log("تم إلغاء المؤقت");

    } catch (error) {

        console.error("Firebase Error:", error);

        alert(
            "فشل إلغاء المؤقت:\n\n" +
            error.code +
            "\n\n" +
            error.message
        );
    }

});


// ======================================
// مراقبة Firebase
// ======================================

onValue(ledRef, (snapshot) => {

    const data = snapshot.val();

    console.log("Firebase data:", data);


    // ----------------------------------
    // لا يوجد مؤقت
    // ----------------------------------

    if (!data || data.active !== true) {

        ledStatus.textContent = "متوقف";

        remaining.textContent = "لا يوجد مؤقت";

        stopCountdown();

        return;
    }


    // ----------------------------------
    // المؤقت يعمل
    // ----------------------------------

    ledStatus.textContent = "يعمل";

    updateRemaining(data.endTime);

});


// ======================================
// عرض الوقت المتبقي
// ======================================

function updateRemaining(endTime) {

    // إيقاف أي عداد قديم

    stopCountdown();


    function update() {

        const remainingMs =
            endTime - Date.now();


        // ----------------------------------
        // انتهى الوقت
        // ----------------------------------

        if (remainingMs <= 0) {

            remaining.textContent = "انتهى المؤقت";

            stopCountdown();

            return;
        }


        const totalSeconds =
            Math.floor(remainingMs / 1000);


        const days =
            Math.floor(totalSeconds / 86400);


        const hours =
            Math.floor(
                (totalSeconds % 86400) / 3600
            );


        const minutes =
            Math.floor(
                (totalSeconds % 3600) / 60
            );


        const seconds =
            totalSeconds % 60;


        remaining.textContent =
            `${days} يوم - ` +
            `${hours} ساعة - ` +
            `${minutes} دقيقة - ` +
            `${seconds} ثانية`;
    }


    // تحديث مباشر

    update();


    // تحديث كل ثانية

    countdownInterval =
        setInterval(update, 1000);
}
```
