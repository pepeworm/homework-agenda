// jshint esversion:6

const subjectInputFocus = () => {
    const subjectInput = document.querySelector("input[name=newSubject]");

    subjectInput.removeAttribute("placeholder");
};

const subjectInputBlur = () => {
    const subjectInput = document.querySelector("input[name=newSubject]");

    subjectInput.setAttribute("placeholder", "Subject Name");
};

// Navbar

const navbar = document.querySelector("nav");
const hamburger = document.querySelector(".hamburger-container");

hamburger.addEventListener("click", () => {
    if (!hamburger.classList.contains("burger-click")) {
        hamburger.classList.add("burger-click");
    } else {
        hamburger.classList.remove("burger-click");
    }

    if (!navbar.classList.contains("nav-open")) {
        navbar.classList.add("nav-open");
    } else {
        navbar.classList.remove("nav-open");
    }
})