const canvas_config = {
    width: 300,
    height: 600
}

const game_config = {
    numberOfRows: 20,
    numberOfColumns: 10,
    borderSize: .2
}  

const cellSize = canvas_config.width / game_config.numberOfColumns;

const key = {    
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
}

const blocks = [
    {             
        color: "cyan",
        format: [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ]
    },
    {                 
        color: "sandybrown",
        format: [
            [2, 0, 0],
            [2, 0, 0],
            [2, 2, 0],
        ]
    },
    {                 
        color: "royalblue",
        format: [
            [0, 0, 3],
            [0, 0, 3],
            [0, 3, 3],
        ]
    },
    {                
        color: "violet",
        format: [
            [0, 4, 0],
            [4, 4, 4],
            [0, 0, 0],
        ]
    },
    {                
        color: "orangered",
        format: [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ]
    },
    {                 
        color: "limegreen",
        format: [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ]
    },
    {                
        color: "gold",
        format: [
            [7, 7],
            [7, 7],
        ]
    }
]

const blockTypes = {
    z : blocks[4],
    s: blocks[5],
    i: blocks[0],
    l: blocks[1],
    j: blocks[2],
    o: blocks[6],
    t: blocks[3],
  }

class Block {
    constructor(cells, x, y){
        this.cells = cells;
        this.position = {x, y};
        this.isAlive = true;
    }

    rotate() {
        const newCells = [];

        for (let i = 0; i < this.cells.length; i++){
            newCells[i] = [];
            for(let j = 0; j < this.cells.length; j++){
                newCells[i][j] = this.cells[this.cells.length - 1 - j][i];
            }
        }

        this.cells = newCells;
    }

    moveBlockByEvent(e, field) {
        switch(e.keyCode){
            case key.LEFT : {
                this.position.x--;
                break;
            }
            case key.RIGHT : {
                this.position.x++;
                break;
            }
            case key.DOWN : {                 
                this.position.y++;        
                break;
            }
            case key.UP : {
                this.rotate();
                break;
            }
        }
    }

    findCollison(field) {
        const {x, y} = this.position;
        this.cells.forEach((rows, i) => {
            rows.forEach((cell, j) => {
                if(cell && (y + i >= game_config.numberOfRows || field[y + i][x + j]) ){
                    this.isAlive = false;
                    return;
                }
            });
        });
    }

}

Block.timeToChange = 1000;

const canMoveLeft = (block, field) => {
    const {cells, position} = block;
    const {x, y} = position;

    return !cells.some((rows, i) => {
        return rows.some((cell, j) => {
            if( 
                (cell && x + j < 0) ||
                (cell && x + j >= game_config.numberOfColumns) ||
                (cell && field[y + i][x + j]) 
            ) return true;
        });
    });
    return true;
}

const updateScore = (score) => {
    const scoreElem = document.getElementById('score');
    scoreElem.innerHTML = score;
}

const drawField = (field, ctx) => {
    field.forEach((row, rowIndex) => {        
        row.forEach((cell, columnIndex) => {                                              
            ctx.fillStyle = cell ? blocks[cell - 1].color : 'lightgray';            
            ctx.strokeStyle = "#333";
            ctx.lineWidth = game_config.borderSize;

            const args = [
                columnIndex * cellSize, rowIndex * cellSize,
                cellSize, cellSize,
            ]

            ctx.fillRect(...args);
            ctx.strokeRect(...args);        
        });
    });
}

const { requestAnimationFrame } = window;
const fps = 25;
const timeToMoveDown = 200;

let counterOfF = 0;
let prevTime = 0;
let prevPosition = {x: 0, y: 0};
let prevBlockCells = [[]];

const render = (game, block, time) => {
    const {ctx, field} = game;

    if(!block) {
        const arrOfTypes = Object.values(blockTypes);
        const blockType = arrOfTypes[arrOfTypes.length * Math.random() | 0].format;        
        const x = ((game_config.numberOfColumns - blockType.length) / 2) | 0;
        block = new Block(blockType, x , 0);
        prevPosition = {x, y: 0};
        addEventListener("keydown", (e) => block.moveBlockByEvent.bind(block)(e, field));
    }

    const {position} = block;

    if(time - prevTime > 1000 / fps){
        counterOfF++;
        if(counterOfF === (fps * timeToMoveDown) / 1000){
            counterOfF = 0;
            if(block && block.isAlive) {
                position.y++;
            }else{
                block = null;
            }
        }

        prevTime = time;

        insertIntoArray(prevBlockCells, field, prevPosition.y, prevPosition.x, true);

        const canMove = canMoveLeft(block, field);
        if(!canMove) {
            position.x = prevPosition.x;
            block.cells = prevBlockCells;
        }

        if(position.y > prevPosition.y) {
            position.y = prevPosition.y + 1;
        }

        block.findCollison(field);
        
        if(block.isAlive){
            insertIntoArray(block.cells, field, position.y, position.x);
            drawField(field, ctx);
            prevPosition = Object.assign({}, position);
            prevBlockCells = [].concat(block.cells);
        }else if ( prevPosition.y > block.cells.length - 1){
            insertIntoArray(block.cells, field, prevPosition.y, prevPosition.x);
            game.field = findFilledRow(field);
            drawField(game.field, ctx);
            block = null;
        }else {
            insertIntoArray(prevBlockCells, field, prevPosition.y, prevPosition.x);
            const lastBlock = block.cells.filter((row) => !row.every((cell) => !cell)).slice(-prevPosition.y);
            insertIntoArray(lastBlock, field, 0, position.x);
            drawField(game.field, ctx);
            setTimeout(() => {alert("Game Over!")}, 0);
            game.field = generateField(game_config.numberOfRows + 4, game_config.numberOfColumns);
            updateScore(0);
            block = null;
        }
    }

    requestAnimationFrame((time) => render(game, block, time));
}

const insertIntoArray = (childArr, parentArr, row, col, clearMode) => {
    let i = 0;
    while(i < childArr.length){
        let j = 0;
        while(j < childArr[i].length){
            parentArr[row + i][col + j] = !clearMode ? childArr[i][j] ? childArr[i][j] : parentArr[row + i][col + j] : childArr[i][j] ? 0 : parentArr[row + i][col + j];
            j++; 
        }
        i++;
    }
}

let score = 0;
const findFilledRow = (field) => {
    const filteredField = field.filter((row) => row.some((cell) => (cell === 0)));
    const diff = field.length - filteredField.length;
    score += diff * 100;
    updateScore(score);
    const filledArr = generateField(diff, game_config.numberOfColumns);
    return [...filledArr, ...filteredField];
}

const generateField = (rows, cols) => {
    const field = Array.from({length: rows},
            () => Array.from({length: cols}, () => 0));
    return field;
}

window.onload = () => {
    const canvas = document.getElementById('map');
    const ctx = canvas.getContext('2d');

    canvas.width = canvas_config.width;
    canvas.height = canvas_config.height;

    const game = {
      ctx,
      field: generateField(game_config.numberOfRows + 4, game_config.numberOfColumns),
    }
    render(game);
}