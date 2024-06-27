import "./analysis.css";

import data from "../../Simulator.mjs";
import { useEffect, useState } from "react";

const Analysis = ({AnalysisData, flightNumber}) => {
	const [displayData, setDisplayData] = useState({
								FlightNumber: NaN,
								NumberOfCommandsSent: NaN,
								InitHeight: NaN,
								InitGPS: NaN,
								InitTime: NaN
							});

function FormatAnalysisData(data) {
		const lines = data.split('\n');
	
		const flightNumber = lines[0].trim();
		const numCommandsSent = parseInt(lines[1].trim(), 10);
		const initHeight = parseInt(lines[2].trim(), 10);
		const initGPS = lines[3].trim();
		const initTime = lines[4].trim();
	
		let formattedData = {
			FlightNumber: flightNumber,
			NumberOfCommandsSent: numCommandsSent,
			InitHeight: initHeight,
			InitGPS: initGPS,
			InitTime: initTime
		};
		console.log(formattedData);
	
		return formattedData;
	}

	useEffect(() => {
		setDisplayData(FormatAnalysisData(AnalysisData));
	}
	, []);


	




    return (
		<div className="analysis">
			<h1>Analysis</h1>
			<div className="info">
				<div>
					<h2>Flight starting time: {displayData.InitTime}</h2>
					<h2>Initial height: {displayData.InitHeight} m</h2>
				</div>
			</div>
		</div>
	);
};

export default Analysis;