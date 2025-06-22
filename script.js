document.addEventListener('DOMContentLoaded', () => {
    const mazeElement = document.getElementById('maze');
    const playerElement = document.getElementById('player');
    const cellSize = 15; // Giảm kích thước ô hơn nữa để mê cung lớn hơn hiển thị tốt
    let playerX = 0; // Tọa độ X của người chơi theo ô (cột)
    let playerY = 0; // Tọa độ Y của người chơi theo ô (hàng)

    const MAZE_SIZE = 51; // Kích thước mỗi mê cung (ví dụ: 51x51) - Tăng kích thước để phức tạp hơn
    const NUM_MAZES = 30; // Số lượng mê cung

    // Lấy các nút điều khiển di động
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');

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
        // Cần tìm một ô đường đi gần góc để đặt start/end nếu thuật toán ngẫu nhiên không tạo ra
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
        // Đây là yếu tố tăng "đánh đố 1000 lần" bằng cách tạo nhiều con đường hơn,
        // khiến mê cung không còn là "perfect maze" mà có nhiều lối đi có thể gây nhầm lẫn
        const numExtraPaths = Math.floor((rows * cols) / 50); // Số lượng đường đi phụ
        for (let i = 0; i < numExtraPaths; i++) {
            let r = Math.floor(Math.random() * (rows - 2)) + 1;
            let c = Math.floor(Math.random() * (cols - 2)) + 1;
            // Chỉ phá tường nếu nó có thể tạo ra một lối đi mới giữa hai đường đi hiện có
            if (map[r][c] === 1) {
                let pathNeighbors = 0;
                // Kiểm tra các ô đường đi lân cận
                if (r > 0 && map[r-1][c] === 0) pathNeighbors++;
                if (r < rows-1 && map[r+1][c] === 0) pathNeighbors++;
                if (c > 0 && map[r][c-1] === 0) pathNeighbors++;
                if (c < cols-1 && map[r][c+1] === 0) pathNeighbors++;

                // Phá tường nếu nó nối ít nhất 2 đường đi (tạo ngã ba/vòng lặp)
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

    // Cấu hình kích thước tổng thể của mê cung
    const numRows = currentMazeData.map.length;
    const numCols = currentMazeData.map[0].length;

    mazeElement.style.gridTemplateColumns = `repeat(${numCols}, ${cellSize}px)`;
    mazeElement.style.gridTemplateRows = `repeat(${numRows}, ${cellSize}px)`;
    mazeElement.style.width = `${numCols * cellSize}px`;
    mazeElement.style.height = `${numRows * cellSize}px`;

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
    }

    // Hàm đặt lại vị trí người chơi và cập nhật trên màn hình
    function resetPlayerPosition() {
        playerY = currentMazeData.start[0];
        playerX = currentMazeData.start[1];
        updatePlayerPosition();
    }

    // Cập nhật vị trí của người chơi trên màn hình
    function updatePlayerPosition() {
        playerElement.style.left = `${playerX * cellSize}px`;
        playerElement.style.top = `${playerY * cellSize}px`;
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

                // Cập nhật lại kích thước mê cung (nếu các mê cung có thể khác kích thước)
                const newNumRows = currentMazeData.map.length;
                const newNumCols = currentMazeData.map[0].length;
                mazeElement.style.gridTemplateColumns = `repeat(${newNumCols}, ${cellSize}px)`;
                mazeElement.style.gridTemplateRows = `repeat(${newNumRows}, ${cellSize}px)`;
                mazeElement.style.width = `${newNumCols * cellSize}px`;
                mazeElement.style.height = `${newNumRows * cellSize}px`;

                createMaze(currentMazeData);
                resetPlayerPosition();
                alert(`Chuyển sang bản đồ tiếp theo: Mê cung ${currentMazeIndex + 1}`);
            } else {
                alert('Bạn đã hoàn thành tất cả các mê cung! Chúc mừng!');
                // Có thể thêm logic để reset game hoặc hiển thị màn hình kết thúc
                currentMazeIndex = 0; // Reset về bản đồ đầu tiên
                currentMazeData = mazeMaps[currentMazeIndex];

                // Cập nhật lại kích thước mê cung cho bản đồ đầu tiên
                const firstNumRows = currentMazeData.map.length;
                const firstNumCols = currentMazeData.map[0].length;
                mazeElement.style.gridTemplateColumns = `repeat(${firstNumCols}, ${cellSize}px)`;
                mazeElement.style.gridTemplateRows = `repeat(${firstNumRows}, ${cellSize}px)`;
                mazeElement.style.width = `${firstNumCols * cellSize}px`;
                mazeElement.style.height = `${firstNumRows * cellSize}px`;

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
            updatePlayerPosition();
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
    // THAY ĐỔI CƠ BẢN Ở ĐÂY: Thêm 'touchstart' với e.preventDefault()
    upBtn.addEventListener('touchstart', (e) => { e.preventDefault(); movePlayer('up'); }, { passive: false });
    upBtn.addEventListener('click', () => movePlayer('up'));

    downBtn.addEventListener('touchstart', (e) => { e.preventDefault(); movePlayer('down'); }, { passive: false });
    downBtn.addEventListener('click', () => movePlayer('down'));

    leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); movePlayer('left'); }, { passive: false });
    leftBtn.addEventListener('click', () => movePlayer('left'));

    rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); movePlayer('right'); }, { passive: false });
    rightBtn.addEventListener('click', () => movePlayer('right'));


    // Khởi tạo mê cung và vị trí người chơi khi tải trang
    createMaze(currentMazeData);
    resetPlayerPosition();
});
