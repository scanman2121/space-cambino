// Space Shooting Game in P5.js
// All assets are drawn using P5.js functions, no imports

// Global variables
let playerX, playerY, playerSize;
let enemies = [];
let bullets = [];
let stars = [];
let score = 0;
let lives = 2;
let gameOver = false;
let lastShotTime = 0;
let shootCooldown = 500; // milliseconds
let enemyTimer = 0;
let enemyInterval = 1000; // milliseconds
let level = 1;
let bossActive = false;
let boss = null;
let levelScore = 0;
let scoreToNextLevel = 200; // Doubled from 100 to 200 for first level
let gameOverBlinkTimer = 0;
let gameOverVisible = true;
let powerUps = [];
let playerShield = 0;
let playerWeaponLevel = 1;
let particles = [];
let powerUpTimer = 0;
let powerUpDuration = 10000; // 10 seconds in milliseconds
let powerUpActive = false;
let normalShootCooldown = 500; // Store the normal cooldown
let shotsFired = 0;
let shotsHit = 0;
let killCount = 0;
let killsForPowerUp = 3; // Base number of kills needed for a power-up
let objectsDestroyed = 0; // Track objects destroyed for power-up spawning
let objectsNeededForPowerUp = 6; // Increased from 3 to 6 objects needed
let playerMaxHealth = 100;
let playerHealth = 100;
let healthBarWidth = 150;
let healthBarHeight = 15;
let healthRegenRate = 0.05; // Small health regeneration when not taking damage
let lastDamageTime = 0;
let damageImmunityTime = 1000; // Brief immunity after taking damage (milliseconds)
let healthFlashTimer = 0; // For flashing effect when taking damage
let bossTimeLimit = 20; // 20 seconds for level 1 boss
let bossTimer = 0; // Current time remaining
let bossTimerStarted = false; // Flag to track if timer has started
let bossTimerFlashing = false; // For warning effect
let bossTimerMs = 0; // Track milliseconds for more precise timing
let isMobileDevice = false;
let mobileGraphicAngle = 0;

// Fix the Supabase client initialization
const SUPABASE_URL = 'https://oofyemkmdslsenmxefzu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZnllbWttZHNsc2VubXhlZnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NTU3MzcsImV4cCI6MjA1NjQzMTczN30.ZHwN148IMjou4sd1zsLrQJbvfUJpSn4w2dDCDBSf1U8';

// Add game state variables for leaderboard
let gameState = 'welcome'; // 'welcome', 'playing', 'gameOver', 'leaderboard'
let leaderboardData = [];
let initialsInput;
let submitButton;
let cancelButton;
let initialsModal;

// Declare supabaseClient as a global variable
let supabaseClient;

// Setup function: Initialize the canvas and game variables
function setup() {
  // Create a larger canvas
  createCanvas(800, 600);
  // Center the canvas on the page
  let canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.style.display = 'block';
    canvas.style.margin = 'auto';
  }
  
  // Check if user is on a mobile device
  isMobileDevice = detectMobileDevice();
  
  // Initialize Supabase client properly
  try {
    if (window.supabase) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log("Supabase client initialized successfully");
      
      // Simpler test query
      supabaseClient
        .from('leaderboard')
        .select('*')
        .limit(1)
        .then(response => {
          console.log("Supabase connection test:", response);
          // Now fetch the actual leaderboard data
          fetchLeaderboard();
        })
        .catch(error => {
          console.error("Supabase connection test failed:", error);
        });
    } else {
      console.error("Supabase is not available globally");
    }
  } catch (error) {
    console.error("Error initializing Supabase client:", error);
  }
  
  playerX = width / 2;
  playerY = height - 30;
  playerSize = 25;
  createStars();
  enemyTimer = millis();
  textFont('monospace');
  
  // Initialize health
  playerHealth = playerMaxHealth;
  
  // Setup leaderboard UI elements
  initialsModal = document.getElementById('initialsModal');
  initialsInput = document.getElementById('initialsInput');
  submitButton = document.getElementById('submitScore');
  cancelButton = document.getElementById('cancelSubmit');
  
  // Add event listeners
  submitButton.addEventListener('click', submitScore);
  cancelButton.addEventListener('click', cancelScoreSubmit);
}

// Create the starfield background
function createStars() {
  for (let i = 0; i < 100; i++) {
    let star = {
      x: random(width),
      y: random(height),
      size: random(1, 3),
      speed: random(0.3, 1.2)
    };
    stars.push(star);
  }
}

// Main game loop
function draw() {
  // Create a dark gradient background
  drawGradientBackground();
  
  if (isMobileDevice) {
    drawMobileWarning();
    return; // Don't proceed with the rest of the game
  }
  
  if (gameState === 'welcome') {
    updateStars();
    drawStars();
    drawWelcomeScreen();
  } else if (gameState === 'playing') {
  if (!gameOver) {
      // Regenerate health slowly when not recently damaged
      if (millis() - lastDamageTime > 5000 && playerHealth < playerMaxHealth) {
        playerHealth = min(playerHealth + healthRegenRate, playerMaxHealth);
      }
      
    updateStars();
    drawStars();
    movePlayer();
    updateBullets();
      updateParticles();
      updatePowerUps();
      
      // Check if it's time for a boss
      if (levelScore >= scoreToNextLevel && !bossActive) {
        spawnBoss();
        createExplosion(width/2, 50, 100, color(255, 0, 0));
      }
      
      if (bossActive) {
        updateBoss();
        drawBoss();
      } else {
    updateEnemies();
        drawEnemies();
      }
      
    checkCollisions();
    drawPlayer();
    drawBullets();
      drawPowerUps();
      drawParticles();
    drawScoreAndLives();
      drawLevel();
  } else {
      updateStars();
      drawStars();
      updateParticles();
      drawParticles();
    drawGameOver();
    }
  } else if (gameState === 'leaderboard') {
    updateStars();
    drawStars();
    drawLeaderboard();
  }
}

// Replace the gradient background with a mesh gradient
function drawGradientBackground() {
  // Create a mesh gradient background with purple and dark blue
  let time = frameCount * 0.01;
  
  // Draw the background in tiles for better performance
  let tileSize = 50;
  
  // Make sure we cover the entire canvas including edges
  for (let x = 0; x <= width; x += tileSize) {
    for (let y = 0; y <= height; y += tileSize) {
      // Create a flowing pattern based on position and time
      let xOff = x * 0.01;
      let yOff = y * 0.01;
      let noiseVal = noise(xOff + time, yOff + time * 0.5) * 1.5;
      
      // Map noise to color
      let r = map(noiseVal, 0, 1, 20, 60);  // Dark purple to blue
      let g = map(noiseVal, 0, 1, 0, 20);
      let b = map(noiseVal, 0, 1, 50, 100);
      
      fill(r, g, b);
      noStroke();
      
      // Draw slightly larger rectangles to avoid gaps
      rect(x, y, tileSize + 1, tileSize + 1);
    }
  }
}

// Update star positions for scrolling effect
function updateStars() {
  for (let star of stars) {
    star.y += star.speed;
    if (star.y > height) {
      star.y = 0;
      star.x = random(width);
    }
  }
}

