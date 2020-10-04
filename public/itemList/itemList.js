// jshint esversion:6

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
    const subjectItemBody = document.querySelector("textarea.subject-item-body");

    subjectItemBody.removeAttribute("placeholder");
};

const subjectItemBodyBlur = () => {
    const subjectItemBody = document.querySelector("textarea.subject-item-body");

    subjectItemBody.setAttribute("placeholder", "Description");
};

// * Footer

const subjectItemFooterFocus = () => {
    const subjectItemFooter = document.querySelector("input.subject-item-footer");

    subjectItemFooter.removeAttribute("placeholder");
};

const subjectItemFooterBlur = () => {
    const subjectItemFooter = document.querySelector("input.subject-item-footer");

    subjectItemFooter.setAttribute("placeholder", "Additional Notes");
};