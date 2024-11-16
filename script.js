// Get elements
const openResumePopupButton = document.getElementById("openResumePopup");
const resumePopup = document.getElementById("resumePopup");
const closeResumePopupButton = document.getElementById("closeResumePopup");
const toggleButton = document.getElementById("darkModeToggle");
const lightVideo = document.querySelector(".background-video.light-mode");
const darkVideo = document.querySelector(".background-video.dark-mode");
const body = document.body;

// Function to open the pop-up
function openResumePopup() {
  resumePopup.style.display = "flex";
  setTimeout(() => resumePopup.classList.add("show"), 10); // Smooth transition
}

// Function to close the pop-up
function closeResumePopup() {
  resumePopup.classList.remove("show");
  setTimeout(() => (resumePopup.style.display = "none"), 500);
}

// Event listeners for the pop-up
openResumePopupButton.addEventListener("click", openResumePopup);
closeResumePopupButton.addEventListener("click", closeResumePopup);
window.addEventListener("click", (event) => {
  if (event.target === resumePopup) {
    closeResumePopup();
  }
});

// Initial setup for toggle button emoji
toggleButton.classList.add("animate");

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

// Navigatio button click
// Toggle for hamburger menu
document.getElementById("navtoggle").addEventListener("click", function () {
  const navLinks = document.getElementById("navLinks");
  navLinks.classList.toggle("active");
});
