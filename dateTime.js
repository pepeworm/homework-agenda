//jshint esversion:6

module.exports.currentDate = () => {
    const date = new Date();

    const options = {
        month: "long",
        day: "numeric",
        year: "numeric",
    };

    return date.toLocaleString("en-us", options);
};

module.exports.weekday = () => {
    const date = new Date();

    const options = {
        weekday: "long",
    };

    return date.toLocaleString("en-us", options);
};
