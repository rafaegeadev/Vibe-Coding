// Archivo principal para Scriptable - Mahjong Solitario
// VERSIÓN FINAL: Layout Agradable (Escala 0,55) - Reinicio Funcional

// ===================================
// ========== CÓDIGO MAHJONG SOLITARIO ==========
// ===================================

const widget = await createWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
  Script.complete();
} else {
  // Ejecuta el juego si no está en modo widget
  await startGame();
}

// --- FUNCIONES DE INICIO DE SCRIPTABLE ---

async function createWidget() {
  const w = new ListWidget();
  w.backgroundColor = new Color("#1C3668"); 
  const title = w.addText("🀄 Mahjong Solitario");
  title.textColor = new Color("#FFFFFF");
  title.font = Font.boldSystemFont(18);
  title.centerAlignText();
  const canvas = new DrawContext();
  canvas.size = new Size(300, 150);
  canvas.opaque = false;
  canvas.respectScreenScale = true;
  canvas.setFillColor(new Color("#1C3668"));
  canvas.fillRect(new Rect(0, 0, 300, 150));
  const tileRect = new Rect(130, 50, 40, 50);
  canvas.setFillColor(new Color("#FFFFFF"));
  canvas.fillRect(tileRect); 
  canvas.setStrokeColor(new Color("#000000"));
  canvas.setLineWidth(2);
  canvas.strokeRect(tileRect);
  canvas.setLineWidth(1); 
  canvas.setFont(Font.systemFont(30)); 
  canvas.setTextColor(new Color("#D32F2F")); 
  canvas.drawText("🀄", new Point(132, 55)); 
  const gamePreview = canvas.getImage();
  const img = w.addImage(gamePreview);
  img.centerAlignImage();
  w.url = URLScheme.forRunningScript();
  return w;
}

async function startGame() {
  const webView = new WebView();
  const html = getMahjongHtml(); 
  await webView.loadHTML(html);
  await webView.present();
}

// --- CÓDIGO HTML/JS DEL JUEGO ---

