// Front-end chat logic.
//
// When the Flask backend is running, every question is sent to /ask and the
// real NLTK + TF-IDF engine answers it. If that request fails (for example
// when this page is opened on its own without the server), we fall back to a
// small in-browser matcher so the demo still works. The Python backend is the
// real implementation -- the JS fallback is just a convenience.

const messages = document.getElementById("messages");
const form = document.getElementById("chatForm");
const input = document.getElementById("userInput");
const suggestions = document.getElementById("suggestions");

// ---------------------------------------------------------------------------
// FAQ data used only by the offline fallback matcher.
// ---------------------------------------------------------------------------
const FAQS = [
  { q: "How do I create an account?", a: "Click the 'Sign Up' link at the top right of any page, enter your email and a password, and confirm through the verification email we send you." },
  { q: "How can I reset my password?", a: "Go to the login page and click 'Forgot password'. We'll email you a reset link that stays valid for 30 minutes." },
  { q: "What payment methods do you accept?", a: "We accept Visa, Mastercard, American Express, UPI, net banking, and Cash on Delivery for orders under 10,000." },
  { q: "Do you offer Cash on Delivery?", a: "Yes, Cash on Delivery is available for orders below 10,000 in most serviceable pin codes." },
  { q: "How long does delivery take?", a: "Standard delivery takes 3 to 5 business days. Metro cities are usually quicker, often within 2 days." },
  { q: "How much does shipping cost?", a: "Shipping is free on orders above 499. Below that, a flat fee of 49 applies." },
  { q: "Can I track my order?", a: "Once your order ships you'll get a tracking link by email and SMS. You can also see it under 'My Orders' in your account." },
  { q: "What is your return policy?", a: "Most items can be returned within 7 days of delivery as long as they're unused and in the original packaging." },
  { q: "How do I return an item?", a: "Open 'My Orders', pick the item, and select 'Return'. Choose a reason and we'll arrange a free pickup." },
  { q: "When will I get my refund?", a: "Refunds are processed within 5 to 7 business days after we receive and inspect the returned item." },
  { q: "Can I cancel my order?", a: "You can cancel any time before the order is shipped from the 'My Orders' page. After shipping, you'll need to use the return flow instead." },
  { q: "Do you ship internationally?", a: "Right now we only ship within the country. International shipping is something we're working on." },
  { q: "Is my payment information secure?", a: "Yes. Payments are handled by a PCI-DSS compliant gateway and we never store your full card details on our servers." },
  { q: "How do I contact customer support?", a: "You can reach us at support@example.com or call 1800-123-456 between 9 AM and 9 PM, all days of the week." },
  { q: "Do products come with a warranty?", a: "Most electronics carry the standard manufacturer warranty. The exact period is listed on each product page." },
  { q: "Can I change my delivery address after ordering?", a: "You can update the address before the order ships by contacting support. Once it's out for delivery the address is locked." },
  { q: "Do you have a mobile app?", a: "Yes, our app is available on both the Play Store and the App Store. Search for our store name to install it." },
  { q: "How do I apply a coupon code?", a: "Enter your coupon in the 'Apply Coupon' box on the cart or checkout page and click Apply. The discount shows up in your order total." },
  { q: "Why was my payment declined?", a: "Payments can fail due to insufficient funds, an expired card, or a bank security check. Try another method or contact your bank." },
  { q: "Do you offer gift cards?", a: "Yes, digital gift cards are available in several denominations and can be redeemed at checkout." },
  { q: "What are your business hours?", a: "Our online store is open 24/7. Customer support is available from 9 AM to 9 PM every day." },
  { q: "How do I delete my account?", a: "Send a request to privacy@example.com from your registered email and we'll permanently delete your account within 7 days." }
];

const STOP = new Set(("a an the is are do does did how can could what when where why " +
  "i you my your me we us our it its to of for on in at and or be with that this " +
  "will would should get got have has had if so as about").split(" "));

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/)
    .filter(t => t.length > 1 && !STOP.has(t));
}

// Very small cosine-style overlap score for the offline fallback.
function offlineMatch(query) {
  const qTokens = tokenize(query);
  if (!qTokens.length) return null;
  const qSet = new Set(qTokens);

  let best = null, bestScore = 0;
  for (const item of FAQS) {
    const docTokens = tokenize(item.q + " " + item.q + " " + item.a);
    const docSet = new Set(docTokens);
    let overlap = 0;
    for (const t of qSet) if (docSet.has(t)) overlap++;
    const score = overlap / Math.sqrt(qSet.size * docSet.size);
    if (score > bestScore) { bestScore = score; best = item; }
  }

  if (bestScore < 0.12 || !best) {
    return { answer: "Sorry, I'm not sure about that one. Try rephrasing, or contact support@example.com.", matched_question: null, confidence: +bestScore.toFixed(3) };
  }
  return { answer: best.a, matched_question: best.q, confidence: +bestScore.toFixed(3) };
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------
function addMessage(text, who) {
  const el = document.createElement("div");
  el.className = "msg " + who;
  el.textContent = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
  return el;
}

function showTyping() {
  const el = document.createElement("div");
  el.className = "msg bot typing";
  el.innerHTML = "<span></span><span></span><span></span>";
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
  return el;
}

async function askBackend(message) {
  // Try the Flask endpoint first; throw to trigger the fallback if it's down.
  const res = await fetch("/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("backend error");
  return res.json();
}

async function handleQuery(text) {
  addMessage(text, "user");
  const typing = showTyping();

  let result;
  try {
    result = await askBackend(text);
  } catch {
    result = offlineMatch(text);   // backend not available -> use fallback
  }

  // small delay so the typing indicator is visible
  setTimeout(() => {
    typing.remove();
    addMessage(result.answer, "bot");
  }, 400);
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  handleQuery(text);
});

suggestions.addEventListener("click", (e) => {
  if (e.target.classList.contains("chip")) {
    handleQuery(e.target.textContent);
  }
});

// Greeting
window.addEventListener("DOMContentLoaded", () => {
  addMessage("Hi! I'm the support assistant. Ask me about orders, delivery, returns, payments, and more.", "bot");
});
