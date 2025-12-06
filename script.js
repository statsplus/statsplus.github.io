// STATS+ Wiki – Sidebar Toggle & Smooth Scrolling

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const backdrop = document.getElementById("backdrop");

// Toggle sidebar on mobile
sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  backdrop.classList.toggle("visible");
});

// Close sidebar when clicking backdrop
backdrop.addEventListener("click", () => {
  sidebar.classList.remove("open");
  backdrop.classList.remove("visible");
});

// Smooth scrolling for sidebar links
sidebar.addEventListener("click", (event) => {
  const target = event.target;
  if (target.tagName.toLowerCase() === "a" && target.getAttribute("href").startsWith("#")) {
    event.preventDefault();
    const id = target.getAttribute("href").slice(1);
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
    // Close sidebar on mobile after navigation
    sidebar.classList.remove("open");
    backdrop.classList.remove("visible");
  }
});
