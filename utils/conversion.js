const convertPricesToINR = (services, conversionRate) => {
    const updatedServices = JSON.parse(JSON.stringify(services)); // Deep copy to avoid mutation

    for (const category in updatedServices) {
        if (updatedServices.hasOwnProperty(category)) {
            for (const itemId in updatedServices[category]) {
                if (updatedServices[category].hasOwnProperty(itemId)) {
                    const item = updatedServices[category][itemId];
                    item.price = Math.round((item.price * conversionRate) * 100) / 100; // Convert & round to 2 decimals
                }
            }
        }
    }
    return updatedServices; // Return updated object
};

module.exports = {
    convertPricesToINR
}