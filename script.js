const fileInput =
document.getElementById("fileInput");

const canvas =
document.getElementById("canvas");

const ctx =
canvas.getContext("2d");

const btnCortar =
document.getElementById("btnCortar");

const statusDiv =
document.getElementById("status");

let imagemOriginal = null;

let pontos = [];

let pontoSelecionado = -1;

// ======================
// AGUARDAR OPENCV
// ======================

function esperarOpenCV(){

    return new Promise(resolve=>{

        if(
            window.cv &&
            cv.Mat
        ){
            resolve();
            return;
        }

        cv["onRuntimeInitialized"] =
        ()=>{
            resolve();
        };

    });

}

// ======================
// CARREGAR IMAGEM
// ======================

fileInput.addEventListener(
    "change",
    carregarImagem
);

async function carregarImagem(e){

    const arquivo =
    e.target.files[0];

    if(!arquivo)
        return;

    const reader =
    new FileReader();

    reader.onload =
    function(ev){

        const img =
        new Image();

        img.onload =
        async function(){

            imagemOriginal =
            img;

            canvas.width =
            img.width;

            canvas.height =
            img.height;

            ctx.drawImage(
                img,
                0,
                0
            );
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

desenhar();

btnCortar.disabled = false;

statusDiv.innerText =
"Ajuste os pontos e toque em Cortar";

            statusDiv.innerText =
            "Detectando...";
        };

        img.src =
        ev.target.result;
    };

    reader.readAsDataURL(
        arquivo
    );
}

// ======================
// DETECTAR OBJETO
// ======================

function detectarObjeto(){

    let src =
    cv.imread(canvas);

    let gray =
    new cv.Mat();

    let blur =
    new cv.Mat();

    let edges =
    new cv.Mat();

    let contours =
    new cv.MatVector();

    let hierarchy =
    new cv.Mat();

    cv.cvtColor(
        src,
        gray,
        cv.COLOR_RGBA2GRAY
    );

    cv.GaussianBlur(
        gray,
        blur,
        new cv.Size(5,5),
        0
    );
    cv.threshold(
    gray,
    gray,
    180,
    255,
    cv.THRESH_BINARY
);
   cv.Canny(
    gray,
    edges,
    20,
    80
);

    cv.findContours(
        edges,
        contours,
        hierarchy,
        cv.RETR_LIST,
        cv.CHAIN_APPROX_SIMPLE
    );

    let maiorArea = 0;

    let melhor = null;

    for(
        let i=0;
        i<contours.size();
        i++
    ){

        let cnt =
        contours.get(i);

        let area =
        cv.contourArea(cnt);

        if(
            area > maiorArea
        ){

            let peri =
            cv.arcLength(
                cnt,
                true
            );

            let approx =
            new cv.Mat();

            cv.approxPolyDP(
                cnt,
                approx,
                0.03 * peri,
                true
            );

            if(
                approx.rows >= 4
            ){

                maiorArea =
                area;

                melhor = [];

                for(
                    let p=0;
                    p<approx.rows;
                    p++
                ){

                    melhor.push({

                        x:
                        approx.data32S[p*2],

                        y:
                        approx.data32S[p*2+1]

                    });

                }

            }

            approx.delete();
        }

    }

    if(melhor){

        pontos =
        obter4Extremos(
            melhor
        );

    }else{

       pontos = [
    {x:canvas.width*0.20,y:canvas.height*0.15},
    {x:canvas.width*0.80,y:canvas.height*0.15},
    {x:canvas.width*0.80,y:canvas.height*0.85},
    {x:canvas.width*0.20,y:canvas.height*0.85}
];

    }

    desenhar();

    btnCortar.disabled =
    false;

    statusDiv.innerText =
    "Ajuste os pontos";

    src.delete();
    gray.delete();
    blur.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
}

// ======================
// EXTREMOS
// ======================

function obter4Extremos(lista){

    let tl =
    lista.reduce(
        (a,b)=>
        a.x+a.y <
        b.x+b.y ? a:b
    );

    let br =
    lista.reduce(
        (a,b)=>
        a.x+a.y >
        b.x+b.y ? a:b
    );

    let tr =
    lista.reduce(
        (a,b)=>
        a.x-a.y >
        b.x-b.y ? a:b
    );

    let bl =
    lista.reduce(
        (a,b)=>
        a.y-a.x >
        b.y-b.x ? a:b
    );

    return [
        tl,
        tr,
        br,
        bl
    ];
}

