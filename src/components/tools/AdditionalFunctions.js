function haversineDistance(initialLat, initialLong, finalLat, finalLong) {
	function toRadians(degrees) {
		return degrees * (Math.PI / 180);
	}

	const R = 6371000;
	const dLat = toRadians(finalLat - initialLat);
	const dLong = toRadians(finalLong - initialLong);
	const initialLatRad = toRadians(initialLat);
	const finalLatRad = toRadians(finalLat);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.sin(dLong / 2) *
			Math.sin(dLong / 2) *
			Math.cos(initialLatRad) *
			Math.cos(finalLatRad);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const distance = R * c;

	return distance;
}
function getCurrentFormattedTime () {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

export { haversineDistance, getCurrentFormattedTime };
