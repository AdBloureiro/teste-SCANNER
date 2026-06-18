let imagemBase64 = null;
let resultadoFinal = null;

// espera OpenCV carregar
function esperarOpenCV() {
    return new Promise((resolve) => {
        if (cv && cv.Mat) resolve();
        else cv['onRuntimeInitialized'] = () => resolve();
    });
}

// upload
document.getElementById("fileInput").addEventListener("change", function(e){

    let file = e.target.files[0];

    let reader = new FileReader();

    reader.onload = function(event){

        imagemBase64 = event.target.result;

        document.getElementById("previewOriginal").src = imagemBase64;
    };

    reader.readAsDataURL(file);
});

async function processarImagem(){

    if(!imagemBase64){
        alert("Selecione uma imagem");
        return;
    }

    await esperarOpenCV();

    let img = new Image();
    img.src = imagemBase64;

    img.onload = () => {

        let src = cv.imread(img);
        let gray = new cv.Mat();
        let blur = new cv.Mat();
        let edges = new cv.Mat();

        // grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        // blur
        cv.GaussianBlur(gray, blur, new cv.Size(5,5), 0);

        // edges
        cv.Canny(blur, edges, 75, 200);

        // contornos
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();

        cv.findContours(
            edges,
            contours,
            hierarchy,
            cv.RETR_EXTERNAL,
            cv.CHAIN_APPROX_SIMPLE
        );

        let maxArea = 0;
        let maxContour = null;

        for(let i=0;i<contours.size();i++){

            let cnt = contours.get(i);
            let area = cv.contourArea(cnt);

            if(area > maxArea){
                maxArea = area;
                maxContour = cnt;
            }
        }

        if(!maxContour){
            alert("Documento não detectado");
            return;
        }

        let approx = new cv.Mat();
        cv.approxPolyDP(
            maxContour,
            approx,
            0.02 * cv.arcLength(maxContour, true),
            true
        );

        if(approx.rows !== 4){
            alert("Não detectou 4 cantos (teste imagem melhor)");
            return;
        }

        let pts = [];
        for(let i=0;i<4;i++){
            pts.push({
                x: approx.data32S[i*2],
                y: approx.data32S[i*2+1]
            });
        }

        pts.sort((a,b)=>a.y-b.y);

        let top = pts.slice(0,2).sort((a,b)=>a.x-b.x);
        let bottom = pts.slice(2,4).sort((a,b)=>a.x-b.x);

        let tl = top[0], tr = top[1];
        let bl = bottom[0], br = bottom[1];

        let width = 800;
        let height = 1000;

        let srcTri = cv.matFromArray(4,1,cv.CV_32FC2,[
            tl.x, tl.y,
            tr.x, tr.y,
            br.x, br.y,
            bl.x, bl.y
        ]);

        let dstTri = cv.matFromArray(4,1,cv.CV_32FC2,[
            0,0,
            width,0,
            width,height,
            0,height
        ]);

        let M = cv.getPerspectiveTransform(srcTri, dstTri);

        let dst = new cv.Mat();

        cv.warpPerspective(
            src,
            dst,
            M,
            new cv.Size(width, height)
        );

        let canvas = document.createElement("canvas");
        cv.imshow(canvas, dst);

        resultadoFinal = canvas.toDataURL("image/jpeg", 0.95);

        document.getElementById("previewResultado").src = resultadoFinal;

        // cleanup
        src.delete();
        gray.delete();
        blur.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();
        dst.delete();
    };
}

function baixar(){

    if(!resultadoFinal){
        alert("Nada para baixar");
        return;
    }

    let a = document.createElement("a");
    a.href = resultadoFinal;
    a.download = "scan.jpg";
    a.click();
}