// Draw the starfield with glow effects
function drawStars() {
  noStroke();
  for (let star of stars) {
    // Add glow effect to some stars
    if (star.size > 2) {
      fill(200, 200, 255, 50);
      ellipse(star.x, star.y, star.size * 2, star.size * 2);
    }
    fill(255); // White stars
    ellipse(star.x, star.y, star.size, star.size);
  }
}

// Move the player's spaceship with arrow keys
function movePlayer() {
  if (keyIsDown(LEFT_ARROW)) {
    playerX -= 5;
    // Add engine particle effect when moving
    createParticle(playerX + 10, playerY, 2, color(200, 200, 255, 150), 10);
  }
  if (keyIsDown(RIGHT_ARROW)) {
    playerX += 5;
    // Add engine particle effect when moving
    createParticle(playerX - 10, playerY, 2, color(200, 200, 255, 150), 10);
  }
  playerX = constrain(playerX, 10, width - 10); // Keep player on screen
}

// Create a bullet when shooting
function createBullet() {
  shotsFired++;
  
  // Different bullet patterns based on weapon level
  if (playerWeaponLevel === 1) {
    // Single bullet
  let bullet = {
    x: playerX,
    y: playerY - playerSize,
      speed: 6,
      damage: 1
  };
  bullets.push(bullet);
  } else if (playerWeaponLevel === 2) {
    // Double bullet
    bullets.push({
      x: playerX - 5,
      y: playerY - playerSize,
      speed: 6,
      damage: 1
    });
    bullets.push({
      x: playerX + 5,
      y: playerY - playerSize,
      speed: 6,
      damage: 1
    });
    shotsFired++; // Count as two shots
  } else {
    // Triple bullet spread
    bullets.push({
      x: playerX,
      y: playerY - playerSize,
      speed: 7,
      damage: 2
    });
    bullets.push({
      x: playerX - 8,
      y: playerY - playerSize + 5,
      speed: 6,
      damage: 1,
      xSpeed: -0.5
    });
    bullets.push({
      x: playerX + 8,
      y: playerY - playerSize + 5,
      speed: 6,
      damage: 1,
      xSpeed: 0.5
    });
    shotsFired += 2; // Count as three shots
  }
  
  // Add muzzle flash effect
  createParticle(playerX, playerY - 15, 5, color(0, 255, 0, 200), 10);
}

// Update bullet positions
function updateBullets() {
  for (let bullet of bullets) {
    bullet.y -= bullet.speed;
    
    // Handle diagonal bullets
    if (bullet.xSpeed) {
      bullet.x += bullet.xSpeed;
    }
    
    // Add trail effect to bullets
    if (random() > 0.5) {
      createParticle(bullet.x, bullet.y + 5, 1, color(0, 255, 0, 100), 5);
    }
  }
  bullets = bullets.filter(bullet => bullet.y > 0); // Remove off-screen bullets
}

// Create a new enemy with different types
function createEnemy() {
  let type = random(['basic', 'scout', 'bomber']);
  
  // Adjust enemy type distribution based on level
  // Higher levels have more tough enemies
  if (level >= 3) {
    // At level 3+, more bombers and scouts
    if (random() < 0.6) {
      type = random(['bomber', 'scout']);
    }
  }
  
  let enemy = {
    x: random(10, width - 10),
    y: 0,
    type: type,
    health: type === 'basic' ? 1 + Math.floor(level/3) : 
            (type === 'scout' ? 2 + Math.floor(level/2) : 
             3 + level), // Bombers get tougher faster
    speed: type === 'basic' ? random(1, 2 + level * 0.2) : 
           (type === 'scout' ? random(2, 3 + level * 0.3) : 
            random(0.5, 1 + level * 0.15)),
    size: type === 'basic' ? 20 : (type === 'scout' ? 15 : 30),
    shootTimer: 0,
    shootInterval: type === 'bomber' ? 2000 / (1 + level * 0.1) : 0 // Bombers shoot faster at higher levels
  };
  enemies.push(enemy);
}

// Update enemy positions and spawn rate based on level
function updateEnemies() {
  // Spawn enemies more frequently as level increases
  if (millis() - enemyTimer > enemyInterval / (1 + level * 0.2) && !bossActive) {
    createEnemy();
    enemyTimer = millis();
  }
  
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    
    // Handle boss projectiles
    if (enemy.isBossProjectile) {
      // Move projectile based on velocity
      enemy.x += enemy.vx || 0;
      enemy.y += enemy.vy || 3;
      
      // Remove if off screen
      if (enemy.y > height || enemy.y < 0 || enemy.x < 0 || enemy.x > width) {
        enemies.splice(i, 1);
        continue;
      }
      
      // Check for collision with player
      let d = dist(enemy.x, enemy.y, playerX, playerY);
      if (d < ((enemy.size || 10)/2 + 15)) { // Player hit by boss projectile
        // Create explosion
        createExplosion(enemy.x, enemy.y, 20, color(255, 100, 0));
        
        // Remove the projectile
        enemies.splice(i, 1);
        
        // Only shield protects from damage, not weapon power-up
        if (playerShield > 0) {
          playerShield--;
          createFloatingText(playerX, playerY - 20, "SHIELD HIT!", color(255, 50, 50));
        } else if (millis() - lastDamageTime > damageImmunityTime) {
          // Apply damage to health
          let damageAmount = 20; // Boss projectiles do more damage
          
          playerHealth -= damageAmount;
          lastDamageTime = millis();
          healthFlashTimer = 30; // Start health bar flashing
          
          // Create damage indicator
          createFloatingText(playerX, playerY - 20, "-" + damageAmount, color(255, 0, 0));
          
          // Create life lost effect if health is low
          if (playerHealth <= 30) {
            createLifeLostEffect();
          }
          
          if (playerHealth <= 0) {
            gameOver = true;
            // Create big explosion at player position
            createExplosion(playerX, playerY, 50, color(255, 200, 0));
          }
        }
        continue;
      }
      
      continue;
    }
    
    // Basic movement for regular enemies
    enemy.y += enemy.speed;
    
    // Special movement for scout type (zigzag)
    if (enemy.type === 'scout') {
      enemy.x += sin(frameCount * 0.1) * 2;
    }
    
    // Bomber type can shoot
    if (enemy.type === 'bomber' && enemy.shootTimer < millis()) {
      // Create enemy projectile
      let projectile = {
        x: enemy.x,
        y: enemy.y + enemy.size/2,
        vy: 3,
        isBossProjectile: true
      };
      enemies.push(projectile);
      enemy.shootTimer = millis() + enemy.shootInterval;
      
      // Add muzzle flash effect
      createParticle(enemy.x, enemy.y + 15, 5, color(255, 0, 0, 200), 10);
    }
    
    // Check for collision with player
    let d = dist(enemy.x, enemy.y, playerX, playerY);
    if (d < (enemy.size/2 + 10)) {
      // Create explosion
      createExplosion(enemy.x, enemy.y, 20, color(255, 100, 0));
      
      enemies.splice(i, 1);
      
      // Only shield protects from damage, not weapon power-up
      if (playerShield > 0) {
        playerShield--;
        createFloatingText(playerX, playerY - 20, "SHIELD HIT!", color(255, 50, 50));
      } else if (millis() - lastDamageTime > damageImmunityTime) {
        // Apply damage to health
        let damageAmount = enemy.type === 'bomber' ? 30 : 
                          (enemy.type === 'scout' ? 20 : 15);
        
        playerHealth -= damageAmount;
        lastDamageTime = millis();
        healthFlashTimer = 30; // Start health bar flashing
        
        // Create damage indicator
        createFloatingText(playerX, playerY - 20, "-" + damageAmount, color(255, 0, 0));
        
        // Create life lost effect if health is low
        if (playerHealth <= 30) {
          createLifeLostEffect();
        }
        
        if (playerHealth <= 0) {
          gameOver = true;
          // Create big explosion at player position
          createExplosion(playerX, playerY, 50, color(255, 200, 0));
        }
      }
      continue;
    }
    
    // Remove enemies that go off screen without penalty
    if (enemy.y > height) {
      enemies.splice(i, 1);
    }
  }
}

