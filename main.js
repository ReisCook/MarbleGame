// main.js
class Game {
    constructor() {
        // Detect mobile devices via user agent
        this.isMobile = /Mobi|Android/i.test(navigator.userAgent);

        this.container = document.getElementById('game-container');
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        this.deltaTime = 0;
        this.fps = 0;
        this.frames = 0;
        this.lastFpsUpdate = 0;
        
        this.setupRenderer();
        this.setupCamera();
        this.setupLights();
        this.setupUI();
        this.setupAudio(); // Background soundtrack
        
        // For mobile, add onscreen controls and device orientation support.
        if (this.isMobile) {
            this.setupMobileControls();
            this.setupDeviceOrientation();
            this.playerMovementOverride = true;
        } else {
            this.playerMovementOverride = false;
        }
        
        // Create level and player.
        this.level = new Level(this.scene);
        this.player = new Player(this.scene);
        
        // On mobile, override movement with the tilt vector.
        if (this.isMobile) {
            this.player.getMovementDirection = () => {
                return this.tiltControl.clone();
            };
        }
        
        // Desktop camera control variables (also active on mobile for camera manipulation).
        this.cameraRotation = 0;
        this.cameraVerticalRotation = Math.PI / 6; // 30° initial vertical angle
        this.minVerticalRotation = -Math.PI / 3;   // -60°
        this.maxVerticalRotation = Math.PI / 2;      // 90°
        this.cameraDistance = 20;
        this.cameraHeight = 15;
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.mouseSensitivity = 0.003;
        
        this.setupEventListeners();
        this.addResumeAudioListener(); // Resume audio & request full screen on first user tap.
        this.animate();
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance",
            alpha: true,
            stencil: false,
            depth: true
        });
        
        this.renderer.setPixelRatio(1);
        this.renderer.info.autoReset = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.preserveDrawingBuffer = false;
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 15, 20);
        this.cameraTarget = new THREE.Vector3();
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(50, 50, 50);
        this.sunLight.castShadow = true;
        
        this.sunLight.shadow.camera.near = 0.1;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -50;
        this.sunLight.shadow.camera.right = 50;
        this.sunLight.shadow.camera.top = 50;
        this.sunLight.shadow.camera.bottom = -50;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.bias = -0.0001;
        
        this.scene.add(this.sunLight);

        const fillLight1 = new THREE.DirectionalLight(0x9999ff, 0.2);
        fillLight1.position.set(-50, 20, -50);
        this.scene.add(fillLight1);

        const fillLight2 = new THREE.DirectionalLight(0xff9999, 0.2);
        fillLight2.position.set(50, 20, -50);
        this.scene.add(fillLight2);
    }

    setupUI() {
        this.ui = {
            fps: document.createElement('div'),
            speed: document.createElement('div'),
            gems: document.createElement('div'),
            time: document.createElement('div')
        };

        Object.values(this.ui).forEach(element => {
            element.style.position = 'fixed';
            element.style.padding = '10px';
            element.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            element.style.color = 'white';
            element.style.fontFamily = 'Arial, sans-serif';
            element.style.fontSize = '16px';
            element.style.borderRadius = '5px';
            element.style.zIndex = '1000';
        });

        this.ui.fps.style.top = '40px';
        this.ui.fps.style.left = '10px';
        
        this.ui.speed.style.top = '10px';
        this.ui.speed.style.right = '10px';
        
        this.ui.gems.style.bottom = '10px';
        this.ui.gems.style.left = '10px';
        
        this.ui.time.style.bottom = '10px';
        this.ui.time.style.right = '10px';

        Object.values(this.ui).forEach(element => {
            document.body.appendChild(element);
        });

        this.gameStartTime = Date.now();
    }

    setupAudio() {
        // Create an AudioListener and attach it to the camera.
        this.audioListener = new THREE.AudioListener();
        this.camera.add(this.audioListener);
        
        // Create a global audio source.
        this.backgroundSound = new THREE.Audio(this.audioListener);
        
        // Load the sound and configure it.
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('audio/foregone-destruction.mp3', (buffer) => {
            this.backgroundSound.setBuffer(buffer);
            this.backgroundSound.setLoop(true);
            this.backgroundSound.setVolume(0.5);
            this.backgroundSound.play();
        });
    }

    addResumeAudioListener() {
        // Modern browsers require a user gesture to resume the AudioContext.
        // Also, request full screen (using appropriate prefixes) on first tap.
        this.fullScreenRequested = false;
        document.body.addEventListener('click', () => {
            if (this.audioListener.context.state === 'suspended') {
                this.audioListener.context.resume();
            }
            if (!this.fullScreenRequested) {
                this.fullScreenRequested = true;
                let elem = document.documentElement;
                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                } else if (elem.webkitRequestFullscreen) {
                    elem.webkitRequestFullscreen();
                } else if (elem.msRequestFullscreen) {
                    elem.msRequestFullscreen();
                }
            }
        });
    }

    setupMobileControls() {
        // Create onscreen buttons for Jump and Boost on mobile.
        this.jumpButton = document.createElement('button');
        this.jumpButton.textContent = "Jump";
        this.jumpButton.style.position = 'fixed';
        this.jumpButton.style.bottom = '80px';
        this.jumpButton.style.right = '20px';
        this.jumpButton.style.padding = '20px';
        this.jumpButton.style.fontSize = '18px';
        this.jumpButton.style.borderRadius = '50%';
        document.body.appendChild(this.jumpButton);

        this.boostButton = document.createElement('button');
        this.boostButton.textContent = "Boost";
        this.boostButton.style.position = 'fixed';
        this.boostButton.style.bottom = '20px';
        this.boostButton.style.right = '20px';
        this.boostButton.style.padding = '20px';
        this.boostButton.style.fontSize = '18px';
        this.boostButton.style.borderRadius = '50%';
        document.body.appendChild(this.boostButton);

        // Jump action on touch or mouse down.
        this.jumpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.player.jump();
        });
        this.jumpButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.player.jump();
        });

        // Boost action: press and hold to boost, release to stop.
        this.boostButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.player.keys.boost = true;
        });
        this.boostButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.player.keys.boost = false;
        });
        this.boostButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.player.keys.boost = true;
        });
        this.boostButton.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.player.keys.boost = false;
        });
    }

    setupDeviceOrientation() {
        // Initialize a vector to hold tilt data.
        this.tiltControl = new THREE.Vector3(0, 0, 0);
        // For iOS 13+ devices, request permission for device orientation events.
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this), false);
                    }
                })
                .catch(console.error);
        } else {
            window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this), false);
        }
    }

    handleDeviceOrientation(event) {
        // event.gamma: left/right tilt; event.beta: front/back tilt.
        let tiltX = THREE.MathUtils.clamp(event.gamma / 30, -1, 1);
        let tiltZ = THREE.MathUtils.clamp(event.beta / 30, -1, 1);
        // In portrait mode, a forward tilt moves the marble forward (negative Z).
        this.tiltControl.set(tiltX, 0, -tiltZ);
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        window.addEventListener('keydown', (e) => {
            this.player.handleKeyDown(e);
            if (e.code === 'KeyR') {
                this.resetLevel();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.player.handleKeyUp(e);
        });

        this.renderer.domElement.addEventListener('mousedown', (e) => {
            if (e.button === 2) { // Right mouse button for camera control.
                this.isMouseDown = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        this.renderer.domElement.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                this.isMouseDown = false;
            }
        });

        this.renderer.domElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (this.isMouseDown) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                this.cameraRotation += deltaX * this.mouseSensitivity;
                this.cameraVerticalRotation -= deltaY * this.mouseSensitivity;
                
                // Clamp vertical rotation.
                this.cameraVerticalRotation = Utils.clamp(
                    this.cameraVerticalRotation,
                    this.minVerticalRotation,
                    this.maxVerticalRotation
                );
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        this.renderer.domElement.addEventListener('wheel', (e) => {
            this.cameraDistance = Math.max(10, Math.min(30, 
                this.cameraDistance + e.deltaY * 0.01));
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateCamera() {
        const playerPos = this.player.getMesh().position;
        
        // Calculate camera position using spherical coordinates.
        const horizontalDistance = Math.cos(this.cameraVerticalRotation) * this.cameraDistance;
        const verticalDistance = Math.sin(this.cameraVerticalRotation) * this.cameraDistance;
        
        const cameraX = Math.sin(this.cameraRotation) * horizontalDistance;
        const cameraZ = Math.cos(this.cameraRotation) * horizontalDistance;
        const cameraY = verticalDistance;
        
        const targetPosition = new THREE.Vector3(
            playerPos.x + cameraX,
            playerPos.y + cameraY,
            playerPos.z + cameraZ
        );
        
        this.camera.position.lerp(targetPosition, 0.1);
        this.camera.lookAt(playerPos);

        this.player.setCameraRotation(this.cameraRotation);
    }

    updateFPS() {
        this.frames++;
        const now = performance.now();
        
        if (now - this.lastFpsUpdate > 1000) {
            this.fps = Math.round((this.frames * 1000) / (now - this.lastFpsUpdate));
            this.lastFpsUpdate = now;
            this.frames = 0;
            this.ui.fps.textContent = `FPS: ${this.fps}`;
        }
    }

    updateUI() {
        const speed = Math.round(this.player.getVelocity().length() * 100) / 100;
        this.ui.speed.textContent = `Speed: ${speed.toFixed(2)}`;
        
        const collectedGems = this.level.initialGemCount - this.level.gems.length;
        this.ui.gems.textContent = `Gems: ${collectedGems}/${this.level.initialGemCount}`;
        
        const currentTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(currentTime / 60);
        const seconds = currentTime % 60;
        this.ui.time.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    resetLevel() {
        this.level.resetLevel();
        this.player.reset();
        this.gameStartTime = Date.now();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        this.deltaTime = this.clock.getDelta();
        
        this.player.update(this.deltaTime);
        this.level.update(this.deltaTime);
        this.level.checkCollisions(this.player);
        this.updateCamera();
        this.updateFPS();
        this.updateUI();
        
        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('load', () => {
    const game = new Game();
});
