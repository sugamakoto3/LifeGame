export class App {
    constructor() {
        this.rootElement = document.querySelector(".life-game");    // TODO 引数から初期化する
        //
        const that = this;
        this._cells = new Array();
        this.history = [];
        this._getXY = function() {
            const cellElement = this;   // cellElementから呼ばれる。
            const index = that._cells.indexOf(cellElement);
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
        playElement.focus();
        let intervalID = null;
        const playStatusElement = this.rootElement.querySelector(".lg-play-status");
        const playInterval = () => {
            if(intervalID !== null) return;
            this.step();
            intervalID = setInterval(() => this.step(), 500);
            playStatusElement.innerHTML = "...Playing";
        };
        const pauseInterval = () => {
            clearInterval(intervalID);
            intervalID = null;
            playStatusElement.innerHTML = "Pause";
        };

        playElement.addEventListener("click", () => {
            playInterval();
            pauseElement.focus();
        });
        pauseElement.addEventListener("click", () => {
            pauseInterval();
            playElement.focus();
        });
        this.rootElement.querySelector(".lg-step-button").addHoldLister(() => {
            pauseInterval();
            this.step();
        });
        this.rootElement.querySelector(".lg-back-button").addHoldLister(() => {
            pauseInterval();
            this.popHistory();
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
        this.rootElement.querySelector(".lg-sharelink-button").addEventListener("click", () => {
            pauseInterval();
            const codeTextElement = this.rootElement.querySelector(".lg-code-text");
            codeTextElement.value = this.getShareLink();
            codeTextElement.focus();
            codeTextElement.setSelectionRange(0,-1);
        });
        // statusbar
        this.rootElement.querySelector(".lg-board-status").addEventListener("click", () => {
            this.setStatusBar("-x-", "animate__bounce");
        });
        // mouse Event
        this.boardElement.addEventListener("contextmenu", (e) => e.preventDefault());
        const mouseEventHandler = (event) => {
            if (! event.buttons & 0b111) return;
            if (event.target.classList.contains("lg-board")) return;
            if (event.buttons & 0b001) {
                const [x, y] = this._getXY.call(event.target);
                this.changeCell(x, y, true);
            } else if (event.buttons & 0b010) {
                const [x, y] = this._getXY.call(event.target);
                this.changeCell(x, y, false);
            } else if (event.buttons & 0b100) {
                const [x, y] = this._getXY.call(event.target);
                this.toggleCell(x, y);
            }
        };
        this.boardElement.addEventListener("mousedown", mouseEventHandler);
        this.boardElement.addEventListener("mouseenter", mouseEventHandler, {capture: true});
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
        const boardStatusElement = this.rootElement.querySelector(".lg-board-status");
        boardStatusElement.innerHTML = text;
        if (!animationName) return;
        // animation
        boardStatusElement.classList.add("animate__animated", animationName);
        const removeClass = (event) => {
            event.stopPropagation();
            boardStatusElement.classList.remove("animate__animated", animationName);
        }
        boardStatusElement.addEventListener("animationend", removeClass, {once: true});
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
        console.info(code);
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
        const _boardElement = document.querySelector(".life-game .lg-board");
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
        // init toolbar
        const _mxTextElement = document.querySelector(".life-game .lg-mx-text");
        const _myTextElement = document.querySelector(".life-game .lg-my-text");
        _mxTextElement.value = mx;
        _myTextElement.value = my;
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
        const code = this.encoding();
        const index = this.history.lastIndexOf(code);
        if (index === -1) {
            // 新しい状態
        } else if (index === this.history.length-1) {
            // 状態変わらず
            this.setStatusBar("Stuck", "animate__flash");
            return;
        } else {
            // ループしている
            const loopLength = this.history.length - index;
            this.setStatusBar(`Loop is detected; len${loopLength}`);
        }
        this.history.push(code);
        if (this.history.length > 100) this.history.shift();
    }

    popHistory() {
        const code = this.history.pop();
        if (code === undefined) {
            this.setStatusBar("No history", "animate__headShake");
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

HTMLElement.prototype.addHoldLister = function(callback, holdtime=500, tick=125) {
    let intervalID = null;
    this.addEventListener("mousedown", () => {
        if (intervalID !== null) return;
        callback();
        let time = 0;
        time += tick;
        intervalID = setInterval(() => {
            if (time >= holdtime) {
                callback();
            } else {
                time += tick;
            }
        }, tick);
    });
    document.addEventListener("mouseup", () => {
        clearInterval(intervalID);
        intervalID = null;
    });
};



//TODO "boardElement > div" の規定のドラッグ処理が邪魔。
//TODO 鏡モード