// Create a power-up
function createPowerUp(x, y, type) {
  // Add health power-up type
  if (!type) {
    let types = ['shield', 'weapon', 'health'];
    type = random(types);
  }
  
  let powerUp = {
    x: x,
    y: y,
    type: type,
    size: 20,
    speed: 1,
    rotation: 0,
    isPowerUp: true
  };
  
  powerUps.push(powerUp);
}

// Update power-ups
function updatePowerUps() {
  // Check if active weapon power-up has expired
  if (powerUpActive && millis() - powerUpTimer > powerUpDuration) {
    powerUpActive = false;
    shootCooldown = normalShootCooldown; // Reset cooldown to normal
    playerWeaponLevel = 1; // Reset weapon level
    // Visual feedback when power-up expires
    createParticle(playerX, playerY, 30, color(50, 100, 255, 150), 30);
    createFloatingText(playerX, playerY - 30, "WEAPON NORMAL", color(50, 100, 255));
  }
  
  for (let i = powerUps.length - 1; i >= 0; i--) {
    let powerUp = powerUps[i];
    powerUp.y += powerUp.speed;
    powerUp.rotation += 0.05;
    
    // Check for collision with player
    let d = dist(powerUp.x, powerUp.y, playerX, playerY);
    if (d < (powerUp.size + 15)) {
      // Apply power-up effect
      if (powerUp.type === 'shield') {
        // Red shield - gives player shield
        playerShield = min(playerShield + 2, 3);
        createParticle(playerX, playerY, 20, color(255, 50, 50, 150), 30);
        createFloatingText(playerX, playerY - 30, "SHIELD UP!", color(255, 50, 50));
      } else if (powerUp.type === 'weapon') {
        // Blue weapon - activates super shooter without shield effect
        powerUpActive = true;
        powerUpTimer = millis();
        shootCooldown = 100; // Super fast shooting
        playerWeaponLevel = 3; // Maximum weapon level
        createParticle(playerX, playerY, 20, color(50, 100, 255, 150), 30);
        createFloatingText(playerX, playerY - 30, "SUPER SHOOTER!", color(50, 100, 255));
      } else if (powerUp.type === 'health') {
        // Green health - restores player health
        let healAmount = 30;
        playerHealth = min(playerHealth + healAmount, playerMaxHealth);
        createParticle(playerX, playerY, 20, color(50, 255, 50, 150), 30);
        createFloatingText(playerX, playerY - 30, "+" + healAmount + " HEALTH!", color(50, 255, 50));
      }
      
      // Remove power-up
      powerUps.splice(i, 1);
      continue;
    }
    
    // Remove power-ups that go off screen
    if (powerUp.y > height) {
      powerUps.splice(i, 1);
    }
  }
}

// Update the drawPowerUps function to show health power-ups
function drawPowerUps() {
  for (let powerUp of powerUps) {
    push();
    translate(powerUp.x, powerUp.y);
    rotate(powerUp.rotation);
    
    // Outer glow
    noFill();
    strokeWeight(2);
    
    // Different colors based on power-up type
    if (powerUp.type === 'shield') {
      // Red shield power-up
      stroke(255, 50, 50, 150 + sin(frameCount * 0.1) * 50);
      ellipse(0, 0, powerUp.size * 2, powerUp.size * 2);
      
      // Inner shield icon
      fill(255, 50, 50);
      noStroke();
      arc(0, 0, powerUp.size, powerUp.size, PI, TWO_PI);
      rect(-powerUp.size/2, 0, powerUp.size, powerUp.size/2);
    } else if (powerUp.type === 'weapon') {
      // Blue weapon power-up
      stroke(50, 100, 255, 150 + sin(frameCount * 0.1) * 50);
      ellipse(0, 0, powerUp.size * 2, powerUp.size * 2);
      
      // Inner weapon icon
      fill(50, 100, 255);
      noStroke();
      rect(-powerUp.size/4, -powerUp.size/2, powerUp.size/2, powerUp.size);
      triangle(-powerUp.size/2, powerUp.size/2, 
               powerUp.size/2, powerUp.size/2, 
               0, -powerUp.size/2);
    } else if (powerUp.type === 'health') {
      // Green health power-up
      stroke(50, 255, 50, 150 + sin(frameCount * 0.1) * 50);
      ellipse(0, 0, powerUp.size * 2, powerUp.size * 2);
      
      // Inner health cross icon
      fill(50, 255, 50);
      noStroke();
      rect(-powerUp.size/4, -powerUp.size/2, powerUp.size/2, powerUp.size);
      rect(-powerUp.size/2, -powerUp.size/4, powerUp.size, powerUp.size/2);
    }
    
    pop();
  }
}

// Create a particle effect
function createParticle(x, y, size, color, life) {
  let particle = {
    x: x,
    y: y,
    size: size,
    color: color,
    life: life,
    maxLife: life,
    vx: random(-1, 1),
    vy: random(-1, 1)
  };
  particles.push(particle);
}

// Create an explosion (multiple particles)
function createExplosion(x, y, size, color) {
  for (let i = 0; i < 20; i++) {
    let particle = {
      x: x,
      y: y,
      size: random(2, size/5),
      color: color,
      life: random(20, 40),
      maxLife: 40,
      vx: random(-3, 3),
      vy: random(-3, 3)
    };
    particles.push(particle);
  }
}

// Update particles
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    
    // Handle floating text
    if (p.message) {
      p.y += p.velocity;
      p.life--;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
      continue;
    }
    
    // Regular particles
    p.size *= 0.9;
    p.life--;
    
    if (p.life <= 0 || p.size < 0.5) {
      particles.splice(i, 1);
    }
  }
}

// Draw particles
function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    
    // Handle different particle types
    if (p.type === 'screenFlash') {
      // Full screen flash effect
      fill(255, 0, 0, p.alpha);
      rect(0, 0, width, height);
      p.alpha -= 6;
    } else if (p.type === 'shockwave') {
      // Expanding ring
      noFill();
      stroke(red(p.color), green(p.color), blue(p.color), p.alpha);
      strokeWeight(3);
      ellipse(p.x, p.y, p.size, p.size);
      p.size += (p.maxSize - p.size) * 0.1;
      p.alpha -= 5;
      noStroke();
    } else if (p.type === 'timeSlow') {
      // Visual indicator for time slow
      textAlign(CENTER);
      textSize(14);
      fill(255, 255, 255, map(p.life, 60, 0, 255, 0));
      text("TIME SLOW", width/2, height - 20);
      p.life--;
    } else if (p.type === 'particle') {
      // Regular particle
      fill(p.color);
      ellipse(p.x, p.y, p.size, p.size);
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life--;
    } else if (p.message) {
      // Floating text
      fill(p.color);
      textAlign(CENTER);
      textSize(16);
      text(p.message, p.x, p.y);
      p.y += p.velocity;
      p.life--;
    }
    
    // Remove dead particles
    if ((p.life !== undefined && p.life <= 0) || 
        (p.alpha !== undefined && p.alpha <= 0)) {
      particles.splice(i, 1);
    }
  }
}

