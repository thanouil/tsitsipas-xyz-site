// Application State
const EMAIL_ADDRESS = 'info@tsitsipas.xyz';
const MAX_CLICKS = 7;
const PARTICLE_COUNT = 90;
const EXPLOSION_DURATION = 3.0; // seconds

// DOM Elements
const dotElement = document.getElementById('dot');
const hintElement = document.getElementById('hint');
const achievementElement = document.getElementById('achievement');
const emailContainer = document.getElementById('emailContainer');
const emailElement = document.getElementById('emailElement');
const toastElement = document.getElementById('toast');

// Game State
let clickCount = 0;
let konamiSequence = [];
let typedString = '';
let easterEggTriggered = false;
let hintIndex = 0;
let lastTime = 0;

// Canvas and Particles
let canvas;
let context;
let particles = [];
let mousePosition = { x: 0, y: 0 };
let animationId;
let isAnimating = false;
let explosionStartTime = 0;

// Hint Messages
const hintMessages = [
    "something's hidden...",
    "try clicking me",
    "or maybe typing?",
    "getting warmer...",
    "almost there!"
];

// Konami Code Sequence
const konamiCode = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

// Particle Colors
const particleColors = [
    '#DA7756', '#BD5D3A', '#E8A890', '#F5F3EE',
    '#C9937B', '#D9957C', '#F0DDD3'
];

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    showInitialHint();
}

function setupEventListeners() {
    // Dot click handler
    dotElement.addEventListener('click', handleDotClick);
    
    // Keyboard event handlers
    document.addEventListener('keydown', handleKeyDown);
    
    // Mouse movement for particle interactions
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove);
    
    // Window resize handler
    window.addEventListener('resize', handleWindowResize);
    
    // Easter egg detection handlers
    setupEasterEggDetection();
}

function showInitialHint() {
    setTimeout(() => {
        hintElement.classList.add('show');
    }, 2000);
}

// Click Handler
function handleDotClick() {
    if (easterEggTriggered) return;
    
    clickCount++;
    
    // Add pulse animation
    dotElement.classList.add('pulse');
    setTimeout(() => {
        dotElement.classList.remove('pulse');
    }, 300);
    
    // Update hints after certain click thresholds
    if (clickCount >= 3) {
        updateHint();
    }
    
    // Trigger easter egg after max clicks
    if (clickCount >= MAX_CLICKS) {
        triggerEasterEgg('click');
    }
}

// Keyboard Handler
function handleKeyDown(event) {
    if (easterEggTriggered) return;
    
    // Handle Konami Code
    konamiSequence.push(event.code);
    if (konamiSequence.length > konamiCode.length) {
        konamiSequence.shift();
    }
    
    if (konamiSequence.length === konamiCode.length &&
        konamiSequence.every((key, index) => key === konamiCode[index])) {
        triggerEasterEgg('konami');
        return;
    }
    
    // Handle typed words
    if (event.key.length === 1) {
        typedString += event.key.toLowerCase();
        if (typedString.length > 10) {
            typedString = typedString.slice(-10);
        }
        
        // Check for trigger words
        if (typedString.includes('email') || 
            typedString.includes('contact') || 
            typedString.includes('hello')) {
            triggerEasterEgg('typing');
        }
    }
}

// Mouse and Touch Handlers
function handleMouseMove(event) {
    mousePosition.x = event.clientX;
    mousePosition.y = event.clientY;
}

function handleTouchMove(event) {
    if (event.touches.length > 0) {
        mousePosition.x = event.touches[0].clientX;
        mousePosition.y = event.touches[0].clientY;
    }
}

function handleWindowResize() {
    if (canvas) {
        resizeCanvas();
    }
}

// Hint System
function updateHint() {
    hintIndex = Math.min(hintIndex + 1, hintMessages.length - 1);
    hintElement.textContent = hintMessages[hintIndex];
}

