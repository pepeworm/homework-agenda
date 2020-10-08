// jshint esversion:6

// * Navbar

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
});

// * Title

const subjectItemTitleFocus = () => {
    const subjectItemTitle = document.querySelector("input.subject-item-title");

    subjectItemTitle.removeAttribute("placeholder");
};

const subjectItemTitleBlur = () => {
    const subjectItemTitle = document.querySelector("input.subject-item-title");

    subjectItemTitle.setAttribute("placeholder", "Name of Item");
};

// * Body

const subjectItemBodyFocus = () => {
    const subjectItemBody = document.querySelector(
        "textarea.subject-item-body"
    );

    subjectItemBody.removeAttribute("placeholder");
};

const subjectItemBodyBlur = () => {
    const subjectItemBody = document.querySelector(
        "textarea.subject-item-body"
    );

    subjectItemBody.setAttribute("placeholder", "Description");
};

// * Footer

const subjectItemFooterFocus = () => {
    const subjectItemFooter = document.querySelector(
        "input.subject-item-footer"
    );

    subjectItemFooter.removeAttribute("placeholder");
};

const subjectItemFooterBlur = () => {
    const subjectItemFooter = document.querySelector(
        "input.subject-item-footer"
    );

    subjectItemFooter.setAttribute("placeholder", "Additional Notes");
};