// ======================
// DESENHAR
// ======================

function desenhar(){

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.drawImage(
        imagemOriginal,
        0,
        0
    );

    // área do corte
    ctx.beginPath();

    ctx.moveTo(
        pontos[0].x,
        pontos[0].y
    );

    for(let i=1;i<4;i++){

        ctx.lineTo(
            pontos[i].x,
            pontos[i].y
        );

    }

    ctx.closePath();

    ctx.fillStyle =
    "rgba(0,255,0,0.20)";

    ctx.fill();

    ctx.strokeStyle =
    "#00ff00";

    ctx.lineWidth = 5;

    ctx.stroke();

    // pontos
    pontos.forEach(p=>{

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            30,
            0,
            Math.PI*2
        );

        ctx.fillStyle =
        "#00ff00";

        ctx.fill();

        ctx.strokeStyle =
        "#ffffff";

        ctx.lineWidth = 4;

        ctx.stroke();

    });

}

// ======================
// TOUCH
// ======================

canvas.addEventListener(
    "touchstart",
    iniciarTouch,
    {passive:false}
);

canvas.addEventListener(
    "touchmove",
    moverTouch,
    {passive:false}
);

canvas.addEventListener(
    "touchend",
    ()=>{
        pontoSelecionado=-1;
    }
);

function iniciarTouch(e){

    e.preventDefault();

    const t =
    e.touches[0];

    for(
        let i=0;
        i<4;
        i++
    ){

        const dx =
        t.clientX -
        canvas.getBoundingClientRect().left -
        pontos[i].x;

        const dy =
        t.clientY -
        canvas.getBoundingClientRect().top -
        pontos[i].y;

       if(
    Math.sqrt(
        dx*dx+dy*dy
    ) < 80
){

            pontoSelecionado =
            i;

            break;
        }

    }

}

function moverTouch(e){

    if(
        pontoSelecionado === -1
    ) return;

    e.preventDefault();

    const rect =
    canvas.getBoundingClientRect();

    const t =
    e.touches[0];

    pontos[
        pontoSelecionado
    ] = {

        x:
        (t.clientX - rect.left)
        *
        (
            canvas.width /
            rect.width
        ),

        y:
        (t.clientY - rect.top)
        *
        (
            canvas.height /
            rect.height
        )

    };

    desenhar();
}

// ======================
// CORTAR
// ======================

btnCortar.addEventListener(
    "click",
    cortarDocumento
);

function cortarDocumento(){

    let src =
    cv.imread(canvas);

    const tl =
    pontos[0];

    const tr =
    pontos[1];

    const br =
    pontos[2];

    const bl =
    pontos[3];

    const largura =
    Math.max(
        Math.hypot(
            tr.x-tl.x,
            tr.y-tl.y
        ),
        Math.hypot(
            br.x-bl.x,
            br.y-bl.y
        )
    );

    const altura =
    Math.max(
        Math.hypot(
            bl.x-tl.x,
            bl.y-tl.y
        ),
        Math.hypot(
            br.x-tr.x,
            br.y-tr.y
        )
    );

    const srcTri =
    cv.matFromArray(
        4,
        1,
        cv.CV_32FC2,
        [
            tl.x,tl.y,
            tr.x,tr.y,
            br.x,br.y,
            bl.x,bl.y
        ]
    );

    const dstTri =
    cv.matFromArray(
        4,
        1,
        cv.CV_32FC2,
        [
            0,0,
            largura,0,
            largura,altura,
            0,altura
        ]
    );

    const matrix =
    cv.getPerspectiveTransform(
        srcTri,
        dstTri
    );

    const dst =
    new cv.Mat();

    cv.warpPerspective(
        src,
        dst,
        matrix,
        new cv.Size(
            largura,
            altura
        )
    );

    canvas.width =
    largura;

    canvas.height =
    altura;

    cv.imshow(
        canvas,
        dst
    );

    pontos = [];

    src.delete();
    dst.delete();
    matrix.delete();
    srcTri.delete();
    dstTri.delete();

    statusDiv.innerText =
    "Documento cortado";
}
