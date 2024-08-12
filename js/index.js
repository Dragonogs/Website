const projectSection = document.getElementById("projects");
const homeLink = document.getElementById("homeLink");
const projectsLink = document.getElementById("projectsLink");

const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      projectsLink.classList.add("active");
      homeLink.classList.remove("active");
    } else {
      homeLink.classList.add("active");
      projectsLink.classList.remove("active");
    }
  },
  { rootMargin: "-40%" }
);

observer.observe(projectSection);

function toggleDropdown() {
  const dropdownBtn = document.getElementById("dropdownBtn");
  const dropdown = document.getElementById("dropdown");
  dropdown.classList.toggle("open-dropdown");
  dropdownBtn.classList.toggle("clr-accent");
}
