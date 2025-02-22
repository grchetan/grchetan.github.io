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

// Scroll Bar prosecc
window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const docHeight = document.body.scrollHeight - window.innerHeight;
  const scrollPercent = (scrollTop / docHeight) * 100;

  const progressBar = document.getElementById("progress-bar");
  progressBar.style.width = scrollPercent + "%";
});
