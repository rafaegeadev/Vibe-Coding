// Archivo principal para Scriptable - Mahjong Solitario
// VERSIÓN FINAL: Layout Moderno (Escala 0,55) - SHUFFLE CONDICIONAL + CENTRADO CORREGIDO
// Logotipo del widget actualizado a solo una ficha de Mahjong grande.

// ===================================
// ========== CÓDIGO MAHJONG SOLITARIO ==========
// ===================================

const WIDGET_BACKGROUND_COLOR = new Color("#1C3668");
const TILE_COLOR_FACE = new Color("#FFFFFF");
const TILE_COLOR_STROKE = new Color("#000000");
const TILE_COLOR_CHAR = new Color("#D32F2F");

/**
 * Crea el widget de Scriptable con una vista previa y enlace de ejecución.
 * @returns {ListWidget} El widget configurado.
 */
async function createWidget() {
  const w = new ListWidget();
  w.backgroundColor = WIDGET_BACKGROUND_COLOR; 

  // --- CAMBIO AQUÍ: Eliminamos el título y dibujamos solo la ficha grande ---
  
  const canvas = new DrawContext();
  // Ajustamos el tamaño del canvas para la ficha grande
  const canvasSize = new Size(200, 200); 
  canvas.size = canvasSize;
  canvas.opaque = false;
  canvas.respectScreenScale = true;

  // Fondo de la vista previa (opcional, para rellenar si el canvas es más grande)
  canvas.setFillColor(WIDGET_BACKGROUND_COLOR);
  canvas.fillRect(new Rect(0, 0, canvasSize.width, canvasSize.height));

  // Dibujo de la ficha de muestra GRANDE y CENTRADA
  // Calculamos la posición para centrar la ficha en el canvasSize
  const largeTileWidth = 0;
  const largeTileHeight = 0;
  const tileX = (canvasSize.width / 2) - (largeTileWidth / 2);
  const tileY = (canvasSize.height / 2) - (largeTileHeight / 2);
  const tileRect = new Rect(tileX, tileY, largeTileWidth, largeTileHeight);
  
  canvas.setFillColor(TILE_COLOR_FACE);
  canvas.fillRect(tileRect); 
  canvas.setStrokeColor(TILE_COLOR_STROKE);
  canvas.setLineWidth(3); // Borde más grueso para el logo
  canvas.strokeRect(tileRect);
  
  // Carácter de la ficha (más grande)
  canvas.setLineWidth(1); 
  canvas.setFont(Font.systemFont(200)); // Fuente mucho más grande
  canvas.setTextColor(TILE_COLOR_CHAR); 
  // Ajustamos la posición del carácter para que esté centrado en la ficha
  canvas.drawText("🀄", new Point(tileX + (largeTileWidth / 2) - 105, tileY + (largeTileHeight / 2) - 120)); 
  
  const gamePreview = canvas.getImage();
  const img = w.addImage(gamePreview);
  img.centerAlignImage();
  
  // 3. Configurar URL para ejecutar el script
  w.url = URLScheme.forRunningScript();
  
  return w;
}

/**
 * Ejecuta el juego en una WebView.
 */
async function startGame() {
  const webView = new WebView();
  const html = getMahjongHtml(); 
  await webView.loadHTML(html);
  await webView.present();
}

// ===================================
// ========== LÓGICA DE EJECUCIÓN ==========
// ===================================

const widget = await createWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  // Ejecuta el juego si no está en modo widget (o al tocarlo)
  await startGame();
}

Script.complete(); // Siempre llamar a complete, incluso si se usa setWidget

// --- CÓDIGO HTML/JS DEL JUEGO (sin cambios, se mantiene el último estado) ---

/**
 * Genera la estructura HTML y el código JavaScript del juego.
 * @returns {string} Código HTML completo.
 */
