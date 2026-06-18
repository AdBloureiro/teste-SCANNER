const canvas =
document.getElementById("previewCanvas");

const ctx =
canvas.getContext("2d");

let imagem = null;

let pontos = [];

let pontoSelecionado = -1;

// ======================
// CARREGAR IMAGEM
// ======================

document
.getElementById("fileInput")
.addEventListener(
    "change",
    carregarImagem
);

function carregarImagem(e){

    const arquivo =
    e.target.files[0];

    if(!arquivo) return;

    const reader =
    new FileReader();

    reader.onload =
    function(event){

        imagem =
        new Image();

        imagem.onload =
        function(){

            canvas.width =
            imagem.width;

            canvas.height =
            imagem.height;

            criarPoligonoFake();

            desenhar();
        };

        imagem.src =
        event.target.result;
    };

    reader.readAsDataURL(
        arquivo
    );
}

// ======================
// POLÍGONO INICIAL
// ======================

function criarPoligonoFake(){

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
        0
    );

    ctx.strokeStyle =
    "#00ff00";

    ctx.lineWidth = 6;

    ctx.beginPath();

    ctx.moveTo(
        pontos[0].x,
        pontos[0].y
    );

    for(
        let i=1;
        i<pontos.length;
        i++
    ){

        ctx.lineTo(
            pontos[i].x,
            pontos[i].y
        );
    }

    ctx.closePath();

    ctx.stroke();

    for(
        let i=0;
        i<pontos.length;
        i++
    ){

        ctx.fillStyle =
        "#00ff00";

        ctx.beginPath();

        ctx.arc(
            pontos[i].x,
            pontos[i].y,
            14,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

// ======================
// FUNÇÃO DE ESCALA
// ======================

function obterPosicao(eventX,eventY){

    const rect =
    canvas.getBoundingClientRect();

    const escalaX =
    canvas.width / rect.width;

    const escalaY =
    canvas.height / rect.height;

    return {

        x:
        (eventX - rect.left)
        * escalaX,

        y:
        (eventY - rect.top)
        * escalaY
    };
}

// ======================
// MOUSE
// ======================

canvas.addEventListener(
    "mousedown",
    iniciarArraste
);

canvas.addEventListener(
    "mousemove",
    moverPonto
);

canvas.addEventListener(
    "mouseup",
    finalizarArraste
);

canvas.addEventListener(
    "mouseleave",
    finalizarArraste
);

function iniciarArraste(e){

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

function moverPonto(e){

    if(
        pontoSelecionado === -1
    ) return;

    const pos =
    obterPosicao(
        e.clientX,
        e.clientY
    );

    pontos[
        pontoSelecionado
    ] = {

        x: pos.x,
        y: pos.y
    };

    desenhar();
}

// ======================
// TOUCH
// ======================

canvas.addEventListener(
    "touchstart",
    iniciarTouch,
    { passive:false }
);

canvas.addEventListener(
    "touchmove",
    moverTouch,
    { passive:false }
);

canvas.addEventListener(
    "touchend",
    finalizarArraste
);

function iniciarTouch(e){

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
}

function moverTouch(e){

    if(
        pontoSelecionado === -1
    ) return;

    e.preventDefault();

    const touch =
    e.touches[0];

    const pos =
    obterPosicao(
        touch.clientX,
        touch.clientY
    );

    pontos[
        pontoSelecionado
    ] = {

        x: pos.x,
        y: pos.y
    };

    desenhar();
}

// ======================
// SELEÇÃO
// ======================

function selecionarPonto(x,y){

    for(
        let i=0;
        i<pontos.length;
        i++
    ){

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

            pontoSelecionado =
            i;

            return;
        }
    }
}

// ======================
// FINALIZAR
// ======================

function finalizarArraste(){

    pontoSelecionado =
    -1;
}

// ======================
// BOTÕES
// ======================

document
.getElementById("btnAuto")
.onclick =
function(){

    console.log(
        "Pontos confirmados:"
    );

    console.table(
        pontos
    );

    alert(
        "Corte confirmado!"
    );
};

document
.getElementById("btnManual")
.onclick =
function(){

    alert(
        "Modo manual!"
    );
};