// Update the spawnBoss function to initialize the timer with milliseconds
function spawnBoss() {
  bossActive = true;
  bossTimerStarted = true;
  // Convert to milliseconds for more precise timing
  bossTimerMs = (bossTimeLimit - Math.floor(level/2)) * 1000; // Reduce time for higher levels
  bossTimerMs = max(bossTimerMs, 10000); // Minimum 10 seconds even at high levels
  
  boss = {
    x: width / 2,
    y: 80,
    size: 100,
    health: level * 20,
    maxHealth: level * 20,
    direction: 1,
    speed: 2,
    shootTimer: millis(),
    shootInterval: 800, // Shoot more frequently than regular enemies
    selfDestructTimer: bossTimerMs, // Store timer in boss object
    lastTimerUpdate: millis() // Track last update time
  };
  
  // Announce boss arrival with timer warning
  createFloatingText(width/2, height/2 - 50, "LEVEL " + level + " BOSS!", color(255, 0, 0));
  createFloatingText(width/2, height/2 - 20, "BOSS SELF-DESTRUCT IN " + (bossTimerMs/1000).toFixed(1) + " SECONDS!", color(255, 150, 0));
}

// Update the updateBoss function to use millisecond precision
function updateBoss() {
  if (!boss) return; // Safety check
  
  // Update boss timer with millisecond precision
  let currentTime = millis();
  let deltaTime = currentTime - boss.lastTimerUpdate;
  boss.selfDestructTimer -= deltaTime;
  boss.lastTimerUpdate = currentTime;
  
  // Create warning effects as time runs low
  if (boss.selfDestructTimer <= 5000 && frameCount % 10 === 0) { // More frequent warnings in last 5 seconds
    bossTimerFlashing = true;
    
    // Create warning effect
    if (boss.selfDestructTimer <= 3000) {
      // Add pulsing effect to boss when close to exploding
      let pulseSize = sin(frameCount * 0.2) * 10;
      boss.displaySize = boss.size + pulseSize;
      
      // Add particle effects around boss
      let angle = random(TWO_PI);
      let distance = boss.size/2;
      createParticle(
        boss.x + cos(angle) * distance,
        boss.y + sin(angle) * distance,
        random(5, 10),
        color(255, random(0, 100), 0, 200),
        15
      );
    }
    
    // More intense warnings in last 3 seconds
    if (boss.selfDestructTimer <= 3000 && frameCount % 15 === 0) {
      createFloatingText(
        boss.x + random(-30, 30),
        boss.y + random(-30, 30),
        (boss.selfDestructTimer/1000).toFixed(1) + "s!",
        color(255, 0, 0, 200)
      );
    }
  }
  
  // Time's up!
  if (boss.selfDestructTimer <= 0) {
    // Create massive explosion
    createExplosion(boss.x, boss.y, 200, color(255, 0, 0));
    
    // Create screen-wide shockwave
    particles.push({
      type: 'shockwave',
      x: width/2,
      y: height/2,
      size: 10,
      maxSize: width,
      alpha: 200,
      life: 60,
      color: color(255, 50, 50)
    });
    
    // Kill the player
    playerHealth = 0;
        gameOver = true;
    
    // Create explosion at player position
    createExplosion(playerX, playerY, 50, color(255, 200, 0));
    
    // Show message
    createFloatingText(width/2, height/2, "BOSS SELF-DESTRUCTED!", color(255, 0, 0));
    
    // Reset boss
    bossActive = false;
    boss = null;
    bossTimerStarted = false;
    return;
  }
  
  // Move boss back and forth
  boss.x += boss.direction * boss.speed;
  
  // Change direction when reaching edges
  if (boss.x > width - boss.size/2 || boss.x < boss.size/2) {
    boss.direction *= -1;
  }
  
  // Boss shooting logic - simple pattern that works reliably
  if (millis() - boss.shootTimer > boss.shootInterval) {
    // Create 3 projectiles in a spread pattern
    for (let i = -1; i <= 1; i++) {
      let projectile = {
        x: boss.x + (i * 20),
        y: boss.y + boss.size/2,
        vy: 4,
        vx: i * 1.5,
        size: 15,
        isBossProjectile: true
      };
      enemies.push(projectile);
    }
    
    boss.shootTimer = millis();
    
    // Visual feedback for shooting
    createParticle(boss.x, boss.y + boss.size/2, 15, color(255, 0, 0, 150), 15);
  }
}

// Update the drawBoss function to show the timer on the boss
function drawBoss() {
  if (!boss) return; // Safety check
  
  // Use the display size if available (for pulsing effect)
  let displaySize = boss.displaySize || boss.size;
  
  push();
  translate(boss.x, boss.y);
  
  // Draw warning glow around boss when time is running low
  if (boss.selfDestructTimer < 5000) {
    let glowIntensity = map(boss.selfDestructTimer, 0, 5000, 150, 50);
    let glowSize = displaySize * 1.2;
    fill(255, 0, 0, glowIntensity);
    ellipse(0, 0, glowSize, glowSize);
  }
  
  // Boss body
  fill(150, 0, 0);
  ellipse(0, 0, displaySize, displaySize);
  
  // Boss armor plates
  fill(100, 0, 0);
  beginShape();
  for (let i = 0; i < 8; i++) {
    let angle = i * TWO_PI / 8;
    let radius = displaySize * 0.4;
    vertex(cos(angle) * radius, sin(angle) * radius);
  }
  endShape(CLOSE);
  
  // Draw boss eyes
  fill(255, 255, 0);
  ellipse(-20, -15, 20, 20);
  ellipse(20, -15, 20, 20);
  
  // Draw angry pupils
  fill(0);
  ellipse(-20, -15, 10, 10);
  ellipse(20, -15, 10, 10);
  
  // Draw mouth
  fill(0);
  arc(0, 20, 50, 30, 0, PI);
  
  // Draw teeth
  fill(255);
  for (let i = -20; i <= 20; i += 10) {
    triangle(i, 20, i + 5, 35, i - 5, 35);
  }
  
  // Draw self-destruct timer directly on the boss
  let timerSeconds = (boss.selfDestructTimer / 1000).toFixed(1);
  
  // Make timer more prominent and alarming
  textSize(24);
  textAlign(CENTER, CENTER);
  
  // Create a background for the timer
  fill(0, 0, 0, 150);
  ellipse(0, -40, 70, 30);
  
  // Make timer flash red/yellow when time is running low
  if (boss.selfDestructTimer < 5000) {
    if (frameCount % 10 < 5) {
      fill(255, 0, 0);
    } else {
      fill(255, 255, 0);
    }
  } else {
    fill(255);
  }
  
  // Draw the timer with seconds and decimal
  text(timerSeconds + "s", 0, -40);
  
  pop();
  
  // Draw health bar
  fill(50);
  rectMode(CORNER);
  rect(width/2 - 100, 10, 200, 15);
  
  // Health bar color changes as health decreases
  let healthPercent = boss.health / boss.maxHealth;
  let healthBarColor = color(
    map(healthPercent, 0, 1, 255, 0),
    map(healthPercent, 0, 1, 0, 255),
    0
  );
  
  fill(healthBarColor);
  rect(width/2 - 100, 10, healthPercent * 200, 15);
  
  // Health text
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(12);
  text(Math.ceil(boss.health) + "/" + boss.maxHealth, width/2, 18);
  
  rectMode(CENTER);
}

