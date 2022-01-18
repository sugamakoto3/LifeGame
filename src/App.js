export class App {
    constructor() {
        this.rootElement = document.querySelector(".life-game");    // TODO 引数から初期化する
    }

    mount() {
        this.boardElement = this.rootElement.querySelector(".lg-board");
        // mount toolbar
        let intervalID = null;
        const createElement = this.rootElement.querySelector(".lg-create-button");
        createElement.addEventListener("click", () => {
            clearInterval(intervalID);
            intervalID = null;
            this.initBoard();
        });
        const playElement = this.rootElement.querySelector(".lg-play-button");
        playElement.addEventListener("click", () => {
            if(intervalID !== null) return;
            this.step();
            intervalID = setInterval(() => this.step(), 500);
        });
        const pauseElement = this.rootElement.querySelector(".lg-pause-button");
        pauseElement.addEventListener("click", () => {
            clearInterval(intervalID);
            intervalID = null;
        });
        const stepElement = this.rootElement.querySelector(".lg-step-button");
        stepElement.addEventListener("click", () => this.step());
        //
        this.boardElement.addEventListener("mousedown", (event) => {
            if (event.buttons !== 1) return;
            if (event.target.classList.contains("lg-board")) return;
            const x = Number(event.target.dataset.x);
            const y = Number(event.target.dataset.y);
            this.toggleCell(x, y);
        });
        this.boardElement.addEventListener("mouseenter", (event) => {
            if (event.buttons !== 1) return;
            if (event.target.classList.contains("lg-board")) return;
            const x = Number(event.target.dataset.x);
            const y = Number(event.target.dataset.y);
            this.toggleCell(x, y);
        }, {capture: true});
        // init board
        this.createBoard(25, 25);
    }

    initBoard() {
        this._cells = new Array(this.mx * this.my).fill();
        // 
        this.mx = this.boardElement.style["grid-template-columns"];
        // FIXME
        //
        this.boardElement.innerHTML = "";
        for (let j = 0; j < this.my; j++) {
            for (let i = 0; i < this.mx; i++) {
                const cellElement = document.createElement("div");
                cellElement.dataset.x = i;
                cellElement.dataset.y = j;
                cellElement.dataset.around = "0";
                // append
                this.boardElement.appendChild(cellElement);
                this._cells[j*this.mx + i] = cellElement;
            }
        }
    }

    createBoard(mx, my) {
        this.mx = mx;
        this.my = my;
        this._cells = new Array(this.mx * this.my).fill();
        // init boardElement
        this.boardElement.style["grid-template-columns"] = `repeat(${this.mx}, min-content)`;
        this.boardElement.style["grid-template-rows"] = `repeat(${this.my}, min-content)`;
        //
        this.boardElement.innerHTML = "";
        for (let j = 0; j < this.my; j++) {
            for (let i = 0; i < this.mx; i++) {
                const cellElement = document.createElement("div");
                cellElement.dataset.x = i;
                cellElement.dataset.y = j;
                cellElement.dataset.around = "0";
                // append
                this.boardElement.appendChild(cellElement);
                this._cells[j*this.mx + i] = cellElement;
            }
        }
    }

    getCell(x, y) {
        return this._cells[y*this.mx + x];
    }

    step() {
        const bornRule = Array.from("B3");     // TODO
        const surviveRule = Array.from("S23");
        // aroundMatrix を覚えておく
        const aroundMatrix = new Array(this.mx).fill().map(() => new Array(this.my));
        for (let i = 0; i < this.mx; i++) {
            for (let j = 0; j < this.my; j++) {
                aroundMatrix[i][j] = this.getCell(i, j).dataset.around;
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
        const isBorn = !this.getCell(x, y).classList.contains("lg-alive-cell");
        this.changeCell(x, y, isBorn);
    }

    changeCell(x, y, isBorn) {
        const cellElement = this.getCell(x, y);
        if (isBorn === cellElement.classList.contains("lg-alive-cell")) return;
        cellElement.classList.toggle("lg-alive-cell");
        for (const d of neighborhoods) {
            const nx = x+d.x;
            const ny = y+d.y;
            if (nx < 0 || this.mx <= nx) continue;
            if (ny < 0 || this.my <= ny) continue;
            const cellElement = this.getCell(nx, ny);
            cellElement.dataset.around = Number(cellElement.dataset.around) + (isBorn ? 1 : -1);
        }
    }
}

const neighborhoods = Array.from(Array(3*3).keys())
    .filter(i => i!==4)
    .map(i => { return {"x": i%3-1, "y": Math.floor(i/3)-1}; });



