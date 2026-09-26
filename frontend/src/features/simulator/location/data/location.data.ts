/**
 * Location atlas — authentic dataset (P5.1), reverse-engineered from the original
 * tool `8703b001….dc.html` (docs 27–32). Class-B canonical technical data only:
 * 115 components (Sensors 8 + Actuators 2 + ECUs 15 + Relays 15 + Fuses 56 + Ground
 * points 19), each with its category/kind/view, OEM ref, vehicle system, zone, and
 * IMAGE-RELATIVE hotspot (`hot.{x,y,w,h}` within the diagram of size `W×H`).
 *
 * Learner-facing prose (location / mount / notes) is NOT stored here — resolved
 * from the content namespace by ref: `content.location.<key>.{location,mount,notes}`.
 * Category/system/zone/OEM/coords are canonical (LTR).
 */

export type LocCategory = "Sensors" | "Actuators" | "ECUs" | "Relays" | "Fuses" | "Ground points";
export type LocKind = "sensor" | "ecu" | "ground" | "relay" | "fuse";
export type LocView = "sensors" | "ecu" | "ground" | "fuse" | "system" | "vehicle";

export interface Hotspot { x: number; y: number; w: number; h: number; W: number; H: number }
export interface LocComponent {
  key: string; ref: string; name: string; cat: LocCategory; kind: LocKind; view: LocView;
  oem?: string; sys: string; zone: string; place?: string; amp?: string; systems?: string[];
  img: string; hot: Hotspot;
}

/** Single vehicle context (Class-B canonical). */
export const LOC_VEHICLE = "TOYOTA Corolla 1.6 16V VVT-i (1ZR-FE) 2013 - 2018";

/** Six atlas views (id → diagram asset + intrinsic size). */
export const LOC_VIEWS: { id: LocView; img: string | null; W: number; H: number }[] = [
  { id: "sensors", img: null, W: 1000, H: 636 },
  { id: "ecu", img: "/assets/simulator/map-ecu.png", W: 1000, H: 557 },
  { id: "ground", img: "/assets/simulator/map-ground.png", W: 1000, H: 516 },
  { id: "fuse", img: "/assets/simulator/fusebox-layout.png", W: 772, H: 1000 },
  { id: "system", img: "/assets/simulator/fusebox-layout.png", W: 772, H: 1000 },
  { id: "vehicle", img: null, W: 1000, H: 636 },
];

