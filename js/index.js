// Projects scroll animation

const faders = document.querySelectorAll(".fade-in");

const appearOptions = {
	threshold: 1,
	rootMargin: "0px 0px 0px 0px",
};

const appearOnScroll = new IntersectionObserver(function (
	entries,
	appearOnScroll
) {
	entries.forEach((entry) => {
		if (!entry.isIntersecting) {
			return;
		} else {
			entry.target.classList.add("appear");
			appearOnScroll.unobserve(entry.target);
		}
	});
},
appearOptions);

faders.forEach((fader) => {
	appearOnScroll.observe(fader);
});

// Nav active toggle

const sections = document.querySelectorAll(".section");

const navLink = document.getElementsByClassName(".nav-link");

const navActiveOptions = {
	threshold: 1,
};

const navActive = new IntersectionObserver(function (entries, navActive) {
	entries.forEach((entry) => {
		entry.target.classList.toggle("active");
	});
}, navActiveOptions);

sections.forEach((section) => {
	navActive.observe(section);
});
