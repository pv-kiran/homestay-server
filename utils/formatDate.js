const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toDateString(); // Example output: "Thu Feb 27 2025"
}

module.exports = {
    formatDate
}