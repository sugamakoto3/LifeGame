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
            //
            let size = this.rootElement.querySelector(".lg-size-text").value;
            size = size.split("x").map(Number);
            this.createBoard(...size);
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
        this.rootElement.querySelector(".lg-encode-button").addEventListener("click", () => {
            const codeTextElement = this.rootElement.querySelector(".lg-code-text");
            codeTextElement.value = this.encoding();
            codeTextElement.focus();
            codeTextElement.setSelectionRange(0,-1);
        });
        // mouse Event
        this.boardElement.addEventListener("mousedown", (event) => {
            if (event.buttons !== 1) return;
            if (event.target.classList.contains("lg-board")) return;
            const [x, y] = this.getXYFromCell(event.target);
            this.toggleCell(x, y);
        });
        this.boardElement.addEventListener("mouseenter", (event) => {
            if (event.buttons !== 1) return;
            if (event.target.classList.contains("lg-board")) return;
            const [x, y] = this.getXYFromCell(event.target);
            this.toggleCell(x, y);
        }, {capture: true});
        // init board
        this.initBoard();
    }

    initBoard() {
        this.mx = Number(this.boardElement.style["grid-template-columns"].match(/\d+/)[0]);
        this.my = Number(this.boardElement.style["grid-template-rows"].match(/\d+/)[0]);
        //TODO check number
        // init _cells
        this._cells = new Array(this.mx * this.my).fill();
        let i = 0;
        for (const cellElement of this.boardElement.children) {
            this._cells[i++] = cellElement;
        }
        // init _neighborNumMatrix
        this._neighborMatrix = new Array(this.mx).fill().map(() => new Array(this.my).fill(0));
        for (let i = 0; i < this.mx; i++) {
            for (let j = 0; j < this.my; j++) {
                if (! this.getCell(i, j).classList.contains("lg-alive-cell")) continue;
                for (const d of neighborhoodDVs) {
                    const nx = i+d.x;
                    const ny = j+d.y;
                    if (nx < 0 || this.mx <= nx) continue;
                    if (ny < 0 || this.my <= ny) continue;
                    this._neighborMatrix[nx][ny]++;
                }
            }
        }
    }

    createBoard(mx, my) {
        // init boardElement
        this.boardElement.style["grid-template-columns"] = `repeat(${mx}, min-content)`;
        this.boardElement.style["grid-template-rows"] = `repeat(${my}, min-content)`;
        // clear and create
        this.boardElement.innerHTML = "";
        for (let i = 0; i < mx*my; i++) {
            const cellElement = document.createElement("div");
            this.boardElement.appendChild(cellElement);
        }
    }

    getCell(x, y) {
        return this._cells[y*this.mx + x];
    }

    getXYFromCell(cellElement) {
        const index = this._cells.indexOf(cellElement);
        const x = index % this.mx;
        const y = Math.floor(index / this.mx);
        return [x, y];
    }

    step() {
        const bornRule = Array.from("B3").map(Number);     // TODO
        const surviveRule = Array.from("S23").map(Number);
        // _neighborMatrix を覚えておく
        const oldMatrix = new Array(this.mx).fill()
            .map((_, i) => this._neighborMatrix[i].slice());
        //
        for (let i = 0; i < this.mx; i++) {
            for (let j = 0; j < this.my; j++) {
                const neighbor = oldMatrix[i][j];
                if (bornRule.includes(neighbor)) {
                    this.changeCell(i, j, true);
                } else if (surviveRule.includes(neighbor)) {
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
        // neibor
        for (const d of neighborhoodDVs) {
            const nx = x+d.x;
            const ny = y+d.y;
            if (nx < 0 || this.mx <= nx) continue;
            if (ny < 0 || this.my <= ny) continue;
            this._neighborMatrix[nx][ny] = this._neighborMatrix[nx][ny] + (isBorn ? 1 : -1);
        }
    }

    encoding() {
        let res = this._cells;
        res = res.map(c => c.classList.contains("lg-alive-cell"));
        res = res.map(b => b ? 1n : 0n);
        res = res.reduce((pre, cur) => (pre << 1n) + cur, 1n);
        return this.mx + "x" + this.my + "x" + res.toString(16);
    }

    static initBoardHTML() {
        const searchParams = new URLSearchParams(location.search);
        if (! searchParams.has("code")) return;
        App.decoding(searchParams.get("code"));
    }

    static decoding(code) {
        const rootElement = document.querySelector(".life-game");
        const boardElement = rootElement.querySelector(".lg-board");
        //
        let [mx, my, cells] = code.split("x");
        cells = BigInt("0x" + cells);
        cells = cells.toString(2);
        cells = Array.prototype.map.call(cells, s => Boolean(Number(s)));
        cells.shift();
        // init boardElement
        boardElement.style["grid-template-columns"] = `repeat(${mx}, min-content)`;
        boardElement.style["grid-template-rows"] = `repeat(${my}, min-content)`;
        // clear and create
        boardElement.innerHTML = "";
        for (const isBorn of cells) {
            const cellElement = document.createElement("div");
            if (isBorn) cellElement.classList.add("lg-alive-cell");
            boardElement.appendChild(cellElement);
        }
    }
}

const neighborhoodDVs = Array.from(Array(3*3).keys())
    .filter(i => i!==4)
    .map(i => { return {"x": i%3-1, "y": Math.floor(i/3)-1}; });



