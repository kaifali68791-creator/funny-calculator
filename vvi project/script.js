/* ===== Funny Calculator — script.js ===== */

(function () {
  "use strict";

  // ---------- DOM ----------
  const expressionEl = document.getElementById("expression");
  const resultEl = document.getElementById("result");
  const funnyEl = document.getElementById("funny");
  const buttonsEl = document.querySelector(".buttons");

  // ---------- State ----------
  let current = "0";       // number being typed
  let previous = null;     // first operand (string)
  let operator = null;     // "+", "−", "×", "÷"
  let justCalculated = false;

  const MAX_DIGITS = 14;

  // ---------- Helpers ----------
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function formatNumber(n) {
    // Round off floating-point noise, keep display clean
    const rounded = Math.round(n * 1e10) / 1e10;
    if (Math.abs(rounded) >= 1e15) return rounded.toExponential(4);
    return String(rounded);
  }

  function showError(message) {
    resultEl.textContent = message;
    funnyEl.textContent = "\u00A0";
    current = "0";
    previous = null;
    operator = null;
    justCalculated = false;
  }

  // ---------- Funny response system ----------
  // Joke pools: short, desi, friendly roasting. Numeric answer is always shown separately.

  const REPEAT_JOKES = [
    "Bhai answer toh wahi rahega, kitni baar poochoge? 😂",
    "Ek hi sawaal ko baar-baar pooch ke answer nahi badlega 💀",
    "Trust issues hain kya? Answer check karte raho 😂",
    "Bhai '=' pe '=' dabaye ja raha hai, answer wahi hai 😭",
    "Answer ne bhi bol diya—bas, ab aur nahi 🗿"
  ];

  const DIV_ZERO_JOKES = [
    "Bhai ZERO se divide? Maths ne mana kar diya 💀",
    "Nice try 😂 Lekin zero se divide nahi hota.",
    "Calculator: Main ye nahi karunga. 😭",
    "Bhai rules sabke liye same hain—zero se divide nahi."
  ];

  const ZERO_BY_ZERO_JOKES = [
    "Bhai ye calculation mujhse bhi nahi ho rahi 💀",
    "0 ÷ 0? Bhai maths ki poori kitaab confuse ho gayi 📚",
    "Nice try 😂 Par zero ko zero se divide nahi karte.",
    "Calculator: Main ye nahi karunga. 😭"
  ];

  function withAnswer(answer, pool) {
    return "Answer: " + answer + " " + pickRandom(pool);
  }

  function showFunnyLine(text) {
    funnyEl.textContent = text;
    funnyEl.classList.remove("pop");
    void funnyEl.offsetWidth; // restart pop animation
    funnyEl.classList.add("pop");
  }

  function getFunnyReaction(answer, a, b, op) {
    const absB = Math.abs(b);
    const bothSmall = Number.isInteger(a) && Number.isInteger(b) &&
                      Math.abs(a) <= 10 && Math.abs(b) <= 10;

    // --- Classic specials (still randomized so they don't always repeat) ---
    if (a === 1 && b === 1 && op === "+") return withAnswer(answer, [
      "😭 Bhai calculator kholne ki zarurat thi?",
      "😂 Ye toh dimaag se bhi ho jaata, phir bhi mehnat ki.",
      "💀 Bhai 1 + 1 pooch raha hai, serious hai kya?",
      "😎 Chal theek hai, practice kar le."
    ]);

    if (a === 2 && b === 2 && op === "+") return withAnswer(answer, [
      "💀 Itna easy? Calculator ko bhi warm-up mil gaya.",
      "😂 Bhai tables yaad nahi hain kya?",
      "🗿 Itna aasan? Bhai ye toh koi bhi kar dega.",
      "😭 Ye toh primary school ka sawaal tha."
    ]);

    if (op === "−" && answer === 1 && absB >= 90) return withAnswer(answer, [
      "🗿 Einstein ka chhota bhai.",
      "🧠 Itni calculation, aur result sirf 1!",
      "😂 Bada number, chhota answer. Fair deal."
    ]);

    // --- Zero result ---
    if (answer === 0) return withAnswer(answer, [
      "💀 Bhai mehnat ka result bhi zero?",
      "😂 Itna calculate karke ZERO!",
      "🗿 Absolute cinema.",
      "😭 Sab kuch cancel ho gaya bhai."
    ]);

    // --- Negative result ---
    if (answer < 0) return withAnswer(answer, [
      "📉 Bhai result bhi tumhari expectations ki tarah negative nikla.",
      "😭 Maths ne seedha reality check de diya.",
      "💀 Minus mein chale gaye bhai.",
      "🥶 Negative? Kharche zyada ho gaye kya?"
    ]);

    // --- Large / complex numbers ---
    if (Math.abs(answer) >= 100000) return withAnswer(answer, [
      "🧠 Oho! Aaj calculator ko kaam mila.",
      "🔥 Bhai ab lag raha hai tum serious ho.",
      "💀 Itna bada number dekh ke meri bhi salary yaad aa gayi.",
      "🗿 Ye calculation dekh ke calculator khush ho gaya.",
      "🤑 Itna dhan? Mujhe bhi batao kamaise ho!"
    ]);

    // --- Decimal answer (check before ÷ and × so fractional results get decimal jokes) ---
    if (!Number.isInteger(answer)) return withAnswer(answer, [
      "😂 Bhai answer bhi confused hai—decimal mein aa gaya.",
      "🧠 Ab maths thodi serious ho gayi.",
      "🤔 Decimal? Ab hisaab barabar karna padega."
    ]);

    // --- Division ---
    if (op === "÷") return withAnswer(answer, [
      "😎 Clean calculation. Aaj dimaag online hai.",
      "😂 Bhai zero dekh ke darrna mat.",
      "➗ Division nikla mast, koi galti nahi.",
      "🧠 Divide bhi karta hai, respect!",
      "📐 Accurate hai, pakka!"
    ]);

    // --- Multiplication ---
    if (op === "×") return withAnswer(answer, [
      "😂 Bhai tables yaad nahi hain kya?",
      "🔥 Finally kuch toh bada kiya.",
      "😏 Calculator ke bina confidence nahi aata?",
      "🎓 Tables yaad kar le, kaam aayengi.",
      "💪 Multiply karke kya macha rahe ho!"
    ]);

    // --- Very simple / obvious → stronger (but friendly) roasting ---
    if (bothSmall && Math.abs(answer) <= 10) return withAnswer(answer, [
      "💀 Bhai ye calculation Google pe bhi search kar sakte the.",
      "😂 Calculator ko bhi lag raha hai tum uska time waste kar rahe ho.",
      "😭 Itna easy sawaal? Mujhe laga kuch challenge milega.",
      "😂 Bhai primary school ki yaadein taza ho gayi.",
      "😭 Ye toh dimaag se bhi ho jaata.",
      "😎 Maths ne aaj tumhe maaf kar diya.",
      "😂 Bhai itne ke liye mujhe kyun bulaya?"
    ]);

    // --- Simple (small numbers, bigger answer) ---
    if (bothSmall || (Number.isInteger(answer) && Math.abs(answer) <= 99)) {
      return withAnswer(answer, [
        "😌 Chal theek hai, kaam ho gaya.",
        "😎 Easy tha na? Par phir bhi calculator hi poocha.",
        "🙂 Thoda tough karo, maza nahi aa raha.",
        "👌 Chhota sawaal, bada confidence!"
      ]);
    }

    // --- Default: mixed / bigger answers ---
    return withAnswer(answer, [
      "🤯 Kya baat hai, sher!",
      "💪 Full josh me calculation!",
      "🎓 Ab toh tu scientist ban jaa!",
      "🔢 Daal me kuch kaala tha, par answer sahi!",
      "🧮 Calculator ko bacha liya aaj."
    ]);
  }

  // ---------- Calculation ----------
  function calculate() {
    if (previous === null || operator === null) {
      // Extra "=" presses → fresh roast, answer stays exactly the same
      if (justCalculated) showFunnyLine(pickRandom(REPEAT_JOKES));
      return;
    }

    const a = parseFloat(previous);
    const b = parseFloat(current);
    let answer;

    switch (operator) {
      case "+": answer = a + b; break;
      case "−": answer = a - b; break;
      case "×": answer = a * b; break;
      case "÷":
        if (b === 0) {
          if (a === 0) {
            expressionEl.textContent = "0 ÷ 0";
            showError(pickRandom(ZERO_BY_ZERO_JOKES));
          } else {
            expressionEl.textContent = previous + " ÷ " + current;
            showError(pickRandom(DIV_ZERO_JOKES));
          }
          return;
        }
        answer = a / b;
        break;
      default: return;
    }

    if (!Number.isFinite(answer)) {
      showError("Ye answer samajh nahi aaya, dobara try karo 🤔");
      return;
    }

    expressionEl.textContent = previous + " " + operator + " " + current;
    resultEl.textContent = formatNumber(answer);
    showFunnyLine(getFunnyReaction(answer, a, b, operator));

    current = formatNumber(answer);
    previous = null;
    operator = null;
    justCalculated = true;
  }

  // ---------- Display ----------
  function updateDisplay() {
    expressionEl.textContent = (previous !== null && operator !== null)
      ? previous + " " + operator
      : "\u00A0";
    resultEl.textContent = current;
  }

  // ---------- Actions ----------
  function inputNumber(digit) {
    if (justCalculated) {
      current = "0";
      previous = null;
      operator = null;
      justCalculated = false;
      funnyEl.textContent = "\u00A0";
    }
    if (digit === ".") {
      if (!current.includes(".")) current += ".";
    } else {
      if (current.replace("-", "").replace(".", "").length >= MAX_DIGITS) return;
      current = (current === "0") ? digit : current + digit;
    }
    updateDisplay();
  }

  function inputOperator(op) {
    if (operator !== null && previous !== null && !justCalculated) {
      // Chain: 2 + 3 + ... → compute 2 + 3 first
      const a = parseFloat(previous);
      const b = parseFloat(current);
      let mid;
      if (operator === "+") mid = a + b;
      else if (operator === "−") mid = a - b;
      else if (operator === "×") mid = a * b;
      else if (operator === "÷") {
        if (b === 0) { showError(pickRandom(DIV_ZERO_JOKES)); return; }
        mid = a / b;
      }
      if (!Number.isFinite(mid)) { showError("Ye calculation ho hi nahi rahi 🤔"); return; }
      previous = formatNumber(mid);
    } else if (previous === null) {
      previous = current;
    }
    operator = op;
    current = "0";
    justCalculated = false;
    funnyEl.textContent = "\u00A0";
    updateDisplay();
  }

  function applyPercent() {
    const val = parseFloat(current);
    if (!Number.isFinite(val)) return;
    current = formatNumber(val / 100);
    updateDisplay();
  }

  function backspace() {
    if (justCalculated) justCalculated = false;
    current = current.length > 1 ? current.slice(0, -1) : "0";
    if (current === "-") current = "0";
    updateDisplay();
  }

  function clearAll() {
    current = "0";
    previous = null;
    operator = null;
    justCalculated = false;
    funnyEl.textContent = "\u00A0";
    updateDisplay();
  }

  // ---------- Button clicks ----------
  buttonsEl.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    if (btn.dataset.num !== undefined) {
      inputNumber(btn.dataset.num);
    } else if (btn.dataset.op !== undefined) {
      inputOperator(btn.dataset.op);
    } else if (btn.dataset.action === "equals") {
      calculate();
    } else if (btn.dataset.action === "clear") {
      clearAll();
    } else if (btn.dataset.action === "backspace") {
      backspace();
    } else if (btn.dataset.action === "percent") {
      applyPercent();
    }
  });

  // ---------- Keyboard support ----------
  document.addEventListener("keydown", function (e) {
    const key = e.key;

    if ((key >= "0" && key <= "9") || key === ".") {
      inputNumber(key);
    } else if (key === "+" || key === "-") {
      inputOperator(key === "-" ? "−" : "+");
    } else if (key === "*" || key.toLowerCase() === "x") {
      inputOperator("×");
    } else if (key === "/") {
      e.preventDefault(); // stop browser quick-find
      inputOperator("÷");
    } else if (key === "%") {
      applyPercent();
    } else if (key === "Enter" || key === "=") {
      e.preventDefault();
      calculate();
    } else if (key === "Backspace") {
      backspace();
    } else if (key === "Escape" || key.toLowerCase() === "c") {
      clearAll();
    }
  });

  // ---------- Init ----------
  updateDisplay();
})();
