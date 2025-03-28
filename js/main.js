// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});

// Form submission handling
const form = document.querySelector(".contact-form");
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Get form values
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const service = document.getElementById("service").value;
    const message = document.getElementById("message").value;

    // Here you would typically send the data to a server
    // For now, we'll just show a success message
    alert(
      `Thank you ${name}! Your booking request has been received. We'll contact you shortly.`
    );

    // Reset the form
    form.reset();
  });
}

// Simple responsive navigation toggle (for mobile view)
function createMobileNav() {
  const navbar = document.querySelector(".navbar .container");

  // Create mobile toggle button
  const mobileToggle = document.createElement("button");
  mobileToggle.classList.add("mobile-toggle");
  mobileToggle.innerHTML = "☰";
  mobileToggle.style.display = "none";

  // Add toggle button to navbar
  navbar.appendChild(mobileToggle);

  // Get nav links
  const navLinks = document.querySelector(".nav-links");

  // Check window width and show/hide elements
  const checkWidth = () => {
    if (window.innerWidth <= 768) {
      mobileToggle.style.display = "block";
      navLinks.classList.add("mobile-nav");
    } else {
      mobileToggle.style.display = "none";
      navLinks.classList.remove("mobile-nav");
      navLinks.style.display = "flex";
    }
  };

  // Toggle mobile menu
  mobileToggle.addEventListener("click", () => {
    if (navLinks.style.display === "flex" || navLinks.style.display === "") {
      navLinks.style.display = "none";
    } else {
      navLinks.style.display = "flex";
    }
  });

  // Check width on load
  checkWidth();

  // Check width on resize
  window.addEventListener("resize", checkWidth);
}

// Initialize mobile nav when DOM is loaded
document.addEventListener("DOMContentLoaded", createMobileNav);
