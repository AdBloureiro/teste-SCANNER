// =====================================
// ELEMENTOS
// =====================================

const fileInput =
document.getElementById(
    "fileInput"
);

const canvas =
document.getElementById(
    "previewCanvas"
);

const ctx =
canvas.getContext("2d");

const statusDiv =
document.getElementById(
    "status"
);

const btnAuto =
document.getElementById(
    "btnAuto"
);

const btnManual =
document.getElementById(
    "btnManual"
);

// =====================================
// VARIÁVEIS GLOBAIS
// =====================================

let cvPronto = false;

let imagemOriginal = null;

let candidatos = [];

let candidatoSelecionado = null;

let pontos = [];

let pontoSelecionado = -1;

// =====================================
// AGUARDAR OPENCV
// =====================================

function aguardarOpenCV(){

    return new Promise(
        (resolve)=>{

            if(
                window.cv &&
                cv.Mat
            ){

                cvPronto = true;

                resolve();

                return;
            }

            cv["onRuntimeInitialized"] =
            ()=>{

                cvPronto = true;

                console.log(
                    "OpenCV carregado"
                );

                statusDiv.innerText =
                "OpenCV carregado";

                resolve();
            };
        }
    );
}

// =====================================
// CARREGAR IMAGEM
// =====================================

fileInput.addEventListener(
    "change",
    carregarImagem
);

async function carregarImagem(event){

    const arquivo =
    event.target.files[0];

    if(!arquivo)
        return;

    statusDiv.innerText =
    "Carregando imagem...";

    const reader =
    new FileReader();

    reader.onload =
    function(e){

        const img =
        new Image();

        img.onload =
        async function(){

            imagemOriginal =
            img;

            prepararCanvas(
                img
            );

            desenharImagem();

            statusDiv.innerText =
            "Imagem carregada";
            btnAuto.disabled = false;
btnManual.disabled = false;

            await aguardarOpenCV();

            statusDiv.innerText =
            "Detectando objetos...";

            detectarQuadrilateros();
        };

        img.src =
        e.target.result;
    };

    reader.readAsDataURL(
        arquivo
    );
}

// =====================================
// PREPARAR CANVAS
// =====================================

function prepararCanvas(img){

    const MAX =
    1200;

    let largura =
    img.width;

    let altura =
    img.height;

    if(
        largura > MAX
    ){

        const escala =
        MAX / largura;

        largura =
        largura *
        escala;

        altura =
        altura *
        escala;
    }

    canvas.width =
    largura;

    canvas.height =
    altura;
}

// =====================================
// DESENHAR IMAGEM
// =====================================

function desenharImagem(){

    if(
        !imagemOriginal
    ) return;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.drawImage(
        imagemOriginal,
        0,
        0,
        canvas.width,
        canvas.height
    );
}

// =====================================
// REDESENHAR TUDO
// =====================================

function redesenhar(){

    desenharImagem();

    desenharCandidatos();

    desenharPontos();
}

// =====================================
// DESENHAR CANDIDATOS
// =====================================

function desenharCandidatos(){

    candidatos.forEach(
        (quad)=>{

            ctx.beginPath();

            ctx.moveTo(
                quad[0].x,
                quad[0].y
            );

            for(
                let i=1;
                i<quad.length;
                i++
            ){

                ctx.lineTo(
                    quad[i].x,
                    quad[i].y
                );
            }

            ctx.closePath();

            ctx.strokeStyle =
            "#2196F3";

            ctx.lineWidth = 2;

            ctx.stroke();
        }
    );

    if(
        candidatoSelecionado
    ){

        ctx.beginPath();

        ctx.moveTo(
            candidatoSelecionado[0].x,
            candidatoSelecionado[0].y
        );

        for(
            let i=1;
            i<
            candidatoSelecionado.length;
            i++
        ){

            ctx.lineTo(
                candidatoSelecionado[i].x,
                candidatoSelecionado[i].y
            );
        }

        ctx.closePath();

        ctx.strokeStyle =
        "#00ff00";

        ctx.lineWidth = 4;

        ctx.stroke();
    }
}


// =====================================
// DETECÇÃO DE QUADRILÁTEROS
// =====================================