function getMahjongHtml() {
  // Se usa un template literal para evitar concatenaciones complejas.
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=0.60, user-scalable=yes">
    <title>Mahjong Solitario</title>
    <style>
      /* --- Estilos Globales y Layout --- */
      body {
        margin: 0;
        overflow: hidden;
        background-color: #0A192F; /* Azul Oscuro Marino */
        display: flex;
        flex-direction: column; 
        justify-content: center;
        align-items: center;
        height: 100vh; 
        position: relative;
        font-family: 'Roboto', Arial, sans-serif; /* Fuente moderna */
        color: #ccd6f6; /* Texto claro */
      }
      canvas {
        display: block;
        border: 4px solid #3d5a80; /* Borde más definido */
        background-color: #173f27; /* Verde Oscuro Profundo */
        width: 1100px; 
        height: 880px; 
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.05); /* Sombra más pronunciada */
        border-radius: 12px; /* Bordes redondeados */
      }
      
      /* --- Contenedor de Interfaz (UI) --- */
      #uiContainer {
          display: flex;
          gap: 30px;
          z-index: 50;
          margin-bottom: 20px; 
          padding: 15px 30px; 
          align-items: center; 
          background-color: rgba(255, 255, 255, 0.05); /* Base 'Glass' */
          backdrop-filter: blur(5px); /* Desenfoque 'Glass' */
          border-radius: 15px; 
          border: 1px solid rgba(255, 255, 255, 0.1); 
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }
      
      /* --- Contador de Movimientos --- */
      #moveCounter {
          background-color: #3d5a80; /* Azul grisáceo vibrante */
          color: #FFD700; /* Dorado para el contraste */
          padding: 12px 25px;
          border-radius: 10px;
          font-weight: 900; /* Extra bold */
          font-size: 22px; 
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6), 0 4px 10px rgba(0, 0, 0, 0.4);
          letter-spacing: 1px;
      }

      /* --- Pantalla de Game Over --- */
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
        background-color: rgba(0, 0, 0, 0.95); /* Fondo más oscuro */
        z-index: 100;
        border-radius: 0; 
      }
      #gameOverScreen h1 {
        color: #64ffda; /* Color de acento moderno (Cian) */
        font-size: 50px; 
        margin-bottom: 20px;
        text-shadow: 0 0 15px rgba(100, 255, 218, 0.7); /* Efecto neón suave */
        font-weight: bold;
      }
      #gameOverScreen p {
        color: #ccd6f6;
        font-size: 24px;
        margin-bottom: 50px;
        text-align: center;
        max-width: 90%;
      }
      #gameOverButtons {
          display: flex;
          gap: 30px; 
      }
      
      /* --- Estilos de Botón Moderno --- */
      #restartButton, #shuffleOptionButton { 
        padding: 15px 35px; 
        background-color: #D32F2F; /* Rojo principal */
        border: none;
        border-radius: 8px; 
        color: white;
        font-size: 24px; 
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.3s, transform 0.2s, box-shadow 0.3s; /* Transiciones añadidas */
        box-shadow: 0 5px 15px rgba(211, 47, 47, 0.5); /* Sombra de color para el botón */
        letter-spacing: 0.5px;
      }
      
      #shuffleOptionButton {
          background-color: #388E3C; /* Verde para la opción de continuar */
          box-shadow: 0 5px 15px rgba(56, 142, 60, 0.5);
      }
      
      #restartButton:hover {
        background-color: #B71C1C;
        transform: translateY(-3px); 
        box-shadow: 0 8px 20px rgba(211, 47, 47, 0.7); 
      }
      
      #shuffleOptionButton:hover {
        background-color: #2E7D32;
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(56, 142, 60, 0.7); 
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
      // Uso de 'const' para todas las referencias DOM.
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
      let gameInterval = null; // Se inicializa como null
      let pairsRemoved = 0; 
      const TOTAL_TILES = 144; 

      // --- CONSTANTES DEL JUEGO Y DIMENSIONES ---
      
      const TILE_WIDTH = 48;
      const TILE_HEIGHT = 72;
      const TILE_DEPTH_X = 3; 
      const TILE_DEPTH_Y = 3; 
      const TILE_SCALE = 1.0; 
      const TILE_RADIUS = 4; 
      // FONT_SIZE en 55px (tamaño ajustado para no desbordar)
      const FONT_SIZE = '55px'; 
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
      
      const SPECIAL_TILES_KEYS = ['F1','F2','F3','F4','S1','S2','S3','S4'];

      const TILE_TYPES = Object.keys(TILE_MAP)
          .filter(key => key.length > 1 && !SPECIAL_TILES_KEYS.includes(key)) 
          .flatMap(type => Array(4).fill(type));

      TILE_TYPES.push(...SPECIAL_TILES_KEYS); 

      // Extensión de prototipo de Canvas: Mejor usar una función separada o reescribir para evitar mutar el prototipo global, 
      // pero se mantiene para no romper la compatibilidad con el código original.
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

          // Uso de 'map' y 'sort' en una sola cadena para crear y ordenar posiciones.
          const positions = coordList.map(c => ({ x: c[0], y: c[1], z: c[2] }))
                                     .sort((a, b) => b.z - a.z);
          
          return positions; 
      }
      
      // --- FUNCIONES DE UTILIDAD ---
      
      /**
       * Calcula la cantidad de pares que se pueden remover del tablero.
       * @returns {number} Número de movimientos posibles.
       */
      function getPossibleMovesCount() {
          // Simplificación: solo se filtran las libres y no removidas en una variable
          const freeTiles = board.filter(t => !t.removed && t.isFree);
          let possibleMoves = 0;
          
          // Se utiliza un bucle anidado eficiente para la comparación de pares
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
          // Uso de template literal para la actualización del texto
          moveCounter.textContent = \`Movimientos Posibles: \${possibleMoves}\`;
          return possibleMoves;
      }

      function shuffleArray(array) {
          for (let i = array.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [array[i], array[j]] = [array[j], array[i]]; // Destructuring swap
          }
      }

      /**
       * Baraja las fichas restantes en el tablero.
       */
      function shuffleBoardAndContinue() {
          const remainingTiles = board.filter(t => !t.removed);
          
          if (remainingTiles.length === 0) return; 

          let remainingTypes = remainingTiles.map(t => t.type);
          shuffleArray(remainingTypes);
          
          // Uso de 'forEach' más limpio
          remainingTiles.forEach((tile, i) => {
              tile.type = remainingTypes[i];
              tile.isFlowerOrSeason = SPECIAL_TILES_KEYS.includes(remainingTypes[i]);
          });
          
          // Resetear el estado de selección y libertad
          selectedTiles.forEach(t => t.isSelected = false);
          selectedTiles = [];
          updateTileFreedom();

          // Reiniciar el juego si estaba en Game Over
          if (gameOver) {
              gameOver = false;
              gameOverScreen.style.display = 'none';
              if (!gameInterval) {
                 gameInterval = setInterval(gameLoop, 1000 / 30);
              }
          }
          updateMoveCounter(); 
      }


      /**
       * Inicializa el tablero y los estados del juego.
       */
      function initializeGame() {
          const positions = generateExactLayoutPositions();
          let tileTypes = [...TILE_TYPES];
          
          if (tileTypes.length > positions.length) {
              tileTypes = tileTypes.slice(0, positions.length);
          }
          
          shuffleArray(tileTypes);
          
          // Crear las fichas usando 'map'
          board = positions.map((pos, i) => ({
              id: i,
              type: tileTypes[i],
              x: pos.x,
              y: pos.y,
              z: pos.z,
              removed: false,
              isFree: false, // Se recalcula después
              isSelected: false,
              isFlowerOrSeason: SPECIAL_TILES_KEYS.includes(tileTypes[i]) 
          }));
          
          selectedTiles = [];
          gameOver = false;
          pairsRemoved = 0; 
          
          // CÁLCULOS DE CENTRADO (CORREGIDO)
          const max_x = 28; 
          const max_y = 14; 
          const max_z = 4;
          
          // Ancho y alto del layout base sin considerar la profundidad
          const TILE_WIDTH_PIXELS = max_x * TILE_UNIT_X * TILE_SCALE; 
          const TILE_HEIGHT_PIXELS = max_y * TILE_UNIT_Y * TILE_SCALE; 
          
          // 1. Calcular el ancho total Ocupado (incluyendo la profundidad 3D de la capa más alta)
          const totalLayoutWidth = TILE_WIDTH_PIXELS + (max_z * TILE_DEPTH_X); 
          
          // 2. Calcular el inicio X: (Ancho Canvas / 2) - (Ancho Total Layout / 2)
          LAYOUT_START_X = (canvas.width / 2) - (totalLayoutWidth / 2); 
          
          // 3. Calcular el inicio Y: (Alto Canvas / 2) - (Alto Total Layout / 2)
          LAYOUT_START_Y = (canvas.height / 2) - (TILE_HEIGHT_PIXELS / 2);

          // Inicio de bucle y comprobación de movimientos
          updateTileFreedom(); 
          updateMoveCounter(); 
          gameOverScreen.style.display = 'none';

          if (gameInterval) clearInterval(gameInterval);
          gameInterval = setInterval(gameLoop, 1000 / 30);
      }

      // --- FUNCIONES DE JUEGO ---

      /**
       * Comprueba si dos fichas coinciden (igual tipo o ambas son Especiales).
       */
      function areTilesMatching(tile1, tile2) {
          if (tile1.id === tile2.id) return false;
          // Las fichas especiales (Flores/Estaciones) coinciden entre sí
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
              t.x >= x - 1 && t.x <= x + 1 && // Rango en X (x-1, x, x+1)
              t.y >= y - 1 && t.y <= y + 1   // Rango en Y (y-1, y, y+1)
          );
          
          if (isCovered) {
              return false;
          }
          
          // CASO ESPECIAL 1: Cúspide (la capa más alta)
          if (z === 4) return true; 

          // CASO ESPECIAL 2: Extremos Absolutos
          // Los extremos (x=0 y x=28) están libres si no están cubiertos.
          if (x === 0 || x === 28) { 
              return true; 
          } 

          // 2. Chequeo de lateralidad para TODAS las demás fichas
          // Chequea si hay una ficha en el mismo nivel, 2 unidades a la izquierda o derecha.
          const hasTileLeft = board.some(t => 
              !t.removed && t.x === x - 2 && t.y === y && t.z === z
          );
          const hasTileRight = board.some(t => 
              !t.removed && t.x === x + 2 && t.y === y && t.z === z
          );
          
          // Una ficha es libre si no está bloqueada por AMBOS lados.
          return !hasTileLeft || !hasTileRight;
      }


      function updateTileFreedom() {
          // Uso de 'forEach'
          board.forEach(tile => {
              if (!tile.removed) {
                  tile.isFree = checkTileFreedom(tile);
              } else {
                  // Limpieza: asegura que una ficha removida no esté marcada como libre.
                  tile.isFree = false; 
              }
          });
      }

      function drawTile(tile) {
          if (tile.removed) return;
          const map = TILE_MAP[tile.type];
          if (!map) return;
          
          // Calcular posición de dibujo (mantenida la lógica original)
          const z_offset_x = tile.z * TILE_DEPTH_X;
          const z_offset_y = tile.z * TILE_DEPTH_Y;
          let drawX = LAYOUT_START_X + tile.x * TILE_UNIT_X * TILE_SCALE + z_offset_x;
          let drawY = LAYOUT_START_Y + tile.y * TILE_UNIT_Y * TILE_SCALE - z_offset_y;

          // Animación de elevación para fichas seleccionadas
          if (tile.isSelected) {
              drawY -= 5; 
          }
          
          const W = TILE_WIDTH;
          const H = TILE_HEIGHT;
          const R = TILE_RADIUS;
          const D = TILE_DEPTH_X; // Usado para la profundidad del 3D
          
          const isFree = tile.isFree;
          const isSelected = tile.isSelected;
          const fillColor = isSelected ? '#FFD700' : (isFree ? '#FFFFFF' : '#D0D0D0');
          const sideColor = isSelected ? '#CCAA00' : (isFree ? '#E0E0E0' : '#B0B0B0');
          
          // --- Sombra ---
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'; // Sombra más oscura
          ctx.shadowBlur = 8; // Sombra más suave
          ctx.shadowOffsetX = 4;
          ctx.shadowOffsetY = 4;

          // --- Lados 3D (Refactorizado ligeramente para ser más claro) ---
          ctx.fillStyle = sideColor;
          
          // Lado derecho
          ctx.fillRect(drawX + W, drawY + D, D, H - D); 
          ctx.beginPath();
          ctx.moveTo(drawX + W, drawY + H);
          ctx.lineTo(drawX + W + D, drawY + H - D);
          ctx.lineTo(drawX + W + D, drawY + H); 
          ctx.lineTo(drawX + W, drawY + H);
          ctx.closePath();
          ctx.fill();

          // Lado superior
          ctx.fillStyle = sideColor;
          ctx.fillRect(drawX + R, drawY - D, W - R, D); 
          ctx.beginPath();
          ctx.moveTo(drawX + W, drawY);
          ctx.lineTo(drawX + W + D, drawY - D);
          ctx.lineTo(drawX + W + D, drawY); 
          ctx.closePath();
          ctx.fill();
          
          // --- Cara principal ---
          ctx.shadowColor = 'rgba(0, 0, 0, 0)'; // Desactivar sombra para la cara principal y el texto
          ctx.lineWidth = 3; // Borde más grueso

          // Relleno
          ctx.fillStyle = fillColor;
          ctx.roundRect(drawX, drawY, W, H, R).fill();
          
          // Borde
          ctx.strokeStyle = '#000';
          ctx.roundRect(drawX, drawY, W, H, R).stroke();


          // --- Carácter UNICODE (AJUSTADO) ---
          ctx.fillStyle = map.color;
          // Uso de template literal para la fuente
          ctx.font = \`bold \${FONT_SIZE} Arial\`; 
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Centrado vertical AJUSTADO CON DESPLAZAMIENTO NEGATIVO
          ctx.fillText(map.char, drawX + W / 2, drawY + H / 2 - 5); 
          
          // --- Marcar Ficha Libre (Borde cian moderno) ---
          if(isFree) {
              ctx.strokeStyle = '#64ffda'; // Cian moderno
              ctx.lineWidth = 4; // Borde más prominente
              ctx.roundRect(drawX, drawY, W, H, R).stroke();
          }
      }
      
      function handleTileSelection(tile) {
          if (tile.isSelected) {
              // Deseleccionar
              tile.isSelected = false;
              selectedTiles = selectedTiles.filter(t => t.id !== tile.id);
          } else if (selectedTiles.length < 2) {
              // Seleccionar
              tile.isSelected = true;
              selectedTiles.push(tile);
          }

          if (selectedTiles.length === 2) {
              const [tile1, tile2] = selectedTiles;
              
              if (areTilesMatching(tile1, tile2)) {
                  // Coincidencia exitosa
                  tile1.removed = true;
                  tile2.removed = true;
                  selectedTiles.forEach(t => t.isSelected = false);
                  selectedTiles = [];
                  pairsRemoved++;
                  updateTileFreedom(); 
                  updateMoveCounter(); 
                  
              } else {
                  // No hay coincidencia: deseleccionar después de un retraso
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
          
          // Cálculo de coordenadas de clic
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          const clickX = (event.clientX - rect.left) * scaleX;
          const clickY = (event.clientY - rect.top) * scaleY;
          let clickedTile = null;
          
          // Priorizar la detección de clics en las fichas superiores (mayor Z)
          const visibleTiles = board.filter(t => !t.removed).sort((a, b) => b.z - a.z); 

          for (const tile of visibleTiles) {
              // Recalcular la posición de dibujo para la detección
              const z_offset_x = tile.z * TILE_DEPTH_X;
              const z_offset_y = tile.z * TILE_DEPTH_Y;
              let drawX = LAYOUT_START_X + tile.x * TILE_UNIT_X * TILE_SCALE + z_offset_x;
              let drawY = LAYOUT_START_Y + tile.y * TILE_UNIT_Y * TILE_SCALE - z_offset_y;

              if (tile.isSelected) {
                  drawY -= 5; 
              }
              
              // Área de detección expandida para el efecto 3D
              const detectionX = drawX;
              const detectionY = drawY - TILE_DEPTH_Y; 
              const detectionW = TILE_WIDTH + TILE_DEPTH_X;
              // +5 extra por la elevación del seleccionado.
              const detectionH = TILE_HEIGHT + TILE_DEPTH_Y + 5; 

              if (clickX >= detectionX && clickX <= detectionX + detectionW &&
                  clickY >= detectionY && clickY <= detectionH + detectionY) {
                  clickedTile = tile;
                  break; // Se detiene al encontrar la primera ficha visible
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
              gameInterval = null; // Limpieza de la referencia
              gameOverScreen.style.display = 'flex';
              return;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Dibujar en orden de Z (profundidad, de menor a mayor Z)
          // Se mantiene la ordenación original para evitar problemas de solapamiento visual
          const sortedTiles = board.filter(t => !t.removed).sort((a, b) => a.z - b.z);
          
          sortedTiles.forEach(drawTile);

          // Mantenido al final del loop para que el contador se actualice
          checkGameOver(); 
      }

      // 💥 LISTENERS 💥
      
      // Reinicio Completo
      restartButton.addEventListener('click', () => {
          // No es necesario modificar gameOver aquí, lo maneja initializeGame
          initializeGame(); 
      });
      
      // Barajar y Continuar
      shuffleOptionButton.addEventListener('click', () => {
          // No es necesario modificar gameOver aquí, lo maneja shuffleBoardAndContinue
          shuffleBoardAndContinue(); 
      });

      // Iniciar el juego
      initializeGame();
    </script>
  </body>
  </html>
  `;
}
