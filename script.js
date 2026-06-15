const sections = document.querySelectorAll(".hero, .section, .future");

const revealImmediately = (section) => {
  section.classList.add("is-visible");
  section.style.transitionDelay = "0ms";
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    rootMargin: "0px 0px 18% 0px",
    threshold: 0.04,
  }
);

sections.forEach((section, index) => {
  const rect = section.getBoundingClientRect();
  const isInitiallyVisible =
    rect.top < window.innerHeight * 1.35 && rect.bottom > 0;

  if (isInitiallyVisible) {
    revealImmediately(section);
    return;
  }

  section.style.transitionDelay = `${index * 90}ms`;
  observer.observe(section);
});
