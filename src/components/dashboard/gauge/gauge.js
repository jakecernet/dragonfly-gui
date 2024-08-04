import React from "react";
import "./gauge.css";

const Gauge = ({ value, maxValue = 5 }) => {
	//8 points arount the circle, only 5 in use
	const degrees = (value / maxValue - 0.5) * 180;
	const needleStyle = {
		transform: `rotate(${degrees}deg)`,
		transform: `translate(0, -30%) rotate(${degrees}deg)`,
		transition: "transform 1s ease-in-out",
	};

	const numbers = [];
	for (let i = 0; i <= maxValue; i += 1) {
		const angle = (i / maxValue) * 180;
		numbers.push(
			<text
				key={i}
				x={50 + 45 * Math.cos(Math.PI - angle * (Math.PI / 180))}
				y={50 + 45 * Math.sin(Math.PI - angle * (Math.PI / 180))}
				textAnchor="middle"
				alignmentBaseline="middle">
				{i}
			</text>
		);
	}

	return (
		<div className="gauge">
			<svg width="150" height="110" viewBox="0 0 100 60" style={{ transform: "translate(0, 30%)" }}>
				<circle
					cx="50"
					cy="50"
					r="45"
					stroke="white"
					strokeWidth="8"
					fill="none"
				/>
			</svg>
			<svg width="100" height="100" viewBox="0 0 100 100" style={needleStyle}>
				<line
					x1="50"
					y1="50"
					x2="50"
					y2="0"
					stroke="white"
					strokeWidth="4"
				/>
			</svg>
		</div>
	);
};

export default Gauge;
