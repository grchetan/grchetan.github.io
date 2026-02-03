// Get elements
const toggleButton = document.getElementById("darkModeToggle");
const lightVideo = document.querySelector(".background-video.light-mode");
const darkVideo = document.querySelector(".background-video.dark-mode");
const body = document.body;

// Event listener for the toggle button
toggleButton.addEventListener("click", () => {
  body.classList.toggle("dark-mode");

  // Change videos and emoji based on dark mode status
  if (body.classList.contains("dark-mode")) {
    lightVideo.style.display = "none"; // Hide light mode video
    darkVideo.style.display = "block"; // Show dark mode video
    toggleButton.textContent = "☀️"; // Sun emoji for dark mode
  } else {
    lightVideo.style.display = "block"; // Show light mode video
    darkVideo.style.display = "none"; // Hide dark mode video
    toggleButton.textContent = "🌙"; // Moon emoji for light mode
  }

  // Add and remove animation class
  toggleButton.classList.add("animate");
});

// Animation effect for the emoji transition
toggleButton.addEventListener("animationend", () => {
  toggleButton.classList.remove("animate");
});

// Scrool top

let scrollBtn = document.getElementById("scrollTopBtn");
let progressCircle = document.getElementById("progressCircle");
let circleLength = progressCircle.getTotalLength(); // Circle ka total length

// ✅ Page load par direct hide
window.onload = function () {
  scrollBtn.style.display = "none";
};

window.addEventListener("scroll", () => {
  let scrollTop = document.documentElement.scrollTop;
  let scrollHeight =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;
  let scrollPercentage = (scrollTop / scrollHeight) * 100;

  // Circle ka progress update karna
  let progressOffset = circleLength - (scrollPercentage / 100) * circleLength;
  progressCircle.style.strokeDashoffset = progressOffset;

  // ✅ Scroll button dikhana/chhupana
  scrollBtn.style.display = scrollTop > 100 ? "flex" : "none";
});

// Scroll to top on click
scrollBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