// Update the checkCollisions function to handle boss damage
function checkCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
      let bullet = bullets[i];
    let bulletHit = false; // Track if bullet hit something
    
    // Check boss collision
    if (bossActive && boss) {
      let d = dist(bullet.x, bullet.y, boss.x, boss.y);
      if (d < boss.size/2) {
        bullets.splice(i, 1);
        boss.health -= bullet.damage || 1;
        shotsHit++; // Count as a hit
        
        // Visual feedback
        createParticle(bullet.x, bullet.y, 10, color(255, 100, 0, 200), 20);
        
        // Boss defeated
        if (boss.health <= 0) {
          bossActive = false;
          level += 1;
          score += level * 50;
          levelScore = 0;
          
          // Make next level significantly harder
          scoreToNextLevel = 150 * level; // Scale with level
          
          // Restore health when defeating boss
          let healAmount = playerMaxHealth * 0.3; // Heal 30% of max health
          playerHealth = min(playerHealth + healAmount, playerMaxHealth);
          createFloatingText(playerX, playerY - 40, "+" + Math.ceil(healAmount) + " HEALTH!", color(50, 255, 50));
          
          // Create explosion and always drop a power-up for boss
          createExplosion(boss.x, boss.y, 100, color(255, 100, 0));
          
          // Boss always drops a power-up
          let powerType = random() > 0.5 ? 'shield' : 'weapon';
          createPowerUp(boss.x, boss.y, powerType);
          
          // Count as multiple objects for power-up tracking
          objectsDestroyed += 3;
          
          // Show level up message
          createFloatingText(width/2, height/2 - 50, "LEVEL " + level + "!", color(255, 255, 0));
          createFloatingText(width/2, height/2 - 20, "ENEMIES STRONGER!", color(255, 150, 0));
        }
        
        bulletHit = true;
        continue;
      }
    }
    
    // IMPORTANT: No power-up collision check here - power-ups can't be hit
    
    if (bulletHit) continue;
    
    // Check enemy collisions
    for (let j = enemies.length - 1; j >= 0; j--) {
      let enemy = enemies[j];
      
      // Skip power-ups completely - ensure they can't be hit
      if (enemy.isPowerUp) continue;
      
      // Allow shooting boss projectiles
      if (enemy.isBossProjectile) {
      let d = dist(bullet.x, bullet.y, enemy.x, enemy.y);
        if (d < 10) { // Boss projectile hit
        bullets.splice(i, 1);
          enemies.splice(j, 1);
          
          // Create small explosion
          createExplosion(enemy.x, enemy.y, 10, color(255, 200, 0));
          
          // Add points
          score += 2;
          
          // Visual feedback
          createFloatingText(enemy.x, enemy.y, "+2", color(255, 255, 0));
          
          // Count as an object destroyed
          objectsDestroyed++;
          checkForPowerUpSpawn(enemy.x, enemy.y);
          
          bulletHit = true;
          break;
        }
        continue;
      }
      
      // Regular enemy collisions - make sure we can hit all enemy types
      if (enemy.type) {
        let d = dist(bullet.x, bullet.y, enemy.x, enemy.y);
        if (d < (enemy.size ? enemy.size/2 : 15)) {
          bullets.splice(i, 1);
          shotsHit++; // Count as a hit
          
          if (enemy.health) {
            enemy.health -= bullet.damage || 1;
            
            // Visual feedback for hit
            createParticle(bullet.x, bullet.y, 5, color(255, 255, 0, 200), 10);
            
            if (enemy.health <= 0) {
              createExplosion(enemy.x, enemy.y, enemy.size, color(255, 100, 0));
              
              // Count as an object destroyed
              objectsDestroyed++;
              checkForPowerUpSpawn(enemy.x, enemy.y);
              
        enemies.splice(j, 1);
        score += 10;
              levelScore += 10;
            }
          } else {
        enemies.splice(j, 1);
        score += 10;
            levelScore += 10;
            
            // Count as an object destroyed
            objectsDestroyed++;
            checkForPowerUpSpawn(enemy.x, enemy.y);
          }
          bulletHit = true;
          break;
        }
      }
    }
  }
}

// Helper function to check if it's time to spawn a power-up
function checkForPowerUpSpawn(x, y) {
  if (objectsDestroyed >= objectsNeededForPowerUp) {
    objectsDestroyed = 0;
    let powerType = random() > 0.5 ? 'shield' : 'weapon';
    createPowerUp(x, y, powerType);
  }
}

// Draw the player's spaceship with shield and effects
function drawPlayer() {
  // Draw shield if active
  if (playerShield > 0) {
    noFill();
    strokeWeight(2);
    
    // Red shield when shield power-up is active
    let r = 150 + sin(frameCount * 0.1) * 100;
    stroke(r, 50, 50, 150);
    
    ellipse(playerX, playerY, 50, 50);
    
    // Show shield count
    fill(255, 50, 50);
    noStroke();
    textSize(10);
    text("×" + playerShield, playerX + 20, playerY - 15);
  }
  
  // Draw weapon power-up effect separately
  if (powerUpActive) {
    // Blue glow for weapon power-up
    noFill();
    strokeWeight(2);
    let b = 150 + sin(frameCount * 0.1) * 100;
    stroke(50, 100, b, 150);
    
    // Draw weapon power-up effect (different from shield)
    beginShape();
    for (let i = 0; i < 8; i++) {
      let angle = i * TWO_PI / 8;
      let radius = 25 + sin(frameCount * 0.2 + i) * 3;
      vertex(playerX + cos(angle) * radius, playerY + sin(angle) * radius);
    }
    endShape(CLOSE);
    
    // Show power-up timer
    let remainingTime = (powerUpDuration - (millis() - powerUpTimer)) / 1000;
    if (remainingTime > 0) {
      fill(50, 100, 255);
      noStroke();
      textSize(10);
      text(ceil(remainingTime) + "s", playerX, playerY - 30);
    }
  }
  
  // Engine glow
  noStroke();
  fill(0, 100, 255, 50 + sin(frameCount * 0.2) * 20);
  ellipse(playerX, playerY + 10, 20, 30);
  
  // Ship body
  fill(200, 200, 255);
  triangle(playerX - 10, playerY, playerX + 10, playerY, playerX, playerY - 20);
  
  // Wings
  fill(150, 150, 200);
  rect(playerX - 15, playerY - 5, 5, 10);
  rect(playerX + 10, playerY - 5, 5, 10);
  
  // Weapon upgrades visual
  if (playerWeaponLevel >= 2 || powerUpActive) {
    fill(0, 255, 0, 150);
    ellipse(playerX - 10, playerY - 5, 5, 5);
    ellipse(playerX + 10, playerY - 5, 5, 5);
  }
}

