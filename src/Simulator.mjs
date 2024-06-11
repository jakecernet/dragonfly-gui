
function getRandomGpsCoordinates() {
    // Latitude ranges from -90 to 90
    const lat = (Math.random() * 180 - 90).toFixed(6);

    // Longitude ranges from -180 to 180
    const lon = (Math.random() * 360 - 180).toFixed(6);

    return {
        latitude: lat,
        longitude: lon
    };
}

function GetRandomTemperature() {
    return Math.floor(Math.random() * 22) + 10;
}


let InitialInputData = {
    GPSCords: getRandomGpsCoordinates(),
    PressureHeight: 870,
    GPSHeight: 860,
    RelativeHeight: 0,
    InitialHeight: 860,
    Pressure: Math.floor(Math.random() * 1000),
    BatteryVoltage: parseInt(Math.random() * 100).toFixed(2),
    Temperature: GetRandomTemperature(),
    AccelerationX: 0,
    AccelerationY: 0,
    AccelerationZ: 0,
    BeeperStatus: Math.random() > 0.5,
    ServoParachuteStatus: Math.random() > 0.5,
    Armed: Math.random() > 0.5,
    InFlight: Math.random() > 0.5,    
    FlightTime: 0,
    Uptime: 0

};

if(localStorage.getItem('data') === null){
    localStorage.setItem('data', JSON.stringify(InitialInputData));
}

console.log(GetData());
function GetData(){
    const data = JSON.parse(localStorage.getItem('data'));

    data.GPSCords.latitude = (parseFloat(data.GPSCords.latitude) + (Math.random() * 0.0001 - 0.00005)).toFixed(6);
    data.GPSCords.longitude = (parseFloat(data.GPSCords.longitude) + (Math.random() * 0.0001 - 0.00005)).toFixed(6);
    data.PressureHeight += Math.floor(Math.random() * 10 - 5);
    data.GPSHeight += Math.floor(Math.random() * 10);
    data.RelativeHeight = data.GPSHeight - data.InitialHeight;
    data.Pressure -= Math.floor(Math.random() * 10);
    data.BatteryVoltage -= parseInt(Math.random() * 0.1).toFixed(2);
    data.Temperature = data.Temperature + Math.floor(Math.random() * 2 - 1);
    data.AccelerationX = Math.floor(Math.random() * 100);
    data.AccelerationY = Math.floor(Math.random() * 100);
    data.AccelerationZ = Math.floor(Math.random() * 100);
    data.BeeperStatus = Math.random() > 0.5;
    data.ServoParachuteStatus = Math.random() > 0.5;
    data.Armed = Math.random() > 0.5;
    data.InFlight = Math.random() > 0.5;
    data.FlightTime += 1;
    data.Uptime += 1;

    localStorage.setItem('data', JSON.stringify(data));
    
    return data;
}



export default GetData;