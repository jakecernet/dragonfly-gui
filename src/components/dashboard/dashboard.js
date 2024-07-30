import { useEffect, useState } from "react";
import "./dashboard.css";

import { CircularProgressbar, buildStyles } from "react-circular-progressbar";

import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "react-circular-progressbar/dist/styles.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import locationMarker from "../../icons/rocket.png";
import homeMarker from "../../icons/home.png";
import tickicon from "../../icons/tick.svg";
import erroricon from "../../icons/error.svg";
import warningicon from "../../icons/warning.svg";
import saveIcon from "../../icons/save.svg";
import checkIcon from "../../icons/check.svg";
import homepointIcon from "../../icons/home.svg";

import useWebSocket from "../tools/useWebSocket";
import { haversineDistance } from "../tools/AdditionalFunctions";

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
	setVehicleStatus,
	vehicleStatus,
	flightNumber,
	setAnalysisData,
	setInitialFlightTime,
	initialFlightTime,
	initialUptime,
	setComponent_status,
	component_status
}) {
	const { data: WebSocketData, sendMessage } = useWebSocket(
		"ws://localhost:8764"
	);

	const [InitialHeight, setInitialHeight] = useState("N/A");
	const [InitialGPS, setInitialGPS] = useState("N/A");
	const [initialGPSdisplay, setInitialGPSdisplay] = useState("N/A");

	let temperature = data.Temperature;
	let PressureHeight = data.PressureHeight;
	let voltage = data.BatteryVoltage.toFixed(2);
	let GPSHeight = data.GPSHeight;
	let RelativeHeight = GPSHeight - InitialHeight;
	let servoDeployed = data.ServoParachuteStatus ? "Deployed" : "Not deployed";
	let beeperEnabled = data.BeeperStatus ? "On" : "Off";
	let position = [data.GPSCords.latitude, data.GPSCords.longitude];

	let countdownNumber = 5;

	const [servoStatus, setServoStatus] = useState(servoDeployed);
	const [beeperStatus, setBeeperStatus] = useState(beeperEnabled);

	const [positionFromLaunchpad, setPositionFromLaunchpad] = useState("N/A");

	useEffect(() => {
		const output = haversineDistance(
			InitialGPS.split(",")[0],
			InitialGPS.split(",")[1],
			data.GPSCords.latitude,
			data.GPSCords.longitude
		);
		setPositionFromLaunchpad(output.toFixed(1));
	}, [data.GPSCords.latitude, data.GPSCords.longitude]);

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
		if (beeperStatus === "On") {
			sendMessage({ command: "beeper_off" });
		} else {
			sendMessage({ command: "beeper_on" });
		}
	};

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
			} else {
				setVehicleStatus("Ready");
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

			if(WebSocketData.command === "component_status") {
				let newStatus = { ...component_status };
				WebSocketData.payload[0] = parseInt(WebSocketData.payload[0]);
				WebSocketData.payload[1] = Boolean(WebSocketData.payload[1]);

				if (WebSocketData.payload[0] === 1) {
					newStatus["GPS"] = WebSocketData.payload[1]
						? ["ok", "GPS is connected"]
						: ["warning", "GPS is not connected"];
				}

				if (WebSocketData.payload[0] === 2) {
					newStatus["BMP"] = WebSocketData.payload[1]
						? ["ok", "BMP is connected"]
						: ["warning", "BMP is not connected"];
				}
				if (WebSocketData.payload[0] === 3) {
					newStatus["Lora"] = WebSocketData.payload[1]
						? ["ok", "Lora is connected"]
						: ["warning", "Lora is not connected"];
				}
				if(WebSocketData.payload[0] === 6) {
					console.log(WebSocketData.data);
				}

				setComponent_status(newStatus);
				
				console.log(newStatus);
			}
		}

		sendMessage({ command: "initial_gps", payload: InitialGPS });
		sendMessage({
			command: "flight_number",
			payload: flightNumber,
		});
		sendMessage({
			command: "vehicle_status",
			payload: vehicleStatus,
		});
	}, [InitialGPS, flightNumber, WebSocketData, vehicleStatus]);

	const handleInitGPS = () => {
		setInitialGPS(data.GPSCords.latitude + "," + data.GPSCords.longitude);
		let positionShort = [
			data.GPSCords.latitude.toFixed(6),
			", ",
			data.GPSCords.longitude.toFixed(6),
		];
		setInitialGPSdisplay(positionShort.join(""));

		setInitialHeight(data.GPSHeight);
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
						<h2>GPS height</h2>
						<p>{GPSHeight} m</p>
					</div>
					<div>
						<h2>Pressure height</h2>
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
				<div className="vodoravno">
					<div className="parameter">
						{circleDisplay({
							value: voltage,
							unit: "V",
							maxRange: 5,
							color: voltage < 2 ? "red" : "rgb(43, 82, 189)",
						})}
					</div>
					<div className="parameter">
						{circleDisplay({
							value: temperature,
							unit: "°C",
							maxRange: 50,
							color:
								temperature > 40 ? "red" : "rgb(43, 82, 189)",
						})}
					</div>
				</div>
				<div className="toolbar">
					<div onClick={handleServoClick}>
						<h2>Servo status</h2>
						<p>{servoStatus}</p>
					</div>
					<div onClick={handleBeeperClick}>
						<h2>Beeper</h2>
						<p>{beeperStatus}</p>
					</div>
					
					<selection className="vodoravno2">
						<div
							onClick={vehicleStatus === "Launched" ? HandleEndFlight : null}
							style={{
								opacity: vehicleStatus === "Launched" ? 1 : 0.2,
								cursor: vehicleStatus === "Launched" ? "pointer" : "not-allowed",
								pointerEvents: vehicleStatus === "Launched" ? 'auto' : 'none',
							}}
						>
							<h2>
								<img src={saveIcon} alt="End flight" />
							</h2>
						</div>
						<div
							onClick={vehicleStatus === "Ready" ? openPreFlightCheck : undefined}
							style={{
								opacity: vehicleStatus === "Ready" ? 1 : 0.2,
								pointerEvents: vehicleStatus === "Ready" ? 'auto' : 'none',
							}}
						>
							<h2
								style={{
									cursor: vehicleStatus === "Ready" ? "pointer" : "not-allowed",
								}}
							>
								<img src={checkIcon} alt="Open pre-flight checklist" />
							</h2>
						</div>
						<div
							onClick={vehicleStatus === "Ready" ? handleInitGPS : null}
							style={{
								opacity: vehicleStatus === "Ready" ? 1 : 0.2,
								pointerEvents: vehicleStatus === "Ready" ? 'auto' : 'none',
							}}
						>
							<h2>
								<img src={homepointIcon} alt="Set homepoint" />
							</h2>
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
							position={InitialGPS === "N/A" ? [0, 0] : [parseFloat(InitialGPS.split(",")[0]), parseFloat(InitialGPS.split(",")[1])]}
							icon={HomeIcon}
						></Marker>
						<ChangeView center={position} />
					</MapContainer>
				</div>
			</section>
		</div>
	);
}

export default Dashboard;
