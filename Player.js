class Player {
    constructor(scene) {
        this.scene = scene;
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.isGrounded = false;
        this.radius = 0.5;
        this.mass = 1;
        this.cameraRotation = 0;
        
        // Movement parameters
        this.moveForce = 40;
        this.airControl = 0.3;
        this.friction = {
            ground: 0.95,
            air: 0.99,
            roll: 0.98
        };
        this.jumpForce = 12;
        this.maxSpeed = {
            ground: 25,
            air: 20
        };

        // Boost mechanics
        this.boostMeter = 100;
        this.maxBoostMeter = 100;
        this.boostRechargeRate = 20;
        this.boostDrainRate = 30;
        this.isBoosting = false;
        this.boostForce = 60;
        
        // Input state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            boost: false
        };

        this.setupMesh();
        this.setupTrailEffect();
        this.setupBoostEffects();
    }

    setupMesh() {
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x3498db,
            metalness: 0.7,
            roughness: 0.3,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            envMapIntensity: 1.0
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.position.set(0, 5, 0);

        const glowGeometry = new THREE.SphereGeometry(this.radius * 1.05, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x4CA1FF,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(this.glowMesh);

        this.scene.add(this.mesh);
    }

    setupTrailEffect() {
        this.trailPoints = [];
        this.trailGeometry = new THREE.BufferGeometry();
        this.trailMaterial = new THREE.PointsMaterial({
            color: 0x4CA1FF,
            size: 0.1,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        this.trail = new THREE.Points(this.trailGeometry, this.trailMaterial);
        this.scene.add(this.trail);
    }

    setupBoostEffects() {
        this.boostParticles = [];
        this.boostParticlesGroup = new THREE.Group();
        this.scene.add(this.boostParticlesGroup);

        for (let i = 0; i < 50; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: 0x4CA1FF,
                    transparent: true,
                    opacity: 0.6,
                    blending: THREE.AdditiveBlending
                })
            );
            particle.visible = false;
            this.boostParticles.push({
                mesh: particle,
                life: 0,
                velocity: new THREE.Vector3()
            });
            this.boostParticlesGroup.add(particle);
        }
    }

    handleKeyDown(event) {
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'Space':
                if (!this.keys.jump && this.isGrounded) {
                    this.jump();
                }
                this.keys.jump = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.boost = true;
                break;
        }
    }

    handleKeyUp(event) {
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.jump = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.boost = false;
                this.isBoosting = false;
                break;
        }
    }

    setCameraRotation(rotation) {
        this.cameraRotation = rotation;
    }

    getMovementDirection() {
        const moveDirection = new THREE.Vector3(0, 0, 0);
        
        if (this.keys.forward) moveDirection.z -= 1;
        if (this.keys.backward) moveDirection.z += 1;
        if (this.keys.left) moveDirection.x -= 1;
        if (this.keys.right) moveDirection.x += 1;

        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            
            // Rotate movement direction based on camera rotation
            const rotationMatrix = new THREE.Matrix4();
            rotationMatrix.makeRotationY(this.cameraRotation);
            moveDirection.applyMatrix4(rotationMatrix);
        }

        return moveDirection;
    }

    jump() {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        this.spawnJumpParticles();
    }

    spawnJumpParticles() {
        for (let i = 0; i < 10; i++) {
            const particle = this.getInactiveBoostParticle();
            if (particle) {
                particle.mesh.position.copy(this.mesh.position);
                particle.mesh.position.y -= this.radius;
                particle.velocity.set(
                    Math.random() * 2 - 1,
                    Math.random() * 2 + 1,
                    Math.random() * 2 - 1
                );
                particle.life = 1.0;
                particle.mesh.visible = true;
            }
        }
    }

    getInactiveBoostParticle() {
        return this.boostParticles.find(p => !p.mesh.visible);
    }

    updateParticles(deltaTime) {
        this.boostParticles.forEach(particle => {
            if (particle.mesh.visible) {
                particle.life -= deltaTime * 2;
                if (particle.life <= 0) {
                    particle.mesh.visible = false;
                    return;
                }

                particle.velocity.y -= deltaTime * 9.8;
                particle.mesh.position.add(
                    particle.velocity.clone().multiplyScalar(deltaTime)
                );
                particle.mesh.material.opacity = particle.life * 0.6;
            }
        });

        this.updateTrail();
    }

    updateTrail() {
        if (this.velocity.length() > 1) {
            this.trailPoints.unshift(this.mesh.position.clone());
            if (this.trailPoints.length > 50) {
                this.trailPoints.pop();
            }

            const positions = new Float32Array(this.trailPoints.length * 3);
            const opacities = new Float32Array(this.trailPoints.length);

            this.trailPoints.forEach((point, i) => {
                positions[i * 3] = point.x;
                positions[i * 3 + 1] = point.y;
                positions[i * 3 + 2] = point.z;
                opacities[i] = 1 - (i / this.trailPoints.length);
            });

            this.trailGeometry.setAttribute('position', 
                new THREE.BufferAttribute(positions, 3));
            this.trailGeometry.setAttribute('opacity',
                new THREE.BufferAttribute(opacities, 1));
        }
    }

    update(deltaTime) {
        // Apply gravity
        this.acceleration.set(0, -25, 0);

        // Handle boost mechanics
        if (this.keys.boost && this.boostMeter > 0) {
            this.isBoosting = true;
            this.boostMeter = Math.max(0, 
                this.boostMeter - this.boostDrainRate * deltaTime);
        } else {
            this.isBoosting = false;
            this.boostMeter = Math.min(this.maxBoostMeter,
                this.boostMeter + this.boostRechargeRate * deltaTime);
        }

        // Get camera-relative movement direction
        const moveDirection = this.getMovementDirection();
        
        if (moveDirection.length() > 0) {
            const force = this.isBoosting ? this.boostForce : this.moveForce;
            moveDirection.multiplyScalar(force * (this.isGrounded ? 1 : this.airControl));
            this.acceleration.add(moveDirection);
        }

        // Update velocity
        this.velocity.add(this.acceleration.multiplyScalar(deltaTime));

        // Apply friction
        const friction = this.isGrounded ? 
            (moveDirection.length() > 0 ? this.friction.ground : this.friction.roll) : 
            this.friction.air;

        this.velocity.x *= friction;
        this.velocity.z *= friction;

        // Enforce speed limits
        const horizontalVelocity = new THREE.Vector2(this.velocity.x, this.velocity.z);
        const currentSpeed = horizontalVelocity.length();
        const maxSpeed = this.isBoosting ? 
            this.maxSpeed.ground * 1.5 : 
            (this.isGrounded ? this.maxSpeed.ground : this.maxSpeed.air);

        if (currentSpeed > maxSpeed) {
            horizontalVelocity.normalize().multiplyScalar(maxSpeed);
            this.velocity.x = horizontalVelocity.x;
            this.velocity.z = horizontalVelocity.y;
        }

        // Update position
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Update visual effects
        this.updateParticles(deltaTime);

        // Update marble rotation based on movement
        if (this.isGrounded) {
            const rotationAxis = new THREE.Vector3(
                -this.velocity.z,
                0,
                this.velocity.x
            ).normalize();
            
            const rotationAngle = this.velocity.length() * deltaTime / this.radius;
            this.mesh.rotateOnAxis(rotationAxis, rotationAngle);
        }
    }

    reset() {
        this.mesh.position.set(0, 5, 0);
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
        this.isGrounded = false;
        this.boostMeter = this.maxBoostMeter;
        this.trailPoints = [];
        this.trailGeometry.setAttribute('position', 
            new THREE.BufferAttribute(new Float32Array(0), 3));
    }

    getMesh() {
        return this.mesh;
    }

    getRadius() {
        return this.radius;
    }

    getVelocity() {
        return this.velocity;
    }

    setVelocity(newVelocity) {
        this.velocity.copy(newVelocity);
    }

    setGrounded(grounded) {
        this.isGrounded = grounded;
    }
}