export const LOC_COMPONENTS: LocComponent[] = [
  {"key":"L3","ref":"L3","name":"Mass airflow meter with air temperature sensor","cat":"Sensors","kind":"sensor","view":"sensors","oem":"L3","sys":"Engine management — air intake","zone":"Engine compartment","img":"/assets/simulator/detail-L3.png","hot":{"x":422,"y":199,"w":176,"h":114,"W":1000,"H":636}},
  {"key":"L1","ref":"L1","name":"MAP sensor","cat":"Sensors","kind":"sensor","view":"sensors","oem":"L1","sys":"Engine management — air intake","zone":"Engine compartment","img":"/assets/simulator/detail-L1.png","hot":{"x":318,"y":198,"w":199,"h":207,"W":1000,"H":607}},
  {"key":"T1","ref":"T1","name":"Coolant temperature sensor","cat":"Sensors","kind":"sensor","view":"sensors","oem":"T1","sys":"Engine management — cooling","zone":"Engine compartment","img":"/assets/simulator/detail-T1.png","hot":{"x":366,"y":484,"w":59,"h":57,"W":1000,"H":730}},
  {"key":"I2","ref":"I2","name":"Knock sensor","cat":"Sensors","kind":"sensor","view":"sensors","oem":"I2","sys":"Engine management — combustion","zone":"Engine compartment","img":"/assets/simulator/detail-I2.png","hot":{"x":475,"y":269,"w":82,"h":110,"W":1000,"H":727}},
  {"key":"X1","ref":"X1","name":"Crankshaft position sensor (magnetic type)","cat":"Sensors","kind":"sensor","view":"sensors","oem":"X1","sys":"Engine management — timing","zone":"Engine compartment","img":"/assets/simulator/detail-X1.png","hot":{"x":391,"y":265,"w":91,"h":146,"W":1000,"H":618}},
  {"key":"X7","ref":"X7","name":"Hall Effect/MRE sensor on the inlet camshaft","cat":"Sensors","kind":"sensor","view":"sensors","oem":"X7","sys":"Engine management — timing","zone":"Engine compartment","img":"/assets/simulator/detail-X7.png","hot":{"x":433,"y":297,"w":227,"h":117,"W":1000,"H":643}},
  {"key":"X8","ref":"X8","name":"Hall Effect/MRE sensor on the outlet camshaft","cat":"Sensors","kind":"sensor","view":"sensors","oem":"X8","sys":"Engine management — timing","zone":"Engine compartment","img":"/assets/simulator/detail-X8.png","hot":{"x":368,"y":364,"w":139,"h":162,"W":1000,"H":627}},
  {"key":"U2","ref":"U2","name":"Oxygen sensor behind the catalytic converter","cat":"Sensors","kind":"sensor","view":"sensors","oem":"U2","sys":"Emission control — exhaust","zone":"Underneath the vehicle","img":"/assets/simulator/detail-U2.png","hot":{"x":849,"y":6,"w":144,"h":97,"W":1000,"H":591}},
  {"key":"H3","ref":"H3","name":"Throttle control motor with position sensor","cat":"Actuators","kind":"sensor","view":"sensors","oem":"H3","sys":"Engine management — air intake","zone":"Engine compartment","img":"/assets/simulator/detail-H3.png","hot":{"x":186,"y":50,"w":530,"h":486,"W":1000,"H":600}},
  {"key":"V1","ref":"V1","name":"Canister purge solenoid","cat":"Actuators","kind":"sensor","view":"sensors","oem":"V1","sys":"Emission control — evaporative","zone":"Engine compartment","img":"/assets/simulator/detail-V1.png","hot":{"x":393,"y":235,"w":231,"h":206,"W":1000,"H":593}},
  {"key":"E1","ref":"E1","name":"Engine control unit","cat":"ECUs","kind":"ecu","view":"ecu","oem":"E1","sys":"Control units","zone":"Engine compartment","place":"Engine compartment, left side","img":"/assets/simulator/map-ecu.png","hot":{"x":230,"y":501,"w":49,"h":49,"W":1000,"H":557}},
  {"key":"E2","ref":"E2","name":"ABS control unit","cat":"ECUs","kind":"ecu","view":"ecu","oem":"E2","sys":"Control units","zone":"Engine compartment","place":"Engine compartment, left side","img":"/assets/simulator/map-ecu.png","hot":{"x":14,"y":331,"w":62,"h":50,"W":1000,"H":557}},
  {"key":"E4","ref":"E4","name":"Air-conditioning control unit","cat":"ECUs","kind":"ecu","view":"ecu","oem":"E4","sys":"Control units","zone":"In the dashboard panel","place":"In the dashboard panel","img":"/assets/simulator/map-ecu.png","hot":{"x":202,"y":7,"w":50,"h":49,"W":1000,"H":557}},
  {"key":"E5","ref":"E5","name":"Climate control unit","cat":"ECUs","kind":"ecu","view":"ecu","oem":"E5","sys":"Control units","zone":"In the dashboard panel","place":"In the dashboard panel","img":"/assets/simulator/map-ecu.png","hot":{"x":134,"y":7,"w":49,"h":49,"W":1000,"H":557}},
  {"key":"E9","ref":"E9","name":"Fuel pump control unit","cat":"ECUs","kind":"ecu","view":"ecu","oem":"E9","sys":"Control units","zone":"In the fuel tank","place":"In the fuel tank","img":"/assets/simulator/map-ecu.png","hot":{"x":680,"y":7,"w":49,"h":49,"W":1000,"H":557}},
  {"key":"E11","ref":"E11","name":"ESP control unit","cat":"ECUs","kind":"ecu","view":"ecu","oem":"E11","sys":"Control units","zone":"Engine compartment","place":"Engine compartment, left side","img":"/assets/simulator/map-ecu.png","hot":{"x":171,"y":501,"w":49,"h":49,"W":1000,"H":557}},
  {"key":"E13","ref":"E13","name":"Power steering control unit","cat":"ECUs","kind":"ecu","view":"ecu","oem":"E13","sys":"Control units","zone":"On the steering column","place":"On the steering column","img":"/assets/simulator/map-ecu.png","hot":{"x":477,"y":501,"w":49,"h":49,"W":1000,"H":557}},
  {"key":"E19","ref":"E19","name":"Immobiliser control unit","cat":"ECUs","kind":"ecu","view":"ecu","oem":"E19","sys":"Control units","zone":"Under the dashboard","place":"Under the dashboard, left side","img":"/assets/simulator/map-ecu.png","hot":{"x":342,"y":501,"w":49,"h":49,"W":1000,"H":557}},
  {"key":"E24","ref":"E24","name":"Transmission control unit","cat":"ECUs","kind":"ecu","view":"ecu","oem":"E24","sys":"Control units","zone":"Under the dashboard","place":"Under the dashboard, right side","img":"/assets/simulator/map-ecu.png","hot":{"x":386,"y":7,"w":50,"h":49,"W":1000,"H":557}},
  {"key":"E27","ref":"E27","name":"Cooling fan control unit","cat":"ECUs","kind":"ecu","view":"ecu","oem":"E27","sys":"Control units","zone":"Engine compartment","place":"Engine compartment, front left","img":"/assets/simulator/map-ecu.png","hot":{"x":14,"y":264,"w":62,"h":50,"W":1000,"H":557}},
  {"key":"E34","ref":"E34","name":"Body control unit","cat":"ECUs","kind":"ecu","view":"ecu","oem":"E34","sys":"Control units","zone":"Behind the dashboard panel","place":"Behind the dashboard panel, left side","img":"/assets/simulator/map-ecu.png","hot":{"x":285,"y":501,"w":50,"h":49,"W":1000,"H":557}},
  {"key":"E35","ref":"E35","name":"Parking control unit","cat":"ECUs","kind":"ecu","view":"ecu","oem":"E35","sys":"Control units","zone":"Behind the dashboard panel","place":"Behind the dashboard panel, right side","img":"/assets/simulator/map-ecu.png","hot":{"x":266,"y":7,"w":50,"h":49,"W":1000,"H":557}},
  {"key":"E36","ref":"E36","name":"Headlight control unit","cat":"ECUs","kind":"ecu","view":"ecu","oem":"E36","sys":"Control units","zone":"Behind the dashboard panel","place":"Behind the dashboard panel, left side","img":"/assets/simulator/map-ecu.png","hot":{"x":408,"y":501,"w":50,"h":49,"W":1000,"H":557}},
  {"key":"E66","ref":"E66","name":"Shift lock control unit","cat":"ECUs","kind":"ecu","view":"ecu","oem":"E66","sys":"Control units","zone":"Under the centre tunnel","place":"Under the centre tunnel","img":"/assets/simulator/map-ecu.png","hot":{"x":468,"y":7,"w":50,"h":49,"W":1000,"H":557}},
  {"key":"E68","ref":"E68","name":"Start/stop system control unit","cat":"ECUs","kind":"ecu","view":"ecu","oem":"E68","sys":"Control units","zone":"Behind the dashboard panel","place":"Behind the dashboard panel, right side","img":"/assets/simulator/map-ecu.png","hot":{"x":326,"y":7,"w":49,"h":49,"W":1000,"H":557}},
  {"key":"GP1","ref":"1","name":"Ground point 1 [AC]","cat":"Ground points","kind":"ground","view":"ground","oem":"AC","sys":"Ground distribution","zone":"Engine compartment","place":"Engine compartment, front right","img":"/assets/simulator/map-ground.png","hot":{"x":187,"y":9,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP2","ref":"2","name":"Ground point 2 [AD]","cat":"Ground points","kind":"ground","view":"ground","oem":"AD","sys":"Ground distribution","zone":"Engine compartment","place":"Engine compartment, front right","img":"/assets/simulator/map-ground.png","hot":{"x":239,"y":9,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP3","ref":"3","name":"Ground point 3 [CB]","cat":"Ground points","kind":"ground","view":"ground","oem":"CB","sys":"Ground distribution","zone":"Engine compartment","place":"Engine compartment, left side","img":"/assets/simulator/map-ground.png","hot":{"x":13,"y":267,"w":49,"h":50,"W":1000,"H":516}},
  {"key":"GP4","ref":"4","name":"Ground point 4 [CA]","cat":"Ground points","kind":"ground","view":"ground","oem":"CA","sys":"Ground distribution","zone":"Engine compartment","place":"Engine compartment, left side","img":"/assets/simulator/map-ground.png","hot":{"x":13,"y":330,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP5","ref":"5","name":"Ground point 5 [AB]","cat":"Ground points","kind":"ground","view":"ground","oem":"AB","sys":"Ground distribution","zone":"Engine compartment","place":"Engine compartment, front left","img":"/assets/simulator/map-ground.png","hot":{"x":158,"y":463,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP6","ref":"6","name":"Ground point 6 [AA]","cat":"Ground points","kind":"ground","view":"ground","oem":"AA","sys":"Ground distribution","zone":"Engine compartment","place":"Engine compartment, front left","img":"/assets/simulator/map-ground.png","hot":{"x":230,"y":463,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP7","ref":"7","name":"Ground point 7 [EA]","cat":"Ground points","kind":"ground","view":"ground","oem":"EA","sys":"Ground distribution","zone":"Under the dashboard","place":"Under the dashboard, left side","img":"/assets/simulator/map-ground.png","hot":{"x":368,"y":463,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP8","ref":"8","name":"Ground point 8 [AE]","cat":"Ground points","kind":"ground","view":"ground","oem":"AE","sys":"Ground distribution","zone":"Behind the dashboard panel","place":"Behind the dashboard panel, left side","img":"/assets/simulator/map-ground.png","hot":{"x":309,"y":464,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP9","ref":"9","name":"Ground point 9 [EB]","cat":"Ground points","kind":"ground","view":"ground","oem":"EB","sys":"Ground distribution","zone":"Behind the dashboard panel","place":"Behind the dashboard panel, in the centre","img":"/assets/simulator/map-ground.png","hot":{"x":434,"y":463,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP10","ref":"10","name":"Ground point 10 [ED]","cat":"Ground points","kind":"ground","view":"ground","oem":"ED","sys":"Ground distribution","zone":"Behind the dashboard panel","place":"Behind the dashboard panel, in the centre","img":"/assets/simulator/map-ground.png","hot":{"x":461,"y":9,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP11","ref":"11","name":"Ground point 11 [AF]","cat":"Ground points","kind":"ground","view":"ground","oem":"AF","sys":"Ground distribution","zone":"Behind the dashboard panel","place":"Behind the dashboard panel, right side","img":"/assets/simulator/map-ground.png","hot":{"x":13,"y":95,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP12","ref":"12","name":"Ground point 12 [EC]","cat":"Ground points","kind":"ground","view":"ground","oem":"EC","sys":"Ground distribution","zone":"Under the dashboard","place":"Under the dashboard, right side","img":"/assets/simulator/map-ground.png","hot":{"x":347,"y":9,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP13","ref":"13","name":"Ground point 13 [LA]","cat":"Ground points","kind":"ground","view":"ground","oem":"LA","sys":"Ground distribution","zone":"Under the front left seat","place":"Under the front left seat","img":"/assets/simulator/map-ground.png","hot":{"x":551,"y":464,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP14","ref":"14","name":"Ground point 14 [LB]","cat":"Ground points","kind":"ground","view":"ground","oem":"LB","sys":"Ground distribution","zone":"Left C-pillar","place":"Left C-pillar","img":"/assets/simulator/map-ground.png","hot":{"x":834,"y":464,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP15","ref":"15","name":"Ground point 15 [QA]","cat":"Ground points","kind":"ground","view":"ground","oem":"QA","sys":"Ground distribution","zone":"Tailgate","place":"Tailgate","img":"/assets/simulator/map-ground.png","hot":{"x":917,"y":464,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP16","ref":"16","name":"Ground point 16 [LD]","cat":"Ground points","kind":"ground","view":"ground","oem":"LD","sys":"Ground distribution","zone":"Right C-pillar","place":"Right C-pillar","img":"/assets/simulator/map-ground.png","hot":{"x":834,"y":9,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP17","ref":"17","name":"Ground point 17 [LC]","cat":"Ground points","kind":"ground","view":"ground","oem":"LC","sys":"Ground distribution","zone":"Under the front right seat","place":"Under the front right seat","img":"/assets/simulator/map-ground.png","hot":{"x":551,"y":9,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP18","ref":"18","name":"Ground point 18 [BA]","cat":"Ground points","kind":"ground","view":"ground","oem":"BA","sys":"Ground distribution","zone":"Engine","place":"Engine","img":"/assets/simulator/map-ground.png","hot":{"x":13,"y":219,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"GP19","ref":"19","name":"Ground point 19 [BB]","cat":"Ground points","kind":"ground","view":"ground","oem":"BB","sys":"Ground distribution","zone":"Engine","place":"Engine","img":"/assets/simulator/map-ground.png","hot":{"x":13,"y":157,"w":49,"h":48,"W":1000,"H":516}},
  {"key":"R1","ref":"R1","name":"Electronic power steering relay","cat":"Relays","kind":"relay","view":"fuse","oem":"R1","sys":"Switching","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","img":"/assets/simulator/fusebox-layout.png","hot":{"x":255,"y":120,"w":97,"h":90,"W":772,"H":1000}},
  {"key":"R2","ref":"R2","name":"Injector relay","cat":"Relays","kind":"relay","view":"fuse","oem":"R15","sys":"Switching","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","img":"/assets/simulator/fusebox-layout.png","hot":{"x":231,"y":242,"w":66,"h":86,"W":772,"H":1000}},
  {"key":"R3","ref":"R3","name":"Cooling fan, relay 1","cat":"Relays","kind":"relay","view":"fuse","oem":"R3","sys":"Switching","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","img":"/assets/simulator/fusebox-layout.png","hot":{"x":307,"y":242,"w":66,"h":86,"W":772,"H":1000}},
  {"key":"R4","ref":"R4","name":"Starter relay","cat":"Relays","kind":"relay","view":"fuse","oem":"R4","sys":"Switching","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","img":"/assets/simulator/fusebox-layout.png","hot":{"x":231,"y":353,"w":66,"h":86,"W":772,"H":1000}},
  {"key":"R5","ref":"R5","name":"Main relay","cat":"Relays","kind":"relay","view":"fuse","oem":"R1","sys":"Switching","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","img":"/assets/simulator/fusebox-layout.png","hot":{"x":307,"y":353,"w":66,"h":86,"W":772,"H":1000}},
  {"key":"R6","ref":"R6","name":"Daylight running lights (DRL)","cat":"Relays","kind":"relay","view":"fuse","oem":"R6","sys":"Switching","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","img":"/assets/simulator/fusebox-layout.png","hot":{"x":231,"y":455,"w":66,"h":87,"W":772,"H":1000}},
  {"key":"R7","ref":"R7","name":"Ignition relay","cat":"Relays","kind":"relay","view":"fuse","oem":"R16","sys":"Switching","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","img":"/assets/simulator/fusebox-layout.png","hot":{"x":307,"y":455,"w":66,"h":87,"W":772,"H":1000}},
  {"key":"R8","ref":"R8","name":"Horn relay","cat":"Relays","kind":"relay","view":"fuse","oem":"R8","sys":"Switching","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","img":"/assets/simulator/fusebox-layout.png","hot":{"x":62,"y":835,"w":66,"h":87,"W":772,"H":1000}},
  {"key":"R9","ref":"R9","name":"Headlight relay","cat":"Relays","kind":"relay","view":"fuse","oem":"R9","sys":"Switching","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","img":"/assets/simulator/fusebox-layout.png","hot":{"x":385,"y":292,"w":97,"h":97,"W":772,"H":1000}},
  {"key":"R10","ref":"R10","name":"Fuel pump relay","cat":"Relays","kind":"relay","view":"fuse","oem":"R3","sys":"Switching","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","img":"/assets/simulator/fusebox-layout.png","hot":{"x":534,"y":48,"w":86,"h":66,"W":772,"H":1000}},
  {"key":"R11","ref":"R11","name":"Dimmer relay","cat":"Relays","kind":"relay","view":"fuse","oem":"R11","sys":"Switching","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","img":"/assets/simulator/fusebox-layout.png","hot":{"x":414,"y":125,"w":86,"h":66,"W":772,"H":1000}},
  {"key":"R12","ref":"R12","name":"Main relay, No. 2","cat":"Relays","kind":"relay","view":"fuse","oem":"R12","sys":"Switching","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","img":"/assets/simulator/fusebox-layout.png","hot":{"x":563,"y":120,"w":86,"h":65,"W":772,"H":1000}},
  {"key":"R13","ref":"R13","name":"Brake light relay","cat":"Relays","kind":"relay","view":"fuse","oem":"R13","sys":"Switching","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","img":"/assets/simulator/fusebox-layout.png","hot":{"x":445,"y":197,"w":86,"h":65,"W":772,"H":1000}},
  {"key":"R14","ref":"R14","name":"Demister relay","cat":"Relays","kind":"relay","view":"fuse","oem":"R22","sys":"Switching","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","img":"/assets/simulator/fusebox-layout.png","hot":{"x":597,"y":274,"w":86,"h":66,"W":772,"H":1000}},
  {"key":"R15","ref":"R15","name":"Multi-mode manual transmission control unit / Cooling fan relay","cat":"Relays","kind":"relay","view":"fuse","oem":"R15","sys":"Switching","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","img":"/assets/simulator/fusebox-layout.png","hot":{"x":593,"y":397,"w":97,"h":97,"W":772,"H":1000}},
  {"key":"F1","ref":"F1","name":"ECU-B 2","cat":"Fuses","kind":"fuse","view":"fuse","oem":"ECU-B 2","sys":"ABS","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"10A","systems":["ABS","ESP","Adaptive headlights","Audio system","Automatic air conditioning","Charging","Combination meter","Cruise control","Shift lock","EBD","Engine control","Smart entrance control unit","EPS","Front fog lights","Headlight(s)","Heater","Hill-holder control","Illumination","Immobiliser","Key warning buzzer","Lane detection control unit","Multi-mode manual transmission control unit","Parking assistance system","Power window(s)","Pre-crash safety system","PTC heater","Rear fog light","Electric mirror(s)","Electric sunroof","Seat belt warning","SRS control unit","Starting","Steering lock","Start/stop system control unit","Tail lights","Tyre pressure indicator","Traction control","Hazard warning lights","Navigation system","Vehicle stability control (VSC)","Door lock control"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":76,"y":125,"w":66,"h":17,"W":772,"H":1000}},
  {"key":"F2","ref":"F2","name":"ECU-B 1","cat":"Fuses","kind":"fuse","view":"fuse","oem":"ECU-B 1","sys":"ABS","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"10A","systems":["ABS","ESP","Automatic light unit","Tailgate/boot release","Adaptive headlights","Clock","Combination meter","Door lock control","Double locking","Headlight washer(s)","Hill-holder control","EBD","Entry and start authorisation control unit","Front fog lights","Headlight(s)","Starting","Key warning buzzer","Illumination","Immobiliser","Interior lights","Lane detection warning","Pre-crash safety system","Vehicle stability control (VSC)","Rear fog light","Parking assistance system","Steering lock","Tail lights","Safety system","Traction control","Tyre pressure control","Seat belt warning buzzer"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":153,"y":126,"w":67,"h":17,"W":772,"H":1000}},
  {"key":"F3","ref":"F3","name":"ECU-B 3","cat":"Fuses","kind":"fuse","view":"fuse","oem":"ECU-B 3","sys":"EPS","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"5A","systems":["EPS"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":76,"y":158,"w":66,"h":17,"W":772,"H":1000}},
  {"key":"F4","ref":"F4","name":"DOME","cat":"Fuses","kind":"fuse","view":"fuse","oem":"DOME","sys":"Interior light","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"7.5A","systems":["Interior light"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":153,"y":158,"w":67,"h":17,"W":772,"H":1000}},
  {"key":"F5","ref":"F5","name":"AM 2","cat":"Fuses","kind":"fuse","view":"fuse","oem":"AM 2","sys":"Cruise control","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"7.5A","systems":["Cruise control","Continuously variable transmission (CVT) light","Engine control","Entry and start authorisation control unit","Immobiliser control unit","Multi-mode manual transmission control unit","Starting system","Steering lock","Door lock control"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":48,"y":189,"w":67,"h":18,"W":772,"H":1000}},
  {"key":"F6","ref":"F6","name":"RADIO","cat":"Fuses","kind":"fuse","view":"fuse","oem":"RADIO","sys":"Audio system","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"20A","systems":["Audio system","Navigation system","Parking assistance system"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":153,"y":189,"w":67,"h":18,"W":772,"H":1000}},
  {"key":"F7","ref":"F7","name":"D/C CUT","cat":"Fuses","kind":"fuse","view":"fuse","oem":"D/C CUT","sys":"Ignition power source","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"30A","systems":["Ignition power source"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":76,"y":226,"w":66,"h":17,"W":772,"H":1000}},
  {"key":"F8","ref":"F8","name":"DRL","cat":"Fuses","kind":"fuse","view":"fuse","oem":"DRL","sys":"Headlight(s)","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"10A","systems":["Headlight(s)"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":153,"y":246,"w":67,"h":17,"W":772,"H":1000}},
  {"key":"F9","ref":"F9","name":"HORN","cat":"Fuses","kind":"fuse","view":"fuse","oem":"HORN","sys":"Horn","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"10A","systems":["Horn","Theft warning relay (with security system)"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":48,"y":262,"w":67,"h":17,"W":772,"H":1000}},
  {"key":"F10","ref":"F10","name":"Fuse 10","cat":"Fuses","kind":"fuse","view":"fuse","oem":"","sys":"Power distribution","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"","systems":[],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":153,"y":278,"w":67,"h":17,"W":772,"H":1000}},
  {"key":"F11","ref":"F11","name":"EFI-MAIN","cat":"Fuses","kind":"fuse","view":"fuse","oem":"EFI-MAIN","sys":"Cruise control","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"25A","systems":["Cruise control","Continuously variable transmission (CVT) light","Engine control"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":49,"y":292,"w":66,"h":17,"W":772,"H":1000}},
  {"key":"F12","ref":"F12","name":"ABS 2","cat":"Fuses","kind":"fuse","view":"fuse","oem":"ABS 2","sys":"ABS","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"30A","systems":["ABS","EBD","Hill-holder control","Pre-crash safety system","Traction control unit","Vehicle stability control (VSC)"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":153,"y":309,"w":67,"h":17,"W":772,"H":1000}},
  {"key":"F13","ref":"F13","name":"ICS/ALT-S","cat":"Fuses","kind":"fuse","view":"fuse","oem":"ICS/ALT-S","sys":"Charging system","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"5A","systems":["Charging system"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":49,"y":337,"w":66,"h":17,"W":772,"H":1000}},
  {"key":"F14","ref":"F14","name":"ETCS","cat":"Fuses","kind":"fuse","view":"fuse","oem":"ETCS","sys":"Cruise control","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"10A","systems":["Cruise control","Continuously variable transmission (CVT) light","Engine control"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":49,"y":368,"w":66,"h":17,"W":772,"H":1000}},
  {"key":"F15","ref":"F15","name":"TURN&HAZ; ST","cat":"Fuses","kind":"fuse","view":"fuse","oem":"TURN&HAZ; ST","sys":"ABS","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"10A","systems":["ABS","Combination meter","EBD","Entry and start authorisation control unit","Hill-holder control","Immobiliser","Seat belt warning","Parking assistance system","Starting system","Steering lock","Pre-crash safety system","Traction control","Hazard warning lights","Vehicle stability control (VSC)","Door lock control"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":49,"y":400,"w":66,"h":17,"W":772,"H":1000}},
  {"key":"F16","ref":"F16","name":"IG2","cat":"Fuses","kind":"fuse","view":"fuse","oem":"IG2","sys":"Cruise control","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"15A","systems":["Cruise control","Continuously variable transmission (CVT) light","Engine control","Entry and start authorisation control unit","Ignition","Immobiliser","Starting system","Steering lock","Door lock controls"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":49,"y":434,"w":66,"h":17,"W":772,"H":1000}},
  {"key":"F17","ref":"F17","name":"INJ","cat":"Fuses","kind":"fuse","view":"fuse","oem":"INJ","sys":"Cruise control","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"20A","systems":["Cruise control","Continuously variable transmission (CVT) light","Engine control"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":49,"y":466,"w":66,"h":17,"W":772,"H":1000}},
  {"key":"F18","ref":"F18","name":"Fuse 18","cat":"Fuses","kind":"fuse","view":"fuse","oem":"","sys":"Power distribution","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"","systems":[],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":49,"y":498,"w":66,"h":17,"W":772,"H":1000}},
  {"key":"F19","ref":"F19","name":"ST; TURN&HAZ","cat":"Fuses","kind":"fuse","view":"fuse","oem":"ST; TURN&HAZ","sys":"Entry and start authorisation control unit","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"30A","systems":["Entry and start authorisation control unit","Immobiliser","Starting system","Steering lock","Door lock control"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":49,"y":530,"w":66,"h":17,"W":772,"H":1000}},
  {"key":"F20","ref":"F20","name":"VLVMATIC","cat":"Fuses","kind":"fuse","view":"fuse","oem":"VLVMATIC","sys":"Cruise control","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"30A","systems":["Cruise control","Continuously variable transmission (CVT) light","Engine control"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":59,"y":610,"w":62,"h":41,"W":772,"H":1000}},
  {"key":"F21","ref":"F21","name":"EPS","cat":"Fuses","kind":"fuse","view":"fuse","oem":"EPS","sys":"EPS","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"80A","systems":["EPS"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":40,"y":666,"w":86,"h":62,"W":772,"H":1000}},
  {"key":"F22","ref":"F22","name":"RDI","cat":"Fuses","kind":"fuse","view":"fuse","oem":"RDI","sys":"Cooling fan","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"40A","systems":["Cooling fan"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":146,"y":363,"w":63,"h":41,"W":772,"H":1000}},
  {"key":"F23","ref":"F23","name":"Fuse 23","cat":"Fuses","kind":"fuse","view":"fuse","oem":"","sys":"Power distribution","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"","systems":[],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":146,"y":419,"w":63,"h":41,"W":772,"H":1000}},
  {"key":"F24","ref":"F24","name":"DEF","cat":"Fuses","kind":"fuse","view":"fuse","oem":"DEF","sys":"Cruise control","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"30A","systems":["Cruise control","Continuously variable transmission (CVT) light","Engine control","Heated mirrors","Rear windscreen defroster"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":146,"y":478,"w":63,"h":41,"W":772,"H":1000}},
  {"key":"F25","ref":"F25","name":"ABS 1","cat":"Fuses","kind":"fuse","view":"fuse","oem":"ABS 1","sys":"ABS","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"50A","systems":["ABS","EBD","Hill-holder control","Pre-crash safety system","Traction control","Vehicle stability control (VSC)"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":146,"y":534,"w":63,"h":41,"W":772,"H":1000}},
  {"key":"F26","ref":"F26","name":"HTR","cat":"Fuses","kind":"fuse","view":"fuse","oem":"HTR","sys":"Automatic air conditioning","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"50A","systems":["Automatic air conditioning","Heater","Manual air conditioning","PTC heater"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":146,"y":592,"w":63,"h":41,"W":772,"H":1000}},
  {"key":"F27","ref":"F27","name":"ALT","cat":"Fuses","kind":"fuse","view":"fuse","oem":"ALT","sys":"Automatic light unit","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"120A","systems":["Automatic light unit","Charging","Entry and start authorisation control unit","Front fog lights","Illumination","Immobiliser","Power windows","Rear fog light","Starting system","Steering lock","Tail lights","Door lock control"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":118,"y":745,"w":87,"h":62,"W":772,"H":1000}},
  {"key":"F28","ref":"F28","name":"EFI 2","cat":"Fuses","kind":"fuse","view":"fuse","oem":"EFI 2","sys":"Cruise control","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"10A","systems":["Cruise control","Continuously variable transmission (CVT) light","Engine control"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":235,"y":557,"w":23,"h":68,"W":772,"H":1000}},
  {"key":"F29","ref":"F29","name":"EFI 1","cat":"Fuses","kind":"fuse","view":"fuse","oem":"EFI 1","sys":"Cruise control","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"10A","systems":["Cruise control","Engine control","Continuously variable transmission (CVT) light","Start/stop system control unit","Cooling fan"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":268,"y":557,"w":22,"h":68,"W":772,"H":1000}},
  {"key":"F30","ref":"F30","name":"EFI 3","cat":"Fuses","kind":"fuse","view":"fuse","oem":"EFI 3","sys":"Cruise control","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"10A","systems":["Cruise control","Continuously variable transmission (CVT) light","Engine control"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":299,"y":557,"w":23,"h":68,"W":772,"H":1000}},
  {"key":"F31","ref":"F31","name":"MIR-HTR","cat":"Fuses","kind":"fuse","view":"fuse","oem":"MIR-HTR","sys":"Cruise control","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"10A","systems":["Cruise control","Engine control","Heated mirrors","Continuously variable transmission (CVT) light","Rear windscreen defroster"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":332,"y":557,"w":22,"h":68,"W":772,"H":1000}},
  {"key":"F32","ref":"F32","name":"H-LP RH-LO","cat":"Fuses","kind":"fuse","view":"fuse","oem":"H-LP RH-LO","sys":"Headlights","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"15A","systems":["Headlights"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":390,"y":38,"w":22,"h":69,"W":772,"H":1000}},
  {"key":"F33","ref":"F33","name":"H-LP LH-LO","cat":"Fuses","kind":"fuse","view":"fuse","oem":"H-LP LH-LO","sys":"Headlights","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"15A","systems":["Headlights"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":422,"y":38,"w":22,"h":69,"W":772,"H":1000}},
  {"key":"F34","ref":"F34","name":"H-LP RH-HI","cat":"Fuses","kind":"fuse","view":"fuse","oem":"H-LP RH-HI","sys":"Headlights","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"7.5A","systems":["Headlights"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":456,"y":38,"w":22,"h":69,"W":772,"H":1000}},
  {"key":"F35","ref":"F35","name":"H-LP LH-HI","cat":"Fuses","kind":"fuse","view":"fuse","oem":"H-LP LH-HI","sys":"Headlights","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"7.5A","systems":["Headlights"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":488,"y":38,"w":23,"h":69,"W":772,"H":1000}},
  {"key":"F36","ref":"F36","name":"Fuse 36","cat":"Fuses","kind":"fuse","view":"fuse","oem":"","sys":"Power distribution","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"15A","systems":[],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":492,"y":334,"w":66,"h":17,"W":772,"H":1000}},
  {"key":"F37","ref":"F37","name":"Fuse 37","cat":"Fuses","kind":"fuse","view":"fuse","oem":"","sys":"Power distribution","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"","systems":[],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":497,"y":388,"w":67,"h":17,"W":772,"H":1000}},
  {"key":"F38","ref":"F38","name":"Fuse 38","cat":"Fuses","kind":"fuse","view":"fuse","oem":"","sys":"Power distribution","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"","systems":[],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":497,"y":422,"w":67,"h":17,"W":772,"H":1000}},
  {"key":"F39","ref":"F39","name":"Fuse 39","cat":"Fuses","kind":"fuse","view":"fuse","oem":"","sys":"Power distribution","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"","systems":[],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":497,"y":455,"w":67,"h":17,"W":772,"H":1000}},
  {"key":"F40","ref":"F40","name":"AMP","cat":"Fuses","kind":"fuse","view":"fuse","oem":"AMP","sys":"Audio system","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"15A","systems":["Audio system","Navigation system","Parking assistance system"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":497,"y":502,"w":67,"h":17,"W":772,"H":1000}},
  {"key":"F41","ref":"F41","name":"Fuse 41","cat":"Fuses","kind":"fuse","view":"fuse","oem":"","sys":"Power distribution","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"","systems":[],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":497,"y":535,"w":67,"h":17,"W":772,"H":1000}},
  {"key":"F42","ref":"F42","name":"EFI-MAIN 2","cat":"Fuses","kind":"fuse","view":"fuse","oem":"EFI-MAIN 2","sys":"Cruise control","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"20A","systems":["Cruise control","Continuously variable transmission (CVT) light","Engine control"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":497,"y":567,"w":67,"h":17,"W":772,"H":1000}},
  {"key":"F43","ref":"F43","name":"STRG LOCK","cat":"Fuses","kind":"fuse","view":"fuse","oem":"STRG LOCK","sys":"Entry and start authorisation control unit","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"20A","systems":["Entry and start authorisation control unit","Immobiliser","Starting system","Steering lock","Door lock control"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":497,"y":599,"w":67,"h":17,"W":772,"H":1000}},
  {"key":"F44","ref":"F44","name":"Fuse 44","cat":"Fuses","kind":"fuse","view":"fuse","oem":"","sys":"Power distribution","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"","systems":[],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":508,"y":631,"w":63,"h":41,"W":772,"H":1000}},
  {"key":"F45","ref":"F45","name":"BBC; AMT","cat":"Fuses","kind":"fuse","view":"fuse","oem":"BBC; AMT","sys":"Start/stop system control unit","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"40A","systems":["Start/stop system control unit","Multi-mode manual transmission control unit"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":522,"y":692,"w":62,"h":41,"W":772,"H":1000}},
  {"key":"F46","ref":"F46","name":"Fuse 46","cat":"Fuses","kind":"fuse","view":"fuse","oem":"","sys":"Power distribution","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"","systems":[],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":504,"y":750,"w":87,"h":62,"W":772,"H":1000}},
  {"key":"F47","ref":"F47","name":"PTC HTR 2","cat":"Fuses","kind":"fuse","view":"fuse","oem":"PTC HTR 2","sys":"Automatic air conditioning","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"30A","systems":["Automatic air conditioning","Heater","Manual air conditioning","PTC heater"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":581,"y":512,"w":62,"h":41,"W":772,"H":1000}},
  {"key":"F48","ref":"F48","name":"PTC HTR 1","cat":"Fuses","kind":"fuse","view":"fuse","oem":"PTC HTR 1","sys":"Automatic air conditioning","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"30A","systems":["Automatic air conditioning","Heater","Manual air conditioning","PTC heater"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":581,"y":573,"w":62,"h":41,"W":772,"H":1000}},
  {"key":"F49","ref":"F49","name":"H-LP CLN","cat":"Fuses","kind":"fuse","view":"fuse","oem":"H-LP CLN","sys":"Headlight washer","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"30A","systems":["Headlight washer"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":581,"y":631,"w":62,"h":41,"W":772,"H":1000}},
  {"key":"F50","ref":"F50","name":"Fuse 50","cat":"Fuses","kind":"fuse","view":"fuse","oem":"","sys":"Power distribution","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"","systems":[],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":606,"y":692,"w":63,"h":41,"W":772,"H":1000}},
  {"key":"F51","ref":"F51","name":"Fuse 51","cat":"Fuses","kind":"fuse","view":"fuse","oem":"","sys":"Power distribution","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"30A","systems":[],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":606,"y":752,"w":63,"h":41,"W":772,"H":1000}},
  {"key":"F52","ref":"F52","name":"PTC HTR 3","cat":"Fuses","kind":"fuse","view":"fuse","oem":"PTC HTR 3","sys":"Automatic air conditioning","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"30A","systems":["Automatic air conditioning","Heater","Manual air conditioning","PTC heater"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":658,"y":512,"w":62,"h":41,"W":772,"H":1000}},
  {"key":"F53","ref":"F53","name":"Fuse 53","cat":"Fuses","kind":"fuse","view":"fuse","oem":"","sys":"Power distribution","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"","systems":[],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":666,"y":582,"w":66,"h":17,"W":772,"H":1000}},
  {"key":"F54","ref":"F54","name":"S-HORN","cat":"Fuses","kind":"fuse","view":"fuse","oem":"S-HORN","sys":"Theft warning relay (with security system)","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"10A","systems":["Theft warning relay (with security system)"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":666,"y":615,"w":66,"h":17,"W":772,"H":1000}},
  {"key":"F55","ref":"F55","name":"STV HTR","cat":"Fuses","kind":"fuse","view":"fuse","oem":"STV HTR","sys":"Heater","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"25A","systems":["Heater"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":666,"y":646,"w":66,"h":17,"W":772,"H":1000}},
  {"key":"F56","ref":"F56","name":"H-LP-MAIN","cat":"Fuses","kind":"fuse","view":"fuse","oem":"H-LP-MAIN","sys":"Automatic air conditioning","zone":"Engine compartment","place":"Fuse and relay box in the engine compartment","amp":"30A","systems":["Automatic air conditioning","Automatic light unit","Headlight(s)","Headlight washer","Heater","Manual air conditioning","PTC heater"],"img":"/assets/simulator/fusebox-layout.png","hot":{"x":59,"y":552,"w":62,"h":41,"W":772,"H":1000}},
];