// Easter Egg Trigger
function triggerEasterEgg(source) {
    if (easterEggTriggered) return;
    
    console.log(`Easter egg triggered by: ${source}`);
    easterEggTriggered = true;
    
    // Hide initial elements
    dotElement.style.display = 'none';
    hintElement.style.display = 'none';
    
    // Add glitch effect
    document.body.classList.add('glitch');
    setTimeout(() => {
        document.body.classList.remove('glitch');
    }, 500);
    
    // Show achievement and start particle explosion
    setTimeout(() => {
        achievementElement.classList.add('show');
        startParticleExplosion();
    }, 500);
    
    // Hide achievement and reveal email
    setTimeout(() => {
        achievementElement.classList.remove('show');
        emailContainer.classList.add('revealed');
    }, 2500);
}

// Particle System
class Particle {
    constructor(x, y, color) {
        // Initial position
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        
        // Explosion properties
        const angle = Math.random() * Math.PI * 2;
        const speed = 8 + Math.random() * 7;
        this.explosionVx = Math.cos(angle) * speed;
        this.explosionVy = Math.sin(angle) * speed;
        
        // Visual properties
        this.radius = Math.random() * 4 + 5;
        this.color = color;
        this.opacity = Math.random() * 0.3 + 0.6;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.15;
        
        // Wandering properties
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.targetWanderAngle = this.wanderAngle;
        this.wanderSpeed = Math.random() * 0.6 + 0.4;
        this.wanderTimer = 3 + Math.random() * 2;
        this.fleeSpeed = 2.5;
        
        // State tracking
        this.timeAlive = 0;
        this.vx = 0;
        this.vy = 0;
        this.bounce = 0.7;
    }
    
    update(deltaTime = 0.016) {
        this.rotation += this.rotationSpeed;
        this.timeAlive += deltaTime;
        
        let explosionActive = this.timeAlive < EXPLOSION_DURATION;
        
        if (explosionActive) {
            // Explosion phase - particles travel far
            this.explosionVx *= 0.97;
            this.explosionVy *= 0.97;
            this.x += this.explosionVx;
            this.y += this.explosionVy;
        } else {
            // Wandering phase
            this.wanderTimer -= deltaTime;
            if (this.wanderTimer <= 0) {
                this.wanderAngle = Math.random() * Math.PI * 2;
                this.wanderTimer = 3 + Math.random() * 2;
            }
            
            const wanderVx = Math.cos(this.wanderAngle) * this.wanderSpeed;
            const wanderVy = Math.sin(this.wanderAngle) * this.wanderSpeed;
            
            // Mouse avoidance
            let fleeVx = 0;
            let fleeVy = 0;
            const dx = this.x - mousePosition.x;
            const dy = this.y - mousePosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150 && distance > 0) {
                const fleeForce = (150 - distance) / 150;
                fleeVx = (dx / distance) * fleeForce * 2.5;
                fleeVy = (dy / distance) * fleeForce * 2.5;
            }
            
            this.vx = wanderVx + fleeVx;
            this.vy = wanderVy + fleeVy;
            
            this.vx *= 0.98;
            this.vy *= 0.98;
            
            this.x += this.vx;
            this.y += this.vy;
        }
        
        // Boundary collision
        const radius = this.radius;
        if (this.x < radius) {
            this.x = radius;
            if (explosionActive) {
                this.explosionVx = Math.abs(this.explosionVx) * 0.6;
            } else {
                this.vx = Math.abs(this.vx) * 0.6;
            }
        }
        if (this.x > canvas.width - radius) {
            this.x = canvas.width - radius;
            if (explosionActive) {
                this.explosionVx = -Math.abs(this.explosionVx) * 0.6;
            } else {
                this.vx = -Math.abs(this.vx) * 0.6;
            }
        }
        if (this.y < radius) {
            this.y = radius;
            if (explosionActive) {
                this.explosionVy = Math.abs(this.explosionVy) * 0.6;
            } else {
                this.vy = Math.abs(this.vy) * 0.6;
            }
        }
        if (this.y > canvas.height - radius) {
            this.y = canvas.height - radius;
            if (explosionActive) {
                this.explosionVy = -Math.abs(this.explosionVy) * 0.6;
            } else {
                this.vy = -Math.abs(this.vy) * 0.6;
            }
        }
    }
    
    draw() {
        context.save();
        context.globalAlpha = this.opacity;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.fill();
        context.closePath();
        context.restore();
    }
}

