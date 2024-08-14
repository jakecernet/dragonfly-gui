import { useEffect, useState } from "react";
import "./dashboard.css";

import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import Gauge from "./gauge/gauge";

import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "react-circular-progressbar/dist/styles.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import locationMarker from "../../icons/rocket.png";
import homeMarker from "../../icons/home.svg";
import tickicon from "../../icons/tick.svg";
import erroricon from "../../icons/error.svg";
import warningicon from "../../icons/warning.svg";
import saveIcon from "../../icons/save.svg";
import checkIcon from "../../icons/check.svg";
import homepointIcon from "../../icons/home.svg";
import closeIcon from "../../icons/close.svg";

import useWebSocket from "../tools/useWebSocket";
import {
	haversineDistance,
	getCurrentFormattedTime,
} from "../tools/AdditionalFunctions";

const RocketIcon = new L.Icon({
	iconUrl: locationMarker,
	iconSize: [35, 35],
	iconAnchor: [25, 50],
});

const HomeIcon = new L.Icon({
	iconUrl: homeMarker,
	iconSize: [35, 35],
	iconAnchor: [25, 50],
});

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

const circleDisplay = ({ value, unit, maxRange, color }) => {
	return (
		<div className="circle">
			<CircularProgressbar
				value={value}
				text={`${value} ${unit}`}
				maxValue={maxRange}
				styles={buildStyles({
					textColor: "#fff",
					pathColor: color || "rgb(43, 82, 189)",
					trailColor: "#fff",
					pathTransitionDuration: 0.5,
					textSize: "14px",
					rotation: 0.6,
				})}
			/>
		</div>
	);
};