// Draw bullets as green laser lines with glow
function drawBullets() {
  for (let bullet of bullets) {
    // Glow effect
    noStroke();
    fill(0, 255, 0, 100);
    ellipse(bullet.x, bullet.y - 5, 6, 12);
    
    // Bullet
    stroke(0, 255, 0);
    strokeWeight(2);
    line(bullet.x, bullet.y, bullet.x, bullet.y - 10);
  }
  noStroke();
}

// Draw enemies with different appearances based on type
function drawEnemies() {
  for (let enemy of enemies) {
    if (enemy.isBossProjectile) {
      // Draw boss projectile
      fill(255, 0, 0);
      noStroke();
      ellipse(enemy.x, enemy.y, enemy.size || 10, enemy.size || 10);
      
      // Add glow effect
      fill(255, 100, 100, 100);
      ellipse(enemy.x, enemy.y, (enemy.size || 10) + 5, (enemy.size || 10) + 5);
      
      // Add trail effect
      if (random() > 0.5) {
        createParticle(enemy.x, enemy.y, 3, color(255, 0, 0, 100), 10);
      }
      
      continue;
    }
    
    // Draw regular enemies
    if (enemy.type === 'basic') {
      // Basic alien - simple design
      push();
      translate(enemy.x, enemy.y);
      
      // Body
      fill(255, 0, 0);
      ellipse(0, 0, enemy.size, enemy.size);
      
      // Eyes
      fill(255);
      ellipse(-5, -5, 8, 8);
      ellipse(5, -5, 8, 8);
      
      // Pupils
      fill(0);
      ellipse(-5, -5, 4, 4);
      ellipse(5, -5, 4, 4);
      
      // Mouth
      fill(0);
      arc(0, 3, 8, 5, 0, PI);
      noStroke();
      
      pop();
    } else if (enemy.type === 'scout') {
      // Scout alien - triangular ship with green pilot
      push();
      translate(enemy.x, enemy.y);
      
      // Ship body
      fill(100, 100, 100);
      triangle(-enemy.size/2, enemy.size/2, 
               enemy.size/2, enemy.size/2, 
               0, -enemy.size/2);
      
      // Cockpit
      fill(50, 255, 50, 150);
      ellipse(0, 0, enemy.size * 0.6, enemy.size * 0.6);
      
      // Alien inside
      fill(0, 180, 0);
      ellipse(0, 0, enemy.size * 0.4, enemy.size * 0.4);
      
      // Alien eyes
      fill(255, 255, 0);
      ellipse(-3, -2, 3, 3);
      ellipse(3, -2, 3, 3);
      
      pop();
    } else if (enemy.type === 'bomber') {
      // Bomber alien - larger with tentacles
      push();
      translate(enemy.x, enemy.y);
      
      // Body
      fill(20, 150, 20);
      ellipse(0, 0, enemy.size, enemy.size);
      
      // Eyes
      fill(255, 0, 0);
      ellipse(-8, -8, 8, 8);
      ellipse(8, -8, 8, 8);
      
      // Pupils
      fill(0);
      ellipse(-8, -8, 4, 4);
      ellipse(8, -8, 4, 4);
      
      // Mouth
      fill(0);
      arc(0, 5, 16, 10, 0, PI);
      
      // Tentacles
      stroke(20, 150, 20);
      strokeWeight(3);
      
      // Wavy tentacles using sin function and frameCount for animation
      for (let i = 0; i < 6; i++) {
        let angle = map(i, 0, 6, 0, TWO_PI);
        let x1 = cos(angle) * enemy.size/2;
        let y1 = sin(angle) * enemy.size/2;
        
        let waveOffset = sin(frameCount * 0.1 + i) * 5;
        let x2 = cos(angle) * (enemy.size/2 + 10) + waveOffset;
        let y2 = sin(angle) * (enemy.size/2 + 10);
        
        line(x1, y1, x2, y2);
        
        // Tentacle tips
        noStroke();
        fill(20, 150, 20);
        ellipse(x2, y2, 5, 5);
      }
      
      noStroke();
      pop();
    }
  }
}

// Update the drawScoreAndLives function to show health bar instead of lives
function drawScoreAndLives() {
  fill(255);
  textSize(16);
  textAlign(LEFT);
  text("Score: " + score, 10, 20);
  
  // Draw health bar in bottom right
  drawHealthBar();
  
  textAlign(CENTER);
  text("Level: " + level, width / 2, 20);
  
  // Show progress to next level if not fighting boss
  if (!bossActive) {
    textSize(12);
    text("Next boss: " + levelScore + "/" + scoreToNextLevel, width / 2, 40);
  }
}

// Add a new function to draw the health bar
function drawHealthBar() {
  // Position in bottom right
  let barX = width - healthBarWidth - 20;
  let barY = height - 30;
  
  // Background of health bar
  noStroke();
  fill(50);
  rect(barX, barY, healthBarWidth, healthBarHeight, 5);
  
  // Calculate health percentage
  let healthPercent = playerHealth / playerMaxHealth;
  
  // Determine color based on health level
  let healthColor;
  if (healthPercent > 0.6) {
    healthColor = color(0, 255, 0); // Green for high health
  } else if (healthPercent > 0.3) {
    healthColor = color(255, 255, 0); // Yellow for medium health
  } else {
    healthColor = color(255, 0, 0); // Red for low health
  }
  
  // Flash effect when taking damage
  if (healthFlashTimer > 0) {
    healthColor = lerpColor(healthColor, color(255, 255, 255), sin(frameCount * 0.5) * 0.5 + 0.5);
    healthFlashTimer--;
  }
  
  // Health bar fill
  fill(healthColor);
  rect(barX, barY, healthBarWidth * healthPercent, healthBarHeight, 5);
  
  // Health text
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(12);
  text(Math.ceil(playerHealth) + "/" + playerMaxHealth, barX + healthBarWidth/2, barY + healthBarHeight/2);
}

// Display level information
function drawLevel() {
  // Progress bar for next boss
  if (!bossActive) {
    fill(50);
    rectMode(CORNER);
    rect(width/2 - 100, 50, 200, 5);
    
    fill(0, 255, 0);
    let progressWidth = map(levelScore, 0, scoreToNextLevel, 0, 200);
    rect(width/2 - 100, 50, progressWidth, 5);
    rectMode(CENTER);
  }
}

// Display game over screen with blinking text
function drawGameOver() {
  // Blink the game over text
  if (frameCount % 30 === 0) {
    gameOverVisible = !gameOverVisible;
  }
  
  if (gameOverVisible) {
    fill(255, 0, 0); // Red text
  } else {
    fill(200, 0, 0); // Darker red when blinking
  }
  
  textSize(32);
  textAlign(CENTER, CENTER);
  text("GAME OVER", width / 2, height / 2 - 40);
  
  fill(255);
  textSize(24);
  text("Final Score: " + score, width / 2, height / 2);
  
  textSize(16);
  text("Press ENTER to submit your score", width / 2, height / 2 + 40);
  text("Press R to Restart", width / 2, height / 2 + 70);
  text("Press L to view Leaderboard", width / 2, height / 2 + 100);
}

