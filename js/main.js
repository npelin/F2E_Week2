var page3Files = [];
var page3Imgs = [];
var page = 1;
var isPainting = false;
const BASE64_MARKER = ';base64,';
const Base64Prefix = "data:application/pdf;base64,";
const MaxStorageSize = 5000000;
const imageType = /\*.pdf/;
const SignInCanvasDom = document.querySelector(".SignInZoneCanvas");
const clearBtn = document.querySelector(".SignInClear");
const ctx = SignInCanvasDom.getContext('2d');
const canvas = new fabric.Canvas("canvas");
ctx.lineWidth = 4;
ctx.lineCap = "round";

var img = document.createElement('img');
img.src = "./img/delFabirc.png";

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://mozilla.github.io/pdf.js/build/pdf.worker.js";

function Page1Fun() {
    if (page == 1) return;
    page = 1;
    $.each(".pages,.footbar,.footbar2".split(","), function (i, v) {
        $(v).hide();
    });
    $(".page1").show();
    $(".signNew").show();
}
function SwitchToPage2() {
    if (page == 2) return;
    page = 2;
    $.each(".pages,.signNew,.footbar2".split(","), function (i, v) {
        $(v).hide();
    });
    $(".page2").show();
    $(".footbar").show();
    $(".toPage3").addClass("disabled");
}
function SwitchToPage3() {
    if (page == 3) return;
    if ($(".toPage3").hasClass("disabled")) return;
    page = 3;
    Page3Config();
    $.each(".pages,.signNew,.footbar".split(","), function (i, v) {
        $(v).hide();
    });
    $(".page3").show();
    $(".footbar2").show();
}
function convertDataURIToBinary(dataURI) {
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = dataURI.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));
    for (var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
}
function Page3Config() {
    let id = $(".line.active").data('id');
    let currentFile = page3Files[id];
    
    $(".page3FileName").html(currentFile.fileName);
    ShowPage3PDF(currentFile.imgResult);

    currentFile.lastOpenTime = getNow();
    localStorage.setItem('week2_files', JSON.stringify(page3Files));
    ShowFileList();
}
function NewDiv(msg) {
    let newItem = document.createElement('div');
    newItem.innerHTML = msg;
    return newItem;
}
function ShowFileList() {
    $(".list > .line").remove();
    var line = NewDiv('');
    line.className = "line lineHeader";
    line.append(NewDiv("名稱"));
    line.append(NewDiv("上傳時間"));
    line.append(NewDiv("上次開啟"));
    line.append(NewDiv("刪除"));
    $(".list").append(line);
    $.each(page3Files, function (index, item) {
        var line = NewDiv('');
        line.className = "line";
        line.dataset.id = index;
        line.append(NewDiv(item.fileName));
        line.append(NewDiv(item.uploadTime));
        line.append(NewDiv(item.lastOpenTime));
        let delDiv = NewDiv('');
        delDiv.className = "lineDelFile";
        let delImg = document.createElement('img');
        delImg.src = "./img/Vector.png";
        delDiv.append(delImg);
        line.append(delDiv);
        $(".list").append(line);
    });
}
function ShowImgList() {
    $(".page3SignImgs > .line").remove();
    var line = NewDiv('');
    $.each(page3Imgs, function (index, item) {
        var line = NewDiv('');
        line.className = "line";
        line.dataset.id = index;

        var newImg = document.createElement('img');
        newImg.src = item;
        newImg.className = "signImg";
        line.append(newImg);

        var delImg = document.createElement('img');
        delImg.src = "./img/Vector.png";
        delImg.className = "signImgDelete";
        line.append(delImg);
        $(".page3SignImgs").append(line);
    });
}


function getPainPosition(e) {
    const canvasSize = SignInCanvasDom.getBoundingClientRect();
    if (e.type === "mousemove") {
        return {
            x: (e.clientX - canvasSize.left) * 0.6,
            y: (e.clientY - canvasSize.top) * 0.6,
        };
    } else {
        return {
            x: (e.touches[0].clientX - canvasSize.left) * 0.6,
            y: (e.touches[0].clientY - canvasSize.top) * 0.6,
        };
    }
}
function startPosition(e) {
    e.preventDefault();
    isPainting = true;
    $(".SignInOk").removeClass("disabled");
}
function finishedPosition() {
    isPainting = false;
    ctx.beginPath();
}
function draw(e) {
    if (!isPainting) return;
    const painPosition = getPainPosition(e);
    ctx.lineTo(painPosition.x, painPosition.y);
    ctx.stroke();
}
function reset() {
    $(".SignInOk").addClass("disabled");
    ctx.clearRect(0, 0, SignInCanvasDom.width, SignInCanvasDom.height);
}