function Dashboard({
	data,
	setData,
	setVehicleStatus,
	vehicleStatus,
	flightNumber,
	setAnalysisData,
	setInitialFlightTime,
	initialFlightTime,
	initialUptime,
	setInitialUptime,
	setComponent_status,
	component_status,
}) {
	const { data: WebSocketData, sendMessage } = useWebSocket(
		"ws://localhost:8765"
	);

	const [InitialHeight, setInitialHeight] = useState("N/A");
	const [InitialGPS, setInitialGPS] = useState("N/A");
	const [initialGPSdisplay, setInitialGPSdisplay] = useState("N/A");

	let PressureHeight = data.PressureHeight.toFixed(0);
	let voltage = data.BatteryVoltage.toFixed(2);
	let RelativeHeight = (PressureHeight - InitialHeight).toFixed(1);
	let servoDeployed = data.ServoParachuteStatus ? "Deployed" : "Not deployed";
	let beeperEnabled = data.Beeper ? "On" : "Off";
	let position = [data.GPSCords.latitude, data.GPSCords.longitude];

	const controlStatus =
		vehicleStatus === "Ready" && InitialGPS !== "N/A!" ? true : false;

	let countdownNumber = 5;

	const [servoStatus, setServoStatus] = useState(servoDeployed);
	const [beeperStatus, setBeeperStatus] = useState(beeperEnabled);
	const [positionFromLaunchpad, setPositionFromLaunchpad] = useState("N/A");
	const [beeperLoading, setBeeperLoading] = useState(false);

	useEffect(() => {
		const output = haversineDistance(
			InitialGPS.split(",")[0],
			InitialGPS.split(",")[1],
			data.GPSCords.latitude,
			data.GPSCords.longitude
		);
		setPositionFromLaunchpad(output.toFixed(1));
	}, [data.GPSCords.latitude, data.GPSCords.longitude, InitialGPS]);

	const handleServoClick = () => {
		setServoStatus(
			servoStatus === "Deployed" ? "Not deployed" : "Deployed"
		);

		if (servoStatus === "Deployed") {
			sendMessage({ command: "move_servo", payload: "90" });
		} else {
			sendMessage({ command: "move_servo", payload: "0" });
		}
	};

	const handleBeeperClick = () => {
		
		setBeeperStatus(beeperStatus === "On" ? "Off" : "On");
		setBeeperLoading(true);
		if (beeperStatus === "On") {
			sendMessage({ command: "beeper_off" });
		} else {
			sendMessage({ command: "beeper_on" });
		}
		}
	
		useEffect(() => {
			
			const temp = beeperStatus === "On";
			const temp2 = data.Beeper === 1;
			
			if (temp2 === temp) {
				console.log(temp, temp2);
				setBeeperLoading(false);
			}
		}, [WebSocketData, beeperStatus, data.Beeper]);
		

	function ChangeView({ center }) {
		const map = useMap();
		map.panTo(center);
		return null;
	}

	const toggleArm = () => {
		if (vehicleStatus === "Launched") {
			return;
		} else {
			if (vehicleStatus === "Ready") {
				setVehicleStatus("Armed");
				sendMessage({ command: "vehicle_status", payload: "Armed" });
			} else {
				setVehicleStatus("Ready");
				sendMessage({ command: "vehicle_status", payload: "Ready" });
			}
		}
	};

	const initVehicleLaunch = () => {
		if (
			vehicleStatus === "Armed" &&
			InitialHeight !== "N/A" &&
			InitialGPS !== "N/A"
		) {
			document.querySelector(".countdown").style.display = "flex";
			let countdown = setInterval(() => {
				countdownNumber--;
				document.querySelector(".countdown h2").innerHTML =
					countdownNumber;
				if (countdownNumber === 0) {
					clearInterval(countdown);
					launchVehicle();
					document.querySelector(".countdown").style.display = "none";
				}
			}, 1000);
		} else {
			return;
		}
	};

	const launchVehicle = () => {
		setVehicleStatus("Launched");
		const mytime = getCurrentFormattedTime();

		sendMessage({ command: "launch", payload: mytime });
		setInitialFlightTime(Date.now() / 1000);
	};

	useEffect(() => {
		sendMessage({ command: "initial_height", payload: InitialHeight });
	}, [InitialHeight]);

	useEffect(() => {
		if (WebSocketData) {
			if (WebSocketData.command === "view_only") {
				setVehicleStatus("View only");
				setAnalysisData(WebSocketData.payload);
			}

			if (WebSocketData.command === "component_status") {
				let newStatus = { ...component_status };
				WebSocketData.payload[0] = parseInt(WebSocketData.payload[0]);
				WebSocketData.payload[1] = Boolean(WebSocketData.payload[1]);

				if (WebSocketData.payload[0] === 1) {
					newStatus["BMP"] = WebSocketData.payload[1]
						? ["ok", "BMP is connected"]
						: ["warning", "BMP is not connected"];
					setInitialHeight(
						WebSocketData.payload[2].currentAltitude.toFixed(0)
					);
				}

				if (WebSocketData.payload[0] === 2) {
					if (
						WebSocketData.payload[2].GPSLatitude !== false &&
						WebSocketData.payload[2].GPSLongitude !== false
					) {
						newStatus["GPS"] = ["ok", "GPS is connected"];
						setInitialGPS(
							WebSocketData.payload[2].GPSLatitude +
								"," +
								WebSocketData.payload[2].GPSLongitude
						);
						setInitialGPSdisplay(
							WebSocketData.payload[2].GPSLatitude +
								"," +
								WebSocketData.payload[2].GPSLongitude
						);
						data.GPSCords.latitude = parseFloat(
							WebSocketData.payload[2].GPSLatitude
						);
						data.GPSCords.longitude = parseFloat(
							WebSocketData.payload[2].GPSLongitude
						);
					} else {
						newStatus["GPS"] = [
							"warning",
							"GPS is outputs invalid numbers",
						];
					}
				}

				if (WebSocketData.payload[0] === 7) {
					newStatus["ESP"] = WebSocketData.payload[1]
						? ["ok", "ESP is connected"]
						: ["warning", "ESP is not connected"];
					setInitialUptime(Math.floor(Date.now() / 1000));
				}
				if (WebSocketData.payload[0] === 8) {
					const temp = WebSocketData.payload[2];
					let oldData = data;
					oldData.PressureHeight = temp.Altitude;
					oldData.GPSCords.latitude = temp.GPSLatitude;
					oldData.GPSCords.longitude = temp.GPSLongitude;
					oldData.Pressure = temp.Pressure;
					oldData.Temperature = temp.Temperature;
					oldData.Beeper = temp.Beeper;
					
					
					

					if (
						temp.GPSLatitude !== false &&
						temp.GPSLongitude !== false &&
						InitialGPS === "N/A"
					) {
						newStatus["GPS"] = ["ok", "GPS is connected"];
						setInitialGPS(
							temp.GPSLatitude + "," + temp.GPSLongitude
						);
						setInitialGPSdisplay(
							temp.GPSLatitude + "," + temp.GPSLongitude
						);
					}
				}
				if (WebSocketData.payload[0] === 9) {
					if (vehicleStatus === "Launched") {
						setVehicleStatus("Free fall");
					}
					if (WebSocketData.payload[0] === 11) {
						console.log("Vehicle landed");
						if (vehicleStatus === "Free fall") {
							setVehicleStatus("Landed");
						}
					}
				}
				if (WebSocketData.payload[0] === 12) {
					newStatus["base_serial"] = WebSocketData.payload[1]
						? ["ok", "Base serial is connected"]
						: ["warning", "Base serial is not connected"];
				}

				if (WebSocketData.payload[0] === 13) {
					newStatus["base_lora"] = WebSocketData.payload[1]
						? ["ok", "Base lora is connected"]
						: ["warning", "Base lora is not connected"];
				}
				if (WebSocketData.payload[0] === 14) {
					newStatus["rocket_lora"] = WebSocketData.payload[1]
						? ["ok", "Rocket lora is connected"]
						: ["warning", "Rocket lora is not connected"];
				}

				setComponent_status(newStatus);
			}
		}
	}, [InitialGPS, flightNumber, WebSocketData, vehicleStatus]);

	useEffect(() => {
		sendMessage({
			command: "flight_number",
			payload: flightNumber,
		});
	}, [flightNumber]);

	useEffect(() => {
		let allComponentsOk = true;
		for (const key in component_status) {
			if (component_status[key][0] !== "ok") {
				allComponentsOk = false;
			}
		}
		if (allComponentsOk) {
			//console.log("All components are ok");
		}
	}, [component_status]);

	const handleInitGPS = () => {
		const temp = {
			currentAltitude: data.PressureHeight,
			GPSLatitude: data.GPSCords.latitude,
			GPSLongitude: data.GPSCords.longitude,
		};
		setInitialGPS(temp.GPSLatitude + "," + temp.GPSLongitude);
		setInitialHeight(temp.currentAltitude.toFixed(0));
		
		if(data.PressureHeight){
			let newStatus = { ...component_status };
			newStatus["BMP"] = ["ok", "BMP is connected"];
			setComponent_status(newStatus);
		}
		if(data.GPSCords.latitude && data.GPSCords.longitude){
			let newStatus = { ...component_status };
			newStatus["GPS"] = ["ok", "GPS is connected"];
			setComponent_status(newStatus);


		}
		

		sendMessage({
			command: "set_homepoint",
			payload: temp,
		});
	};

	const HandleEndFlight = () => {
		const uptime = Math.floor(Date.now() / 1000) - initialUptime;
		const flightTime = Math.floor(Date.now() / 1000) - initialFlightTime;

		sendMessage({
			command: "end_flight",
			payload: [flightNumber, uptime, flightTime],
		});
		window.location.reload();
	};

	const openPreFlightCheck = () => {
		document.querySelector(".pre-flight").style.display = "flex";
	};

	return (
		<div className="dashboard">
			<div className="pre-flight" id="pre-flight">
				<div>
					<div className="pre-title">
						<h2 id="errorDisplay">Error</h2>
						<button
							onClick={() => {
								document.querySelector(
									".pre-flight"
								).style.display = "none";
							}}>
							<img src={closeIcon} alt="Close" />
						</button>
					</div>
					<ul>
						<li>
							<h3>GPS module</h3>
							<img
								src={getStatusIcon(component_status.GPS[0])}
								onMouseEnter={() => {
									document.getElementById(
										"errorDisplay"
									).innerHTML = component_status["GPS"][1];
								}}
								onMouseLeave={() => {
									document.getElementById(
										"errorDisplay"
									).innerHTML = "";
								}}
								alt="GPS status"
							/>
						</li>
						<hr></hr>
						<li>
							<h3>Rocket LORA</h3>
							<img
								src={getStatusIcon(component_status["rocket_lora"][0])}
								onMouseEnter={() => {
									document.getElementById(
										"errorDisplay"
									).innerHTML = component_status["rocket_lora"][1];
								}}
								onMouseLeave={() => {
									document.getElementById(
										"errorDisplay"
									).innerHTML = "";
								}}
								alt="rocket_lora status"
							/>
						</li>
						<hr></hr>
						<li>
							<h3>BMP 280</h3>
							<img
								src={getStatusIcon(component_status["BMP"][0])}
								onMouseEnter={() => {
									document.getElementById(
										"errorDisplay"
									).innerHTML = component_status["BMP"][1];
								}}
								onMouseLeave={() => {
									document.getElementById(
										"errorDisplay"
									).innerHTML = "";
								}}
								alt="BMP status"
							/>
						</li>
						<hr></hr>
						<li>
							<h3>Base Serial Connection</h3>
							<img
								src={getStatusIcon(
									component_status.base_serial[0]
								)}
								onMouseEnter={() => {
									document.getElementById(
										"errorDisplay"
									).innerHTML =
										component_status["base_serial"][1];
								}}
								onMouseLeave={() => {
									document.getElementById(
										"errorDisplay"
									).innerHTML = "";
								}}
								alt="base_serial status"
							/>
						</li>
						<hr></hr>
						<li>
							<h3>Base Lora Connection</h3>
							<img
								src={getStatusIcon(
									component_status.base_lora[0]
								)}
								onMouseEnter={() => {
									document.getElementById(
										"errorDisplay"
									).innerHTML =
										component_status["base_lora"][1];
								}}
								onMouseLeave={() => {
									document.getElementById(
										"errorDisplay"
									).innerHTML = "";
								}}
								alt="base_lora status"
							/>
						</li>
						<hr></hr>
					</ul>
				</div>
			</div>
			<div className="countdown">
				<div id="fader">
					<p>Vehicle launch in</p>
					<h2>{countdownNumber}</h2>
				</div>
			</div>
			<section className="text">
				<div className="heights">
					<div>
						<h2>Relative height</h2>
						<p>{RelativeHeight} m</p>
					</div>
					<div>
						<h2>Absolute height</h2>
						<p>{PressureHeight} m</p>
					</div>
					<div>
						<h2>Initial height</h2>
						<p>{InitialHeight} m</p>
					</div>
				</div>
				<div className="heights">
					<div>
						<h2>Distance from launchpad</h2>
						<p>{positionFromLaunchpad} m</p>
					</div>
				</div>
			</section>
			<section className="main-four">
				<div className="parameter">
					<Gauge value={voltage} maxValue={5} />
					<p>{voltage} V</p>
				</div>
				<div className="toolbar">
					<div onClick={handleServoClick}>
						<h2>Servo status</h2>
						<p>{servoStatus}</p>
					</div>
					<div onClick={handleBeeperClick}>
						<h2>Beeper</h2>
						{!beeperLoading && <p>{beeperStatus}</p>}
						
						{beeperLoading && <p>Loading...</p>}

					</div>
					<selection
						className="vodoravno"
						style={{ justifyContent: "center" }}>
						<div
							onClick={
								vehicleStatus === "Launched"
									? HandleEndFlight
									: null
							}
							style={{
								opacity: vehicleStatus === "Launched" ? 1 : 0.2,
								cursor:
									vehicleStatus === "Launched"
										? "pointer"
										: "not-allowed",
								pointerEvents:
									vehicleStatus === "Launched"
										? "auto"
										: "none",
							}}>
							<img
								src={saveIcon}
								alt="End flight"
								title="End flight and save data"
							/>
						</div>
						<div
							onClick={
								vehicleStatus === "Ready"
									? openPreFlightCheck
									: undefined
							}
							style={{
								opacity: vehicleStatus === "Ready" ? 1 : 0.2,
								pointerEvents:
									vehicleStatus === "Ready" ? "auto" : "none",
							}}>
							<img
								src={checkIcon}
								alt="Open pre-flight checklist"
							/>
						</div>
						<div
		onClick={
			controlStatus && InitialGPS !== "N/A" ? handleInitGPS : null
		}
		style={{
			opacity: controlStatus && InitialGPS !== "N/A" ? 1 : 0.2,
			pointerEvents: controlStatus && InitialGPS !== "N/A" ? "auto" : "none",
			cursor: controlStatus && InitialGPS !== "N/A" ? "pointer" : "not-allowed",
		}}>
		<img src={homepointIcon} alt="Set homepoint" />
	</div>
					</selection>
				</div>
				<div className="vodoravno">
					<div
						className="launch"
						onClick={() => toggleArm()}
						style={{
							opacity: vehicleStatus === "Launched" ? 0.2 : 1,
						}}>
						<button
							style={{
								cursor:
									vehicleStatus === "Launched"
										? "not-allowed"
										: "pointer",
								backgroundColor:
									vehicleStatus === "Ready"
										? "rgb(1, 143, 6)"
										: "rgb(159, 170, 2)",
							}}>
							{vehicleStatus === "Ready" ? "Arm" : "Disarm"}
						</button>
					</div>
					<div
						className="launch"
						onClick={() => initVehicleLaunch()}
						style={{
							opacity: vehicleStatus === "Armed" ? 1 : 0.2,
						}}>
						<button
							id="launch_button"
							disabled={vehicleStatus !== "Armed"}
							style={{
								cursor:
									vehicleStatus === "Armed"
										? "pointer"
										: "not-allowed",
								backgroundColor:
									vehicleStatus === "Armed"
										? "rgb(106, 0, 0)"
										: "rgb(61, 90, 128)",
							}}>
							Launch
						</button>
					</div>
				</div>
			</section>
			<section>
				<div id="map">
					<MapContainer
						center={position}
						zoom={20}
						scrollWheelZoom={true}
						attributionControl={false}
						preferCanvas={false}
						style={{
							height: "100%",
							width: "85%",
							borderRadius: "10px",
							marginTop: "10px",
						}}>
						<TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
						<Marker position={position} icon={RocketIcon}></Marker>
						<Marker
							position={
								InitialGPS === "N/A"
									? [0, 0]
									: [
											parseFloat(
												InitialGPS.split(",")[0]
											),
											parseFloat(
												InitialGPS.split(",")[1]
											),
									  ]
							}
							icon={HomeIcon}></Marker>
						<ChangeView center={position} />
					</MapContainer>
				</div>
			</section>
		</div>
	);
}

export default Dashboard;
