document.addEventListener('DOMContentLoaded', () => {
    const mazeElement = document.getElementById('maze');
    const playerElement = document.getElementById('player');
    let cellSize = 15; // Kích thước ô ban đầu
    let playerX = 0; // Tọa độ X của người chơi theo ô (cột)
    let playerY = 0; // Tọa độ Y của người chơi theo ô (hàng)

    const MAZE_SIZE = 51; // Kích thước mỗi mê cung (ví dụ: 51x51) - Tăng kích thước để phức tạp hơn
    const NUM_MAZES = 30; // Số lượng mê cung

    // Lấy các nút điều khiển di động
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');

    // --- Biến và hàm mới cho phóng to/thu nhỏ ---
    let initialPinchDistance = null;
    let currentScale = 1;
    const MIN_SCALE = 0.5; // Kích thước ô nhỏ nhất (tỷ lệ so với cellSize gốc)
    const MAX_SCALE = 3.0; // Kích thước ô lớn nhất (tỷ lệ so với cellSize gốc)
    const originalCellSize = 15; // Lưu kích thước ô ban đầu

    function updateMazeAndPlayerScale() {
        const scaledCellSize = originalCellSize * currentScale;

        mazeElement.style.gridTemplateColumns = `repeat(${currentMazeData.map[0].length}, ${scaledCellSize}px)`;
        mazeElement.style.gridTemplateRows = `repeat(${currentMazeData.map.length}, ${scaledCellSize}px)`;
        // Không đặt width/height cố định cho mazeElement để nó co giãn theo content,
        // hoặc đặt max-width/max-height trên một container cha.
        // mazeElement.style.width = `${currentMazeData.map[0].length * scaledCellSize}px`;
        // mazeElement.style.height = `${currentMazeData.map.length * scaledCellSize}px`;

        playerElement.style.width = `${scaledCellSize}px`;
        playerElement.style.height = `${scaledCellSize}px`;
        updatePlayerPosition(scaledCellSize); // Cập nhật vị trí người chơi với cellSize mới
    }

    function getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    mazeElement.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            initialPinchDistance = getDistance(e.touches[0], e.touches[1]);
            // Prevent default behavior like scrolling or text selection
            e.preventDefault();
        }
    }, { passive: false }); // Use passive: false to allow preventDefault

    mazeElement.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && initialPinchDistance) {
            const currentPinchDistance = getDistance(e.touches[0], e.touches[1]);
            let scaleFactor = currentPinchDistance / initialPinchDistance;

            // Apply scaling relative to current scale
            currentScale = Math.min(Math.max(currentScale * scaleFactor, MIN_SCALE), MAX_SCALE);
            initialPinchDistance = currentPinchDistance; // Update initial distance for smooth continuous scaling

            updateMazeAndPlayerScale();
            e.preventDefault(); // Prevent scrolling while pinching
        }
    }, { passive: false }); // Use passive: false to allow preventDefault

    mazeElement.addEventListener('touchend', (e) => {
        initialPinchDistance = null; // Reset pinch state
    });

    // --- Kết thúc phần mới cho phóng to/thu nhỏ ---

    // Hàm tạo mê cung ngẫu nhiên phức tạp hơn (sử dụng Prim's Algorithm cải tiến)
    function generateAdvancedMaze(rows, cols) {
        // Khởi tạo tất cả là tường
        const map = Array(rows).fill(0).map(() => Array(cols).fill(1));

        // Chọn điểm bắt đầu ngẫu nhiên (chỉ các ô lẻ để tạo đường đi đúng chuẩn mê cung)
        let startR = Math.floor(Math.random() * (rows - 2) / 2) * 2 + 1;
        let startC = Math.floor(Math.random() * (cols - 2) / 2) * 2 + 1;

        map[startR][startC] = 0; // Đặt điểm bắt đầu là đường đi

        let frontier = []; // Danh sách các tường "biên giới"

        // Thêm các ô tường lân cận (cách 2 đơn vị) vào danh sách frontier
        const addNeighborsToFrontier = (r, c) => {
            const directions = [
                [-2, 0], [2, 0], [0, -2], [0, 2]
            ];
            for (const [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 1 && nr < rows - 1 && nc >= 1 && nc < cols - 1 && map[nr][nc] === 1) {
                    if (!frontier.some(item => item[0] === nr && item[1] === nc)) {
                        frontier.push([nr, nc]);
                    }
                }
            }
        };

        addNeighborsToFrontier(startR, startC);

        while (frontier.length > 0) {
            // Chọn ngẫu nhiên một ô từ danh sách frontier
            const randomIndex = Math.floor(Math.random() * frontier.length);
            const [r, c] = frontier.splice(randomIndex, 1)[0];

            const visitedNeighbors = [];
            const directions = [
                [-2, 0], [2, 0], [0, -2], [0, 2]
            ];

            // Tìm các hàng xóm đã được thăm (là đường đi)
            for (const [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 1 && nr < rows - 1 && nc >= 1 && nc < cols - 1 && map[nr][nc] === 0) {
                    visitedNeighbors.push([nr, nc]);
                }
            }

            if (visitedNeighbors.length > 0) {
                // Chọn ngẫu nhiên một hàng xóm đã được thăm
                const [targetR, targetC] = visitedNeighbors[Math.floor(Math.random() * visitedNeighbors.length)];

                // Phá tường giữa ô hiện tại (r,c) và ô hàng xóm đã thăm (targetR, targetC)
                map[r][c] = 0; // Biến ô tường thành đường đi
                map[r + (targetR - r) / 2][c + (targetC - c) / 2] = 0; // Phá tường ở giữa

                // Thêm các ô tường lân cận của ô vừa được mở vào danh sách frontier
                addNeighborsToFrontier(r, c);
            }
        }

        // Đảm bảo lối vào và lối ra nằm ở các vị trí cố định
        let entryPoint = [1, 1];
        let exitPoint = [rows - 2, cols - 2];

        // Nếu điểm start/end mặc định là tường, tìm điểm đường đi gần nhất
        if (map[entryPoint[0]][entryPoint[1]] === 1) {
            for (let i = 1; i < rows - 1; i++) {
                if (map[i][1] === 0) {
                    entryPoint = [i, 1];
                    break;
                }
                if (map[1][i] === 0) {
                    entryPoint = [1, i];
                    break;
                }
            }
        }
        if (map[exitPoint[0]][exitPoint[1]] === 1) {
            for (let i = rows - 2; i > 0; i--) {
                if (map[i][cols - 2] === 0) {
                    exitPoint = [i, cols - 2];
                    break;
                }
                if (map[rows - 2][i] === 0) {
                    exitPoint = [rows - 2, i];
                    break;
                }
            }
        }

        // Đảm bảo điểm bắt đầu và kết thúc là đường đi
        map[entryPoint[0]][entryPoint[1]] = 0;
        map[exitPoint[0]][exitPoint[1]] = 0;

        // Thêm một số "nhiễu" hoặc vòng lặp nhỏ để tăng độ khó (phá thêm tường)
        const numExtraPaths = Math.floor((rows * cols) / 50);
        for (let i = 0; i < numExtraPaths; i++) {
            let r = Math.floor(Math.random() * (rows - 2)) + 1;
            let c = Math.floor(Math.random() * (cols - 2)) + 1;
            if (map[r][c] === 1) {
                let pathNeighbors = 0;
                if (r > 0 && map[r-1][c] === 0) pathNeighbors++;
                if (r < rows-1 && map[r+1][c] === 0) pathNeighbors++;
                if (c > 0 && map[r][c-1] === 0) pathNeighbors++;
                if (c < cols-1 && map[r][c+1] === 0) pathNeighbors++;

                if (pathNeighbors >= 2) {
                    map[r][c] = 0;
                }
            }
        }

        return {
            map: map,
            start: entryPoint,
            end: exitPoint
        };
    }

    // Tạo 30 mê cung cực kỳ khó và phức tạp
    const mazeMaps = [];
    for (let i = 0; i < NUM_MAZES; i++) {
        mazeMaps.push(generateAdvancedMaze(MAZE_SIZE, MAZE_SIZE));
    }

    let currentMazeIndex = 0; // Chỉ số của bản đồ hiện tại
    let currentMazeData = mazeMaps[currentMazeIndex]; // Dữ liệu bản đồ đang chơi

    // Hàm tạo mê cung từ bản đồ đã cho
    function createMaze(mazeData) {
        mazeElement.innerHTML = ''; // Xóa mê cung cũ
        const map = mazeData.map;
        const startRow = mazeData.start[0];
        const startCol = mazeData.start[1];
        const endRow = mazeData.end[0];
        const endCol = mazeData.end[1];

        for (let r = 0; r < map.length; r++) {
            for (let c = 0; c < map[r].length; c++) {
                const cell = document.createElement('div');
                cell.classList.add(map[r][c] === 1 ? 'wall' : 'path');
                cell.dataset.row = r;
                cell.dataset.col = c;

                if (r === startRow && c === startCol) {
                    cell.classList.add('start');
                }
                if (r === endRow && c === endCol) {
                    cell.classList.add('end');
                }
                mazeElement.appendChild(cell);
            }
        }
        updateMazeAndPlayerScale(); // Cập nhật tỉ lệ khi mê cung mới được tạo
    }

    // Hàm đặt lại vị trí người chơi và cập nhật trên màn hình
    function resetPlayerPosition() {
        playerY = currentMazeData.start[0];
        playerX = currentMazeData.start[1];
        updatePlayerPosition(originalCellSize * currentScale);
    }

    // Cập nhật vị trí của người chơi trên màn hình (thêm tham số cellSize)
    function updatePlayerPosition(currentCellSize) {
        playerElement.style.left = `${playerX * currentCellSize}px`;
        playerElement.style.top = `${playerY * currentCellSize}px`;
    }

    // Hàm kiểm tra điều kiện thắng
    function checkWinCondition() {
        const endRow = currentMazeData.end[0];
        const endCol = currentMazeData.end[1];

        if (playerX === endCol && playerY === endRow) {
            alert('Chúc mừng! Bạn đã tìm thấy lối thoát!');
            currentMazeIndex++; // Chuyển sang bản đồ tiếp theo
            if (currentMazeIndex < mazeMaps.length) {
                currentMazeData = mazeMaps[currentMazeIndex]; // Cập nhật dữ liệu bản đồ hiện tại

                // Reset scale khi chuyển mê cung để tránh kích thước lạ
                currentScale = 1;
                createMaze(currentMazeData);
                resetPlayerPosition();
                alert(`Chuyển sang bản đồ tiếp theo: Mê cung ${currentMazeIndex + 1}`);
            } else {
                alert('Bạn đã hoàn thành tất cả các mê cung! Chúc mừng!');
                currentMazeIndex = 0; // Reset về bản đồ đầu tiên
                currentMazeData = mazeMaps[currentMazeIndex];

                currentScale = 1; // Reset scale khi hoàn thành tất cả
                createMaze(currentMazeData);
                resetPlayerPosition();
            }
        }
    }

    // Hàm xử lý di chuyển người chơi
    function movePlayer(direction) {
        let newPlayerX = playerX;
        let newPlayerY = playerY;

        switch (direction) {
            case 'up':
                newPlayerY--;
                break;
            case 'down':
                newPlayerY++;
                break;
            case 'left':
                newPlayerX--;
                break;
            case 'right':
                newPlayerX++;
                break;
        }

        // Kiểm tra xem vị trí mới có hợp lệ không (không ra khỏi biên và không va vào tường)
        if (newPlayerX >= 0 && newPlayerX < currentMazeData.map[0].length &&
            newPlayerY >= 0 && newPlayerY < currentMazeData.map.length &&
            currentMazeData.map[newPlayerY][newPlayerX] === 0) { // Chỉ di chuyển nếu là đường đi
            playerX = newPlayerX;
            playerY = newPlayerY;
            updatePlayerPosition(originalCellSize * currentScale); // Cập nhật vị trí với cellSize hiện tại
            checkWinCondition(); // Kiểm tra điều kiện thắng sau mỗi lần di chuyển
        }
    }

    // Xử lý sự kiện nhấn phím để di chuyển người chơi (dành cho máy tính)
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
                movePlayer('up');
                break;
            case 'ArrowDown':
            case 's':
                movePlayer('down');
                break;
            case 'ArrowLeft':
            case 'a':
                movePlayer('left');
                break;
            case 'ArrowRight':
            case 'd':
                movePlayer('right');
                break;
            default:
                return; // Bỏ qua các phím khác
        }
    });

    // Xử lý sự kiện click/touch cho các nút điều khiển di động
    upBtn.addEventListener('touchstart', (e) => { e.preventDefault(); movePlayer('up'); }, { passive: false });
    downBtn.addEventListener('touchstart', (e) => { e.preventDefault(); movePlayer('down'); }, { passive: false });
    leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); movePlayer('left'); }, { passive: false });
    rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); movePlayer('right'); }, { passive: false });

    // Để đảm bảo click vẫn hoạt động trên desktop, bạn có thể thêm lại `click` listeners
    if (!('ontouchstart' in window)) { // Kiểm tra đơn giản xem có hỗ trợ cảm ứng không
        upBtn.addEventListener('click', () => movePlayer('up'));
        downBtn.addEventListener('click', () => movePlayer('down'));
        leftBtn.addEventListener('click', () => movePlayer('left'));
        rightBtn.addEventListener('click', () => movePlayer('right'));
    }

    // Khởi tạo mê cung và vị trí người chơi khi tải trang
    createMaze(currentMazeData);
    resetPlayerPosition();
});