// Canvas Setup
function createCanvas() {
    canvas = document.createElement('canvas');
    canvas.id = 'particleCanvas';
    document.body.appendChild(canvas);
    context = canvas.getContext('2d');
    resizeCanvas();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Animation Loop
function animate(currentTime) {
    if (!isAnimating) return;
    
    const deltaTime = lastTime ? (currentTime - lastTime) / 1000 : 0.016;
    lastTime = currentTime;
    
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    particles.forEach(particle => {
        particle.update(deltaTime);
        particle.draw();
    });
    
    animationId = requestAnimationFrame(animate);
}

// Particle Explosion
function startParticleExplosion() {
    createCanvas();
    
    explosionStartTime = Date.now();
    
    // Create particles at center of screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const color = particleColors[Math.floor(Math.random() * particleColors.length)];
        particles.push(new Particle(centerX, centerY, color));
    }
    
    // Start animation
    isAnimating = true;
    animate();
}

// Email Copy Functionality
async function copyEmail() {
    try {
        await navigator.clipboard.writeText(EMAIL_ADDRESS);
        showToast('Copied! Now you have no excuse 😉');
        
        // Visual feedback
        emailElement.style.background = 'var(--accent)';
        emailElement.style.color = 'var(--bg)';
        
        setTimeout(() => {
            emailElement.style.background = 'rgba(218, 119, 86, 0.08)';
            emailElement.style.color = 'var(--accent)';
        }, 1000);
        
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = EMAIL_ADDRESS;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        showToast('Copied! Now you have no excuse 😉');
    }
}

// Toast Notification
function showToast(message = 'Copied! Now you have no excuse 😉') {
    toastElement.textContent = message;
    toastElement.classList.add('show');
    
    setTimeout(() => {
        toastElement.classList.remove('show');
    }, 3000);
}

// Additional Easter Egg Detection
function setupEasterEggDetection() {
    // Mouse edge detection
    let edgeHoverCount = 0;
    document.addEventListener('mousemove', (event) => {
        if (easterEggTriggered) return;
        
        const isNearEdge = (event.clientX < 50 || event.clientX > window.innerWidth - 50) &&
                          (event.clientY < 50 || event.clientY > window.innerHeight - 50);
        
        if (isNearEdge) {
            edgeHoverCount++;
            if (edgeHoverCount > 100) {
                updateHint();
                edgeHoverCount = 0;
            }
        }
    });
    
    // Right-click detection
    document.addEventListener('contextmenu', (event) => {
        if (!easterEggTriggered) {
            event.preventDefault();
            updateHint();
        }
    });
    
    // Device shake detection (mobile)
    if (window.DeviceMotionEvent) {
        let lastUpdate = new Date().getTime();
        let x = 0, y = 0, z = 0;
        let lastX = 0, lastY = 0, lastZ = 0;
        
        window.addEventListener('devicemotion', (event) => {
            if (easterEggTriggered) return;
            
            const currentTime = new Date().getTime();
            if ((currentTime - lastUpdate) > 100) {
                const timeDifference = currentTime - lastUpdate;
                lastUpdate = currentTime;
                
                x = event.accelerationIncludingGravity.x;
                y = event.accelerationIncludingGravity.y;
                z = event.accelerationIncludingGravity.z;
                
                const totalAcceleration = Math.abs(x + y + z - lastX - lastY - lastZ) / timeDifference * 10000;
                
                if (totalAcceleration > 3000) {
                    triggerEasterEgg('shake');
                }
                
                lastX = x;
                lastY = y;
                lastZ = z;
            }
        });
    }
}

// Make copyEmail function globally accessible
window.copyEmail = copyEmail;