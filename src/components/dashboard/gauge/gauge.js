import React from "react";
import "./gauge.css";

const Gauge = ({ value, maxValue = 6 }) => {
	const degrees = (value / maxValue) * 180;
	const needleStyle = {
		transform: `rotate(${degrees}deg)`,
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
			<svg width="100" height="60" viewBox="0 0 100 60">
				<circle
					cx="50"
					cy="50"
					r="45"
					stroke="blue"
					strokeWidth="8"
					fill="none"
				/>
				<line
					x1="50"
					y1="50"
					x2="50"
					y2="10"
					style={needleStyle}
					className="needle"
				/>
				{numbers}
			</svg>
			<div className="value">{value}</div>
		</div>
	);
};

export default Gauge;
