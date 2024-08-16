import React, { useState, useEffect, useRef } from "react";
import "./App.css";

import Dashboard from "./components/dashboard/dashboard";
import Analysis from "./components/analysis/analysis";
import Settings from "./components/settings/settings";

import dashboardIcon from "./icons/dashboard.svg";
import settingsIcon from "./icons/settings.svg";
import analysisIcon from "./icons/analysis.svg";

import erroricon from "./icons/error.svg";
import tickicon from "./icons/tick.svg";
import warningicon from "./icons/warning.svg";

const getStatusIcon = (status) => {
	switch (status) {
		case "warning":
			return warningicon;
		case "ok":
			return tickicon;
		case "error":
			return erroricon;
		default:
			return warningicon;
	}
};

function App() {
	const [selected, setSelected] = useState("dashboard");
	const [AnalysisData, setAnalysisData] = useState("");
	const [displayUptime, setDisplayUptime] = useState(0);
	const [displayData, setDisplayData] = useState({
		initialTime: 0,
		GPSCords: {
			latitude: 0,
			longitude: 0,
		},
		PressureHeight: 0,
		GPSHeight: 0,
		RelativeHeight: 0,
		InitialHeight: 0,
		Pressure: 2,
		BatteryVoltage: 5,
		Temperature: 27,
		AccelerationX: 0,
		AccelerationY: 0,
		AccelerationZ: 0,
		BeeperStatus: 0,
		ServoParachuteStatus: 0,
		Armed: 0,
		Beeper: false,
		InFlight: 0,
		FlightTime: 0,
		Uptime: 0,
		speedUnit: "km/h",
		PressureUnit: "Bar",
		TimeUnit: "s",
	});

	const [flightNumber, setFlightNumber] = useState("");
	const inputRef = useRef(null);
	const [vehicleStatus, setVehicleStatus] = useState("Ready");
	const [inputFlightNumber, setInputFlightNumber] = useState("");
	const [initialUptime, setInitialUptime] = useState(0);
	const [initialFlightTime, setInitialFlightTime] = useState(false);

	const [distanceUnit, setDistanceUnit] = useState("m");
	const [timeUnit, setTimeUnit] = useState("s");

	const [component_status, setComponent_status] = useState({
		GPS: ["error", "UI waiting to get info"],
		BMP: ["error", "UI waiting to get info"],
		ESP: ["error", "UI waiting to get info"],
		base_serial: ["error", "UI waiting to get info"],
		base_lora: ["error", "UI waiting to get info"],
		rocket_lora: ["error", "UI waiting to get info"],
	});

	useEffect(() => {
		const handleEscape = (event) => {
			if (event.key === "Escape") {
				document.getElementById("pre-flight").style.display = "none";
			}
		};

		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("keydown", handleEscape);
		};
	}, []);

	useEffect(() => {
		if (flightNumber.length > 10) {
			setFlightNumber(flightNumber.slice(0, 10));
		}
	}, [flightNumber]);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	useEffect(() => {
		if (initialUptime > 0) {
			const interval = setInterval(() => {
				setDisplayUptime(
					(Date.now() / 1000 - initialUptime).toFixed(1)
				);
			}, 50);

			return () => clearInterval(interval);
		} else {
			setDisplayUptime(0);
		}
	}, [initialUptime]);

	useEffect(() => {
		if (vehicleStatus === "Ready") {
			document.body.classList.toggle("armed", false);
			document.body.classList.toggle("ready", true);
			document.title = `Flight ${flightNumber} - Ready`;
		} else {
			document.body.classList.toggle("armed", true);
			document.body.classList.toggle("ready", false);
			document.title = `Flight ${flightNumber} - ${vehicleStatus}`;

			if (vehicleStatus === "Landed") {
				document.body.classList.toggle("armed", false);
				document.body.classList.toggle("ready", true);
				document.title = `Flight ${flightNumber} - Landed`;
			}
		}
	}, [vehicleStatus, flightNumber]);

	const handleKeyPress = (event) => {
		if (event.key === "Enter") {
			if (inputFlightNumber.length !== 0 && inputFlightNumber != " ") {
				setFlightNumber(inputFlightNumber);
				document.getElementById("overlay").style.display = "none";
			} else {
				document.getElementById("box").classList.add("turbulence");
				setTimeout(() => {
					document
						.getElementById("box")
						.classList.remove("turbulence");
				}, 300);
			}
		}
	};

	const handleInputChange = (event) => {
		setInputFlightNumber(event.target.value);
		if (inputRef.current) {
			inputRef.current.style.width = `${event.target.value.length + 1}ch`;
		}
	};

	useEffect(() => {
		if (flightNumber.length === 0) {
			inputRef.current.style.width = "17ch";
		}
	}, [flightNumber]);

	useEffect(() => {
		if (vehicleStatus === "View only") {
			setSelected("analysis");
			document.querySelector(".right").style.opacity = "0";
			document.querySelector(
				"nav ul li:nth-child(1)"
			).style.pointerEvents = "none";
			document.querySelector("nav ul li:nth-child(1)").style.opacity =
				"0.5";
			document.querySelector(
				"nav ul li:nth-child(2)"
			).style.pointerEvents = "auto";
			document.querySelector("nav ul li:nth-child(2)").style.opacity =
				"1";
			document.querySelector(
				"nav ul li:nth-child(3)"
			).style.pointerEvents = "none";
			document.querySelector("nav ul li:nth-child(3)").style.opacity =
				"0.5";
		} else {
			document.querySelector(".right").style.opacity = "1";
			document.querySelector(
				"nav ul li:nth-child(2)"
			).style.pointerEvents = "none";
			document.querySelector("nav ul li:nth-child(2)").style.opacity =
				"0.5";
		}
		if (vehicleStatus === "Launched") {
			document.getElementById("colored").style.color = "red";
		}
	}, [vehicleStatus]);

	return (
		<div>
			<div className="overlay" id="overlay">
				<div className="box" id="box">
					<div className="div_organize">
						<input
							ref={inputRef}
							type="text"
							placeholder="Enter flight number"
							value={inputFlightNumber}
							onChange={handleInputChange}
							onKeyPress={handleKeyPress}
							style={{ width: `${flightNumber.length + 1}ch` }}
						/>
						<div className="fat_cursor"></div>
					</div>
				</div>
			</div>
			<div className="status">
				<div className="left">
					<h2>
						Vehicle status:{" "}
						<span
							id="colored"
							style={{
								color:
									vehicleStatus === "Ready"
										? "rgba(0, 255, 0, 0.745)"
										: "yellow",
							}}>
							{vehicleStatus}
						</span>
					</h2>
				</div>
				<div className="center">
					<h1>Flight {flightNumber}</h1>
				</div>
				<div className="right">
					<h2>
						Flight time:{" "}
						{initialFlightTime
							? (Date.now() / 1000 - initialFlightTime).toFixed(1)
							: "N/A"}
					</h2>
					<h2>
						Uptime: {displayUptime} {timeUnit}
					</h2>
				</div>
			</div>
			<div className="content">
				{selected === "dashboard" && (
					<Dashboard
						data={displayData}
						setData={setDisplayData}
						setVehicleStatus={setVehicleStatus}
						vehicleStatus={vehicleStatus}
						setFlightNumber={setFlightNumber}
						flightNumber={flightNumber}
						setAnalysisData={setAnalysisData}
						setInitialFlightTime={setInitialFlightTime}
						initialFlightTime={initialFlightTime}
						initialUptime={initialUptime}
						setInitialUptime={setInitialUptime}
						distanceUnit={distanceUnit}
						setComponent_status={setComponent_status}
						component_status={component_status}
					/>
				)}
				{selected === "analysis" && (
					<Analysis AnalysisData={AnalysisData} />
				)}
				{selected === "settings" && (
					<Settings
						data={displayData}
						setDistanceUnit={setDistanceUnit}
						setTimeUnit={setTimeUnit}
					/>
				)}
			</div>
			<nav>
				<ul>
					<li onClick={() => setSelected("dashboard")}>
						<a>
							<img src={dashboardIcon} alt="Dashboard" />
							Dashboard
						</a>
					</li>
					<li onClick={() => setSelected("analysis")}>
						<a>
							<img src={analysisIcon} alt="Analysis" />
							Analysis
						</a>
					</li>
					<li onClick={() => setSelected("settings")}>
						<a>
							<img src={settingsIcon} alt="Settings" />
							Settings
						</a>
					</li>
				</ul>
			</nav>
		</div>
	);
}

export default App;
