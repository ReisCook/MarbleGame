class Level {
    constructor(scene) {
        this.scene = scene;
        this.platforms = [];
        this.walls = [];
        this.gems = [];
        this.startPad = null;
        this.finishPad = null;
        
        // Material configurations
        this.materials = {
            platform: new THREE.MeshPhongMaterial({
                color: 0x95a5a6,
                shininess: 50,
                specular: 0x444444
            }),
            startPad: new THREE.MeshPhongMaterial({
                color: 0x2ecc71,
                shininess: 80,
                specular: 0x88ff88
            }),
            finishPad: new THREE.MeshPhongMaterial({
                color: 0xe74c3c,
                shininess: 80,
                specular: 0xff8888
            }),
            ramp: new THREE.MeshPhongMaterial({
                color: 0x7f8c8d,
                shininess: 40,
                specular: 0x555555
            }),
            gem: new THREE.MeshPhongMaterial({
                color: 0x3498db,
                shininess: 100,
                specular: 0xffffff,
                transparent: true,
                opacity: 0.9
            })
        };

        this.createLevel();
        this.createSpaceEnvironment();
    }

    createLevel() {
        this.createStartingArea();
        this.createFirstChallengeSection();
        this.createMiddleSection();
        this.createFinalChallenge();
        this.addBoundaryWalls();
    }

    createStartingArea() {
        // Main starting platform
        const startPlatform = new THREE.Mesh(
            new THREE.BoxGeometry(15, 1, 15),
            this.materials.platform
        );
        startPlatform.position.set(0, -0.5, 0);
        startPlatform.receiveShadow = true;
        this.scene.add(startPlatform);
        this.platforms.push(startPlatform);

        // Start pad
        const startPad = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 0.2, 32),
            this.materials.startPad
        );
        startPad.position.set(0, 0, 0);
        startPad.receiveShadow = true;
        this.scene.add(startPad);
        this.startPad = startPad;

        // Initial gentle slope
        const initialSlope = new THREE.Mesh(
            new THREE.BoxGeometry(8, 1, 15),
            this.materials.ramp
        );
        initialSlope.position.set(10, 0, 0);
        initialSlope.rotation.z = -Math.PI / 24; // 7.5 degrees
        initialSlope.receiveShadow = true;
        this.scene.add(initialSlope);
        this.platforms.push(initialSlope);
    }

    createFirstChallengeSection() {
        // First platform after slope
        const platform1 = new THREE.Mesh(
            new THREE.BoxGeometry(12, 1, 12),
            this.materials.platform
        );
        platform1.position.set(20, 1, 0);
        platform1.receiveShadow = true;
        this.scene.add(platform1);
        this.platforms.push(platform1);

        // Create connecting bridge
        const bridge = new THREE.Mesh(
            new THREE.BoxGeometry(8, 1, 4),
            this.materials.platform
        );
        bridge.position.set(30, 1.5, 0);
        bridge.receiveShadow = true;
        this.scene.add(bridge);
        this.platforms.push(bridge);

        // Elevated platform with slight tilt
        const platform2 = new THREE.Mesh(
            new THREE.BoxGeometry(15, 1, 15),
            this.materials.platform
        );
        platform2.position.set(40, 2, 0);
        platform2.rotation.z = Math.PI / 32;
        platform2.receiveShadow = true;
        this.scene.add(platform2);
        this.platforms.push(platform2);

        // Add gems in this section
        this.createGem(20, 2, -3);
        this.createGem(20, 2, 3);
        this.createGem(40, 3.5, 0);
    }

    createMiddleSection() {
        // Safe path (left side)
        this.createSafePath();
        
        // Speed path (right side)
        this.createSpeedPath();
        
        // Convergence platform
        const convergePlatform = new THREE.Mesh(
            new THREE.BoxGeometry(20, 1, 20),
            this.materials.platform
        );
        convergePlatform.position.set(80, 5, 0);
        convergePlatform.receiveShadow = true;
        this.scene.add(convergePlatform);
        this.platforms.push(convergePlatform);
    }

    createSafePath() {
        // Series of connected wide platforms with gentle slopes
        const positions = [
            { x: 55, y: 2.5, z: -15 },
            { x: 65, y: 3, z: -20 },
            { x: 75, y: 4, z: -15 },
            { x: 80, y: 4.5, z: -8 }
        ];

        positions.forEach((pos, index) => {
            const platform = new THREE.Mesh(
                new THREE.BoxGeometry(12, 1, 12),
                this.materials.platform
            );
            platform.position.set(pos.x, pos.y, pos.z);
            platform.receiveShadow = true;
            this.scene.add(platform);
            this.platforms.push(platform);

            if (index < positions.length - 1) {
                this.createConnectingBridge(
                    pos,
                    positions[index + 1]
                );
            }

            // Add gems along safe path
            if (index % 2 === 0) {
                this.createGem(pos.x, pos.y + 1.5, pos.z);
            }
        });
    }

    createSpeedPath() {
        // Series of smaller, more challenging platforms
        const positions = [
            { x: 55, y: 2.5, z: 15 },
            { x: 65, y: 3.5, z: 20 },
            { x: 75, y: 4.5, z: 15 },
            { x: 80, y: 5, z: 8 }
        ];

        positions.forEach((pos, index) => {
            const platform = new THREE.Mesh(
                new THREE.BoxGeometry(8, 1, 8),
                this.materials.platform
            );
            platform.position.set(pos.x, pos.y, pos.z);
            platform.receiveShadow = true;
            this.scene.add(platform);
            this.platforms.push(platform);

            // Add gems along speed path
            if (index % 2 === 1) {
                this.createGem(pos.x, pos.y + 1.5, pos.z);
            }
        });
    }

    createConnectingBridge(start, end) {
        const length = Math.sqrt(
            Math.pow(end.x - start.x, 2) +
            Math.pow(end.z - start.z, 2)
        );

        const bridge = new THREE.Mesh(
            new THREE.BoxGeometry(length, 0.5, 4),
            this.materials.ramp
        );

        bridge.position.set(
            (start.x + end.x) / 2,
            (start.y + end.y) / 2,
            (start.z + end.z) / 2
        );

        bridge.lookAt(new THREE.Vector3(end.x, end.y, end.z));
        bridge.receiveShadow = true;
        this.scene.add(bridge);
        this.platforms.push(bridge);
    }

    createFinalChallenge() {
        // Final approach platform
        const approachPlatform = new THREE.Mesh(
            new THREE.BoxGeometry(20, 1, 20),
            this.materials.platform
        );
        approachPlatform.position.set(100, 6, 0);
        approachPlatform.receiveShadow = true;
        this.scene.add(approachPlatform);
        this.platforms.push(approachPlatform);

        // Final jump ramp
        const finalRamp = new THREE.Mesh(
            new THREE.BoxGeometry(10, 1, 15),
            this.materials.ramp
        );
        finalRamp.position.set(110, 6.5, 0);
        finalRamp.rotation.z = Math.PI / 12; // 15 degrees
        finalRamp.receiveShadow = true;
        this.scene.add(finalRamp);
        this.platforms.push(finalRamp);

        // Finish platform
        const finishPlatform = new THREE.Mesh(
            new THREE.BoxGeometry(15, 1, 15),
            this.materials.platform
        );
        finishPlatform.position.set(125, 8, 0);
        finishPlatform.receiveShadow = true;
        this.scene.add(finishPlatform);
        this.platforms.push(finishPlatform);

        // Finish pad
        const finishPad = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 0.2, 32),
            this.materials.finishPad
        );
        finishPad.position.set(125, 8.5, 0);
        finishPad.receiveShadow = true;
        this.scene.add(finishPad);
        this.finishPad = finishPad;

        // Final gem
        this.createGem(125, 10, 0);
    }

    createGem(x, y, z) {
        const gemGeometry = new THREE.OctahedronGeometry(0.5);
        const gem = new THREE.Mesh(gemGeometry, this.materials.gem);
        gem.position.set(x, y, z);
        gem.castShadow = true;
        gem.userData.rotationSpeed = 0.02;
        gem.userData.floatSpeed = 0.002;
        gem.userData.floatHeight = y;
        this.scene.add(gem);
        this.gems.push(gem);
    }

    addBoundaryWalls() {
        const wallHeight = 10;
        const wallThickness = 2;
        const wallMaterial = new THREE.MeshPhongMaterial({
            color: 0x34495e,
            transparent: true,
            opacity: 0.3
        });

        // Create boundary walls
        const wallGeometries = [
            // Left wall
            { size: [wallThickness, wallHeight, 150], position: [-10, wallHeight/2, 0] },
            // Right wall
            { size: [wallThickness, wallHeight, 150], position: [140, wallHeight/2, 0] },
            // Back wall
            { size: [150, wallHeight, wallThickness], position: [65, wallHeight/2, -30] },
            // Front wall
            { size: [150, wallHeight, wallThickness], position: [65, wallHeight/2, 30] }
        ];

        wallGeometries.forEach(wall => {
            const geometry = new THREE.BoxGeometry(...wall.size);
            const mesh = new THREE.Mesh(geometry, wallMaterial);
            mesh.position.set(...wall.position);
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.walls.push(mesh);
        });
    }

    update(deltaTime) {
        // Update gem rotations and floating animations
        this.gems.forEach(gem => {
            gem.rotation.y += gem.userData.rotationSpeed;
            gem.position.y = gem.userData.floatHeight + 
                Math.sin(Date.now() * gem.userData.floatSpeed) * 0.5;
        });

        // Add this for rotating stars
        if (this.starSystem) {
            this.starSystem.rotation.y += deltaTime * 0.01;
        }

        // Add any additional level animations or updates here
    }

    checkCollisions(player) {
        // Existing collision checks for platforms and walls
        this.checkPlatformCollisions(player);
        this.checkWallCollisions(player);
        
        // Check gem collections
        this.checkGemCollisions(player);
        
        // Check start/finish pad interactions
        this.checkPadInteractions(player);
    }

    checkPlatformCollisions(player) {
        const playerMesh = player.getMesh();
        const playerRadius = player.getRadius();
        const playerVelocity = player.getVelocity();
        
        let isGrounded = false;
        
        for (const platform of this.platforms) {
            const platformBox = new THREE.Box3().setFromObject(platform);
            
            // Check if player is above the platform
            if (playerMesh.position.x >= platformBox.min.x &&
                playerMesh.position.x <= platformBox.max.x &&
                playerMesh.position.z >= platformBox.min.z &&
                playerMesh.position.z <= platformBox.max.z) {
                
                const playerBottom = playerMesh.position.y - playerRadius;
                const platformTop = platformBox.max.y;
                
                // Ground collision
                if (playerBottom <= platformTop && 
                    playerMesh.position.y + playerRadius > platformTop) {
                    playerMesh.position.y = platformTop + playerRadius;
                    playerVelocity.y = 0;
                    isGrounded = true;
                    break;
                }
            }
        }
        
        player.setGrounded(isGrounded);
    }

    checkWallCollisions(player) {
        const playerMesh = player.getMesh();
        const playerRadius = player.getRadius();
        
        for (const wall of this.walls) {
            const wallBox = new THREE.Box3().setFromObject(wall);
            const penetration = this.checkSphereCubeCollision(
                playerMesh.position,
                playerRadius,
                wallBox
            );

            if (penetration) {
                playerMesh.position.add(penetration);
                const velocity = player.getVelocity();
                const normal = penetration.clone().normalize();
                const dot = velocity.dot(normal);
                
                if (dot < 0) {
                    normal.multiplyScalar(dot);
                    velocity.sub(normal);
                    velocity.multiplyScalar(0.8);
                }
            }
        }
    }

    checkGemCollisions(player) {
        const playerMesh = player.getMesh();
        const playerRadius = player.getRadius();

        this.gems = this.gems.filter(gem => {
            const distance = playerMesh.position.distanceTo(gem.position);
            if (distance < playerRadius + 1) {
                this.scene.remove(gem);
                // Trigger gem collection effect/sound here
                return false;
            }
            return true;
        });
    }

    checkPadInteractions(player) {
        const playerMesh = player.getMesh();
        const position = playerMesh.position;

        // Check start pad
        if (this.startPad) {
            const startDistance = position.distanceTo(this.startPad.position);
            if (startDistance < 2) {
                // Trigger start pad effect
            }
        }

        // Check finish pad
        if (this.finishPad) {
            const finishDistance = position.distanceTo(this.finishPad.position);
            if (finishDistance < 2) {
                // Trigger level completion
            }
        }
    }

    checkSpherePlatformCollision(sphereCenter, sphereRadius, platformBox, platformRotation) {
        // Transform sphere position to account for platform rotation
        const rotatedPosition = sphereCenter.clone();
        if (platformRotation) {
            rotatedPosition.applyEuler(platformRotation);
        }

        const closestPoint = rotatedPosition.clone().clamp(
            platformBox.min,
            platformBox.max
        );
        
        const distance = sphereCenter.distanceTo(closestPoint);
        return distance < sphereRadius;
    }

    checkSphereCubeCollision(sphereCenter, sphereRadius, cubeBox) {
        const closestPoint = new THREE.Vector3(
            Math.max(cubeBox.min.x, Math.min(sphereCenter.x, cubeBox.max.x)),
            Math.max(cubeBox.min.y, Math.min(sphereCenter.y, cubeBox.max.y)),
            Math.max(cubeBox.min.z, Math.min(sphereCenter.z, cubeBox.max.z))
        );
        
        const distance = sphereCenter.distanceTo(closestPoint);
        
        if (distance < sphereRadius) {
            const penetrationVector = sphereCenter.clone().sub(closestPoint);
            penetrationVector.normalize();
            penetrationVector.multiplyScalar(sphereRadius - distance);
            return penetrationVector;
        }
        
        return null;
    }

    // Level completion and reset methods
    completeLevel() {
        // Calculate final score based on time and gems collected
        const completionTime = Date.now() - this.startTime;
        const gemsCollected = this.initialGemCount - this.gems.length;
        
        return {
            completionTime,
            gemsCollected,
            perfectScore: gemsCollected === this.initialGemCount
        };
    }

    resetLevel() {
        // Reset all dynamic elements
        this.gems.forEach(gem => {
            this.scene.remove(gem);
        });
        this.gems = [];
        
        // Recreate gems in original positions
        this.createAllGems();
        
        // Reset timers and counters
        this.startTime = null;
        this.initialGemCount = this.gems.length;
    }

    // Visual effects methods
    createGemSparkle(position) {
        const sparkleCount = 8;
        const sparkles = [];

        for (let i = 0; i < sparkleCount; i++) {
            const angle = (i / sparkleCount) * Math.PI * 2;
            const sparkle = new THREE.Mesh(
                new THREE.PlaneGeometry(0.2, 0.2),
                new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 1,
                    side: THREE.DoubleSide
                })
            );

            sparkle.position.copy(position);
            sparkle.userData.angle = angle;
            sparkle.userData.distance = 0;
            sparkle.userData.speed = 0.1 + Math.random() * 0.1;
            sparkles.push(sparkle);
            this.scene.add(sparkle);
        }

        return sparkles;
    }

    updateSparkles(sparkles, deltaTime) {
        sparkles.forEach((sparkle, index) => {
            sparkle.userData.distance += sparkle.userData.speed;
            sparkle.position.x += Math.cos(sparkle.userData.angle) * sparkle.userData.speed;
            sparkle.position.y += Math.sin(sparkle.userData.angle) * sparkle.userData.speed;
            sparkle.material.opacity -= deltaTime * 2;

            if (sparkle.material.opacity <= 0) {
                this.scene.remove(sparkle);
                sparkles.splice(index, 1);
            }
        });
    }

    // Helper methods for level generation
    createRoundedPlatform(width, depth, radius) {
        const shape = new THREE.Shape();
        
        shape.moveTo(-width/2 + radius, -depth/2);
        shape.lineTo(width/2 - radius, -depth/2);
        shape.quadraticCurveTo(width/2, -depth/2, width/2, -depth/2 + radius);
        shape.lineTo(width/2, depth/2 - radius);
        shape.quadraticCurveTo(width/2, depth/2, width/2 - radius, depth/2);
        shape.lineTo(-width/2 + radius, depth/2);
        shape.quadraticCurveTo(-width/2, depth/2, -width/2, depth/2 - radius);
        shape.lineTo(-width/2, -depth/2 + radius);
        shape.quadraticCurveTo(-width/2, -depth/2, -width/2 + radius, -depth/2);

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 1,
            bevelEnabled: true,
            bevelSegments: 3,
            steps: 1,
            bevelSize: 0.1,
            bevelThickness: 0.1
        });

        return new THREE.Mesh(geometry, this.materials.platform);
    }

    createSmoothSlope(startPoint, endPoint, width) {
        const points = [];
        const segments = 10;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            points.push(new THREE.Vector3(
                THREE.MathUtils.lerp(startPoint.x, endPoint.x, t),
                THREE.MathUtils.lerp(startPoint.y, endPoint.y, t),
                THREE.MathUtils.lerp(startPoint.z, endPoint.z, t)
            ));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, segments, width/2, 8, false);
        
        return new THREE.Mesh(geometry, this.materials.ramp);
    }

    // Environmental effects
    addAtmosphericEffects() {
        // Add fog to the scene
        this.scene.fog = new THREE.FogExp2(0x95a5a6, 0.01);

        // Add ambient particles
        this.createAmbientParticles();
    }

    createAmbientParticles() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = Math.random() * 200 - 100;
            positions[i + 1] = Math.random() * 50;
            positions[i + 2] = Math.random() * 200 - 100;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.5
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    // Level state management
    save() {
        return {
            gems: this.gems.map(gem => ({
                position: gem.position.toArray(),
                rotation: gem.rotation.toArray(),
                collected: false
            })),
            startTime: this.startTime,
            initialGemCount: this.initialGemCount
        };
    }

    load(saveData) {
        this.resetLevel();
        
        if (saveData.gems) {
            this.gems = saveData.gems.map(gemData => {
                const gem = this.createGem(
                    gemData.position[0],
                    gemData.position[1],
                    gemData.position[2]
                );
                gem.rotation.fromArray(gemData.rotation);
                return gem;
            });
        }

        this.startTime = saveData.startTime;
        this.initialGemCount = saveData.initialGemCount;
    }

    createSpaceEnvironment() {
        this.createSkybox();
        this.createStarfield();
    }
    
    createSkybox() {
        const loader = new THREE.CubeTextureLoader();
        const skyboxTextures = [
            'skybox/space_right.png',
            'skybox/space_left.png',
            'skybox/space_top.png',
            'skybox/space_bottom.png',
            'skybox/space_front.png',
            'skybox/space_back.png'
        ];
        
        const skybox = loader.load(skyboxTextures);
        this.scene.background = skybox;
    }
    
    createStarfield() {
        const starCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        
        for(let i = 0; i < starCount * 3; i += 3) {
            const radius = Math.random() * 400 + 200;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 2,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.starSystem = new THREE.Points(geometry, material);
        this.scene.add(this.starSystem);
    }
}
