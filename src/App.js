export class App {
    constructor() {
        this.rootElement = document.querySelector(".life-game");    // TODO 引数から初期化する
        //
        const that = this;
        this._cells = new Array();
        this.history = [];
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
        this.statusElement = this.rootElement.querySelector(".lg-status-bar");
        // Mount toolbar
        const playElement = this.rootElement.querySelector(".lg-play-button");
        const pauseElement = this.rootElement.querySelector(".lg-pause-button");
        playElement.focus();
        let intervalID = null;
        const playInterval = () => {
            if(intervalID !== null) return;
            this.step();
            intervalID = setInterval(() => this.step(), 500);
        };
        const pauseInterval = () => {
            clearInterval(intervalID);
            intervalID = null;
        };

        playElement.addEventListener("click", () => {
            playInterval();
            pauseElement.focus();
        });
        pauseElement.addEventListener("click", () => {
            pauseInterval();
            playElement.focus();
        });
        this.rootElement.querySelector(".lg-step-button").addEventListener("click", () => {
            pauseInterval();
            this.step();
        });
        this.rootElement.querySelector(".lg-create-button").addEventListener("click", () => {
            pauseInterval();
            //
            const mx = Number(this.rootElement.querySelector(".lg-mx-text").value);
            const my = Number(this.rootElement.querySelector(".lg-my-text").value);
            this.recreateBoardElement(mx, my);
            this.initBoard();
            this.history = [];
        });
        this.rootElement.querySelectorAll(".lg-reset-button").forEach(e => e.addEventListener("click", () => {
            pauseInterval();
            //
            this.pushHistory();
            this.recreateBoardElement(this.mx, this.my);
            this.initBoard();
        }));
        this.rootElement.querySelectorAll(".lg-back-button").forEach(e => e.addEventListener("click", () => {
            pauseInterval();
            this.popHistory();
        }));
        this.rootElement.querySelector(".lg-sharelink-button").addEventListener("click", () => {
            pauseInterval();
            const codeTextElement = this.rootElement.querySelector(".lg-code-text");
            codeTextElement.value = this.getShareLink();
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
        // init _populationMat
        this._populationMat = new Array(this.mx).fill().map(() => new Array(this.my).fill(0));
        for (let i = 0; i < this.mx; i++) {
            for (let j = 0; j < this.my; j++) {
                if (! this.getCell(i, j).classList.contains("lg-alive-cell")) continue;
                for (const [nx, ny] of this.generateNeighborsAt(i, j)) {
                    this._populationMat[nx][ny]++;
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
        this.pushHistory();
        // Rule
        const bornRule = Array.from("B3").map(Number);     // TODO
        const surviveRule = Array.from("S23").map(Number);
        // _populationMat を覚えておく
        const oldMat = new Array(this.mx).fill()
            .map((_, i) => this._populationMat[i].slice());
        //
        for (let i = 0; i < this.mx; i++) {
            for (let j = 0; j < this.my; j++) {
                const population = oldMat[i][j];
                if (bornRule.includes(population)) {
                    this.changeCell(i, j, true);
                } else if (surviveRule.includes(population)) {
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
        // neighbors
        for (const [nx, ny] of this.generateNeighborsAt(x, y)) {
            this._populationMat[nx][ny] += (isBorn ? 1 : -1);
        }
    }

    setStatusBar(text, animationName="") {
        this.statusElement.innerHTML = text;
        if (!animationName) return;
        // animation
        this.statusElement.classList.add("animate__animated", animationName);
        const removeClass = (event) => {
            event.stopPropagation();
            this.statusElement.classList.remove("animate__animated", animationName);
        }
        this.statusElement.addEventListener("animationend", removeClass, {once: true});
    }

    *generateNeighborsAt(x, y) {
        for (const [dx, dy] of _aroundVectors) {
            const nx = x+dx;
            const ny = y+dy;
            if (nx < 0 || this.mx <= nx) continue;
            if (ny < 0 || this.my <= ny) continue;
            yield [nx, ny];
        }
    }

    // ---- Encoding ----

    getShareLink() {
        const code = this.encoding();
        const searchParams = new URLSearchParams(location.search);
        searchParams.set("code", this.mx + "x" + this.my + "x" + code.toString(16));
        return location.protocol + "//" + location.host + location.pathname + "?" + searchParams;
    }

    encoding() {
        return this._cells
            .map(cell => cell.classList.contains("lg-alive-cell"))
            .map(bool => bool ? 1n : 0n)
            .reduce((pre, cur) => (pre << 1n) + cur, 1n)
    }

    static loadBoardHTML() {
        const searchParams = new URLSearchParams(location.search);
        if (! searchParams.has("code")) return;
        const _boardElement = document.querySelector(".life-game > .lg-board");
        const code = searchParams.get("code");
        let [mx, my, cells] = code.split("x");
        cells = BigInt("0x" + cells);
        cells = App.decoding(cells);
        // init boardElement
        _boardElement.style["grid-template-columns"] = `repeat(${mx}, min-content)`;
        _boardElement.style["grid-template-rows"] = `repeat(${my}, min-content)`;
        // clear and create
        _boardElement.innerHTML = "";
        _boardElement.appendChild(cells);
    }

    static decoding(code) {
        return Array.from(code.toString(2))
            .slice(1)
            .map(str => Boolean(Number(str)))
            .map(bool => {
                const cell = document.createElement("div");
                if (bool) cell.classList.add("lg-alive-cell");
                return cell;
            })
            .reduce((pre, cur) => {
                pre.appendChild(cur);
                return pre;
            }, document.createDocumentFragment())
    }

    // ---- History ----

    pushHistory() {
        this.history.push(this.encoding());
        if (this.history.length > 50) this.history.shift();
    }

    popHistory() {
        const code = this.history.pop();
        if (code === undefined) {
            this.setStatusBar("No history", "animate__shakeX");
            return;
        }
        const cells = App.decoding(code);
        this.boardElement.innerHTML = "";
        this.boardElement.appendChild(cells);
        this.initBoard();
    }
}


const _aroundVectors = Array.from(new Array(9).keys())
    .filter(i => i!==4)
    .map(i => [(i%3), Math.floor(i/3)])
    .map(([dx, dy]) => [dx-1, dy-1])
    ;



