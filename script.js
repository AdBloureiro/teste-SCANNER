const canvas =
document.getElementById("previewCanvas");

const ctx =
canvas.getContext("2d");

let imagem = null;

let pontos = [];

let pontoSelecionado = -1;

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

function desenhar(){

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

    ctx.lineWidth = 4;

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
            10,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

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

    const rect =
    canvas.getBoundingClientRect();

    const x =
    e.clientX - rect.left;

    const y =
    e.clientY - rect.top;

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

        if(distancia < 20){

            pontoSelecionado =
            i;

            break;
        }
    }
}

function moverPonto(e){

    if(
        pontoSelecionado === -1
    ) return;

    const rect =
    canvas.getBoundingClientRect();

    pontos[
        pontoSelecionado
    ] = {

        x:
        e.clientX -
        rect.left,

        y:
        e.clientY -
        rect.top
    };

    desenhar();
}

function finalizarArraste(){

    pontoSelecionado =
    -1;
}

document
.getElementById("btnAuto")
.onclick =
function(){

    console.log(
        "Pontos confirmados:"
    );

    console.log(
        pontos
    );

    alert(
        "Corte automático confirmado!"
    );
};

document
.getElementById("btnManual")
.onclick =
function(){

    alert(
        "Modo manual selecionado!"
    );
};