// 使用原生 FileReader 轉檔
function readBlob(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => resolve(reader.result));
        reader.addEventListener("error", reject);
        reader.readAsDataURL(blob);
    });
}

async function printPDF(pdfData) {

    // 將檔案處理成 base64
    // pdfData = await readBlob(pdfData);

    // 將 base64 中的前綴刪去，並進行解碼
    const data = atob(pdfData.substring(Base64Prefix.length));

    // 利用解碼的檔案，載入 PDF 檔及第一頁
    const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
    const pdfPage = await pdfDoc.getPage(1);

    // 設定尺寸及產生 canvas
    const viewport = pdfPage.getViewport({ scale: window.devicePixelRatio });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    // 設定 PDF 所要顯示的寬高及渲染
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const renderContext = {
        canvasContext: context,
        viewport,
    };
    const renderTask = pdfPage.render(renderContext);

    // 回傳做好的 PDF canvas
    return renderTask.promise.then(() => canvas);
}

async function pdfToImage(pdfData) {
    // 設定 PDF 轉為圖片時的比例
    const scale = 1.5 / window.devicePixelRatio;

    // 回傳圖片
    return new fabric.Image(pdfData, {
        id: "renderPDF",
        scaleX: scale,
        scaleY: scale,
    });
}



async function ShowPage3PDF(result) {
    canvas.requestRenderAll();
    const pdfData = await printPDF(result);
    const pdfImage = await pdfToImage(pdfData);

    // 透過比例設定 canvas 尺寸
    canvas.setWidth(pdfImage.width * 1.5 / window.devicePixelRatio);
    canvas.setHeight(pdfImage.height * 1.5 / window.devicePixelRatio);

    // 將 PDF 畫面設定為背景
    canvas.setBackgroundImage(pdfImage, canvas.renderAll.bind(canvas));

    // PDFJS.getDocument(convertDataURIToBinary(result)).promise.then(function (pdf) {
    //     for (var pageNum = 1; pageNum <= pdf.numPages; ++pageNum) {
    //         pdf.getPage(pageNum).then(function (page) {
    //             var scale = 1.5;
    //             var viewport = page.getViewport({ scale: scale });
    //             // Prepare canvas using PDF page dimensions
    //             var canvas = document.createElement('canvas');
    //             var context = canvas.getContext('2d');
    //             canvas.height = viewport.height;
    //             canvas.width = viewport.width;
    //             // Render PDF page into canvas context
    //             var renderContext = {
    //                 canvasContext: context,
    //                 viewport: viewport
    //             };
    //             var renderTask = page.render(renderContext);
    //             renderTask.promise.then(function () {
    //                 //console.log('Page rendered');
    //             });
    //             $(".showPdf").append(canvas);
    //         });
    //     }
    // });
}


function delSignFabric() {
    canvas.requestRenderAll();
}


fabric.Object.prototype.controls.deleteControl = new fabric.Control({
    x: -0.5,
    y: -0.7,
    offsetY: 16,
    cursorStyle: 'pointer',
    mouseUpHandler: deleteObject,
    render: renderIcon,
    cornerSize: 24
});
function deleteObject(eventData, transform) {
    var target = transform.target;
    var canvas = target.canvas;
    canvas.remove(target);
    canvas.requestRenderAll();
}

function renderIcon(ctx, left, top, styleOverride, fabricObject) {
    var size = this.cornerSize;
    ctx.save();
    ctx.translate(left, top);
    ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
}

