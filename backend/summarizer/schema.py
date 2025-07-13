from pydantic import BaseModel
from typing import List, Dict, Union

class ExamplePaperSummary(BaseModel):
    title: str
    overview: str
    key_points: List[str]
    components: List[str]
    ingredients: List[str]
    workflow: List[str]
    accuracy_metrics: Dict[str, Union[str, float]]
    technologies_used: List[str]
    limitations: List[str]
    advantages: List[str]
    data_pipeline: List[str]
    real_world_impact: List[str]
    products: List[str]


example_paper_summary = ExamplePaperSummary(
    title="Smart Collar for Dairy Cows: AI-Driven Behavior Monitoring and Health Diagnostics",
    overview="This research presents a smart collar system that leverages embedded sensors and AI to monitor dairy cow behavior, enabling early health diagnostics and automation in livestock management.",

    key_points=[
        "Monitors cow behavior including feeding, resting, walking, and vocalization patterns.",
        "Uses embedded accelerometers, gyroscopes, ultrasonic sensors, and microphones.",
        "Edge AI models classify cow activity with over 92% accuracy.",
        "Battery life optimized through adaptive sensing and low-power wireless transmission.",
        "Real-time alerts for abnormal behaviors are sent to farmers via mobile apps."
    ],

    components=[
        "3-Axis Accelerometer",
        "Gyroscope",
        "Microphone",
        "Ultrasonic Sensor",
        "ESP32 Controller",
        "BLE Module",
        "Li-ion Battery",
        "Silicone Strap",
        "Plastic Enclosure",
        "Charging Circuit",
        "LED Indicators"
    ],

    ingredients=[
        "Polycarbonate Plastic",
        "Silicone Rubber",
        "Lithium-ion Cells",
        "Copper PCB",
        "Steel Screws",
        "Thermal Paste",
        "Waterproof Adhesive"
    ],

    workflow=[
        "Sensor signal acquisition and buffering on microcontroller.",
        "Time-series analysis and feature extraction.",
        "Local behavior classification using lightweight neural network.",
        "Event transmission via BLE to cloud dashboard.",
        "Farmer receives notifications through mobile dashboard."
    ],

    accuracy_metrics={
        "overall_accuracy": "92.8%",
        "eating_behavior_accuracy": "94.5%",
        "resting_behavior_accuracy": "91.3%",
        "abnormal_behavior_detection": "89.7%",
        "latency_per_decision": "200ms",
        "model_size": "120KB (TinyML Optimized)"
    },

    technologies_used=[
        "Edge AI / TinyML",
        "Bluetooth Low Energy (BLE)",
        "Embedded C++ / MicroPython",
        "Time-Series Feature Engineering",
        "Mobile Notifications (React Native App)",
        "Serverless Cloud Functions (Firebase/AWS Lambda)"
    ],

    limitations=[
        "Slight data loss in noisy environments (e.g. barn machinery).",
        "Orientation shift affects accuracy of gyroscope readings.",
        "Requires regular firmware updates for optimal performance.",
        "Needs charging every 5–6 days under full operation."
    ],

    advantages=[
        "Improves livestock health monitoring without manual intervention.",
        "Saves labor hours with automated behavior tracking.",
        "Scalable to other animal monitoring use cases.",
        "Offline inference reduces cloud dependency and cost."
    ],
    data_pipeline=[
        "Sensor Layer (Raw Data)",
        "On-Device Preprocessing",
        "Feature Engineering (Statistical + Frequency)",
        "Edge Model Inference",
        "MQTT Data Upload",
        "Cloud Aggregation & Visualization",
        "Farmer Notification Engine"
    ],

    real_world_impact=[
        "Reduced veterinary costs by 27%",
        "Increased early illness detection by 35%",
        "Saved ~2 hours/day of manual cow observation",
        "Improved milk yield by ~7% through early feeding alerts"
    ],

    products=[
        "AgriSense Smart Cow Collar v2.1",
        "FarmAI Behavior Dashboard",
        "HerdTrack Mobile App",
        "RuminantAlert Real-Time Monitoring Kit"
    ]
)
