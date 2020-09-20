// jshint esversion:6

const subjectInputFocus = () => {
    const subjectInput = document.querySelector("input[name=newSubject]");

    subjectInput.removeAttribute("placeholder");
};

const subjectInputBlur = () => {
    const subjectInput = document.querySelector("input[name=newSubject]");

    subjectInput.setAttribute("placeholder", "Subject Name");
};
