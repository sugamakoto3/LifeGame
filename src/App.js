export class App {
    constructor() {
        this.rootElement = document.querySelector(".life-game");    // TODO 引数から初期化する
        //
        const that = this;
        this._cells = new Array();
        /**
         * cellElementから呼ばれる。
         */
        this._getXY = function() {
            const index = that._cells.indexOf(this);
            const x = index % that.mx;
            const y = Math.floor(index / that.mx);
            return [x, y];
        };
    }

    mount() {
        this.boardElement = this.rootElement.querySelector(".lg-board");
        // Mount toolbar
        const playElement = this.rootElement.querySelector(".lg-play-button");
        const pauseElement = this.rootElement.querySelector(".lg-pause-button");
        let intervalID = null;
        playElement.addEventListener("click", () => {
            if(intervalID !== null) return;
            this.step();
            intervalID = setInterval(() => this.step(), 500);
            pauseElement.focus();
        });
        pauseElement.addEventListener("click", () => {
            clearInterval(intervalID);
            intervalID = null;
            playElement.focus();
        });
        playElement.focus();
        this.rootElement.querySelector(".lg-step-button").addEventListener("click", () => {
            this.step();
            clearInterval(intervalID);
            intervalID = null;
        });
        this.rootElement.querySelector(".lg-create-button").addEventListener("click", () => {
            clearInterval(intervalID);
            intervalID = null;
            //
            const mx = Number(this.rootElement.querySelector(".lg-mx-text").value);
            const my = Number(this.rootElement.querySelector(".lg-my-text").value);
            this.recreateBoardElement(mx, my);
            this.initBoard();
        });
        this.rootElement.querySelector(".lg-reset-button").addEventListener("click", () => {
            clearInterval(intervalID);
            intervalID = null;
            //
            this.recreateBoardElement(this.mx, this.my);
            this.initBoard();
        });
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
            const [x, y] = this._getXY.call(event.target);
            this.toggleCell(x, y);
        });
        this.boardElement.addEventListener("mouseenter", (event) => {
            if (event.buttons !== 1) return;
            if (event.target.classList.contains("lg-board")) return;
            const [x, y] = this._getXY.call(event.target);
            this.toggleCell(x, y);
        }, {capture: true});
        // init board
        this.initBoard();
    }

    /**
     * View（HTML）を見て、Model（に相当するプロパティ）を初期化する。
     */
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
                for (const [dx, dy] of _aroundVectors) {
                    const nx = i+dx;
                    const ny = j+dy;
                    if (nx < 0 || this.mx <= nx) continue;
                    if (ny < 0 || this.my <= ny) continue;
                    this._neighborMatrix[nx][ny]++;
                }
            }
        }
    }

    /**
     * HTMLだけしかみない。
     */
    recreateBoardElement(mx, my) {
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

    // createBoardElement(mx, my) {
    //     // init boardElement
    //     this.boardElement.style["grid-template-columns"] = `repeat(${mx}, min-content)`;
    //     this.boardElement.style["grid-template-rows"] = `repeat(${my}, min-content)`;
    //     // create
    //     const diff = (mx*my) - this.boardElement.children.length;
    //     if (diff < 0) {
    //         for (let i = 0; i < -diff; i++) {
    //             //TODO 行と列ごとに'あれ'する
    //             this.boardElement.removeChild(this.boardElement.lastChild);
    //         }
    //     } else {
    //         for (let i = 0; i < diff; i++) {
    //             const cellElement = document.createElement("div");
    //             this.boardElement.appendChild(cellElement);
    //         }
    //     }
    // }

    getCell(x, y) {
        return this._cells[y*this.mx + x];
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
        for (const [dx, dy] of _aroundVectors) {
            const nx = x+dx;
            const ny = y+dy;
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


const _aroundVectors = Array.from(new Array(9).keys())
    .filter(i => i!==4)
    .map(i => [(i%3), Math.floor(i/3)])
    .map(([dx, dy]) => [dx-1, dy-1])
    ;



