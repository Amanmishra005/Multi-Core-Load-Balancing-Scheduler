/**
 * KernelOne Multi-Core Scheduler Engine
 * Advanced Simulation for Load Balancing & Starvation Prevention
 */

// --- Configuration & Constants ---
const CONFIG = {
    TICK_MS: 100,           // Base tick speed
    DEFAULT_CORES: 4,
    MAX_CORES: 12,
    AGING_THRESHOLD: 50,    // Ticks before a process "ages"
    LOAD_BALANCE_TICKS: 20, // Frequency of balancing
    MAX_LOGS: 50,
    COLORS: [
        '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', 
        '#ec4899', '#f43f5e', '#fb7185', '#fda4af'
    ]
};

// --- State Management ---
let state = {
    cores: [],
    globalQueue: [],
    isPaused: false,
    simSpeed: 1.0,
    algorithm: 'least-load',
    tickCount: 0,
    totalCompleted: 0,
    totalSpawned: 0,
    pidCounter: 1
};

// --- Entities ---

class Process {
    constructor(pid, burstTime, priority = 0) {
        this.pid = pid;
        this.burstTime = burstTime;
        this.remainingTime = burstTime;
        this.priority = priority; // 0: Normal, 1: High
        this.waitTicks = 0;
        this.color = CONFIG.COLORS[pid % CONFIG.COLORS.length];
        this.startTime = null;
        this.dom = this.createDOM();
    }

    createDOM() {
        const el = document.createElement('div');
        el.className = 'process';
        el.style.setProperty('--proc-color', this.color);
        el.innerHTML = `
            <span class="process-id">P${this.pid}</span>
            <span class="process-time">${this.remainingTime}ms</span>
            <div class="process-progress"></div>
            ${this.priority > 0 ? '<div class="process-priority"></div>' : ''}
        `;
        return el;
    }

    updateDOM() {
        const progress = (1 - this.remainingTime / this.burstTime) * 100;
        this.dom.querySelector('.process-progress').style.width = `${progress}%`;
        this.dom.querySelector('.process-time').innerText = `${Math.ceil(this.remainingTime)}ms`;
        
        if (this.waitTicks > CONFIG.AGING_THRESHOLD) {
            this.dom.classList.add('animate-pulse');
        } else {
            this.dom.classList.remove('animate-pulse');
        }
    }
}

class CPUCore {
    constructor(id) {
        this.id = id;
        this.queue = [];
        this.currentProcess = null;
        this.utilization = 0; // 0 to 100
        this.temperature = 35 + Math.random() * 5;
        this.totalActiveTicks = 0;
        this.totalTicks = 0;
        
        this.dom = this.initDOM();
    }

    initDOM() {
        const template = document.getElementById('core-template');
        const clone = template.content.cloneNode(true);
        const root = clone.querySelector('.cpu-core');
        root.id = `core-${this.id}`;
        root.querySelector('.core-name').innerText = `Core ${this.id}`;
        document.getElementById('cpu-grid').appendChild(clone);
        return document.getElementById(`core-${this.id}`);
    }

    getLoad() {
        // Load metric: processes in queue + 1 if executing
        return this.queue.length + (this.currentProcess ? 1 : 0);
    }

    tick() {
        this.totalTicks++;
        
        // 1. Process Execution
        if (this.currentProcess) {
            this.totalActiveTicks++;
            this.currentProcess.remainingTime -= (10 * state.simSpeed);
            this.currentProcess.updateDOM();

            if (this.currentProcess.remainingTime <= 0) {
                this.completeProcess();
            }
        } 
        
        // 2. Context Switching / Dispatching
        if (!this.currentProcess && this.queue.length > 0) {
            this.dispatchNext();
        }

        // 3. Queue Maintenance (Aging)
        this.queue.forEach(p => {
            p.waitTicks++;
            p.updateDOM();
        });

        this.updateStats();
    }

    dispatchNext() {
        this.currentProcess = this.queue.shift();
        const execUnit = this.dom.querySelector('.current-process');
        execUnit.innerHTML = '';
        this.currentProcess.dom.classList.add('running');
        execUnit.appendChild(this.currentProcess.dom);
        this.dom.classList.add('active');
    }