// Handle key presses for shooting, restarting, and leaderboard
function keyPressed() {
  if (keyCode === 32 && !gameOver && gameState === 'playing' && millis() - lastShotTime > shootCooldown) { // Spacebar to shoot
    createBullet();
    lastShotTime = millis();
  }
  
  if (gameOver && gameState === 'playing') {
    if (keyCode === 82) { // 'R' to restart
    restartGame();
    } else if (keyCode === 76) { // 'L' to view leaderboard
      gameState = 'leaderboard';
    } else if (keyCode === ENTER) { // ENTER to submit score
      showInitialsInput();
    }
  } else if (gameState === 'leaderboard') {
    if (keyCode === 82 || keyCode === ESCAPE) { // 'R' or ESC to return to game
      restartGame();
      gameState = 'playing';
    }
  }
}

// Mouse click handler for leaderboard buttons
function mousePressed() {
  if (gameState === 'welcome') {
    // Check if Play Now button is clicked (centered button)
    if (mouseX > width / 2 - 80 && mouseX < width / 2 + 80 &&
        mouseY > height - 100 && mouseY < height - 50) {
      gameState = 'playing';
    }
    
    // Check if View Full Leaderboard link is clicked
    if (mouseX > width / 2 - 90 && mouseX < width / 2 + 90 &&
        mouseY > 469 && mouseY < 489) {
      gameState = 'leaderboard';
    }
  } else if (gameState === 'leaderboard') {
    // Check if Play button is clicked (centered button)
    if (mouseX > width / 2 - 170 && mouseX < width / 2 - 30 &&
        mouseY > height - 80 && mouseY < height - 30) {
      restartGame();
      gameState = 'playing';
    }
    
    // Check if Home button is clicked (centered button)
    if (mouseX > width / 2 + 30 && mouseX < width / 2 + 170 &&
        mouseY > height - 80 && mouseY < height - 30) {
      restartGame();
      gameState = 'welcome';
    }
  }
}

// Show the initials input modal
function showInitialsInput() {
  initialsModal.style.display = 'flex';
  initialsInput.value = '';
  initialsInput.focus();
}

// Submit score to Supabase
async function submitScore() {
  if (!supabaseClient) {
    console.error("Supabase client not initialized");
    alert("Error: Database connection not available");
    initialsModal.style.display = 'none';
    return;
  }
  
  const initials = initialsInput.value.toUpperCase();
  
  // Validate initials
  if (initials.length === 0) {
    alert('Please enter your initials');
    return;
  }
  
  if (initials.length > 3) {
    alert('Please enter at most 3 characters');
    return;
  }
  
  // Hide modal
  initialsModal.style.display = 'none';
  
  try {
    console.log("Submitting score:", { initials, score, level });
    
    // Insert score into Supabase
    const { data, error } = await supabaseClient
      .from('leaderboard')
      .insert([
        { 
          initials: initials,
          score: score,
          level: level
        }
      ])
      .select();
    
    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }
    
    console.log("Score submitted successfully:", data);
    
    // Show success message
    createFloatingText(width/2, height/2, "SCORE SUBMITTED!", color(0, 255, 0));
    
    // Refresh leaderboard and show it
    await fetchLeaderboard();
    gameState = 'leaderboard';
    
  } catch (error) {
    console.error('Error submitting score:', error);
    createFloatingText(width/2, height/2, "ERROR SUBMITTING SCORE", color(255, 0, 0));
  }
}

// Cancel score submission
function cancelScoreSubmit() {
  initialsModal.style.display = 'none';
}

// Fetch leaderboard data from Supabase
async function fetchLeaderboard() {
  if (!supabaseClient) {
    console.error("Supabase client not initialized");
    return;
  }
  
  try {
    console.log("Fetching leaderboard data...");
    
    // Get top 10 scores
    const { data, error } = await supabaseClient
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }
    
    console.log("Leaderboard data received:", data);
    
    if (data) {
      leaderboardData = data;
    } else {
      console.warn("No leaderboard data received");
      leaderboardData = [];
    }
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    leaderboardData = [];
  }
}

// Restart the game
function restartGame() {
  enemies = [];
  bullets = [];
  playerX = width / 2;
  playerHealth = playerMaxHealth;
  score = 0;
  level = 1;
  bossActive = false;
  boss = null;
  levelScore = 0;
  scoreToNextLevel = 200;
  playerShield = 0;
  playerWeaponLevel = 1;
  gameOver = false;
  enemyTimer = millis();
  shotsFired = 0;
  shotsHit = 0;
  killCount = 0;
  lastDamageTime = 0;
  gameState = 'welcome'; // Return to welcome screen instead of playing
}

// Add a function to create floating text for feedback
function createFloatingText(x, y, message, textColor) {
  let floatingText = {
    x: x,
    y: y,
    message: message,
    color: textColor,
    life: 60, // frames to live
    velocity: -1 // upward movement
  };
  
  particles.push(floatingText);
}

// Add this function to create a life lost effect
function createLifeLostEffect() {
  // Screen flash effect
  particles.push({
    type: 'screenFlash',
    alpha: 180,
    life: 30
  });
  
  // Create shockwave at player position
  particles.push({
    type: 'shockwave',
    x: playerX,
    y: playerY,
    size: 10,
    maxSize: 150,
    alpha: 200,
    life: 40,
    color: color(255, 50, 50)
  });
  
  // Create floating text
  createFloatingText(width/2, height/2, "LIFE LOST!", color(255, 50, 50));
  
  // Create particle burst
  for (let i = 0; i < 30; i++) {
    let angle = random(TWO_PI);
    let speed = random(1, 5);
    let distance = random(20, 50);
    
    particles.push({
      type: 'particle',
      x: playerX,
      y: playerY,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      size: random(2, 6),
      color: color(255, random(0, 100), random(0, 50), 200),
      life: random(30, 60)
    });
  }
  
  // Add time slow effect
  particles.push({
    type: 'timeSlow',
    duration: 60, // frames
    slowFactor: 0.3,
    life: 60
  });
}

// Draw the leaderboard
function drawLeaderboard() {
  fill(255);
  textSize(32);
  textAlign(CENTER);
  text("LEADERBOARD", width / 2, 60);
  
  // Draw table headers
  textSize(16);
  textAlign(LEFT);
  fill(200, 200, 255);
  text("RANK", width / 2 - 150, 100);
  text("PLAYER", width / 2 - 50, 100);
  text("SCORE", width / 2 + 50, 100);
  text("LEVEL", width / 2 + 150, 100);
  
  // Draw horizontal line
  stroke(200, 200, 255);
  line(width / 2 - 180, 110, width / 2 + 180, 110);
  noStroke();
  
  // Draw leaderboard entries
  fill(255);
  textAlign(CENTER);
  
  if (leaderboardData.length === 0) {
    text("No scores yet. Be the first!", width / 2, 150);
  } else {
    for (let i = 0; i < leaderboardData.length; i++) {
      const entry = leaderboardData[i];
      const y = 140 + i * 30;
      
      // Highlight the player's score
      if (entry.isPlayer) {
        fill(255, 255, 0);
      } else {
        fill(255);
      }
      
      textAlign(CENTER);
      text(i + 1, width / 2 - 150, y);
      text(entry.initials, width / 2 - 50, y);
      text(entry.score, width / 2 + 50, y);
      text(entry.level, width / 2 + 150, y);
    }
  }
  
  // Use rectMode(CENTER) for consistent button alignment
  rectMode(CENTER);
  
  // Play button (left)
  fill(0, 150, 255);
  rect(width / 2 - 100, height - 55, 140, 50, 10);
  
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  text("PLAY", width / 2 - 100, height - 55);
  
  // Home button (right)
  fill(50, 150, 50);
  rect(width / 2 + 100, height - 55, 140, 50, 10);
  
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  text("HOME", width / 2 + 100, height - 55);
  
  // Reset rectMode to default for the rest of the drawing
  rectMode(CORNER);
}