function detectarQuadrilateros(){

    console.log("Iniciando detecção...");

    candidatos = [];
    candidatoSelecionado = null;
    pontos = [];

    const tempCanvas =
    document.createElement("canvas");

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    const tempCtx =
    tempCanvas.getContext("2d");

    tempCtx.drawImage(
        imagemOriginal,
        0,
        0,
        canvas.width,
        canvas.height
    );

    let src = cv.imread(tempCanvas);

    let gray = new cv.Mat();
    let blur = new cv.Mat();
    let edges = new cv.Mat();

    let contours =
    new cv.MatVector();

    let hierarchy =
    new cv.Mat();

    try{

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

        // MAIS SENSÍVEL
        cv.Canny(
            blur,
            edges,
            30,
            120
        );

        // UNE BORDAS QUEBRADAS
        let kernel =
        cv.Mat.ones(
            3,
            3,
            cv.CV_8U
        );

        cv.dilate(
            edges,
            edges,
            kernel
        );

        kernel.delete();

        cv.findContours(
            edges,
            contours,
            hierarchy,
            cv.RETR_LIST,
            cv.CHAIN_APPROX_SIMPLE
        );

        console.log(
            "Contornos:",
            contours.size()
        );

        let maiorArea = 0;
        let melhorQuad = null;

        for(
            let i=0;
            i<contours.size();
            i++
        ){

            const cnt =
            contours.get(i);

            const area =
            cv.contourArea(cnt);

            if(
                area <
                (
                    canvas.width *
                    canvas.height *
                    0.01
                )
            ){
                continue;
            }

            const peri =
            cv.arcLength(
                cnt,
                true
            );

            const approx =
            new cv.Mat();

            cv.approxPolyDP(
                cnt,
                approx,
                0.03 * peri,
                true
            );

            // MAIS FLEXÍVEL
            if(
                approx.rows >= 4 &&
                approx.rows <= 8
            ){

                let quad = [];

                for(
                    let p=0;
                    p<approx.rows;
                    p++
                ){

                    quad.push({

                        x:
                        approx.data32S[
                            p*2
                        ],

                        y:
                        approx.data32S[
                            p*2+1
                        ]
                    });
                }

                candidatos.push(
                    quad
                );

                console.log(
                    "Candidato:",
                    area,
                    quad.length,
                    "pontos"
                );

                if(
                    area >
                    maiorArea
                ){

                    maiorArea =
                    area;

                    melhorQuad =
                    quad;
                }
            }

            approx.delete();
        }
//ordenar 4 pontos
  if(melhorQuad && melhorQuad.length >= 4){

    melhorQuad =
    obter4Extremos(
        melhorQuad
    );

    candidatoSelecionado =
    melhorQuad;

    pontos =
    JSON.parse(
        JSON.stringify(
            melhorQuad
        )
    );

    btnAuto.disabled = false;
    btnManual.disabled = false;

    statusDiv.innerText =
    "Objeto detectado";

}else{

    statusDiv.innerText =
    "Nenhum objeto encontrado";
}
        redesenhar();

    }catch(err){

        console.error(err);

        statusDiv.innerText =
        "Erro na detecção";
    }

    src.delete();
    gray.delete();
    blur.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
}
// =====================================
// ORDENAR PONTOS
// TL TR BR BL
// =====================================
function obter4Extremos(pontos){

    let topLeft = pontos[0];
    let topRight = pontos[0];
    let bottomLeft = pontos[0];
    let bottomRight = pontos[0];

    pontos.forEach(p=>{

        if(
            p.x + p.y <
            topLeft.x + topLeft.y
        ){
            topLeft = p;
        }

        if(
            p.x - p.y >
            topRight.x - topRight.y
        ){
            topRight = p;
        }

        if(
            p.y - p.x >
            bottomLeft.y - bottomLeft.x
        ){
            bottomLeft = p;
        }

        if(
            p.x + p.y >
            bottomRight.x + bottomRight.y
        ){
            bottomRight = p;
        }

    });

    return [
        topLeft,
        topRight,
        bottomRight,
        bottomLeft
    ];
}
function ordenarPontos(pts){

    const soma =
    pts.map(
        p => p.x + p.y
    );

    const diferenca =
    pts.map(
        p => p.x - p.y
    );

    const tl =
    pts[
        soma.indexOf(
            Math.min(...soma)
        )
    ];

    const br =
    pts[
        soma.indexOf(
            Math.max(...soma)
        )
    ];

    const tr =
    pts[
        diferenca.indexOf(
            Math.max(...diferenca)
        )
    ];

    const bl =
    pts[
        diferenca.indexOf(
            Math.min(...diferenca)
        )
    ];

    return [
        tl,
        tr,
        br,
        bl
    ];
}
// =====================================
// UTILITÁRIOS
// =====================================

function obterPosicaoCanvas(clientX, clientY){

    const rect =
    canvas.getBoundingClientRect();

    const escalaX =
    canvas.width /
    rect.width;

    const escalaY =
    canvas.height /
    rect.height;

    return {

        x:
        (clientX - rect.left)
        * escalaX,

        y:
        (clientY - rect.top)
        * escalaY
    };
}