/**
 * Vehicle-system PRESENTATION MODEL (P5.3) — the authentic 58 presented system
 * groups, reverse-engineered verbatim from the source `get systems()` getter.
 *
 * The source does NOT expose the ~80 raw circuit labels directly. It buckets them:
 *   1. every fuse `systems[]` (circuit) label is normalised (`norm`) — lowercased,
 *      "(s)" and a trailing " unit" stripped, then run through an ALIAS table that
 *      merges spelling/plural variants (e.g. "Headlights"→"headlight",
 *      "Starting system"→"starting", "…(CVT) light"→"cvt indicator light");
 *   2. relays and control units are pushed into the buckets their names imply;
 *   3. ONLY buckets that contain at least one fuse are presented (`.filter(fuses.length)`),
 *      sorted by their display label. That fuse-gated filter is exactly what reduces
 *      the ~80 raw labels to 58 presented groups.
 *
 * `deriveSystemGroups` ports that algorithm 1:1 and runs it over the raw Class-B
 * `LOC_COMPONENTS` — so the raw circuit membership is preserved untouched and the 58
 * groups are DERIVED, never hand-entered. Each group keeps its exact member keys.
 */
export interface SystemGroup {
  key: string; // normalised bucket key (source `norm`)
  label: string; // display label = shortest raw circuit label in the bucket
  fuses: string[]; // member component keys, in source order
  relays: string[];
  ecus: string[];
  total: number;
}