function getMahjongHtml() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=0.55, user-scalable=yes">
    <title>Mahjong Solitario</title>
    <style>
      body {
        margin: 0;
        overflow: hidden;
        background-color: #1C3668; 
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh; 
        position: relative;
        font-family: Arial, sans-serif;
      }
      canvas {
        display: block;
        border: 2px solid #555;
        background-color: #0A3617; /* Verde Oscuro */
        width: 1100px; /* Ajustado */
        height: 880px; /* Ajustado */
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
        background-color: rgba(0, 0, 0, 0.9);
        z-index: 100;
      }
      #gameOverScreen h1 {
        color: #FFD700;
        font-size: 36px;
        margin-bottom: 10px;
        text-shadow: 2px 2px 4px #000;
      }
      #gameOverScreen p {
        color: white;
        font-size: 18px;
        margin-bottom: 30px;
      }
      #restartButton {
        padding: 12px 25px;
        background-color: #D32F2F;
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 20px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.3s;
      }
      #restartButton:hover {
        background-color: #B71C1C;
      }
    </style>
  </head>
  <body>
    <canvas id="gameCanvas" width="1100" height="880"></canvas> 
    <div id="gameOverScreen">
      <h1 id="gameOverTitle">¡GAME OVER!</h1>
      <p id="gameOverMessage"></p>
      <button id="restartButton">Empezar otra vez</button>
    </div>
    <script>
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const gameOverScreen = document.getElementById('gameOverScreen');
      const restartButton = document.getElementById('restartButton');
      const gameOverTitle = document.getElementById('gameOverTitle');
      const gameOverMessage = document.getElementById('gameOverMessage');

      // --- CONSTANTES DEL JUEGO Y DIMENSIONES ---
      
      const TILE_WIDTH = 48; // Fichas grandes (Mantenidas)
      const TILE_HEIGHT = 72; // Fichas grandes (Mantenidas)
      
      const TILE_DEPTH_X = 3; 
      const TILE_DEPTH_Y = 3; 
      const TILE_SCALE = 1.0; 
      const TILE_RADIUS = 4; 
      const FONT_SIZE = '45px'; 

      // Unidad de desplazamiento: 1 unidad Mahjong = TILE_WIDTH / 2 (Media ficha)
      const TILE_UNIT_X = TILE_WIDTH / 2; 
      const TILE_UNIT_Y = TILE_HEIGHT / 2; 
      
      let LAYOUT_START_X;
      let LAYOUT_START_Y;
      
      let board = [];
      let selectedTiles = [];
      let gameOver = false;
      let gameInterval = null;

      // Mapeo de Unicode y Tipos de Fichas (Set completo de 144)
      const TILE_MAP = {
        'W1': { char: '🀇', color: '#000' }, 'W2': { char: '🀈', color: '#000' }, 'W3': { char: '🀉', color: '#000' }, 
        'W4': { char: '🀊', color: '#000' }, 'W5': { char: '🀋', color: '#000' }, 'W6': { char: '🀌', color: '#000' }, 
        'W7': { char: '🀍', color: '#000' }, 'W8': { char: '🀎', color: '#000' }, 'W9': { char: '🀏', color: '#000' },
        'C1': { char: '🀙', color: '#000' }, 'C2': { char: '🀚', color: '#000' }, 'C3': { char: '🀛', color: '#000' }, 
        'C4': { char: '🀜', color: '#000' }, 'C5': { char: '🀝', color: '#000' }, 'C6': { char: '🀞', color: '#000' }, 
        'C7': { char: '🀟', color: '#000' }, 'C8': { char: '🀠', color: '#000' }, 'C9': { char: '🀡', color: '#000' },
        'B1': { char: '🀐', color: '#388E3C' }, 'B2': { char: '🀑', color: '#388E3C' }, 'B3': { char: '🀒', color: '#388E3C' }, 
        'B4': { char: '🀓', color: '#388E3C' }, 'B5': { char: '🀔', color: '#388E3C' }, 'B6': { char: '🀕', color: '#388E3C' }, 
        'B7': { char: '🀖', color: '#388E3C' }, 'B8': { char: '🀗', color: '#388E3C' }, 'B9': { char: '🀘', color: '#388E3C' },
        'VE': { char: '🀃', color: '#000' }, 'VS': { char: '🀂', color: '#000' }, 'VW': { char: '🀁', color: '#000' }, 'VN': { char: '🀀', color: '#000' }, 
        'DR': { char: '🀄', color: '#D32F2F' }, 
        'DG': { char: '🀅', color: '#388E3C' }, 
        'DW': { char: '🀆', color: '#000' }, 
        'F1': { char: '🀢', color: '#000' }, 'F2': { char: '🀣', color: '#000' }, 'F3': { char: '🀤', color: '#000' }, 'F4': { char: '🀥', color: '#000' },
        'S1': { char: '🀦', color: '#000' }, 'S2': { char: '🀧', color: '#000' }, 'S3': { char: '🀨', color: '#000' }, 'S4': { char: '🀩', color: '#000' },
      };
      
      const TILE_TYPES = Object.keys(TILE_MAP)
          .filter(key => key.length > 1 && !['F1','F2','F3','F4','S1','S2','S3','S4'].includes(key)) 
          .flatMap(type => Array(4).fill(type));

      const SPECIAL_TILES = ['F1', 'F2', 'F3', 'F4', 'S1', 'S2', 'S3', 'S4'];
      TILE_TYPES.push(...SPECIAL_TILES); 

      CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
      }


      /**
       * !!! LAYOUT ABSOLUTO Y FIJO !!!
       */
      function generateExactLayoutPositions() {
          const coordList = [
            [0,7,0],[2,0,0],[2,6,0],[2,8,0],[2,14,0],[4,0,0],[4,4,0],[4,6,0],[4,8,0],[4,10,0],[4,14,0],[6,0,0],
            [6,2,0],[6,4,0],[6,6,0],[6,8,0],[6,10,0],[6,12,0],[6,14,0],[8,0,0],[8,2,0],[8,4,0],[8,6,0],[8,8,0],
            [8,10,0],[8,12,0],[8,14,0],[8,2,1],[8,4,1],[8,6,1],[8,8,1],[8,10,1],[8,12,1],[10,0,0],[10,2,0],[10,4,0],
            [10,6,0],[10,8,0],[10,10,0],[10,12,0],[10,14,0],[10,2,1],[10,4,1],[10,6,1],[10,8,1],[10,10,1],[10,12,1],
            [10,4,2],[10,6,2],[10,8,2],[10,10,2],[12,0,0],[12,2,0],[12,4,0],[12,6,0],[12,8,0],[12,10,0],[12,12,0],
            [12,14,0],[12,2,1],[12,4,1],[12,6,1],[12,8,1],[12,10,1],[12,12,1],[12,4,2],[12,6,2],[12,8,2],[12,10,2],
            [12,6,3],[12,8,3],[13,7,4],[14,0,0],[14,2,0],[14,4,0],[14,6,0],[14,8,0],[14,10,0],[14,12,0],[14,14,0],
            [14,2,1],[14,4,1],[14,6,1],[14,8,1],[14,10,1],[14,12,1],[14,4,2],[14,6,2],[14,8,2],[14,10,2],[14,6,3],
            [14,8,3],[16,0,0],[16,2,0],[16,4,0],[16,6,0],[16,8,0],[16,10,0],[16,12,0],[16,14,0],[16,2,1],[16,4,1],
            [16,6,1],[16,8,1],[16,10,1],[16,12,1],[16,4,2],[16,6,2],[16,8,2],[16,10,2],[18,0,0],[18,2,0],[18,4,0],
            [18,6,0],[18,8,0],[18,10,0],[18,12,0],[18,14,0],[18,2,1],[18,4,1],[18,6,1],[18,8,1],[18,10,1],[18,12,1],
            [20,0,0],[20,2,0],[20,4,0],[20,6,0],[20,8,0],[20,10,0],[20,12,0],[20,14,0],[22,0,0],[22,4,0],[22,6,0],
            [22,8,0],[22,10,0],[22,14,0],[24,0,0],[24,6,0],[24,8,0],[24,14,0],[26,7,0],[28,7,0]
          ];

          let positions = coordList.map(c => ({ x: c[0], y: c[1], z: c[2] }));
          let orderedPositions = positions.sort((a, b) => b.z - a.z);
          
          return orderedPositions; 
      }

      /**
       * Inicializa el tablero.
       */
      function initializeGame() {
          const positions = generateExactLayoutPositions();
          let tileTypes = [...TILE_TYPES];
          
          if (tileTypes.length > positions.length) {
              tileTypes = tileTypes.slice(0, positions.length);
          }
          
          // Mezcla de fichas
          for (let i = tileTypes.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [tileTypes[i], tileTypes[j]] = [tileTypes[j], tileTypes[i]];
          }
          
          board = [];
          for (let i = 0; i < positions.length; i++) {
              board.push({
                  id: i,
                  type: tileTypes[i],
                  x: positions[i].x,
                  y: positions[i].y,
                  z: positions[i].z,
                  removed: false,
                  isFree: false,
                  isSelected: false,
                  isFlowerOrSeason: SPECIAL_TILES.includes(tileTypes[i]) 
              });
          }
          
          selectedTiles = [];
          // Aseguramos que gameOver es false y ocultamos la pantalla
          gameOver = false;
          updateTileFreedom();
          gameOverScreen.style.display = 'none';

          // 📐 CENTRADO: Máxima X=28, Máxima Y=14. Máxima Z=4. 📐
          
          const max_x = 28; 
          const max_y = 14; 
          const max_z = 4;
          
          // El centro horizontal de la cuadrícula es X_unidad=14
          const centerUnitX = max_x / 2; 
          const offsetToCenterHorizontal = centerUnitX * TILE_UNIT_X * TILE_SCALE; 
          
          const z_compensation_x = max_z * TILE_DEPTH_X; 

          // LAYOUT_START_X = (Centro del Canvas) - (Distancia al Centro) - (Compensación 3D)
          LAYOUT_START_X = (canvas.width / 2) - offsetToCenterHorizontal - z_compensation_x; 

          // Centrado vertical: El centro vertical es Y_unidad=7
          const centerUnitY = max_y / 2; 
          const offsetToCenterVertical = centerUnitY * TILE_UNIT_Y * TILE_SCALE;
          LAYOUT_START_Y = (canvas.height / 2) - offsetToCenterVertical;


          if (gameInterval) clearInterval(gameInterval);
          gameInterval = setInterval(gameLoop, 1000 / 30);
      }

      // --- FUNCIONES DE JUEGO (Mahjong Clásico: desplazamiento de media ficha) ---

      function areTilesMatching(tile1, tile2) {
          if (tile1.id === tile2.id) return false;
          if (tile1.isFlowerOrSeason && tile2.isFlowerOrSeason) {
              return true; 
          }
          return tile1.type === tile2.type;
      }
      
      // La comprobación de libertad vuelve a la lógica de Mahjong (vecinos en X-2, X+2 para superposición)
      function checkTileFreedom(tile) {
          const { x, y, z } = tile;
          
          // 1. ¿Está cubierta? 
          const isCovered = board.some(t => 
              !t.removed && t.z === z + 1 &&
              (t.x === x || t.x === x - 1) && 
              (t.y === y || t.y === y - 1)
          );
          if (isCovered) {
            const isStrictlyCovered = board.some(t => 
                !t.removed && t.z === z + 1 && t.x === x && t.y === y
            );
            if (isStrictlyCovered) return false;
          }

          // 2. ¿Tiene vecinos laterales?
          const hasTileLeft = board.some(t => 
              !t.removed && t.x === x - 2 && t.y === y && t.z === z
          );
          const hasTileRight = board.some(t => 
              !t.removed && t.x === x + 2 && t.y === y && t.z === z
          );
          
          // Casos especiales (0, 28) o (13, 7)
          if (x === 0 && !hasTileRight) return true;
          if (x === 28 && !hasTileLeft) return true;
          if (x === 13) return !isCovered && (!board.some(t => !t.removed && t.x === 12 && t.y === y && t.z === z) || !board.some(t => !t.removed && t.x === 14 && t.y === y && t.z === z));


          // Es libre si NO está cubierta Y (NO tiene ficha a la izquierda O NO tiene ficha a la derecha)
          return !isCovered && (!hasTileLeft || !hasTileRight);
      }


      function updateTileFreedom() {
          board.forEach(tile => {
              if (!tile.removed) {
                  tile.isFree = checkTileFreedom(tile);
              }
          });
      }

      function drawTile(tile) {
          if (tile.removed) return;
          const map = TILE_MAP[tile.type];
          if (!map) return;
          
          // Posición base
          const base_x = LAYOUT_START_X + tile.x * TILE_UNIT_X * TILE_SCALE;
          const base_y = LAYOUT_START_Y + tile.y * TILE_UNIT_Y * TILE_SCALE;
          
          const z_offset_x = tile.z * TILE_DEPTH_X;
          const z_offset_y = tile.z * TILE_DEPTH_Y;
          const drawX = base_x + z_offset_x;
          const drawY = base_y - z_offset_y;
          
          const W = TILE_WIDTH;
          const H = TILE_HEIGHT;
          const R = TILE_RADIUS;
          const D = TILE_DEPTH_X; 
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          const isFree = tile.isFree;
          const isSelected = tile.isSelected;
          const fillColor = isSelected ? '#FFD700' : (isFree ? '#FFFFFF' : '#D0D0D0');
          const sideColor = isSelected ? '#CCAA00' : (isFree ? '#E0E0E0' : '#B0B0B0');
          
          // Lados 3D
          ctx.fillStyle = sideColor;
          ctx.fillRect(drawX + W, drawY + D, D, H - D); 
          ctx.beginPath();
          ctx.moveTo(drawX + W, drawY + H);
          ctx.lineTo(drawX + W + D, drawY + H - D);
          ctx.lineTo(drawX + W + D, drawY + H + D - D); 
          ctx.lineTo(drawX + W, drawY + H);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = sideColor;
          ctx.fillRect(drawX + R, drawY - D, W - R, D); 
          
          ctx.beginPath();
          ctx.moveTo(drawX + W, drawY);
          ctx.lineTo(drawX + W + D, drawY - D);
          ctx.lineTo(drawX + W + D, drawY); 
          ctx.closePath();
          ctx.fill();

          // Cara principal
          ctx.fillStyle = fillColor;
          ctx.roundRect(drawX, drawY, W, H, R).fill();
          ctx.lineWidth = 2;
          ctx.roundRect(drawX, drawY, W, H, R).stroke();

          // Carácter UNICODE
          ctx.fillStyle = map.color;
          ctx.font = 'bold ' + FONT_SIZE + ' Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(map.char, drawX + W / 2, drawY + H / 2 + 5); 
          
          // Marcar Ficha Libre
          if(isFree) {
              ctx.strokeStyle = '#388E3C'; 
              ctx.lineWidth = 3;
              ctx.roundRect(drawX, drawY, W, H, R).stroke();
          }
      }
      
      function handleTileSelection(tile) {
          if (tile.isSelected) {
              tile.isSelected = false;
              selectedTiles = selectedTiles.filter(t => t.id !== tile.id);
          } else if (selectedTiles.length < 2) {
              tile.isSelected = true;
              selectedTiles.push(tile);
          }

          if (selectedTiles.length === 2) {
              const [tile1, tile2] = selectedTiles;
              
              if (areTilesMatching(tile1, tile2)) {
                  tile1.removed = true;
                  tile2.removed = true;
                  selectedTiles.forEach(t => t.isSelected = false);
                  selectedTiles = [];
                  updateTileFreedom(); 
              } else {
                  setTimeout(() => {
                      tile1.isSelected = false;
                      tile2.isSelected = false;
                      selectedTiles = [];
                  }, 300);
              }
          }
      }
      
      canvas.addEventListener('click', (event) => {
          if (gameOver) return;
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          const clickX = (event.clientX - rect.left) * scaleX;
          const clickY = (event.clientY - rect.top) * scaleY;
          let clickedTile = null;
          // Ordenar por Z descendente para que el click detecte la ficha más alta primero
          const visibleTiles = board.filter(t => !t.removed).sort((a, b) => b.z - a.z); 

          for (const tile of visibleTiles) {
              const base_x = LAYOUT_START_X + tile.x * TILE_UNIT_X * TILE_SCALE;
              const base_y = LAYOUT_START_Y + tile.y * TILE_UNIT_Y * TILE_SCALE;
              const z_offset_x = tile.z * TILE_DEPTH_X;
              const z_offset_y = tile.z * TILE_DEPTH_Y;
              const drawX = base_x + z_offset_x;
              const drawY = base_y - z_offset_y;
              
              // Área de detección que incluye la perspectiva 3D
              const detectionX = drawX;
              const detectionY = drawY - TILE_DEPTH_Y; 
              const detectionW = TILE_WIDTH + TILE_DEPTH_X;
              const detectionH = TILE_HEIGHT + TILE_DEPTH_Y; 

              if (clickX >= detectionX && clickX <= detectionX + detectionW &&
                  clickY >= detectionY && clickY <= detectionH + detectionY) {
                  clickedTile = tile;
                  break;
              }
          }

          if (clickedTile && clickedTile.isFree) {
              handleTileSelection(clickedTile);
          }
      });


      function checkGameOver() {
          const remainingTiles = board.filter(t => !t.removed);
          
          if (remainingTiles.length === 0) {
              gameOver = true;
              gameOverTitle.textContent = "¡VICTORIA! 🎉";
              gameOverMessage.textContent = "Has removido todas las fichas.";
              return true;
          }
          
          const freeTiles = remainingTiles.filter(t => t.isFree);
          let possibleMoveExists = false;
          
          if (freeTiles.length >= 2) {
              for (let i = 0; i < freeTiles.length; i++) {
                  for (let j = i + 1; j < freeTiles.length; j++) {
                      if (areTilesMatching(freeTiles[i], freeTiles[j])) {
                          possibleMoveExists = true;
                          break;
                      }
                  }
                  if (possibleMoveExists) break;
              }
          }
          
          if (!possibleMoveExists) {
              gameOver = true;
              gameOverTitle.textContent = "¡GAME OVER! 😔";
              gameOverMessage.textContent = "No quedan movimientos posibles.";
              return true;
          }
          
          return false;
      }

      function gameLoop() {
          if (gameOver) {
              clearInterval(gameInterval);
              gameOverScreen.style.display = 'flex';
              return;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Ordenar por Z ascendente (dibuja la base primero para la correcta superposición)
          const sortedTiles = board.filter(t => !t.removed).sort((a, b) => a.z - b.z);
          
          sortedTiles.forEach(drawTile);

          checkGameOver();
      }

      // 💥 SOLUCIÓN DE REINICIO IMPLEMENTADA 💥
      restartButton.addEventListener('click', () => {
          gameOver = false;
          gameOverScreen.style.display = 'none';
          initializeGame(); // Llama a initializeGame() en lugar de recargar la página
      });

      // Iniciar el juego
      initializeGame();
    </script>
  </body>
  </html>
  `;
}