    completeProcess() {
        state.totalCompleted++;
        this.currentProcess = null;
        this.dom.querySelector('.current-process').innerHTML = '<span class="text-muted" style="font-size: 0.875rem;">Idle</span>';
        this.dom.classList.remove('active');
    }

    updateStats() {
        // Utilization calc (rolling window approximation)
        const targetUtil = this.currentProcess ? 80 + Math.random() * 20 : this.queue.length * 10;
        this.utilization = this.utilization * 0.9 + Math.min(100, targetUtil) * 0.1;
        
        // Thermal simulation
        const thermalTarget = 35 + (this.utilization * 0.45);
        this.temperature = this.temperature * 0.95 + thermalTarget * 0.05;

        // UI Updates
        this.dom.querySelector('.util-text').innerText = `${Math.round(this.utilization)}%`;
        this.dom.querySelector('.util-fill').style.width = `${this.utilization}%`;
        this.dom.querySelector('.thermal-val').innerText = `${Math.round(this.temperature)}°C`;
        
        const dot = this.dom.querySelector('.thermal-dot');
        if (this.temperature > 70) dot.style.background = 'var(--danger)';
        else if (this.temperature > 55) dot.style.background = 'var(--warning)';
        else dot.style.background = 'var(--accent)';

        // Update local queue display
        const qDom = this.dom.querySelector('.local-queue');
        qDom.innerHTML = '';
        this.queue.forEach(p => {
            p.dom.classList.remove('running');
            qDom.appendChild(p.dom);
        });
    }

    destroy() {
        // Move all processes back to global queue before dying
        if (this.currentProcess) state.globalQueue.push(this.currentProcess);
        this.queue.forEach(p => state.globalQueue.push(p));
        this.dom.remove();
    }
}

// --- Controller Logic ---