function encontrarPonto(x,y){

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

        if(
            distancia < 30
        ){

            return i;
        }
    }

    return -1;
}

// =====================================
// MOUSE
// =====================================

canvas.addEventListener(
    "mousedown",
    (e)=>{

        if(
            pontos.length !== 4
        ) return;

        const pos =
        obterPosicaoCanvas(
            e.clientX,
            e.clientY
        );

        pontoSelecionado =
        encontrarPonto(
            pos.x,
            pos.y
        );
    }
);

canvas.addEventListener(
    "mousemove",
    (e)=>{

        if(
            pontoSelecionado === -1
        ) return;

        const pos =
        obterPosicaoCanvas(
            e.clientX,
            e.clientY
        );

        pontos[
            pontoSelecionado
        ] = {

            x: pos.x,
            y: pos.y
        };

        redesenhar();
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

// =====================================
// TOUCH
// =====================================

canvas.addEventListener(
    "touchstart",
    (e)=>{

        if(
            pontos.length !== 4
        ) return;

        e.preventDefault();

        const touch =
        e.touches[0];

        const pos =
        obterPosicaoCanvas(
            touch.clientX,
            touch.clientY
        );

        pontoSelecionado =
        encontrarPonto(
            pos.x,
            pos.y
        );

    },
    {
        passive:false
    }
);

canvas.addEventListener(
    "touchmove",
    (e)=>{

        if(
            pontoSelecionado === -1
        ) return;

        e.preventDefault();

        const touch =
        e.touches[0];

        const pos =
        obterPosicaoCanvas(
            touch.clientX,
            touch.clientY
        );

        pontos[
            pontoSelecionado
        ] = {

            x: pos.x,
            y: pos.y
        };

        redesenhar();

    },
    {
        passive:false
    }
);

canvas.addEventListener(
    "touchend",
    ()=>{

        pontoSelecionado = -1;
    }
);

// =====================================
// DESENHAR POLÍGONO MANUAL
// =====================================

function desenharPontos(){

    if(
        pontos.length !== 4
    ) return;

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

    ctx.strokeStyle =
    "#00ff00";

    ctx.lineWidth = 4;

    ctx.stroke();

    pontos.forEach(
        (p)=>{

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                12,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
            "#00ff00";

            ctx.fill();

            ctx.strokeStyle =
            "#ffffff";

            ctx.lineWidth = 2;

            ctx.stroke();
        }
    );
}

// =====================================
// BOTÃO AJUSTE MANUAL
// =====================================

btnManual.addEventListener(
    "click",
    ()=>{

        statusDiv.innerText =
        "Modo manual ativo. Arraste os pontos verdes.";

        redesenhar();
    }
);

// =====================================
// BOTÃO CONFIRMAR DETECÇÃO
// =====================================

btnAuto.addEventListener(
    "click", cortarDocumento
    ()=>{

        if(
            pontos.length !== 4
        ){

            alert(
                "Nenhum objeto detectado."
            );

            return;
        }

        console.log(
            "Pontos confirmados:"
        );

        console.table(
            pontos
        );

        statusDiv.innerText =
        "Corte confirmado.";
        
        alert(
            "Detecção confirmada!\n\nPróximo passo: aplicar o recorte."
        );
    }
);

// =====================================
// REDIMENSIONAMENTO
// =====================================

window.addEventListener(
    "resize",
    ()=>{

        if(
            imagemOriginal
        ){

            redesenhar();
        }
    }
);
function cortarDocumento(){

    if(
        pontos.length !== 4
    ){
        alert(
            "Ajuste os 4 pontos primeiro."
        );
        return;
    }

    let src =
    cv.imread(canvas);

    const tl = pontos[0];
    const tr = pontos[1];
    const br = pontos[2];
    const bl = pontos[3];

    const largura =
    Math.max(
        Math.hypot(tr.x-tl.x,tr.y-tl.y),
        Math.hypot(br.x-bl.x,br.y-bl.y)
    );

    const altura =
    Math.max(
        Math.hypot(bl.x-tl.x,bl.y-tl.y),
        Math.hypot(br.x-tr.x,br.y-tr.y)
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
    let gray =
new cv.Mat();

cv.cvtColor(
    dst,
    gray,
    cv.COLOR_RGBA2GRAY
);

cv.adaptiveThreshold(
    gray,
    gray,
    255,
    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY,
    11,
    2
);

cv.imshow(
    canvas,
    gray
);

gray.delete();

    canvas.width =
    largura;

    canvas.height =
    altura;

    cv.imshow(
        canvas,
        dst
    );

    src.delete();
    dst.delete();
    matrix.delete();
    srcTri.delete();
    dstTri.delete();

    statusDiv.innerText =
    "Documento cortado";
}
