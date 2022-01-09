export class App {
    constructor() {
        this.rootElement = document.querySelector(".life-game");    // TODO 引数から初期化する
    }

    mount() {
        this.boardElement = this.rootElement.querySelector(".lg-board");
        // mount toolbar
        const stepElement = this.rootElement.querySelector(".lg-step-button");
        stepElement.addEventListener("click", () => this.step());
        const createElement = this.rootElement.querySelector(".lg-create-button");
        createElement.addEventListener("click", () => this.initBoard());
        // init board
        this.initBoard();
    }

    initBoard() {
        this.mx = 16;    // TODO
        this.my = 16;
        this._cells = new Array(this.mx).fill().map(() => new Array(this.my).fill());
        // init boardElement
        this.boardElement.style["grid-template-columns"] = `repeat(${this.mx}, min-content)`;
        this.boardElement.style["grid-template-rows"] = `repeat(${this.my}, min-content)`;
        this.boardElement.innerHTML = "";
        for (let j = 0; j < this.my; j++) {
            for (let i = 0; i < this.mx; i++) {
                const cellElement = document.createElement("div");
                cellElement.dataset.around = "0";
                cellElement.addEventListener("click", () => this.toggleCell(i, j));
                // append
                this.boardElement.appendChild(cellElement);
                this._cells[i][j] = cellElement;
            }
        }
    }

    step() {
        const bornRule = Array.from("B3");     // TODO
        const surviveRule = Array.from("S23");
        // aroundMatrix を覚えておく
        const aroundMatrix = new Array(this.mx).fill().map(() => new Array(this.my));
        for (let i = 0; i < this.mx; i++) {
            for (let j = 0; j < this.my; j++) {
                aroundMatrix[i][j] = this._cells[i][j].dataset.around;
            }
        }
        //
        for (let i = 0; i < this.mx; i++) {
            for (let j = 0; j < this.my; j++) {
                const around = aroundMatrix[i][j];
                if (bornRule.includes(around)) {
                    this.changeCell(i, j, true);
                } else if (surviveRule.includes(around)) {
                } else {
                    this.changeCell(i, j, false);
                }
            }
        }
    }

    toggleCell(x, y) {
        const isBorn = !this._cells[x][y].classList.contains("lg-alive-cell");
        this.changeCell(x, y, isBorn);
    }

    changeCell(x, y, isBorn) {
        const cellElement = this._cells[x][y];
        if (isBorn === cellElement.classList.contains("lg-alive-cell")) return;
        cellElement.classList.toggle("lg-alive-cell");
        for (const d of neighborhoods) {
            const nx = x+d.x;
            const ny = y+d.y;
            if (nx < 0 || this.mx <= nx) continue;
            if (ny < 0 || this.my <= ny) continue;
            const cellElement = this._cells[nx][ny];
            cellElement.dataset.around = Number(cellElement.dataset.around) + (isBorn ? 1 : -1);
        }
    }
}

const neighborhoods = Array.from(Array(3*3).keys())
    .filter(i => i!==4)
    .map(i => { return {"x": i%3-1, "y": Math.floor(i/3)-1}; });



