// Archivo principal para Scriptable - Mahjong Solitario
// VERSIÓN FINAL: Layout Agradable (Escala 0,55) - SHUFFLE CONDICIONAL + CONTADOR DE POSIBILIDADES
// Lógica de Cobertura de Cúspide y Bloqueo de Laterales Extremos ¡CORREGIDA!

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
        flex-direction: column; 
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
        width: 1100px; 
        height: 880px; 
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4); 
      }
      
      /* ESTILOS DE UI SUPERIOR (CENTRADO Y MÁS CERCANO AL CANVAS) */
      #uiContainer {
          display: flex;
          gap: 20px;
          z-index: 50;
          margin-bottom: 15px; 
          padding: 10px 0; 
          align-items: center; 
      }
      #moveCounter {
          background-color: #2e4d8f;
          color: white;
          padding: 12px 25px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 20px; 
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3); 
      }

      /* ESTILOS DE GAME OVER */
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
        font-size: 40px; 
        margin-bottom: 15px;
        text-shadow: 3px 3px 6px #000; 
      }
      #gameOverScreen p {
        color: white;
        font-size: 20px;
        margin-bottom: 40px;
        text-align: center;
        max-width: 80%;
      }
      #gameOverButtons {
          display: flex;
          gap: 25px; 
      }
      #restartButton, #shuffleOptionButton { 
        padding: 15px 30px; 
        background-color: #D32F2F;
        border: none;
        border-radius: 10px; 
        color: white;
        font-size: 22px; 
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.3s, transform 0.2s; 
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }
      #restartButton:hover, #shuffleOptionButton:hover {
        background-color: #B71C1C;
        transform: translateY(-2px); 
      }
    </style>
  </head>
  <body>
    <div id="uiContainer">
        <div id="moveCounter">Movimientos Posibles: 0</div>
    </div>

    <canvas id="gameCanvas" width="1100" height="880"></canvas> 
    <div id="gameOverScreen">
      <h1 id="gameOverTitle">¡GAME OVER!</h1>
      <p id="gameOverMessage"></p>
      <div id="gameOverButtons">
          <button id="restartButton">Empezar de Cero</button>
          <button id="shuffleOptionButton">Barajar y Seguir 🔀</button> 
      </div>
    </div>
    <script>
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const gameOverScreen = document.getElementById('gameOverScreen');
      const restartButton = document.getElementById('restartButton');
      const shuffleOptionButton = document.getElementById('shuffleOptionButton'); 
      const gameOverTitle = document.getElementById('gameOverTitle');
      const gameOverMessage = document.getElementById('gameOverMessage');
      const moveCounter = document.getElementById('moveCounter');

      // --- ESTADOS DEL JUEGO ---
      let board = [];
      let selectedTiles = [];
      let gameOver = false;
      let gameInterval = null;
      let pairsRemoved = 0; 
      const TOTAL_TILES = 144; 

      // --- CONSTANTES DEL JUEGO Y DIMENSIONES ---
      
      const TILE_WIDTH = 48;
      const TILE_HEIGHT = 72;
      const TILE_DEPTH_X = 3; 
      const TILE_DEPTH_Y = 3; 
      const TILE_SCALE = 1.0; 
      const TILE_RADIUS = 4; 
      const FONT_SIZE = '45px'; 
      const TILE_UNIT_X = TILE_WIDTH / 2; 
      const TILE_UNIT_Y = TILE_HEIGHT / 2; 
      
      let LAYOUT_START_X;
      let LAYOUT_START_Y;
      
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
            [1,7,1],[2,0,0],[2,6,0],[2,8,0],[2,14,0],[4,0,0],[4,4,0],[4,6,0],[4,8,0],[4,10,0],[4,14,0],[6,0,0],
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
            [22,8,0],[22,10,0],[22,14,0],[24,0,0],[24,6,0],[24,8,0],[24,14,0],[25,7,1],[26,7,2]
          ];

          let positions = coordList.map(c => ({ x: c[0], y: c[1], z: c[2] }));
          let orderedPositions = positions.sort((a, b) => b.z - a.z);
          
          return orderedPositions; 
      }
      
      // --- FUNCIONES DE UTILIDAD ---
      
      function getPossibleMovesCount() {
          const remainingTiles = board.filter(t => !t.removed);
          const freeTiles = remainingTiles.filter(t => t.isFree);
          let possibleMoves = 0;
          
          for (let i = 0; i < freeTiles.length; i++) {
              for (let j = i + 1; j < freeTiles.length; j++) {
                  if (areTilesMatching(freeTiles[i], freeTiles[j])) {
                      possibleMoves++;
                  }
              }
          }
          return possibleMoves;
      }

      function updateMoveCounter() {
          const possibleMoves = getPossibleMovesCount();
          moveCounter.textContent = 'Movimientos Posibles: ' + possibleMoves;
          return possibleMoves;
      }

      function shuffleArray(array) {
          for (let i = array.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [array[i], array[j]] = [array[j], array[i]];
          }
      }

      /**
       * Función para barajar las fichas restantes.
       */
      function shuffleBoardAndContinue() {
          const remainingTiles = board.filter(t => !t.removed);
          
          if (remainingTiles.length === 0) return; 

          let remainingTypes = remainingTiles.map(t => t.type);
          
          shuffleArray(remainingTypes);
          
          for (let i = 0; i < remainingTiles.length; i++) {
              remainingTiles[i].type = remainingTypes[i];
              remainingTiles[i].isFlowerOrSeason = SPECIAL_TILES.includes(remainingTypes[i]);
          }
          
          selectedTiles = [];
          remainingTiles.forEach(t => t.isSelected = false);
          updateTileFreedom();
          gameOver = false;
          gameOverScreen.style.display = 'none';

          if (!gameInterval) {
             gameInterval = setInterval(gameLoop, 1000 / 30);
          }
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
          
          shuffleArray(tileTypes);
          
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
          gameOver = false;
          pairsRemoved = 0; 
          updateTileFreedom(); 
          updateMoveCounter(); 
          gameOverScreen.style.display = 'none';

          // 📐 CÁLCULOS DE CENTRADO 📐
          
          const max_x = 28; 
          const max_y = 14; 
          const max_z = 4;
          
          const centerUnitX = max_x / 2; 
          const offsetToCenterHorizontal = centerUnitX * TILE_UNIT_X * TILE_SCALE; 
          
          const z_compensation_x = max_z * TILE_DEPTH_X; 

          LAYOUT_START_X = (canvas.width / 2) - offsetToCenterHorizontal - z_compensation_x; 

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
      
      /**
       * LÓGICA CLAVE DE LIBERTAD (COBERTURA Y LATERALIDAD)
       */
      function checkTileFreedom(tile) {
          const { x, y, z } = tile;
          
          // 1. ¿Está cubierta? (Chequeo de superposición)
          const isCovered = board.some(t => 
              !t.removed && t.z === z + 1 &&
              t.x <= x + 1 && t.x >= x - 1 &&
              t.y <= y + 1 && t.y >= y - 1
          );
          
          if (isCovered) {
              return false;
          }
          
          // CASO ESPECIAL 1: Cúspide
          if (z === 4) return true; 


          // CASO ESPECIAL 2: Extremos Absolutos (Cola y Cabeza)
          // Si no están cubiertas, siempre están libres porque el borde exterior siempre está libre.
          if (x === 0 || x === 28) { 
              return true; 
          } 

          // 2. Chequeo de lateralidad para TODAS las demás fichas
          const hasTileLeft = board.some(t => 
              !t.removed && t.x === x - 2 && t.y === y && t.z === z
          );
          const hasTileRight = board.some(t => 
              !t.removed && t.x === x + 2 && t.y === y && t.z === z
          );
          
          // Ficha normal (incluye x=2, x=26, y todas las del medio)
          // Es libre si NO está bloqueada por AMBOS lados.
          return !hasTileLeft || !hasTileRight;
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
          
          let base_x = LAYOUT_START_X + tile.x * TILE_UNIT_X * TILE_SCALE;
          let base_y = LAYOUT_START_Y + tile.y * TILE_UNIT_Y * TILE_SCALE;
          
          const z_offset_x = tile.z * TILE_DEPTH_X;
          const z_offset_y = tile.z * TILE_DEPTH_Y;
          let drawX = base_x + z_offset_x;
          let drawY = base_y - z_offset_y;

          // Animación de elevación para fichas seleccionadas
          if (tile.isSelected) {
              drawY -= 5; 
          }
          
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
          
          // Sombra de la ficha
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 5;
          ctx.shadowOffsetX = 3;
          ctx.shadowOffsetY = 3;

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
          
          // Desactivar sombra para la cara principal y el texto
          ctx.shadowColor = 'rgba(0, 0, 0, 0)'; 

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
                  pairsRemoved++;
                  updateTileFreedom(); 
                  updateMoveCounter(); 
                  
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
          
          const visibleTiles = board.filter(t => !t.removed).sort((a, b) => b.z - a.z); 

          for (const tile of visibleTiles) {
              const base_x = LAYOUT_START_X + tile.x * TILE_UNIT_X * TILE_SCALE;
              const base_y = LAYOUT_START_Y + tile.y * TILE_UNIT_Y * TILE_SCALE;
              const z_offset_x = tile.z * TILE_DEPTH_X;
              const z_offset_y = tile.z * TILE_DEPTH_Y;
              let drawX = base_x + z_offset_x;
              let drawY = base_y - z_offset_y;

              if (tile.isSelected) {
                  drawY -= 5; 
              }
              
              const detectionX = drawX;
              const detectionY = drawY - TILE_DEPTH_Y; 
              const detectionW = TILE_WIDTH + TILE_DEPTH_X;
              const detectionH = TILE_HEIGHT + TILE_DEPTH_Y + 5; 

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
              gameOverMessage.textContent = "¡Felicidades! Has completado el Mahjong.";
              shuffleOptionButton.style.display = 'none'; 
              return true;
          }
          
          const possibleMoves = updateMoveCounter(); 
          
          if (possibleMoves === 0) {
              gameOver = true;
              gameOverTitle.textContent = "¡GAME OVER! 😔";
              gameOverMessage.textContent = "No quedan movimientos posibles. ¿Quieres barajar las fichas restantes o empezar de nuevo?";
              shuffleOptionButton.style.display = 'inline-block'; 
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

          // Dibujar en orden de Z (profundidad)
          const sortedTiles = board.filter(t => !t.removed).sort((a, b) => a.z - b.z);
          
          sortedTiles.forEach(drawTile);

          checkGameOver();
      }

      // 💥 LISTENERS 💥
      
      // Reinicio Completo
      restartButton.addEventListener('click', () => {
          gameOver = false;
          gameOverScreen.style.display = 'none';
          initializeGame(); 
      });
      
      // Barajar y Continuar
      shuffleOptionButton.addEventListener('click', () => {
          gameOver = false; 
          gameOverScreen.style.display = 'none';
          shuffleBoardAndContinue(); 
      });

      // Iniciar el juego
      initializeGame();
    </script>
  </body>
  </html>
  `;
}
