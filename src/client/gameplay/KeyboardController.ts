/**
 * Dasi MMORPG - Controlador de Teclado & Física de Movimento (Client Gameplay)
 * Suporte a controles fluidos por WASD/Setas, inércia, rotação contínua e atalhos rápidos.
 */

export interface KeyboardState {
  forward: boolean;  // W / Seta Cima
  backward: boolean; // S / Seta Baixo
  left: boolean;     // A / Seta Esquerda
  right: boolean;    // D / Seta Direita
}

export interface MovementPhysicsConfig {
  maxSpeed: number;       // Velocidade máxima em m/s (ex: 5.2)
  acceleration: number;   // Taxa de aceleração em m/s² (ex: 28.0)
  deceleration: number;   // Taxa de frenagem/atrito em m/s² (ex: 32.0)
  rotationSpeed: number;  // Taxa de giro angular em rad/s (ex: 12.0)
  stepDistance: number;   // Distância percorrida para disparar som de passo (ex: 1.25)
  boundsMinX: number;
  boundsMaxX: number;
  boundsMinZ: number;
  boundsMaxZ: number;
}

export class KeyboardController {
  public keys: KeyboardState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };

  public velocity = { x: 0, z: 0 };
  public position = { x: 0, z: 0 };
  public rotationY = 0;
  public isMoving = false;

  private distanceAccumulator = 0;
  public config: MovementPhysicsConfig;

  // Callbacks de Eventos & Colisão Física
  public onFootstepCallback?: (dist: number) => void;
  public onShortcutCallback?: (shortcutKey: string) => void;
  public collisionResolver?: (curr: { x: number; z: number }, desired: { x: number; z: number }) => { x: number; z: number; collided: boolean };

  constructor(initialPosition = { x: 0, z: 0 }, config?: Partial<MovementPhysicsConfig>) {
    this.position.x = initialPosition.x;
    this.position.z = initialPosition.z;

    this.config = {
      maxSpeed: 5.6,
      acceleration: 30.0,
      deceleration: 36.0,
      rotationSpeed: 14.0,
      stepDistance: 1.2,
      boundsMinX: -19.0,
      boundsMaxX: 19.0,
      boundsMinZ: -10.5,
      boundsMaxZ: 10.5,
      ...config,
    };
  }

  /**
   * Conecta os listeners de teclado na janela do navegador
   */
  public attachListeners(targetWindow: Window = window): () => void {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora digitação em caixas de texto
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const code = e.code;
      let handled = false;

      if (code === 'KeyW' || code === 'ArrowUp') {
        this.keys.forward = true;
        handled = true;
      } else if (code === 'KeyS' || code === 'ArrowDown') {
        this.keys.backward = true;
        handled = true;
      } else if (code === 'KeyA' || code === 'ArrowLeft') {
        this.keys.left = true;
        handled = true;
      } else if (code === 'KeyD' || code === 'ArrowRight') {
        this.keys.right = true;
        handled = true;
      }

      // Atalhos de Ação Rápida
      const actionCodes = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'Space', 'KeyF', 'KeyC', 'KeyL', 'Digit1', 'Digit2', 'Digit3'];
      if (actionCodes.includes(code)) {
        if (code === 'Space') e.preventDefault();
        if (this.onShortcutCallback) {
          this.onShortcutCallback(code);
        }
      }

      if (handled) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = false;
      else if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = false;
      else if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
      else if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
    };

    targetWindow.addEventListener('keydown', handleKeyDown);
    targetWindow.addEventListener('keyup', handleKeyUp);

    // Retorna função de limpeza (cleanup)
    return () => {
      targetWindow.removeEventListener('keydown', handleKeyDown);
      targetWindow.removeEventListener('keyup', handleKeyUp);
    };
  }

  /**
   * Atualização da física cinemática de movimentação por frame
   */
  public update(deltaTime: number): {
    position: { x: number; z: number };
    rotationY: number;
    velocity: { x: number; z: number };
    speed: number;
    isMoving: boolean;
  } {
    const dt = Math.min(deltaTime, 0.1); // Clamp contra quedas bruscas de FPS

    // 1. Calcula direção de entrada (Input Vector)
    let inputX = 0;
    let inputZ = 0;

    if (this.keys.forward) inputZ -= 1;
    if (this.keys.backward) inputZ += 1;
    if (this.keys.left) inputX -= 1;
    if (this.keys.right) inputX += 1;

    // Normalização diagonal (evita correr mais rápido na diagonal)
    const inputLen = Math.hypot(inputX, inputZ);
    if (inputLen > 0.001) {
      inputX /= inputLen;
      inputZ /= inputLen;
    }

    // 2. Integração da Aceleração e Atrito (Deceleration)
    if (inputLen > 0.001) {
      // Acelera na direção do input
      const targetVx = inputX * this.config.maxSpeed;
      const targetVz = inputZ * this.config.maxSpeed;

      const ax = (targetVx - this.velocity.x) * (this.config.acceleration * dt);
      const az = (targetVz - this.velocity.z) * (this.config.acceleration * dt);

      this.velocity.x += ax;
      this.velocity.z += az;
    } else {
      // Frenagem / Atrito do solo
      const currentSpeed = Math.hypot(this.velocity.x, this.velocity.z);
      if (currentSpeed > 0.001) {
        const drop = this.config.deceleration * dt;
        const newSpeed = Math.max(0, currentSpeed - drop);
        const factor = newSpeed / currentSpeed;
        this.velocity.x *= factor;
        this.velocity.z *= factor;
      } else {
        this.velocity.x = 0;
        this.velocity.z = 0;
      }
    }

    // Clampa velocidade máxima
    const currentSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (currentSpeed > this.config.maxSpeed) {
      const clampFactor = this.config.maxSpeed / currentSpeed;
      this.velocity.x *= clampFactor;
      this.velocity.z *= clampFactor;
    }

    // 3. Aplica deslocamento na posição
    const moveDx = this.velocity.x * dt;
    const moveDz = this.velocity.z * dt;
    const prevX = this.position.x;
    const prevZ = this.position.z;
    this.position.x += moveDx;
    this.position.z += moveDz;

    // Resolução por colisão física e deslizamento elástico se registrada
    if (this.collisionResolver) {
      const res = this.collisionResolver({ x: prevX, z: prevZ }, { x: this.position.x, z: this.position.z });
      this.position.x = res.x;
      this.position.z = res.z;
    } else {
      // Limites de colisão padrão com as bordas do cenário
      this.position.x = Math.max(this.config.boundsMinX, Math.min(this.config.boundsMaxX, this.position.x));
      this.position.z = Math.max(this.config.boundsMinZ, Math.min(this.config.boundsMaxZ, this.position.z));
    }

    // 4. Giro angular em direção ao vetor de velocidade
    this.isMoving = currentSpeed > 0.15;
    if (this.isMoving) {
      const targetAngle = Math.atan2(this.velocity.x, this.velocity.z);
      // Interpolação angular contínua mais curta
      let diff = targetAngle - this.rotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      this.rotationY += diff * Math.min(1.0, this.config.rotationSpeed * dt);

      // 5. Acumulador de passos rítmicos
      this.distanceAccumulator += Math.hypot(moveDx, moveDz);
      if (this.distanceAccumulator >= this.config.stepDistance) {
        this.distanceAccumulator = 0;
        if (this.onFootstepCallback) {
          this.onFootstepCallback(this.config.stepDistance);
        }
      }
    }

    return {
      position: { x: this.position.x, z: this.position.z },
      rotationY: this.rotationY,
      velocity: { x: this.velocity.x, z: this.velocity.z },
      speed: currentSpeed,
      isMoving: this.isMoving,
    };
  }

  /**
   * Força uma nova posição imediatamente (ex: teletransporte)
   */
  public teleportTo(x: number, z: number): void {
    this.position.x = x;
    this.position.z = z;
    this.velocity.x = 0;
    this.velocity.z = 0;
    this.distanceAccumulator = 0;
  }
}