const Kernel = {
    init() {
        this.setupCores(CONFIG.DEFAULT_CORES);
        this.bindEvents();
        this.startLoop();
        this.log("Kernel sequence initialized.", "sys");
    },

    setupCores(count) {
        // Clean up
        state.cores.forEach(c => c.destroy());
        state.cores = [];
        
        // Create new
        for (let i = 0; i < count; i++) {
            state.cores.push(new CPUCore(i));
        }
        this.log(`System reconfigured to ${count} cores.`, "sys");
    },

    bindEvents() {
        document.getElementById('btn-spawn').onclick = () => this.spawnProcess();
        document.getElementById('btn-burst').onclick = () => {
            for(let i=0; i<5; i++) this.spawnProcess();
        };
        
        document.getElementById('btn-pause').onclick = (e) => {
            state.isPaused = !state.isPaused;
            e.target.innerHTML = state.isPaused ? '<i class="ph-bold ph-play"></i> Resume System' : '<i class="ph-bold ph-pause"></i> Pause System';
            this.log(state.isPaused ? "System suspended." : "System resumed.", "warn");
        };

        document.getElementById('btn-reset').onclick = () => {
            location.reload();
        };

        document.getElementById('speed-slider').oninput = (e) => {
            state.simSpeed = parseFloat(e.target.value);
            document.getElementById('speed-val').innerText = `${state.simSpeed.toFixed(1)}x`;
        };

        document.getElementById('core-slider').oninput = (e) => {
            const count = parseInt(e.target.value);
            document.getElementById('core-count-val').innerText = count;
            this.setupCores(count);
        };

        document.getElementById('algo-select').onchange = (e) => {
            state.algorithm = e.target.value;
            this.log(`Switching to ${state.algorithm} algorithm.`, "balance");
        };

        document.getElementById('btn-clear-logs').onclick = () => {
            document.getElementById('logs-content').innerHTML = '';
        };
    },

    spawnProcess() {
        const burst = 500 + Math.random() * 2500;
        const priority = Math.random() > 0.8 ? 1 : 0;
        const p = new Process(state.pidCounter++, burst, priority);
        state.globalQueue.push(p);
        state.totalSpawned++;
        this.updateGlobalQueueUI();
    },

    updateGlobalQueueUI() {
        const container = document.getElementById('global-queue');
        const countBadge = document.getElementById('global-queue-count');
        container.innerHTML = '';
        state.globalQueue.forEach(p => container.appendChild(p.dom));
        countBadge.innerText = `${state.globalQueue.length} Processes`;
    },

    startLoop() {
        setInterval(() => {
            if (state.isPaused) return;
            this.tick();
        }, CONFIG.TICK_MS);
    },

    tick() {
        state.tickCount++;

        // 1. Dispatcher Logic
        this.dispatchGlobal();

        // 2. Load Balancing Logic
        if (state.tickCount % CONFIG.LOAD_BALANCE_TICKS === 0) {
            this.balanceLoad();
        }

        // 3. Core Ticking
        state.cores.forEach(c => c.tick());

        // 4. Aging & Starvation Prevention
        this.preventStarvation();

        // 5. Update Global Stats
        this.updateStatsUI();
    },

    dispatchGlobal() {
        while (state.globalQueue.length > 0) {
            const p = state.globalQueue.shift();
            
            let targetCore;
            if (state.algorithm === 'least-load') {
                targetCore = state.cores.reduce((prev, curr) => prev.getLoad() < curr.getLoad() ? prev : curr);
            } else if (state.algorithm === 'round-robin') {
                targetCore = state.cores[state.pidCounter % state.cores.length];
            } else {
                // For work stealing, just put in a core, they will pull later
                targetCore = state.cores[Math.floor(Math.random() * state.cores.length)];
            }
            
            targetCore.queue.push(p);
            this.updateGlobalQueueUI();
        }
    },

    balanceLoad() {
        if (state.algorithm === 'least-load') {
            const sorted = [...state.cores].sort((a, b) => b.getLoad() - a.getLoad());
            const max = sorted[0];
            const min = sorted[sorted.length - 1];

            if (max.getLoad() - min.getLoad() > 2) {
                const p = max.queue.pop();
                if (p) {
                    min.queue.push(p);
                    this.log(`Balancing: P${p.pid} moved ${max.id} → ${min.id}`, "balance");
                }
            }
        } else if (state.algorithm === 'work-stealing') {
            state.cores.forEach(core => {
                if (core.getLoad() === 0) {
                    const busiest = state.cores.reduce((prev, curr) => prev.getLoad() > curr.getLoad() ? prev : curr);
                    if (busiest.queue.length > 1) {
                        const p = busiest.queue.pop();
                        core.queue.push(p);
                        this.log(`Stealing: Core ${core.id} pulled P${p.pid} from ${busiest.id}`, "balance");
                    }
                }
            });
        }
    },

    preventStarvation() {
        let starvationDetected = false;
        state.cores.forEach(core => {
            core.queue.forEach((p, index) => {
                if (p.waitTicks > CONFIG.AGING_THRESHOLD) {
                    starvationDetected = true;
                    // Aging: Move to front of queue
                    if (index > 0) {
                        core.queue.splice(index, 1);
                        core.queue.unshift(p);
                        p.waitTicks = 0; // Reset after boost
                        this.log(`Aging: Boosted P${p.pid} in Core ${core.id}`, "sys");
                    }
                }
            });
        });
        
        const risk = document.getElementById('stat-risk');
        risk.innerText = starvationDetected ? "Elevated" : "Low";
        risk.style.color = starvationDetected ? "var(--warning)" : "var(--accent)";
    },

    updateStatsUI() {
        const avgUtil = state.cores.reduce((sum, c) => sum + c.utilization, 0) / state.cores.length;
        document.getElementById('stat-load').innerText = `${Math.round(avgUtil)}%`;
        
        const tput = (state.totalCompleted / (state.tickCount / (1000/CONFIG.TICK_MS))).toFixed(1);
        document.getElementById('stat-tput').innerText = tput;
    },

    log(msg, tag = "sys") {
        const container = document.getElementById('logs-content');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
        
        entry.innerHTML = `
            <span class="log-time">${time}</span>
            <span class="log-tag tag-${tag}">${tag}</span>
            <span class="log-msg">${msg}</span>
        `;
        
        container.prepend(entry);
        if (container.children.length > CONFIG.MAX_LOGS) {
            container.removeChild(container.lastChild);
        }
    }
};

window.onload = () => Kernel.init();