// Add a function to draw the welcome screen
function drawWelcomeScreen() {
  // Add a glow effect to "SPACE CAMBINO"
  let glowColor = color(100, 150, 255, 50 + sin(frameCount * 0.1) * 30);
  fill(glowColor);
  textSize(60);
  textAlign(CENTER);
  text("SPACE CAMBINO", width / 2, 100);
  
  // Main title in bright color
  fill(100, 200, 255);
  textSize(58);
  text("SPACE CAMBINO", width / 2, 100);
  
  // Game description
  textSize(16);
  fill(200, 200, 255);
  text("Navigate your spaceship through waves of alien invaders", width / 2, 150);
  text("Collect power-ups and defeat the boss to advance to the next level", width / 2, 175);
  
  // Controls
  textSize(14);
  fill(150, 255, 150);
  text("CONTROLS:", width / 2, 215);
  text("← → : Move ship", width / 2, 240);
  text("SPACE : Fire weapons", width / 2, 260);
  
  // Draw mini leaderboard (top 5 scores)
  drawMiniLeaderboard();
  
  // Use rectMode(CENTER) for consistent button alignment
  rectMode(CENTER);
  
  // Play button with pulsing effect
  let buttonGlow = 150 + sin(frameCount * 0.1) * 50;
  fill(0, buttonGlow, 255);
  rect(width / 2, height - 75, 160, 50, 10);
  
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  text("PLAY NOW", width / 2, height - 75);
  
  // Reset rectMode to default
  rectMode(CORNER);
}

// Function to draw a mini leaderboard on the welcome screen
function drawMiniLeaderboard() {
  // Use rectMode(CENTER) for consistent background alignment
  rectMode(CENTER);
  
  // Make the leaderboard box taller by 24px (from 200 to 224)
  fill(50, 50, 80, 200);
  rect(width / 2, 382, 400, 224, 10); // Center at y=382 (270+224/2)
  
  // Reset rectMode to default
  rectMode(CORNER);
  
  fill(255, 255, 0);
  textSize(24);
  textAlign(CENTER);
  text("TOP SCORES", width / 2, 295);
  
  // Draw table headers
  textSize(14);
  textAlign(LEFT);
  fill(200, 200, 255);
  text("RANK", width / 2 - 170, 325);
  text("PLAYER", width / 2 - 100, 325);
  text("SCORE", width / 2 + 20, 325);
  text("LEVEL", width / 2 + 120, 325);
  
  // Draw horizontal line
  stroke(200, 200, 255);
  line(width / 2 - 180, 335, width / 2 + 180, 335);
  noStroke();
  
  // Draw leaderboard entries (top 5 only)
  fill(255);
  textAlign(CENTER);
  
  if (leaderboardData.length === 0) {
    text("No scores yet. Be the first!", width / 2, 365);
  } else {
    const displayCount = Math.min(5, leaderboardData.length);
    for (let i = 0; i < displayCount; i++) {
      const entry = leaderboardData[i];
      const y = 355 + i * 25;
      
      textAlign(CENTER);
      text(i + 1, width / 2 - 170, y);
      text(entry.initials, width / 2 - 100, y);
      text(entry.score, width / 2 + 20, y);
      text(entry.level, width / 2 + 120, y);
    }
  }
  
  // Move the "View Full Leaderboard" link down by 24px (from 455 to 479)
  fill(150, 200, 255);
  textSize(14);
  textAlign(CENTER);
  text("VIEW FULL LEADERBOARD", width / 2, 479);
  
  // Also move the underline down by 24px (from 460 to 484)
  stroke(150, 200, 255, 150);
  strokeWeight(1);
  line(width / 2 - 90, 484, width / 2 + 90, 484);
  noStroke();
}

// Add this function to detect mobile devices
function detectMobileDevice() {
  // Check for mobile user agents OR any viewport under 600px wide
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         window.innerWidth < 600;
}

// Add this function to draw the mobile warning screen
function drawMobileWarning() {
  background(20, 20, 40); // Dark background
  
  // Update the animation angle
  mobileGraphicAngle += 0.02;
  
  // Draw animated stars in background
  for (let i = 0; i < 50; i++) {
    let x = width/2 + cos(mobileGraphicAngle * 0.5 + i * 0.5) * (width * 0.4);
    let y = height/2 + sin(mobileGraphicAngle * 0.3 + i * 0.5) * (height * 0.3);
    let size = 1 + sin(mobileGraphicAngle + i) * 2;
    
    fill(200 + sin(i) * 55, 200 + cos(i) * 55, 255, 150);
    noStroke();
    ellipse(x, y, size, size);
  }
  
  // Draw desktop computer graphic
  push();
  translate(width/2, height/2 - 50);
  
  // Monitor
  fill(40, 40, 60);
  rect(-80, -70, 160, 120, 5);
  
  // Screen
  fill(60, 100, 200);
  rect(-70, -60, 140, 100);
  
  // Game elements on screen
  fill(255);
  // Player ship
  triangle(-10, 20, 10, 20, 0, 0);
  // Enemy
  fill(255, 100, 100);
  ellipse(0, -20, 15, 15);
  // Bullets
  fill(0, 255, 0);
  rect(-2, 10, 4, 8);
  rect(-2, -10, 4, 8);
  
  // Stand
  fill(40, 40, 60);
  rect(-15, 50, 30, 10);
  rect(-25, 60, 50, 5);
  
  // Keyboard
  fill(50, 50, 70);
  rect(-60, 80, 120, 20, 5);
  
  // Add pulsing glow effect
  let glowSize = 180 + sin(mobileGraphicAngle * 2) * 20;
  let glowAlpha = 50 + sin(mobileGraphicAngle) * 20;
  fill(100, 150, 255, glowAlpha);
  ellipse(0, 0, glowSize, glowSize);
  
  pop();
  
  // Draw text
  fill(255);
  textSize(36);
  textAlign(CENTER);
  text("DESKTOP ONLY", width/2, height/2 + 120);
  
  // Subtitle with pulsing effect
  let subtitleAlpha = 200 + sin(mobileGraphicAngle * 3) * 55;
  fill(200, 200, 255, subtitleAlpha);
  textSize(16);
  text("Space Cambino requires a desktop or laptop", width/2, height/2 + 160);
  text("with keyboard controls to play", width/2, height/2 + 185);
  
  // Instructions
  fill(150, 200, 255);
  textSize(14);
  text("Please visit on a computer for the full experience", width/2, height/2 + 230);
  
  // Draw animated arrow pointing to computer
  push();
  translate(width/2, height/2 + 50);
  rotate(sin(mobileGraphicAngle) * 0.1);
  fill(255, 255, 0, 200 + sin(mobileGraphicAngle * 2) * 55);
  triangle(-10, -20, 10, -20, 0, -40);
  pop();
}