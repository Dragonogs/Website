document.querySelector(".year").textContent = new Date().getFullYear();

const age = Math.floor(
  (new Date() - new Date("2001-04-26").getTime()) / 3.15576e10
);

document.querySelector(".age").textContent = age;
