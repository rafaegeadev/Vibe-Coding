// Archivo principal para Scriptable

// ========== WIDGET ==========
const widget = await createWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
  Script.complete();
} else {
  // Ejecuta el juego si no está en modo widget
  await startGame();
}

async function createWidget() {
  const w = new ListWidget();
  w.backgroundColor = new Color("#000");

  const title = w.addText("🎮 Arkanoid");
  title.textColor = new Color("#FFFFFF");
  title.font = Font.boldSystemFont(16);
  title.centerAlignText();

  const canvas = new DrawContext();
  canvas.size = new Size(300, 150);
  canvas.opaque = false;
  canvas.respectScreenScale = true;

  // Dibujar una vista representativa del juego
  canvas.setFillColor(new Color("#000"));
  canvas.fillRect(new Rect(0, 0, 300, 150));
  
  // Pala
  canvas.setFillColor(new Color("#4CAF50"));
  canvas.fillRect(new Rect(110, 130, 80, 10));
  
  // Pelota
  canvas.setFillColor(new Color("#FFFFFF"));
  canvas.fillEllipse(new Rect(145, 115, 10, 10));

  // Ladrillos
  canvas.setFillColor(new Color("#FF5722"));
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 8; j++) {
      canvas.fillRect(new Rect(j * 35 + 5, i * 20 + 5, 30, 10));
    }
  }

  const gamePreview = canvas.getImage();
  const img = w.addImage(gamePreview);
  img.centerAlignImage();

  // Agregar enlace al script del juego
  w.url = URLScheme.forRunningScript();

  return w;
}

// ========== JUEGO ==========
async function startGame() {
  const webView = new WebView();
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        margin: 0;
        overflow: hidden;
        background-color: black;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        position: relative;
      }
      canvas {
        display: block;
        transform: scale(1.6);
      }
      #gameOverScreen {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: rgba(0, 0, 0, 0.8);
      }
      #gameOverScreen h1 {
        color: white;
        font-family: Arial, sans-serif;
        font-size: 30px;
        margin-bottom: 20px;
      }
      #restartButton {
        padding: 10px 20px;
        background-color: #FF5722;
        border: none;
        border-radius: 5px;
        color: white;
        font-size: 18px;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      #restartButton:hover {
        background-color: #E64A19;
      }
    </style>
  </head>
  <body>
    <canvas id="gameCanvas" width="400" height="650"></canvas>
    <div id="gameOverScreen">
      <h1>¡GAME OVER!</h1>
      <button id="restartButton">Empezar otra vez</button>
    </div>
    <script>
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const gameOverScreen = document.getElementById('gameOverScreen');
      const restartButton = document.getElementById('restartButton');

      const paddleWidth = 100;
      const paddleHeight = 12;
      const ballRadius = 9;
      const brickRows = 6;
      const brickCols = 8;
      const brickWidth = 40;
      const brickHeight = 18;
      const brickPadding = 3;
      const bricks = [];
      let paddleX, ballX, ballY, ballDX, ballDY, gameOver;

      function initializeGame() {
        paddleX = (canvas.width - paddleWidth) / 2;
        ballX = canvas.width / 2;
        ballY = canvas.height - 80;
        ballDX = 4;
        ballDY = -4;
        gameOver = false;

        for (let r = 0; r < brickRows; r++) {
          bricks[r] = [];
          for (let c = 0; c < brickCols; c++) {
            bricks[r][c] = { x: 0, y: 0, destroyed: false };
          }
        }

        gameOverScreen.style.display = 'none';
        gameLoop();
      }

      function drawBricks() {
        for (let r = 0; r < brickRows; r++) {
          for (let c = 0; c < brickCols; c++) {
            const brick = bricks[r][c];
            if (!brick.destroyed) {
              const brickX = c * (brickWidth + brickPadding);
              const brickY = r * (brickHeight + brickPadding);
              brick.x = brickX;
              brick.y = brickY;
              ctx.fillStyle = '#FF5722';
              ctx.fillRect(brickX, brickY, brickWidth, brickHeight);
            }
          }
        }
      }

      function drawPaddle() {
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(paddleX, canvas.height - paddleHeight - 15, paddleWidth, paddleHeight);
      }

      function drawBall() {
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.closePath();
      }

      function showGameOver() {
        gameOverScreen.style.display = 'flex';
      }

      function updateBall() {
        ballX += ballDX;
        ballY += ballDY;

        if (ballX - ballRadius < 0 || ballX + ballRadius > canvas.width) ballDX = -ballDX;
        if (ballY - ballRadius < 0) ballDY = -ballDY;

        if (
          ballY + ballRadius > canvas.height - paddleHeight - 15 &&
          ballX > paddleX &&
          ballX < paddleX + paddleWidth
        ) {
          ballDY = -ballDY;
        }

        let bricksLeft = 0;
        for (let r = 0; r < brickRows; r++) {
          for (let c = 0; c < brickCols; c++) {
            const brick = bricks[r][c];
            if (!brick.destroyed) {
              const bx = brick.x;
              const by = brick.y;
              if (
                ballX > bx &&
                ballX < bx + brickWidth &&
                ballY > by &&
                ballY < by + brickHeight
              ) {
                ballDY = -ballDY;
                brick.destroyed = true;
              } else {
                bricksLeft++;
              }
            }
          }
        }

        if (bricksLeft === 0 && !gameOver) {
          gameOver = true;
          showGameOver();
        }

        if (ballY - ballRadius > canvas.height) {
          gameOver = true;
          showGameOver();
        }
      }

      function movePaddle(event) {
        const rect = canvas.getBoundingClientRect();
        const touchX = event.touches[0].clientX - rect.left;
        paddleX = Math.max(0, Math.min(touchX - paddleWidth / 2, canvas.width - paddleWidth));
      }

      canvas.addEventListener('touchmove', movePaddle);

      function gameLoop() {
        if (gameOver) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        drawPaddle();
        drawBall();
        updateBall();
        requestAnimationFrame(gameLoop);
      }

      restartButton.addEventListener('click', initializeGame);

      initializeGame();
    </script>
  </body>
  </html>
  `;
  await webView.loadHTML(html);
  await webView.present();
}