const SYS_ALIAS: Record<string, string> = {
  headlights: "headlight", "tail lights": "tail light", "power windows": "power window",
  "interior lights": "interior light", "heated mirrors": "heated mirror",
  "door lock controls": "door lock control", "starting system": "starting",
  "cooling fan relay": "cooling fan", "electric mirror": "heated mirror",
  "theft warning relay (with security system)": "theft warning",
  "rear windscreen defroster": "rear window defroster", "tyre pressure control": "tyre pressure indicator",
  "seat belt warning buzzer": "seat belt warning", "lane detection warning": "lane detection",
  "lane detection control": "lane detection", "traction control": "traction control",
  "continuously variable transmission (cvt) light": "cvt indicator light",
  "multi-mode manual transmission control": "multi-mode manual transmission",
  "entry and start authorisation control": "entry and start authorisation",
  "start/stop system control": "start/stop system", "ignition power source": "ignition",
  "manual air conditioning": "manual air conditioning",
};
function sysNorm(s: string): string {
  let k = String(s).toLowerCase().replace(/\(s\)/g, "").replace(/\s+/g, " ").trim();
  k = k.replace(/\s+unit$/, "");
  return SYS_ALIAS[k] || k;
}
function sysPretty(s: string): string {
  const fix: Record<string, string> = { "cvt indicator light": "CVT indicator light", abs: "ABS", ebd: "EBD", esp: "ESP", eps: "EPS", srs: "SRS", "ptc heater": "PTC heater" };
  if (fix[s]) return fix[s];
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Port of the source `get systems()` — buckets raw circuits into fuse-gated groups. */
export function deriveSystemGroups(components: LocComponent[]): SystemGroup[] {
  const map: Record<string, LocComponent> = {};
  components.forEach((c) => (map[c.key] = c));
  const idx: Record<string, { key: string; labels: string[]; fuses: string[]; relays: string[]; ecus: string[] }> = {};
  const push = (key: string, itemKey: string) => {
    idx[key] = idx[key] || { key, labels: [], fuses: [], relays: [], ecus: [] };
    const b = idx[key];
    const it = map[itemKey];
    const bucket = it.kind === "fuse" ? b.fuses : it.kind === "relay" ? b.relays : b.ecus;
    if (bucket.indexOf(itemKey) < 0) bucket.push(itemKey);
  };
  // 1. fuse circuit labels seed the buckets
  components.forEach((i) => {
    if (!i.systems) return;
    i.systems.forEach((c) => {
      const k = sysNorm(c);
      idx[k] = idx[k] || { key: k, labels: [], fuses: [], relays: [], ecus: [] };
      if (idx[k].labels.indexOf(c) < 0) idx[k].labels.push(c);
      push(k, i.key);
    });
  });
  // 2. relays pushed into buckets their names imply
  components.filter((i) => i.kind === "relay").forEach((r) => {
    const base = sysNorm(r.name.replace(/\s*relay(,?\s*(no\.\s*)?\d*)?$/i, "").replace(/\s*\/\s*cooling fan$/i, ""));
    base.split(" / ").concat([base]).forEach((p) => { const k = sysNorm(p); if (idx[k]) push(k, r.key); });
    if (/cooling fan/i.test(r.name) && idx["cooling fan"]) push("cooling fan", r.key);
    if (/injector|main relay|ignition/i.test(r.name) && idx["engine control"]) push("engine control", r.key);
    if (/fuel pump/i.test(r.name) && idx["engine control"]) push("engine control", r.key);
  });
  // 3. control units pushed into buckets their names imply
  components.filter((i) => i.kind === "ecu").forEach((e) => {
    const base = sysNorm(e.name.replace(/\s*control unit$/i, ""));
    if (idx[base]) push(base, e.key);
    if (/^engine control/i.test(e.name) && idx["engine control"]) push("engine control", e.key);
    if (/body control/i.test(e.name)) ["illumination", "interior light", "power window", "door lock control"].forEach((k) => { if (idx[k]) push(k, e.key); });
    if (/headlight/i.test(e.name) && idx["headlight"]) push("headlight", e.key);
    if (/climate|air-conditioning/i.test(e.name)) ["automatic air conditioning", "manual air conditioning", "heater", "ptc heater"].forEach((k) => { if (idx[k]) push(k, e.key); });
    if (/esp/i.test(e.name)) ["esp", "vehicle stability control (vsc)", "traction control"].forEach((k) => { if (idx[k]) push(k, e.key); });
    if (/abs/i.test(e.name)) ["abs", "ebd", "hill-holder control"].forEach((k) => { if (idx[k]) push(k, e.key); });
    if (/immobiliser/i.test(e.name)) ["immobiliser", "steering lock", "entry and start authorisation"].forEach((k) => { if (idx[k]) push(k, e.key); });
    if (/fuel pump/i.test(e.name) && idx["engine control"]) push("engine control", e.key);
    if (/power steering/i.test(e.name) && idx["eps"]) push("eps", e.key);
    if (/parking/i.test(e.name) && idx["parking assistance system"]) push("parking assistance system", e.key);
    if (/start\/stop/i.test(e.name) && idx["start/stop system"]) push("start/stop system", e.key);
    if (/transmission/i.test(e.name)) ["cvt indicator light", "multi-mode manual transmission"].forEach((k) => { if (idx[k]) push(k, e.key); });
    if (/cooling fan/i.test(e.name) && idx["cooling fan"]) push("cooling fan", e.key);
  });
  return Object.keys(idx)
    .map((k) => {
      const b = idx[k];
      const label = b.labels.slice().sort((a, c) => a.length - c.length)[0] || sysPretty(k);
      return { key: k, label: sysPretty(label), fuses: b.fuses, relays: b.relays, ecus: b.ecus, total: b.fuses.length + b.relays.length + b.ecus.length };
    })
    .filter((s) => s.fuses.length)
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** The authentic 58 presented system groups (computed from raw Class-B at load). */
export const LOC_SYSTEM_GROUPS: SystemGroup[] = deriveSystemGroups(LOC_COMPONENTS);

const GROUP_BY_KEY: Record<string, SystemGroup> = Object.fromEntries(LOC_SYSTEM_GROUPS.map((g) => [g.key, g]));
export function groupByKey(key: string): SystemGroup | undefined {
  return GROUP_BY_KEY[key];
}
/** Member components of a presented system group, in source order (fuses, relays, ECUs). */
export function locByGroup(key: string): LocComponent[] {
  const g = GROUP_BY_KEY[key];
  if (!g) return [];
  return [...g.fuses, ...g.relays, ...g.ecus].map((k) => locByKey(k)!).filter(Boolean);
}

/** 8 sidebar categories (All + the 6 kinds + the vehicle-systems grouping) with counts. */
export const LOC_CATEGORIES: { id: string; count: number }[] = [
  { id: "all", count: 115 },
  { id: "Sensors", count: 8 },
  { id: "Actuators", count: 2 },
  { id: "ECUs", count: 15 },
  { id: "Relays", count: 15 },
  { id: "Fuses", count: 56 },
  { id: "Ground points", count: 19 },
  { id: "systems", count: LOC_SYSTEM_GROUPS.length },
];

/**
 * RAW vehicle-system registry (80 distinct labels) — the pre-grouping Class-B domain
 * data, kept for reference/tests. NOT the presented model (see LOC_SYSTEM_GROUPS).
 */
export const LOC_SYSTEMS_RAW: { name: string; count: number }[] = [
  { name: "ABS", count: 5 },
  { name: "Adaptive headlights", count: 2 },
  { name: "Audio system", count: 3 },
  { name: "Automatic air conditioning", count: 6 },
  { name: "Automatic light unit", count: 3 },
  { name: "Charging", count: 2 },
  { name: "Charging system", count: 1 },
  { name: "Clock", count: 1 },
  { name: "Combination meter", count: 3 },
  { name: "Continuously variable transmission (CVT) light", count: 12 },
  { name: "Control units", count: 15 },
  { name: "Cooling fan", count: 2 },
  { name: "Cruise control", count: 13 },
  { name: "Door lock control", count: 7 },
  { name: "Door lock controls", count: 1 },
  { name: "Double locking", count: 1 },
  { name: "EBD", count: 5 },
  { name: "EPS", count: 3 },
  { name: "ESP", count: 2 },
  { name: "Electric mirror(s)", count: 1 },
  { name: "Electric sunroof", count: 1 },
  { name: "Emission control — evaporative", count: 1 },
  { name: "Emission control — exhaust", count: 1 },
  { name: "Engine control", count: 13 },
  { name: "Engine management — air intake", count: 3 },
  { name: "Engine management — combustion", count: 1 },
  { name: "Engine management — cooling", count: 1 },
  { name: "Engine management — timing", count: 3 },
  { name: "Entry and start authorisation control unit", count: 7 },
  { name: "Front fog lights", count: 3 },
  { name: "Ground distribution", count: 19 },
  { name: "Hazard warning lights", count: 2 },
  { name: "Headlight washer", count: 2 },
  { name: "Headlight washer(s)", count: 1 },
  { name: "Headlight(s)", count: 4 },
  { name: "Headlights", count: 4 },
  { name: "Heated mirrors", count: 2 },
  { name: "Heater", count: 7 },
  { name: "Hill-holder control", count: 5 },
  { name: "Horn", count: 1 },
  { name: "Ignition", count: 1 },
  { name: "Ignition power source", count: 1 },
  { name: "Illumination", count: 3 },
  { name: "Immobiliser", count: 7 },
  { name: "Immobiliser control unit", count: 1 },
  { name: "Interior light", count: 1 },
  { name: "Interior lights", count: 1 },
  { name: "Key warning buzzer", count: 2 },
  { name: "Lane detection control unit", count: 1 },
  { name: "Lane detection warning", count: 1 },
  { name: "Manual air conditioning", count: 5 },
  { name: "Multi-mode manual transmission control unit", count: 3 },
  { name: "Navigation system", count: 3 },
  { name: "PTC heater", count: 6 },
  { name: "Parking assistance system", count: 5 },
  { name: "Power distribution", count: 13 },
  { name: "Power window(s)", count: 1 },
  { name: "Power windows", count: 1 },
  { name: "Pre-crash safety system", count: 5 },
  { name: "Rear fog light", count: 3 },
  { name: "Rear windscreen defroster", count: 2 },
  { name: "SRS control unit", count: 1 },
  { name: "Safety system", count: 1 },
  { name: "Seat belt warning", count: 2 },
  { name: "Seat belt warning buzzer", count: 1 },
  { name: "Shift lock", count: 1 },
  { name: "Smart entrance control unit", count: 1 },
  { name: "Start/stop system control unit", count: 3 },
  { name: "Starting", count: 2 },
  { name: "Starting system", count: 6 },
  { name: "Steering lock", count: 8 },
  { name: "Switching", count: 15 },
  { name: "Tail lights", count: 3 },
  { name: "Tailgate/boot release", count: 1 },
  { name: "Theft warning relay (with security system)", count: 2 },
  { name: "Traction control", count: 4 },
  { name: "Traction control unit", count: 1 },
  { name: "Tyre pressure control", count: 1 },
  { name: "Tyre pressure indicator", count: 1 },
  { name: "Vehicle stability control (VSC)", count: 5 },
];

export const LOC_COMPONENT_TOTAL = LOC_COMPONENTS.length;

export function locByKey(key: string): LocComponent | undefined {
  return LOC_COMPONENTS.find((c) => c.key === key);
}
export function locByCategory(cat: string): LocComponent[] {
  return cat === "all" ? LOC_COMPONENTS : LOC_COMPONENTS.filter((c) => c.cat === cat);
}
