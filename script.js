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
    threshold: 0.18,
  }
);

sections.forEach((section, index) => {
  const rect = section.getBoundingClientRect();
  const isInitiallyVisible =
    rect.top < window.innerHeight * 0.92 && rect.bottom > 0;

  if (isInitiallyVisible) {
    revealImmediately(section);
    return;
  }

  section.style.transitionDelay = `${index * 90}ms`;
  observer.observe(section);
});