function clearShowPDF() {
    ctx.clearRect(0, 0, SignInCanvasDom.width, SignInCanvasDom.height);
    canvas.clear();
    canvas.renderAll();
}
function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();
    const fileUploader = document.getElementById("fileUploader");
    fileUploader.click();
}
function dragenter(e) {
    e.stopPropagation(); //終止事件傳導
    e.preventDefault(); //終止預設行為
}
function dragover(e) {
    e.stopPropagation(); //終止事件傳導
    e.preventDefault(); //終止預設行為
}
function drop(e) {
    e.stopPropagation(); //終止事件傳導
    e.preventDefault(); //終止預設行為
    const dt = e.dataTransfer;
    const files = dt.files; // 取得被拖曳的圖片
    handleFiles(files);
}
function fileVaild(file) {
    if (file.size > MaxStorageSize) return false;
    return true;
}
function getNow() {
    let d = new Date();
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}, ${d.getHours()}:${d.getMinutes()}`;
}

function SwitchPage2Tab(obj) {
    $(".page2Tab div").removeClass("active");
    $(obj).addClass("active");

    $(".page2Content .tab1, .page2Content .tab2").hide();
    $($(obj).data('tab-target')).show();

    $(".page2 .list .line").removeClass("active");
    $(".openFile").addClass("disabled");

    ShowFileList();
}


//----------------------------------PDF----------------------------------------





//------------addEventListener-------------
const dropbox = document.getElementById("page2UploadBlock");
dropbox.addEventListener("dragenter", dragenter, false);
dropbox.addEventListener("dragover", dragover, false);
dropbox.addEventListener("drop", drop, false);
dropbox.addEventListener("click", handleFileSelect, false);


SignInCanvasDom.addEventListener("mousedown", startPosition);
SignInCanvasDom.addEventListener("mouseup", finishedPosition);
SignInCanvasDom.addEventListener("mouseleave", finishedPosition);
SignInCanvasDom.addEventListener("mousemove", draw);
SignInCanvasDom.addEventListener("touchstart", startPosition);
SignInCanvasDom.addEventListener("touchend", finishedPosition);
SignInCanvasDom.addEventListener("touchcancel", finishedPosition);
SignInCanvasDom.addEventListener("touchmove", draw);




$(document).on('click', '.toPage1', function () {
    clearShowPDF();
    Page1Fun();
});
$(document).on('click', '.toPage2', function () {
    clearShowPDF();
    SwitchToPage2();
});
$(document).on('click', '.toPage3', function () {
    clearShowPDF();
    SwitchToPage3();
});
$(document).on('click', '.page2Tab div', function () {
    let self = this;
    SwitchPage2Tab(self);
});
$(document).on('click', '.page2 .list .line', function () {
    $(".page2 .list .line").removeClass("active");
    $(".openFile").removeClass("disabled");
    $(this).addClass("active");
});
$(document).on('click', '.page2 .list .line .lineDelFile', function () {
    if (confirm("確定是否刪除?")) {
        let parent = $(this).parent();
        let id = parent.data('id');
        page3Files.slice(id, 1);
        parent.remove();
        ShowImgList();
    }
});
$(document).on('click', '.cancelOpen', function () {
    $(".page2 .list .line").removeClass("active");
    $(".openFile").addClass("disabled");
});
$(document).on('click', '.SignInCancer', function () {
    $(".dialog").hide();
});
$(document).on('click', ".SignIncleard", function () {
    reset();
});
$(document).on('click', '.page3Sign', function () {
    reset();
    $(".SignInOk").addClass("disabled");
    $(".dialog").show();
});
$(document).on('click', '.SignInOk', function () {
    let imgFile = SignInCanvasDom.toDataURL("image/png");
    page3Imgs.push(imgFile);
    localStorage.setItem('imgs', JSON.stringify(page3Imgs));
    $(".dialog").hide();
    ShowImgList();
});
$(document).on('click', '.signImgDelete', function () {
    let index = $(this).parent().data('id');
    page3Imgs.splice(index, 1);
    localStorage.setItem('imgs', JSON.stringify(page3Imgs));
    ShowImgList();
});






$(document).on('click', '.signImg', function () {
    let src = $(this).attr('src');
    fabric.Image.fromURL(src, function (image) {

        // 設定簽名出現的位置及大小，後續可調整
        image.top = 0;
        image.scaleX = 0.5;
        image.scaleY = 0.5;
        image.backgroundColor = '#BDE8F9';
        image.opacity = 0.75;
        canvas.add(image);
    });
});
$(document).on('click', '.cancelSign', function () {
    clearShowPDF();
    SwitchToPage2();
})

$(document).on('click', '.downloadPDF', function () {
    $.each(canvas.getObjects(), function (index, item) {
        item.backgroundColor = "transparent";
        item.opacity = 1;
    });

    const pdf = new jsPDF({
        orientation: 'l', // landscape
        unit: 'pt', // points, pixels won't work properly
        format: [canvas.width / 1.5, canvas.height / 1.5] // set needed dimensions for any element
    });
    const image = canvas.toDataURL("image/png");

    pdf.addImage(image, "png", 0, 0, canvas.width / 1.5, canvas.height / 1.5);

    // 將檔案取名並下載
    pdf.save("download.pdf");



    $.each(canvas.getObjects(), function (index, item) {
        item.backgroundColor = "#BDE8F9";
        item.opacity = 0.75;
    })
        .then(() => {
            canvas.requestRenderAll();
        });
});

$(document).on('click', '.btnDelSignFabric', function () {
    delSignFabric();
});