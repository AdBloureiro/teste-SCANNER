const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");

let imagem = null;
let pontos = [];
let pontoSelecionado = -1;

// ======================
// CARREGAR IMAGEM
// ======================

document
.getElementById("fileInput")
.addEventListener("change", carregarImagem);

function carregarImagem(e){

    const arquivo = e.target.files[0];

    if(!arquivo) return;

    const reader = new FileReader();

    reader.onload = function(event){

        imagem = new Image();

        imagem.onload = function(){

            // evita canvas gigante no celular
            const MAX = 1200;

            let largura = imagem.width;
            let altura = imagem.height;

            if(largura > MAX){

                const escala = MAX / largura;

                largura = largura * escala;
                altura = altura * escala;
            }

            canvas.width = largura;
            canvas.height = altura;

            criarPoligonoInicial();

            desenhar();

            console.log(
                "Imagem carregada:",
                largura,
                altura
            );
        };

        imagem.src = event.target.result;
    };

    reader.readAsDataURL(arquivo);
}

// ======================
// POLÍGONO INICIAL
// ======================

function criarPoligonoInicial(){

    pontos = [

        {
            x: canvas.width * 0.15,
            y: canvas.height * 0.15
        },

        {
            x: canvas.width * 0.85,
            y: canvas.height * 0.15
        },

        {
            x: canvas.width * 0.85,
            y: canvas.height * 0.85
        },

        {
            x: canvas.width * 0.15,
            y: canvas.height * 0.85
        }

    ];
}

// ======================
// DESENHAR
// ======================

function desenhar(){

    if(!imagem) return;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.drawImage(
        imagem,
        0,
        0,
        canvas.width,
        canvas.height
    );

    // polígono

    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.moveTo(
        pontos[0].x,
        pontos[0].y
    );

    for(let i=1;i<pontos.length;i++){

        ctx.lineTo(
            pontos[i].x,
            pontos[i].y
        );
    }

    ctx.closePath();
    ctx.stroke();

    // pontos

    for(let i=0;i<pontos.length;i++){

        ctx.fillStyle = "#00ff00";

        ctx.beginPath();

        ctx.arc(
            pontos[i].x,
            pontos[i].y,
            12,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

// ======================
// CONVERSÃO DE ESCALA
// ======================

function obterPosicao(clientX, clientY){

    const rect =
    canvas.getBoundingClientRect();

    const escalaX =
    canvas.width / rect.width;

    const escalaY =
    canvas.height / rect.height;

    return {

        x:
        (clientX - rect.left)
        * escalaX,

        y:
        (clientY - rect.top)
        * escalaY
    };
}

// ======================
// SELECIONAR PONTO
// ======================

function selecionarPonto(x,y){

    for(let i=0;i<pontos.length;i++){

        const dx =
        x - pontos[i].x;

        const dy =
        y - pontos[i].y;

        const distancia =
        Math.sqrt(
            dx*dx +
            dy*dy
        );

        if(distancia < 40){

            pontoSelecionado = i;
            return;
        }
    }
}

// ======================
// MOUSE
// ======================

canvas.addEventListener(
    "mousedown",
    (e)=>{

        const pos =
        obterPosicao(
            e.clientX,
            e.clientY
        );

        selecionarPonto(
            pos.x,
            pos.y
        );
    }
);

canvas.addEventListener(
    "mousemove",
    (e)=>{

        if(pontoSelecionado === -1)
            return;

        const pos =
        obterPosicao(
            e.clientX,
            e.clientY
        );

        pontos[pontoSelecionado] = {

            x: pos.x,
            y: pos.y
        };

        desenhar();
    }
);

canvas.addEventListener(
    "mouseup",
    ()=>{

        pontoSelecionado = -1;
    }
);

canvas.addEventListener(
    "mouseleave",
    ()=>{

        pontoSelecionado = -1;
    }
);

// ======================
// TOUCH (ANDROID/IPHONE)
// ======================

canvas.addEventListener(
    "touchstart",
    (e)=>{

        e.preventDefault();

        const touch =
        e.touches[0];

        const pos =
        obterPosicao(
            touch.clientX,
            touch.clientY
        );

        selecionarPonto(
            pos.x,
            pos.y
        );

    },
    { passive:false }
);

canvas.addEventListener(
    "touchmove",
    (e)=>{

        if(pontoSelecionado === -1)
            return;

        e.preventDefault();

        const touch =
        e.touches[0];

        const pos =
        obterPosicao(
            touch.clientX,
            touch.clientY
        );

        pontos[pontoSelecionado] = {

            x: pos.x,
            y: pos.y
        };

        desenhar();

    },
    { passive:false }
);

canvas.addEventListener(
    "touchend",
    ()=>{

        pontoSelecionado = -1;
    }
);

// ======================
// BOTÕES
// ======================

document
.getElementById("btnAuto")
.addEventListener(
    "click",
    ()=>{

        console.log(
            "Pontos confirmados:"
        );

        console.table(
            pontos
        );

        alert(
            "Corte confirmado!"
        );
    }
);

document
.getElementById("btnManual")
.addEventListener(
    "click",
    ()=>{

        alert(
            "Modo manual selecionado!"
        );
    }
);
