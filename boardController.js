// boardController.js
// Controlador para gestión de tableros (múltiples tableros)

const BoardController = {
    handleBoardChange: function(boardId) {
        if (boardId && boardId !== StorageController.currentBoardId) {
            const container = document.querySelector('.container');
            if (container) container.classList.add('board-switching');
            StorageController.switchBoard(boardId);
            setTimeout(() => {
                if (container) container.classList.remove('board-switching');
            }, 300);
        }
    },
    showCreateBoardModal: function() {
        const name = prompt('Ingresa el nombre del nuevo tablero:');
        if (name && name.trim()) {
            const boardId = StorageController.createBoard(name.trim());
            if (boardId) {
                StorageController.switchBoard(boardId);
            }
        }
    },
    showRenameBoardModal: function() {
        const currentBoard = StorageController.getCurrentBoard();
        if (!currentBoard) {
            StorageController.notify('No hay tablero activo', 'error');
            return;
        }
        const newName = prompt(`Renombrar tablero "${currentBoard.name}":`, currentBoard.name);
        if (newName && newName.trim() && newName.trim() !== currentBoard.name) {
            StorageController.renameBoard(StorageController.currentBoardId, newName.trim());
        }
    },
    confirmDeleteBoard: function() {
        const currentBoard = StorageController.getCurrentBoard();
        if (!currentBoard) {
            StorageController.notify('No hay tablero activo', 'error');
            return;
        }
        StorageController.deleteBoard(StorageController.currentBoardId);
    },
    initializeBoards: function() {
        StorageController.initializeBoards();
        StorageController.updateBoardSelector();
    }
};

window.BoardController = BoardController;
