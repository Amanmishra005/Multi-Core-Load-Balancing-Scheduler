# Multi-Core-Load-Balancing-Scheduler

Overview

KernelOne is an advanced web-based simulation that demonstrates multi-core CPU scheduling and load balancing algorithms in real time.

This project helps in:

Understanding Operating System scheduling concepts
Visualizing load balancing techniques (Push vs Pull)
Simulating process execution and starvation handling
It provides an interactive dashboard to observe how processes are distributed across CPU cores.


Features
⚙️ System Controls
Spawn Processes (Single / Burst mode)
Simulation Speed Control (0.5x – 5x)
Core Count Control (2–12 cores)
Pause / Resume System
Cold Reset


🧠 Scheduling Algorithms
Least Load (Push Model)
Work Stealing (Pull Model)
Global Round Robin


📊 Real-Time Metrics
System Load (%)
Throughput
Starvation Risk Detection


🔥 Advanced Simulation
Dynamic Load Balancing
Process Aging (Starvation Prevention)
Thermal Simulation (CPU temperature)
Live Kernel Logs


⚡ How It Works
🔁 Simulation Cycle
1. Process spawn hota hai global queue me
2. Dispatcher process ko cores me assign karta hai
3. Scheduler algorithm decide karta hai distribution
4. Core process execute karta hai (burst time reduce hota hai)
5. Load balancing aur starvation prevention apply hota hai


🧩 Core Concepts Implemented
1. Load Balancing
Uneven load ko balance karne ke liye processes migrate hote hain
2. Work Stealing
Idle core busy core se process “steal” karta hai
3. Starvation Prevention
Aging technique use hoti hai
Long-wait processes ko priority boost milta hai
4. CPU Utilization
Har core ka utilization dynamically calculate hota hai


🖥️ UI Highlights
Modern glassmorphism dashboard
Animated process blocks
Real-time CPU visualization
Thermal indicators (cool → hot cores)
Technologies Used


HTML5
CSS3 (Advanced UI + Animations)
JavaScript (Vanilla JS)


How to Run
Project folder download karo
index.html file open karo browser me
Controls use karke simulation run karo


📈 Future Improvements
Priority Scheduling (Multi-level queues)
AI-based load prediction
Graph visualization (charts)
Backend integration (Node.js)

👨‍💻 Author

Atul Yadav
B.Tech 2nd Year

🎯 Conclusion

KernelOne ek powerful educational tool hai jo Operating System scheduling concepts ko real-time visual simulation ke through samajhne me help karta hai.
