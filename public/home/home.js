// jshint esversion:6

const subjectInputFocus = () => {
    const subjectInput = document.querySelector("input[name=subject]");

    subjectInput.removeAttribute("placeholder");
};

const subjectInputBlur = () => {
    const subjectInput = document.querySelector("input[name=subject]");

    subjectInput.setAttribute("placeholder", "Subject Name");
};

const homeHeaderTop = () => {
    const homeHeader = document.querySelector(".home-header");
    if (homeHeader.getBoundingClientRect().top === 0) {
        console.log(homeHeader.getBoundingClientRect().top);
        document.querySelector("html").style.padding = "6rem 0";
    }
};
